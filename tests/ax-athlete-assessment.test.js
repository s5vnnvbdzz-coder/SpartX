'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const intake=require('../AscensionX2/assessment-core.js');
const engine=require('../AscensionX2/engine.js');
const memory=new Map();
const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value))};
const spartan={profile:{age:36,bodyweight:87},measurements:[
 {id:'older',date:'2026-10-02',values:{bodyweight:89.1,height:175}},
 {id:'recent',date:'2026-11-23',values:{bodyweight:92.0,bodyFat:15}},
 {id:'middle',date:'2026-10-23',values:{bodyweight:90.5,height:174.5}}
],sessions:[{id:1}]};
const classic={profile:{max:{'Back Squat':185,'Bench Press':160,Deadlift:215}},cycle:{created:'2026-11-01',weeks:{'Back Squat':5}}};
memory.set('spartx_db',JSON.stringify(spartan));
memory.set('ascensionx_strength_v1',JSON.stringify(classic));
const originalDb=memory.get('spartx_db'),originalClassic=memory.get('ascensionx_strength_v1');
const prior=intake.readSpartanProfile(storage);
assert.equal(prior.age,36);
assert.deepEqual(prior.weight,{value:92,date:'2026-11-23',source:'Measures'});
assert.deepEqual(prior.height,{value:174.5,date:'2026-10-23',source:'Measures'});
assert.equal(prior.maxes['Back Squat'],185);
assert.equal(prior.maxes['Bench Press'],160);
assert.equal(prior.maxes.Deadlift,215);
assert.equal(memory.get('spartx_db'),originalDb,'Prefill never modifies SpartanX');
assert.equal(memory.get('ascensionx_strength_v1'),originalClassic,'Prefill never touches original six-week cycle');
const WEEK=intake.WEEK;
assert.deepEqual(intake.recommendSchedule(WEEK,4),['Mon','Tue','Thu','Sat']);
assert.equal(intake.recommendSchedule(['Mon','Wed','Fri'],4),null,'Do not schedule unavailable days');
assert.deepEqual(intake.recommendSchedule(['Mon','Tue','Thu','Sat'],4),['Mon','Tue','Thu','Sat']);
assert.ok(intake.recommendSchedule(['Tue','Thu','Sat'],3).length===3);
const raw={focus:'strength',age:'36',weight:'92',height:'175',experience:'advanced',
 squatMax:'185',squatGoal:'195',benchMax:'160',benchGoal:'165',deadliftMax:'215',deadliftGoal:'225',
 sleep:'6',job:'moderate',activity:'low',nutrition:'maintenance',recovery:'normal',
 weeks:'8',days:'4',minutes:'120',equipment:'full',step:'2.5',availability:WEEK.slice(),
 weakSquat:['hips-first'],weakBench:['lockout'],weakDeadlift:['off-floor']
};
const input=intake.assessmentInput(raw);
assert.equal(input.days,4);
assert.equal(input.goals['Back Squat'],'195');
assert.equal(input.experience,'advanced');
assert.deepEqual(input.trainingDays,['Mon','Tue','Thu','Sat']);
const plan=engine.generate(input);
assert.equal(plan.weeks.length,8);
assert.equal(plan.profile.age,36);
assert.equal(plan.profile.bodyweight,92);
assert.equal(plan.profile.height,175);
assert.equal(plan.profile.job,'moderate');
assert.equal(plan.profile.experience,'advanced');
assert.equal(plan.profile.focus,'strength');
assert.deepEqual(plan.profile.trainingDays,['Mon','Tue','Thu','Sat']);
assert.equal(plan.weeks[0].sessions[0].day,'Mon');
assert.equal(plan.weeks[0].sessions[3].day,'Sat');
assert.ok(plan.weeks[0].sessions[3].exercises.some(x=>x.name.includes('Squat')),'Fourth day has a squat variation');
assert.ok(plan.weeks[0].sessions[3].exercises.some(x=>x.name.includes('Bench')),'Fourth day has bench variation');
assert.equal(plan.weeks.at(-1).attempts['Back Squat'].goal,195);
const limited=engine.generate({...input,job:'high',activity:'high',nutrition:'deficit'});
const countSupport=plan.weeks[0].sessions[0].exercises.find(x=>x.role==='accessory').sets.length;
const countLimited=limited.weeks[0].sessions[0].exercises.find(x=>x.role==='accessory').sets.length;
assert.equal(countSupport,3,'Usual recovery defaults to three accessory sets');
assert.equal(countLimited,2,'High recovery constraints reduce initial accessory volume');
const size=engine.generate({...input,focus:'balanced'});
assert.ok(size.weeks[0].sessions[1].exercises.some(x=>x.name==='Incline Dumbbell Press'),'Balanced strength/size changes chest assistance');
const revisable={plan,logs:[{lift:'Bench Press',week:1,kg:110,reps:5,rpe:7}]};
const revised=engine.revise(revisable,{...plan.profile,goals:{...plan.profile.goals,'Bench Press':170}});
assert.equal(revised.plan.profile.age,36,'In-place cycle editing preserves athlete details');
assert.deepEqual(revised.plan.profile.trainingDays,['Mon','Tue','Thu','Sat']);
assert.equal(revised.plan.weeks.at(-1).attempts['Bench Press'].goal,170);
assert.equal(revised.plan.weeks[0],plan.weeks[0],'Logged first week is not replaced');
assert.equal(memory.get('spartx_db'),originalDb);
assert.equal(memory.get('ascensionx_strength_v1'),originalClassic);
const src=path.join(__dirname,'../AscensionX2');
const html=fs.readFileSync(path.join(src,'assessment.html'),'utf8');
const script=fs.readFileSync(path.join(src,'assessment.js'),'utf8');
const landing=fs.readFileSync(path.join(src,'index.html'),'utf8');
for(const name of ['age','weight','height','experience','squatMax','squatGoal','benchMax','benchGoal','deadliftMax','deadliftGoal','sleep','job','activity','nutrition','recovery','availability','weeks','days','minutes','equipment','step'])assert.ok(html.includes('name="'+name+'"'),'Assessment includes '+name);
assert.ok(html.includes('name="weakSquat"')&&html.includes('name="weakBench"')&&html.includes('name="weakDeadlift"'));
assert.ok(landing.includes('./assessment.html'),'Primary 2.0 builder links to athlete assessment');
assert.ok(script.includes('localStorage.setItem(WORKSPACE,JSON.stringify(next))'),'New programme is stored only under 2.0 workspace');
assert.ok(!script.includes("setItem('spartx_db'")&&!script.includes("setItem('ascensionx_strength_v1'"),'No classic writes');
console.log('PASS AX athlete assessment intake, Measures prefill, schedule, lifestyle dose, plan persistence and classic isolation');
