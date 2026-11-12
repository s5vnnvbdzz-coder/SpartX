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
    forge:document.body.classList.contains('sx-crimson-forge')
   };
  });
  assert.equal(data.theme,expected,path+' theme');
  assert.ok(data.accent.startsWith('#'),path+' accent');
  assert.ok(data.background.startsWith('#'),path+' background');
  assert.ok(data.colour.startsWith('#'),path+' text');
  return data;
 }
 try{
  await setTheme('crimson-forge');
  let root=await inspect('/index.html','crimson-forge');
  assert.equal(root.accent,'#ff4654');
  assert.equal(root.forge,true);
  assert.equal(await page.locator('option[value="crimson-forge"]').count(),1);
  await page.screenshot({path:'crimson-forge-home-desktop.png'});
  await page.waitForFunction(()=>document.getElementById('native531Host')?.classList.contains('theme-crimson-forge'),null,{timeout:10000});
  await inspect('/tools/settings.html','crimson-forge');
  assert.equal(await page.locator('#crimsonForgeThemeToggle').isChecked(),true);
  await inspect('/AscensionX/index.html?from=spartanx','crimson-forge');
  await page.waitForFunction(()=>document.body.dataset.theme!=='dark',null,{timeout:10000});
  await inspect('/intelligence/index.html','crimson-forge');
  // Check cross-page consistency for contrasting existing theme families.
  for(const value of ['cosmic-nebula','spartan-blue','light','spartan-red']){
   await setTheme(value);
   for(const url of ['/tools/settings.html','/AscensionX/index.html?from=spartanx','/intelligence/index.html']){
    const v=await inspect(url,value);
    assert.notEqual(v.accent,'#ff4654',url+' should not retain Crimson Forge');
   }
  }
  // Reapply and verify a compact mobile viewport and selected-value survival.
  await setTheme('crimson-forge');
  await page.setViewportSize({width:390,height:844});
  await inspect('/index.html','crimson-forge');
  await page.screenshot({path:'crimson-forge-home-mobile.png'});
  await inspect('/tools/settings.html','crimson-forge');
  assert.equal(await page.locator('#crimsonForgeThemeToggle').isChecked(),true,'Settings toggle survives multiple theme changes');
  await page.screenshot({path:'crimson-forge-settings-mobile.png'});
  assert.ok(!errors.some(x=>/shared-theme|crimson-forge/i.test(x)),
    'No palette-specific runtime errors: '+errors.slice(0,5).join(' / '));
  console.log('Theme test passed: new theme and four legacy themes remain consistent across app surfaces.');
 }catch(error){
  try{await page.screenshot({path:'crimson-forge-failure.png'})}catch(_){}
  console.error('Recent errors:',errors.slice(-10));
  throw error;
 }finally{await browser.close()}
}
main().catch(err=>{console.error(err);process.exit(1)});
