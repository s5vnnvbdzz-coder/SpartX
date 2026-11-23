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
// Repeated qualifying sets are ONE singular PB — the user's live Bench
// Press and Lateral Raise examples used to show 2–3 duplicate trophies.
const benchHistory=[set(117.5,5),set(100,6)];
const mixedBench=badges('Bench Press',[set(130,5),set(105,8),set(105,8)],benchHistory);
const bestBench=Array.from(mixedBench.filter(item=>item.kind==='repPr'||item.kind==='oneRm'));
assert.equal(bestBench.length,1,'Only one weight-for-reps PB for Bench Press');
assert.equal(bestBench[0].kg,130,'The best new Bench Press set wins');
assert.equal(bestBench[0].reps,5);
assert.equal(mixedBench.filter(item=>item.kind==='estimated').length,1,
 'Estimated 1RM may be shown separately, but never duplicate weight × reps');
const reversedBench=badges('Bench Press',[set(105,8),set(105,8),set(130,5)],benchHistory);
assert.equal(reversedBench.filter(item=>item.kind==='repPr').length,1,
 'Ordering of completed sets must not produce extra PBs');
assert.equal(reversedBench.find(item=>item.kind==='repPr').kg,130);
const repeatRaise=badges('Lateral Raise',
 [set(20,15),set(20,15),set(20,15)],
 [set(15,15)]);
assert.equal(repeatRaise.filter(item=>item.kind==='repPr').length,1,
 'Three identical lateral-raise sets are one PB, not three trophies');
assert.equal(repeatRaise.find(item=>item.kind==='repPr').kg,20);
assert.equal(repeatRaise.find(item=>item.kind==='repPr').reps,15);
const strongerReps=badges('Bench Press',
 [set(105,8),set(105,9)],
 [set(100,8)]);
assert.equal(strongerReps.filter(item=>item.kind==='repPr').length,1);
assert.equal(strongerReps.find(item=>item.kind==='repPr').reps,9,
 'With matching weights, the better rep count is selected');
const actualAndRep=badges('Bench Press',
 [set(120,1),set(105,5)],
 [set(110,1),set(100,5)]);
assert.equal(actualAndRep.filter(item=>item.kind==='oneRm'||item.kind==='repPr').length,1,
 'An actual 1RM and rep PB in the same exercise must still be one principal achievement');
assert.equal(actualAndRep[0].kind,'oneRm',
 'A genuine 1RM takes priority over a multi-rep PB in the same workout');
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
assert.ok(source.includes('session-achievements.js?v=396'),'Release includes new PR engine');
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
