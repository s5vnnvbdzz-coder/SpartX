/* node assets/workouts/531-manage-design.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
class Node{
 constructor(id='',classes=[]){
  this.id=id;this.children=[];this.parentNode=null;this.hidden=false;this.textContent='';
  this.attrs={};this.classList={contains:value=>classes.includes(value)};
 }
 get childNodes(){return this.children}
 get nextSibling(){
  if(!this.parentNode)return null;
  const siblings=this.parentNode.children,index=siblings.indexOf(this);
  return siblings[index+1]||null;
 }
 append(...nodes){for(const node of nodes)this.appendChild(node)}
 appendChild(node){this.insertBefore(node,null);return node}
 insertBefore(node,before){
  if(node.parentNode){const list=node.parentNode.children;list.splice(list.indexOf(node),1)}
  const pos=before?this.children.indexOf(before):-1;
  this.children.splice(pos>=0?pos:this.children.length,0,node);node.parentNode=this;return node;
 }
 replaceChildren(...nodes){for(const old of this.children)old.parentNode=null;this.children=[];this.append(...nodes)}
 contains(node){return node===this||this.children.some(child=>child.contains(node))}
 setAttribute(k,v){this.attrs[k]=v}
 remove(){if(this.parentNode){const list=this.parentNode.children;list.splice(list.indexOf(this),1);this.parentNode=null}}
}
const root=new Node('shadow'),setup=new Node('setupCard');
const cardHead=new Node('cardHead',['card-head']);
const fields1=new Node('fields1',['fields']),fields2=new Node('fields2',['fields']);
const length=new Node('length',['field']),lengthChoices=new Node('lengthChoices');length.append(lengthChoices);
const bbbRow=new Node('bbbSwitch',['switch-row']);
const bbbOptions=new Node('bbbOptions',['fields']);
const note=new Node('note',['hint']);note.textContent='Main work uses standard 5/3/1 percentages.';
const picker=new Node('sx531LiftPicker');
const generate=new Node('generate');
const creationNote=new Node('creationNote',['hint']);
const original=[cardHead,fields1,fields2,length,bbbRow,bbbOptions,note,picker,generate,creationNote];
setup.append(...original);
const editor=new Node('editModal');editor.hidden=false;
const deleteBtn=new Node('sx531ManageDelete');
const saveRow=new Node('saveRow');
const footer=new Node('sx531ManageFooter');footer.append(deleteBtn,saveRow);
const mount=new Node('sxQuick531CycleMount');
root.append(setup,editor);
const host=new Node('native531Host',['sx-531-manage-inline']);
host.shadowRoot=root;
const docs=[host,deleteBtn,mount,footer,root,setup,editor,generate,lengthChoices,picker,bbbOptions];
const document={
 createElement:()=>new Node(),
 getElementById:id=>docs.find(n=>n.id===id)||null
};
const get=(id)=>[...docs,...root.children,...setup.children].find(n=>n.id===id)||null;
root.getElementById=id=>get(id);
const window={};
vm.runInNewContext(
 fs.readFileSync(path.join(__dirname,'531-manage-design.js'),'utf8'),
 {window,document},{filename:'531-manage-design.js'}
);
const api=window.spartanx531ManageDesign;
assert.equal(typeof api.open,'function');
assert.equal(typeof api.close,'function');
assert.equal(api.open(),true,'Manage Cycle section opens');
assert.equal(api.open(),true,'Repeated open is harmless');
const wrapper=setup.children.find(n=>n.className==='sx531-unified-sections');
assert.ok(wrapper,'Section wrapper exists');
assert.equal(wrapper.children.length,4,'Four presentation groups');
assert.ok(wrapper.children[0].contains(fields1));
assert.ok(wrapper.children[0].contains(fields2));
assert.ok(wrapper.children[1].contains(picker),'Primary lift controls reused');
assert.ok(wrapper.children[2].contains(length),'Cycle length controls reused');
assert.ok(wrapper.children[2].contains(note));
assert.ok(wrapper.children[3].contains(bbbRow));
assert.ok(wrapper.children[3].contains(bbbOptions),'BBB preserved');
assert.ok(!footer.contains(deleteBtn),'Delete is not in fixed footer');
assert.ok(mount.contains(deleteBtn),'Delete is in scrollable content');
api.close();
assert.equal(setup.children.length,original.length,'All original controls restored');
assert.ok(setup.children.every((n,i)=>n===original[i]),'Original nodes and order preserved');
assert.equal(footer.children[0],deleteBtn,'Delete restored to original footer');
assert.equal(footer.children[1],saveRow,'Footer ordering retained');
assert.equal(mount.children.length,0,'No leftover delete area');
api.close();
const page=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'531-manage-layout.css'),'utf8');
const shadowCss=fs.readFileSync(path.join(__dirname,'531-manage-shadow.css'),'utf8');
assert.ok(page.includes('sxQuick531CycleEyebrow'),'Programme heading shares AscensionX hierarchy');
assert.ok(page.includes('sxQuick531CycleSubtitle'),'Programme header includes explanatory subtitle');
assert.ok(page.includes('window.spartanx531ManageDesign?.open()'),'Existing saved-cycle editor invokes grouping');
assert.ok(page.includes('window.spartanx531ManageDesign?.close()'),'Exiting restores the original form');
assert.ok(page.includes('sx-531-manage-page'),'Full-page 5/3/1 entry remains intact');
assert.ok(css.includes('sx531ManageDeleteArea'),'Delete belongs in page content');
assert.ok(shadowCss.includes('sx531-unified-section'),'Themed section cards');
console.log('5/3/1 Manage Cycle layout: DOM and source regressions passed');
