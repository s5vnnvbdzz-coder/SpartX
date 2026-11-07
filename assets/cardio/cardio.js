/* SpartanX cardio machine types and logging. No modifications to strength records. */
(()=>{
'use strict';
const names=Object.freeze(['StairMaster','Treadmill','Rower','Bike','Recumbent Bike','Cross Trainer','SkiErg']);
const isCardio=name=>names.some(n=>n.toLowerCase()===String(name||'').toLowerCase());
const blank=()=>({durationSeconds:0,distanceKm:0,floors:0,calories:0,weight:0,reps:0,rpe:'',type:'Cardio',done:false});
const valid=set=>{
 if(!set)return false;
 const values=['durationSeconds','distanceKm','floors','calories'].map(k=>Number(set[k]||0));
 return values.every(v=>Number.isFinite(v)&&v>=0)&&(values[0]>0||values[1]>0||values[2]>0);
};
const duration=seconds=>{
 const s=Math.max(0,Math.round(Number(seconds)||0));
 return s>=3600?Math.floor(s/3600)+'h '+String(Math.floor(s%3600/60)).padStart(2,'0')+'m':
  Math.floor(s/60)+'m '+String(s%60).padStart(2,'0')+'s';
};
const distance=(km,unit='km')=>(unit==='mi'?Number(km||0)/1.609344:Number(km||0)).toLocaleString(undefined,{maximumFractionDigits:2})+' '+unit;
const summary=(set,name,unit='km')=>{
 const bits=[];
 if(Number(set.durationSeconds)>0)bits.push(duration(set.durationSeconds));
 if(Number(set.distanceKm)>0)bits.push(distance(set.distanceKm,unit));
 if(name==='StairMaster'&&Number(set.floors)>0)bits.push(Math.round(set.floors)+' floors');
 if(Number(set.calories)>0)bits.push(Math.round(set.calories)+' kcal');
 return bits.join(' · ')||'No recorded values';
};
const field=(i,j,key,label,value,step,unit,escape)=>{
 return '<label class="sx-cardio-field"><span>'+label+(unit?' ('+unit+')':'')+'</span>'+
 '<input class="sx-cardio-input" type="number" inputmode="decimal" min="0" step="'+step+
 '" value="'+escape(value??'')+'" aria-label="'+label+'" data-cardio-field="'+key+
 '" oninput="setCardioValue('+i+','+j+',\''+key+'\',this.value)"></label>';
};
const render=(ex,i,unit,escape)=>{
 const sets=(ex.sets||[]);
 const entries=sets.map((set,j)=>{
  const minutes=Number(set.durationSeconds)>0?Math.floor(Number(set.durationSeconds)/60):'';
  const seconds=Number(set.durationSeconds)>0?Math.round(Number(set.durationSeconds))%60:'';
  const km=Number(set.distanceKm)>0?+(unit==='mi'?Number(set.distanceKm)/1.609344:Number(set.distanceKm)).toFixed(2):'';
  const floors=Number(set.floors)>0?set.floors:'';
  const calories=Number(set.calories)>0?set.calories:'';
  return '<div class="sx-cardio-interval set-entry '+(set.done?'is-complete':'')+'">'+
   '<div class="sx-cardio-interval-title"><strong>INTERVAL '+(j+1)+'</strong>'+
   (sets.length>1?'<button type="button" class="secondary small" onclick="removeCardioInterval('+i+','+j+')">REMOVE</button>':'')+'</div>'+
   '<div class="sx-cardio-fields">'+field(i,j,'minutes','Min',minutes,'1','',escape)+field(i,j,'seconds','Sec',seconds,'1','',escape)+
   (ex.name==='StairMaster'?field(i,j,'floors','Floors',floors,'1','',escape):
    field(i,j,'distanceKm','Distance',km,'0.01',unit,escape))+
   field(i,j,'calories','Calories',calories,'1','kcal',escape)+'</div>'+
   '<label class="sx-cardio-done"><input class="done" type="checkbox" '+(set.done?'checked':'')+
   ' aria-label="Mark cardio interval complete" onchange="completeSet('+i+','+j+',this.checked)"> Complete interval</label></div>';
 }).join('');
 return '<article class="exercise-card sx-cardio-card"><div class="exercise-title-row"><div class="exercise-avatar" aria-hidden="true">🏃</div>'+
 '<button type="button" class="exercise-title sx-exercise-stats-link" data-live-exercise-link="'+escape(ex.name)+
 '" aria-label="View statistics for '+escape(ex.name)+'">'+escape(ex.name)+'</button>'+
 '<button class="exercise-menu secondary small" onclick="removeEx('+i+')" aria-label="Remove exercise">×</button></div>'+
 '<div class="sx-cardio-subtitle">CARDIO · ENTER MACHINE READOUT</div>'+
 '<textarea class="exercise-notes" placeholder="Add notes here..." oninput="setNotes('+i+',this.value)">'+escape(ex.notes||'')+'</textarea>'+
 entries+'<button type="button" class="add-set-button secondary" onclick="addCardioInterval('+i+')">＋ Add interval</button></article>';
};
const css=document.createElement('style');
css.textContent=`
#activeWorkout .sx-cardio-card .sx-cardio-subtitle{font-size:10px;letter-spacing:.75px;color:var(--muted);font-weight:850;margin:-3px 0 8px}
#activeWorkout .sx-cardio-interval{border-top:1px solid var(--line);padding:13px 2px 10px;margin-top:9px}
#activeWorkout .sx-cardio-interval-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;color:var(--lime);font-size:11px;letter-spacing:.65px}
#activeWorkout .sx-cardio-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
#activeWorkout .sx-cardio-field{display:flex;flex-direction:column;gap:6px;min-width:0;font-weight:800;font-size:10px;color:var(--muted)}
#activeWorkout .sx-cardio-field .sx-cardio-input{width:100%;min-width:0;min-height:42px;padding:9px 5px;font-weight:750;font-size:16px;color:var(--txt);border:1px solid var(--line);background:var(--panel2);border-radius:9px;text-align:center}
#activeWorkout .sx-cardio-field .sx-cardio-input:focus{outline:2px solid var(--lime);outline-offset:1px}
#activeWorkout .sx-cardio-done{display:flex;align-items:center;gap:10px;margin-top:12px;font-weight:750;color:var(--txt);font-size:12px;cursor:pointer}
#activeWorkout .sx-cardio-done input{width:23px;height:23px;accent-color:var(--lime);margin:0}
@media(max-width:360px){#activeWorkout .sx-cardio-fields{gap:5px}#activeWorkout .sx-cardio-field .sx-cardio-input{font-size:14px}}
`;
document.head.appendChild(css);
window.SpartanXCardio=Object.freeze({names,isCardio,blank,valid,duration,distance,summary,render});
})();
