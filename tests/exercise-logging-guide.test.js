/* node tests/exercise-logging-guide.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/exercises/exercise-logging-guide.js','utf8');
const css=fs.readFileSync('assets/exercises/exercise-logging-guide.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const context={window:{}};
vm.runInNewContext(source,context);
const guide=context.window.SpartanXExerciseLoggingGuide;
assert(guide&&typeof guide.get==='function'&&typeof guide.open==='function');
let n=0;
function test(name,fn){fn();console.log('PASS',name);n++;}
test('incline dumbbell press logs the TOTAL across both dumbbells',()=>{
 const v=guide.get('Incline Dumbbell Press','kg');
 assert.equal(v.kind,'two-dumbbells');
 assert(v.example.includes('20 kg in each hand = 40 kg logged.'),v.example);
 assert(v.description.includes('combined'));
});
test('seated dumbbell shoulder press, curls and other two-dumbbell exercises use total weight',()=>{
 for(const name of ['Dumbbell Chest Press','Incline Dumbbell Chest Press',
   'Seated Dumbbell Shoulder Press','Dumbbell Curl','Hammer Curl','Lateral Raise','Arnold Press']){
  const v=guide.get(name,'kg');
  assert.equal(v.kind,'two-dumbbells',name);
 }
});
test('the entire explicitly named dumbbell catalogue has a weight-logging rule',()=>{
 const first=html.indexOf('const exerciseNames=['),last=html.indexOf('// Exercise muscle-role data',first);
 const names=[...html.slice(first,last).matchAll(/'([^']+)'/g)].map(m=>m[1]);
 const dumbbells=names.filter(name=>/dumbbell/i.test(name));
 assert(dumbbells.length>=14,'Expected many dumbbell catalogue exercises');
 for(const name of dumbbells)
  assert(['two-dumbbells','one-dumbbell','variable-dumbbell'].includes(guide.get(name).kind),
   'Missing dumbbell guide for '+name);
});
test('single-arm dumbbell row does NOT double the working arm',()=>{
 const v=guide.get('Single-Arm Dumbbell Row');
 assert.equal(v.kind,'one-dumbbell');
 assert(v.example.includes('One 20 kg dumbbell = 20 kg logged.'),v.example);
});
test('Dumbbell Row explains one-arm and two-arm variants',()=>{
 const v=guide.get('Dumbbell Row');
 assert.equal(v.kind,'variable-dumbbell');
 assert(v.description.includes('one-arm'));
 assert(v.description.includes('each hand'));
});
test('Iso-Lateral Row logs both independent 60 kg sides as 120 kg',()=>{
 const v=guide.get('Iso-Lateral Row','kg');
 assert.equal(v.kind,'independent-sides');
 assert(v.example.includes('60 kg on the left + 60 kg on the right = 120 kg logged.'),v.example);
 assert(v.note.includes('added plates'));
});
test('Iso machine guides support other future iso-lateral exercise names',()=>{
 for(const name of ['Iso-Lateral Chest Press','Iso Lateral Shoulder Press','Iso-Lateral High Row'])
  assert.equal(guide.get(name,'kg').kind,'independent-sides',name);
 assert.equal(guide.get('Single-Arm Iso-Lateral Row').kind,'single-side');
});
test('pound preference gives combined loads in lb without converting old history',()=>{
 const v=guide.get('Iso-Lateral Row','lb');
 assert(v.example.includes('60 lb'));
 assert(v.example.includes('120 lb'));
 assert.equal(guide.get('Incline Dumbbell Press','lb').example,
  '20 lb in each hand = 40 lb logged.');
});
test('single-stack machines do NOT double their labelled stack weight',()=>{
 const v=guide.get('Lat Pulldown');
 assert.equal(v.kind,'machine');
 assert(v.note.includes('Never double a single-stack'));
});
test('barbell exercises include the actual bar, not one side only',()=>{
 const v=guide.get('Back Squat');
 assert.equal(v.kind,'barbell');
 assert(v.example.includes('20 kg bar + 20 kg of plates on each end = 60 kg logged.'));
});
test('exercise title is text-only in CSS across active workout themes',()=>{
 assert(css.includes('border-width:0!important'));
 assert(css.includes('background-color:transparent!important'));
 assert(css.includes('box-shadow:none!important'));
 assert(css.includes('outline:0!important'));
 assert(css.includes('flex:0 1 auto!important'));
 assert(css.includes('.sx-exercise-menu-trigger'));
});
test('exercise-title click opens statistics directly and Summary has inline note',()=>{
 assert(html.includes('window.showExercisePR(link.dataset.liveExerciseLink)'));
 assert(!html.includes('window.showExerciseLoggingGuide(link.dataset.liveExerciseLink)'));
 assert(html.includes('id="sxExerciseLoggingSummaryNote"'));
 assert(html.includes('exercise-logging-guide.css?v=303'));
 assert(html.includes('exercise-logging-guide.js?v=303'));
 const stats=fs.readFileSync('assets/exercises/exercise-stats-layout.js','utf8');
 const style=fs.readFileSync('assets/exercises/exercise-stats-layout.css','utf8');
 assert(stats.includes('function drawWeightLoggingSummary()'));
 assert(stats.includes("'How to log: 10 '+unit+' per dumbbell = 20 '+unit+' total."));
 assert(stats.includes("'How to log: 40 '+unit+' per side = 80 '+unit+' total."));
 assert(stats.includes('drawWeightLoggingSummary();drawMetric()'));
 assert(style.includes('#sxExerciseLoggingSummaryNote:not([hidden])'));
});
console.log('Passed '+n+' exercise logging guidance tests.');
