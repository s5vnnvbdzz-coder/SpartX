/* Run: node assets/ascension/adaptive-programming.test.js */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function storage(values={}){
 const map=new Map(Object.entries(values));
 return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),
   removeItem:key=>map.delete(key),snapshot:()=>Object.fromEntries(map)};
}
const id='2026-11-01T10:00:00.000Z';
function cycle(lifts=['Back Squat','Bench Press','Deadlift'],week=2){
 return JSON.stringify({cycle:{created:id,exercises:lifts,weeks:Object.fromEntries(lifts.map(l=>[l,week])),currentWeek:week},logs:[]});
}
function boot(values){
 const localStorage=storage(values);
 const window={localStorage,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'adaptive-programming.js'),'utf8'),{window});
 return {api:window.SXAscensionAdaptive,localStorage};
}
let {api,localStorage}=boot({'ascensionx_strength_v1':cycle()});
assert.equal(api.enabled(),false,'Opt-in starts disabled');
assert.equal(api.plan('Deadlift',2).length,0,'No unsolicited accessory injection');
const before=localStorage.getItem('ascensionx_strength_v1');
api.save({enabled:true,days:4,focus:'strength'});
assert.equal(api.enabled(id),true);
assert.equal(localStorage.getItem('ascensionx_strength_v1'),before,'Existing strength programme is never overwritten');
assert.equal(api.read(id).days,4);
assert.ok(['Bench Press','Overhead Press'].every(lift=>
 api.LIB[lift].some(ex=>ex.name==='Triceps Pushdown (Bar)'&&
 ex.sets===3&&ex.min===10&&ex.max===15)),
 'Bench and overhead support default to bar triceps pushdowns with three sets');
assert.ok(['Bench Press','Overhead Press'].every(lift=>
 !api.LIB[lift].some(ex=>ex.name==='Triceps Pushdown')),
 'Do not reintroduce ambiguous triceps pushdown names');
const rearDelt=api.LIB['Bench Press'].find(e=>e.name==='Rear Delt Reverse Fly');
assert.ok(rearDelt,'Bench programme prescribes Rear Delt Reverse Fly');
assert.equal(rearDelt.sets,3,'Reverse fly prescription retains three sets');
assert.equal(rearDelt.min,12,'Reverse fly reps start at twelve');
assert.equal(rearDelt.max,20,'Reverse fly reps max at twenty');
assert.ok(!api.LIB['Bench Press'].some(e=>
 ['Rear Delt Fly','Iso Rear Delt Fly'].includes(e.name)),
 'Older rear-delt variants are no longer prescribed');
assert.ok(api.plan('Bench Press',2).some(e=>e.name==='Rear Delt Reverse Fly'),
 'Active week uses new exercise');
assert.ok(api.plan('Bench Press',6).every(e=>e.name!=='Rear Delt Reverse Fly'),
 'Week six stays deload');
const deadlift=api.plan('Deadlift',2);
assert.ok(deadlift.length>=2);
assert.ok(deadlift.every(e=>e.sets===3),'Deadlift support defaults to three sets in a standard week');
for(const main of ['Back Squat','Bench Press'])assert.ok(api.plan(main,2).every(e=>e.sets===3),'Standard '+main+' support starts at three sets');
assert.ok(deadlift.reduce((n,e)=>n+e.sets,0)<=6,'Deadlift accessories remain conservative');
assert.ok(deadlift.every(e=>!/romanian|rdl|good morning|deadlift|squat/i.test(e.name)),'No heavy hinge/squat after pulling');
assert.ok(deadlift.every(e=>e.rir>=3));
assert.equal(api.plan('Deadlift',6).length,0,'Week 6 allows full recovery');
const schedule=api.schedule();
assert.equal(schedule.valid,true);
assert.equal(schedule.slots.length,4);
assert.equal(schedule.slots.filter(x=>x.kind==='ascension').length,3);
assert.equal(schedule.slots.filter(x=>x.kind==='support').length,1);
assert.ok(schedule.slots[3].exercises.length>0);
assert.ok(schedule.slots[3].exercises.every(ex=>ex.sets===3),'Standard supporting day defaults to three sets');
assert.ok(api.plan('Bench Press',4).every(ex=>ex.sets<3),'Taper week may reduce accessory sets');
// Day 4 has exactly three sets in standard weeks regardless of training focus.
for(const focus of ['strength','balanced','hypertrophy']){
 api.save({focus});
 const day4=api.schedule().slots[3];
 assert.equal(day4.kind,'support');
 assert.ok(day4.exercises.length>0&&day4.exercises.every(ex=>ex.sets===3),
  'Day 4 '+focus+' work must use three working sets');
}
api.save({focus:'strength'});
for(const [week,expected] of [[4,2],[5,1],[6,0]]){
 const tapered=boot({'ascensionx_strength_v1':cycle(['Back Squat','Bench Press','Deadlift'],week)});
 tapered.api.save({enabled:true,focus:'strength',days:4});
 const fourth=tapered.api.schedule().slots[3];
 if(week===6)assert.equal(fourth.exercises.length,0,'No Week 6 accessory session');
 else assert.ok(fourth.exercises.every(ex=>ex.sets===expected),
  'Week '+week+' support work must taper to '+expected+' sets');
}
assert.equal(schedule.slots[3].day,'SAT');
api.save({focus:'hypertrophy'});
assert.equal(api.read(id).focus,'hypertrophy');
assert.ok(api.schedule().slots[3].exercises.some(ex=>ex.name==='Machine Chest Press'));
const history={sessions:[{
 date:'2026-11-09T08:00:00Z',
 exercises:[{name:'Iso-Lateral Row',sxStrengthSizeCompanion:{cycleId:id,week:2},
  sets:[{weight:'40',reps:'12',rpe:'6',type:'Working Set',done:true},
        {weight:'40',reps:'12',rpe:'6',type:'Working Set',done:true}]}]
}]};
localStorage.setItem('spartx_db',JSON.stringify(history));
api.save({focus:'strength'});
assert.ok(api.plan('Bench Press',2).some(e=>e.name==='Iso-Lateral Row'),'Bench accessory uses Iso-Lateral Row');
assert.ok(api.schedule().slots.some(slot=>slot.kind==='support'&&slot.exercises.some(e=>e.name==='Iso-Lateral Row')),'Support day uses Iso-Lateral Row');
assert.ok(api.plan('Bench Press',3).find(e=>e.name==='Iso-Lateral Row').suggestedKg>40,
 'Advances controlled completed accessory sets only');
const noAdvance={sessions:[{date:'2026-11-09T09:00:00Z',exercises:[{
 name:'Iso-Lateral Row',sxStrengthSizeCompanion:{cycleId:id,week:2},
 sets:[{weight:'40',reps:'12',rpe:'',type:'Working Set',done:false}]
}]}]};
localStorage.setItem('spartx_db',JSON.stringify(noAdvance));
assert.equal(api.plan('Bench Press',3).find(e=>e.name==='Iso-Lateral Row').suggestedKg,null,
 'Incomplete sets never justify progression');
localStorage.setItem('ascensionx_strength_v1',cycle(['Back Squat','Bench Press','Deadlift','Overhead Press']));
api.save({days:3});
assert.equal(api.schedule().valid,false,'Cannot assign four independent compounds to three separate days');
localStorage.setItem('ascensionx_strength_v1',cycle(['Back Squat','Bench Press','Deadlift'],6));
api.save({days:4});
assert.equal(api.schedule().slots.find(x=>x.kind==='support').exercises.length,0,'Deload week has no support work');
const fresh='2026-11-10T11:00:00.000Z';
localStorage.setItem('ascensionx_strength_v1',JSON.stringify({cycle:{created:fresh,exercises:['Bench Press'],weeks:{'Bench Press':1}},logs:[]}));
assert.equal(api.enabled(fresh),false,'New cycle must opt in independently');

// Build 310: previously saved manual Powerbuilding preferences must NOT
// silently re-enable the retired RDL / paused-bench accessory programmes.
const oldPrefs={ [id]:{enabled:true,powerbuilding:true,trainingDays:4,volume:'balanced'} };
const pastCycle=cycle(['Back Squat','Bench Press','Deadlift'],2);
const legacyStorage=storage({
  'ascensionx_strength_v1':pastCycle,
  'sx_ascension_companion_v1':JSON.stringify(oldPrefs)
});
const bridgeWindow={localStorage:legacyStorage,addEventListener(){}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'adaptive-programming.js'),'utf8'),{window:bridgeWindow});
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../bodybuilding/ascension-companion.js'),'utf8'),{window:bridgeWindow});
const bridge=bridgeWindow.SXAscensionCompanion, adaptive=bridgeWindow.SXAscensionAdaptive;
const imported={source:'AscensionX',cycleId:id,exercise:'Bench Press',week:2};
assert.equal(bridge.preference(legacyStorage).enabled,false,'Old companion preferences cannot enable future accessories');
assert.equal(bridge.forImport(imported,[],legacyStorage).length,0,'No automatic accessories when adaptive is off');
assert.equal(bridge.schedule(4,legacyStorage).valid,false,'Legacy support days are disabled');
adaptive.save({enabled:true,focus:'strength',days:4},legacyStorage);
assert.equal(bridge.preference(legacyStorage).adaptive,true);
assert.ok(bridge.forImport(imported,[],legacyStorage).length>0,'Adaptive exercises still load');
for(const lift of ['Back Squat','Bench Press','Deadlift']){
 const entries=bridge.forImport({...imported,exercise:lift},[],legacyStorage);
 assert.ok(entries.every(ex=>!/(?:Romanian Deadlift|Paused Bench Press)/i.test(ex.name)),
  'Neither retired accessory is added on the primary days');
}
assert.ok(adaptive.schedule(null,legacyStorage).slots.every(slot=>
 slot.exercises.every(ex=>!/(?:Romanian Deadlift|Paused Bench Press)/i.test(ex.name))),
 'No RDL/paused bench prescriptions appear on the fourth day');
assert.equal(legacyStorage.getItem('ascensionx_strength_v1'),pastCycle,'Prior cycle and history preserved');
const ascHtml=fs.readFileSync(path.join(__dirname,'../../AscensionX/index.html'),'utf8');
const hostHtml=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
assert.equal(ascHtml.includes('cycleRomanianDeadliftEnabled'),false,'RDL selector removed from AscensionX builder');
assert.equal(ascHtml.includes('SpartanXPausedBench'),false,'Paused bench preview removed');
assert.equal(ascHtml.includes('SpartanXRomanianDeadlift'),false,'RDL preview removed');
assert.equal(hostHtml.includes('ensureAscensionPausedBench'),false,'No automatic paused bench workout injection');
assert.equal(hostHtml.includes('ensureAscensionRomanianDeadlift'),false,'No automatic RDL workout injection');
assert.equal(hostHtml.includes('backfillActiveAscensionWeek2PausedBench'),false,'No old paused bench draft backfill');
assert.equal(hostHtml.includes('backfillActiveAscensionWeek2RomanianDeadlift'),false,'No old RDL draft backfill');
assert.ok(ascHtml.includes("cycleEditorOpenedFromWorkout=document.body.classList.contains('sx-asc-workout-manage')"),
 'Tools and Workout entrances share the same full-page editor formatting');
assert.ok(ascHtml.includes("document.body.classList.add('sx-asc-workout-manage','sx-asc-cycle-page')"),
 'Tools Edit Programme activates the same dedicated page as Manage Cycle');
assert.ok(ascHtml.includes('const returnToSpartanX=cycleEditorOpenedFromWorkout,returnScreen=cycleEditorReturnScreen;'),
 'Editor exit must distinguish the two entrances');
assert.ok(ascHtml.includes('<section id="cycleEditorBackdrop" class="cycle-editor-page" role="main"'),
 'Build and Edit Programme share an actual main page, not a popup dialog');
assert.ok(!ascHtml.includes('class="cycle-editor-dialog" role="dialog"'),
 'The programme page must not keep dialog semantics');
assert.ok(ascHtml.includes("history.pushState({screen:'programme',returnScreen:cycleEditorReturnScreen}"),
 'Tools editing creates a navigable route');
assert.ok(ascHtml.includes("if($('cycleEditorBackdrop')?.classList.contains('open'))closeCycleEditor(true);"),
 'Browser Back restores the preceding AscensionX screen');
const editorCss=fs.readFileSync(path.join(__dirname,'cycle-builder-ui.css'),'utf8');
assert.ok(editorCss.includes('body.sx-asc-cycle-page #cycleEditorBackdrop.open{')&&
 editorCss.includes('display:flex!important;position:relative!important;'),
 'Editor is laid out as a normal dedicated page, not a fixed overlay');
assert.ok(editorCss.includes('body.sx-asc-cycle-page > main,'),
 'Underlying AscensionX dashboard is not visible beneath the programme page');
assert.ok(ascHtml.includes("if(returnToSpartanX){\n  try{window.parent.postMessage({type:'spartx:ascensionManageExit'}"),
 'Only Workout Manage Cycle exits all the way back to SpartanX');


// Regression: the fourth training day must be selected AFTER Deadlift and
// BEFORE Squat of the following week, without changing main-lift week counters.
const week2Completed=['Back Squat','Bench Press','Deadlift'].map(lift=>({
 lift,cycleId:id,week:2,setsComplete:true,date:'2026-11-12T10:00:00.000Z'
}));
const nextWeekCycle=JSON.stringify({
 cycle:{created:id,exercises:['Back Squat','Bench Press','Deadlift'],
  weeks:{'Back Squat':3,'Bench Press':3,Deadlift:3},currentWeek:3},
 logs:week2Completed
});
const next=boot({'ascensionx_strength_v1':nextWeekCycle});
next.api.save({enabled:true,days:4,focus:'strength'});
const fourth=next.api.pendingSupportDay();
assert.equal(fourth?.kind,'support');
assert.equal(fourth?.week,2,'Day 4 belongs to the just-finished Week 2');
assert.equal(fourth?.index,3,'Day 4 follows three main strength sessions');
assert.equal(fourth?.day,'SAT');
assert.equal(next.api.schedule().week,2,'Support prescription must not jump to Week 3');
assert.deepEqual(Array.from(next.api.schedule().slots.slice(0,3).map(x=>x.week)),[3,3,3],
 'Main lift prescriptions stay at Week 3');
const allSupport=next.api.schedule().slots[3].exercises.map(ex=>({
 name:ex.name,
 sxPowerbuildingSupport:{cycleId:id,week:2,day:'SAT'},
 sets:Array.from({length:ex.sets},()=>({weight:35,reps:12,done:true}))
}));
const incompleteSupport=allSupport.map((ex,i)=>({
 ...ex,sets:i===0?ex.sets.slice(0,1):ex.sets
}));
next.localStorage.setItem('spartx_db',JSON.stringify({
 sessions:[{date:'2026-11-13T11:00:00.000Z',exercises:incompleteSupport}]
}));
assert.equal(next.api.pendingSupportDay()?.week,2,
 'A partially saved support session must remain next');
next.localStorage.setItem('spartx_db',JSON.stringify({
 sessions:[{date:'2026-11-13T11:00:00.000Z',exercises:allSupport}]
}));
assert.equal(next.api.pendingSupportDay(),null,'Once Day 4 is completed, advance to next Squat');
assert.equal(next.api.schedule().week,3,
 'Only after logging Day 4 should the support prescription reflect Week 3');
assert.equal(next.localStorage.getItem('ascensionx_strength_v1'),nextWeekCycle,
 'Day selection must not rewrite or advance the actual cycle');
next.localStorage.setItem('spartx_db',JSON.stringify({
 sessions:[{date:'2026-11-13T11:00:00.000Z',exercises:allSupport.map(ex=>({
  ...ex,sxPowerbuildingSupport:{...ex.sxPowerbuildingSupport,cycleId:'old-cycle'}
 }))}]
}));
assert.equal(next.api.pendingSupportDay()?.week,2,'Prior-cycle support must not count');
next.api.save({days:3});
assert.equal(next.api.pendingSupportDay(),null,'Three-day programmes have no fourth support day');
next.api.save({days:4,enabled:false});
assert.equal(next.api.pendingSupportDay(),null,'Disabled Adaptive Programming has no support day');
const allFour=boot({'ascensionx_strength_v1':JSON.stringify({
 cycle:{created:id,exercises:['Back Squat','Bench Press','Deadlift','Overhead Press'],
  weeks:{'Back Squat':3,'Bench Press':3,Deadlift:3,'Overhead Press':3},currentWeek:3},
 logs:[...week2Completed,{lift:'Overhead Press',cycleId:id,week:2,setsComplete:true}]
})});
allFour.api.save({enabled:true,days:4});
assert.equal(allFour.api.pendingSupportDay(),null,
 'Four actual compound lifts must not create an imaginary fifth training day');
const week5Done=boot({'ascensionx_strength_v1':JSON.stringify({
 cycle:{created:id,exercises:['Back Squat','Bench Press','Deadlift'],
  weeks:{'Back Squat':6,'Bench Press':6,Deadlift:6},currentWeek:6},
 logs:week2Completed.map(log=>({...log,week:5}))
})});
week5Done.api.save({enabled:true,days:4});
assert.equal(week5Done.api.pendingSupportDay()?.week,5,
 'The final loading-week support day is still available before Week 6 deload');
assert.ok(week5Done.api.schedule().slots[3].exercises.every(ex=>ex.sets===1),
 'Week 5 support uses tapered one-set assistance');

const quickAccess=fs.readFileSync(path.join(__dirname,'quick-access.js'),'utf8');
assert.ok(quickAccess.includes('pendingSupportDay?.()')&&
 quickAccess.includes("lift:'__ADAPTIVE_SUPPORT__'"),
 'Workout Continue must select the fourth day in preference to the next Squat');
assert.ok(ascHtml.includes("pendingSupport=adaptive?.pendingSupportDay?.()")&&
 ascHtml.includes("pendingSupport&&support?'__ADAPTIVE_SUPPORT__'"),
 'Both AscensionX Continue entry points must preselect Day 4');

console.log('AscensionX adaptive programming: tests passed');
