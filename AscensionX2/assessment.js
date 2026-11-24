/* AX six-step athlete assessment; only ever writes separate 2.0 workspace/draft. */
(function(){
'use strict';
const WORKSPACE='ascensionx2_standalone_workspace_v1';
const DRAFT='ax2_athlete_assessment_draft_v1';
const form=document.getElementById('axAssessmentForm');
const api=window.AXAssessment,engine=window.SX2Engine;
if(!form||!api||!engine){document.body.textContent='AX assessment failed to load. Please refresh while online.';return;}
const $=id=>document.getElementById(id);
const panels=Array.from(form.querySelectorAll('[data-ax-step]'));
const headings=[
 ['Let’s build your next PR.','First, choose how AX should balance maximal strength with supporting hypertrophy.'],
 ['Understand your starting point.','Basic athlete information improves context without replacing your saved SpartanX measurements.'],
 ['Establish your strength baseline.','Your squat, bench and deadlift 1RMs anchor the training loads.'],
 ['Build around recovery.','Sleep, job demands, nutrition and activity affect how much work is sensible to start with.'],
 ['Design the training week.','We’ll distribute the sessions and select a block length that fits your training availability.'],
 ['Review and generate.','Confirm your answers before creating an independent development programme.']
];
const escapeText=str=>String(str??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=x=>Number(x).toLocaleString('en-GB',{maximumFractionDigits:2});
let step=0;
function workspace(){
 try{const data=JSON.parse(localStorage.getItem(WORKSPACE)||'null');
  if(data?.schema===1&&Array.isArray(data.archives))return data;
 }catch(_){}
 return {schema:1,active:null,archives:[]};
}
function input(name){return form.elements.namedItem(name)}
function set(name,value){
 const el=input(name);if(el&&value!=null&&value!=='')el.value=String(value);
}
function getValues(){
 const f=new FormData(form);
 return {
  focus:f.get('focus')||'strength',age:f.get('age'),weight:f.get('weight'),height:f.get('height'),
  experience:f.get('experience'),squatMax:f.get('squatMax'),squatGoal:f.get('squatGoal'),
  benchMax:f.get('benchMax'),benchGoal:f.get('benchGoal'),deadliftMax:f.get('deadliftMax'),
  deadliftGoal:f.get('deadliftGoal'),sleep:f.get('sleep'),job:f.get('job'),activity:f.get('activity'),
  nutrition:f.get('nutrition'),recovery:f.get('recovery'),availability:f.getAll('availability'),
  weakSquat:f.getAll('weakSquat'),weakBench:f.getAll('weakBench'),weakDeadlift:f.getAll('weakDeadlift'),
  days:f.get('days'),minutes:f.get('minutes'),weeks:f.get('weeks'),
  equipment:f.get('equipment'),step:f.get('step')
 };
}
function restore(values){
 if(!values||typeof values!=='object')return;
 for(const [name,value] of Object.entries(values)){
  if(['availability','weakSquat','weakBench','weakDeadlift'].includes(name)){
   if(!Array.isArray(value))continue;
   for(const el of form.querySelectorAll('input[name="'+name+'"]'))el.checked=value.includes(el.value);
  }else if(name==='focus'){
   const choice=form.querySelector('input[name="focus"][value="'+String(value).replace(/[^a-z]/g,'')+'"]');
   if(choice)choice.checked=true;
  }else set(name,value);
 }
}
function fromSpartan(){
 const info=api.readSpartanProfile(localStorage),old=workspace().active?.plan?.profile;
 const original={...info.maxes};
 // Prefer the current, independently edited 2.0 profile over default classic
 // values when rebuilding an existing development programme.
 if(old?.maxes)for(const lift of engine.LIFTS){
  if(Number(old.maxes[lift])>0)original[lift]=Number(old.maxes[lift]);
 }
 set('age',info.age??old?.age);
 set('weight',info.weight?.value??old?.bodyweight);
 set('height',info.height?.value??old?.height);
 const names={'Back Squat':'squat','Bench Press':'bench','Deadlift':'deadlift'};
 for(const lift of engine.LIFTS){
  const key=names[lift],max=original[lift];
  if(Number(max)>0){
   set(key+'Max',max);
   const increment=lift==='Bench Press'?2.5:5;
   set(key+'Goal',old?.goals?.[lift]||Math.round((Number(max)+increment)*2)/2);
  }
 }
 const weight=info.weight, height=info.height;
 const parts=[weight?('Weight '+fmt(weight.value)+' kg from '+weight.source):'No saved bodyweight',
  height?('height '+fmt(height.value)+' cm from '+height.source):'height needs confirmation',
  info.sources.classic?'classic AscensionX strength records available':'enter current squat/bench/deadlift 1RMs'];
 $('measurePrefillMessage').textContent=parts.join(' · ')+'. These are starting values; confirm before generation.';
 return info;
}
function saveDraft(){
 try{localStorage.setItem(DRAFT,JSON.stringify({version:1,answers:getValues()}));}catch(_){}
}
function showError(text){
 const el=$('assessmentError');el.textContent=text;el.hidden=!text;
 if(text)el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function displayStep(next){
 step=Math.max(0,Math.min(panels.length-1,next));
 for(const [i,panel] of panels.entries())panel.hidden=i!==step;
 const [headline,intro]=headings[step];
 $('stepHeading').textContent=headline;
 $('stepIntro').textContent=intro;
 $('stepCounter').textContent=String(step+1).padStart(2,'0')+' / 06';
 $('axProgressBar').style.width=String(((step+1)/panels.length)*100)+'%';
 const dots=$('axStepDots').children;
 for(let i=0;i<dots.length;i++)dots[i].className=i===step?'current':i<step?'done':'';
 $('axBack').hidden=step===0;
 $('axNext').hidden=step===panels.length-1;
 $('axGenerate').hidden=step!==panels.length-1;
 $('assessmentReplaceWarning').hidden=!workspace().active;
 if(step===4)updateSchedule();
 if(step===5)renderSummary();
 showError('');
 window.scrollTo({top:0,behavior:'smooth'});
}
function checkStep(index){
 const panel=panels[index];
 for(const element of panel.querySelectorAll('input[required],select[required]')){
  if(!element.checkValidity()){
   element.classList.add('ax-touched');
   element.focus({preventScroll:true});
   showError('Check '+(element.closest('label')?.textContent?.trim()||'the highlighted field')+'.');
   return false;
  }
 }
 if(index===2){
  for(const name of ['squat','bench','deadlift']){
   const max=Number(input(name+'Max').value),goal=Number(input(name+'Goal').value);
   if(!(goal>max)){
    input(name+'Goal').classList.add('ax-touched');
    input(name+'Goal').focus({preventScroll:true});
    showError('Your '+name+' PR target must be greater than your current 1RM.');
    return false;
   }
  }
 }
 if(index===4){
  try{api.assessmentInput(getValues());}
  catch(e){showError(e.message||'Choose enough available training days.');return false;}
 }
 return true;
}
function updateSchedule(){
 const f=getValues(),days=api.recommendSchedule(f.availability,Number(f.days));
 $('schedulePreview').textContent=days?days.join(' · ').toUpperCase():'SELECT MORE AVAILABLE DAYS';
 $('scheduleReason').textContent=days?
  'Suggested order: squat, bench, deadlift'+(days.length>=4?', secondary squat and bench':'')+
  (days.length===5?', then upper assistance':'')+'. You can revise your availability before generating.':
  'Select at least '+f.days+' available training days.';
}
function summaryCard(heading,rows){
 return '<div class="ax-summary-card"><h4>'+escapeText(heading)+'</h4>'+
  rows.map(([label,value])=>'<div class="ax-summary-row"><span>'+escapeText(label)+'</span><strong>'+escapeText(value)+'</strong></div>').join('')+
  '</div>';
}
function renderSummary(){
 const f=getValues(),schedule=api.recommendSchedule(f.availability,Number(f.days))||[];
 $('assessmentSummary').innerHTML=[
  summaryCard('YOUR OBJECTIVE',[
   ['Training focus',f.focus==='balanced'?'Strength + size':'Maximum strength'],
   ['Experience',f.experience],['Age',f.age+' years'],['Bodyweight / height',f.weight+' kg · '+f.height+' cm']
  ]),
  summaryCard('STRENGTH AND NEW PR TARGETS',[
   ['Back Squat',f.squatMax+' kg → '+f.squatGoal+' kg'],
   ['Bench Press',f.benchMax+' kg → '+f.benchGoal+' kg'],
   ['Deadlift',f.deadliftMax+' kg → '+f.deadliftGoal+' kg']
  ]),
  summaryCard('RECOVERY / PROGRAMME',[
   ['Sleep and work',f.sleep+' hours · '+f.job+' physical demands'],
   ['Nutrition / activity',f.nutrition+' · '+f.activity+' activity'],
   ['Recovery',f.recovery],
   ['Duration',f.weeks+' weeks · '+f.days+' days · '+f.minutes+' min/session'],
   ['Training days',schedule.join(' / ')],
   ['Equipment',f.equipment==='full'?'Full gym':'Basic gym']
  ])].join('');
}
form.addEventListener('input',e=>{
 e.target.classList?.remove('ax-touched');showError('');
 if(step===4)updateSchedule();
 saveDraft();
});
form.addEventListener('change',()=>{if(step===4)updateSchedule();saveDraft();});
$('axBack').addEventListener('click',()=>{saveDraft();displayStep(step-1);});
$('axNext').addEventListener('click',()=>{
 if(!checkStep(step))return;
 saveDraft();displayStep(step+1);
});
form.addEventListener('submit',event=>{
 event.preventDefault();
 for(let i=0;i<panels.length-1;i++)if(!checkStep(i)){displayStep(i);checkStep(i);return;}
 try{
  const answers=getValues();
  const params=api.assessmentInput(answers);
  const plan=engine.generate(params);
  const existing=workspace();
  if(existing.active&&!confirm('Archive your existing standalone AX 2.0 programme and generate a new one? All its logs will be kept in the archive. Your original six-week AX will remain untouched.'))return;
  const archives=existing.active?[existing.active,...existing.archives].slice(0,10):existing.archives;
  const id='ax2-assessment-'+Date.now(),created=new Date().toISOString();
  const next={schema:1,active:{id,created,plan,logs:[]},archives};
  // Exactly one independent workspace write; never mutate SpartanX or classic AX.
  localStorage.setItem(WORKSPACE,JSON.stringify(next));
  localStorage.removeItem(DRAFT);
  window.location.assign('./index.html?ax2_created=1');
 }catch(error){showError(error.message||'Programme could not be generated. Review the highlighted inputs.');}
});
const saved=(()=>{try{const x=JSON.parse(localStorage.getItem(DRAFT)||'null');return x?.version===1?x.answers:null;}catch(_){return null;}})();
if(saved){
 restore(saved);
 $('measurePrefillMessage').textContent='Your saved AX assessment draft has been restored. Review these values before generating; existing Measures and classic strength records are unchanged.';
}else fromSpartan();
displayStep(0);
})();
