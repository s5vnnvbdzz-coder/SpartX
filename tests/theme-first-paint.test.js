/* First-paint regression: run with node tests/theme-first-paint.test.js */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const head=html.match(/<script id="sx-theme-prepaint">([\s\S]*?)<\/script>/)[1];
const first=html.match(/<script id="sx-theme-first-body">([\s\S]*?)<\/script>/)[1];
assert.ok(html.indexOf('id="sx-theme-prepaint"')<html.indexOf('<style>'));
assert.ok(/<body class="sx-main-header-layout">\s*<script id="sx-theme-first-body">/.test(html));
const runtime=html.match(/function applyTheme\(\)\{[\s\S]*?\}function displayWeight/)[0];
const themes=Object.fromEntries([...runtime.matchAll(/document\.body\.classList\.toggle\('([^']+)',preferences\.theme==='([^']+)'\)/g)].map(m=>[m[2],m[1]]));
function run(pref,standard,expected,blocked=false){
 const values={spartx_preferences_v1:pref,spartx_db:JSON.stringify({profile:{standard}})};
 const root={dataset:{},style:{removeProperty(k){if(k==='background-color')delete this.backgroundColor}}};
 const meta={content:'#101114'};
 const body={dataset:{},classList:{values:['sx-main-header-layout'],add(c){this.values.push(c)}}};
 const document={documentElement:root,body:null,querySelector(){return meta}};
 const localStorage={getItem(k){if(blocked)throw Error('unavailable');return values[k]||null},setItem(){throw Error('unexpected write')}};
 const window={};
 const context=vm.createContext({document,localStorage,window});
 vm.runInContext(head,context);
 assert.equal(root.dataset.sxTheme,expected);
 assert.equal(root.style.colorScheme,expected==='light'?'light':'dark');
 assert.match(root.style.backgroundColor,/^#[0-9a-f]{6}$/);
 assert.equal(meta.content,root.style.backgroundColor);
 document.body=body;
 vm.runInContext(first,context);
 assert.equal(body.dataset.activeTheme,expected);
 assert.equal(body.dataset.sxTheme,expected);
 assert.deepEqual(body.classList.values,themes[expected]?['sx-main-header-layout',themes[expected]]:['sx-main-header-layout']);
 assert.equal(root.style.backgroundColor,undefined);
 assert.equal(window.sxApplyInitialTheme,undefined);
}
for(const theme of ['dark',...Object.keys(themes)]){
 const standard=['olympian-athena','amazonian-crimson','athenas-aegis'].includes(theme)?'female':'male';
 run(JSON.stringify({theme}),standard,theme);
}
run('{"theme":"spartan-olympian"}','female','olympian-athena');
for(const theme of ['olympian-athena','amazonian-crimson','athenas-aegis'])run(JSON.stringify({theme}),'male','spartan-red');
for(const pref of [null,'bad JSON','null','{}','{"theme":"cyberpunk-black"}','{"theme":"toString"}'])run(pref,'male','dark');
run('{"theme":"light"}','male','dark',true);
console.log('Theme first-paint regression checks passed');
