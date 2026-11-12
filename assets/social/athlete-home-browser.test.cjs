const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function run(){
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.SpartanXSocial?.openSearch &&
    document.getElementById('sxSocialToggle'),null,{timeout:20000});
  assert.equal(await page.locator('#home #sxSocialHome').count(),0,'Remove former Home search card');
  const header=page.locator('#home .sx-home-titlebar');
  assert.equal(await header.locator('h1').innerText(),'Home');
  const action=header.locator('#sxSocialToggle');
  assert.equal(await action.locator('svg').count(),1,'Search icon integrated with text');
  assert.equal((await action.innerText()).trim(),'Find Athletes');
  const appearance=await action.evaluate(el=>{
   const css=getComputedStyle(el);
   return {border:css.borderTopWidth,background:css.backgroundColor,
     headingY:document.querySelector('#home .sx-home-titlebar h1').getBoundingClientRect().top,
     buttonY:el.getBoundingClientRect().top,
     rankY:document.getElementById('homeRankProgression').getBoundingClientRect().top};
  });
  assert.equal(appearance.border,'0px','No button border');
  assert.equal(appearance.background,'rgba(0, 0, 0, 0)','No visible button container');
  assert.ok(Math.abs(appearance.buttonY-appearance.headingY)<35,'Action aligns with Home title');
  assert.ok(appearance.rankY>appearance.buttonY,'Action above Rank Progression');
  await action.click();
  assert.equal(await page.locator('#athleteSearch.screen.active').count(),1,'Open dedicated Athlete Search page');
  assert.equal(await page.locator('#home.screen.active').count(),0,'Home is hidden while searching');
  assert.equal(await page.locator('#sxSocialBody').isVisible(),true,'Search controls are visible');
  await page.waitForFunction(()=>document.querySelectorAll('#sxSocialResults .sx-social-athlete').length===6,
    null,{timeout:8000});
  await page.locator('#sxAthleteSearchInput').fill('Maya');
  await page.waitForFunction(()=>document.querySelectorAll('#sxSocialResults .sx-social-athlete').length===1);
  const follow=page.locator('#sxSocialResults [data-sx-social-follow]').first();
  await follow.click();
  assert.match(await follow.innerText(),/Following/,'Existing follow controls work');
  await page.locator('#sxSocialBack').click();
  assert.equal(await page.locator('#home.screen.active').count(),1,'Back restores Home');
  assert.equal(await page.locator('#sxSocialBody').isVisible(),false,'Hidden search is not left in Home');
  // Mobile UI retains the same action without overflow.
  await page.setViewportSize({width:390,height:844});
  assert.equal(await action.isVisible(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=2,'Mobile Home has no horizontal overflow');
  await page.screenshot({path:'athlete-home-mobile.png'});
  await action.click();
  assert.equal(await page.locator('#athleteSearch.screen.active').count(),1);
  await page.screenshot({path:'athlete-search-mobile.png'});
  assert.ok(!errors.some(x=>/social|sxSocial/i.test(x)),errors.join(' / '));
  console.log('Home Find Athletes navigation passed at desktop and mobile; original search/follow features retained.');
 }catch(error){
  try{await page.screenshot({path:'athlete-search-failure.png'})}catch(_){}
  console.error('Page errors:',errors.slice(-10));
  throw error;
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exit(1)});
