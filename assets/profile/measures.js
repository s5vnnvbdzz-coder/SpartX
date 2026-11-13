/* SpartanX Measures · v326
 * Two real screens, local dated history, native mobile input and optional
 * separately stored progress photos. Never deletes existing workout data.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const oldPage=$('measuresOverlay');
if(!oldPage||oldPage.classList.contains('sx-measures-page'))return;
const fields=[
 ['bodyweight','Body weight','kg',500],
 ['waist','Waist','cm',300],
 ['chest','Chest','cm',350],
 ['hips','Hips','cm',350],
 ['shoulders','Shoulders','cm',350],
 ['neck','Neck','cm',120],
 ['leftBicep','Left bicep','cm',120],
 ['rightBicep','Right bicep','cm',120],
 ['leftForearm','Left forearm','cm',100],
 ['rightForearm','Right forearm','cm',100],
 ['leftThigh','Left thigh','cm',180],
 ['rightThigh','Right thigh','cm',180],
 ['leftCalf','Left calf','cm',120],
 ['rightCalf','Right calf','cm',120],
 ['bodyFat','Body fat','%',100],
 ['leanMass','Lean body mass','kg',500]
];
const descriptors=Object.fromEntries(fields.map(([key,label,unit,max])=>[key,{label,unit,max}]));
const escapeText=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const localDay=(date=new Date())=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
const dateValue=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00'))?new Date(date+'T12:00:00'):null;
const prettyDate=date=>dateValue(date)?.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})||date;
const dateStamp=date=>dateValue(date)?.getTime()||0;
const nice=(n,unit)=>n==null?'—':Number(n).toLocaleString('en-GB',{maximumFractionDigits:1})+(unit?' '+unit:'');
const view=document.createElement('section');
view.id='measuresOverlay';view.className='screen sx-measures-page';view.setAttribute('aria-labelledby','measuresTitle');
view.innerHTML=`
<div class="sx-measure-page-head">
 <div><div class="eyebrow">ATHLETE DETAILS</div><h1 id="measuresTitle">Measures</h1></div>
 <div class="sx-measure-head-actions">
  <button type="button" class="sx-measure-icon-action" id="sxMeasuresPlus" aria-label="Log new measurements" title="Log measurements">+</button>
  <button type="button" class="sx-page-back" id="closeMeasures" aria-label="Back to Profile"><span class="sx-page-back-arrow" aria-hidden="true">←</span></button>
 </div>
</div>
<section class="sx-measure-panel sx-measure-current">
 <div class="sx-measure-top">
  <div><div class="sx-measure-eyebrow">CURRENT PROFILE WEIGHT</div>
   <div class="sx-measure-main-number" id="sxMeasuresCurrent">—</div>
   <div class="sx-measure-current-note">Private to you · used for your strength-to-bodyweight rankings</div>
  </div>
  <div class="sx-measure-current-note">Log your measurements regularly to see genuine progress over time. Previous bodyweight settings are preserved.</div>
 </div>
 <div class="sx-measure-small-stats">
  <div class="sx-measure-small-stat"><small>LOGGED ENTRIES</small><strong id="sxMeasureEntryCount">0</strong></div>
  <div class="sx-measure-small-stat"><small>LATEST MEASUREMENT</small><strong id="sxMeasuresLatest">—</strong></div>
 </div>
</section>
<section class="sx-measure-panel" aria-labelledby="sxMeasuresChartTitle">
 <div class="sx-measure-chart-controls"><h2 class="sx-measure-section-title" id="sxMeasuresChartTitle">Progress over time</h2>
  <label for="sxMeasureMetric">Metric <select id="sxMeasureMetric" class="sx-measure-compact-select"></select></label>
 </div>
 <div id="sxMeasuresChart" class="sx-measure-chart" aria-live="polite"></div>
 <div class="sx-measure-range" role="group" aria-label="Measurement chart date range">
  <button type="button" data-measure-range="1">1M</button>
  <button type="button" data-measure-range="3" aria-pressed="true">3M</button>
  <button type="button" data-measure-range="6">6M</button>
  <button type="button" data-measure-range="12">1Y</button>
  <button type="button" data-measure-range="0">ALL</button>
 </div>
</section>
<section class="sx-measure-panel" aria-labelledby="sxMeasuresHistoryTitle">
 <div class="sx-measure-chart-controls"><h2 class="sx-measure-section-title" id="sxMeasuresHistoryTitle">Measurement history</h2>
  <span class="sx-measure-eyebrow" id="sxMeasuresCountLabel">0 ENTRIES</span>
 </div>
 <div id="sxMeasuresHistory" class="sx-measure-history"></div>
 <p class="sx-measure-help">Tap a measurement to view or edit it. All measurements are stored locally on this device.</p>
</section>`;
const entry=document.createElement('section');
entry.id='sxMeasureLogPage';entry.className='screen sx-measure-entry-page';entry.setAttribute('aria-labelledby','sxMeasureEntryTitle');
entry.innerHTML=`
<div class="sx-measure-page-head">
 <div><div class="eyebrow">TRACK YOUR PROGRESS</div><h1 id="sxMeasureEntryTitle">Log Measurements</h1></div>
 <div class="sx-measure-head-actions">
  <button class="sx-measure-save" type="submit" form="sxMeasureEntryForm" id="sxMeasureSave">SAVE</button>
  <button type="button" class="sx-page-back" id="sxMeasureEntryBack" aria-label="Back to Measures"><span class="sx-page-back-arrow" aria-hidden="true">←</span></button>
 </div>
</div>
<form id="sxMeasureEntryForm" novalidate>
 <section class="sx-measure-panel">
  <h2 class="sx-measure-section-title">Entry date</h2>
  <div class="sx-measure-entry-group">
   <label class="sx-measure-row" for="sxMeasureDate">Date
    <input id="sxMeasureDate" name="date" type="date" required>
   </label>
  </div>
 </section>
 <section class="sx-measure-panel">
  <h2 class="sx-measure-section-title">Progress picture <small class="sx-measure-help">(optional)</small></h2>
  <p class="sx-measure-help">Progress pictures stay on this device in separate photo storage and are not included in your workout JSON backup.</p>
  <input id="sxMeasurePhotoInput" type="file" accept="image/*" hidden>
  <button type="button" id="sxMeasurePhotoPicker" class="sx-measure-photo-picker" aria-label="Add a progress picture">
   <span id="sxMeasurePhotoPreview">＋ Add picture</span><small id="sxMeasurePhotoNote">Choose a photo or take a picture</small>
  </button>
  <button type="button" id="sxMeasurePhotoRemove" class="sx-measure-cancel" hidden>Remove picture</button>
 </section>
 <section class="sx-measure-panel">
  <h2 class="sx-measure-section-title">Body measurements</h2>
  <p class="sx-measure-help">Enter only values you've actually measured. Unfilled measurements won't be recorded as zero. All units are shown explicitly.</p>
  <div class="sx-measure-entry-group" id="sxMeasureFields"></div>
 </section>
 <p id="sxMeasureEntryStatus" aria-live="polite"></p>
 <div class="sx-measure-entry-footer">
  <button type="button" id="sxMeasureDelete" class="sx-measure-delete" hidden>DELETE ENTRY</button>
  <button type="button" id="sxMeasureCancel" class="sx-measure-cancel">CANCEL</button>
 </div>
</form>`;
// The ranking UI still reads these two legacy elements. Preserve them
// invisibly without keeping the former modal/dialog.
for(const id of ['measureBodyweight','rankProfileHint']){
 const node=oldPage.querySelector('#'+id);
 if(node){node.hidden=true;node.style.display='none';view.appendChild(node);}
}
oldPage.replaceWith(view,entry);
const fieldHost=$('sxMeasureFields');
fieldHost.innerHTML=fields.map(([key,label,unit,max])=>`
 <label class="sx-measure-row" for="sxMeasureField_${key}">
  <span>${label}<small>${unit==='%'?'Percentage':unit==='kg'?'Kilograms':'Centimetres'}</small></span>
  <input id="sxMeasureField_${key}" type="number" inputmode="decimal" min="0" max="${max}"
   step="0.1" placeholder="—" autocomplete="off" data-measure-field="${key}" aria-label="${label} in ${unit}">
 </label>`).join('');
$('sxMeasureMetric').innerHTML=fields.map(([key,label,unit])=>
 '<option value="'+key+'">'+escapeText(label)+' ('+unit+')</option>').join('');
let range=3,metric='bodyweight',editingId=null,saving=false,pendingPhoto=null,removePhoto=false,previewUrl=null;
const photosOpened=()=>new Promise((resolve,reject)=>{
 if(!('indexedDB' in window))return reject(new Error('Photo storage is not available.'));
 const request=indexedDB.open('spartx_measurement_photos_v1',1);
 request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('photos'))request.result.createObjectStore('photos')};
 request.onerror=()=>reject(request.error||new Error('Photo database failed'));
 request.onsuccess=()=>resolve(request.result);
});
async function photoOp(mode,id,data){
 const connection=await photosOpened();
 return new Promise((resolve,reject)=>{
  let tx;
  try{
   tx=connection.transaction('photos',mode==='get'?'readonly':'readwrite');
   const store=tx.objectStore('photos');
   const request=mode==='get'?store.get(id):mode==='remove'?store.delete(id):store.put(data,id);
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
   tx.oncomplete=()=>connection.close();
   tx.onerror=()=>connection.close();
  }catch(error){connection.close();reject(error)}
 });
}
function clearPreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}}
function records(){
 return (Array.isArray(db.measurements)?db.measurements:[])
  .filter(item=>item&&typeof item.id==='string'&&dateValue(item.date)&&
   item.values&&typeof item.values==='object')
  .slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
}
function formatMetric(values,key){
 const number=Number(values?.[key]);
 return values?.[key]===undefined||values?.[key]===null||!Number.isFinite(number)
  ?'—':nice(number,descriptors[key]?.unit);
}
function rangeRecords(){
 const list=records();
 if(!range)return list;
 const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setMonth(cutoff.getMonth()-range);
 const day=localDay(cutoff);
 return list.filter(item=>item.date>=day);
}
function renderChart(){
 const plot=$('sxMeasuresChart'),series=rangeRecords()
  .filter(item=>Number.isFinite(Number(item.values[metric]))&&
   item.values[metric]!==''&&item.values[metric]!==null&&item.values[metric]!==undefined)
  .reverse().map(item=>({date:item.date,value:Number(item.values[metric])}));
 if(!series.length){
  plot.innerHTML='<div class="sx-measure-chart-empty">No '+escapeText(descriptors[metric].label.toLowerCase())+
   ' measurements in this range yet. Tap + to add your first entry.</div>';return;
 }
 const values=series.map(p=>p.value),low=Math.min(...values),high=Math.max(...values);
 const cushion=Math.max((high-low)*.2,metric==='bodyFat'?0.3:0.5);
 const yMin=Math.max(0,low-cushion),yMax=high+cushion;
 const w=640,h=230,L=66,R=18,T=20,B=36,chartH=h-T-B,chartW=w-L-R;
 const times=series.map(p=>dateStamp(p.date)),minT=Math.min(...times),maxT=Math.max(...times);
 const x=(time,i)=>minT===maxT?L+chartW/2:L+(time-minT)/(maxT-minT)*chartW;
 const y=value=>T+chartH-(value-yMin)/(yMax-yMin)*chartH;
 const points=series.map((point,i)=>({x:x(times[i],i),y:y(point.value),...point}));
 const lines=[0,1,2,3].map(i=>{
  const value=yMin+(yMax-yMin)*i/3,Y=y(value);
  return '<line class="grid-line" x1="'+L+'" y1="'+Y+'" x2="'+(w-R)+'" y2="'+Y+'"/>'+
   '<text class="chart-axis-label" x="'+(L-8)+'" y="'+(Y+4)+'" text-anchor="end">'+
    Number(value).toFixed(1)+'</text>';
 }).join('');
 const path=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
 const marker=points.map(p=>'<circle class="chart-point" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="5"><title>'+
  escapeText(prettyDate(p.date))+' · '+nice(p.value,descriptors[metric].unit)+'</title></circle>').join('');
 const labelDates=series.length>1?
 '<text class="chart-axis-label" x="'+L+'" y="'+(h-6)+'">'+escapeText(prettyDate(series[0].date))+'</text>'+
 '<text class="chart-axis-label" text-anchor="end" x="'+(w-R)+'" y="'+(h-6)+'">'+escapeText(prettyDate(series.at(-1).date))+'</text>':
 '<text class="chart-axis-label" text-anchor="middle" x="'+(L+chartW/2)+'" y="'+(h-6)+'">'+escapeText(prettyDate(series[0].date))+'</text>';
 plot.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+escapeText(descriptors[metric].label)+
  ' over the selected period, '+series.length+' logged measurements">'+lines+
  (points.length>1?'<path class="chart-trend" d="'+path+'"/>':'')+marker+labelDates+'</svg>';
}
function render(){
 const all=records(),current=Number(db.profile?.bodyweight);
 $('sxMeasuresCurrent').innerHTML=Number.isFinite(current)&&current>0?
  nice(current,'kg').replace(' kg','<small> kg</small>'):'—';
 $('sxMeasureEntryCount').textContent=String(all.length);
 $('sxMeasuresCountLabel').textContent=all.length+' '+(all.length===1?'ENTRY':'ENTRIES');
 $('sxMeasuresLatest').textContent=all.length?prettyDate(all[0].date):'Not logged';
 $('sxMeasureMetric').value=metric;
 document.querySelectorAll('[data-measure-range]').forEach(button=>
  button.setAttribute('aria-pressed',String(Number(button.dataset.measureRange)===range)));
 const items=all.map(item=>{
  const keys=fields.filter(([key])=>item.values[key]!==null&&item.values[key]!==undefined&&item.values[key]!=='');
  const detail=keys.slice(0,3).map(([key,label])=>label).join(' · ');
  const preview=item.values[metric]!=null?formatMetric(item.values,metric):
   keys.length?formatMetric(item.values,keys[0][0]):'Photo only';
  return '<button type="button" data-measure-edit="'+escapeText(item.id)+'" aria-label="Edit measurement from '+
    escapeText(prettyDate(item.date))+'"><span><strong>'+escapeText(prettyDate(item.date))+'</strong><small>'+
    escapeText(detail||'Progress photo')+(keys.length>3?' · +'+(keys.length-3)+' more':'')+
    '</small></span><span>'+escapeText(preview)+'<small>VIEW DETAILS ›</small></span></button>';
 });
 $('sxMeasuresHistory').innerHTML=items.length?items.join(''):
  '<p class="sx-measure-help">No measurements logged yet. Your current profile bodyweight has been preserved, and you can start a dated history with +.</p>';
 renderChart();
}
function setPreview(blob){
 clearPreview();
 const host=$('sxMeasurePhotoPreview'),button=$('sxMeasurePhotoPicker');
 if(!blob){host.textContent='＋ Add picture';$('sxMeasurePhotoNote').textContent='Choose a photo or take a picture';button.setAttribute('aria-label','Add a progress picture');return}
 previewUrl=URL.createObjectURL(blob);
 const img=document.createElement('img');img.src=previewUrl;img.alt='Selected progress picture';
 host.replaceChildren(img);$('sxMeasurePhotoNote').textContent='Tap to change picture';button.setAttribute('aria-label','Change progress picture');
}
async function openEntry(id=null){
 editingId=id;pendingPhoto=null;removePhoto=false;
 const item=id?records().find(x=>x.id===id):null;
 $('sxMeasureEntryTitle').textContent=item?'Edit Measurements':'Log Measurements';
 $('sxMeasureDelete').hidden=!item;$('sxMeasurePhotoRemove').hidden=true;
 $('sxMeasurePhotoInput').value='';
 $('sxMeasureDate').max=localDay();
 $('sxMeasureDate').value=item?.date||localDay();
 for(const [key] of fields){
  const input=$('sxMeasureField_'+key),value=item?.values[key];
  input.value=value!=null&&Number.isFinite(Number(value))?String(value):
   key==='bodyweight'&&!item&&Number(db.profile?.bodyweight)>0?String(Number(db.profile.bodyweight)):'';
 }
 $('sxMeasureEntryStatus').textContent='';
 $('sxMeasureEntryStatus').removeAttribute('role');
 setPreview(null);
 switchScreen('sxMeasureLogPage',{instant:true});
 if(item?.hasPhoto){
  try{
   const blob=await photoOp('get',item.id);
   if(editingId===item.id&&blob){setPreview(blob);$('sxMeasurePhotoRemove').hidden=false}
  }catch(_){if(editingId===item.id)$('sxMeasurePhotoNote').textContent='Photo unavailable on this device'}
 }
 window.scrollTo(0,0);
}
async function commit(event){
 event.preventDefault();
 if(saving)return;
 const date=$('sxMeasureDate').value;
 if(!dateValue(date)||date>localDay()){
  $('sxMeasureEntryStatus').textContent='Enter a valid date that is not in the future.';
  $('sxMeasureEntryStatus').setAttribute('role','alert');return;
 }
 const values={};
 for(const [key,label,unit,max] of fields){
  const input=$('sxMeasureField_'+key),raw=input.value.trim().replace(',','.');
  if(!raw)continue;
  const value=Number(raw);
  if(!Number.isFinite(value)||value<0||value>max||(key!=='bodyFat'&&value===0)){
   $('sxMeasureEntryStatus').textContent='Check '+label.toLowerCase()+' — enter a valid value in '+unit+'.';
   $('sxMeasureEntryStatus').setAttribute('role','alert');input.focus();return;
  }
  values[key]=Math.round(value*10)/10;
 }
 if(!Object.keys(values).length&&!pendingPhoto){
  $('sxMeasureEntryStatus').textContent='Enter at least one measurement or add a photo.';
  $('sxMeasureEntryStatus').setAttribute('role','alert');return;
 }
 const existing=editingId?records().find(x=>x.id===editingId):null;
 const collision=records().find(x=>x.date===date&&x.id!==editingId);
 if(collision&&!confirm('A measurement entry already exists for '+prettyDate(date)+'. Save a separate entry for that date?'))return;
 const id=existing?.id||'sxm-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
 saving=true;$('sxMeasureSave').disabled=true;
 $('sxMeasureEntryStatus').textContent='Saving measurements…';
 let hasPhoto=existing?.hasPhoto===true&&!removePhoto,photoProblem='';
 if(pendingPhoto){
  try{await photoOp('put',id,pendingPhoto);hasPhoto=true}
  catch(_){photoProblem='The measurement was saved but the picture could not be stored on this device.';hasPhoto=false}
 }
 const record={id,date,values,hasPhoto};
 const prior=Array.isArray(db.measurements)?db.measurements.slice():[];
 const oldWeight=db.profile?.bodyweight;
 try{
  db.measurements=prior.filter(x=>x?.id!==id).concat(record);
  const priorWeight=prior.filter(x=>x?.values?.bodyweight>0).sort((a,b)=>b.date.localeCompare(a.date))[0];
  // A backdated measurement must not silently replace a current profile weight.
  if(values.bodyweight>0&&(date===localDay()||(priorWeight&&date>=priorWeight.date))){
   db.profile={...(db.profile||{}),bodyweight:values.bodyweight};
   $('rankBodyweight').value=String(values.bodyweight);
   $('measureBodyweight').value=String(values.bodyweight);
  }
  persist();
  renderSpartanRanks();
  renderLatestSessionRank();
 }catch(error){
  db.measurements=prior;
  if(oldWeight!=null)db.profile.bodyweight=oldWeight;
  $('sxMeasureEntryStatus').textContent='Saving failed. Your earlier measurements are unchanged.';
  $('sxMeasureEntryStatus').setAttribute('role','alert');
  saving=false;$('sxMeasureSave').disabled=false;return;
 }
 if(removePhoto&&existing?.hasPhoto&&!pendingPhoto){try{await photoOp('remove',id)}catch(_){}}
 saving=false;$('sxMeasureSave').disabled=false;editingId=null;pendingPhoto=null;removePhoto=false;clearPreview();
 render();returnToScreen('measuresOverlay');
 if(photoProblem)alert(photoProblem);
}
async function deleteEntry(){
 const item=records().find(x=>x.id===editingId);
 if(!item||!confirm('Delete your measurement entry for '+prettyDate(item.date)+'? This cannot be undone.'))return;
 const old=db.measurements.slice();
 try{db.measurements=old.filter(x=>x.id!==item.id);persist()}
 catch(_){db.measurements=old;alert('Could not delete the entry.');return}
 if(item.hasPhoto)try{await photoOp('remove',item.id)}catch(_){}
 editingId=null;pendingPhoto=null;clearPreview();render();returnToScreen('measuresOverlay');
}
$('openMeasures').onclick=()=>{render();switchScreen('measuresOverlay',{instant:true});window.scrollTo(0,0)};
$('closeMeasures').onclick=()=>returnToScreen('profile');
$('sxMeasuresPlus').onclick=()=>openEntry();
$('sxMeasureEntryBack').onclick=()=>{clearPreview();returnToScreen('measuresOverlay')};
$('sxMeasureCancel').onclick=()=>{clearPreview();returnToScreen('measuresOverlay')};
$('sxMeasureMetric').onchange=event=>{metric=descriptors[event.target.value]?event.target.value:'bodyweight';render()};
$('measuresOverlay').addEventListener('click',event=>{
 const rangeButton=event.target.closest('[data-measure-range]');
 if(rangeButton){range=Number(rangeButton.dataset.measureRange);render();return}
 const historyButton=event.target.closest('[data-measure-edit]');
 if(historyButton)openEntry(historyButton.dataset.measureEdit);
});
$('sxMeasurePhotoPicker').onclick=()=>$('sxMeasurePhotoInput').click();
$('sxMeasurePhotoInput').onchange=event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(!file.type.startsWith('image/')||file.size>8*1024*1024){
  alert('Choose an image smaller than 8 MB.');event.target.value='';return;
 }
 pendingPhoto=file;removePhoto=false;setPreview(file);$('sxMeasurePhotoRemove').hidden=false;
};
$('sxMeasurePhotoRemove').onclick=()=>{
 pendingPhoto=null;removePhoto=true;$('sxMeasurePhotoInput').value='';setPreview(null);$('sxMeasurePhotoRemove').hidden=true;
};
$('sxMeasureEntryForm').onsubmit=commit;
$('sxMeasureDelete').onclick=deleteEntry;
window.SpartanXMeasures={open:()=>$('openMeasures').click(),render,fields:fields.map(([key,label,unit])=>({key,label,unit}))};
render();
})();
