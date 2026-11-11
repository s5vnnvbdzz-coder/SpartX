/* SpartanX exercise weight-logging conventions.
 * Guidance only: entering and interpreting set weights remains manual.
 * This intentionally never edits workout history or converts a saved load.
 */
(function(global){
 'use strict';
 const label=(unit)=>String(unit).toLowerCase()==='lb'?'lb':'kg';
 function get(name,unit='kg'){
  const n=String(name||'').trim(),low=n.toLowerCase(),u=label(unit);
  const single=/(?:single[ -]?arm|one[ -]?arm|one[ -]?hand|single[ -]?hand|unilateral)/i.test(n);
  const iso=/(?:iso[ -]?lateral|iso[ -]?loaded)/i.test(n);
  const dumbbell=/(?:dumbbell|\bdb\b|arnold press)/i.test(n);
  const plates=/(?:plate[ -]?loaded)/i.test(n);
  const cardio=/(?:stairmaster|treadmill|rowing machine|bike|cross trainer|ski.?erg)/i.test(n);
  if(iso&&!single){
   return {kind:'independent-sides',title:'Add both sides together',
    description:'Log the combined weight loaded onto both independent arms of the machine. Enter the total once for each set, not the weight of one side.',
    example:'60 '+u+' on the left + 60 '+u+' on the right = 120 '+u+' logged.',
    note:'Count the added plates on both sides. Do not include the machine’s starting resistance unless you consistently track it.'};
  }
  if(iso&&single){
   return {kind:'single-side',title:'Log the side you are training',
    description:'For a single-arm set on an independently loaded machine, log the load moved by the working arm. Do not double it when only one side is being trained.',
    example:'60 '+u+' on the working arm = 60 '+u+' logged.',
    note:'Record each side consistently, including when you perform matching repetitions with both arms.'};
  }
  if(dumbbell&&single){
   return {kind:'one-dumbbell',title:'Log the actual dumbbell in use',
    description:'When an exercise uses one dumbbell at a time, enter that dumbbell’s weight for the set. Do not double a single-arm load.',
    example:'One 20 '+u+' dumbbell = 20 '+u+' logged.',
    note:'If you use two dumbbells at the same time instead, log their combined weight.'};
  }
  if(dumbbell){
   return {kind:'two-dumbbells',title:'Log both dumbbells combined',
    description:'For exercises performed with a dumbbell in each hand, add the two dumbbell weights and enter their combined total in the KG/LBS field.',
    example:'20 '+u+' in each hand = 40 '+u+' logged.',
    note:'If you perform a variation with only one dumbbell, log the single dumbbell instead. SpartanX does not double values automatically.'};
  }
  if(cardio){
   return {kind:'cardio',title:'Record the machine totals',
    description:'Enter the measurement displayed on the cardio machine for that interval, together with its elapsed time.',
    example:'Record floors, steps or distance and the time completed, as applicable.',
    note:'Cardio uses its own interval fields rather than combined dumbbell or plate weight.'};
  }
  if(/barbell|deadlift|squat|bench press|overhead press|ohp/i.test(low)){
   return {kind:'barbell',title:'Record the total barbell weight',
    description:'Use the complete load lifted, including the bar and all weight plates, not just the plates on one side.',
    example:'20 '+u+' bar + 20 '+u+' of plates on each end = 60 '+u+' logged.',
    note:'Use the same logging convention for warm-up and working sets.'};
  }
  if(plates){
   return {kind:'plate-loaded',title:'Log the total loaded plates',
    description:'For a plate-loaded machine, enter the sum of the plates contributing to the resistance. If its arms load independently, add both sides together.',
    example:'40 '+u+' on each loaded side = 80 '+u+' logged.',
    note:'Keep the same approach for your next session so progression is comparable.'};
  }
  if(/machine|cable|pulldown|pushdown|row|curl|fly|extension|raise/i.test(low)){
   return {kind:'machine',title:'Record the weight selected',
    description:'Enter the resistance used for this exercise, normally the total marked weight on the machine stack or the total plates loaded.',
    example:'A 50 '+u+' stack selection = 50 '+u+' logged.',
    note:'If the machine has two independently loaded arms, log the sum of both sides instead. Never double a single-stack display.'};
  }
  return {kind:'general',title:'Record the resistance used',
   description:'Enter the actual resistance for your set in your selected weight unit. Be consistent in how you record it across sessions.',
   example:'Enter the weight you moved, not a sum of repetitions or total workout volume.',
   note:'For two dumbbells or independently loaded machine arms, use the combined weight; for a single-arm exercise, use only the load being moved.'};
 }
 let sheet=null,lastFocus=null,oldOverflow='',current='';
 const escape=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function ensure(){
  const document=global.document;if(!document?.body)return null;
  if(sheet)return sheet;
  sheet=document.createElement('div');
  sheet.id='sxExerciseLogGuide';sheet.hidden=true;
  sheet.innerHTML='<section class="sx-log-guide-panel" role="dialog" aria-modal="true" aria-labelledby="sxLogGuideHeading">'+
   '<div class="sx-log-guide-grip" aria-hidden="true"></div>'+
   '<div class="sx-log-guide-kicker">SPARTANX · EXERCISE LIBRARY</div>'+
   '<h2 id="sxLogGuideHeading">How to log</h2>'+
   '<h3 id="sxLogGuideExercise"></h3>'+
   '<strong id="sxLogGuideRule"></strong>'+
   '<p id="sxLogGuideDescription"></p>'+
   '<div class="sx-log-guide-example"><span>EXAMPLE</span><p id="sxLogGuideExample"></p></div>'+
   '<p id="sxLogGuideNote"></p>'+
   '<div class="sx-log-guide-actions"><button type="button" id="sxLogGuideStats">VIEW STATISTICS</button>'+
   '<button type="button" id="sxLogGuideClose">BACK TO WORKOUT</button></div>'+
   '</section>';
  document.body.appendChild(sheet);
  sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
  sheet.querySelector('#sxLogGuideClose').addEventListener('click',close);
  sheet.querySelector('#sxLogGuideStats').addEventListener('click',()=>{
   const ex=current;
   close();
   if(typeof global.showExercisePR==='function')global.showExercisePR(ex);
  });
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&!sheet.hidden){e.preventDefault();close()}
  });
  return sheet;
 }
 function open(name,unit='kg'){
  const el=ensure();if(!el)return;
  const info=get(name,unit);
  current=String(name||'Exercise');
  if(el.hidden){
   lastFocus=global.document.activeElement;
   oldOverflow=global.document.body.style.overflow||'';
  }
  el.querySelector('#sxLogGuideExercise').textContent=current;
  el.querySelector('#sxLogGuideRule').textContent=info.title;
  el.querySelector('#sxLogGuideDescription').textContent=info.description;
  el.querySelector('#sxLogGuideExample').textContent=info.example;
  el.querySelector('#sxLogGuideNote').textContent=info.note;
  global.document.body.classList.add('sx-exercise-log-guide-open');
  global.document.body.style.overflow='hidden';
  el.hidden=false;
  el.querySelector('#sxLogGuideClose').focus({preventScroll:true});
 }
 function close(){
  if(!sheet||sheet.hidden)return;
  sheet.hidden=true;
  global.document.body.classList.remove('sx-exercise-log-guide-open');
  global.document.body.style.overflow=oldOverflow;
  if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
  lastFocus=null;
 }
 global.SpartanXExerciseLoggingGuide=Object.freeze({get,open,close});
})(window);
