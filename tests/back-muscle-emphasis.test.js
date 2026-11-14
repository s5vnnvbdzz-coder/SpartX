/* node tests/back-muscle-emphasis.test.js
 * Evidence-informed muscle emphasis, exercise search and anatomical displays.
 * Rowing generally biases scapular retractors; vertical pulling biases lats.
 * Sources: Lehman et al. 2004 (PMID 15228624), 2025 pulldown EMG (PMID 40981044).
 * These are coaching defaults, not a quantitative muscle-activation prediction.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('const exerciseNames=[');
const end=html.indexOf('const BODYWEIGHT_EXERCISES=',start);
assert(start>=0&&end>start,'Exercise catalogue and muscle map exist');
const data=new Function(html.slice(start,end)+
 '\nreturn {exerciseNames,exerciseMuscles,muscleNames,MUSCLE_LABELS};')();
const startCats=html.indexOf('const categories={',end);
const endCats=html.indexOf('let sessionStarted=',startCats);
const categories=new Function(html.slice(startCats,endCats)+'\nreturn categories;')();
const rows=categories.Back.filter(name=>/row/i.test(name));
assert(rows.length>=11,'Every listed rowing variation is covered');
for(const name of rows){
 const muscles=data.exerciseMuscles(name);
 assert(muscles.primary.includes('upper_back'),name+' primary: upper back');
 assert(muscles.secondary.includes('lats'),name+' secondary: lats');
 assert(!muscles.primary.includes('lower_back'),name+' does not claim lower-back primary');
}
const vertical=categories.Back.filter(name=>/pulldown|pull-up|chin-up/i.test(name));
assert(vertical.length>=7,'Every vertical pulling variation is covered');
for(const name of vertical){
 const muscles=data.exerciseMuscles(name);
 assert(muscles.primary.includes('lats'),name+' primary: lats');
 assert(muscles.secondary.includes('upper_back'),name+' secondary: upper back');
}
assert.deepEqual(data.exerciseMuscles('Iso-Lateral Row').primary,['upper_back']);
assert.deepEqual(data.exerciseMuscles('Lat Pulldown').primary,['lats']);
assert(data.exerciseMuscles('Deadlift').secondary.includes('lower_back'),
 'Deadlift uses specific erector muscles, not generic back');
assert(data.exerciseMuscles('Romanian Deadlift').secondary.includes('lower_back'),
 'RDL lower-back stabilization remains specified');
assert(data.exerciseMuscles('Rear Delt Reverse Fly').secondary.includes('upper_back'),
 'Rear-delt reverse fly is not misclassified as lat-first');
assert.equal(data.MUSCLE_LABELS.upper_back,'Upper Back');
assert.equal(data.MUSCLE_LABELS.lats,'Lats');
assert.equal(data.MUSCLE_LABELS.lower_back,'Lower Back (Erectors)');
assert.equal(data.muscleNames(['upper_back','lats']),'Upper Back, Lats');
assert(html.includes("Back:['upper_back','lats','lower_back','back','traps']"),
 'Back training radar includes the new back muscle subgroups');
assert(!html.includes("back:'Back (general)'"),
 'No redundant empty general Back line in training breakdown');
const window={};
vm.runInNewContext(fs.readFileSync('assets/anatomy/body-map.js','utf8'),{window});
const anatomy=window.SpartanXAnatomy;
for(const gender of ['male','female']){
 const row=anatomy.render(['upper_back'],['lats'],{gender,compact:true});
 const pull=anatomy.render(['lats'],['upper_back'],{gender});
 assert(/sx-muscle-primary" data-region="upper-back"/.test(row),
  gender+': upper back primary on rows');
 assert(/sx-muscle-secondary" data-region="lats"/.test(row),
  gender+': lats secondary on rows');
 assert(/sx-muscle-primary" data-region="lats"/.test(pull),
  gender+': lats primary on pulldowns');
 assert(/sx-muscle-secondary" data-region="upper-back"/.test(pull),
  gender+': upper back secondary on pulldowns');
 assert.equal((row.match(/data-region="lats"/g)||[]).length,2,
  gender+': left and right lat regions have independent highlights');
 assert.equal((row.match(/data-region="upper-back"/g)||[]).length,
  gender==='male'?4:2,gender+': remaining inner upper-back paths are distinct');
 assert(/data-region="lower-back"/.test(anatomy.render(['lower_back'],[],{gender})),
  gender+': erectors show independently');
 const legacy=anatomy.render(['back'],[],{gender});
 assert(/sx-muscle-primary" data-region="lats"/.test(legacy),
  gender+': old general-back mapping still renders');
}
console.log('PASS: '+rows.length+' row and '+vertical.length+
 ' vertical pull variants have specific muscle roles; both anatomy diagrams render upper back and lats separately.');
