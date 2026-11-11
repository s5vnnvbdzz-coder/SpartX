/* node tests/iso-lateral-row-library.test.js
 * Validate the actual app exercise catalogue, muscle profile, category,
 * branded lookup aliases, and bodybuilding-picker compatibility.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const builder=fs.readFileSync('assets/bodybuilding/programme-builder.js','utf8');
const start=html.indexOf('const exerciseNames=[');
const end=html.indexOf('const BODYWEIGHT_EXERCISES=',start);
assert(start!==-1&&end>start,'Exercise catalogue and muscle metadata available');
const snippet=html.slice(start,end);
const data=new Function(snippet+
  '\nreturn {exerciseNames,exerciseMuscles,exerciseSearchAliases};')();
const catStart=html.indexOf('const categories={',end);
const catEnd=html.indexOf('let sessionStarted=',catStart);
assert(catStart>0&&catEnd>catStart,'Exercise categories available');
const categories=new Function(html.slice(catStart,catEnd)+'\nreturn categories;')();
const name='Iso-Lateral Row';
assert.equal(data.exerciseNames.filter(x=>x===name).length,1,'Exactly one exercise catalogue entry');
assert(categories.Back.includes(name),'Available in Back tab');
assert(!categories.Chest?.includes(name),'Not a chest exercise');
const muscles=data.exerciseMuscles(name);
assert.deepEqual(muscles.primary,['back'],'Primary back muscles');
for(const muscle of ['biceps','shoulders','traps','forearms'])
 assert(muscles.secondary.includes(muscle),'Secondary '+muscle);
for(const alias of ['Hammer Strength Iso-Lateral Row','Life Fitness Iso-Lateral Row','Hammer Strength Row'])
 assert.deepEqual(data.exerciseMuscles(alias),muscles,'Brand alias '+alias);
const q=['hammer strength','life fitness','iso lateral','plate loaded'];
for(const word of q)assert(
 name.toLowerCase().includes(word)||(data.exerciseSearchAliases[name]||'').includes(word),
 'Search term '+word);
assert.equal(html.split('name.toLocaleLowerCase().includes(q)||(exerciseSearchAliases[name]||\'\').includes(q)').length-1,2,
 'Library and exercise stats use branded search');
assert(builder.includes("typeof exerciseNames!=='undefined'&&Array.isArray(exerciseNames)"),
 'The bodybuilding editor uses the same library');
assert(html.includes("window.pickExercise(name)"),'Works with the active session exercise picker');
console.log('PASS: Iso-Lateral Row is searchable in Back, has exercise metadata and shares normal logging and stats.');
