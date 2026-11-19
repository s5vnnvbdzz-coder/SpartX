const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const client = fs.readFileSync(path.join(__dirname, 'cloud-training.js'), 'utf8');
const original = {
  spartx_db: JSON.stringify({
    profile: {name:'Private Profile',birthday:'2000-01-01',photo:'private-data'},
    sessions: [{id:21,date:'2026-11-19',name:'Deadlift',duration:3000,
      privatePhoto:'not-for-cloud',exercises:[{name:'Deadlift',notes:'Logged RDL after',
        sets:[{weight:170,reps:4,rpe:8,type:'Working Set',done:true,privateMedia:'not-for-cloud'}]}]}]
  }),
  ascensionx_strength_v1: JSON.stringify({
    profile:{name:'Private',max:{Deadlift:215},tmPct:95},
    cycle:{currentWeek:4,exercises:['Deadlift']},
    logs:[{lift:'Deadlift',week:3,sets:[{weight:170,reps:4}]}],
    metrics:[{bodyFat:15}],draft:{active:true}
  })
};
let unexpectedWrite = false, unexpectedFetch = false;
const storage = {
  getItem(key) {return Object.prototype.hasOwnProperty.call(original,key) ? original[key] : null;},
  setItem() {unexpectedWrite=true;},
  removeItem() {unexpectedWrite=true;}
};
const window = {};
const document = {readyState:'loading',addEventListener() {}};
vm.runInNewContext(client,{window,document,localStorage:storage,
  fetch() {unexpectedFetch=true; throw Error('No networking before opt-in');}});
const data = window.SXCloudTraining.trainingDatasets();
assert.equal(data.length,2);
assert.equal(data[0].dataset,'spartx_sessions');
assert.equal(data[1].dataset,'ascensionx_training');
assert.equal(data[0].data.sessions[0].exercises[0].sets[0].weight,170);
assert.equal(data[1].data.logs[0].week,3);
assert.equal(data[1].data.trainingMaxes.Deadlift,215);
const exported = JSON.stringify(data);
for(const forbidden of ['Private Profile','not-for-cloud','bodyFat','privateMedia','active','birthday']) {
  assert.equal(exported.includes(forbidden),false,'Unexpected private field: '+forbidden);
}
assert.equal(unexpectedWrite,false,'Initialisation should not modify workouts');
assert.equal(unexpectedFetch,false,'Initialisation should not transmit workouts');
console.log('Cloud training backup: training-only selection and opt-in safety checks passed.');
