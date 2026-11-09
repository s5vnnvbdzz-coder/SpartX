/* SpartanX Intelligence training-goal selector.
   Preference only: never edits saved workouts, active sessions, or AscensionX. */
(function(){
  'use strict';
  const STORAGE_KEY='sx_intelligence_selected_goal_v1';
  const KNOWN=['powerlifting','bodybuilding','weight-loss'];
  const SECTIONS=['overview','performance','muscles','intelligence'];
  const SECTION_KEY='sx_intelligence_active_section_v1';
  function validSection(value){return SECTIONS.includes(value)?value:null}
  function savedSection(){
    try{return validSection(window.localStorage.getItem(SECTION_KEY))}catch(_){return null}
  }
  // The active navigation item represents the section the athlete is looking at,
  // regardless of whether that section belongs to Powerlifting or another goal.
  function currentSection(){
    const active=document.querySelector('.bottom-nav [data-tab].active')||
      document.querySelector('.sidebar-nav [data-tab].active');
    return validSection(active?.dataset?.tab)||savedSection()||'overview';
  }
  const MAIN=/\/(?:index\.html)?$/.test(window.location.pathname);
  const params=new URLSearchParams(window.location.search);
  const explicit=params.get('goal');
  const requestedSection=validSection(params.get('tab'))||savedSection()||'overview';
  let stored='powerlifting';
  try{const value=window.localStorage.getItem(STORAGE_KEY);if(KNOWN.includes(value))stored=value}catch(_){}
  // A direct link to the existing strength screen is always respected.
  // Without an explicit choice, open the athlete's most recently selected goal.
  const goal=KNOWN.includes(explicit)?explicit:(MAIN?stored:(stored==='powerlifting'?'bodybuilding':stored));
  if(MAIN && goal!=='powerlifting'){
    window.location.replace('./goals.html?goal='+encodeURIComponent(goal)+'&tab='+encodeURIComponent(requestedSection));
    return;
  }
  if(!MAIN && goal==='powerlifting'){
    window.location.replace('./?goal=powerlifting&tab='+encodeURIComponent(requestedSection));
    return;
  }
  try{window.localStorage.setItem(STORAGE_KEY,goal)}catch(_){}
  const label={
    'powerlifting':'Powerlifting focuses on strength trends, estimated 1RM and your existing 5/3/1 / AscensionX data.',
    'bodybuilding':'Bodybuilding focuses on working sets per muscle and progression at comparable weights.',
    'weight-loss':'Weight Loss focuses on bodyweight trends, cardio, workout consistency and strength retention.'
  };
  const select=document.getElementById('sxGoalSelect');
  if(!select)return;
  select.value=goal;
  const note=document.getElementById('sxGoalDescription');
  if(note)note.textContent=label[goal];
  function setMode(value){
    if(!KNOWN.includes(value))return;
    const section=currentSection();
    try{
      window.localStorage.setItem(STORAGE_KEY,value);
      window.localStorage.setItem(SECTION_KEY,section);
    }catch(_){}
    const destination='?goal='+encodeURIComponent(value)+'&tab='+encodeURIComponent(section);
    if(MAIN){
      if(value!=='powerlifting')window.location.assign('./goals.html'+destination);
      return;
    }
    if(value==='powerlifting'){
      window.location.assign('./'+destination);
      return;
    }
    window.history.replaceState(null,'','./goals.html'+destination);
    if(note)note.textContent=label[value];
    window.dispatchEvent(new CustomEvent('sx:intelligence-goal-change',{detail:{goal:value,tab:section}}));
  }
  select.addEventListener('change',()=>setMode(select.value));
  // Both layouts use the same time-range preference, without sharing or
  // rewriting any athlete workout records.
  const RANGE_KEY='sx_intelligence_range_v1';
  const rangeSelect=document.getElementById('rangeSelect');
  if(rangeSelect){
    let preferred=null;
    try{const saved=window.localStorage.getItem(RANGE_KEY);if(saved!==null&&['0','30','90'].includes(saved))preferred=saved}catch(_){}
    if(preferred!==null && rangeSelect.value!==preferred){
      rangeSelect.value=preferred;
      // On Powerlifting the existing controller is loaded before this module.
      rangeSelect.dispatchEvent(new Event('change',{bubbles:true}));
    }
    rangeSelect.addEventListener('change',()=>{
      if(['0','30','90'].includes(rangeSelect.value)){
        try{window.localStorage.setItem(RANGE_KEY,rangeSelect.value)}catch(_){}
      }
    });
  }
  window.SXGoalNavigation=Object.freeze({currentGoal:goal,storageKey:STORAGE_KEY,sectionKey:SECTION_KEY,currentSection});
})();