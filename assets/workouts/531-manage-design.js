/* 5/3/1 Manage Cycle — shared SpartanX programme editor presentation.
 * Presentation only: the native 5/3/1 engine and stored plan stay untouched.
 * Native setup inputs are moved (never cloned) and restored on exit.
 */
(function(){
 'use strict';
 const host=document.getElementById('native531Host');
 const root=host?.shadowRoot;
 if(!root)return;
 const style=document.createElement('link');
 style.rel='stylesheet';
 style.href='./assets/workouts/531-manage-shadow.css?v=313';
 root.appendChild(style);
 let current=null;
 function header(number,title,description,id){
  const head=document.createElement('div');
  head.className='sx531-unified-section-head';
  const eyebrow=document.createElement('div');
  eyebrow.id=id;eyebrow.className='sx531-unified-eyebrow';
  eyebrow.textContent=number+' · '+title.toUpperCase();
  const label=document.createElement('p');
  label.className='sx531-unified-description';
  label.textContent=description;
  head.append(eyebrow,label);
  return head;
 }
 function section(number,title,description,nodes,id){
  const el=document.createElement('section');
  el.className='sx531-unified-section';
  el.setAttribute('aria-labelledby',id);
  el.append(header(number,title,description,id));
  for(const node of nodes)if(node)el.append(node);
  return el;
 }
 function open(){
  if(current)return true;
  if(!host.classList.contains('sx-531-manage-inline'))return false;
  const setup=root.getElementById('setupCard');
  const editor=root.getElementById('editModal');
  if(!setup||!editor||editor.hidden)return false;
  const original=[...setup.childNodes];
  const direct=[...setup.children];
  const rows=direct.filter(node=>node.classList.contains('fields'));
  const starting=rows.slice(0,2);
  const length=direct.find(node=>node.contains(root.getElementById('lengthChoices')));
  const bbbRow=direct.find(node=>node.classList.contains('switch-row'));
  const bbbOptions=root.getElementById('bbbOptions');
  const note=direct.find(node=>node.classList.contains('hint')&&node.textContent.includes('Main work uses'));
  const picker=root.getElementById('sx531LiftPicker');
  if(starting.length!==2||!length||!bbbRow||!bbbOptions||!picker)return false;
  const wrapper=document.createElement('div');
  wrapper.className='sx531-unified-sections';
  wrapper.append(
   section('01','Starting strength','Select each lift above to edit its 1RM, Training Max and progression independently.',starting,'sx531StartingHeading'),
   section('02','Primary lifts','Choose the compound movements included in this programme.',[picker],'sx531LiftsHeading'),
   section('03','Cycle progression','Choose the programme duration and how your Training Max increases.',[length,note],'sx531ProgressionHeading'),
   section('04','Optional assistance','BBB is additional 5 × 10 work and is omitted during deload weeks.',[bbbRow,bbbOptions],'sx531AssistanceHeading')
  );
  setup.insertBefore(wrapper,root.getElementById('generate'));
  const deleteButton=document.getElementById('sx531ManageDelete');
  const mount=document.getElementById('sxQuick531CycleMount');
  const footer=deleteButton?.parentNode;
  const next=deleteButton?.nextSibling;
  let deleteArea=null;
  if(deleteButton&&mount){
   deleteArea=document.createElement('div');
   deleteArea.id='sx531ManageDeleteArea';
   deleteArea.className='sx531-manage-delete-area';
   deleteArea.appendChild(deleteButton);
   mount.appendChild(deleteArea);
  }
  current={setup,original,wrapper,deleteButton,footer,next,deleteArea};
  return true;
 }
 function close(){
  if(!current)return;
  const {setup,original,deleteButton,footer,next,deleteArea}=current;
  // Return input nodes to their original positions, keeping values and events.
  setup.replaceChildren(...original);
  if(deleteButton&&footer){
   footer.insertBefore(deleteButton,next&&next.parentNode===footer?next:null);
  }
  deleteArea?.remove();
  current=null;
 }
 window.spartanx531ManageDesign=Object.freeze({open,close});
})();
