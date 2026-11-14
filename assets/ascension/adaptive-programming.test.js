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


console.log('AscensionX adaptive programming: tests passed');
