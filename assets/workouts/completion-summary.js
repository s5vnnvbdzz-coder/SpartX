/* Read-only saved workout summary trial. No persistence, XP or progression changes. */
(function(root){
'use strict';
function metrics(session){
 const exercises=(session?.exercises||[]).map(e=>({...e,sets:(e.sets||[]).filter(s=>s.done!==false)})).filter(e=>e.sets.length);
 const sets=exercises.flatMap(e=>e.sets);
 const volume=sets.reduce((n,s)=>n+(Number(s.weight)||0)*(Number(s.reps)||0),0);
 const duration=Math.max(0,Number(session?.duration)||0);
 return {exercises,sets:sets.length,volume,duration,reps:sets.reduce((n,s)=>n+(Number(s.reps)||0),0)};
}
const clock=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+'h '+m+'m':m?m+'m':Math.floor(s%60)+'s';};
function records(session,history,api){
 if(!api)return [];
 const cutoff=Date.parse(session.date);
 const index=api.historyIndex((history||[]).filter(s=>String(s.id)!==String(session.id)&&(!Number.isFinite(cutoff)||Date.parse(s.date)<=cutoff)));
 return metrics(session).exercises.flatMap(ex=>api.forExercise(ex,index).map(r=>({...r,exercise:ex.name})));
}
function muscleCoverage(exercises,lookup,isCardio=()=>false){
 const primary=new Set(),secondary=new Set();
 for(const e of exercises){
  if(isCardio(e.name)||!e.sets.some(s=>!/^(?:w|warm\s*[- ]?\s*up)$/i.test(String(s.type||''))))continue;
  const roles=lookup(e.name)||{};
  for(const m of roles.primary||[])primary.add(m);
  for(const m of roles.secondary||[])secondary.add(m);
 }
 for(const m of primary)secondary.delete(m);
 return {primary:[...primary],secondary:[...secondary]};
}
const api={metrics,records,muscleCoverage};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;
const doc=root.document;
let view=null,scroll=null,cardIndex=0,carousel=null,dots=[],shareStatus=null,active=null,restoreFocus=null;
const node=(tag,txt,cls)=>{const e=doc.createElement(tag);if(txt!=null)e.textContent=txt;if(cls)e.className=cls;return e;};
function button(txt,cls,action){const e=node('button',txt,cls);e.type='button';e.addEventListener('click',action);return e;}
function metric(label,value){const e=node('div',null,'sx-cs-metric');e.append(node('strong',value),node('span',label));return e;}
function brand(card,label){card.append(node('div','SPARTANX','sx-cs-brand'),node('div',label,'sx-cs-kicker'));}
function formatWeight(n){return typeof kg==='function'?kg(n):Number(n).toLocaleString()+' kg';}
function formatDate(s){const d=new Date(s);return Number.isNaN(+d)?'Date unavailable':d.toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});}
function setCard(index,move=true){cardIndex=Math.max(0,Math.min(dots.length-1,index));dots.forEach((d,i)=>{d.classList.toggle('selected',i===cardIndex);d.setAttribute('aria-current',i===cardIndex?'true':'false');});if(move&&carousel){const c=carousel.children[cardIndex];carousel.scrollTo({left:c.offsetLeft-carousel.offsetLeft,behavior:'smooth'});}}
function close(){
 if(!view)return;
 view.remove();view=null;carousel=null;dots=[];active=null;
 doc.getElementById('workoutSavedOverlay')?.classList.remove('sx-completion-trial');
 if(scroll){doc.body.style.overflow=scroll.body;doc.documentElement.style.overflow=scroll.html;scroll=null;}
 try{restoreFocus?.focus({preventScroll:true});}catch(_){}restoreFocus=null;
}
function shareText(){
 const {session,m,coverage,pbs}=active;
 const base=['SPARTANX · WORKOUT COMPLETE',session.name||'Workout',formatDate(session.date),clock(m.duration)+' · '+formatWeight(m.volume)+' · '+m.sets+' sets'];
 if(cardIndex===1)base.push(...m.exercises.map(e=>e.name+' · '+e.sets.length+' sets'));
 if(cardIndex===2)base.push('Primary: '+muscleNames(coverage.primary),'Secondary: '+muscleNames(coverage.secondary));
 if(cardIndex===3)base.push(...pbs.map(r=>r.exercise+' · '+r.title+' · '+formatWeight(r.kg)+' × '+r.reps));
 return base.join('\n');
}
async function share(){
 const text=shareText();
 try{if(navigator.share){await navigator.share({title:active.session.name||'SpartanX workout',text});shareStatus.textContent='';return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);shareStatus.textContent='Workout summary copied.';return;}throw Error('Share unavailable');}
 catch(e){if(e?.name==='AbortError')return;shareStatus.textContent='Sharing unavailable. You can still screenshot this card.';}
}
function open(session,history,awards={}){
 if(!session||!metrics(session).sets)return false;
 const overlay=doc.getElementById('workoutSavedOverlay');if(!overlay)return false;
 close();
 const m=metrics(session),pbs=records(session,history,root.SpartanXSessionAchievements),coverage=muscleCoverage(m.exercises,exerciseMuscles,n=>!!root.SpartanXCardio?.isCardio(n));
 active={session,m,pbs,coverage};
 const finish=()=>closeWorkoutSavedDialog();
 view=node('section',null,'sx-cs-view');view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-labelledby','sxCompletionTitle');view.tabIndex=-1;
 const head=node('header',null,'sx-cs-header');head.append(button('←','sx-cs-back',finish),node('strong','SPARTANX','sx-cs-wordmark'),button('DONE','sx-cs-top-done',finish));
 const content=node('div',null,'sx-cs-content');
 const success=node('div',null,'sx-cs-success'),check=node('span','✓','sx-cs-check'),copy=node('div');const title=node('h1','Workout complete');title.id='sxCompletionTitle';copy.append(title,node('p','Successfully saved to your training history.'));success.append(check,copy);content.append(success);
 const sessionHead=node('div',null,'sx-cs-sessionhead');sessionHead.append(node('h2',session.name||'Workout'),node('p',formatDate(session.date)));content.append(sessionHead);
 carousel=node('div',null,'sx-cs-carousel');carousel.setAttribute('aria-label','Swipeable workout summary cards');carousel.tabIndex=0;
 const main=node('article',null,'sx-cs-card sx-cs-main');brand(main,'WORKOUT SUMMARY');main.append(node('strong',formatWeight(m.volume),'sx-cs-volume'),node('span','TOTAL VOLUME','sx-cs-kicker'));const row=node('div',null,'sx-cs-metrics');row.append(metric('DURATION',clock(m.duration)),metric('SETS',String(m.sets)),metric('EXERCISES',String(m.exercises.length)));main.append(row);carousel.append(main);
 const breakdown=node('article',null,'sx-cs-card');brand(breakdown,'EXERCISE BREAKDOWN');for(const e of m.exercises.slice(0,5)){const r=node('div',null,'sx-cs-bar-row');r.append(node('span',e.name),node('strong',String(e.sets.length)+' sets'));const bar=node('div',null,'sx-cs-bar'),fill=node('i');fill.style.width=(100*e.sets.length/Math.max(1,...m.exercises.map(x=>x.sets.length)))+'%';bar.append(fill);breakdown.append(r,bar);}if(m.exercises.length>5)breakdown.append(node('small','+'+(m.exercises.length-5)+' more exercises'));carousel.append(breakdown);
 const anatomy=node('article',null,'sx-cs-card sx-cs-anatomy');brand(anatomy,'MUSCLE COVERAGE');const diagram=node('div',null,'sx-cs-anatomy-map');if(root.SpartanXAnatomy?.render&&coverage.primary.length+coverage.secondary.length)diagram.innerHTML=root.SpartanXAnatomy.render(coverage.primary,coverage.secondary,{gender:db.profile?.standard==='female'?'female':'male',compact:true});else diagram.append(node('p','No classified working sets.'));anatomy.append(diagram,node('small','Primary · Secondary involvement'));carousel.append(anatomy);
 const achievement=node('article',null,'sx-cs-card');brand(achievement,'PERSONAL ACHIEVEMENTS');achievement.append(node('strong',String(pbs.length),'sx-cs-volume'),node('span',pbs.length?'NEW RECORDS':'NEW RECORDS THIS SESSION','sx-cs-kicker'));for(const r of pbs.slice(0,3))achievement.append(node('p',r.exercise+' · '+r.title+' · '+(r.kind==='estimated'?formatWeight(r.valueKg)+' estimated':formatWeight(r.kg)+' × '+r.reps),'sx-cs-pb'));if(!pbs.length)achievement.append(node('p','Every completed session builds your training history.'));if(awards.xpEarned>0)achievement.append(node('p','+'+awards.xpEarned.toLocaleString()+' XP earned','sx-cs-pb'));carousel.append(achievement);
 content.append(carousel);
 const nav=node('div',null,'sx-cs-dots');dots=[0,1,2,3].map(i=>{const d=button('','sx-cs-dot',()=>setCard(i));d.setAttribute('aria-label',['Summary','Exercise breakdown','Muscle coverage','Achievements'][i]);nav.append(d);return d;});content.append(nav);
 carousel.addEventListener('scroll',()=>{let i=0,best=Infinity;for(const [j,c] of [...carousel.children].entries()){const distance=Math.abs(c.offsetLeft-carousel.offsetLeft-carousel.scrollLeft);if(distance<best){best=distance;i=j;}}setCard(i,false);},{passive:true});
 carousel.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setCard(cardIndex+(e.key==='ArrowRight'?1:-1));}});
 const list=node('section',null,'sx-cs-list');list.append(node('h2','Session breakdown'));const rows=node('div',null,'sx-cs-list-panel');
 for(const ex of m.exercises){const line=node('details',null,'sx-cs-exercise');const summary=node('summary');summary.append(node('span',ex.name),node('strong',ex.sets.length+' '+(root.SpartanXCardio?.isCardio(ex.name)?'intervals':'sets')));line.append(summary);for(const s of ex.sets){const t=root.SpartanXCardio?.isCardio(ex.name)?root.SpartanXCardio.summary(s,ex.name,preferences.distance):formatWeight(s.weight)+' × '+(isBenchStaticHold(ex.name)?(s.durationSeconds||0)+' sec':s.reps+' reps')+(s.rpe!=null&&s.rpe!==''?' · RPE '+s.rpe:'');line.append(node('p',t,'sx-cs-set'));}rows.append(line);}list.append(rows);content.append(list);
 const intel=node('section',null,'sx-cs-intel');intel.append(node('strong','SpartanX Intelligence'),node('p','Strength, workload and muscle-use insights.'));const insight=node('div',null,'sx-cs-insights');insight.hidden=true;
 insight.append(node('h3','Session insights'),node('p','Primary: '+(muscleNames(coverage.primary)||'None classified')),node('p','Secondary: '+(muscleNames(coverage.secondary)||'None classified')));
 const rpes=m.exercises.flatMap(e=>e.sets).filter(s=>s.rpe!=null&&s.rpe!==''&&Number(s.rpe)>=6&&Number(s.rpe)<=10&&!/warm|^w$/i.test(s.type||'')).map(s=>Number(s.rpe));insight.append(node('p',rpes.length?'Average recorded working-set RPE: '+(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1)+' ('+rpes.length+' rated sets)':'No working-set RPE recorded.'));
 for(const r of pbs)insight.append(node('p',r.exercise+' · '+r.title+' · '+(r.kind==='estimated'?formatWeight(r.valueKg)+' estimated':formatWeight(r.kg)+' × '+r.reps)));
 if(awards.xpEarned>0)insight.append(node('p','+'+awards.xpEarned+' XP earned'+(awards.weekBonus?' · includes '+awards.weekBonus+' weekly bonus':'')));
 insight.append(node('small','Muscle involvement and logged effort are not a recovery or workout-quality score.'));
 content.append(intel,button('VIEW WORKOUT INSIGHTS','sx-cs-primary',()=>{insight.hidden=!insight.hidden;if(!insight.hidden)insight.scrollIntoView({block:'nearest',behavior:'smooth'});}),insight,button('SHARE WORKOUT','sx-cs-secondary',share));shareStatus=node('p','','sx-cs-share-status');shareStatus.setAttribute('role','status');content.append(shareStatus,button('DONE','sx-cs-final',finish));
 view.append(head,content);restoreFocus=doc.activeElement;scroll={body:doc.body.style.overflow,html:doc.documentElement.style.overflow};doc.body.style.overflow='hidden';doc.documentElement.style.overflow='hidden';overlay.append(view);overlay.classList.add('sx-completion-trial');overlay.classList.remove('hidden');setCard(0,false);view.focus({preventScroll:true});
 view.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}if(e.key==='Tab'){const focus=[...view.querySelectorAll('button,summary,[tabindex="0"]')].filter(x=>!x.closest('[hidden]'));if(!focus.length)return;const first=focus[0],last=focus[focus.length-1];if(e.shiftKey&&(doc.activeElement===first||doc.activeElement===view)){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}}});
 return true;
}
root.SXCompletionSummary=Object.freeze({...api,open,close});
})(typeof window!=='undefined'?window:globalThis);
