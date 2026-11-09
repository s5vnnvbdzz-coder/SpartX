/* SpartanX Intelligence goal models (bodybuilding + weight management).
   Read-only access to spartx_db. Optional bodyweight entries and targets are
   written exclusively to sx_intelligence_* keys in this browser. */
(function (global) {
  'use strict';
  const DAY=86400000, WEEK=DAY*7;
  const DATA_KEY='spartx_db', WEIGHT_KEY='sx_intelligence_weight_logs_v1';
  const GOAL_KEY='sx_intelligence_goal_settings_v1';
  const MUSCLES=['Chest','Back','Quads','Hamstrings','Shoulders','Biceps','Triceps','Glutes','Calves','Core'];
  const lower=s=>String(s||'').trim().toLowerCase();
  const num=x=>Number.isFinite(Number(x))?Number(x):NaN;
  const round=(n,d=1)=>Math.round(n*Math.pow(10,d))/Math.pow(10,d);
  function dateValue(d){const t=new Date(d).getTime();return Number.isFinite(t)?t:NaN}
  function startWeek(t){const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d.getTime()}
  function dateKey(t){const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function weekLabel(t){return new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
  function isCardio(name){return /^(stairmaster|treadmill|rowing machine|bike$|recumbent bike|cross trainer|skierg|ski-erg|elliptical)/i.test(String(name||'').trim())}
  function primaryMuscle(name){
    const s=lower(name);
    if(/(?:calf|soleus|gastrocnemius)/.test(s))return 'Calves';
    if(/(?:tricep|pushdown|skullcrusher|close grip bench)/.test(s))return 'Triceps';
    if(/(?:bicep|curl|hammer curl)/.test(s))return 'Biceps';
    if(/(?:lateral raise|rear delt|face pull|shoulder press|overhead press|military press)/.test(s))return 'Shoulders';
    if(/(?:bench press|chest press|pec deck|chest fly|chest crossover|push up|incline press|dumbbell fly)/.test(s))return 'Chest';
    if(/(?:lat pulldown|lat pull|pullover|pull up|pull-up|chin up|row|rear pulldown)/.test(s))return 'Back';
    if(/(?:leg curl|romanian deadlift|stiff leg|nordic curl|rdl)/.test(s))return 'Hamstrings';
    if(/(?:hip thrust|glute bridge|kickback|abduction)/.test(s))return 'Glutes';
    if(/(?:squat|leg press|hack squat|lunge|leg extension|step up|split squat)/.test(s))return 'Quads';
    if(/(?:plank|crunch|sit up|leg raise|cable abs|ab wheel|pallof)/.test(s))return 'Core';
    // Conventional deadlift is intentionally not assigned to one hypertrophy muscle.
    return null;
  }
  function working(set){
    const t=lower(set.type||'working');
    return set.done!==false && !/(warm|cardio|excluded)/.test(t) && !['w','x'].includes(t);
  }
  function readRaw(storage){
    try{const s=storage||global.localStorage;const text=s.getItem(DATA_KEY);if(!text)return [];
      if(text.length>12*1024*1024)return [];
      const parsed=JSON.parse(text);return Array.isArray(parsed.sessions)?parsed.sessions.slice(0,5000):[];
    }catch(_){return []}
  }
  function resistanceSessions(raw){
    const engine=global.SXEngine;
    return engine && typeof engine.normalizeSessions==='function'?engine.normalizeSessions(raw):[];
  }
  function weeklySeries(weeks=12,now=Date.now()){
    const end=startWeek(now);return Array.from({length:weeks},(_,i)=>end-(weeks-1-i)*WEEK);
  }
  function bodybuilding(raw,opts){
    opts=opts||{};const muscle=MUSCLES.includes(opts.muscle)?opts.muscle:'Chest';
    const target=Number.isFinite(num(opts.setTarget))&&num(opts.setTarget)>0?Math.min(50,num(opts.setTarget)):12;
    const dates=weeklySeries(12,opts.now||Date.now()),samples=resistanceSessions(raw);
    const totals=new Map(), exercises=new Map();let unmapped=0;
    for(const session of samples){
      const week=startWeek(dateValue(session.date));
      if(!dates.includes(week))continue;
      for(const ex of session.exercises||[]){
        const group=primaryMuscle(ex.name);
        const eligible=ex.sets.filter(working);
        if(group){if(!totals.has(week))totals.set(week,{});
          totals.get(week)[group]=(totals.get(week)[group]||0)+eligible.length;
        }else{unmapped+=eligible.length}
        if(!exercises.has(ex.name))exercises.set(ex.name,[]);
        const byLoad=new Map();
        for(const set of eligible){
          if(!(set.weight>0&&set.reps>0))continue;
          const k=String(set.weight);
          byLoad.set(k,Math.max(byLoad.get(k)||0,set.reps));
        }
        for(const [weight,reps] of byLoad)exercises.get(ex.name).push({week,weight:Number(weight),reps});
      }
    }
    const counts=dates.map(t=>({time:t,label:weekLabel(t),value:totals.get(t)?.[muscle]||0,target}));
    const muscleTotals=MUSCLES.map(name=>({name,sets:totals.get(dates[dates.length-1])?.[name]||0}));
    const names=[...exercises.keys()].sort((a,b)=>a.localeCompare(b));
    const requested=names.includes(opts.exercise)?opts.exercise:names[0]||'';
    const entries=exercises.get(requested)||[];
    const weightCounts=new Map();for(const p of entries)weightCounts.set(p.weight,(weightCounts.get(p.weight)||0)+1);
    const referenceLoad=entries.length?([...weightCounts].sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0]||[])[0]:null;
    const bestByWeek=new Map();for(const p of entries){
      if(p.weight!==referenceLoad)continue;bestByWeek.set(p.week,Math.max(bestByWeek.get(p.week)||0,p.reps));
    }
    const progress=dates.map(t=>({time:t,label:weekLabel(t),value:bestByWeek.has(t)?bestByWeek.get(t):null}));
    const comparable=progress.filter(p=>p.value!=null);
    let insight;
    if(samples.length===0)insight='No completed resistance workouts found. Complete and save workouts in SpartanX to build your trends.';
    else if(comparable.length>=3){
      const diff=comparable[comparable.length-1].value-comparable[0].value;
      insight=diff>0?'At '+referenceLoad+' kg, your best reps on '+requested+' increased by '+diff+'. This indicates exercise progression, not measured muscle growth.':
        diff<0?'At '+referenceLoad+' kg, best reps on '+requested+' have declined. Review effort, fatigue, technique and training consistency.':
        'Your best reps at '+referenceLoad+' kg on '+requested+' have been steady. Maintain comparable logging before changing the programme.';
    }else insight='More sets at the same weight are needed for an exercise progression trend. Weekly set counts are still available.';
    return {mode:'bodybuilding',weeks:counts,muscle,targets:target,muscleTotals,names,exercise:requested,referenceLoad,exerciseProgress:progress,unmapped,sessionCount:samples.length,insight};
  }
  function validWeightEntries(entries){
    if(!Array.isArray(entries))return [];
    const byDate=new Map(),future=Date.now()+DAY;
    for(const e of entries.slice(0,5000)){
      const t=dateValue(e.date),w=num(e.weight);
      if(Number.isFinite(t)&&t<=future&&w>=20&&w<=500)byDate.set(dateKey(t),{date:dateKey(t),weight:round(w,2)});
    }
    return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  function bodyweightTrend(entries,now=Date.now()){
    const valid=validWeightEntries(entries),today=new Date(now);today.setHours(0,0,0,0);
    const out=[];
    for(let offset=83;offset>=0;offset--){
      const t=today.getTime()-offset*DAY;
      const nearby=valid.filter(p=>{const d=dateValue(p.date+'T12:00:00');return d>=t-6*DAY&&d<t+DAY});
      const avg=nearby.length?round(nearby.reduce((a,b)=>a+b.weight,0)/nearby.length,2):null;
      out.push({date:dateKey(t),time:t,label:new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),value:avg});
    }
    return out;
  }
  function cardioWeeks(raw,now=Date.now()){
    const weeks=weeklySeries(12,now),mins=new Map();
    for(const s of raw){
      const t=dateValue(s.date||s.completedAt||s.timestamp);if(!Number.isFinite(t))continue;
      const wk=startWeek(t);if(!weeks.includes(wk))continue;
      for(const ex of Array.isArray(s.exercises)?s.exercises:[]){
        if(!isCardio(ex.name))continue;
        for(const set of Array.isArray(ex.sets)?ex.sets:[]){
          const sec=num(set.durationSeconds);
          if(set.done!==false && sec>0&&sec<=21600)mins.set(wk,(mins.get(wk)||0)+sec/60);
        }
      }
    }
    return weeks.map(t=>({time:t,label:weekLabel(t),value:round(mins.get(t)||0,1)}));
  }
  function frequency(raw,now=Date.now()){
    const today=new Date(now);today.setHours(0,0,0,0);
    const cutoff=today.getTime()-27*DAY;
    const unique=new Set();
    for(const s of raw){const t=dateValue(s.date||s.completedAt||s.timestamp);
      if(t>=cutoff&&t<=now+DAY)unique.add(dateKey(t));
    }
    return unique.size;
  }
  function weightLoss(raw,weightEntries,opts){
    opts=opts||{};const now=opts.now||Date.now();
    const bw=bodyweightTrend(weightEntries,now),cardio=cardioWeeks(raw,now),weights=validWeightEntries(weightEntries);
    const valid=bw.filter(x=>x.value!==null);const first=valid[0]?.value,last=valid[valid.length-1]?.value;
    const change=first!=null&&last!=null&&weights.length>=2?round(last-first,2):null;
    const sessions=frequency(raw,now),goal=Number.isFinite(num(opts.weeklySessions))?Math.max(1,Math.min(14,num(opts.weeklySessions))):3;
    const weeks=weeklySeries(4,now),weeklyDays=weeks.map(t=>{
      const unique=new Set(raw.filter(s=>startWeek(dateValue(s.date||s.completedAt||s.timestamp))===t)
        .map(s=>dateKey(dateValue(s.date||s.completedAt||s.timestamp))));
      return {time:t,label:weekLabel(t),value:unique.size,target:goal};
    });
    let insight;
    if(weights.length<2)insight='Add bodyweight readings on different days to see a trend. Weight loss cannot be inferred from workout sessions alone.';
    else if(change<-.15)insight='Your 7-day bodyweight average is trending down. Continue reviewing training consistency and strength performance; weight alone cannot show muscle retention.';
    else if(change>.15)insight='Your averaged bodyweight is trending up over the logged period. Review a few weeks of nutrition and activity records before changing your plan.';
    else insight='Your averaged bodyweight is broadly stable over the logged period. Short-term fluctuations are normal; review a longer trend before adjusting intake.';
    return {mode:'weight-loss',bodyweight:bw,weights,change,cardio,weeklyDays,sessionDays28:sessions,weeklySessionTarget:goal,insight};
  }
  function loadWeights(storage){try{return validWeightEntries(JSON.parse((storage||global.localStorage).getItem(WEIGHT_KEY)||'[]'))}catch(_){return []}}
  function saveWeights(rows,storage){(storage||global.localStorage).setItem(WEIGHT_KEY,JSON.stringify(validWeightEntries(rows)))}
  function loadSettings(storage){try{const x=JSON.parse((storage||global.localStorage).getItem(GOAL_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
  function saveSettings(x,storage){(storage||global.localStorage).setItem(GOAL_KEY,JSON.stringify(x))}
  global.SXGoalModels=Object.freeze({MUSCLES,primaryMuscle,working,readRaw,resistanceSessions,bodybuilding,weightLoss,bodyweightTrend,cardioWeeks,validWeightEntries,loadWeights,saveWeights,loadSettings,saveSettings,weekLabel});
})(window);
