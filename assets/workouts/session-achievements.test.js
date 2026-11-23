/* Run: node assets/workouts/session-achievements.test.js */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'session-achievements.js'),'utf8'),context);
const api=context.window.SpartanXSessionAchievements;
const set=(weight,reps,done=true,type='Working Set')=>({weight,reps,done,type});
const history=(name,sets)=>api.historyIndex([{date:new Date().toISOString(),
 exercises:[{name,sets}]}]);
const badges=(name,sets,prior)=>api.forExercise({name,sets},history(name,prior));
const kinds=items=>Array.from(items.map(x=>x.kind));
assert.deepEqual(kinds(badges('Bench Press',[set(105,5)],[set(100,5)])),
 ['repPr','estimated'],'Higher weight for the same reps creates both relevant achievements');
assert.deepEqual(kinds(badges('Bench Press',[set(100,5)],[set(100,5)])),[],
 'Repeating previous best creates no false record');
assert.deepEqual(kinds(badges('Bench Press',[set(95,5)],[set(100,5)])),[],
 'Lighter weight at same reps is not a record');
assert.deepEqual(kinds(badges('Bench Press',[set(100,6)],[set(100,5)])),
 ['repPr','estimated'],'More reps at the same load beats the comparable record');
assert.deepEqual(kinds(badges('Bench Press',[set(112.5,1)],[set(100,1),set(110,2)])),
 ['oneRm'],'An actual new heaviest single is a tested 1RM');
assert.deepEqual(kinds(badges('Bench Press',[set(100,1)],[set(120,2)])),[],
 'A single below a previously lifted double is not a new lifetime maximum');
assert.deepEqual(kinds(badges('Bench Press',[set(105,5,false)],[set(100,5)])),[],
 'Uncompleted working sets never qualify');
assert.deepEqual(kinds(badges('Bench Press',[set(110,5,true,'Warm-up')],[set(100,5)])),[],
 'Warm-up sets do not qualify');
assert.deepEqual(kinds(badges('Bench Press',[set(105,5),set(107.5,5)],[set(100,5)])),
 ['repPr','estimated'],'Repeated record sets on one session collapse to the best');
assert.equal(badges('Bench Press',[set(105,5),set(107.5,5)],[set(100,5)])[0].kg,107.5);
assert.deepEqual(kinds(badges('Bench Press',[set(55,5)],[set(100,5,false),set(50,5)])),
 ['repPr','estimated'],'Historically uncompleted sets cannot establish previous best');
assert.equal(api.forExercise({name:'New exercise',sets:[set(50,5)]},api.historyIndex([])).length,0,
 'First use establishes an exercise baseline, not a PR');
assert.deepEqual(kinds(badges('Leg Press',[set(105,5)],[set(100,5)])),
 ['repPr','estimated'],'Normal exercises outside powerlifting are eligible');
assert.deepEqual(kinds(badges('Bench Press',[set(100,5)],[set(100,5),set(100,6)])),[],
 'Better historical rep performances exclude weaker new sets');
assert.deepEqual(kinds(badges('Bench Press',[set(110,5)],[set(100,5,true,'W')])),
 [],'Warmups alone are not a historical baseline');
const source=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
assert.ok(source.includes('session-achievements.js?v=395'),'Release includes new PR engine');
assert.ok(source.includes('sxLiveAchievementButton(i,e.name,newRecords)'),'Active exercise title has a medal');
assert.ok(source.includes("refreshLiveAchievementBadge(i);\n updateLiveStats();saveDraft();"),
 'Completing and unchecking a set refreshes medals');
assert.ok(source.includes('window.openSessionAchievement=i=>'),
 'Medal opens the achievement popup');
assert.ok(source.includes('editingSessionId!==null||!api'),
 'Editing historical workouts never displays new PR medals');
assert.ok(source.includes('aria-modal="true" aria-labelledby="prTitle"'),
 'Achievement dialog has accessible role and title');
console.log('SpartanX live session achievements: all tests passed');
