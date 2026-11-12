/* node tests/intelligence-overview-powerlifting.test.js
 * Overview must prioritise real AscensionX training evidence and leave
 * accessory session details available but secondary.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('intelligence/index.html','utf8');
const app=fs.readFileSync('intelligence/app.js','utf8');
const script=fs.readFileSync('assets/bodybuilding/decision-panels.js','utf8');
const style=fs.readFileSync('intelligence/styles.css','utf8');
const start=html.indexOf('<section class="page active" id="overviewPage"');
const end=html.indexOf('<section class="page" id="performancePage"',start);
assert(start>=0&&end>start);
const page=html.slice(start,end);
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS',name)};
test('powerlifting insights lead the page before strength snapshot and accessories',()=>{
 const priority=page.indexOf('id="sxOverviewAscensionInsights"');
 const snapshot=page.indexOf('id="kpiGrid"');
 const details=page.indexOf('id="sxOverviewSupportingTraining"');
 const sessions=page.indexOf('id="sxLatestWorkoutAnalysis"');
 assert(priority>0&&priority<snapshot&&snapshot<details&&details<sessions);
 assert(page.indexOf('Powerlifting insights')<priority);
 assert(!page.includes('class="hero-card"'),'No marketing hero should displace lift insights');
});
test('latest full-session analysis and exercise volume remain available in collapsible support section',()=>{
 assert(page.includes('<details class="sx-overview-supporting-training"'));
 assert(!page.includes('<details class="sx-overview-supporting-training" open'));
 assert(page.includes('id="sxLatestWorkoutAnalysis"'));
 assert(page.includes('id="sxSessionTrendSelect"'));
 assert(page.includes('id="sxSessionTrendChart"'));
});
test('strength snapshot, 1RM chart and consistency data remain on Overview above accessory analysis',()=>{
 for(const value of ['id="snapshotTitle"','id="overviewChartTitle"','id="overviewStrengthChart"',
  'id="overviewInsights"','id="consistencyChart"']){
  assert(page.includes(value),value);
  assert(page.indexOf(value)<page.indexOf('id="sxOverviewSupportingTraining"'),value+' is below accessories');
 }
});
const nodes={};
function fakeNode(id){
 if(!nodes[id])nodes[id]={id,innerHTML:'',textContent:''};
 return nodes[id];
}
const browser={document:{getElementById:fakeNode}};
vm.runInNewContext(script,{window:browser});
const panel=browser.SXDecisionPanels;
const testCycle={
 status:'evidence',recordedWeeks:6,readOnly:true,
 lifts:[
  {lift:'Back Squat',week:3,recordedWeeks:2,confidence:'early',status:'steady',
   title:'Performance broadly stable',reason:'Maintain current AscensionX loading.',
   latest:{heaviest:150,estimatedMax:171,avgRpe:8},delta:1.4},
  {lift:'Bench Press',week:3,recordedWeeks:2,confidence:'early',status:'positive',
   title:'Positive early strength signal',reason:'Strength estimate increased, interpret cautiously.',
   latest:{heaviest:135,estimatedMax:148.5,avgRpe:8.5},delta:3.4},
  {lift:'Deadlift',week:3,recordedWeeks:2,confidence:'early',status:'watch',
   title:'Review before adding assistance',reason:'Estimated strength was lower.',
   latest:{heaviest:180,estimatedMax:198,avgRpe:9},delta:-4.1}
 ]};
test('displays three independently measured powerlifting lifts and actual AscensionX weeks',()=>{
 panel.overview('host',{ascension:testCycle});
 const rendered=fakeNode('host').innerHTML;
 for(const lift of ['Back Squat','Bench Press','Deadlift'])assert(rendered.includes(lift));
 assert.equal((rendered.match(/WEEK 3 \/ 6/g)||[]).length,3);
 assert.equal((rendered.match(/2 completed linked weeks/g)||[]).length,3);
 assert(rendered.includes('135'));
 assert(rendered.includes('148.5'));
 assert(rendered.includes('RPE')===false,'Keep main focus on strength trend rather than accessory analysis');
 assert(!rendered.includes('accessory sets'),'Overview must not foreground accessory actions');
 assert(rendered.includes('Strength cycle progression'));
});
test('does not invent trends when AscensionX has no completed weeks',()=>{
 const noLogs={status:'waiting',recordedWeeks:0,lifts:[
  {lift:'Back Squat',week:2,recordedWeeks:0,confidence:'insufficient',status:'missing',
   title:'No linked strength sessions yet',reason:'Save completed strength sets to establish a trend.',
   latest:null,delta:null}
 ]};
 panel.overview('emptyLogs',{ascension:noLogs});
 const view=fakeNode('emptyLogs').innerHTML;
 assert(view.includes('WEEK 2 / 6'));
 assert(view.includes('No comparable trend yet'));
 assert(view.includes('— <span>kg</span>'));
});
test('no active cycle produces a clear non-fabricated state',()=>{
 panel.overview('noCycle',{ascension:{status:'no-cycle',lifts:[]}});
 const view=fakeNode('noCycle').innerHTML;
 assert(view.includes('NO ACTIVE CYCLE'));
 assert(view.includes('Activate an AscensionX cycle'));
 assert(!view.includes('WEEK 3 / 6'));
});
test('Overview renderer consumes linked-only read-only engine, not fictional general chart records',()=>{
 assert(app.includes("window.SXDecisionPanels?.overview?.('sxOverviewAscensionInsights')"));
 assert(!app.includes("SXDecisionPanels?.overview?.('sxOverviewAscensionInsights',state.analysis)"));
 assert(style.includes('#overviewPage .sx-overview-lift-grid'));
 assert(style.includes('#overviewPage .sx-overview-supporting-training'));
});
console.log('Passed '+checks+' Powerlifting-first Overview regression checks.');
