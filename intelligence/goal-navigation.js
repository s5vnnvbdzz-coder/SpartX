/* SpartanX Intelligence training-goal selector.
   Preference only: never edits saved workouts, active sessions, or AscensionX. */
(function(){
  'use strict';
  const STORAGE_KEY='sx_intelligence_selected_goal_v1';
  const KNOWN=['powerlifting','bodybuilding','weight-loss'];
  const MAIN=/\/(?:index\.html)?$/.test(window.location.pathname);
  const params=new URLSearchParams(window.location.search);
  const explicit=params.get('goal');
  let stored='powerlifting';
  try{const value=window.localStorage.getItem(STORAGE_KEY);if(KNOWN.includes(value))stored=value}catch(_){}
  // A direct link to the existing strength screen is always respected.
  // Without an explicit choice, open the athlete's most recently selected goal.
  const goal=KNOWN.includes(explicit)?explicit:(MAIN?stored:(stored==='powerlifting'?'bodybuilding':stored));
  if(MAIN && goal!=='powerlifting'){
    window.location.replace('./goals.html?goal='+encodeURIComponent(goal));
    return;
  }
  if(!MAIN && goal==='powerlifting'){
    window.location.replace('./?goal=powerlifting');
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
    try{window.localStorage.setItem(STORAGE_KEY,value)}catch(_){}
    if(MAIN){
      if(value!=='powerlifting')window.location.assign('./goals.html?goal='+encodeURIComponent(value));
      return;
    }
    if(value==='powerlifting'){
      window.location.assign('./?goal=powerlifting');
      return;
    }
    window.history.replaceState(null,'','./goals.html?goal='+encodeURIComponent(value));
    if(note)note.textContent=label[value];
    window.dispatchEvent(new CustomEvent('sx:intelligence-goal-change',{detail:{goal:value}}));
  }
  select.addEventListener('change',()=>setMode(select.value));
  window.SXGoalNavigation=Object.freeze({currentGoal:goal,storageKey:STORAGE_KEY});
})();