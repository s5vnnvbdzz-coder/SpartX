'use strict';
/* node science/volume-intelligence.test.js */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../assets/science/evidence-engine.js');
const V=require('../assets/science/volume-intelligence.js');
let count=0;
function check(title,fn){fn();count++;console.log('PASS '+title);}
const memory=obj=>({getItem:key=>obj[key]??null,setItem(){throw Error('Read-only engine attempted a write!')},removeItem(){throw Error('Read-only engine attempted a delete!')}});
check('three goal tracks use evidence-noted starting ranges, not universal optimal sets',()=>{
 const beginner=V.bandFor('Chest',{goal:'bodybuilding',experience:'beginner'});
 const advanced=V.bandFor('Chest',{goal:'bodybuilding',experience:'advanced'});
 assert(advanced.min>beginner.min);
 assert.equal(beginner.status,'starting-range');
 assert.match(beginner.note,/not a biological optimum/);
});
check('major named lifts and accessories are classified, unknown exercises are not invented',()=>{
 assert.equal(V.classify('Bench Press').primary,'Chest');
 assert.equal(V.classify('Deadlift').primary,'Hamstrings');
 assert.equal(V.classify('Triceps Pushdown (Bar)').primary,'Triceps');
 assert.equal(V.classify('Hanging Knee Raise').primary,'Core');
 assert.equal(V.classify('Nonsense Exercise'),null);
});
check('fractional secondary muscle exposure cannot masquerade as direct sets',()=>{
 const d=V.countExposure([{exercises:[{name:'Bench Press',sets:3},{name:'Lat Pulldown',sets:2}]}]);
 assert.equal(d.Chest.direct,3);
 assert.equal(d.Triceps.indirect,1.5);
 assert.equal(d.Back.direct,2);
 assert.equal(d.Biceps.indirect,1);
});
check('no blanket two-set rule: low exposure may justify three or four sets',()=>{
 const under=V.recommendWorkingSets({name:'Leg Extension',goal:'bodybuilding',experience:'advanced',weeklyExposure:0,remainingSlots:3});
 const sufficient=V.recommendWorkingSets({name:'Leg Extension',goal:'bodybuilding',experience:'advanced',weeklyExposure:15,remainingSlots:3});
 assert(under.sets>=3);
 assert.equal(sufficient.sets,2);
 assert.equal(under.confidence,'heuristic');
});
check('heavy overlap and low readiness cap accessories, recovery weeks can reduce to one',()=>{
 const normal=V.recommendWorkingSets({name:'Romanian Deadlift',goal:'bodybuilding',weeklyExposure:0,remainingSlots:1});
 const heavy=V.recommendWorkingSets({name:'Romanian Deadlift',goal:'bodybuilding',weeklyExposure:0,remainingSlots:1,afterHeavyLift:true});
 const recovery=V.recommendWorkingSets({name:'Romanian Deadlift',goal:'bodybuilding',recoveryWeek:true,weeklyExposure:0});
 assert(normal.sets>=heavy.sets);assert(heavy.sets<=2);assert.equal(recovery.sets,1);
});
check('strength main-lift sets are preserved by advice',()=>{
 const x=V.recommendWorkingSets({name:'Back Squat',main:true,existingSets:5});
 assert.equal(x.sets,5);assert.equal(x.status,'main-preserved');
});
check('new bespoke drafts get recommendations without mutation of inputs or training history',()=>{
 const input=E.generate({goal:'bodybuilding',days:4,minutes:90,equipment:['barbell','dumbbell','machine','cable','bodyweight']});
 const original=JSON.stringify(input);
 const optimized=V.rebalancePlan(input,{goal:'bodybuilding',experience:'advanced',priority:'Quads'});
 assert.equal(JSON.stringify(input),original);
 assert.equal(optimized.sessions.length,4);
 assert(optimized.sessions.flatMap(d=>d.exercises).some(x=>x.sxVolumePolicy===V.VERSION));
 assert(optimized.sessions.flatMap(d=>d.exercises).every(x=>x.sets>=1&&x.sets<=5));
});
check('5/3/1 main work and BBB count, warmups do not',()=>{
 const c={id:'531-1',name:'531 bench',lift:'Bench Press',weeks:4,cycles:[{weeks:[
   {number:1,name:'Week 1',sets:[{rep:'5'},{rep:'5'},{rep:'5+'}],warmups:[{rep:'5'},{rep:'5'},{rep:'3'}],bbb:{sets:5,reps:10}}]}]};
 const storage=memory({'spartanx_531_saved_cycles_v1':JSON.stringify([c])});
 const report=V.report(storage,{now:Date.parse('2026-11-21T12:00:00Z')});
 assert.equal(report.bbbLiftCount,1);assert.equal(report.planned.Chest.direct,8);
 assert.equal(report.sources[0].main[0].workingSets,3);
 assert.equal(report.sources[0].main[0].bbbSets,5);
 assert(report.suggestions.some(s=>s.name==='Chest-Supported Row'));
});
check('5/3/1 deload retains source plan but reduces assistance suggestions',()=>{
 const c={id:'531-2',name:'bench',lift:'Bench Press',weeks:4,completedWeeks:[1,2,3],cycles:[{weeks:[
   {number:4,name:'Week 4 · Deload',sets:[{},{},{}],bbb:null}]}]};
 const report=V.report(memory({'spartanx_531_saved_cycles_v1':JSON.stringify([c])}));
 assert(report.suggestions.every(s=>s.sets===0));
});
check('AscensionX main sets are never fabricated as known quantities',()=>{
 const storage=memory({'ascensionx_strength_v1':JSON.stringify({cycle:{created:'2026-11-21T00:00:00Z',exercises:['Back Squat','Bench Press','Deadlift'],weeks:{'Back Squat':2,'Bench Press':3,'Deadlift':3}}})});
 const report=V.report(storage);
 assert.equal(report.sources[0].type,'ascension');
 assert(report.sources[0].main.every(m=>m.workingSets===null));
 assert(report.warnings.some(x=>/not inferred/i.test(x)));
});
check('simultaneous saved 5/3/1 and AscensionX are flagged for overlap review',()=>{
 const c={id:'531-3',lift:'Bench Press',weeks:4,cycles:[{weeks:[{number:1,sets:[{},{},{}]}]}]};
 const storage=memory({'spartanx_531_saved_cycles_v1':JSON.stringify([c]),
  'ascensionx_strength_v1':JSON.stringify({cycle:{created:'2026-11-21T00:00:00Z',exercises:['Bench Press']}})});
 const report=V.report(storage);
 assert(report.warnings.some(x=>/double-programmed/.test(x)));
});
check('saved work-set history requires checked valid reps, not warmups',()=>{
 const date='2026-11-20T18:00:00Z';
 const history={sessions:[{date,exercises:[{name:'Bench Press',sets:[
  {type:'W',weight:80,reps:5,done:true},{type:'Working Set',weight:100,reps:3,done:true},
  {type:'Working Set',weight:100,reps:3,done:false},{type:'Working Set',weight:100,reps:0,done:true}
 ]}]}]};
 const report=V.recentCompleted(memory({'spartx_db':JSON.stringify(history)}),Date.parse('2026-11-21T12:00:00Z'));
 assert.equal(report.sessions,1);assert.equal(report.exposure.Chest.direct,1);
});
check('source reading is strictly read-only',()=>{
 const store=memory({});
 const report=V.report(store);
 assert.equal(report.readOnly,true);assert.equal(report.sources.length,0);
});
check('Science Lab removed as a separate SpartanX section; unified panel exists',()=>{
 const root=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const intelligence=fs.readFileSync(path.join(__dirname,'../intelligence/index.html'),'utf8');
 const asc=fs.readFileSync(path.join(__dirname,'../AscensionX/index.html'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'../intelligence/app.js'),'utf8');
 assert(!root.includes('sxScienceProgrammeCard'));
 assert(root.includes('assets/science/volume-intelligence.js'));
 assert(intelligence.includes('id="sxScientificVolume"'));
 assert(intelligence.includes('./scientific-panel.js'));
 assert(asc.includes('../assets/science/volume-intelligence.js'));
 assert(app.includes("SXScientificPanels?.render"));
});
check('5/3/1 import offers opt-in assistance without mutating planned strength sets',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../assets/workouts/531-cycle-flow.js'),'utf8');
 assert(source.includes('function recommendedAssistance'));
 assert(source.includes('sx531IncludeAssistance'));
 assert(source.includes("sx531Intelligence:{cycleId:c.id,lift,week:n,optional:true"));
 assert(source.indexOf("const planned=w.sets.map(")<source.indexOf("if($('sx531IncludeAssistance')?.checked)"));
 assert(source.indexOf("activeCycle={id:c.id,week:n,lift,plannedSets:planned}")>
   source.indexOf("if($('sx531IncludeAssistance')?.checked)"));
});
check('Bodybuilding goal Intelligence shares the same scientific source and inline panel',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../intelligence/goals.html'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'../intelligence/goals-ui.js'),'utf8');
 assert(html.includes('id="sxScientificVolume"'));
 assert(html.includes('volume-intelligence.js'));
 assert(ui.includes("SXScientificPanels?.render"));
});
check('live AscensionX adapter consults central Intelligence while preserving cycle data',()=>{
 const store={
  'ascensionx_strength_v1':JSON.stringify({cycle:{created:'2026-11-21T00:00:00Z',
   exercises:['Back Squat','Bench Press','Deadlift'],
   weeks:{'Back Squat':2,'Bench Press':2,'Deadlift':2},currentWeek:2}})
 };
 const storage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}};
 const w={localStorage:storage,document:{readyState:'loading',addEventListener(){}},addEventListener(){}};
 const ctx=vm.createContext({window:w});
 for(const file of ['assets/science/evidence-engine.js','assets/science/volume-intelligence.js','assets/ascension/adaptive-programming.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
 const before=store.ascensionx_strength_v1;
 w.SXAscensionAdaptive.save({enabled:true,days:4,focus:'strength'},storage);
 const week2=w.SXAscensionAdaptive.plan('Back Squat',2,{},storage);
 assert(week2.length>=2);
 assert(week2.every(ex=>ex.sets>=1&&ex.sets<=4));
 assert(week2.some(ex=>ex.reason.includes('Spartan Intelligence:')));
 assert.equal(store.ascensionx_strength_v1,before);
 const week6=w.SXAscensionAdaptive.plan('Back Squat',6,{},storage);
 assert.equal(week6.length,0);
});
check('new bespoke programmes invoke central set policy, while existing programme data stays unchanged',()=>{
 const storage=memory({});
 const w={localStorage:storage};
 const ctx=vm.createContext({window:w});
 for(const file of ['assets/science/evidence-engine.js','assets/science/volume-intelligence.js','assets/bodybuilding/programme-model.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
 const fresh=w.SXBodybuildingModel.fresh({kind:'hybrid',days:4,experience:'advanced'});
 assert.equal(fresh.volumeIntelligence.version,V.VERSION);
 assert(fresh.sessions.some(d=>d.exercises.some(e=>e.sxVolumePolicy===V.VERSION)));
});
check('new scripts and existing inline panel are valid JavaScript',()=>{
 for(const file of ['assets/science/volume-intelligence.js','intelligence/scientific-panel.js','assets/ascension/adaptive-programming.js','assets/bodybuilding/programme-builder.js']){
  new vm.Script(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{filename:file});
 }
});
console.log('Passed '+count+' unified Intelligence working-set checks.');
