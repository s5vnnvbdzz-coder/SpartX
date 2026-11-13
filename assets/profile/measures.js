/* SpartanX Measures · v327
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
<div class="sx-measures-compact-overview">
 <div class="sx-measure-overview-head">
  <button type="button" class="sx-measure-latest-button" id="sxMeasureLatestOpen" aria-label="Open latest logged measurement">
   <span class="sx-measure-overview-reading" id="sxMeasuresCurrent">—</span>
   <span class="sx-measure-overview-date" id="sxMeasuresCurrentDate">Not dated</span>
   <span class="sx-measure-overview-edit" aria-hidden="true">›</span>
  </button>
  <button type="button" class="sx-measure-range-trigger" id="sxMeasureRangeOpen"
   aria-haspopup="dialog" aria-expanded="false" aria-controls="sxMeasureRangeSheet">
   <span id="sxMeasureRangeLabel">Last 3 months</span><span class="sx-measure-range-chevron" aria-hidden="true">⌄</span>
  </button>
 </div>
 <div id="sxMeasuresChart" class="sx-measure-chart sx-measure-main-chart" aria-live="polite"></div>
 <div class="sx-measure-metric-chooser">
  <label class="sx-measure-metric-pill" for="sxMeasureMetric">
   <span id="sxMeasureMetricLabel">Weight</span>
   <span class="sx-measure-metric-chevron" aria-hidden="true">⌄</span>
   <select id="sxMeasureMetric" aria-label="Choose measurement to display"></select>
  </label>
 </div>
 <div class="sx-measure-history-heading">
  <h2 class="sx-measure-section-title" id="sxMeasuresHistoryTitle">Weight History</h2>
  <span class="sx-measure-eyebrow" id="sxMeasuresCountLabel">0 ENTRIES</span>
 </div>
 <div id="sxMeasuresHistory" class="sx-measure-history"></div>
 <p class="sx-measure-history-note">Tap a saved measurement to view or edit it. Your measurements remain private on this device.</p>
 <span id="sxMeasureEntryCount" hidden>0</span>
</div>
<div class="sx-measure-sheet" id="sxMeasureRangeSheet" role="dialog" aria-modal="true"
 aria-labelledby="sxMeasureRangeSheetTitle" hidden>
 <button type="button" class="sx-measure-sheet-scrim" id="sxMeasureRangeScrim" aria-label="Close date range options"></button>
 <div class="sx-measure-sheet-panel" role="document">
  <div class="sx-measure-sheet-handle" aria-hidden="true"></div>
  <h2 class="sx-measure-sheet-title" id="sxMeasureRangeSheetTitle">Chart date range</h2>
  <div class="sx-measure-sheet-options" role="group" aria-label="Measurement time range">
   <button type="button" data-measure-range="3" aria-pressed="true"><span>Last 3 months</span><span class="sx-range-check" aria-hidden="true">✓</span></button>
   <button type="button" data-measure-range="12" aria-pressed="false"><span>1 year</span><span class="sx-range-check" aria-hidden="true">✓</span></button>
   <button type="button" data-measure-range="0" aria-pressed="false"><span>All time</span><span class="sx-range-check" aria-hidden="true">✓</span></button>
  </div>
 </div>
</div>`;
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
 <div class="sx-measure-date-single-row">
  <label for="sxMeasureDate">Entry Date</label>
  <input id="sxMeasureDate" name="date" type="date" required>
 </div>
 <section class="sx-measure-photo-section">
  <h2 class="sx-measure-section-title">Progress Picture</h2>
  <input id="sxMeasurePhotoInput" type="file" accept="image/*" hidden>
  <button type="button" id="sxMeasurePhotoPicker" class="sx-measure-photo-picker" aria-label="Add a progress picture">
   <span id="sxMeasurePhotoPreview">＋ Add picture</span><small id="sxMeasurePhotoNote" class="sx-measure-sr-only">Choose a photo or take a picture</small>
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
// Keep the sheet in the document body: on iOS a transformed page/carousel
// can otherwise shift fixed-position overlays below the visual viewport.
const floatingRangeSheet=view.querySelector('#sxMeasureRangeSheet');
if(floatingRangeSheet)document.body.appendChild(floatingRangeSheet);
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
 const w=640,h=360,L=66,R=18,T=20,B=40,chartH=h-T-B,chartW=w-L-R;
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
const rangeLabels={3:'Last 3 months',12:'1 year',0:'All time'};
const metricLabel=key=>key==='bodyweight'?'Weight':descriptors[key]?.label||'Weight';
const hasMeasure=(item,key)=>item?.values?.[key]!==null&&item?.values?.[key]!==undefined&&
 item?.values?.[key]!==''&&Number.isFinite(Number(item.values[key]));
function latestMeasure(key){return records().find(item=>hasMeasure(item,key))||null}
function render(){
 const all=records(),relevant=all.filter(item=>hasMeasure(item,metric));
 const latest=relevant[0]||null;
 const profileWeight=Number(db.profile?.bodyweight);
 const fallback=metric==='bodyweight'&&!latest&&Number.isFinite(profileWeight)&&profileWeight>0;
 const current=latest?Number(latest.values[metric]):fallback?profileWeight:null;
 $('sxMeasuresCurrent').textContent=current===null?'—':nice(current,descriptors[metric].unit).replace(' ','');
 $('sxMeasuresCurrentDate').textContent=latest?prettyDate(latest.date):
  fallback?'Not dated':'No entries';
 $('sxMeasureLatestOpen').setAttribute('aria-label',latest?
  'Open '+metricLabel(metric)+' measurement from '+prettyDate(latest.date):
  'Log a '+metricLabel(metric).toLowerCase()+' measurement');
 $('sxMeasureEntryCount').textContent=String(all.length);
 $('sxMeasuresCountLabel').textContent=relevant.length+' '+(relevant.length===1?'ENTRY':'ENTRIES');
 $('sxMeasuresHistoryTitle').textContent=metricLabel(metric)+' History';
 $('sxMeasureMetricLabel').textContent=metricLabel(metric);
 $('sxMeasureMetric').value=metric;
 $('sxMeasureRangeLabel').textContent=rangeLabels[range];
 document.querySelectorAll('[data-measure-range]').forEach(button=>
  button.setAttribute('aria-pressed',String(Number(button.dataset.measureRange)===range)));
 const items=relevant.map(item=>
  '<button type="button" data-measure-edit="'+escapeText(item.id)+'" aria-label="Edit '+escapeText(metricLabel(metric))+
  ' measurement from '+escapeText(prettyDate(item.date))+'"><span><strong>'+
  escapeText(prettyDate(item.date))+'</strong><small>VIEW MEASUREMENT</small></span><span>'+
  escapeText(formatMetric(item.values,metric))+'</span></button>');
 $('sxMeasuresHistory').innerHTML=items.length?items.join(''):
  '<p class="sx-measure-history-empty">No '+escapeText(metricLabel(metric).toLowerCase())+
  ' measurements recorded yet. Use + to log your first entry.</p>';
 renderChart();
}
function showRangeSheet(){
 const sheet=$('sxMeasureRangeSheet');
 sheet.hidden=false;
 document.body.classList.add('sx-measure-sheet-open');
 $('sxMeasureRangeOpen').setAttribute('aria-expanded','true');
 sheet.querySelector('[data-measure-range="'+range+'"]').focus({preventScroll:true});
}
function hideRangeSheet(){
 const sheet=$('sxMeasureRangeSheet');
 if(sheet.hidden)return;
 sheet.hidden=true;
 document.body.classList.remove('sx-measure-sheet-open');
 $('sxMeasureRangeOpen').setAttribute('aria-expanded','false');
 $('sxMeasureRangeOpen').focus({preventScroll:true});
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
$('closeMeasures').onclick=()=>{hideRangeSheet();returnToScreen('profile')};
$('sxMeasuresPlus').onclick=()=>openEntry();
$('sxMeasureEntryBack').onclick=()=>{clearPreview();returnToScreen('measuresOverlay')};
$('sxMeasureCancel').onclick=()=>{clearPreview();returnToScreen('measuresOverlay')};
$('sxMeasureMetric').onchange=event=>{metric=descriptors[event.target.value]?event.target.value:'bodyweight';render()};
$('sxMeasureLatestOpen').onclick=()=>openEntry(latestMeasure(metric)?.id||null);
$('sxMeasureRangeOpen').onclick=showRangeSheet;
$('sxMeasureRangeScrim').onclick=hideRangeSheet;
$('sxMeasureRangeSheet').addEventListener('click',event=>{
 const option=event.target.closest('[data-measure-range]');
 if(!option)return;
 const value=Number(option.dataset.measureRange);
 if(![0,3,12].includes(value))return;
 range=value;hideRangeSheet();render();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!$('sxMeasureRangeSheet').hidden){
  event.preventDefault();hideRangeSheet();
 }
});
$('measuresOverlay').addEventListener('click',event=>{
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
