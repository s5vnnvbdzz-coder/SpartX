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
 ex.sets===4&&ex.min===10&&ex.max===15)),
 'Bench and overhead support default to bar triceps pushdowns with four sets');
assert.ok(['Bench Press','Overhead Press'].every(lift=>
 !api.LIB[lift].some(ex=>ex.name==='Triceps Pushdown')),
 'Do not reintroduce ambiguous triceps pushdown names');
const rearDelt=api.LIB['Bench Press'].find(e=>e.name==='Rear Delt Reverse Fly');
assert.ok(rearDelt,'Bench programme prescribes Rear Delt Reverse Fly');
assert.equal(rearDelt.sets,4,'Reverse fly prescription now uses four sets in standard weeks');
assert.equal(rearDelt.min,12,'Reverse fly reps start at twelve');
assert.equal(rearDelt.max,20,'Reverse fly reps max at twenty');
assert.ok(!api.LIB['Bench Press'].some(e=>
 ['Rear Delt Fly','Iso Rear Delt Fly'].includes(e.name)),
 'Older rear-delt variants are no longer prescribed');
assert.ok(api.FOCUS_LIFTS.hypertrophy['Bench Press'].includes('Rear Delt Reverse Fly'),
 'The hypertrophy-priority bench programme includes the approved rear-delt exercise');
assert.ok(api.plan('Bench Press',6).every(e=>e.name!=='Rear Delt Reverse Fly'),
 'Week six stays deload');
const deadlift=api.plan('Deadlift',2);
assert.ok(deadlift.length>=2);
assert.deepEqual(Array.from(deadlift.map(e=>e.name)),
 ['Romanian Deadlift','Lat Pulldown','Seated Leg Curl'],'Deadlift support follows requested order');
assert.equal(deadlift[0].sets,3,'RDLs use three sets');
assert.equal(deadlift[0].min,8,'RDLs use eight reps');
assert.equal(deadlift[0].targetRpe,7,'RDL target RPE is seven');
assert.equal(deadlift[0].tmPercent,45,'RDLs use 45% of deadlift training max');
assert.deepEqual(Array.from(api.plan('Back Squat',2).map(e=>e.name)),
 ['Hack Squat','Leg Extension','45° Back Extension','Hanging Knee Raise'],
 'Squat support follows requested order');
assert.ok(api.plan('Bench Press',2).every(e=>e.sets>=3),'Bench support retains recoverable volume');
assert.ok(deadlift.reduce((n,e)=>n+e.sets,0)<=9,'Deadlift accessories stay within nine sets');
assert.ok(deadlift.every(e=>e.rir>=3));
assert.equal(api.plan('Deadlift',6).length,0,'Week 6 allows full recovery');
const schedule=api.schedule();
assert.equal(schedule.valid,true);
assert.equal(schedule.slots.length,4);
assert.equal(schedule.slots.filter(x=>x.kind==='ascension').length,3);
assert.equal(schedule.slots.filter(x=>x.kind==='support').length,1);
assert.ok(schedule.slots[3].exercises.length>0);
assert.ok(schedule.slots[3].exercises.every(ex=>ex.sets===3),'Day 4 support uses three sets in standard weeks');
assert.ok(api.plan('Bench Press',4).every(ex=>ex.sets===3),'Taper week may reduce accessory sets');
// Day 4 has direct arm work at controlled RPE in every training focus.
for(const focus of ['strength','balanced','hypertrophy']){
 api.save({focus});
 const day4=api.schedule().slots[3];
 assert.equal(day4.kind,'support');
 assert.equal(day4.exercises.length,5,'Five moderate upper-body exercises are prescribed');
 assert.ok(day4.exercises.every(ex=>ex.sets===3),
  'Day 4 '+focus+' uses three working sets');
 for(const name of ['Triceps Pushdown (Bar)','Dumbbell Curl']){
  const ex=day4.exercises.find(e=>e.name===name);
  assert.ok(ex,'Day 4 '+focus+' includes '+name);
  assert.equal(ex.min,10);assert.equal(ex.max,15);assert.equal(ex.targetRpe,7);
 }
}
api.save({focus:'strength'});
for(const [week,expected] of [[4,3],[5,3],[6,0]]){
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
assert.ok(api.schedule().slots[3].exercises.some(ex=>ex.name==='Bench Press'),
 'Upper Assistance replaces the Machine Chest Press with Bench Press');
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
// Classic AscensionX support now uses relevant prior exercise history even
// when the athlete has not yet completed that exercise in the current cycle.
// Never borrow an unrelated exercise's load or revise a saved session.
const nonCycle={sessions:[{date:'2026-11-10T08:00:00Z',exercises:[{
 name:'Iso-Lateral Row',sets:[
  {weight:'40',reps:'12',rpe:'6',type:'Working Set',done:true},
  {weight:'40',reps:'12',rpe:'6',type:'Working Set',done:true}]
}]}]};
localStorage.setItem('spartx_db',JSON.stringify(nonCycle));
assert.ok(api.plan('Bench Press',3).find(e=>e.name==='Iso-Lateral Row').suggestedKg>40,
 'Previous completed exercise-specific sessions seed an adaptive load');
assert.equal(api.plan('Bench Press',3).find(e=>e.name==='Iso-Lateral Row').targetReps,8,
 'After reaching the top of the range, repeat minimum reps at the new suggested weight');
assert.ok(api.schedule().slots[3].exercises.some(e=>e.name==='Iso-Lateral Row'&&e.suggestedKg>40),
 'The fourth support day receives the same exercise-specific load recommendation');
const overEffort={sessions:[{date:'2026-11-10T08:00:00Z',exercises:[{
 name:'Iso-Lateral Row',sets:[
  {weight:'40',reps:'7',rpe:'9.5',type:'Working Set',done:true},
  {weight:'40',reps:'7',rpe:'9.5',type:'Working Set',done:true}]
}]}]};
localStorage.setItem('spartx_db',JSON.stringify(overEffort));
assert.ok(api.plan('Bench Press',3).find(e=>e.name==='Iso-Lateral Row').suggestedKg<40,
 'Missed reps and excessive RPE yield a modest suggested load reduction');
localStorage.setItem('spartx_db',JSON.stringify(nonCycle));
assert.equal(api.plan('Bench Press',4).find(e=>e.name==='Iso-Lateral Row').suggestedKg,37.5,
 'Heavy classic weeks taper accessory loads instead of raising them');
assert.equal(localStorage.getItem('ascensionx_strength_v1'),before,
 'Adaptive support calculations never edit the classic programme');
const newHostHtml=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
assert.ok(/id="sxAscensionBetaPreviewCard"[^>]*hidden/.test(newHostHtml),
 'The separate AscensionX 2.0 programme card is hidden');
assert.ok(newHostHtml.includes("weight:Number(ex.suggestedKg)>0?String(ex.suggestedKg):''"),
 'Support day import prepopulates the suggested weight for all classic support exercises');

localStorage.setItem('ascensionx_strength_v1',cycle(['Back Squat','Bench Press','Deadlift','Overhead Press']));
api.save({days:3});
assert.equal(api.schedule().valid,false,'Cannot assign four independent compounds to three separate days');
localStorage.setItem('ascensionx_strength_v1',cycle(['Back Squat','Bench Press','Deadlift'],6));
api.save({days:4});
assert.equal(api.schedule().slots.find(x=>x.kind==='support').exercises.length,0,'Deload week has no support work');
const fresh='2026-11-10T11:00:00.000Z';
localStorage.setItem('ascensionx_strength_v1',JSON.stringify({cycle:{created:fresh,exercises:['Bench Press'],weeks:{'Bench Press':1}},logs:[]}));
assert.equal(api.enabled(fresh),false,'New cycle must opt in independently');

// An existing four-day AscensionX cycle, already on Week 4, must use the
// updated support prescription WITHOUT creation or cycle reset.
const savedClassic=JSON.parse(cycle(['Back Squat','Bench Press','Deadlift'],4));
savedClassic.profile={max:{'Back Squat':185,'Bench Press':160,'Deadlift':215},rounding:2.5,tmPct:95};
savedClassic.cycle.trainingMaxes={'Bench Press':150};
const oldClassicJson=JSON.stringify(savedClassic);
const oldHistoryJson=JSON.stringify({sessions:[{date:'2026-11-15T12:00:00Z',
 exercises:[{name:'Leg Press',sets:[
 {weight:'140',reps:'10',rpe:'7',done:true,type:'Working Set'},
 {weight:'140',reps:'10',rpe:'7',done:true,type:'Working Set'}]}]}]});
const existingLive=boot({
 'ascensionx_strength_v1':oldClassicJson,
 'spartx_db':oldHistoryJson,
 'sx_ascension_adaptive_v1':JSON.stringify({[id]:{enabled:true,focus:'strength',days:4}})
});
const activeSupport=existingLive.api.schedule().slots[3];
assert.equal(activeSupport.title,'Upper Assistance - Week 4');
assert.equal(activeSupport.exercises[0].name,'Bench Press');
assert.equal(activeSupport.exercises[0].sets,3);
assert.equal(activeSupport.exercises[0].suggestedKg,90,
 'Upper assistance bench is derived conservatively from its existing 150 kg TM');
assert.ok(existingLive.api.formatPrescription(activeSupport.exercises[0]).includes('90 kg × 8 reps'),
 'Live cycle exposes the prescribed load and reps');
assert.equal(existingLive.api.plan('Back Squat',4)[0].name,'Leg Press',
 'Active cycle uses logged machine history to select a familiar quad support exercise');
assert.equal(existingLive.localStorage.getItem('ascensionx_strength_v1'),oldClassicJson,
 'Replanning support never resets a started main-lift cycle');
assert.equal(existingLive.localStorage.getItem('spartx_db'),oldHistoryJson,
 'Replanning support never edits completed workout records');
const liveCycleHtml=fs.readFileSync(path.join(__dirname,'../../AscensionX/index.html'),'utf8');
assert.ok(liveCycleHtml.includes('api.formatPrescription?.(ex)')&&
 liveCycleHtml.includes('adaptive.formatPrescription?.(ex)')&&
 liveCycleHtml.includes('SXAscensionAdaptive?.formatPrescription?.(ex)'),
 'View Cycle, six-week roadmap, and Continue show the same live support prescription');

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
 assert.ok(entries.every(ex=>!/Paused Bench Press/i.test(ex.name)),
  'Paused Bench stays retired');
 if(lift==='Deadlift')assert.ok(entries.some(ex=>ex.name==='Romanian Deadlift'&&ex.sets.length===3),
  'Deadlift day includes prescribed Romanian Deadlifts');
}
assert.ok(adaptive.schedule(null,legacyStorage).slots.find(slot=>slot.kind==='support').exercises.every(ex=>
 !/(?:Romanian Deadlift|Paused Bench Press)/i.test(ex.name)),
 'Day 4 does not add a second fatiguing hinge');
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
assert.ok(ascHtml.includes('cycleEditorOpenedFromWorkout=!!workoutCycleReturnSource()')&&
 ascHtml.includes("if(!cycleEditorOpenedFromWorkout&&history.state?.screen!=='programme')"),
 'Native Manage Cycle recognises Workout as its origin before creating any editor history');
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
assert.ok(week5Done.api.schedule().slots[3].exercises.length>=5&&
 week5Done.api.schedule().slots[3].exercises.every(ex=>ex.sets===3),
 'Week 5 retains five low-fatigue upper-body exercises with three sets');

// Three lifts can be on different weeks; the fourth day cannot inherit
// Week 5 just because Squat and Bench are ahead of Deadlift.
const staggered=JSON.stringify({cycle:{
 created:id,exercises:['Back Squat','Bench Press','Deadlift'],
 weeks:{'Back Squat':5,'Bench Press':5,Deadlift:4},currentWeek:5
},logs:[]});
const stagger=boot({'ascensionx_strength_v1':staggered});
stagger.api.save({enabled:true,days:4,focus:'strength'});
const staggerSchedule=stagger.api.schedule(null,stagger.localStorage);
assert.deepEqual(Array.from(staggerSchedule.slots.slice(0,3).map(s=>s.week)),[5,5,4],
 'Main lift weeks must remain independently tracked');
assert.equal(staggerSchedule.slots[3].week,4,
 'Support day must follow lagging deadlift Week 4 rather than force Week 5');
assert.ok(staggerSchedule.slots[3].exercises.length>=3,
 'Mixed-week Day 4 must retain a useful upper-body support session');
assert.ok(staggerSchedule.slots[3].exercises.every(e=>e.sets>=2),
 'Mixed-week Day 4 cannot collapse to one working set');
assert.ok(stagger.api.plan('Deadlift',4,{},stagger.localStorage).every(e=>e.sets>=2),
 'Week 4 deadlift low-fatigue assistance should retain two sets');
assert.equal(stagger.localStorage.getItem('ascensionx_strength_v1'),staggered,
 'Adjusting assistance must not rewrite the existing cycle');
const rootHost=fs.readFileSync(path.join(__dirname,'../../tools/replica.js'),'utf8');
assert(ascHtml.includes("type:'spartx:ascensionCycleCreated'")&&
 ascHtml.includes("if(!existing&&!returnToSpartanX)showScreen('workout')"),
 'Embedded cycle creation must signal SpartanX, standalone can use its native Workout');
assert(rootHost.includes("window.spartanxOpenEmbeddedAscensionX=")&&
 rootHost.includes("url.searchParams.set('sxIntegrated','1')")&&
 rootHost.includes("window.location.assign(url.toString())"),
 'Tools and Workout now launch the first-party AscensionX programme page');
assert(!rootHost.includes('ascensionXEmbedFrame')&&
 !rootHost.includes('ascensionPortalHost'),
 'AscensionX no longer uses an iframe or embedded portal');
assert(ascHtml.includes('sx_ascension_native_import_v1')&&
 hostHtml.includes('SpartanXStartAscensionAdaptiveSupportSession'),
 'The native support workout uses the existing SpartanX logger');
assert(hostHtml.includes("['intelligence','ascension'].includes(query.get('sxReturn'))"),
 'Intelligence and AscensionX must preserve their return tab');

// Native AscensionX navigation must preserve source scroll position across a
// full-page round trip, and use the shared back-arrow element, not bare text.
assert.ok(rootHost.includes("rememberAscensionReturnScroll('tools')")&&
 rootHost.includes('rememberAscensionReturnScroll(from)')&&
 rootHost.includes("source,top,inner,toolsMain,at:Date.now()"),
 'Both the Tools link and Workout quick-access preserve their launch position');
assert.ok(hostHtml.includes("sxPageScrollPositions.set(source,{top:modulePosition.top,inner:modulePosition.inner})")&&
 hostHtml.includes("window.addEventListener('load',afterLayout"),
 'Return to AscensionX source tab restores position after page layout');
assert.ok(ascHtml.includes(`a.innerHTML=\'<span class="sx-page-back-arrow"`)&&
 ascHtml.includes("history.scrollRestoration='manual'")&&
 ascHtml.includes("window.addEventListener('pageshow',afterNativeLayout"),
 'Native AscensionX uses visible back-arrow component and starts at the top');
assert.ok(rootHost.includes('class="ascension-launch">OPEN ASCENSIONX</a>')&&
 !rootHost.includes('OPEN ASCENSIONX <span'),
 'Tools AscensionX launch button has no decorative arrow');

// Intelligence now uses the same first-party return navigation as AscensionX.
assert.ok(hostHtml.includes("'sx_intelligence_return_scroll_v1'")&&
 hostHtml.includes("query.get('sxReturn')==='ascension'?")&&
 hostHtml.includes("['intelligence','ascension'].includes(query.get('sxReturn'))"),
 'Returning from Intelligence restores the original Tools/Workout scroll position');
assert.ok(rootHost.includes("rememberAscensionReturnScroll('tools','intelligence')")&&
 rootHost.includes('#ascensionXToolCard .ascension-launch,.sx-tools-intelligence-card a.sx-intelligence-entry-link')&&
 rootHost.includes('sxIntegrated=1'),
 'Intelligence Tools button saves its source and uses an integrated module route');
assert.ok(rootHost.includes("prefetchTrainingModules()")&&
 rootHost.includes("link.rel='prefetch'"),
 'Tools prefetches integrated programme pages without mounting duplicate engines');
assert.ok(hostHtml.includes('OPEN SPARTANX INTELLIGENCE</a>')&&
 !hostHtml.includes('OPEN SPARTANX INTELLIGENCE ↗</a>'),
 'SpartanX Intelligence launch no longer displays an arrow');

// Native AscensionX is part of SpartanX, not a second bottom-tab app.
assert.ok(ascHtml.includes('body.sx-ascension-native-page > nav[aria-label="Main navigation"]{display:none!important}'),
 'The old AscensionX bottom nav is hidden only in integrated mode');
assert.ok(ascHtml.includes("document.documentElement.dataset.sxIntegratedCycleRoute=q.get('mode')")&&
 ascHtml.includes("if(!window.__sxAscNative)showScreen('home',false)")&&
 ascHtml.includes('if(!window.__sxAscNative)renderDashboard()'),
 'View Cycle opens as a focused native page without the dashboard behind it');
assert.ok(ascHtml.includes('html[data-sx-integrated-cycle-route="manage"] body > main')&&
 ascHtml.includes("document.body.classList.add('sx-asc-workout-manage','sx-asc-cycle-page')"),
 'Manage Cycle hides the home dashboard from first paint');
assert.ok(hostHtml.includes('sx-profile-scroll-end-parity')&&
 hostHtml.includes('main > #profile.screen > .spartanx-page-footer'),
 'Profile removes its excess bottom runway without touching other tabs');

// Workout > 3 dots > View Cycle / Manage Cycle: both Back controls return to
// SpartanX Workout without first exposing the AscensionX Home dashboard.
assert.ok(ascHtml.includes("function workoutCycleReturnSource()")&&
 ascHtml.includes("function returnFromWorkoutCycle(forceReplace=false)")&&
 ascHtml.includes("fallback.searchParams.set('sxReturn','ascension')")&&
 ascHtml.includes("fallback.searchParams.set('sxFrom',source)"),
 'Both focused cycle screens target their original SpartanX Workout page');
assert.ok(ascHtml.includes('if(returnFromWorkoutCycle())return;')&&
 ascHtml.includes('if(returnFromWorkoutCycle(fromPopState))return;')&&
 ascHtml.includes('if(workoutCycleReturnSource()){\n  returnFromWorkoutCycle(true);'),
 'View, Manage and browser Back navigate before revealing AscensionX Home');
assert.ok(ascHtml.includes("if(!workoutCycleReturnSource()){\n  showScreen('home',false);")&&
 !ascHtml.includes("renderAll();showScreen('home',false);history.replaceState"),
 'Focused native routes do not initialize a Home navigation history entry');
assert.ok(ascHtml.includes("window.__sxAscNative=q.get('sxIntegrated')==='1'")&&
 ascHtml.includes("cycleEditorOpenedFromWorkout=!!workoutCycleReturnSource()"),
 'Native routing metadata is available before the original AscensionX init runs');

// A completed support workout must not be invalidated by new prescription
// sizes after an engine update (old Week 5 was one set).
const oneSetLegacy=['Machine Chest Press','Iso-Lateral Row'].map(name=>({
 name,sxPowerbuildingSupport:{cycleId:id,week:5,day:'SAT'},
 sets:[{weight:30,reps:10,done:true,type:'Working Set'}]
}));
week5Done.localStorage.setItem('spartx_db',JSON.stringify({sessions:[{
 date:'2026-11-20T15:00:00.000Z',exercises:oneSetLegacy
}]}));
assert.equal(week5Done.api.pendingSupportDay(),null,
 'Previously completed one-set Day 4 must not be scheduled again after volume upgrade');
// New sessions keep their original prescription metadata, so revised plans
// also cannot retroactively invalidate completed assistance.
const originalSupport=['Machine Chest Press','Iso-Lateral Row','Lateral Raise'].map(name=>({
 name,sxPowerbuildingSupport:{cycleId:id,week:5,day:'SAT',plannedSets:1,plannedExerciseCount:3},
 sets:[{weight:30,reps:10,done:true,type:'Working Set'}]
}));
week5Done.localStorage.setItem('spartx_db',JSON.stringify({sessions:[{
 date:'2026-11-20T16:00:00.000Z',exercises:originalSupport
}]}));
assert.equal(week5Done.api.pendingSupportDay(),null,
 'A completed support workout must use saved original set counts, not future target counts');
week5Done.localStorage.setItem('spartx_db',JSON.stringify({sessions:[{
 date:'2026-11-20T16:00:00.000Z',exercises:originalSupport.slice(0,2)
}]}));
assert.equal(week5Done.api.pendingSupportDay()?.week,5,
 'A support session missing one of its originally planned exercises remains incomplete');
// Cycle views and embedded SW must load the current live support programme.
assert.ok(ascHtml.includes('../assets/ascension/adaptive-programming.js?v=420'),
 'Embedded AscensionX must reference the current adaptive build');
assert.ok(ascHtml.includes('holder.appendChild(sxBuildAdaptiveCycleRoster())'),
 'View Cycle displays live adaptive training days');
assert.ok(!ascHtml.includes('<div id="sxCycleManageLiveSnapshot"')&&
 !ascHtml.includes('sxRenderManageAdaptiveRoster();'),
 'Manage Cycle removes the duplicated adaptive support roster');
assert.ok(ascHtml.includes('Six-week accessory roadmap'),
 'View Cycle also shows a six-week accessory overview');
const embeddedSw=fs.readFileSync(path.join(__dirname,'../../AscensionX/sw.js'),'utf8');
assert.ok(embeddedSw.includes('ascensionx-shell-v131')&&embeddedSw.includes('adaptive-programming.js?v=420'),
 'Embedded service-worker shell caches the current engine');
const quickAccess=fs.readFileSync(path.join(__dirname,'quick-access.js'),'utf8');

// Native Continue stays over SpartanX Workout, with source-prescribed sets.
const sharedPrescription=fs.readFileSync(path.join(__dirname,'workout-prescription.js'),'utf8');
assert.ok(sharedPrescription.includes('SXAscensionPrescription=Object.freeze')&&
 ascHtml.includes('SXAscensionPrescription.build(state,lift,localStorage)')&&
 hostHtml.includes('workout-prescription.js?v=421'),
 'Both the programme page and Workout popup use the shared import calculator');
assert.ok(quickAccess.includes('sxAscModalOpen(state.upNext?.lift)')&&
 quickAccess.includes("overlay.id='sxAscContinueBackdrop'")&&
 quickAccess.includes('function sxAscModalClose()')&&
 quickAccess.includes('window.spartanxImport531?.(workout)===true'),
 'Continue is an in-place native dialog with direct Cancel and Load');
assert.ok(rootHost.includes('window.spartanxOpenAscensionWorkoutPopup(lift)'),
 'Continue shortcuts route to the native Workout popup');
assert.ok(ascHtml.includes("title.textContent=sessionName+' - Day '+(index+1)+' Week '+slot.week")&&
 ascHtml.includes('const sessionName=slot.kind'),
 'View Cycle shows Day N Week N titles without abbreviated weekdays');
assert.ok(ascHtml.includes('id="saveCycleSelectionBtn"')&&
 fs.readFileSync(path.join(__dirname,'cycle-builder-ui.css'),'utf8')
 .includes('#cycleEditorBackdrop .cycle-editor-actions #saveCycleSelectionBtn'),
 'Manage Cycle Save Changes matches the View Cycle Save button');

assert.ok(quickAccess.includes('pendingSupportDay?.()')&&
 quickAccess.includes("lift:'__ADAPTIVE_SUPPORT__'"),
 'Workout Continue must select the fourth day in preference to the next Squat');
assert.ok(ascHtml.includes("pendingSupport=adaptive?.pendingSupportDay?.()")&&
 ascHtml.includes("pendingSupport&&support?'__ADAPTIVE_SUPPORT__'"),
 'Both AscensionX Continue entry points must preselect Day 4');

// Day 4 import uses the real AscensionX iframe mounted in SpartanX's
// open Shadow DOM. A document-level getElementById lookup silently misses it.
const shadowSource={sent:[],postMessage(message,origin){this.sent.push({message,origin})}};
const realFrame={contentWindow:shadowSource};
const frameHost={shadowRoot:{getElementById:name=>name==='ascensionXEmbedFrame'?realFrame:null}};
const routed={};
const accepted=[],responses=[];
const frameWindow={
 localStorage:storage({'ascensionx_strength_v1':nextWeekCycle}),
 location:{origin:'https://example.test'},
 document:{
  readyState:'loading',
  getElementById:name=>name==='sxAscensionPortalHost'?frameHost:null,
  addEventListener(){}
 },
 addEventListener:(type,fn)=>{routed[type]=fn},
 CustomEvent:class {constructor(type,opts){this.type=type;this.detail=opts.detail}},
 dispatchEvent:event=>responses.push(event),
 SpartanXStartPowerbuildingSupportSession:payload=>{accepted.push(payload);return true}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'adaptive-programming.js'),'utf8'),{window:frameWindow});
frameWindow.SXAscensionAdaptive.save({enabled:true,days:4,focus:'strength'});
const realSlot=frameWindow.SXAscensionAdaptive.schedule().slots[3];
const validMessage={data:{type:'spartx:ascensionAdaptiveSupport',requestId:'day4-1',
 payload:{cycleId:id,week:2,day:realSlot.day,name:realSlot.title}},
 origin:frameWindow.location.origin,source:shadowSource};
routed.message({...validMessage,origin:'https://attacker.test'});
routed.message({...validMessage,source:{}});
assert.equal(accepted.length,0,'Only the actual same-origin iframe can start Day 4');
routed.message(validMessage);
assert.equal(accepted.length,1,'Day 4 request reaches the SpartanX workout loader');
assert.equal(accepted[0].week,2,'Support import uses the completed week, not the next squat week');
assert.equal(accepted[0].exercises.length,realSlot.exercises.length);
assert.equal(shadowSource.sent[0].message.type,'spartx:ascensionImportResult');
assert.equal(shadowSource.sent[0].message.success,true);
assert.equal(shadowSource.sent[0].message.requestId,'day4-1');
assert.equal(responses[0].type,'spartx:ascensionAdaptiveSupportResult');
assert.equal(responses[0].detail.success,true);

// Adaptive assistance selection follows compound exposure, calendar and
// the athlete's recorded fatigue, not a permanent fourth-day template.
function assistCase(lifts,days,week=2){
 const x=boot({'ascensionx_strength_v1':cycle(lifts,week)});
 x.api.save({enabled:true,focus:'strength',days});
 return x;
}
const upperCase=assistCase(['Back Squat','Bench Press','Deadlift'],4,5);
assert.equal(upperCase.api.schedule().slots[3].title,'Upper Assistance - Week 5');
assert.ok(upperCase.api.schedule().slots[3].exercises.some(e=>e.name==='Dumbbell Curl'));
assert.ok(upperCase.api.schedule().slots[3].exercises.some(e=>e.name==='Triceps Pushdown (Bar)'));
const lowerCase=assistCase(['Back Squat','Bench Press','Overhead Press'],4);
assert.equal(lowerCase.api.schedule().slots[3].title,'Lower Assistance - Week 2');
assert.ok(lowerCase.api.schedule().slots[3].exercises.every(e=>
 !['Hack Squat','Leg Press','Romanian Deadlift'].includes(e.name)));
const balancedCase=assistCase(['Back Squat','Bench Press','Deadlift','Overhead Press'],5);
assert.equal(balancedCase.api.schedule().slots[4].title,'Balanced Assistance - Week 2');
assert.ok(balancedCase.api.schedule().slots[4].exercises.every(e=>e.sets<=2));
assert.equal(assistCase(['Back Squat','Bench Press','Deadlift'],3).api.schedule().slots.length,3);
const twoAssist=boot({'ascensionx_strength_v1':nextWeekCycle});
twoAssist.api.save({enabled:true,focus:'strength',days:5});
assert.equal(twoAssist.api.pendingSupportDay()?.day,'SAT');
const satSlot=twoAssist.api.schedule().slots.find(slot=>slot.kind==='support'&&slot.day==='SAT');
const satDone=satSlot.exercises.map(ex=>({
 name:ex.name,sxPowerbuildingSupport:{cycleId:id,week:2,day:'SAT',
  plannedSets:ex.sets,plannedExerciseCount:satSlot.exercises.length},
 sets:Array.from({length:ex.sets},()=>({weight:40,reps:12,rpe:7,type:'Working Set',done:true}))
}));
twoAssist.localStorage.setItem('spartx_db',JSON.stringify({sessions:[{
 date:new Date().toISOString(),exercises:satDone
}]}));
assert.equal(twoAssist.api.pendingSupportDay()?.day,'SUN');
assert.equal(twoAssist.api.pendingSupportDay()?.title,'Balanced Assistance - Week 2');
assert.equal(twoAssist.api.schedule().slots.find(slot=>slot.day==='SUN').week,2);
const fatigueCase=assistCase(['Back Squat','Bench Press','Deadlift'],4);
const stress=count=>JSON.stringify({sessions:[{date:new Date().toISOString(),
 exercises:[{name:'Bench Press',ascensionLink:{cycleId:id,lift:'Bench Press'},
 sets:Array.from({length:count},()=>({type:'Working Set',done:true,weight:110,reps:3,rpe:9}))}]
}]});
fatigueCase.localStorage.setItem('spartx_db',stress(1));
assert.equal(fatigueCase.api.schedule().slots[3].role,'upper');
fatigueCase.localStorage.setItem('spartx_db',stress(2));
assert.equal(fatigueCase.api.schedule().slots[3].role,'balanced');
const adaptiveSource=fs.readFileSync(path.join(__dirname,'adaptive-programming.js'),'utf8');
assert.ok(adaptiveSource.includes("slot.kind==='support'?slot.title:slot.day+' · '+slot.title"));
assert.ok(adaptiveSource.includes("prescription.textContent=formatPrescription(ex)"));
assert.ok(adaptiveSource.includes("context.textContent=String(ex.reason"));
assert.ok(adaptiveSource.includes("If hanging irritates a shoulder, swap for Cable Crunch"));

assert.ok(ascHtml.includes("title.textContent=sessionName+' - Day '+(index+1)+' Week '+slot.week"));
assert.ok(ascHtml.includes('function nextAscensionSupportSlot(){'));

// Week 5 squat work must remain fixed in exactly the same exercise order
// throughout plan, live schedule, and Continue's imported prescription.
const week5Order=boot({'ascensionx_strength_v1':cycle(['Back Squat','Bench Press','Deadlift'],5)});
week5Order.api.save({enabled:true,focus:'strength',days:4});
const correctOrder=['Hack Squat','Leg Extension','45° Back Extension','Hanging Knee Raise'];
assert.deepEqual(Array.from(week5Order.api.plan('Back Squat',5),ex=>ex.name),correctOrder);
assert.deepEqual(Array.from(week5Order.api.schedule().slots[0].exercises,ex=>ex.name),correctOrder);
assert.ok(!week5Order.api.plan('Back Squat',5).some(ex=>ex.name==='Pallof Press'));
assert.equal(week5Order.api.plan('Back Squat',5).at(-1).sets,3);
assert.ok(fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8').includes(
 'const sequence=api.forImport(d,[],localStorage).map(x=>x.name)'),
 'SpartanX should use the live prescription order rather than a hard-coded squat sequence');

// Lock the four-day programme to three working sets in every loading
// week, without mutating historical workout records.
for(const focus of ['strength','balanced','hypertrophy']){
 for(let week=1;week<=6;week++){
  const item=boot({'ascensionx_strength_v1':cycle(['Back Squat','Bench Press','Deadlift'],week)});
  item.api.save({enabled:true,focus,days:4});
  const squatPlan=item.api.plan('Back Squat',week);
  const deadliftPlan=item.api.plan('Deadlift',week);
  const supportPlan=item.api.schedule().slots[3].exercises;
  if(week===6){
   assert.equal(squatPlan.length,0);
   assert.equal(deadliftPlan.length,0);
   assert.equal(supportPlan.length,0);
  }else{
   assert.deepEqual(Array.from(squatPlan.map(e=>e.name)),
    ['Hack Squat','Leg Extension','45° Back Extension','Hanging Knee Raise']);
   assert.deepEqual(Array.from(deadliftPlan.map(e=>e.name)),
    ['Romanian Deadlift','Lat Pulldown','Seated Leg Curl']);
   for(const [label,exercises] of [['squat',squatPlan],['deadlift',deadliftPlan],['assistance',supportPlan]])
    assert.ok(exercises.length>0&&exercises.every(ex=>ex.sets===3),
     focus+' Week '+week+' '+label+' requires exactly three working sets');
   assert.equal(deadliftPlan[0].tmPercent,45);
   assert.equal(deadliftPlan[0].targetRpe,7);
  }
  assert.equal(item.api.schedule().slots[3].title,'Upper Assistance - Week '+week);
 }
}
assert.ok(ascHtml.includes("i===0?'Top Set':'Back down '+i"),
 'Working-set preview labels Top Set and numbered Back down sets');
assert.ok(ascHtml.includes("W'+(i+1)+' · '"),
 'Warm-up preview labels W1 through W4 individually');
assert.ok(ascHtml.includes('asc-spartan-set-line'),
 'Warm-up and working sets are placed on separate rows');
// Build 394: Upper Assistance uses the barbell bench as a secondary,
// technique-focused exposure, never another main AscensionX top set.
for(const focus of ['strength','balanced','hypertrophy']){
 for(const week of [1,2,3,4,5,6]){
  const b=boot({'ascensionx_strength_v1':cycle(['Back Squat','Bench Press','Deadlift'],week)});
  b.api.save({enabled:true,focus,days:4});
  const slot=b.api.schedule().slots[3];
  if(week===6){
   assert.equal(slot.exercises.length,0,'Week 6 remains accessory free');
   continue;
  }
  assert.equal(slot.exercises[0].name,'Bench Press',focus+' Week '+week+' starts with bench assistance');
  assert.ok(!slot.exercises.some(ex=>ex.name==='Machine Chest Press'||
   ex.name==='Incline Dumbbell Press'),'No legacy first chest press in Upper Assistance');
  assert.equal(slot.exercises[0].sets,3,'Three supplementary bench sets in every loading week');
  assert.equal(slot.exercises[0].min,8);assert.equal(slot.exercises[0].max,10);
  assert.equal(slot.exercises[0].targetRpe,week<=3?7:6);
  assert.equal(slot.exercises[0].suggestedKg,null,'Athlete establishes a safe support bench load');
  assert.ok(!b.api.plan('Bench Press',week).some(ex=>ex.name==='Bench Press'),
   'Secondary bench does not appear as a main bench accessory');
 }
}
// Existing or completed support-day sets must not be relabelled as bench
// presses, because machine loads have different effective resistance.
const replaceSource=fs.readFileSync(path.join(__dirname,'../workouts/exercise-replacement.js'),'utf8');
const replaceWindow={};
vm.runInNewContext(replaceSource,{window:replaceWindow});
const originalLink={cycleId:id,week:2,day:'SAT',plannedSets:3,plannedExerciseCount:5,
 repsMin:8,repsMax:12,rir:3};
function supportDraft(weight='',done=false){
 return [{name:'Machine Chest Press',
  sxPowerbuildingSupport:{...originalLink},
  sets:Array.from({length:3},(_,i)=>({
   weight:i===0?weight:'',reps:'8',rpe:'',done:i===0&&done,type:'Working Set'
  }))}];
}
const newBench={name:'Bench Press',sets:3,min:8,max:10,rir:3,rest:150,targetRpe:7};
const forBenchMigration={
 activeCycle:()=>({id}),
 enabled:()=>true,
 schedule:()=>({valid:true,slots:[{kind:'support',day:'SAT',week:2,exercises:[newBench]}]})
};
const freshSupport=supportDraft();
assert.equal(replaceWindow.SpartanXExerciseReplacement.upgradeUntouchedSupportBench(
 freshSupport,forBenchMigration),1);
assert.equal(freshSupport[0].name,'Bench Press');
assert.equal(freshSupport[0].sxPowerbuildingSupport.plannedSets,3);
assert.equal(freshSupport[0].sets.length,3);
assert.equal(replaceWindow.SpartanXExerciseReplacement.upgradeUntouchedSupportBench(
 freshSupport,forBenchMigration),0,'Migration occurs only once');
for(const entered of [supportDraft('70'),supportDraft('70',true)]){
 assert.equal(replaceWindow.SpartanXExerciseReplacement.upgradeUntouchedSupportBench(
  entered,forBenchMigration),0,'Never overwrite an entered or completed set');
 assert.equal(entered[0].name,'Machine Chest Press');
}
assert.ok(hostHtml.includes('upgradeUntouchedSupportBench(work,window.SXAscensionAdaptive)'),
 'Restored active SpartanX support draft must invoke safe bench migration');

console.log('AscensionX adaptive programming: tests passed');

// Recover a saved assistance session without duplicate logging.
function check(api,store,assert){
 const id='2026-11-01T10:00:00.000Z',lifts=['Back Squat','Bench Press','Deadlift'];
 const cycle=JSON.stringify({cycle:{created:id,exercises:lifts,weeks:Object.fromEntries(lifts.map(l=>[l,5])),currentWeek:5},logs:lifts.map(lift=>({cycleId:id,lift,week:4,setsComplete:true,date:'2026-11-20T10:00:00Z'}))});
 store.setItem('ascensionx_strength_v1',cycle);api.save({enabled:true,days:4,focus:'strength'},store);
 const session={id:123,date:'2026-11-21T14:00:00Z',name:'Upper Assistance - Week 4',exercises:[{name:'Bench Press',sets:[{weight:100,reps:8,done:true,type:'Working Set'}]}]};
 const saved=JSON.stringify({sessions:[session]});store.setItem('spartx_db',saved);
 const c=api.activeCycle(store);
 assert(api.pendingSupportDay(c,store)?.week===4,'unlinked session requires confirmation');
 assert(api.supportCandidates(c,'SAT',4,store).length===1,'saved session found');
 assert(!api.confirmSavedSupport('other',store),'no arbitrary completion');
 assert(api.confirmSavedSupport('123',store),'confirmed');
 assert(api.pendingSupportDay(c,store)===null,'advance to week five');
 assert(store.getItem('spartx_db')===saved&&store.getItem('ascensionx_strength_v1')===cycle,'history unchanged');
 store.setItem('spartx_db',JSON.stringify({sessions:[]}));
 assert(api.pendingSupportDay(c,store)?.week===4,'deleted record invalidates confirmation');
 const wrong={...session,id:456,exercises:[{...session.exercises[0],sxPowerbuildingSupport:{cycleId:'older-cycle',week:4,day:'SAT'}}]};
 store.setItem('spartx_db',JSON.stringify({sessions:[wrong]}));
 assert(api.supportCandidates(c,'SAT',4,store).length===0,'wrong cycle rejected');
 const linked={...session,id:789,exercises:[{...session.exercises[0],sxPowerbuildingSupport:{cycleId:id,week:4,day:'sat',plannedSets:1,plannedExerciseCount:1}}]};
 store.setItem('spartx_db',JSON.stringify({sessions:[linked]}));
 assert(api.pendingSupportDay(c,store)===null,'linked day recognised');
}
{const recovery=boot({});check(recovery.api,recovery.localStorage,(value,message)=>assert.ok(value,message));}

// Separate selectable support from the automatic next-workout recommendation.
function testSelectableSupport(api,store,assert){
 const id="2026-11-01T10:00:00.000Z",lifts=["Back Squat","Bench Press","Deadlift"];
 const state={cycle:{created:id,exercises:lifts,weeks:Object.fromEntries(lifts.map(l=>[l,5])),currentWeek:5},logs:lifts.map(lift=>({cycleId:id,lift,week:4,setsComplete:true,date:"2026-11-20T10:00:00Z"}))};
 const write=()=>store.setItem("ascensionx_strength_v1",JSON.stringify(state));
 write();api.save({enabled:true,days:4,focus:"strength"},store);
 const due=api.selectableSupportDay(null,store);
 assert(due?.week===4&&due.ready,"Week 4 is selectable when genuinely due");
 const record=(slot,n)=>({id:n,date:"2026-11-21T12:00:00Z",name:slot.title,exercises:slot.exercises.map(e=>({name:e.name,sxPowerbuildingSupport:{cycleId:id,week:slot.week,day:slot.day,plannedSets:e.sets,plannedExerciseCount:slot.exercises.length},sets:Array.from({length:e.sets},()=>({done:true,reps:10,weight:30,type:"Working Set"}))}))});
 const done4=record(due,1);store.setItem("spartx_db",JSON.stringify({sessions:[done4]}));
 const savedCycle=store.getItem("ascensionx_strength_v1");
 assert(api.pendingSupportDay(null,store)===null,"Week 4 no longer auto suggested");
 const upcoming=api.selectableSupportDay(null,store);
 assert(upcoming?.week===5&&upcoming.ready===false&&upcoming.day==="SAT","Week 5 assistance remains selectable");
 assert(upcoming.title.includes("Week 5"),"correct dropdown label");
 assert(store.getItem("ascensionx_strength_v1")===savedCycle,"selecting upcoming support does not alter progression");
 const done5=record(upcoming,2);
 store.setItem("spartx_db",JSON.stringify({sessions:[done5,done4]}));
 assert(api.selectableSupportDay(null,store)===null,"early completed Week 5 cannot load twice");
 state.cycle.weeks=Object.fromEntries(lifts.map(l=>[l,6]));state.cycle.currentWeek=6;state.logs.push(...lifts.map(lift=>({cycleId:id,lift,week:5,setsComplete:true,date:"2026-11-22T10:00:00Z"})));write();
 assert(api.pendingSupportDay(null,store)===null,"early completed support is not re-suggested after compounds");
 assert(api.selectableSupportDay(null,store)===null,"no assistance during deload");
 store.setItem("spartx_db",JSON.stringify({sessions:[done4]}));
 assert(api.selectableSupportDay(null,store)?.week===5&&api.selectableSupportDay(null,store)?.ready===true,"unfinished Week 5 still due before deload");
 api.save({enabled:false},store);assert(api.selectableSupportDay(null,store)===null,"disabled adaptive has no selectable support");
}
{const fixture=boot({});testSelectableSupport(fixture.api,fixture.localStorage,(value,message)=>assert.ok(value,message));}
