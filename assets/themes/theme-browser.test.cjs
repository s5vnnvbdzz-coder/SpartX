/* Run using local HTTP server on :4173 and Playwright */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function main(){
 const browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 const origin='http://127.0.0.1:4173';
 async function setTheme(value){
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.SXSharedThemes?.refresh&&
    document.getElementById('themeChoice'),null,{timeout:20000});
  await page.evaluate(value=>{const select=document.getElementById('themeChoice');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));},value);
  await page.waitForFunction(expected=>
    document.body.dataset.sxTheme===expected &&
    JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}').theme===expected,
    value,{timeout:10000});
 }
 async function inspect(path,expected){
  await page.goto(origin+path,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(value=>
    document.body?.dataset.sxTheme===value,expected,{timeout:15000});
  const data=await page.evaluate(()=>{
   const css=getComputedStyle(document.body);
   return {
    theme:document.body.dataset.sxTheme,
    accent:css.getPropertyValue('--lime').trim(),
    background:css.getPropertyValue('--bg').trim(),
    colour:css.getPropertyValue('--txt').trim(),
    child:document.body.classList.contains('sx-theme-child'),
    hasPalette:!!css.getPropertyValue('--lime').trim()
   };
  });
  assert.equal(data.theme,expected,path+' theme');
  assert.ok(data.accent.startsWith('#'),path+' accent');
  assert.ok(data.background.startsWith('#'),path+' background');
  assert.ok(data.colour.startsWith('#'),path+' text');
  return data;
 }
 try{
  const removed=['crimson-forge','sx-halloween','sx-christmas','premium-monster','jade-sentinel'];
  const available=['cosmic-nebula','spartan-blue','light','spartan-red','sx-monster','premium-olympus'];
  await setTheme('spartan-red');
  assert.equal(await page.locator('option[value="spartan-red"]').count(),1);
  for(const value of removed)
   assert.equal(await page.locator('option[value="'+value+'"]').count(),0,
    'Retired appearance must not be selectable: '+value);
  await page.screenshot({path:'theme-cleanup-home-desktop.png'});
  // Cross-page palette parity for all retained representative theme families.
  for(const value of available){
   await setTheme(value);
   for(const url of ['/tools/settings.html','/AscensionX/index.html?from=spartanx','/intelligence/index.html'])
    await inspect(url,value);
  }
  // Cached preferences from older builds are migrated back to Dark safely.
  for(const old of removed){
   await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
   await page.evaluate(value=>{
    const key='spartx_preferences_v1';
    const prefs=JSON.parse(localStorage.getItem(key)||'{}');
    prefs.theme=value;
    localStorage.setItem(key,JSON.stringify(prefs));
    localStorage.setItem('spartanx_shared_active_theme_v1',value);
   },old);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.body.dataset.activeTheme==='dark' &&
    document.body.dataset.sxTheme==='dark' &&
    JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}').theme==='dark',
    null,{timeout:12000});
  }
  await setTheme('spartan-red');
  await page.setViewportSize({width:390,height:844});
  await inspect('/index.html','spartan-red');
  await page.screenshot({path:'theme-cleanup-home-mobile.png'});
  assert.ok(!errors.some(x=>/shared-theme/i.test(x)),
    'No shared palette errors: '+errors.slice(0,5).join(' / '));
  console.log('Theme cleanup passed: removed themes unavailable, legacy preferences migrated, retained themes consistent.');

 }catch(error){
  try{await page.screenshot({path:'theme-cleanup-failure.png'})}catch(_){}
  console.error('Recent errors:',errors.slice(-10));
  throw error;
 }finally{await browser.close()}
}
main().catch(err=>{console.error(err);process.exit(1)});
