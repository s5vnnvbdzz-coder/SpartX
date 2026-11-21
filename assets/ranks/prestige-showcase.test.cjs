'use strict';
/* node assets/ranks/prestige-showcase.test.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const rankSource=fs.readFileSync(path.join(__dirname,'xp-engine.js'),'utf8');
const source=fs.readFileSync(path.join(__dirname,'prestige-showcase.js'),'utf8');
const listeners={};
const classList=()=>{const values=new Set();return {
 add:k=>values.add(k),remove:k=>values.delete(k),contains:k=>values.has(k)}};
const panelBody={innerHTML:''};
const closeBtn={isConnected:true,focus(){this.focused=true}};
const celebrateBtn={isConnected:true,focus(){this.focused=true}};
const overlay={
 hidden:true,innerHTML:'',dataset:{},classList:classList(),setAttribute(){},
 querySelector(selector){
  if(selector==='#sxPrestigeDialogBody')return panelBody;
  if(selector==='.sx-prestige-dismiss')return closeBtn;
  if(selector==='.sx-prestige-primary')return celebrateBtn;
  return null;
 },querySelectorAll(){return [closeBtn,celebrateBtn]}
};
const trigger={isConnected:true,focused:false,focus(){this.focused=true}};
const document={
 activeElement:trigger,body:{classList:classList(),appendChild(node){assert.equal(node,overlay)}},
 createElement(tag){assert.equal(tag,'div');return overlay},
 addEventListener(name,fn){listeners[name]=fn}
};
const window={document};
vm.runInNewContext(rankSource,{window});
window.getWorkoutRank=()=>({prestige:60,totalXP:360000,cycleXP:0,badgeHighWater:5});
vm.runInNewContext(source,{window});
const P=window.SpartanXPrestigeShowcase;
assert.ok(P&&typeof P.open==='function'&&typeof P.celebrate==='function');
const first=P.describe({prestige:0,totalXP:100,badgeHighWater:0});
assert.equal(first.tier,'none');
assert.equal(first.next.start,1);
assert.equal(first.remaining,1);
assert.equal(first.earnedBadges,1);
assert.equal(first.tiers.filter(t=>t.unlocked).length,0);
for(const [p,band,next] of [[1,'bronze',16],[16,'silver',28],
 [28,'gold',36],[36,'platinum',41],[41,'mythic',60],
 [59,'mythic',60],[60,'apotheosis',null],[87,'apotheosis',null]]){
 const model=P.describe({prestige:p,totalXP:p*6000,badgeHighWater:5});
 assert.equal(model.tier,band,'Tier for P'+p);
 assert.equal(model.next?.start||null,next,'Next tier for P'+p);
 assert.equal(model.tiers.filter(t=>t.current).length,1);
 assert.equal(model.earnedBadges,6);
}
assert(P.open(),'The showcase should open from the prestige trigger');
assert.equal(overlay.hidden,false);
assert.equal(overlay.dataset.sxPrestigeBand,'apotheosis');
assert(panelBody.innerHTML.includes('PRESTIGE SHOWCASE'));
assert(panelBody.innerHTML.includes('LIFETIME XP'));
assert(panelBody.innerHTML.includes('360,000'));
assert(panelBody.innerHTML.includes('SIX LAUREL TIERS'));
assert(panelBody.innerHTML.includes('APOTHEOSIS · P60+'));
assert.equal((panelBody.innerHTML.match(/sx-prestige-stage-gem/g)||[]).length,6);
assert.equal((panelBody.innerHTML.match(/class="sx-prestige-stage (?:current|earned|locked)"/g)||[]).length,6);
assert.equal(P.describe({prestige:60}).progress,1);
P.close();
assert.equal(overlay.hidden,true);
assert.equal(trigger.focused,true,'Dialog closure returns focus to its trigger');
assert(P.celebrate({prestige:60,totalXP:360000,badgeHighWater:5}));
assert.equal(overlay.hidden,false);
assert(overlay.classList.contains('is-celebration'));
assert(panelBody.innerHTML.includes('Apotheosis Unlocked'));
assert(panelBody.innerHTML.includes('VIEW PRESTIGE SHOWCASE'));
assert(panelBody.innerHTML.includes('CONTINUE'));
const viewClick={target:{closest(s){return s==='[data-sx-prestige-view]'?{}:null}}};
listeners.click(viewClick);
assert.equal(overlay.hidden,false);
assert.equal(overlay.classList.contains('is-celebration'),false);
assert(panelBody.innerHTML.includes('SIX LAUREL TIERS'));
listeners.keydown({key:'Escape',preventDefault(){}});
assert.equal(overlay.hidden,true,'Escape dismisses the prestige dialog');
assert.equal(window.SpartanXXP.laurelUpgrade(59,60).name,'apotheosis');
assert.equal(window.SpartanXXP.laurelUpgrade(60,61),null);
console.log('PASS: six-tier prestige showcase, tier unlock celebration and focus-safe dismissal');
