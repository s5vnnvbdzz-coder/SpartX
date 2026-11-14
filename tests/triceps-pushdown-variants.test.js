/* node tests/triceps-pushdown-variants.test.js
 * Verify attachment-specific exercise selection and classification.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const adaptive=fs.readFileSync('assets/ascension/adaptive-programming.js','utf8');
const companion=fs.readFileSync('assets/bodybuilding/ascension-companion.js','utf8');
const start=html.indexOf('const exerciseNames=[');
const end=html.indexOf('const BODYWEIGHT_EXERCISES=',start);
assert(start>=0&&end>start,'Exercise catalogue metadata exists');
const {exerciseNames,exerciseMuscles,exerciseSearchAliases}=
 new Function(html.slice(start,end)+
  '\nreturn {exerciseNames,exerciseMuscles,exerciseSearchAliases};')();
const catStart=html.indexOf('const categories={',end);
const catEnd=html.indexOf('let sessionStarted=',catStart);
assert(catStart>=0&&catEnd>catStart);
const categories=new Function(html.slice(catStart,catEnd)+'\nreturn categories;')();
for(const variant of ['Bar','Rope']){
 const name='Triceps Pushdown ('+variant+')';
 assert.equal(exerciseNames.filter(x=>x===name).length,1,'Exactly one '+name);
 assert(categories.Arms.includes(name),'Arms category contains '+name);
 assert.deepEqual(exerciseMuscles(name).primary,['triceps'],'Primary muscle: triceps');
 assert(typeof exerciseSearchAliases[name]==='string','Search aliases for '+name);
 assert(exerciseSearchAliases[name].includes(variant.toLowerCase()),'Find attachment by name');
}
assert(!exerciseNames.includes('Triceps Pushdown'),'Do not offer ambiguous legacy exercise in new workout picker');
assert.deepEqual(exerciseMuscles('Triceps Pushdown').primary,['triceps'],
 'Old training sessions still have muscle metadata');
assert(adaptive.includes("name:'Triceps Pushdown (Bar)'"),'Adaptive lifts use the bar variant');
assert(!adaptive.includes("name:'Triceps Pushdown',"),'No ambiguous adaptive prescriptions');
assert(companion.includes("name:'Triceps Pushdown (Bar)'"),'Legacy AscensionX companion uses bar');
assert(html.includes('renameActiveAscensionPushdowns(work,window.SXAscensionAdaptive)'),
 'Restore active-session migration on app reopen');
console.log('PASS: Rope and Bar pushdowns are distinct, while current AscensionX uses Bar and preserves active workout linkage.');
