'use strict';
/* Browser parity: Home Rank Progression prestige tile must match the
 * Workout Feed profile card and keep the same showcase click target. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.SpartanXXP?.prestigeTier==='function'
   &&typeof renderSpartanProgress==='function'&&typeof renderWorkoutFeed==='function');
  await page.evaluate(()=>{
   localStorage.setItem('spartanx_prestige_level_v1','1');
   localStorage.setItem('spartanx_profile_cards_enabled_v1','true');
   db.profile={...db.profile,name:'QA Athlete',standard:'male',countryCode:'GB',countryPublic:true};
   db.sessions=[{id:'prestige-parity-qa',date:new Date().toISOString(),
    name:'Bench Press - Week 4',duration:1200,volume:450,
    exercises:[{name:'Bench Press',sets:[{weight:90,reps:5,done:true,type:'Working Set'}]}]}];
   renderSpartanProgress();
   renderWorkoutFeed();
  });
  const card=page.locator('#homeRankProgression');
  if(await card.evaluate(el=>el.classList.contains('is-collapsed')))
   await page.locator('#rankCollapseToggle').click();
  const mark=page.locator('#rankPrestigeMark');
  await mark.waitFor({state:'visible'});
  const feed=page.locator('#workoutFeed .sx-gamer-prestige').first();
  await feed.waitFor({state:'visible'});
  const same=await page.evaluate(()=>{
   const rank=document.getElementById('rankPrestigeMark');
   const feed=document.querySelector('#workoutFeed .sx-gamer-prestige');
   return {sameMarkup:rank.innerHTML===feed.innerHTML,
    rankText:rank.innerText,feedText:feed.innerText,
    dataset:rank.dataset.sxPrestigeBand,
    aria:rank.getAttribute('aria-label'),clickable:rank.hasAttribute('data-open-prestige-showcase')};
  });
  assert(same.sameMarkup,'Rank card must use exactly the same laurel/label HTML as feed');
  assert.equal(same.dataset,'bronze');
  assert.match(same.rankText,/PRESTIGE\s+1\s+BRONZE/);
  assert.match(same.aria,/Prestige 1.*bronze laurel/i);
  assert(same.clickable);
  assert(!same.rankText.includes('NEXT P16'),'Remove the old wide upcoming-prestige banner');
  for(const width of [320,375,390,430,768]){
   await page.setViewportSize({width,height:844});
   const m=await page.evaluate(()=>{
    const bounds=el=>{const r=el.getBoundingClientRect();
     return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
    const row=document.getElementById('rankCurrentDetails');
    const badge=document.getElementById('rankPrestigeMark');
    const name=row.querySelector('.rank-current-copy');
    const portrait=row.querySelector(':scope > img');
    const label=badge.querySelector('.sx-prestige-label');
    const number=badge.querySelector('b');
    return {row:bounds(row),badge:bounds(badge),copy:bounds(name),portrait:bounds(portrait),
     brand:label.textContent,number:number.textContent,
     columns:getComputedStyle(row).gridTemplateColumns,
     display:getComputedStyle(badge).display,
     badgeHeight:badge.getBoundingClientRect().height,
     labelSize:parseFloat(getComputedStyle(label).fontSize),
     overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
   });
   assert.equal(m.brand,'PRESTIGE');
   assert.equal(m.number,'1');
   assert(m.badge.w<=67&&m.badge.w>=54,'The tile is compact instead of the wide banner: '+JSON.stringify(m));
   assert(m.badgeHeight>=76&&m.badgeHeight<=112,'Preserve profile-card prestige proportions: '+JSON.stringify(m));
   assert(m.copy.right<=m.badge.x+1,'Prestige tile must not overlap current rank: '+JSON.stringify(m));
   assert(m.badge.right<=m.row.right+1,'Prestige tile must fit within rank card: '+JSON.stringify(m));
   assert(m.portrait.right<=m.copy.x+1,'Portrait and rank text must not overlap: '+JSON.stringify(m));
   assert(m.overflow<=2,'No page overflow: '+width+' '+JSON.stringify(m));
   if(width===390)await card.screenshot({path:'rank-prestige-tile-390.png'});
  }
  await mark.click();
  await page.waitForSelector('#sxPrestigeShowcaseOverlay:not([hidden])');
  assert(await page.locator('#sxPrestigeDialogTitle').isVisible(),
   'Compact Rank Progression prestige tile opens the existing showcase');
  await page.locator('.sx-prestige-dismiss').click();
  assert(!(await page.locator('#sxPrestigeShowcaseOverlay').isVisible()),
   'Prestige Showcase closes normally and restores rank panel');
  // A higher-tier athlete must display the same tier on both surfaces.
  await page.evaluate(()=>{
   localStorage.setItem('spartanx_prestige_level_v1','60');
   renderSpartanProgress();
   renderWorkoutFeed();
  });
  const top=await page.locator('#rankPrestigeMark').evaluate(el=>({band:el.dataset.sxPrestigeBand,
   text:el.innerText,html:el.innerHTML}));
  const game=await page.locator('#workoutFeed .sx-gamer-prestige').first().evaluate(el=>el.innerHTML);
  assert.equal(top.band,'apotheosis');
  assert.match(top.text,/APOTHEOSIS/);
  assert.equal(top.html,game,'Apotheosis P60 shares the same laurel artwork and typography');
  console.log('PASS: same prestige tile on Home and Feed, bronze+Apotheosis, compact grid, showcase and 5 widths');
  if(errors.length)console.log('Browser warnings:',errors.slice(0,4));
 }catch(err){
  try{await page.screenshot({path:'rank-prestige-tile-failure.png'})}catch(_){}
  console.error('Browser errors:',errors.slice(-10));
  throw err;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
