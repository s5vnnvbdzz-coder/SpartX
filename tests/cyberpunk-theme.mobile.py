#!/usr/bin/env python3
"""Cyberpunk Black: real mobile theme selection and cross-page parity."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

opts=Options()
opts.add_argument('--headless=new')
opts.add_argument('--no-sandbox')
opts.add_argument('--disable-dev-shm-usage')
opts.add_experimental_option('mobileEmulation',{
 'deviceMetrics':{'width':390,'height':844,'pixelRatio':3}
})
driver=webdriver.Chrome(options=opts)
wait=WebDriverWait(driver,40)
run=lambda code,*args:driver.execute_script(code,*args)
origin='http://127.0.0.1:8765'
def palette(page):
 driver.get(origin+page)
 wait.until(lambda _:run("return !!window.SXSharedThemes && !!document.body.dataset.sxTheme"))
 wait.until(lambda _:run("return document.body.dataset.sxTheme==='cyberpunk-black'"))
 return run("""
  const c=getComputedStyle(document.body);
  return {
   name:document.body.dataset.sxTheme,
   bg:c.getPropertyValue('--bg').trim(),
   panel:c.getPropertyValue('--panel').trim(),
   accent:c.getPropertyValue('--lime').trim(),
   background:c.backgroundColor,
   child:document.body.classList.contains('sx-theme-child'),
   width:document.documentElement.scrollWidth,
   viewport:document.documentElement.clientWidth
  }
 """)
try:
 driver.get(origin+'/index.html?theme=cyberpunk-test')
 wait.until(lambda _:run("return !!document.getElementById('themeChoice') && !!window.SXSharedThemes"))
 assert run("return !!document.querySelector('#themeChoice option[value=\"cyberpunk-black\"]')")
 run("""
  const box=document.getElementById('themeChoice');
  box.value='cyberpunk-black';
  box.dispatchEvent(new Event('change',{bubbles:true}));
 """)
 wait.until(lambda _:run("return document.body.dataset.activeTheme==='cyberpunk-black' && document.body.dataset.sxTheme==='cyberpunk-black'"))
 home=run("""
  const c=getComputedStyle(document.body);
  const first=document.querySelector('#home .card');
  const preview=document.querySelector('.sx-cyberpunk-theme-preview');
  const nav=document.querySelector('#trackerNav button.active');
  const host=document.getElementById('native531Host');
  const planner=host?.shadowRoot?.querySelector('.card');
  const pc=planner?getComputedStyle(planner):null;
  return {
   theme:document.body.dataset.activeTheme,
   background:c.backgroundColor,
   bg:c.getPropertyValue('--bg').trim(),
   accent:c.getPropertyValue('--lime').trim(),
   panel:first?getComputedStyle(first).backgroundImage:null,
   preview:getComputedStyle(preview).display,
   navBorder:nav?getComputedStyle(nav).borderTopColor:null,
   plannerTheme:host?.classList.contains('theme-cyberpunk'),
   plannerAccent:host?getComputedStyle(host).getPropertyValue('--lime').trim():null,
   plannerPanel:pc?.backgroundImage,
   saved:JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}').theme,
   meta:document.querySelector('meta[name=\"theme-color\"]').content
  }
 """)
 assert home['bg']=='#030405' and home['background']=='rgb(3, 4, 5)',home
 assert home['accent']=='#36e5f5' and home['saved']=='cyberpunk-black',home
 assert home['meta']=='#030405' and home['preview']=='flex',home
 assert home['panel'] and 'linear-gradient' in home['panel'],home
 assert home['plannerTheme'] and home['plannerAccent']=='#36e5f5',home
 assert home['plannerPanel'] and 'linear-gradient' in home['plannerPanel'],home
 print('PASS Cyberpunk Black selected on iPhone and applies to tracker, preview and 5/3/1 shadow planner',flush=True)

 # Main secondary pages must keep the selected look without removing
 # navigation, reloading or losing a saved theme.
 run("document.getElementById('openProfileSettings').click()")
 wait.until(lambda _:run("return document.querySelector('#profileSettingsOverlay.screen.active')!==null"))
 assert run("return getComputedStyle(document.body).getPropertyValue('--bg').trim()")=='#030405'
 assert run("return getComputedStyle(document.getElementById('profileSettingsOverlay')).backgroundColor")!='rgb(255, 255, 255)'
 print('PASS Profile Settings follows Cyberpunk with the shared page styling',flush=True)
 driver.get(origin+'/index.html?theme=cyberpunk-reopen')
 wait.until(lambda _:run("return document.body.dataset.activeTheme==='cyberpunk-black'"))
 assert run("return document.querySelector('#themeChoice').value")=='cyberpunk-black'
 print('PASS Cyberpunk remains selected on app reopen',flush=True)

 for page in ['/tools/settings.html','/AscensionX/index.html?from=spartanx',
              '/intelligence/index.html','/intelligence/goals.html']:
  result=palette(page)
  assert result['bg']=='#030405', (page,result)
  assert result['accent']=='#36e5f5',(page,result)
  assert result['width']<=result['viewport']+2,(page,result)
  if page=='/tools/settings.html':
   assert run("return document.getElementById('sxCyberpunkThemeToggle').checked")
   assert run("return document.body.dataset.sxSettingsTheme")=='cyberpunk-black'
  print('PASS cross-page Cyberpunk palette: '+page,flush=True)

 driver.get(origin+'/index.html')
 wait.until(lambda _:run("return !!document.querySelector('#themeChoice')"))
 run("""
  const box=document.getElementById('themeChoice');
  box.value='dark';box.dispatchEvent(new Event('change',{bubbles:true}));
 """)
 wait.until(lambda _:run("return document.body.dataset.activeTheme==='dark' && document.body.dataset.sxTheme==='dark'"))
 assert run("return !document.body.classList.contains('sx-cyberpunk')")
 assert run("return getComputedStyle(document.body).getPropertyValue('--bg').trim()")!='#030405'
 print('PASS switching back to Dark removes Cyberpunk styling without reload',flush=True)
finally:
 driver.quit()
