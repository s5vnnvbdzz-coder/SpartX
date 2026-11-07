const assert=require('node:assert/strict');
const fs=require('node:fs');
const content=fs.readFileSync('index.html','utf8');
const a=content.indexOf('function ascensionWorkoutTitle(detail){');
const b=content.indexOf('function startSession(){',a);
assert.ok(a>=0&&b>a,'AscensionX title helpers must exist');
const impl=content.slice(a,b);
const imported=[{
 name:'Back Squat',
 notes:'Imported from AscensionX · Training max 175 kg · Week 2 (Volume progression) · Target RPE 7',
 ascensionLink:{cycleId:'2026-11-03T14:12:00.000Z',lift:'Back Squat',week:2},
 sets:[{weight:'145',reps:'5',done:true}]
}];
function draftTest(currentName,exerciseList,expected,shouldRepair){
 const fields={activeWorkoutName:{textContent:currentName},workoutName:{value:currentName}};
 let updates=0;
 const actions=new Function('work','sessionActive','editingSessionId','$','updateMinimizedSession',impl+
  'return {recoverAscensionWorkoutTitle,ascensionWorkoutTitle,isAutoWorkoutName};')(
   exerciseList,true,null,id=>fields[id],()=>updates++);
 const before=JSON.stringify(exerciseList);
 assert.equal(actions.recoverAscensionWorkoutTitle(),shouldRepair);
 assert.equal(fields.activeWorkoutName.textContent,expected);
 assert.equal(fields.workoutName.value,expected);
 assert.equal(JSON.stringify(exerciseList),before,'Never change logged sets');
 assert.equal(updates,shouldRepair?1:0);
}
draftTest('Afternoon Workout',imported,'Squats (current week) Week 2',true);
draftTest('Morning Workout',imported,'Squats (current week) Week 2',true);
draftTest('Evening Workout',imported,'Squats (current week) Week 2',true);
draftTest('Deadlift · AscensionX',[{
 ...imported[0],name:'Deadlift',
 ascensionLink:{...imported[0].ascensionLink,lift:'Deadlift',week:3}
}],'Deadlifts (current week) Week 3',true);
draftTest('Afternoon Workout',[{
 ...imported[0],ascensionLink:{...imported[0].ascensionLink,cycleTitle:'Strength Cycle'}
}],'Strength Cycle Week 2',true);
draftTest('Afternoon Workout',[{
 ...imported[0],ascensionLink:null
}],'Squats (current week) Week 2',true);
draftTest('My Custom Workout',imported,'My Custom Workout',false);
draftTest('Afternoon Workout',[],'Afternoon Workout',false);
draftTest('Afternoon Workout',[{name:'Back Squat',notes:'Normal workout',sets:[]}],'Afternoon Workout',false);
assert.ok(content.includes('restoreDraft();if(recoverAscensionWorkoutTitle())saveDraft();'),
 'Restored active workouts must be repaired and saved');
assert.ok(content.includes('applyAscensionWorkoutTitle(d);'),
 'Imported workouts must get their name even if exercises already exist');
assert.ok(!content.includes("else if(source==='AscensionX'&&!work.length)"),
 'Old empty-session-only naming check must not return');
console.log('AscensionX active workout naming and draft recovery: PASS');
