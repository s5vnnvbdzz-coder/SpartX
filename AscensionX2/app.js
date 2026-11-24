/* Standalone AscensionX 2.0 app shell. Never reads or writes SpartanX/classic data. */
(function(){
'use strict';
const KEY='ascensionx2_standalone_workspace_v1';
const engine=window.SX2Engine;
if(!engine){document.body.textContent='AscensionX 2.0 engine unavailable. Reload this standalone page while online.';return;}
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeNumber=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
const formatLoad=n=>n==null?'Choose load':safeNumber(n)+' kg';
const blank=()=>({schema:1,active:null,archives:[]});
function load(){
 try{
  const s=localStorage.getItem(KEY);
  if(!s)return blank();
  const data=JSON.parse(s);
  if(data?.schema===1&&Array.isArray(data.archives))return data;
 }catch(_){}
 return blank();
}
let state=load(),viewWeek=1,activeTab='builder';
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(state));return true;}
 catch(e){alert('2.0 storage is full or blocked. Export your 2.0 data before creating another cycle.');return false;}
}
function toast(message){
 const box=$('toast');box.textContent=message;box.hidden=false;
 window.clearTimeout(toast.timer);
 toast.timer=window.setTimeout(()=>box.hidden=true,3500);
}
function tab(next){
 activeTab=next;
 for(const button of document.querySelectorAll('[data-tab]'))button.classList.toggle('active',button.dataset.tab===next);
 for(const name of ['builder','programme','review'])$(name).hidden=name!==next;
 window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>tab(button.dataset.tab)));
function getInput(form=$('builderForm')){
 const f=new FormData(form);
 return {
  weeks:Number(f.get('weeks')),days:Number(f.get('days')),minutes:Number(f.get('minutes')),
  sleep:Number(f.get('sleep')),recovery:f.get('recovery'),equipment:f.get('equipment'),step:Number(f.get('step')),
  maxes:{'Back Squat':f.get('squatMax'),'Bench Press':f.get('benchMax'),Deadlift:f.get('deadliftMax')},
  goals:{'Back Squat':f.get('squatGoal'),'Bench Press':f.get('benchGoal'),Deadlift:f.get('deadliftGoal')},
  weakPoints:{'Back Squat':f.getAll('weakSquat'),'Bench Press':f.getAll('weakBench'),Deadlift:f.getAll('weakDeadlift')}
 };
}
function populateInto(form,profile){
 if(!profile)return;
 const e=form.elements;
 const values={
  weeks:profile.weeks,days:profile.days,minutes:profile.minutes,sleep:profile.sleep,
  recovery:profile.recovery,equipment:profile.equipment,step:profile.step,
  squatMax:profile.maxes?.['Back Squat'],benchMax:profile.maxes?.['Bench Press'],deadliftMax:profile.maxes?.Deadlift,
  squatGoal:profile.goals?.['Back Squat'],benchGoal:profile.goals?.['Bench Press'],deadliftGoal:profile.goals?.Deadlift
 };
 for(const [name,value] of Object.entries(values))if(e[name]&&value!=null)e[name].value=value;
 const names={'Back Squat':'weakSquat','Bench Press':'weakBench','Deadlift':'weakDeadlift'};
 for(const [lift,name] of Object.entries(names))for(const el of form.querySelectorAll('input[name="'+name+'"]'))
  el.checked=(profile.weakPoints?.[lift]||[]).includes(el.value);
}
function populate(profile){populateInto($('builderForm'),profile);}

// Current-cycle edit path: preserve the programme identity and every logged
// top set. Rebuild unlogged future weeks only, never a completed week.
const manageDialog=$('manageDialog'),manageForm=$('manageForm');
let previousPageOverflow='';
function closeManageDialog(){
 if(manageDialog.open)manageDialog.close();
 document.documentElement.style.overflow=previousPageOverflow;
}
function openManageDialog(){
 if(!state.active)return;
 populateInto(manageForm,state.active.plan.profile);
 const locked=(state.active.logs||[]).some(x=>Number.isInteger(Number(x.week))&&Number(x.week)>0);
 for(const name of ['weeks','days'])manageForm.elements[name].disabled=locked;
 $('manageStructureHint').textContent=locked?
  'Cycle length and number of days are locked because you have top-set history. Other changes regenerate only weeks after your last logged week.':
  'All fields are editable before you log any top sets. This updates the existing cycle rather than archiving it.';
 previousPageOverflow=document.documentElement.style.overflow;
 manageDialog.showModal();
 document.documentElement.style.overflow='hidden';
 manageForm.elements.squatGoal.focus({preventScroll:true});
}
$('manageClose').addEventListener('click',closeManageDialog);
$('manageCancel').addEventListener('click',closeManageDialog);
manageDialog.addEventListener('close',()=>{document.documentElement.style.overflow=previousPageOverflow;});
manageDialog.addEventListener('cancel',event=>{event.preventDefault();closeManageDialog();});
manageDialog.addEventListener('click',event=>{if(event.target===manageDialog)closeManageDialog();});
manageForm.addEventListener('submit',event=>{
 event.preventDefault();
 if(!state.active)return;
 try{
  const source=state.active.plan.profile;
  const input={...source,...getInput(manageForm)};
  // Disabled structure inputs are absent from FormData once logging starts.
  if(manageForm.elements.weeks.disabled)input.weeks=source.weeks;
  if(manageForm.elements.days.disabled)input.days=source.days;
  const result=engine.revise(state.active,input);
  const old=state.active;
  state.active={...old,plan:result.plan,updated:new Date().toISOString()};
  if(!persist()){state.active=old;return;}
  populate(state.active.plan.profile);
  viewWeek=Math.min(viewWeek,result.plan.profile.weeks);
  closeManageDialog();renderAll();
  toast(result.preservedThrough?
   'Cycle updated · logged Weeks 1–'+result.preservedThrough+' preserved':
   'Current cycle updated without creating a new one');
 }catch(error){alert(error?.message||'Unable to save cycle changes.');}
});
$('builderForm').addEventListener('submit',event=>{
 event.preventDefault();
 try{
  const plan=engine.generate(getInput());
  if(state.active&&!confirm('Archive your current standalone 2.0 programme and create another? Classic AscensionX will not change.'))return;
  const previous=state.active,history=state.archives.slice();
  if(previous)history.unshift(previous);
  const next={id:'ax2-'+Date.now(),created:new Date().toISOString(),plan,logs:[]};
  state={schema:1,active:next,archives:history.slice(0,10)};
  if(!persist()){state.active=previous;return;}
  viewWeek=1;renderAll();tab('programme');toast('New standalone 2.0 programme saved');
 }catch(e){alert(e?.message||String(e));}
});
function phaseChip(w,selected,logs){
 const completed=engine.LIFTS.every(lift=>logs.some(log=>log.week===w.week&&log.lift===lift));
 return '<div class="phase '+(completed?'done ':w.week===selected?'current ':'')+'"><strong>W'+w.week+'</strong><small>'+esc(w.phase)+'</small></div>';
}
function logFor(week,lift){
 return state.active?.logs?.find(log=>log.week===week&&log.lift===lift)||null;
}
function rows(ex,week,profile){
 const sets=ex.sets.map(s=>'<span class="set '+(s.type==='top'?'top':s.type==='warmup'?'warmup':ex.role==='assessment'?'assessment':'')+'">'+
   esc(s.type.toUpperCase())+' · '+formatLoad(s.kg)+' × '+s.reps+(s.rpe?' · RPE '+s.rpe:'')+'</span>').join('');
 let record='';
 if(ex.role==='primary'){
  const saved=logFor(week,ex.name),top=ex.sets.find(s=>s.type==='top');
  const inputId=ex.name.replace(/[^a-z]/gi,'');
  const review=saved?engine.reviewTop(ex,saved,profile.step):null;
  record='<form class="logform" data-top-form="'+esc(ex.name)+'" data-week="'+week+'"><h5>LOG ACTUAL TOP SET · '+esc(ex.name)+'</h5>'+
   '<div class="grid"><label>Weight (kg)<input name="kg" aria-label="'+esc(ex.name)+' actual weight" type="number" min="1" max="550" step="any" required value="'+(saved?saved.kg:top.kg)+'"></label>'+
   '<label>Reps<input name="reps" type="number" min="0" max="30" step="1" required value="'+(saved?saved.reps:top.reps)+'"></label>'+
   '<label>RPE<input name="rpe" type="number" min="6" max="10" step="0.5" required value="'+(saved?saved.rpe:top.rpe)+'"></label></div>'+
   '<button type="submit" class="secondary">'+(saved?'UPDATE LOG':'SAVE TOP-SET LOG')+'</button>'+
   (review?'<div class="feedback '+(review.status==='on-target'||review.status==='increase-candidate'?'good':'warning')+'">'+esc(review.reason)+(review.delta?' · Consider '+(review.delta>0?'+':'')+review.delta+' kg next exposure.':'')+'</div>':'')+
   '</form>';
 }
 return '<div class="exercise"><div class="exercisehead"><strong>'+esc(ex.name)+'</strong><span class="tag '+ex.role+'">'+esc(ex.role.toUpperCase())+'</span></div>'+
  '<div class="sets">'+sets+'</div><p class="rationale">'+esc(ex.rationale)+'</p>'+record+'</div>';
}
function makeSession(s,w,p,index){
 return '<div class="session"><details '+(index===0?'open':'')+'><summary>'+(s.day?'<span class="tag secondary">'+esc(s.day)+'</span> ':'')+esc(s.name)+' <span class="muted">'+(s.estimatedMinutes?' · ~'+s.estimatedMinutes+' min':'')+'</span></summary>'+
 s.exercises.map(ex=>rows(ex,w,p)).join('')+'</details></div>';
}
function renderProgramme(){
 const root=$('programmeView'),active=state.active;
 if(!active){root.innerHTML='<div class="card empty"><h3>No standalone cycle yet</h3><p>Create a 4-, 8- or 12-week PR-focused programme on the Create Cycle tab.</p><button class="secondary" data-go-builder>CREATE YOUR FIRST CYCLE</button></div>';return;}
 const p=active.plan.profile,weeks=active.plan.weeks;
 viewWeek=Math.max(1,Math.min(p.weeks,viewWeek||1));
 const w=weeks[viewWeek-1];
 const logged=engine.LIFTS.filter(lift=>logFor(viewWeek,lift)).length;
 const available=weeks.map(x=>'<option value="'+x.week+'" '+(x.week===viewWeek?'selected':'')+'>Week '+x.week+' · '+esc(x.phase)+'</option>').join('');
 const goals=engine.LIFTS.map(lift=>'<div class="stat"><span>'+esc(lift)+'</span><strong>'+formatLoad(p.maxes[lift])+'</strong><small>PR target: '+formatLoad(p.goals[lift])+'</small></div>').join('');
 const warnings=active.plan.warnings?.length?'<div class="callout warning"><strong>Coaching checks</strong><br>'+active.plan.warnings.map(esc).join('<br>')+'</div>':'';
 let assessment='';
 if(w.assessment){
  assessment='<div class="callout warning"><strong>OPTIONAL PR ASSESSMENT</strong><p>'+esc(w.explanation)+'</p>'+
   '<div class="tableWrap"><table><thead><tr><th>Lift</th><th>Opener</th><th>Near PB</th><th>Candidate PR</th><th>Goal</th></tr></thead><tbody>'+
   engine.LIFTS.map(lift=>{const a=w.attempts[lift];return '<tr><td>'+esc(lift)+'</td><td>'+formatLoad(a.opener)+'</td><td>'+formatLoad(a.second)+'</td><td><strong>'+formatLoad(a.third)+'</strong></td><td>'+formatLoad(a.goal)+'</td></tr>'}).join('')+
   '</tbody></table></div><p class="hint">Candidate attempts are not guarantees or a requirement to max out. Stop if pain, technique or readiness deteriorates.</p></div>';
 }
 root.innerHTML=
  '<div class="card"><p class="eyebrow">ACTIVE · STANDALONE 2.0</p><h3>'+p.weeks+'-week PR-focused powerlifting cycle</h3>'+
  '<div class="stats">'+goals+'</div>'+
  '<p class="hint">'+p.days+' training days · '+p.minutes+' minute target · Created '+new Date(active.created).toLocaleDateString()+' · Separate storage</p>'+
  '<div class="phaseStrip">'+weeks.map(x=>phaseChip(x,viewWeek,active.logs)).join('')+'</div>'+
  '<div class="actionrow"><button type="button" class="secondary" data-go-review>OPEN INTELLIGENCE</button><button type="button" class="subtle" data-edit-cycle>EDIT CURRENT CYCLE</button><a href="./assessment.html" class="secondary ax-assessment-link">NEW AX PROGRAMME</a></div>'+
  warnings+'</div>'+
  '<div class="card"><p class="eyebrow">WEEKLY PRESCRIPTION</p><h3>Week '+w.week+' · '+esc(w.phase)+'</h3>'+
  '<label>Select programme week<select id="weekSelector" class="weekselect">'+available+'</select></label>'+
  '<p class="hint">'+logged+' / 3 main-lift top-set observations recorded for this week. All warm-ups, top sets and back-downs are shown below.</p>'+
  assessment+
  w.sessions.map((s,i)=>makeSession(s,w.week,p,i)).join('')+
  '<p class="hint">Development logger: top-set performance only. Review recommendations do not silently rewrite future weights. Full set-by-set workout logging and live SpartanX import are not yet enabled.</p></div>';
}
function renderReview(){
 const root=$('reviewView');
 const active=state.active;
 if(!active){root.innerHTML='<div class="card empty"><h3>No performance data</h3><p>Create a 2.0 programme first.</p></div>';return;}
 const logs=active.logs.slice().sort((a,b)=>a.week-b.week||engine.LIFTS.indexOf(a.lift)-engine.LIFTS.indexOf(b.lift));
 const p=active.plan.profile,rows=logs.map(log=>{
  const ex=active.plan.weeks[log.week-1]?.sessions.flatMap(s=>s.exercises).find(x=>x.role==='primary'&&x.name===log.lift);
  const feedback=engine.reviewTop(ex,log,p.step);
  return '<tr><td>W'+log.week+'</td><td>'+esc(log.lift)+'</td><td><strong>'+formatLoad(log.kg)+' × '+log.reps+'</strong></td><td>'+log.rpe+'</td><td>'+esc(feedback.status)+'</td><td><button type="button" class="subtle" data-delete-log="'+esc(log.lift)+'" data-week="'+log.week+'">REMOVE</button></td></tr>';
 }).join('');
 const archive=state.archives?.length?'<div class="card"><p class="eyebrow">PREVIOUS 2.0 PROGRAMMES</p><h3>Development archives</h3>'+
  state.archives.map(x=>'<div class="actionrow"><span>'+new Date(x.created).toLocaleDateString()+' · '+x.plan.profile.weeks+' weeks · '+x.logs.length+' top-set observations</span><button type="button" class="secondary" data-restore="'+esc(x.id)+'">RESTORE</button></div>').join('')+'</div>':'';
 root.innerHTML='<div class="card"><p class="eyebrow">ATHLETE INTELLIGENCE</p><h3>PR-first performance review</h3>'+
  '<div class="stats">'+engine.LIFTS.map(l=>'<div class="stat"><span>'+esc(l)+'</span><strong>'+formatLoad(p.maxes[l])+'</strong><small>Goal: '+formatLoad(p.goals[l])+'</small></div>').join('')+'</div>'+
  '<p class="hint">Top-set logs inform load-change suggestions; these are coaching review prompts, not automatic training-max adjustments. A projected PR is not equivalent to an achieved PR.</p>'+
  '<div class="tableWrap"><table><thead><tr><th>Week</th><th>Lift</th><th>Actual top set</th><th>RPE</th><th>Review</th><th>Action</th></tr></thead><tbody>'+
  (rows||'<tr><td colspan="6">No top sets logged in the development lab yet.</td></tr>')+'</tbody></table></div></div>'+archive;
}
function renderAll(){renderProgramme();renderReview();}
$('programmeView').addEventListener('change',e=>{
 if(e.target.id==='weekSelector'){viewWeek=Number(e.target.value);renderProgramme();}
});
$('programmeView').addEventListener('submit',e=>{
 const form=e.target.closest('[data-top-form]');if(!form)return;
 e.preventDefault();
 if(!state.active)return;
 const week=Number(form.dataset.week),lift=form.dataset.topForm,f=new FormData(form);
 const kg=Number(f.get('kg')),reps=Number(f.get('reps')),rpe=Number(f.get('rpe'));
 if(!engine.LIFTS.includes(lift)||!Number.isInteger(week)||week<1||week>state.active.plan.weeks.length||
  !(kg>0&&kg<550)||!Number.isInteger(reps)||reps<0||reps>30||!(rpe>=6&&rpe<=10)||Math.round(rpe*2)!==rpe*2){
  alert('Enter a valid weight, repetition count and RPE (6–10 in half-point steps).');return;
 }
 const oldLogs=state.active.logs.slice();
 state.active.logs=oldLogs.filter(log=>!(log.week===week&&log.lift===lift));
 state.active.logs.push({week,lift,kg,reps,rpe,date:new Date().toISOString()});
 if(!persist()){state.active.logs=oldLogs;return;}
 renderAll();toast('Week '+week+' '+lift+' top set saved in 2.0 only');
});
$('programmeView').addEventListener('click',e=>{
 if(e.target.closest('[data-go-builder]'))tab('builder');
 if(e.target.closest('[data-go-review]'))tab('review');
 if(e.target.closest('[data-edit-cycle]'))openManageDialog();
});
$('reviewView').addEventListener('click',e=>{
 const remove=e.target.closest('[data-delete-log]');
 if(remove&&state.active){
  if(!confirm('Remove this standalone 2.0 top-set log?'))return;
  const backup=state.active.logs.slice();
  state.active.logs=backup.filter(log=>!(log.week===Number(remove.dataset.week)&&log.lift===remove.dataset.deleteLog));
  if(!persist())state.active.logs=backup;
  renderAll();return;
 }
 const restore=e.target.closest('[data-restore]');
 if(restore){
  const index=state.archives.findIndex(x=>x.id===restore.dataset.restore);
  if(index<0||!confirm('Restore this archived 2.0 cycle? Current standalone cycle will be archived.'))return;
  const next=state.archives.splice(index,1)[0],old=state.active;
  if(old)state.archives.unshift(old);
  state.active=next;
  if(!persist()){state.active=old;return;}
  viewWeek=1;populate(next.plan.profile);renderAll();tab('programme');toast('Archived standalone cycle restored');
 }
});
$('exportData').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ascensionx2-standalone-backup.json';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),5000);toast('2.0-only backup exported');
});
$('importData').addEventListener('change',async e=>{
 try{
  const file=e.target.files[0];if(!file)return;
  if(file.size>3000000)throw Error('2.0 backup is too large for this development build.');
  const data=JSON.parse(await file.text());
  if(data?.schema!==1||!Array.isArray(data.archives)||!data.active?.plan?.independent||!Array.isArray(data.active?.plan?.weeks)||!Array.isArray(data.active?.logs)||!data.active?.plan?.version?.startsWith('2.0'))
   throw Error('Only AscensionX 2.0 standalone backups can be imported.');
  engine.normalize(data.active.plan.profile);
  if(!confirm('Import this 2.0-only backup and replace the current 2.0 workspace? Classic AscensionX is not affected.'))return;
  const old=state;state=data;if(!persist()){state=old;return;}
  viewWeek=1;populate(state.active.plan.profile);renderAll();tab('programme');toast('2.0 workspace imported');
 }catch(e){alert(e?.message||'Unable to import standalone backup.');}
 finally{e.target.value='';}
});
$('resetData').addEventListener('click',()=>{
 if(!confirm('Clear ONLY standalone AscensionX 2.0 programmes and top-set logs on this device? Export a backup first. Classic AscensionX is unaffected.'))return;
 try{localStorage.removeItem(KEY)}catch(_){}
 state=blank();viewWeek=1;renderAll();tab('builder');toast('Standalone 2.0 workspace reset');
});
if(state.active?.plan?.profile)populate(state.active.plan.profile);
renderAll();
if(state.active)tab('programme');
if('serviceWorker' in navigator&&location.protocol==='https:')
 navigator.serviceWorker.register('./sw.js?v=3',{scope:'./'}).catch(()=>{});
})();
