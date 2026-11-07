/* SpartanX Offline Social Prototype · local demo only, no network requests. */
(function () {
  'use strict';
  const athletes = [
    {id:'maya',name:'Maya Reed',handle:'mayareed',gender:'female',tier:4,country:'United Kingdom',focus:'Powerlifting & strength',workouts:84,initials:'MR'},
    {id:'alex',name:'Alex Mercer',handle:'alexmercer',gender:'male',tier:3,country:'United Kingdom',focus:'Squat & bench training',workouts:62,initials:'AM'},
    {id:'lena',name:'Lena Cole',handle:'lenacole',gender:'female',tier:5,country:'Romania',focus:'Strength & conditioning',workouts:126,initials:'LC'},
    {id:'theo',name:'Theo Brooks',handle:'theobrooks',gender:'male',tier:2,country:'Ireland',focus:'Deadlift training',workouts:41,initials:'TB'},
    {id:'samira',name:'Samira Knox',handle:'samiraknox',gender:'female',tier:1,country:'Canada',focus:'Bodybuilding',workouts:19,initials:'SK'},
    {id:'jordan',name:'Jordan Vale',handle:'jordanvale',gender:'male',tier:0,country:'Australia',focus:'Learning the big three',workouts:5,initials:'JV'}
  ];
  const maleRanks=['Mortal','Spartan','Hero','Demigod','Titan','Olympian'];
  const femaleRanks=['Initiate','Huntress','Amazon','Valkyrie','Athena','Olympian'];
  const palette=['#acb4bc','#bd6354','#e1b86e','#bd9acf','#87b7d5','#e7c77e'];
  const idSet=new Set(athletes.map(a=>a.id));
  let currentFilter='all';
  let searchText='';
  let expanded=false;

  function state() {
    if(!db.socialPrototype || typeof db.socialPrototype!=='object' || Array.isArray(db.socialPrototype)) db.socialPrototype={};
    const value=db.socialPrototype;
    ['following','followers'].forEach(key=>{
      const clean=Array.isArray(value[key])?value[key].filter(id=>idSet.has(id)):[];
      value[key]=[...new Set(clean)];
    });
    return value;
  }
  function counts() {
    const current=state();
    return {following:current.following.length,followers:current.followers.length};
  }
  function cardStatsMarkup() {
    const c=counts();
    return '<div class="sx-feed-social-metrics" aria-label="Offline social demo connections">'
      +'<button type="button" data-sx-social-jump="followers" aria-label="View demo followers"><strong data-sx-social-count="followers">'+c.followers+'</strong> Followers</button>'
      +'<button type="button" data-sx-social-jump="following" aria-label="View demo following"><strong data-sx-social-count="following">'+c.following+'</strong> Following</button>'
      +'</div>';
  }
  function renderCounts() {
    const c=counts();
    document.querySelectorAll('[data-sx-social-count]').forEach(node=>{
      const kind=node.getAttribute('data-sx-social-count');
      if(kind in c) node.textContent=String(c[kind]);
    });
    const summary=document.getElementById('sxSocialCountSummary');
    if(summary) summary.textContent=c.following+' following · '+c.followers+' followers';
  }
  function frameFor(a) {
    return './ranks/'+(a.gender==='female'?'female-frame-'+femaleRanks[a.tier].toLowerCase():'male-profile-'+maleRanks[a.tier].toLowerCase())+'.svg';
  }
  function athleteMarkup(a, current) {
    const followed=current.following.includes(a.id);
    const follower=current.followers.includes(a.id);
    const rank=(a.gender==='female'?femaleRanks:maleRanks)[a.tier];
    return '<article class="sx-social-athlete" style="--sx-demo-accent:'+palette[a.tier]+'">'
      +'<div class="sx-social-athlete-head">'
      +'<div class="sx-social-avatar" aria-hidden="true"><img src="'+frameFor(a)+'" alt=""><span>'+a.initials+'</span></div>'
      +'<div class="sx-social-athlete-info"><strong>'+esc(a.name)+'</strong><small>@'+esc(a.handle)+' · '+esc(a.country)+'</small>'
      +'<span class="sx-social-rank">'+esc(rank)+' · '+a.workouts+' demo workouts</span></div>'
      +'</div>'
      +'<div class="sx-social-focus">'+esc(a.focus)+(follower?' · <strong>Follows you (demo)</strong>':'')+'</div>'
      +'<div class="sx-social-athlete-actions">'
      +'<button type="button" class="sx-social-follow'+(followed?' is-following':'')+'" data-sx-social-follow="'+a.id+'" aria-pressed="'+String(followed)+'">'+(followed?'✓ Following':'＋ Follow')+'</button>'
      +'<button type="button" class="sx-social-simulate'+(follower?' is-incoming':'')+'" data-sx-social-incoming="'+a.id+'" aria-pressed="'+String(follower)+'">'+(follower?'Remove demo follower':'Simulate follows you')+'</button>'
      +'</div></article>';
  }
  function renderSearch() {
    const host=document.getElementById('sxSocialResults');
    if(!host) return;
    const value=state(),term=searchText.trim().toLocaleLowerCase('en');
    const list=athletes.filter(a=>{
      if(currentFilter==='following'&&!value.following.includes(a.id))return false;
      if(currentFilter==='followers'&&!value.followers.includes(a.id))return false;
      const rank=(a.gender==='female'?femaleRanks:maleRanks)[a.tier];
      return !term||[a.name,a.handle,a.country,a.focus,rank].some(field=>field.toLocaleLowerCase('en').includes(term));
    });
    document.querySelectorAll('[data-sx-social-filter]').forEach(button=>{
      const selected=button.dataset.sxSocialFilter===currentFilter;
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    const label=currentFilter==='following'?'following':currentFilter==='followers'?'followers':'demo athletes';
    host.innerHTML=list.length?'<div class="sx-social-results-label">'+list.length+' '+label+' found</div>'+list.map(a=>athleteMarkup(a,value)).join('')
      :'<div class="sx-social-empty"><strong>No '+label+' found.</strong><p>'+(
       term?'Try another name, rank or training style.'
       :currentFilter==='following'?'Follow a sample athlete to see them here.'
       :currentFilter==='followers'?'Use “Simulate follows you” on a demo athlete to test followers.'
       :'No sample athletes found.'
      )+'</p></div>';
    renderCounts();
  }
  function setExpanded(next) {
    expanded=!!next;
    const body=document.getElementById('sxSocialBody');
    const toggle=document.getElementById('sxSocialToggle');
    if(body)body.hidden=!expanded;
    if(toggle){toggle.setAttribute('aria-expanded',String(expanded));toggle.textContent=expanded?'CLOSE SEARCH':'FIND ATHLETES';}
    if(expanded)renderSearch();
  }
  function openSearch(filter) {
    if(filter==='followers'||filter==='following'||filter==='all')currentFilter=filter;
    searchText='';
    const input=document.getElementById('sxAthleteSearchInput');
    if(input)input.value='';
    if(typeof switchScreen==='function')switchScreen('home');
    setExpanded(true);
    const card=document.getElementById('sxSocialHome');
    if(card)requestAnimationFrame(()=>card.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  function toggleConnection(kind,id) {
    if(!idSet.has(id))return;
    const current=state(),group=current[kind];
    const index=group.indexOf(id);
    if(index===-1)group.push(id);else group.splice(index,1);
    try{persist();}catch(error){console.warn('Unable to save demo social connections',error);}
    renderSearch();
    renderCounts();
    window.dispatchEvent(new CustomEvent('spartx:socialChanged',{detail:counts()}));
  }
  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-sx-social-jump]');
    if(nav){
      event.preventDefault();
      const list=nav.dataset.sxSocialJump;
      if((list==='followers'||list==='following')&&window.SpartanXProfileConnections){
        window.SpartanXProfileConnections.open(list);
      } else {
        openSearch(list);
      }
      return;
    }
    const toggle=event.target.closest('#sxSocialToggle');
    if(toggle){event.preventDefault();setExpanded(!expanded);return;}
    const filter=event.target.closest('[data-sx-social-filter]');
    if(filter){event.preventDefault();currentFilter=filter.dataset.sxSocialFilter;renderSearch();return;}
    const outbound=event.target.closest('[data-sx-social-follow]');
    if(outbound){event.preventDefault();toggleConnection('following',outbound.dataset.sxSocialFollow);return;}
    const inbound=event.target.closest('[data-sx-social-incoming]');
    if(inbound){event.preventDefault();toggleConnection('followers',inbound.dataset.sxSocialIncoming);}
  });
  const input=document.getElementById('sxAthleteSearchInput');
  if(input)input.addEventListener('input',event=>{searchText=String(event.target.value||'');renderSearch();});
  function connectionList(kind){
    if(kind!=='followers'&&kind!=='following')return [];
    const current=state();
    return current[kind].map(id=>{
      const athlete=athletes.find(a=>a.id===id);
      return athlete?{...athlete,isFollowing:current.following.includes(id),followsYou:current.followers.includes(id)}:null;
    }).filter(Boolean);
  }
  window.SpartanXSocial={renderCounts,cardStatsMarkup,openSearch,renderSearch,connectionList,counts};
  state();
  renderCounts();
  setExpanded(false);
  if(typeof renderWorkoutFeed==='function')renderWorkoutFeed();
})();