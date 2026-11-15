/* node tests/home-feed-card-refinements.test.js
 * Feed spotlight selection, preserved social actions and unified CTA styling.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/profile/feed-card-refinements.css','utf8');
const social=fs.readFileSync('social.js','utf8');
const start=html.indexOf('// Keep the spotlight stable while Home cards re-render.');
const end=html.indexOf("function buildGamingProfileCard(",start);
assert(start>=0&&end>start,'A single persistent PR spotlight drives the feed');
const listeners={},nodes=[{textContent:''},{textContent:''}];
const doc={hidden:true,addEventListener:(name,handler)=>{listeners[name]=handler},
 querySelectorAll:(q)=>q==='[data-sx-compound-pr]'?nodes:[]};
const pr={squat:150,bench:100,deadlift:160};
const helper=new Function('document','getCompoundBest','kg','Math',
 html.slice(start,end)+'\nreturn {text:sxCompoundSpotlightText,rotate:sxRotateCompoundSpotlight,index:()=>sxCompoundSpotlightIndex};')
 (doc,k=>pr[k],v=>v+' kg',{random:()=>0,floor:Math.floor});
assert.equal(helper.text(),'SQUAT · 150 kg','Initial spotlight selects one compound');
assert.equal(helper.index(),0);
assert(typeof listeners.visibilitychange==='function','App foreground is observed');
doc.hidden=false;listeners.visibilitychange();
assert.equal(helper.text(),'BENCH PRESS · 100 kg','Foreground cycles to another compound');
assert.equal(nodes[0].textContent,helper.text(),'Existing rendered cards update in place');
doc.hidden=true;listeners.visibilitychange();
assert.equal(helper.index(),1,'Background event does not reroll');
doc.hidden=false;listeners.visibilitychange();
assert.equal(helper.text(),'DEADLIFT · 160 kg','Third compound has its own recorded PR');
assert(html.includes('<span data-sx-compound-pr>'),'Feed exposes a targeted spotlight field');
assert(html.includes('const bestText=sxCompoundSpotlightText()'),
 'Feed re-renders do not randomise the spotlight');
assert(html.includes('window.SpartanXSocial.cardStatsMarkup()'),
 'Profile card retains the existing social action markup');
assert(social.includes('data-sx-social-jump="followers"')&&
 social.includes('data-sx-social-jump="following"'),
 'Followers and Following stay clickable');
for(const property of ['background:transparent!important','border:0!important',
 'box-shadow:none!important','min-height:44px!important']){
 assert(css.includes(property),'Social buttons: '+property);
}
assert(css.includes('button[data-sx-social-jump]'),'Style applies only to social buttons');
assert(css.includes('#workoutFeed'),'Avoid removing containers in other social views');
assert.equal((html.match(/class="secondary small feed-view-button" data-feed-toggle/g)||[]).length,2,
 'Both expansion buttons use the exact rounded View Workout button classes');
assert.equal((html.match(/class="secondary small feed-view-button" data-feed-view/g)||[]).length,2,
 'Both View Workout buttons have identical classes');
assert(!html.includes('class="secondary small feed-view-button feed-expand"'),
 'Legacy .feed-expand border-radius:0 no longer applies');
assert(html.includes("button.setAttribute('aria-expanded',String(!expanded))"),
 'The expanded state is updated for assistive technology');
assert(html.includes("extra.children.length===1?'EXERCISE':'EXERCISES'"),
 'Singular exercise label is grammatical');
assert(html.includes('feed-card-refinements.css?v=342'),'Dedicated feed styles are loaded');
console.log('PASS: PR rotates squat / bench / deadlift on app foreground; social links and CTA parity retained.');
