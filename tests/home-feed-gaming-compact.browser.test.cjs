'use strict';
/* Local Playwright smoke for compact gaming workout-feed profile cards.
 * Run via the theme browser workflow with a local HTTP server at :4173.
 */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function run(){
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.SpartanXXP?.calculate==='function'
    &&typeof renderWorkoutFeed==='function'&&typeof window.SpartanXSocial?.cardStatsMarkup==='function');
  await page.evaluate(()=>{
   localStorage.setItem('spartanx_profile_cards_enabled_v1','true');
   localStorage.setItem('spartanx_prestige_level_v1','1');
   db.profile={...db.profile,name:'QA Athlete',countryPublic:true,countryCode:'GB',
    country:'United Kingdom',standard:'male'};
   db.sessions=[{id:'compact-layout-test',date:'2026-11-21T15:00:00.000Z',
    name:'Bench Press - Week 4',duration:4800,volume:750,
    exercises:[{name:'Back Squat',sets:[{weight:150,reps:5,done:true,type:'Working Set'}]}]}];
   renderWorkoutFeed();
  });
  const card=page.locator('#workoutFeed .sx-gamer-card.sx-with-session-log').first();
  await card.waitFor({timeout:15000});
  for(const width of [390,320,430,768]){
   await page.setViewportSize({width,height:844});
   const m=await card.evaluate(card=>{
    const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();
     return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,center:r.left+r.width/2}};
    const social=card.querySelector('.sx-feed-social-metrics');
    const emblem=card.querySelector('.sx-gamer-emblem.sx-portrait-frame-slot');
    const flag=card.querySelector('.sx-portrait-country-flag');
    const top=card.querySelector('.sx-gamer-top');
    const rank=card.querySelector('.sx-rank-line');
    const pr=card.querySelector('.sx-best-pr-line');
    const session=card.querySelector('.sx-session-log');
    const followers=social?.querySelector('[data-sx-social-jump="followers"]');
    const following=social?.querySelector('[data-sx-social-jump="following"]');
    const border=el=>getComputedStyle(el).borderBottomWidth;
    const font=el=>Number.parseFloat(getComputedStyle(el).fontSize);
    return {
     card:rect(card),name:rect(card.querySelector('.sx-gamer-top>strong')),
     rank:rect(rank),pr:rect(pr),
     prestige:rect(card.querySelector('.sx-gamer-prestige')),
     emblem:rect(emblem),flag:rect(flag),
     social:rect(social),session:rect(session),
     followers:rect(followers),following:rect(following),
     followerLabelSize:font(followers),followerNumberSize:font(followers?.querySelector('strong')),
     followingLabelSize:font(following),followingNumberSize:font(following?.querySelector('strong')),
     separators:[top,rank,pr].map(border),
     separatorWidths:[top,rank,pr].map(el=>rect(el)?.w),
     socialAlignment:getComputedStyle(social).justifyContent,
     flagWithinEmblem:emblem?.contains(flag),
     flagInRank:rank?.contains(flag),
     flagLoaded:!!flag?.querySelector('img[src*="ranks/flags/gb.svg"]'),
     socialLinks:social?.querySelectorAll('button[data-sx-social-jump]').length,
     prestigeAction:card.querySelector('.sx-gamer-prestige')?.hasAttribute('data-open-prestige-showcase'),
     scrollOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     lineDirection:getComputedStyle(rank).flexDirection,
     sessionTitle:session?.querySelector('.sx-session-title')?.textContent?.trim()
    };
   });
   assert(m.flagLoaded&&m.flagWithinEmblem&&!m.flagInRank,'Country flag belongs beneath portrait, not rank line: '+width);
   assert.equal(m.socialLinks,2,'Follower and Following buttons survive reflow');
   assert(m.separators.every(width=>width==='1px'),
    'Name, rank and PR each have their own separator line: '+JSON.stringify(m));
   assert(m.separatorWidths.every(width=>width>40),
    'Separator rules remain visible on small screens: '+JSON.stringify(m));
   assert.equal(m.socialAlignment,'flex-start','Followers/Following group near each other');
   assert(Math.abs(m.followerLabelSize-m.followerNumberSize)<.2
    && Math.abs(m.followingLabelSize-m.followingNumberSize)<.2,
    'Follower and Following numbers are exactly the same size as their labels: '+JSON.stringify(m));
   assert(m.following.x-m.followers.right<=22 && m.following.x-m.followers.right>=0,
    'Social metrics are grouped close together without overlapping: '+JSON.stringify(m));
   assert(m.prestigeAction,'Prestige Showcase button remains interactive');
   assert.equal(m.sessionTitle,'Bench Press - Week 4','Saved workout remains unchanged');
   assert.equal(m.lineDirection,'column','Rank stacks directly beneath name');
   assert(m.rank.y>=m.name.y && m.rank.y-m.name.y<48,'Rank moves directly under name: '+JSON.stringify(m));
   assert(m.pr.y>m.rank.y && m.pr.y-m.name.y<112,'Compound PR follows rank near header: '+JSON.stringify(m));
   assert(m.prestige.x>=m.rank.right-2,'Prestige does not obstruct rank or compound PR: '+JSON.stringify(m));
   assert(Math.abs(m.flag.center-m.emblem.center)<3,'Country flag centred underneath rank frame: '+JSON.stringify(m));
   assert(m.flag.y>=m.emblem.bottom-2,'Country flag is below picture frame: '+JSON.stringify(m));
   assert(m.flag.bottom<=m.session.y+10,'Flag should not collide with the session row: '+JSON.stringify(m));
   assert(m.pr.bottom<=m.social.y+2,'PR ends above followers: '+JSON.stringify(m));
   assert(m.social.bottom<=m.session.y+10,'Followers remain above the workout title: '+JSON.stringify(m));
   assert(m.scrollOverflow<=2,'No sideways scroll at '+width+'px: '+JSON.stringify(m));
   if(width===390){
    assert(m.card.h<270,'Compact mobile card is shorter than the old oversized presentation: '+JSON.stringify(m));
    await card.screenshot({path:'gaming-profile-compact-390.png'});
   }
  }
  console.log('PASS: compact card, three dividers, matching social typography and close spacing at 4 widths');
  if(errors.length)console.log('Browser warnings:',errors.slice(0,5));
 }catch(e){
  try{await page.screenshot({path:'gaming-profile-compact-failure.png'})}catch(_){}
  console.error('Page errors:',errors.slice(-10));
  throw e;
 }finally{await browser.close()}
}
run().catch(error=>{console.error(error);process.exit(1)});
