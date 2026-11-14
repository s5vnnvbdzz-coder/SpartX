/* node tests/rear-delt-variants-library.test.js
 * Check three distinct rear-delt entries and the designated AscensionX Iso variant.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const builder=fs.readFileSync('assets/bodybuilding/programme-builder.js','utf8');
const adaptive=fs.readFileSync('assets/ascension/adaptive-programming.js','utf8');
const start=html.indexOf('const exerciseNames=[');
const end=html.indexOf('const BODYWEIGHT_EXERCISES=',start);
assert(start>=0&&end>start,'Library catalogue and muscle mapping available');
const info=new Function(html.slice(start,end)+
 '\nreturn {exerciseNames,exerciseMuscles,exerciseSearchAliases};')();
const begin=html.indexOf('const categories={',end);
const finish=html.indexOf('let sessionStarted=',begin);
assert(begin>=0&&finish>begin,'Library categories available');
const categories=new Function(html.slice(begin,finish)+'\nreturn categories;')();
const variants=['Cable Rear Delt Fly','Single-Arm Cable Rear Delt Fly','Iso Rear Delt Fly'];
for(const name of variants){
 assert.equal(info.exerciseNames.filter(n=>n===name).length,1,'Unique exercise: '+name);
 assert(categories.Shoulders.includes(name),'Shoulders tab includes '+name);
 assert.deepEqual(info.exerciseMuscles(name).primary,['shoulders'],'Primary rear deltoids: '+name);
 assert(info.exerciseMuscles(name).secondary.includes('back'),'Secondary back: '+name);
 assert(info.exerciseMuscles(name).secondary.includes('traps'),'Secondary traps: '+name);
 assert(info.exerciseSearchAliases[name],'Search aliases: '+name);
}
assert(info.exerciseMuscles('Single-Arm Cable Rear Delt Fly').secondary.includes('core'),
 'Single-arm stabilization includes core');
assert.deepEqual(info.exerciseMuscles('Cable Rear Delt Fly (Single)').primary,['shoulders'],
 'Single-arm cable nickname resolves correctly');
assert.deepEqual(info.exerciseMuscles('cable rear delt fly single').primary,['shoulders'],
 'Single-arm search alias resolves correctly');
assert.deepEqual(info.exerciseMuscles('iso lateral rear delt fly').primary,['shoulders'],
 'Iso-lateral search alias resolves correctly');
assert(info.exerciseNames.includes('Rear Delt Fly')&&info.exerciseNames.includes('Reverse Pec Deck'),
 'Existing exercises remain available');
assert(adaptive.includes("name:'Iso Rear Delt Fly'"),
 'The active AscensionX programme selects Iso Rear Delt Fly');
assert(!adaptive.includes("name:'Rear Delt Fly'"),
 'The original rear-delt movement is no longer prescribed by AscensionX');
assert(!variants.slice(0,2).some(x=>adaptive.includes("name:'"+x+"'")),
 'The two cable variants stay optional rather than programmed');
assert(builder.includes("typeof exerciseNames!=='undefined'&&Array.isArray(exerciseNames)"),
 'Programme builder can use updated shared catalogue');
console.log('PASS: Three rear-delt variations in the library; Iso is the current AscensionX programme choice.');
