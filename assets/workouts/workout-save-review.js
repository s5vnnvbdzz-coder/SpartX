/* SpartanX workout review v251 — confirm before saving and keep media in IndexedDB.
   Media stays on-device, separate from small JSON exercise/session records. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const page=$('workoutSaveReview'),header=$('sxHeaderSaveControls'),back=$('sxSaveReviewBack'),save=$('sxSaveReviewConfirm');
if(!page||!header||!back||!save)return;
const name=$('sxReviewWorkoutName'),input=$('sxReviewMediaInput'),preview=$('sxReviewMediaList'),error=$('sxReviewError');
let media=[],pausedBeforeReview=false,draftName='',busy=false,reviewOpen=false;
let attachedUrls=new Set(),galleryUrls=new Set();
const LIMIT_COUNT=8,LIMIT_TOTAL=120*1024*1024,LIMIT_SINGLE=80*1024*1024;
const icon=(type)=>type.startsWith('video/')?'Video':'Photo';
function showError(message){error.textContent=message||'';error.hidden=!message;}
function cleanupUrls(set){for(const url of set)URL.revokeObjectURL(url);set.clear();}
function clearMedia(){cleanupUrls(attachedUrls);media=[];input.value='';preview.replaceChildren();}
function formatClock(n){const seconds=Math.max(0,Math.floor(n));return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(x=>String(x).padStart(2,'0')).join(':');}
function sessionTotals(){
 const completed=work.flatMap(ex=>(ex.sets||[]).filter(set=>set.done&&isValidTrackedSet(set,ex.name)).map(set=>({weight:Number(set.weight)||0,reps:Number(set.reps)||0})));
 return {sets:completed.length,volume:completed.reduce((n,s)=>n+s.weight*s.reps,0)};
}
function updateMetrics(){
 const totals=sessionTotals();
 $('sxReviewDuration').textContent=formatClock(window.sxReviewDurationSeconds??currentWorkoutElapsed());
 $('sxReviewVolume').textContent=kg(totals.volume);
 $('sxReviewSets').textContent=String(totals.sets);
}
function open(){
 if(!sessionActive||editingSessionId!==null)return;
 const totals=sessionTotals();if(!totals.sets){alert('Complete at least one valid set before finishing.');return;}
 if(!reviewOpen){
   pausedBeforeReview=sessionPausedAt!==null;
   window.sxReviewDurationSeconds=currentWorkoutElapsed();
   if(!pausedBeforeReview)sessionPausedAt=Date.now();
 }
 reviewOpen=true;
 name.value=draftName||($('activeWorkoutName').textContent.trim())||defaultWorkoutName();
 showError('');updateMetrics();renderMedia();
 switchScreen('workoutSaveReview');updateSessionClock();saveDraft();
 window.scrollTo({top:0,behavior:'instant'});
}
function goBack(){
 if(busy||!reviewOpen)return;
 draftName=name.value.trim();
 reviewOpen=false;
 if(!pausedBeforeReview&&sessionPausedAt!==null&&sessionStarted!==null){
   sessionStarted+=Date.now()-sessionPausedAt;sessionPausedAt=null;
 }
 window.sxReviewDurationSeconds=null;
 switchScreen('activeWorkout');updateSessionClock();saveDraft();
}
function renderMedia(){
 cleanupUrls(attachedUrls);preview.replaceChildren();
 for(let i=0;i<media.length;i++){
  const file=media[i],url=URL.createObjectURL(file);attachedUrls.add(url);
  const card=document.createElement('div');card.className='sx-review-media-item';
  const element=document.createElement(file.type.startsWith('video/')?'video':'img');
  element.src=url;element.className='sx-review-media-preview';
  if(element.tagName==='VIDEO'){element.muted=true;element.playsInline=true;element.preload='metadata';}
  else{element.alt='Photo preview';}
  const caption=document.createElement('span');caption.className='sx-review-media-filename';caption.textContent=file.name;
  const remove=document.createElement('button');remove.type='button';remove.className='sx-review-remove-media';remove.textContent='×';remove.setAttribute('aria-label','Remove '+file.name);
  remove.addEventListener('click',()=>{media.splice(i,1);renderMedia();});
  card.append(element,caption,remove);preview.append(card);
 }
}
input.addEventListener('change',()=>{
 const added=[...input.files||[]];input.value='';
 if(!added.length)return;
 for(const file of added){
  if(!(file.type.startsWith('image/')||file.type.startsWith('video/')))continue;
  if(file.size>LIMIT_SINGLE){showError('Each photo or video must be under 80 MB for local storage.');continue;}
  if(media.length>=LIMIT_COUNT){showError('You can attach up to 8 photos or videos.');break;}
  if(media.reduce((n,f)=>n+f.size,0)+file.size>LIMIT_TOTAL){showError('Total media must be under 120 MB. Remove a file to continue.');break;}
  media.push(file);
 }
 renderMedia();
});
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('Local media storage is unavailable in this browser.'));return;}
  const request=indexedDB.open('SpartanXWorkoutMedia',1);
  request.onupgradeneeded=()=>{
   const database=request.result;
   if(!database.objectStoreNames.contains('media')){
    const store=database.createObjectStore('media',{keyPath:'id'});
    store.createIndex('sessionId','sessionId',{unique:false});
   }
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Unable to open media storage.'));
 });
}
async function storeMedia(id){
 if(!media.length)return;
 const database=await openDB();
 try{
  await new Promise((resolve,reject)=>{
   const tx=database.transaction('media','readwrite'),store=tx.objectStore('media');
   media.forEach((file,i)=>store.put({id:String(id)+':'+i,sessionId:String(id),file,type:file.type,name:file.name,created:Date.now()}));
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Local storage failed.'));
   tx.onabort=()=>reject(tx.error||new Error('Not enough device storage for media.'));
  });
 }finally{database.close();}
}
async function getSavedMedia(id){
 const database=await openDB();
 try{return await new Promise((resolve,reject)=>{
  const tx=database.transaction('media','readonly');
  const request=tx.objectStore('media').index('sessionId').getAll(String(id));
  request.onsuccess=()=>resolve(request.result||[]);
  request.onerror=()=>reject(request.error||new Error('Cannot load media.'));
 });}finally{database.close();}
}
async function confirm(){
 if(busy||!reviewOpen)return;
 const workoutName=name.value.trim()||defaultWorkoutName();
 if(!sessionTotals().sets){showError('Complete at least one valid set before saving.');return;}
 busy=true;save.disabled=true;save.textContent='SAVING…';showError('');
 const id=Date.now();window.sxReviewWorkoutName=workoutName;window.sxReviewSessionId=id;
 try{
  // Do not claim the workout is saved until attachments have been accepted.
  await storeMedia(id);
  const result=commitFinishSession();
  if(!result)throw new Error('Workout could not be saved.');
  reviewOpen=false;draftName='';clearMedia();
  window.sxReviewDurationSeconds=null;
 }catch(e){
  console.warn('[SpartanX workout review]',e);
  showError('Could not save this workout'+(media.length?' with media':'')+'. '+(e?.message||'Try again or remove media.'));
 }finally{
  window.sxReviewWorkoutName=null;window.sxReviewSessionId=null;
  busy=false;save.disabled=false;save.textContent='SAVE';
 }
}
const overlay=$('completedWorkoutOverlay');
async function renderSavedMedia(id,container){
 for(const prior of container.querySelectorAll('.sx-saved-workout-media'))prior.remove();
 cleanupUrls(galleryUrls);
 const gallery=document.createElement('section');gallery.className='sx-saved-workout-media';
 gallery.innerHTML='<h3>Photos &amp; videos</h3><div class="sx-saved-media-grid"></div>';
 container.appendChild(gallery);
 try{
  const files=await getSavedMedia(id);
  if(!files.length){gallery.remove();return;}
  const grid=gallery.querySelector('.sx-saved-media-grid');
  for(const item of files){
   const url=URL.createObjectURL(item.file);galleryUrls.add(url);
   const wrapper=document.createElement('div');wrapper.className='sx-saved-media-item';
   const mediaElement=document.createElement(item.type.startsWith('video/')?'video':'img');
   mediaElement.src=url;if(mediaElement.tagName==='VIDEO'){mediaElement.controls=true;mediaElement.playsInline=true;mediaElement.preload='metadata';}
   else mediaElement.alt=item.name||'Workout photo';
   const label=document.createElement('small');label.textContent=item.name||icon(item.type);
   wrapper.append(mediaElement,label);grid.appendChild(wrapper);
  }
 }catch(e){gallery.remove();console.warn('[SpartanX workout media]',e);}
}
const mediaObserver=new MutationObserver(()=>{
 if(overlay?.classList.contains('hidden'))cleanupUrls(galleryUrls);
});if(overlay)mediaObserver.observe(overlay,{attributes:true,attributeFilter:['class']});
back.addEventListener('click',goBack);save.addEventListener('click',confirm);
name.addEventListener('focus',()=>name.select());
name.addEventListener('click',()=>name.select());
name.addEventListener('input',()=>{draftName=name.value;saveDraft();});
window.SpartanXSaveReview={open,back:goBack,confirm,renderSavedMedia};
})();
