/* node intelligence/bridge.test.js */
'use strict';
const assert=require('node:assert/strict');
global.window=global;
require('./engine.js');
require('./bridge.js');
const B=global.SXBridge;
const E=global.SXEngine;
assert.equal(B.storageKey,'spartx_db');
let getCount=0,writeCount=0;
const mock=raw=>({
  getItem(key){getCount++;assert.equal(key,'spartx_db');return raw;},
  setItem(){writeCount++;throw new Error('Read-only bridge must never write');},
  removeItem(){writeCount++;throw new Error('Read-only bridge must never delete');}
});
assert.equal(B.read(mock(null)).status,'empty');
assert.equal(B.read(mock('{oops')).status,'error');
assert.equal(B.read(mock('{"sessions":{}}')).status,'error');
assert.equal(B.read(mock('{"sessions":[]}')).status,'empty');
const date=new Date(Date.now()-86400000).toISOString();
const session={id:8123,date,name:'Bench and Squat',duration:2400,exercises:[
  {name:'Back Squat',sets:[{weight:120,reps:5,rpe:8,type:'Working Set',done:true},{weight:80,reps:5,rpe:5,type:'Warm-up',done:true}]},
  {name:'Bench Press',sets:[{weight:100,reps:5,rpe:8,type:'Working Set',done:true}]}
]};
const raw=JSON.stringify({profile:{name:'Training Athlete',email:'private@example.com'},sessions:[session,{...session}]});
const source=mock(raw);
const out=B.read(source);
assert.equal(out.status,'connected');
assert.equal(out.sessions.length,1,'Repeated identical session only counted once');
assert.equal(out.rawCount,2,'Original source count preserved');
assert.equal(out.profile.name,'Training Athlete');
assert.equal(Object.hasOwn(out.profile,'email'),false,'Bridge excludes unrelated profile fields');
assert.equal(out.sessions[0].exercises[0].name,'Squat','Back Squat maps to core Squat');
const a=E.analyse(out.sessions,30);
assert.equal(a.strength['Squat'].latest.max,140,'Squat strength derived from 120x5');
assert.equal(a.strength['Bench Press'].latest.max,116.7,'Bench strength derived from 100x5');
assert.equal(B.read({getItem(){throw Error('blocked')}}).status,'unavailable','Blocked localStorage handled');
assert.equal(writeCount,0,'Never called setItem/removeItem on SpartanX storage');
assert.ok(getCount>0);
console.log('PASS — SpartanX Intelligence read-only bridge checks.');
