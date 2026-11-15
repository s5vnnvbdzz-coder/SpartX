/* node tests/theme-uniformity-chart-scrub.test.js
 * Unified card styling, subtle Cyberpunk and accessible mobile chart scrub.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const css=fs.readFileSync('assets/themes/uniform-surfaces.css','utf8');
const bridge=fs.readFileSync('assets/themes/shared-theme.js','utf8');
const muted=fs.readFileSync('assets/themes/cyberpunk-subtle.css','utf8');
const obsidian=fs.readFileSync('assets/themes/obsidian-white.css','utf8');
const touch=fs.readFileSync('assets/charts/touch-scrub.js','utf8');
const host=fs.readFileSync('index.html','utf8');
const settings=fs.readFileSync('tools/settings.html','utf8');
const asc=fs.readFileSync('AscensionX/index.html','utf8');
const intelligence=fs.readFileSync('intelligence/index.html','utf8');
const intelChart=fs.readFileSync('intelligence/app.js','utf8');
for(const [name,html] of [
 ['SpartanX',host],['AscensionX',asc],['Intelligence',intelligence],
 ['Tools',fs.readFileSync('tools/index.html','utf8')],
 ['Tools Settings',settings],['5/3/1',fs.readFileSync('tools/531-cycle.html','utf8')],
 ['Embedded Tools',fs.readFileSync('tools/embedded.html','utf8')],
 ['Embedded Settings',fs.readFileSync('tools/embedded-settings.html','utf8')]
]){
 assert(html.includes('uniform-surfaces.css?v=340'),name+' loads uniform cards');
 assert(html.includes('shared-theme.js?v=340'),name+' receives palette bridge');
}
for(const [name,html] of [['SpartanX',host],['AscensionX',asc],
 ['Intelligence',intelligence]]){
 assert(html.includes('touch-scrub.js?v=340'),name+' enables chart scrubbing');
}
assert(css.includes('linear-gradient(225deg'),'One consistent upper-right to lower-left gradient');
assert(css.includes('body[data-sx-theme] :is('),'Theme selectors override legacy card gradients');
assert(css.includes('.sx-profile-secondary .detail-panel>section'),
 'Secondary profile pages use uniform card backgrounds');
assert(css.includes('min-height:44px!important'),
 'Mobile navigation retains at least 44 CSS pixels of touch area');
assert(css.includes('env(safe-area-inset-bottom'),
 'Navigation remains clear of iPhone home indicator');
assert(bridge.includes("'sx-cyberpunk':["),'New theme is accepted in every child');
assert(muted.includes('body.sx-cyberpunk'),'Cyberpunk CSS has its own distinct class');
assert(obsidian.includes('--sx-card-gradient'),'Obsidian follows the shared card gradient');
assert(host.includes('<option value="sx-cyberpunk">'),'User can select Cyberpunk theme');
assert(host.includes("classList.toggle('sx-cyberpunk'"),'Main body theme class switches');
assert(settings.includes('id="cyberpunkThemeToggle"'),'Tools Settings can select Cyberpunk');
assert(settings.includes('id="obsidianThemeToggle"'),'Tools Settings can select Obsidian');
assert(asc.includes("'sx-cyberpunk':'cyberpunk'"),'Embedded AscensionX inherits Cyberpunk');
assert(intelChart.includes('const dots=records.map('),
 'Intelligence strength chart provides every data point');
assert(intelChart.includes('kg estimated 1RM</title>'),'Intelligence data points expose readable details');
const listeners={};
const doc={readyState:'loading',addEventListener:(type,callback)=>{listeners[type]=callback}};
const window={};
vm.runInNewContext(touch,{window,document:doc});
const scrub=window.SXChartScrub;
assert(scrub,'Chart scrub API exported');
const points=[10,110,210].map((x,i)=>({
 getBoundingClientRect:()=>({left:x,top:80,width:10,height:10}),
 getAttribute:n=>n==='aria-label'?'Week '+(i+1)+' · '+(i+1)*20+' kg':null,
 querySelector:()=>null,hasAttribute:()=>false
}));
assert.equal(scrub.nearest(points,20),points[0]);
assert.equal(scrub.nearest(points,122),points[1]);
assert.equal(scrub.nearest(points,203),points[2]);
assert.equal(scrub.labelFor(points[1]),'Week 2 · 40 kg');
assert.equal(scrub.candidates({querySelectorAll:()=>points}).length,3,
 'Titled/labelled SVG points are selectable');
assert(typeof listeners.DOMContentLoaded==='function',
 'Pointer handlers initialize after the document is ready');
console.log('PASS: unified themes on 8 pages, Obsidian/Cyberpunk switching, chart scrubbing, and 44px mobile navigation.');
