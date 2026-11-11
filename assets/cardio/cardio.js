/* SpartanX cardio — compact set/previous/measurement/time logging.
   Cardio values are stored separately from weight/reps and strength metrics. */
(()=>{
'use strict';
const names=Object.freeze([
 'StairMaster (Floors)','StairMaster (Steps)','Treadmill','Rowing Machine',
 'Bike','Recumbent Bike','Cross Trainer','SkiErg'
]);
const aliases=Object.freeze({'stairmaster':'StairMaster (Floors)','rower':'Rowing Machine'});
const canonical=name=>aliases[String(name||'').trim().toLowerCase()]||String(name||'').trim();
const isCardio=name=>names.some(n=>n.toLowerCase()===canonical(name).toLowerCase());
const measurement=name=>{
 const n=canonical(name);
 return n==='StairMaster (Floors)'?'floors':n==='StairMaster (Steps)'?'steps':'distanceKm';
};
const metricName=(name,unit='km')=>{
 const key=measurement(name);
 return key==='floors'?'FLOORS':key==='steps'?'STEPS':unit==='mi'?'M':'KM';
};
const blank=()=>({durationSeconds:0,distanceKm:0,floors:0,steps:0,calories:0,weight:0,reps:0,rpe:'',type:'Cardio',done:false});
const valid=(set,name)=>{
 if(!set)return false;
 const keys=['durationSeconds','distanceKm','floors','steps','calories'];
 if(keys.some(k=>!Number.isFinite(Number(set[k]||0))||Number(set[k]||0)<0))return false;
 const key=name?measurement(name):null;
 return Number(set.durationSeconds)>0&&(key?Number(set[key])>0:
  Number(set.distanceKm)>0||Number(set.floors)>0||Number(set.steps)>0);
};
const formatTime=seconds=>{
 const n=Math.max(0,Math.round(Number(seconds)||0));
 return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
};
const parseTime=value=>{
 const s=String(value??'').trim();
 if(!s)return 0;
 // Numeric iPhone keypads may not offer a colon: 0300 = 03:00, 3000 = 30:00.
 if(/^\d{1,2}$/.test(s))return Number(s)*60;
 if(/^\d{3,6}$/.test(s)){
  const minutes=Number(s.slice(0,-2)),seconds=Number(s.slice(-2));
  return seconds<60?minutes*60+seconds:null;
 }
 const match=s.match(/^(\d{1,4}):([0-5]\d)$/);
 return match?Number(match[1])*60+Number(match[2]):null;
};
const duration=seconds=>{
 const n=Math.max(0,Math.round(Number(seconds)||0));
 return n>=3600?Math.floor(n/3600)+'h '+String(Math.floor((n%3600)/60)).padStart(2,'0')+'m':
  formatTime(n);
};
const distance=(km,unit='km')=>(unit==='mi'?Number(km||0)/1.609344:Number(km||0)).toLocaleString(undefined,{maximumFractionDigits:2})+' '+(unit==='mi'?'mi':'km');
const formatMeasure=(set,name,unit='km')=>{
 const key=measurement(name),n=Math.max(0,Number(set?.[key])||0);
 return key==='floors'?Math.round(n)+' floors':key==='steps'?Math.round(n)+' steps':distance(n,unit);
};
const previousText=(set,name,unit='km')=>
 set&&valid(set,name)?formatMeasure(set,name,unit)+' in '+formatTime(set.durationSeconds):'—';
const summary=(set,name,unit='km')=>{
 const parts=[];
 if(Number(set?.[measurement(name)])>0)parts.push(formatMeasure(set,name,unit));
 if(Number(set?.durationSeconds)>0)parts.push('in '+formatTime(set.durationSeconds));
 if(Number(set?.calories)>0)parts.push(Math.round(Number(set.calories))+' kcal');
 return parts.join(' ')||'No recorded values';
};
const render=(ex,i,unit,escape,previousSets=[],allExercises=[])=>{
 const sets=Array.isArray(ex.sets)?ex.sets:[],key=measurement(ex.name);
 const head='<div class="sx-cardio-set-head" aria-hidden="true"><span>SET</span><span>PREVIOUS</span><span>'+
  metricName(ex.name,unit)+'</span><span>TIME</span><span>✓</span></div>';
 const rows=sets.map((set,j)=>{
  const prior=previousSets[j]||previousSets.at(-1)||null;
  const amount=Number(set[key])>0?(key==='distanceKm'?
   Number((unit==='mi'?Number(set[key])/1.609344:Number(set[key])).toFixed(3)):
   Math.round(Number(set[key]))):'';
  const time=Number(set.durationSeconds)>0?formatTime(set.durationSeconds):'';
  return '<div class="sx-cardio-set-row set-entry '+(set.done?'is-complete':'')+'">'+
   '<span class="sx-cardio-set-number">'+(j+1)+'</span>'+
   '<span class="sx-cardio-prev" title="'+escape(previousText(prior,ex.name,unit))+'">'+
     escape(previousText(prior,ex.name,unit))+'</span>'+
   '<input type="number" class="sx-cardio-value" inputmode="decimal" min="0" step="'+(key==='distanceKm'?'0.001':'1')+
   '" value="'+escape(amount)+'" placeholder="—" aria-label="'+metricName(ex.name,unit)+' for set '+(j+1)+
   '" onchange="setCardioValue('+i+','+j+',\''+key+'\',this.value)">'+
   '<input type="text" class="sx-cardio-time" inputmode="numeric" value="'+escape(time)+
   '" placeholder="00:00" maxlength="7" aria-label="Time MM:SS for set '+(j+1)+
   '" onchange="setCardioValue('+i+','+j+',\'time\',this.value)" onblur="normalizeCardioTime('+i+','+j+',this)">'+
   '<input type="checkbox" class="sx-cardio-check done" '+(set.done?'checked':'')+
   ' aria-label="Complete set '+(j+1)+'" onchange="completeSet('+i+','+j+',this.checked)"></div>';
 }).join('');
 const calories=sets.some(x=>Number(x.calories)>0);
 const extras='<details class="sx-cardio-extra" '+(calories?'open':'')+'><summary>Optional calories</summary>'+
  sets.map((set,j)=>'<label>Set '+(j+1)+' · kcal <input type="number" inputmode="numeric" min="0" step="1" value="'+
   escape(Number(set.calories)||'')+'" aria-label="Calories for set '+(j+1)+
   '" onchange="setCardioValue('+i+','+j+',\'calories\',this.value)"></label>').join('')+'</details>';
 return '<article class="exercise-card sx-cardio-card"><div class="exercise-title-row">'+
  '<div class="exercise-avatar" aria-hidden="true">🏃</div>'+
  '<span role="button" tabindex="0" class="exercise-title sx-exercise-stats-link" data-live-exercise-link="'+escape(ex.name)+
  '" aria-label="How to log '+escape(ex.name)+' and view statistics">'+escape(ex.name)+'</span>'+
  '<button type="button" class="exercise-menu secondary small sx-exercise-menu-trigger" onclick="openExerciseActions('+i+')" aria-label="Options for '+escape(ex.name)+'" aria-haspopup="dialog">⋮</button></div>'+
  (window.SXActiveExerciseActions?.badge?.(allExercises,i)?
   '<div class="sx-superset-banner"><strong>'+escape(window.SXActiveExerciseActions.badge(allExercises,i).label)+'</strong>'+
    '<span>Alternate with '+escape(window.SXActiveExerciseActions.badge(allExercises,i).partnerName)+'</span></div>':'')+
  '<textarea class="exercise-notes" placeholder="Add notes here..." oninput="setNotes('+i+',this.value)">'+escape(ex.notes||'')+'</textarea>'+
  head+rows+extras+
  '<button type="button" class="add-set-button secondary" onclick="addCardioInterval('+i+')">＋ Add Set</button></article>';
};
const css=document.createElement('style');
css.textContent=`
#activeWorkout .sx-cardio-card .sx-cardio-set-head,
#activeWorkout .sx-cardio-card .sx-cardio-set-row{
 display:grid;grid-template-columns:38px minmax(75px,1.28fr) minmax(60px,.91fr) minmax(74px,1fr) 34px;
 gap:5px;align-items:center;width:100%;min-width:0;
}
#activeWorkout .sx-cardio-set-head{color:var(--muted);font-size:10px;letter-spacing:.4px;font-weight:750;text-align:center;padding:12px 0 7px}
#activeWorkout .sx-cardio-set-row{padding:3px 0;margin:0 0 5px;min-height:48px}
#activeWorkout .sx-cardio-set-row.is-complete{border-radius:7px}
#activeWorkout .sx-cardio-set-number{display:grid;place-items:center;min-height:37px;border-radius:8px;background:var(--panel2);color:var(--txt);font-size:15px;font-weight:850}
#activeWorkout .sx-cardio-prev{display:block;color:var(--muted);text-align:center;overflow-wrap:anywhere;font-size:11px;line-height:1.25;min-width:0}
#activeWorkout .sx-cardio-value,
#activeWorkout .sx-cardio-time{width:100%;min-width:0;height:40px;margin:0;padding:7px 2px!important;border:1px solid var(--line)!important;border-radius:9px!important;background:var(--panel2)!important;color:var(--txt)!important;text-align:center;font-size:14px!important;font-weight:750}
#activeWorkout .sx-cardio-value:focus-visible,
#activeWorkout .sx-cardio-time:focus-visible{outline:2px solid var(--lime);outline-offset:1px}
#activeWorkout .sx-cardio-check{width:27px!important;height:27px!important;justify-self:center;accent-color:var(--lime)}
#activeWorkout .sx-cardio-extra{margin:8px 0 0;padding-top:8px;border-top:1px solid var(--line);color:var(--muted);font-size:11px}
#activeWorkout .sx-cardio-extra summary{cursor:pointer;padding:4px 0;user-select:none}
#activeWorkout .sx-cardio-extra label{display:inline-flex;align-items:center;gap:7px;margin:6px 12px 5px 0;font-size:11px}
#activeWorkout .sx-cardio-extra input{width:75px;min-height:33px;font-size:13px;padding:5px;text-align:center}
@media(max-width:390px){
 #activeWorkout .sx-cardio-card .sx-cardio-set-head,
 #activeWorkout .sx-cardio-card .sx-cardio-set-row{grid-template-columns:30px minmax(62px,1.1fr) minmax(49px,.85fr) minmax(63px,1fr) 28px;gap:3px}
 #activeWorkout .sx-cardio-prev{font-size:10px}
 #activeWorkout .sx-cardio-value,#activeWorkout .sx-cardio-time{font-size:12px!important}
 #activeWorkout .sx-cardio-set-head{font-size:9px}
 #activeWorkout .sx-cardio-check{width:24px!important;height:24px!important}
}
`;
document.head.appendChild(css);
window.SpartanXCardio=Object.freeze({names,canonical,isCardio,measurement,metricName,blank,valid,formatTime,parseTime,duration,distance,formatMeasure,previousText,summary,render});
})();
