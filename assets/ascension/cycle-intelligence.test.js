/* node assets/ascension/cycle-intelligence.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'cycle-intelligence.js'),'utf8');
const adaptiveSource=fs.readFileSync(path.join(__dirname,'adaptive-programming.js'),'utf8');
const id='2026-11-01T09:00:00.000Z',next='2026-12-15T09:00:00.000Z';
const lifts=['Back Squat','Bench Press','Deadlift'];
const plan=[{rpe:7},{rpe:7},{rpe:7.5},{rpe:8},{rpe:8.5},{rpe:6}];
function boot(store={}){
 const map=new Map(Object.entries(store));
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),snapshot:()=>Object.fromEntries(map)};
 const window={localStorage:storage,addEventListener(){}};
 const ctx=vm.createContext({window});
 vm.runInContext(source,ctx,{filename:'cycle-intelligence.js'});
 return {I:window.SXAscensionCycleIntelligence,window,ctx,storage};
}
const fixture=Array.from({length:6},(_,index)=>lifts.map(lift=>({
 lift,cycleId:id,week:index+1,date:'2026-11-'+String(index+2).padStart(2,'0')+'T12:00:00Z',
 setsComplete:true,sets:[{rpe:plan[index].rpe}],avgRpe:plan[index].rpe
}))).flat();
const accessory=(cycleId,name,date,avg=9.5,nsets=3)=>({
 id:date+'-'+name,date,exercises:[{name,sxPowerbuildingSupport:{cycleId,week:2,day:'SAT'},
  sets:Array.from({length:nsets},()=>({done:true,type:'Working Set',weight:'40',reps:'10',rpe:String(avg)}))}]
});
let count=0;
function check(name,fn){fn();console.log('PASS '+name);count++;}
check('six-week check-in distinguishes completion and high RPE',()=>{
 const {I}=boot(),cycle={created:id,exercises:lifts};
 const logs=fixture.map(x=>({...x}));
 logs.find(x=>x.lift==='Deadlift'&&x.week===3).setsComplete=false;
 logs.find(x=>x.lift==='Bench Press'&&x.week===4).sets=[{rpe:9.5}];
 const review=I.evaluate(cycle,logs,[],plan);
 assert.equal(review.weekly.completed,14);
 assert.equal(review.weekly.possible,15);
 assert.equal(review.weekly.highEffort,1);
 assert.equal(review.weekly.weeks[3].high,1);
 assert.equal(review.readOnly,true);
});
check('data from old cycles cannot affect the next-cycle review',()=>{
 const {I}=boot(),cycle={created:id,exercises:lifts};
 const corrupted=fixture.concat([{lift:'Bench Press',cycleId:'older-cycle',week:1,
  date:'2026-12-01T12:00:00Z',setsComplete:false,sets:[{rpe:10}]}]);
 const r=I.evaluate(cycle,corrupted,[],plan);
 assert.equal(r.weekly.completed,15);assert.equal(r.weekly.highEffort,0);
});
check('high RPE across three valid accessory sessions proposes a modest set reduction',()=>{
 const {I}=boot();
 const days=[2,9,16].map(d=>accessory(id,'Iso-Lateral Row',
  '2026-11-'+String(d).padStart(2,'0')+'T10:00:00Z'));
 const suggestions=I.accessorySuggestions(id,days);
 assert.equal(suggestions.length,1);
 assert.equal(suggestions[0].delta,-1);
 assert.match(suggestions[0].reason,/3 logged sessions/);
});
check('missing effort evidence never gets misinterpreted as low fatigue',()=>{
 const {I}=boot();
 const days=[2,9,16].map(d=>accessory(id,'Iso-Lateral Row',
  '2026-11-'+String(d).padStart(2,'0')+'T10:00:00Z',''));
 assert.equal(I.accessorySuggestions(id,days).length,0);
});
check('unchecked warmups, other cycles and unlinked workouts are excluded',()=>{
 const {I}=boot();
 const otherCycle=accessory('other','Iso-Lateral Row','2026-11-03T10:00:00Z');
 const unlinked=accessory(id,'Iso-Lateral Row','2026-11-05T10:00:00Z');
 delete unlinked.exercises[0].sxPowerbuildingSupport;
 const legit=accessory(id,'Iso-Lateral Row','2026-11-07T10:00:00Z');
 legit.exercises[0].sets.push({done:true,type:'Warm-up',weight:'20',reps:'10',rpe:'9.5'});
 legit.exercises[0].sets.push({done:false,type:'Working Set',weight:'40',reps:'10',rpe:'9.5'});
 const group=I.accessoryLogs(id,[otherCycle,unlinked,legit]);
 assert.equal(group.size,1);
 assert.equal(group.get('isolateralrow').records.length,1);
 assert.equal(group.get('isolateralrow').records[0].sets,3);
});
check('low-RPE sessions do not trigger unnecessary increases',()=>{
 const {I}=boot();
 const days=[2,9,16].map(d=>accessory(id,'Iso-Lateral Row',
  '2026-11-'+String(d).padStart(2,'0')+'T10:00:00Z',7.5));
 assert.equal(I.accessorySuggestions(id,days).length,0);
});
check('only approved changes are stored, scoped to the NEXT cycle',()=>{
 const {I,storage}=boot();
 assert.equal(I.adjustment(next,'Iso-Lateral Row',storage),0);
 assert(I.saveApproved(next,id,[{name:'Iso-Lateral Row',delta:-1},{name:'Unrelated',delta:-25}],storage));
 assert.equal(I.adjustment(next,'Iso-Lateral Row',storage),-1);
 assert.equal(I.adjustment(id,'Iso-Lateral Row',storage),0);
 assert.equal(I.adjustment(next,'Unrelated',storage),0);
});
check('saving new-cycle guidance does not touch strength cycle or workout history',()=>{
 const original=JSON.stringify({cycle:{created:id,exercises:lifts},logs:fixture});
 const work=JSON.stringify({sessions:[accessory(id,'Iso-Lateral Row','2026-11-16T10:00:00Z')]});
 const {I,storage}=boot({'ascensionx_strength_v1':original,'spartx_db':work});
 I.saveApproved(next,id,[{name:'Iso-Lateral Row',delta:-1}],storage);
 assert.equal(storage.getItem('ascensionx_strength_v1'),original);
 assert.equal(storage.getItem('spartx_db'),work);
});
check('approved next-cycle reduction affects accessories, never main lift or taper',()=>{
 const fresh=JSON.stringify({cycle:{created:next,exercises:lifts,
  weeks:Object.fromEntries(lifts.map(lift=>[lift,1])),currentWeek:1},logs:[]});
 const {I,storage,window,ctx}=boot({'ascensionx_strength_v1':fresh});
 vm.runInContext(adaptiveSource,ctx,{filename:'adaptive-programming.js'});
 const A=window.SXAscensionAdaptive;
 A.save({enabled:true,focus:'strength',days:4},storage);
 const before=A.plan('Bench Press',1,{},storage).find(x=>x.name==='Iso-Lateral Row');
 const fourth=A.plan('Bench Press',4,{},storage).find(x=>x.name==='Iso-Lateral Row');
 assert(before&&before.sets>=2);
 assert(I.saveApproved(next,id,[{name:'Iso-Lateral Row',delta:-1}],storage));
 const after=A.plan('Bench Press',1,{},storage).find(x=>x.name==='Iso-Lateral Row');
 assert.equal(after.sets,before.sets-1);
 assert.equal(A.plan('Bench Press',4,{},storage).find(x=>x.name==='Iso-Lateral Row').sets,fourth.sets);
 assert.equal(A.plan('Bench Press',6,{},storage).length,0);
 assert.equal(storage.getItem('ascensionx_strength_v1'),fresh);
});
check('existing review UI uses the same workflow with opt-in controls',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../AscensionX/index.html'),'utf8');
 assert(html.includes('function cycleIntelligenceReview()'));
 assert(html.includes('data-sx-cycle-adjust'));
 assert(html.includes('approvedAssistance'));
 assert(html.includes('saveApproved?.('));
 assert(html.includes('previousCycleId:oldId'));
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert(scripts.length>=1);
 scripts.forEach(match=>new vm.Script(match[1],{filename:'AscensionX inline JS'}));
});
console.log('Passed '+count+' AscensionX cycle-intelligence checks.');
