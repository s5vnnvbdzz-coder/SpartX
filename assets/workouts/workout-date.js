/* SpartanX — backdated workout logging (v248).
   Uses SpartanX's existing session and history models; no synthetic workouts. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const active=$('activeWorkout'),options=$('sxSessionOptionsLinks');
 if(!active||!options||!$('startNewWorkoutChoice'))return;
 const dateButton=document.createElement('button');
 dateButton.id='sxWorkoutDateButton';dateButton.type='button';dateButton.className='sx-workout-date-button';dateButton.hidden=true;
 dateButton.setAttribute('aria-label','Choose workout date and time');
 dateButton.innerHTML='<span class="sx-date-icon" aria-hidden="true">▦</span><span id="sxWorkoutDateLabel">Today</span><span class="sx-date-chevron" aria-hidden="true">›</span>';
 active.querySelector('.sx-active-workout-name')?.appendChild(dateButton);
 const missed=document.createElement('button');missed.type='button';missed.id='sxLogMissedWorkout';
 missed.innerHTML='<strong>Log Missed Workout</strong><span>Enter a completed session under the date and time you trained.</span>';
 const first=options.querySelector('#startNewWorkoutChoice');first?.insertAdjacentElement('afterend',missed);
 const overlay=document.createElement('div');
 overlay.id='sxWorkoutDateOverlay';overlay.className='sx-workout-date-overlay';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','sxWorkoutDateHeading');
 overlay.innerHTML='<section class="sx-workout-date-dialog">'+
  '<div class="sx-workout-date-header"><button type="button" id="sxWorkoutDateCancelTop">← Back</button><h2 id="sxWorkoutDateHeading">Workout date</h2></div>'+
  '<p class="sx-workout-date-copy">Choose when the workout actually happened. Your calendar, progress charts and history will use this date.</p>'+
  '<div class="sx-workout-date-fields"><label for="sxWorkoutDateInput">DATE<input type="date" id="sxWorkoutDateInput" required></label>'+
  '<label for="sxWorkoutTimeInput">TIME<input type="time" id="sxWorkoutTimeInput" required step="60"></label></div>'+
  '<p id="sxWorkoutDateError" class="sx-workout-date-error" role="alert" hidden></p>'+
  '<div class="sx-workout-date-actions"><button type="button" id="sxWorkoutDateCancel">CANCEL</button>'+
  '<button type="button" id="sxWorkoutDateApply">APPLY DATE</button></div></section>';
 document.body.appendChild(overlay);
 const dateInput=$('sxWorkoutDateInput'),timeInput=$('sxWorkoutTimeInput'),error=$('sxWorkoutDateError');
 let previouslyFocused=null;
 const pad=v=>String(v).padStart(2,'0');
 const localDay=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 const localTime=d=>pad(d.getHours())+':'+pad(d.getMinutes());
 function effectiveDate(){
  if(typeof editingSessionId!=='undefined'&&editingSessionId!==null){
    const raw=editingSessionMeta?.date;const date=raw?new Date(raw):new Date();
    return Number.isFinite(date.getTime())?date:new Date();
  }
  const raw=window.sxManualWorkoutDate;
  const date=raw?new Date(raw):new Date();
  return Number.isFinite(date.getTime())?date:new Date();
 }
 function updateLabel(){
  // The calendar belongs to backdated logging and saved-workout editing,
  // never to an ordinary live workout started today (including AscensionX).
  const visible=active.classList.contains('active')&&
    (editingSessionId!==null||!!window.sxManualWorkoutDate||!!window.sxMissedWorkoutMode);
  dateButton.hidden=!visible;
  if(!visible)return;
  const date=effectiveDate(),now=new Date(),isToday=localDay(date)===localDay(now);
  $('sxWorkoutDateLabel').textContent=isToday
    ?'Today · '+localTime(date)
    :date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+' · '+localTime(date);
  dateButton.classList.toggle('is-backdated',!isToday);
 }
 function showError(message){error.hidden=!message;error.textContent=message||'';}
 function openDialog(defaultPreviousDay=false){
  if(typeof sessionActive==='undefined'||!sessionActive)return;
  previouslyFocused=document.activeElement;
  const selected=effectiveDate();
  const date=new Date(selected.getTime());
  if(defaultPreviousDay&&!window.sxManualWorkoutDate&&editingSessionId===null)date.setDate(date.getDate()-1);
  dateInput.max=localDay(new Date());
  dateInput.value=localDay(date);
  timeInput.value=localTime(date);
  showError('');
  overlay.hidden=false;
  document.body.classList.add('sx-workout-date-open');
  dateInput.focus({preventScroll:true});
 }
 function closeDialog(){
  overlay.hidden=true;
  document.body.classList.remove('sx-workout-date-open');
  showError('');
  if(previouslyFocused?.isConnected)previouslyFocused.focus({preventScroll:true});
 }
 function apply(){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.value);
  const t=/^(\d{2}):(\d{2})$/.exec(timeInput.value);
  if(!m||!t){showError('Select both a valid date and time.');return;}
  const Y=Number(m[1]),M=Number(m[2]),D=Number(m[3]),h=Number(t[1]),min=Number(t[2]);
  const date=new Date(Y,M-1,D,h,min,0,0);
  if(date.getFullYear()!==Y||date.getMonth()!==M-1||date.getDate()!==D||
     date.getHours()!==h||date.getMinutes()!==min){
    showError('Choose an existing date and time.');return;
  }
  if(date.getTime()>Date.now()+60000){showError('You cannot save a workout in the future.');return;}
  if(editingSessionId!==null){
    editingSessionMeta=editingSessionMeta||{};
    editingSessionMeta.date=date.toISOString();
  }else{
    window.sxManualWorkoutDate=date.toISOString();
    window.sxMissedWorkoutMode=true;
  }
  updateLabel();saveDraft();closeDialog();
 }
 dateButton.addEventListener('click',()=>openDialog(false));
 $('sxWorkoutDateCancelTop').addEventListener('click',closeDialog);
 $('sxWorkoutDateCancel').addEventListener('click',closeDialog);
 $('sxWorkoutDateApply').addEventListener('click',apply);
 overlay.addEventListener('click',event=>{if(event.target===overlay)closeDialog();});
 overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeDialog();}});
 missed.addEventListener('click',()=>{
   if(sessionActive){alert('Finish or discard your current workout before starting a missed workout.');return;}
   $('startNewWorkoutChoice').click(); // Keep the existing workout setup intact.
   window.sxMissedWorkoutMode=true;
   updateLabel();saveDraft();
   openDialog(true);
 });
 const observer=new MutationObserver(()=>{if(active.classList.contains('active'))updateLabel();});
 observer.observe(active,{attributes:true,attributeFilter:['class']});
 // When historical sessions are loaded into the editor, its date remains editable
 // but is only persisted if the user presses SAVE CHANGES.
 window.SpartanXWorkoutDate={open:()=>openDialog(false),update:updateLabel};
})();