const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../AscensionX2/engine.js');
let assertions=0;
function check(condition,message){assert.ok(condition,message);assertions++;}
const base={
 weeks:12,days:4,minutes:105,step:2.5,sleep:7,recovery:'normal',equipment:'full',
 maxes:{'Back Squat':185,'Bench Press':160,Deadlift:215},
 goals:{'Back Squat':190,'Bench Press':165,Deadlift:220},
 weakPoints:{'Back Squat':['hips-first','out-of-hole'],'Bench Press':['lockout'],'Deadlift':['off-floor']}
};
const primary=(week,lift)=>week.sessions.flatMap(s=>s.exercises).find(e=>e.role==='primary'&&e.name===lift);
const top=(week,lift)=>primary(week,lift)?.sets.find(s=>s.type==='top');
for(const weeks of [4,8,12]){
 for(const days of [3,4,5]){
  for(const recovery of ['normal','limited']){
   const plan=engine.generate({...base,weeks,days,recovery});
   check(plan.independent===true,'No classic integration');
   check(plan.weeks.length===weeks,'Correct number of weeks');
   check(plan.profile.days===days,'Requested number of days retained');
   check(plan.weeks.at(-1).phase==='Assessment','Final assessment is optional');
   check(plan.weeks.at(-1).assessment,'Assessment flag');
   for(const week of plan.weeks.slice(0,-1)){
    check(week.sessions.length===days,'Requested training day count');
    for(const lift of engine.LIFTS){
     const main=primary(week,lift);
     check(!!main,'Primary '+lift+' must be present');
     check(main.sets.some(s=>s.type==='top'),'Primary top set');
     check(main.sets.filter(s=>s.type==='warmup').length>=2,'Progressive warmups');
    }
    for(const day of week.sessions){
     check(new Set(day.exercises.map(x=>x.name)).size===day.exercises.length,'No duplicated exercises');
     for(const exercise of day.exercises)for(const set of exercise.sets)
      check(set.kg===null||set.kg>0,'Loads positive');
    }
    if(days>=4){
     const secondary=week.sessions[3].exercises.filter(e=>e.role==='secondary');
     check(secondary.some(e=>/Squat/.test(e.name)),'Day 4 squat included');
     check(secondary.some(e=>/Bench/.test(e.name)),'Day 4 bench included');
    }
   }
   check(plan.weeks.at(-1).attempts['Bench Press'].third>160,'Bench PR candidate exceeds known max');
  }
 }
}
const plan=engine.generate(base);
check(plan.weeks[3].phase==='Deload'&&plan.weeks[7].phase==='Recovery','12-week recovery phases');
check(plan.weeks[10].phase==='Taper','12-week taper');
check(top(plan.weeks[8],'Bench Press').kg>140,'Week 9 bench double exceeds prior 140×2');
check(top(plan.weeks[8],'Back Squat').kg>157.5,'Week 9 squat double exceeds prior 157.5×2');
check(top(plan.weeks[8],'Deadlift').kg>190,'Week 9 deadlift double exceeds prior 190×2');
check(top(plan.weeks[9],'Bench Press').reps===1,'Heavy single phase');
check(top(plan.weeks[0],'Bench Press').reps===5,'Productive opening volume');
check(plan.weeks[11].assessment===true,'No forced 1RM');
check(plan.weeks[11].attempts['Back Squat'].third===190,'Conservative squat PR candidate');
check(plan.weeks[11].attempts['Bench Press'].third===165,'Bench target candidate');
check(plan.weeks[11].attempts['Deadlift'].third===220,'Deadlift target candidate');
check(plan.weeks[0].sessions[2].exercises[1].name==='Romanian Deadlift','RDL first assistance after deadlift');
check(plan.weeks[0].sessions[0].exercises.some(x=>x.name==='Cable Crunch'),'Shoulder-friendly squat core');
const actualEasy={kg:top(plan.weeks[0],'Bench Press').kg,reps:5,rpe:6};
check(engine.reviewTop(primary(plan.weeks[0],'Bench Press'),actualEasy).status==='increase-candidate','Low RPE suggests review');
check(engine.reviewTop(primary(plan.weeks[0],'Bench Press'),{kg:120,reps:3,rpe:9.5}).status==='reduce-review','Missed reps require recovery review');
check(engine.reviewTop(primary(plan.weeks[0],'Bench Press'),{}).status==='insufficient','Incomplete data cannot adjust');
check(engine.reviewTop(plan.weeks[11].sessions[0].exercises[0],{kg:120,reps:1,rpe:8}).status==='assessment','Test phase no automated adjustment');
for(const mutation of [
 {...base,goals:{...base.goals,'Bench Press':160}},
 {...base,maxes:{...base.maxes,'Back Squat':0}},
 {...base,weeks:6},
 {...base,days:6},
 {...base,sleep:2}
]){
 let threw=false;try{engine.generate(mutation)}catch(e){threw=true}
 check(threw,'Invalid profile rejected');
}
// Editing a live cycle must preserve all logged workouts, historical
// prescriptions, and the existing identity; only unlogged weeks change.
const previous=engine.generate(base);
const originalWeek=JSON.stringify(previous.weeks[0]);
const originalFuture=previous.weeks[8].sessions[0].exercises[0].sets.find(x=>x.type==='top').kg;
const active={id:'ax2-test-1',plan:previous,logs:[{
 week:1,lift:'Back Squat',kg:140,reps:5,rpe:7,date:'2026-11-24T15:00:00Z'
}]};
let revision=engine.revise(active,{...base,goals:{...base.goals,'Back Squat':200,'Bench Press':172.5}});
check(revision.preservedThrough===1,'First logged week locked');
check(revision.plan.profile.goals['Back Squat']===200,'Squat PR goal editable');
check(revision.plan.profile.goals['Bench Press']===172.5,'Bench PR goal editable');
check(revision.plan.weeks.at(-1).attempts['Back Squat'].goal===200,'Assessment goal updated');
check(revision.plan.weeks.at(-1).attempts['Bench Press'].goal===172.5,'Bench assessment goal updated');
check(JSON.stringify(revision.plan.weeks[0])===originalWeek,'Logged week prescription identical');
check(active.logs.length===1&&active.logs[0].kg===140,'Actual logged top set untouched');
check(active.plan.profile.goals['Back Squat']===190,'Original plan has not been mutated');
check(revision.plan.weeks[8].sessions[0].exercises[0].sets.find(x=>x.type==='top').kg===originalFuture,'Goal change alone does not arbitrarily change compound loading');
revision=engine.revise(active,{...base,maxes:{...base.maxes,'Back Squat':195},goals:{...base.goals,'Back Squat':200},sleep:6,recovery:'limited',weakPoints:{...base.weakPoints,'Back Squat':['out-of-hole']}});
check(JSON.stringify(revision.plan.weeks[0])===originalWeek,'New 1RM cannot rewrite logged week');
check(revision.plan.weeks[8].sessions[0].exercises[0].sets.find(x=>x.type==='top').kg!==originalFuture,'New 1RM recalculates unlogged week');
check(revision.plan.profile.weakPoints['Back Squat'].includes('out-of-hole'),'Weak point edits applied');
check(revision.plan.profile.sleep===6&&revision.plan.profile.recovery==='limited','Recovery edits applied');
const fresh=engine.revise({id:'ax2-empty',plan:previous,logs:[]},{...base,weeks:8,days:3});
check(fresh.plan.weeks.length===8&&fresh.plan.profile.days===3,'Structural edits before training allowed');
for(const change of [{...base,weeks:8},{...base,days:5}]){
 let failed=false;try{engine.revise(active,change);}catch(_){failed=true;}
 check(failed,'Structural edits forbidden after logging');
}
const latter={...active,logs:[{week:1,lift:'Back Squat',kg:140,reps:5,rpe:7},{week:4,lift:'Bench Press',kg:105,reps:5,rpe:6}]};
revision=engine.revise(latter,{...base,maxes:{...base.maxes,'Deadlift':225},goals:{...base.goals,Deadlift:230}});
check(revision.preservedThrough===4,'Last logged week determines preservation boundary');
check(JSON.stringify(revision.plan.weeks.slice(0,4))===JSON.stringify(previous.weeks.slice(0,4)),'All earlier weeks preserved through last recorded week');
check(JSON.stringify(active)===JSON.stringify({id:'ax2-test-1',plan:previous,logs:[{week:1,lift:'Back Squat',kg:140,reps:5,rpe:7,date:'2026-11-24T15:00:00Z'}]}),'Revision is pure and leaves original unmodified');
const dir=path.join(__dirname,'../AscensionX2');
for(const file of ['index.html','app.js','engine.js','style.css','sw.js']){
 const source=fs.readFileSync(path.join(dir,file),'utf8');
 check(!source.includes('ascensionx_strength_v1'),'No read/write of classic cycle storage');
 check(!source.includes('spartx_db'),'No direct SpartanX workout database access');
 check(!source.includes('spartx_draft_v1'),'No direct SpartanX active draft access');
}
const shell=fs.readFileSync(path.join(dir,'index.html'),'utf8');
check(shell.includes('data-tab="programme"')&&shell.includes('data-tab="review"'),'Programme and Intelligence tabs exist');
check(shell.includes('name="weeks"')&&shell.includes('value="12"'),'Configurable cycle length');
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
check(app.includes("const KEY='ascensionx2_standalone_workspace_v1'"),'Only standalone storage key');
check(app.includes('data-top-form')&&app.includes('logs.push'),'Standalone top-set logs');
check(app.includes('data-restore')&&app.includes('2.0-only backup exported'),'Cycle archive and export controls');
check(app.includes('openManageDialog')&&app.includes('engine.revise'),'In-place cycle editor wired');
check(shell.includes('id="manageDialog"')&&shell.includes('id="manageForm"'),'Current-cycle editing dialog exists');
const sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8');
check(sw.includes("ascensionx2-dev-")&&!sw.includes('spartanx-v'),'Scoped cache names');
check(sw.includes("'/AscensionX2/'"),'Service worker only handles standalone path');
console.log('PASS AscensionX 2.0 independent engine: '+assertions+' assertions');
