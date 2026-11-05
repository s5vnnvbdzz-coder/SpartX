/* SpartanX Intelligence v0.1 — deterministic, explainable training analysis.
   All calculations run locally. No network requests, AI API, or write access to SpartanX. */
(function (global) {
  'use strict';
  const MOVES = {
    'Bench Press': { muscle:'Chest', step:2.5, group:'upper' },
    'Squat': { muscle:'Quads', step:5, group:'lower' },
    'Deadlift': { muscle:'Posterior chain', step:5, group:'lower' },
    'Overhead Press': { muscle:'Shoulders', step:2.5, group:'upper' },
    'Barbell Row': { muscle:'Back', step:2.5, group:'upper' },
    'Pull Up': { muscle:'Back', step:0, group:'upper' },
    'Lat Pulldown': { muscle:'Back', step:2.5, group:'upper' },
    'Leg Press': { muscle:'Quads', step:5, group:'lower' },
    'Romanian Deadlift': { muscle:'Hamstrings', step:5, group:'lower' },
    'Dumbbell Curl': { muscle:'Biceps', step:2, group:'upper' },
    'Triceps Pushdown': { muscle:'Triceps', step:2.5, group:'upper' },
    'Lateral Raise': { muscle:'Shoulders', step:1, group:'upper' },
  };
  const CORE = ['Squat','Bench Press','Deadlift','Overhead Press'];
  const ALIASES = {
    'barbell bench press':'Bench Press','flat bench press':'Bench Press',
    'barbell back squat':'Squat','back squat':'Squat',
    'conventional deadlift':'Deadlift','barbell deadlift':'Deadlift',
    'ohp':'Overhead Press','shoulder press':'Overhead Press',
    'barbell overhead press':'Overhead Press','bent over row':'Barbell Row',
    'barbell bent over row':'Barbell Row','pull ups':'Pull Up','pull-up':'Pull Up',
    'lat pull down':'Lat Pulldown','rdl':'Romanian Deadlift'
  };
  const finite = value => Number.isFinite(Number(value));
  const safeNumber = (v, fallback=0) => finite(v) ? Number(v) : fallback;
  const clamp = (n,lo,hi) => Math.min(hi,Math.max(lo,n));
  const canonical = value => {
    const name=String(value||'').trim();
    const lc=name.toLowerCase();
    return ALIASES[lc] || Object.keys(MOVES).find(x=>x.toLowerCase()===lc) || name;
  };
  const dayStamp = value => {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : NaN;
  };
  const timeDay = 86400000;
  const ago = (days, now=Date.now()) => new Date(now-days*timeDay).toISOString();
  const isWorking = set => {
    const t=String(set.type||'working').toLowerCase();
    return !/(warm|drop|failure|excluded)/.test(t) && !['w','b','x'].includes(t);
  };
  function normalizeSessions(items){
    if(!Array.isArray(items)) return [];
    return items.slice(0,5000).flatMap((s,idx)=>{
      const time=dayStamp(s.date || s.completedAt || s.timestamp);
      if(!Number.isFinite(time) || time>Date.now()+timeDay) return [];
      const exercises=Array.isArray(s.exercises)?s.exercises.slice(0,60).map(ex=>{
        const name=canonical(ex.name||ex.exerciseName);
        if(!name)return null;
        const sets=(Array.isArray(ex.sets)?ex.sets:[]).slice(0,30).flatMap(set=>{
          if(set.done===false)return [];
          const weight=safeNumber(set.weight,NaN),reps=safeNumber(set.reps,NaN);
          if(!Number.isFinite(weight)||weight<0||weight>1500||!Number.isFinite(reps)||reps<1||reps>100)return [];
          const rpe=set.rpe==null||set.rpe===''?null:safeNumber(set.rpe,NaN);
          return [{weight,reps,rpe:Number.isFinite(rpe)&&rpe>=6&&rpe<=10?rpe:null,type:String(set.type||'Working Set')}];
        });
        return sets.length?{name,sets}:null;
      }).filter(Boolean):[];
      return exercises.length?[{id:String(s.id??'import-'+idx),name:String(s.name||'Workout').slice(0,100),date:new Date(time).toISOString(),duration:clamp(safeNumber(s.duration,0),0,86400),exercises}]:[];
    }).sort((a,b)=>dayStamp(a.date)-dayStamp(b.date));
  }
  // Epley estimate: useful trend approximation, not a tested maximum.
  // Limit to work sets of 1–12 reps to reduce misleading extrapolation.
  function estimatedMax(set){
    if(!set || set.weight<=0 || set.reps<1 || set.reps>12)return null;
    return +(set.weight*(1+set.reps/30)).toFixed(1);
  }
  function topSet(ex){
    const sets=ex.sets.filter(isWorking).filter(s=>estimatedMax(s)!=null);
    return sets.length?sets.reduce((best,s)=>estimatedMax(s)>estimatedMax(best)?s:best):null;
  }
  function makeDemoProfile(type='strength'){
    const configs={
      strength:{name:'Alex Morgan',label:'Strength Athlete',goal:{'Squat':200,'Bench Press':160,'Deadlift':230,'Overhead Press':100},base:{'Squat':124,'Bench Press':105,'Deadlift':150,'Overhead Press':67,'Barbell Row':74,'Romanian Deadlift':91,'Lat Pulldown':61},progress:1.45},
      hypertrophy:{name:'Taylor Brooks',label:'Hypertrophy Athlete',goal:{'Squat':145,'Bench Press':110,'Deadlift':180,'Overhead Press':75},base:{'Squat':88,'Bench Press':65,'Deadlift':112,'Overhead Press':42,'Barbell Row':53,'Romanian Deadlift':68,'Lat Pulldown':50},progress:0.8},
      beginner:{name:'Sam Ellis',label:'Foundation Athlete',goal:{'Squat':120,'Bench Press':90,'Deadlift':150,'Overhead Press':60},base:{'Squat':58,'Bench Press':43,'Deadlift':75,'Overhead Press':28,'Barbell Row':36,'Romanian Deadlift':46,'Lat Pulldown':36},progress:1.65}
    };
    const cfg=configs[type]||configs.strength, sessions=[];
    const weeks=14;
    const today=new Date();today.setHours(12,0,0,0);
    const dayOffsets=[0,2,4,6];
    const templates=[
      ['Bench Press','Barbell Row','Triceps Pushdown'],
      ['Squat','Romanian Deadlift','Leg Press'],
      ['Overhead Press','Lat Pulldown','Lateral Raise'],
      ['Deadlift','Bench Press','Dumbbell Curl']
    ];
    for(let w=0;w<weeks;w++){
      for(let d=0;d<4;d++){
        if((w===4&&d===3)||(w===11&&d===1))continue;
        const daysBack=(weeks-1-w)*7+(6-dayOffsets[d]);
        const date=ago(daysBack,today.getTime());
        const exercises=templates[d].map((name,j)=>{
          const base=cfg.base[name]||Math.max(12,(cfg.base['Bench Press']||65)*.43);
          const jitter=Math.sin(w*1.35+d*2.7+j)*1.7;
          const weight=Math.max(2.5,Math.round((base+w*cfg.progress*(j===0?1:0.45)+jitter)/2.5)*2.5);
          const reps=j===0?(d===3?5:6):10;
          const sets=Array.from({length:j===0?3:2},(_,k)=>({
            weight:k===2?Math.max(0,weight-2.5):weight,
            reps:Math.max(1,reps+(j===0&&k===2?-1:0)),
            rpe:clamp(Math.round((7.1+w*.055+k*.28+Math.sin(w+d+j)*.38)*2)/2,6,10),
            type:'Working Set'
          }));
          return {name,sets};
        });
        sessions.push({id:type+'-'+w+'-'+d,name:['Upper Strength','Lower Strength','Upper Volume','Pull Strength'][d],date,duration:3600+d*410,exercises});
      }
    }
    return {name:cfg.name,label:cfg.label,goals:cfg.goal,sessions:normalizeSessions(sessions),isDemo:true};
  }
  function analyse(sessions,days=90,now=Date.now()){
    const valid=normalizeSessions(sessions).filter(s=>dayStamp(s.date)<=now);
    const from=days===0?-Infinity:now-days*timeDay;
    const scoped=valid.filter(s=>dayStamp(s.date)>=from);
    const last30=valid.filter(s=>dayStamp(s.date)>=now-30*timeDay);
    const last7=valid.filter(s=>dayStamp(s.date)>=now-7*timeDay);
    const volumeOf=list=>list.reduce((sum,s)=>sum+s.exercises.reduce((v,ex)=>v+ex.sets.filter(isWorking).reduce((n,x)=>n+x.weight*x.reps,0),0),0);
    const moves={};
    for(const s of valid)for(const ex of s.exercises){
      const set=topSet(ex);
      if(!set)continue;
      (moves[ex.name] ||= []).push({date:s.date,set,max:estimatedMax(set),id:s.id});
    }
    const strength={};
    for(const name of CORE){
      const records=(moves[name]||[]).filter(x=>dayStamp(x.date)>=from);
      const latest=records.at(-1)||null,first=records[0]||null;
      const best=records.length?Math.max(...records.map(r=>r.max)):null;
      const delta=(first&&latest&&first!==latest)?+(100*(latest.max-first.max)/first.max).toFixed(1):null;
      strength[name]={records,latest,best,delta};
    }
    const muscles={};
    for(const session of last7)for(const ex of session.exercises){
      const muscle=MOVES[ex.name]?.muscle||'Other';
      const count=ex.sets.filter(isWorking).length;
      const prior=muscles[muscle]||{name:muscle,sets:0,last:0};
      prior.sets+=count;prior.last=Math.max(prior.last,dayStamp(session.date));muscles[muscle]=prior;
    }
    // "Last trained" uses the complete history, not only the last seven days.
    const allMuscles={};
    for(const session of valid)for(const ex of session.exercises){
      const muscle=MOVES[ex.name]?.muscle||'Other';
      allMuscles[muscle]=Math.max(allMuscles[muscle]||0,dayStamp(session.date));
    }
    const muscleRows=Object.keys(allMuscles).map(name=>({
      name,sets:muscles[name]?.sets||0,daysSince:Math.max(0,Math.floor((now-allMuscles[name])/timeDay))
    })).sort((a,b)=>b.sets-a.sets||a.name.localeCompare(b.name));
    const recent14=valid.filter(s=>dayStamp(s.date)>=now-14*timeDay);
    const weeks=Math.min(12,Math.max(1,Math.ceil((now-(valid.length?dayStamp(valid[0].date):now))/ (7*timeDay))));
    const weekly=Array.from({length:Math.min(weeks,8)},(_,i)=>{
      const start=now-(7*(7-i))*timeDay,end=now-(7*(6-i))*timeDay;
      const count=valid.filter(s=>dayStamp(s.date)>=start&&dayStamp(s.date)<end).length;
      return {week:i+1,count};
    });
    return {
      sourceCount:valid.length, scoped, last30, last7, moves, strength, muscleRows, weekly,
      sessions30:last30.length,sessionsRange:scoped.length,volume30:volumeOf(last30),
      volumeRange:volumeOf(scoped),last14Sessions:recent14.length,
      activeDays30:new Set(last30.map(s=>s.date.slice(0,10))).size
    };
  }
  function recommendation(name, records){
    if(!records||records.length<2)return {kind:'neutral',title:'More data needed',detail:'Log at least two comparable work sessions to establish a trend.',next:null,confidence:'Low'};
    const latest=records.at(-1),previous=records.at(-2),rpe=latest.set.rpe;
    const step=MOVES[name]?.step||2.5;
    const trend=100*(latest.max-previous.max)/Math.max(previous.max,1);
    if(rpe==null)return {kind:'neutral',title:'Hold and collect RPE',detail:'Recent session has no RPE entry. Keep the current load and record perceived effort before increasing.',next:latest.set.weight,confidence:'Low'};
    if(rpe>=9.5 && trend<-3)return {kind:'caution',title:'Consider a lighter session',detail:'Your last top set was very demanding and estimated performance declined. Consider reducing the load or taking extra recovery.',next:Math.max(0,latest.set.weight-step),confidence:'Low'};
    if(rpe>=9)return {kind:'caution',title:'Maintain the load',detail:'Your recent top set was near maximal effort (RPE '+rpe+'). Prioritise clean repetitions and recovery.',next:latest.set.weight,confidence:'Moderate'};
    if(rpe<=7.5 && latest.set.reps>=5 && trend>=-2 && step>0)return {kind:'positive',title:'Small increase may be appropriate',detail:'Your recent top set was controlled (RPE '+rpe+') and the estimated strength trend is stable or improving.',next:latest.set.weight+step,confidence:'Moderate'};
    return {kind:'neutral',title:'Repeat before progressing',detail:'Your recent performance suggests keeping the working load steady while monitoring repetitions, RPE and technique.',next:latest.set.weight,confidence:'Moderate'};
  }
  function insights(a){
    const rows=[];
    const active=CORE.filter(n=>a.strength[n].records.length>1).sort((x,y)=>(a.strength[y].delta||0)-(a.strength[x].delta||0));
    if(active.length){
      const name=active[0],change=a.strength[name].delta;
      if(change>0)rows.push({kind:'positive',title:name+' trending up',text:'Estimated top-set strength is up '+change+'% in the selected range. This is an estimate, not a verified one-rep maximum.'});
      else if(change<0)rows.push({kind:'caution',title:name+' showing a decline',text:'Estimated top-set strength is down '+Math.abs(change)+'% in this range. Review sleep, training load and exercise consistency.'});
    }
    const demanding=a.scoped.flatMap(s=>s.exercises.flatMap(ex=>ex.sets)).filter(s=>isWorking(s)&&s.rpe!=null&&s.rpe>=9).length;
    if(demanding>=6)rows.push({kind:'caution',title:'Several high-effort sets',text:demanding+' work sets were logged at RPE 9 or above in this period. Check that hard training is balanced with recovery.'});
    rows.push({kind:'neutral',title:'Consistency matters',text:a.sessions30+' completed sessions across '+a.activeDays30+' training days in the last 30 days. Consistent records make trends more useful.'});
    if(a.muscleRows.length)rows.push({kind:'neutral',title:'Muscle exposure overview',text:'Your recent set counts show training exposure, not verified muscle recovery or a recommended individual training dose.'});
    return rows.slice(0,4);
  }
  global.SXEngine=Object.freeze({CORE,MOVES,normalizeSessions,estimatedMax,makeDemoProfile,analyse,recommendation,insights,canonical});
})(window);