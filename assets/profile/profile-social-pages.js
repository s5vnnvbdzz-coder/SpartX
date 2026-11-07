/* SpartanX Profile header + offline social list pages v240.
 * The existing Edit / Share / Settings controls are MOVED, not recreated.
 * Existing bottom navigation and all workout/profile persistence stay intact. */
(()=>{
 'use strict';
 const root=document.getElementById('profile');
 const header=document.querySelector('body > header');
 const top=root?.querySelector('.sx-profile-layout-top');
 if(!root||!header||!top||root.dataset.sxConnectionsReady)return;
 root.dataset.sxConnectionsReady='true';

 // Move the already wired profile controls into SpartanX's real fixed header.
 // When Profile is not active, its header is hidden and the normal brand remains.
 const heading=top.firstElementChild;
 const handle=top.querySelector('#sxProfileHandle');
 const back=document.createElement('button');
 back.type='button';back.id='sxProfileConnectionsBack';
 back.className='sx-profile-connections-back';
 back.setAttribute('aria-label','Back to Profile');
 back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg><span>Back</span>';
 const title=document.createElement('strong');
 title.id='sxProfileConnectionsHeaderTitle';title.className='sx-profile-connections-header-title';
 heading.prepend(back);heading.append(title);
 header.appendChild(top);
 document.body.classList.add('sx-profile-real-header-ready');

 const page=document.createElement('section');
 page.id='sxProfileConnectionsPage';
 page.className='sx-profile-connections-page';
 page.hidden=true;
 page.setAttribute('aria-labelledby','sxProfileConnectionsTitle');
 page.innerHTML='<div class="sx-profile-connections-intro"><div class="eyebrow">SPARTANX ATHLETES</div><h2 id="sxProfileConnectionsTitle">Followers</h2><p id="sxProfileConnectionsDescription"></p></div><div class="sx-profile-connections-list" id="sxProfileConnectionsList" aria-live="polite"></div>';
 root.appendChild(page);
 const pageHeading=document.getElementById('sxProfileConnectionsTitle');
 const desc=document.getElementById('sxProfileConnectionsDescription');
 const list=document.getElementById('sxProfileConnectionsList');
 let current=null,addedHistoryEntry=false,profileReturnScroll=null;
 const readScroll=()=>Math.max(0,window.scrollY||0,document.documentElement.scrollTop||0,document.body.scrollTop||0);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rankMale=['Mortal','Spartan','Hero','Demigod','Titan','Olympian'];
 const rankFemale=['Initiate','Huntress','Amazon','Valkyrie','Athena','Olympian'];

 function render(){
  if(!current)return;
  const records=window.SpartanXSocial?.connectionList?.(current)||[];
  const name=current==='followers'?'Followers':'Following';
  title.textContent=name;
  pageHeading.textContent=name;
  desc.textContent=current==='followers'
   ?records.length+' '+(records.length===1?'athlete':'athletes')+' following you · offline test connections'
   :records.length+' '+(records.length===1?'athlete':'athletes')+' you follow · offline test connections';
  if(!records.length){
   list.innerHTML='<div class="sx-profile-connections-empty"><strong>No '+name.toLowerCase()+' yet</strong><p>'+
    (current==='followers'
     ?'Your follower list is empty. You can simulate an incoming follow in Athlete Search on Home.'
     :'You aren\'t following any athletes yet. Discover test athletes through Athlete Search on Home.')+
    '</p><button type="button" class="secondary" id="sxFindAthletesFromList">Find athletes</button></div>';
   return;
  }
  list.innerHTML=records.map(a=>{
   const following=!!a.isFollowing;
   const rank=(a.gender==='female'?rankFemale:rankMale)[a.tier]||'Mortal';
   const initials=escape(a.initials||a.name.split(' ').map(w=>w[0]).join('').slice(0,2));
   return '<article class="sx-profile-connection-row">'+
    '<div class="sx-profile-connection-avatar" aria-hidden="true">'+initials+'</div>'+
    '<div class="sx-profile-connection-copy"><strong>'+escape(a.name)+'</strong>'+
    '<small>@'+escape(a.handle)+'</small><span>'+escape(rank)+' · '+escape(a.focus)+'</span></div>'+
    '<button type="button" class="sx-profile-connection-follow'+(following?' is-following':'')+'" data-sx-social-follow="'+escape(a.id)+'" aria-pressed="'+String(following)+'" aria-label="'+escape(following?'Unfollow '+a.name:'Follow '+a.name)+'">'+(following?'Following':'Follow back')+'</button>'+
    '</article>';
  }).join('');
 }
 function hide(){
  if(!current)return;
  current=null;addedHistoryEntry=false;
  page.hidden=true;
  root.classList.remove('sx-connections-open');
  document.body.classList.remove('sx-profile-list-open');
  title.textContent='';
  const previous=profileReturnScroll;
  profileReturnScroll=null;
  if(previous!==null&&root.classList.contains('active')){
   const restore=()=>{
    if(root.classList.contains('active')&&!root.classList.contains('sx-connections-open')){
     window.scrollTo(0,previous);
     document.documentElement.scrollTop=previous;
    }
   };
   restore();requestAnimationFrame(restore);
  }
 }
 function show(kind,push){
  if(kind!=='followers'&&kind!=='following')return;
  // The established screen switcher keeps the real nav's Profile tab active.
  if(!root.classList.contains('active')&&typeof switchScreen==='function')switchScreen('profile');
  if(!current)profileReturnScroll=readScroll();
  current=kind;
  page.hidden=false;
  root.classList.add('sx-connections-open');
  document.body.classList.add('sx-profile-list-open');
  render();
  window.scrollTo({top:0,behavior:'instant'});
  if(push){
   history.pushState({sxProfileConnections:kind},'',location.href);
   addedHistoryEntry=true;
  }
  back.focus({preventScroll:true});
 }
 back.addEventListener('click',()=>{
  const hadEntry=addedHistoryEntry;
  hide();
  if(hadEntry)history.back();
  const followers=root.querySelector('[data-sx-social-jump="followers"]');
  followers?.focus({preventScroll:true});
 });
 window.addEventListener('popstate',event=>{
  const kind=event.state?.sxProfileConnections;
  if(kind==='followers'||kind==='following')show(kind,false);
  else hide();
 });
 // A swipe/tab change closes only the subpage. The navigation bar is unmodified.
 const observer=new MutationObserver(()=>{
  if(!root.classList.contains('active')&&current)hide();
 });
 observer.observe(root,{attributes:true,attributeFilter:['class']});
 page.addEventListener('click',event=>{
  if(event.target.closest('#sxFindAthletesFromList')){
   hide();
   window.SpartanXSocial?.openSearch?.('all');
  }
 });
 window.addEventListener('spartx:socialChanged',render);
 window.SpartanXProfileConnections={open(kind){show(kind,true)},render,close:hide};
})();
