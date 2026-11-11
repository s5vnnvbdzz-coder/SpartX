/* node intelligence/goal.test.js
   Verify the real Strength Target form logic with a minimal browser harness.
   No network, browser automation or changes to the SpartanX workout database. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const engine=read('engine.js');
const bridge=read('bridge.js');
const live=read('live.js');
const app=read('app.js');
assert.match(html,/<input type="text" id="goalInput"[^>]*inputmode="decimal"/,'Goal field must support select-on-focus on iOS');
assert.doesNotMatch(html,/<input type="number" id="goalInput"/,'No invalid native number step constraints');

const db={profile:{name:'Test Athlete'},sessions:[{id:123,date:new Date().toISOString(),name:'Bench',exercises:[{name:'Bench Press',sets:[{done:true,weight:100,reps:5,rpe:8,type:'Working Set'}]}]}]};
const original=JSON.stringify(db);
const store=new Map([['spartx_db',original]]);
const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const elements={};
let doc;
function element(id){
  return elements[id]??(elements[id]={
    id,style:{},dataset:{},value:'',innerHTML:'',textContent:'',listeners:{},selected:false,
    classList:{add(){},remove(){},toggle(){}},
    addEventListener(type,fn){this.listeners[type]=fn},
    setAttribute(){},removeAttribute(){},select(){this.selected=true},
    blur(){doc.activeElement=null},showModal(){},close(){}
  });
}
doc={activeElement:null,getElementById:element,querySelectorAll:()=>[],querySelector:()=>({scrollIntoView(){}}),addEventListener(){}};
const win={localStorage:storage,location:{search:''},addEventListener(){}};
new Function('window',engine)(win);
new Function('window',bridge)(win);
new Function('window',live)(win);
new Function('window','document','localStorage','setTimeout','clearTimeout',app)(win,doc,storage,()=>0,()=>{});

const field=element('goalInput'),form=element('goalForm');
assert.equal(element('goalValue').textContent,'160 kg','Default bench target');
doc.activeElement=field;
field.listeners.focus();
field.listeners.click();
assert.equal(field.selected,true,'Tapping existing goal selects all text');
field.value='200';
form.listeners.submit({preventDefault(){}});
assert.equal(element('goalValue').textContent,'200 kg','Save updates target display');
assert.equal(element('goalBar').style.width,'58%','Save updates progress bar');
assert.match(element('goalStatus').textContent,/Saved Bench Press target: 200 kg/,'Success message');
assert.equal(JSON.parse(store.get('sx_intelligence_linked_goals_v1'))['Bench Press'],200,'Persists in Intelligence-owned key');
assert.equal(store.get('spartx_db'),original,'Never writes to SpartanX workout history');

field.value='160';
form.listeners.submit({preventDefault(){}});
assert.equal(element('goalValue').textContent,'160 kg','Ordinary targets divisible by 2.5 now work');

field.value='175.5';
form.listeners.submit({preventDefault(){}});
assert.equal(element('goalValue').textContent,'175.5 kg','Decimal kg targets accepted');

field.value='invalid';
form.listeners.submit({preventDefault(){}});
assert.equal(element('goalValue').textContent,'175.5 kg','Invalid entry cannot replace saved goal');
assert.match(element('goalStatus').textContent,/between 1 and 1,500 kg/);

console.log('PASS — Strength Target selection, validation, persistence and progress update.');
