/* SpartanX Scientific Programming Engine v0.1 (Phase 2).
 * Deterministic, offline, read-only programme preview.
 * Rules are evidence-informed coaching heuristics, NOT experimentally derived
 * exercise-specific SFR scores. No saved workout / cycle / TM storage writes.
 */
(function(root){
'use strict';
const VERSION='0.1.0';
const EVIDENCE=Object.freeze([
 {id:'ACSM2026',level:'overview-of-reviews',title:'ACSM Resistance Training Prescription Position Stand (2026)',url:'https://pubmed.ncbi.nlm.nih.gov/41843416/',use:'Progressive training, heavier loading for strength, sufficient sets for hypertrophy; avoid unnecessary complexity.'},
 {id:'PELLAND2026',level:'meta-regression',title:'Pelland et al. Resistance Training Dose Response (2026)',url:'https://pubmed.ncbi.nlm.nih.gov/41343037/',use:'Weekly sets have diminishing returns; count indirect exposure fractionally rather than as direct work.'},
 {id:'ROBINSON2024',level:'exploratory-meta-regression',title:'Robinson et al. Proximity to Failure and Adaptation (2024)',url:'https://pubmed.ncbi.nlm.nih.gov/38970765/',use:'Hypertrophy may benefit from closer proximity to failure; precision of the RIR relationship is uncertain.'},
 {id:'AUTOREG2025',level:'systematic-review',title:'Autoregulated Resistance Training for Maximal Strength (2025)',url:'https://pubmed.ncbi.nlm.nih.gov/40791980/',use:'Supports evaluating autoregulation; exact response thresholds below are conservative engineering choices, not study-derived cutoffs.'}
]);
const MUSCLES=['Chest','Back','Shoulders','Quads','Hamstrings','Glutes','Calves','Biceps','Triceps','Core'];
const ex=(id,name,pattern,equipment,primary,secondary=[],axial=0,kind='accessory')=>Object.freeze({id,name,pattern,equipment,primary,secondary,axial,kind});
const EXERCISES=Object.freeze([
 ex('barbell-squat','Back Squat','squat','barbell','Quads',['Glutes','Core'],3,'main'),
 ex('paused-squat','Paused Squat','squatSecondary','barbell','Quads',['Glutes','Core'],2,'main'),
 ex('goblet-squat','Goblet Squat','quad','dumbbell','Quads',['Glutes','Core'],1),
 ex('leg-press','Leg Press','quad','machine','Quads',['Glutes'],1),
 ex('hack-squat','Hack Squat','quad','machine','Quads',['Glutes'],1),
 ex('split-squat','Bulgarian Split Squat','singleLeg','dumbbell','Quads',['Glutes'],1),
 ex('body-split-squat','Split Squat','singleLeg','bodyweight','Quads',['Glutes'],0),
 ex('leg-extension','Leg Extension','quadIsolation','machine','Quads',[],0),
 ex('conventional-deadlift','Deadlift','deadlift','barbell','Hamstrings',['Glutes','Back'],3,'main'),
 ex('romanian-deadlift','Romanian Deadlift','hinge','barbell','Hamstrings',['Glutes','Back'],3),
 ex('dumbbell-rdl','Dumbbell Romanian Deadlift','hinge','dumbbell','Hamstrings',['Glutes'],2),
 ex('seated-curl','Seated Leg Curl','hamCurl','machine','Hamstrings',[],0),
 ex('lying-curl','Lying Leg Curl','hamCurl','machine','Hamstrings',[],0),
 ex('sliding-curl','Sliding Leg Curl','hamCurl','bodyweight','Hamstrings',[],0),
 ex('hip-thrust','Hip Thrust','glutes','barbell','Glutes',['Hamstrings'],1),
 ex('glute-bridge','Glute Bridge','glutes','bodyweight','Glutes',['Hamstrings'],0),
 ex('barbell-bench','Bench Press','bench','barbell','Chest',['Triceps','Shoulders'],1,'main'),
 ex('close-grip-bench','Close-Grip Bench Press','benchSecondary','barbell','Chest',['Triceps','Shoulders'],1,'main'),
 ex('dumbbell-bench','Dumbbell Bench Press','chestPress','dumbbell','Chest',['Triceps','Shoulders'],0),
 ex('chest-press','Machine Chest Press','chestPress','machine','Chest',['Triceps','Shoulders'],0),
 ex('pushup','Push-Up','chestPress','bodyweight','Chest',['Triceps','Shoulders'],0),
 ex('incline-db','Incline Dumbbell Press','chestAccessory','dumbbell','Chest',['Triceps','Shoulders'],0),
 ex('chest-fly','Cable Fly','chestAccessory','cable','Chest',[],0),
 ex('ohp','Overhead Press','verticalPress','barbell','Shoulders',['Triceps'],1),
 ex('db-shoulder','Dumbbell Shoulder Press','verticalPress','dumbbell','Shoulders',['Triceps'],0),
 ex('chest-row','Chest-Supported Row','row','dumbbell','Back',['Biceps'],0),
 ex('cable-row','Seated Cable Row','row','cable','Back',['Biceps'],0),
 ex('db-row','One-Arm Dumbbell Row','row','dumbbell','Back',['Biceps'],1),
 ex('pull-down','Lat Pulldown','verticalPull','cable','Back',['Biceps'],0),
 ex('pull-up','Pull-Up','verticalPull','bodyweight','Back',['Biceps'],0),
 ex('lateral-raise','Dumbbell Lateral Raise','lateral','dumbbell','Shoulders',[],0),
 ex('cable-lateral','Cable Lateral Raise','lateral','cable','Shoulders',[],0),
 ex('rear-delt','Cable Rear Delt Fly','rearDelts','cable','Shoulders',[],0),
 ex('db-rear-delt','Dumbbell Rear Delt Fly','rearDelts','dumbbell','Shoulders',[],0),
 ex('db-curl','Dumbbell Curl','biceps','dumbbell','Biceps',[],0),
 ex('cable-curl','Cable Curl','biceps','cable','Biceps',[],0),
 ex('pushdown','Triceps Pushdown','triceps','cable','Triceps',[],0),
 ex('overhead-extension','Dumbbell Overhead Triceps Extension','triceps','dumbbell','Triceps',[],0),
 ex('standing-calf','Standing Calf Raise','calves','machine','Calves',[],0),
 ex('db-calf','Dumbbell Calf Raise','calves','dumbbell','Calves',[],0),
 ex('plank','Plank','core','bodyweight','Core',[],0),
 ex('pallof','Pallof Press','core','cable','Core',[],0)
]);
const TEMPLATES={
 bodybuilding:{
 3:[['Full Body A','quad','chestPress','row','hamCurl','lateral','core'],['Full Body B','hinge','verticalPress','verticalPull','quadIsolation','triceps','calves'],['Full Body C','singleLeg','chestAccessory','row','hamCurl','biceps','rearDelts']],
 4:[['Upper A','chestPress','row','verticalPull','chestAccessory','lateral','triceps','biceps'],['Lower A','quad','hamCurl','glutes','calves','core'],['Upper B','verticalPress','verticalPull','chestPress','row','rearDelts','biceps','triceps'],['Lower B','singleLeg','hinge','quadIsolation','calves','core']],
 5:[['Upper','chestPress','row','verticalPull','lateral','biceps','triceps'],['Lower','quad','hamCurl','glutes','calves','core'],['Push','chestPress','verticalPress','chestAccessory','lateral','triceps'],['Pull','row','verticalPull','rearDelts','biceps'],['Legs','singleLeg','hamCurl','quadIsolation','calves','core']],
 6:[['Push A','chestPress','verticalPress','chestAccessory','lateral','triceps'],['Pull A','row','verticalPull','rearDelts','biceps','core'],['Legs A','quad','hamCurl','glutes','calves'],['Push B','chestPress','chestAccessory','verticalPress','lateral','triceps'],['Pull B','verticalPull','row','rearDelts','biceps','core'],['Legs B','singleLeg','hinge','quadIsolation','calves']]
 },
 powerlifting:{
 3:[['Squat Focus','squat','benchSecondary','row','hamCurl','core'],['Bench Focus','bench','verticalPull','chestAccessory','triceps','rearDelts'],['Deadlift Focus','deadlift','singleLeg','row','calves','core']],
 4:[['Squat Focus','squat','row','hamCurl','core'],['Bench Focus','bench','squatSecondary','verticalPull','triceps'],['Deadlift Focus','deadlift','quadIsolation','row','core'],['Upper Volume','benchSecondary','verticalPull','lateral','triceps','biceps']],
 5:[['Squat Focus','squat','row','hamCurl','core'],['Bench Focus','bench','verticalPull','triceps'],['Deadlift Focus','deadlift','quadIsolation','core'],['Bench Volume','benchSecondary','row','lateral','biceps'],['Lower Support','squatSecondary','hamCurl','calves','core']],
 6:[['Squat Focus','squat','row','hamCurl'],['Bench Focus','bench','verticalPull','triceps'],['Deadlift Focus','deadlift','core','rearDelts'],['Upper Volume','benchSecondary','row','lateral','biceps'],['Lower Technique','squatSecondary','hamCurl','calves'],['Upper Support','chestPress','verticalPull','triceps','core']]
 },
 powerbuilding:{
 3:[['Squat + Upper','squat','benchSecondary','row','lateral','core'],['Bench + Back','bench','verticalPull','chestAccessory','biceps','triceps'],['Deadlift + Legs','deadlift','singleLeg','hamCurl','calves','core']],
 4:[['Squat + Legs','squat','hamCurl','calves','core'],['Bench + Back','bench','row','verticalPull','triceps','lateral'],['Deadlift + Posterior','deadlift','quadIsolation','glutes','core'],['Upper Hypertrophy','chestPress','verticalPull','rearDelts','biceps','triceps']],
 5:[['Squat + Legs','squat','hamCurl','calves'],['Bench + Back','bench','row','triceps','lateral'],['Deadlift','deadlift','quadIsolation','core'],['Upper Hypertrophy','chestPress','verticalPull','rearDelts','biceps'],['Lower Support','singleLeg','hamCurl','glutes','calves']],
 6:[['Squat Focus','squat','hamCurl','core'],['Bench Focus','bench','row','triceps'],['Deadlift Focus','deadlift','quadIsolation','core'],['Upper Volume','chestPress','verticalPull','lateral','biceps'],['Lower Hypertrophy','singleLeg','hamCurl','glutes','calves'],['Upper Accessories','chestAccessory','row','rearDelts','triceps']]
 }
};
const within=(v,min,max,def)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):def};
const equipmentAllowed=new Set(['barbell','dumbbell','machine','cable','bodyweight']);
const modes=new Set(['bodybuilding','powerlifting','powerbuilding']);
function profileOptions(input={}){
 const goal=modes.has(input.goal)?input.goal:'bodybuilding';
 const days=Math.round(within(input.days,3,6,4));
 const minutes=Math.round(within(input.minutes,35,110,70));
 const experience=['beginner','intermediate','advanced'].includes(input.experience)?input.experience:'intermediate';
 const equipments=(Array.isArray(input.equipment)?input.equipment:['barbell','dumbbell','machine','cable','bodyweight']).filter(e=>equipmentAllowed.has(e));
 return {goal,days,minutes,experience,equipment:[...new Set(equipments)],weeks:Math.round(within(input.weeks,4,12,8)),priority:MUSCLES.includes(input.priority)?input.priority:'Balanced',readiness:input.readiness||'normal'};
}
function preferred(pattern,p){
 const candidates=EXERCISES.filter(e=>e.pattern===pattern&&p.equipment.includes(e.equipment));
 const preferredOrder={quad:['leg-press','hack-squat','goblet-squat'],hamCurl:['seated-curl','lying-curl','sliding-curl'],
  row:['chest-row','cable-row','db-row'],chestPress:['dumbbell-bench','chest-press','pushup'],
  verticalPull:['pull-down','pull-up'],chestAccessory:['incline-db','chest-fly'],
  singleLeg:['split-squat','body-split-squat'],core:['pallof','plank']};
 const order=preferredOrder[pattern]||[];
 return candidates.sort((a,b)=>(order.indexOf(a.id)<0?999:order.indexOf(a.id))-(order.indexOf(b.id)<0?999:order.indexOf(b.id)))[0]||null;
}
function prescription(exercise,pattern,p,dayName){
 const main=['squat','bench','deadlift','squatSecondary','benchSecondary'].includes(pattern);
 const priority=p.priority===exercise.primary;
 const beginner=p.experience==='beginner';
 let sets=main?(beginner?2:3):priority?3:2;
 if(!main&&p.goal==='bodybuilding'&&p.experience==='advanced'&&priority)sets=3;
 if(main&&p.goal==='powerbuilding'&&pattern==='benchSecondary')sets=2;
 const low=main?((pattern==='squatSecondary'||pattern==='benchSecondary')?5:3):exercise.kind==='main'?6:exercise.primary==='Calves'||exercise.primary==='Shoulders'?10:8;
 const high=main?((pattern==='squatSecondary'||pattern==='benchSecondary')?8:6):exercise.kind==='main'?10:exercise.primary==='Calves'||exercise.primary==='Shoulders'?20:15;
 const rir=main?3:beginner?3:(exercise.axial>=2?3:2);
 const rest=main?210:exercise.kind==='main'?150:exercise.axial>=2?150:90;
 const rationale=main?'Lift-specific heavier practice is prioritised for strength (ACSM2026).':
  exercise.axial>=2?'Posterior-chain stimulus with additional axial fatigue; keep recovery under review.':
  'Supporting muscle exposure with controlled loading and recoverable effort.';
 return {id:exercise.id,name:exercise.name,pattern,primary:exercise.primary,secondary:exercise.secondary,
  equipment:exercise.equipment,axial:exercise.axial,sets,repsMin:low,repsMax:high,rir,restSeconds:rest,
  estimatedMinutes:Math.ceil(sets*(rest/60+0.8)),evidence:main?['ACSM2026','AUTOREG2025']:['ACSM2026','PELLAND2026','ROBINSON2024'],
  reason:rationale+(priority?' Extra attention to selected muscle priority.':'')};
}
function sessionLimit(minutes){return Math.max(8,Math.floor(minutes/4.2));}
function planSession(raw,p,index){
 const [name,...patterns]=raw;
 const used=new Set(),chosen=[],warnings=[];
 let seconds=0,hardHinge=false;
 for(const pattern of patterns){
  let found=preferred(pattern,p);
  if(!found){warnings.push('No suitable '+pattern+' option with selected equipment.');continue;}
  if(used.has(found.id))continue;
  if(hardHinge&&found.axial>=2&&pattern==='hinge'){warnings.push('Skipped a second demanding hinge on deadlift day.');continue;}
  if(pattern==='deadlift')hardHinge=true;
  const item=prescription(found,pattern,p,name);
  if(seconds+item.estimatedMinutes*60>p.minutes*60&&chosen.length>=3&&!['squat','bench','deadlift'].includes(pattern)){
   warnings.push('Removed '+found.name+' to fit the session-time budget.');
   continue;
  }
  used.add(found.id);chosen.push(item);seconds+=item.estimatedMinutes*60;
 }
 return {id:'day-'+(index+1),name,order:index+1,exercises:chosen,estimatedMinutes:Math.ceil(seconds/60),warnings};
}
function exposure(sessions){
 const per=Object.fromEntries(MUSCLES.map(m=>[m,{direct:0,indirect:0,effective:0,days:0}]));
 for(const day of sessions){
  const seen=new Set();
  for(const x of day.exercises){
   per[x.primary].direct+=x.sets;seen.add(x.primary);
   for(const m of x.secondary){if(m!==x.primary){per[m].indirect+=x.sets*.5;seen.add(m);}}
  }
  for(const m of seen)per[m].days++;
 }
 for(const m of MUSCLES)per[m].effective=Number((per[m].direct+per[m].indirect).toFixed(1));
 return per;
}
function audit(plan){
 const errors=[],warnings=[];
 const p=plan.profile,days=plan.sessions;
 if(p.goal!=='bodybuilding'&&!p.equipment.includes('barbell'))errors.push('A barbell is required for specific squat/bench/deadlift programming.');
 for(const day of days){
  if(day.exercises.length===0)errors.push(day.name+': no eligible exercises.');
  for(const message of day.warnings)warnings.push(day.name+': '+message);
  if(day.estimatedMinutes>p.minutes)warnings.push(day.name+': estimated duration exceeds available minutes.');
  const highAxial=day.exercises.filter(x=>x.axial>=2);
  if(highAxial.length>1)warnings.push(day.name+': multiple high-axial-load movements warrant review.');
  if(day.exercises.some(x=>x.pattern==='deadlift')&&day.exercises.some(x=>x.pattern==='hinge'))
   errors.push(day.name+': heavy hinge overlap on deadlift day.');
  const names=day.exercises.map(x=>x.id);
  if(new Set(names).size!==names.length)errors.push(day.name+': duplicate exercises.');
 }
 if(p.goal!=='bodybuilding'){
  for(const name of ['squat','bench','deadlift'])if(!days.some(d=>d.exercises.some(e=>e.pattern===name)))
   errors.push('Missing essential '+name+' competition lift.');
 }
 for(const [m,v] of Object.entries(plan.exposure)){
  if(v.effective>=22)warnings.push(m+': high weekly fractional set exposure ('+v.effective+'); review recovery and individual response.');
  if(v.effective>0&&v.days===1&&p.days>=4)warnings.push(m+': workload is concentrated in one session; consider redistribution.');
 }
 for(let i=1;i<days.length;i++){
  const prev=days[i-1].exercises.some(x=>x.pattern==='deadlift'||x.pattern==='squat');
  const next=days[i].exercises.some(x=>x.pattern==='deadlift'||x.pattern==='squat');
  if(prev&&next)warnings.push('Days '+i+' and '+(i+1)+' contain demanding main lifts; schedule adequate recovery.');
 }
 if(p.goal==='bodybuilding'&&days.some(d=>d.exercises.length<3))warnings.push('Some sessions have fewer than three exercises due to equipment or time constraints.');
 return {errors:[...new Set(errors)],warnings:[...new Set(warnings)],passed:errors.length===0,checks:['Equipment eligibility','Specificity for the selected goal','Direct and indirect weekly exposure','Consecutive heavy-lift distribution','Same-day hinge overlap','Estimated session duration']};
}
function generate(input={}){
 const p=profileOptions(input);
 const dayPlan=TEMPLATES[p.goal][p.days];
 const sessions=dayPlan.map((day,index)=>planSession(day,p,index));
 const plan={version:VERSION,id:'sx-science-'+[p.goal,p.days,p.experience,p.minutes,p.priority].join('-').toLowerCase().replace(/[^a-z0-9-]/g,''),
  preview:true,readOnly:true,profile:p,weeks:p.weeks,sessions,exposure:exposure(sessions),
  methodology:['Load and rep targets are starting points, not fixed scientific optima.',
   'Use completed working sets and RPE/RIR to decide subsequent loads; never increase from missing evidence.',
   'Review recovery, pain, adherence and plateaus before automatically increasing weekly sets.',
   'No automatic deload week: adjust training stress when performance and recovery indicate a need.',
   'Main-lift specificity is prioritised in strength modes; accessory choices favour lower axial overlap where practical.'],
  evidenceIds:EVIDENCE.map(e=>e.id)};
 plan.audit=audit(plan);
 return plan;
}
function adjustFromHistory(plan,exerciseId,history=[],readiness={}){
 const item=plan?.sessions?.flatMap(d=>d.exercises||[]).find(e=>e.id===exerciseId);
 if(!item)return {status:'unavailable',reason:'Exercise was not found in the preview.',suggestedKg:null,readOnly:true};
 const rows=(Array.isArray(history)?history:[]).filter(r=>r&&r.saved===true&&r.programmeId===plan.id&&r.exerciseId===item.id)
  .slice(-2).map(r=>({sets:(Array.isArray(r.sets)?r.sets:[]).filter(s=>s.done===true&&!/warm.?up/i.test(String(s.type||''))&&Number(s.weight)>0&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0),date:r.date||''}));
 const last=rows[rows.length-1];
 if(readiness.pain===true)return {status:'review',suggestedKg:null,readOnly:true,reason:'Pain reported: do not automatically progress loading. Seek appropriate professional assessment if needed.'};
 if(!last||last.sets.length<item.sets)return {status:'hold',suggestedKg:null,readOnly:true,reason:'Not enough completed, linked working sets for a load decision.'};
 const sets=last.sets.slice(0,item.sets),weight=Number(sets[0].weight);
 if(!sets.every(s=>Math.abs(Number(s.weight)-weight)<.01))return {status:'hold',suggestedKg:null,readOnly:true,reason:'Working sets used different loads. Keep the current prescription until comparable evidence is available.'};
 const allRpe=sets.every(s=>Number(s.rpe)>=6&&Number(s.rpe)<=10);
 if(!allRpe)return {status:'hold',suggestedKg:weight,readOnly:true,reason:'Effort evidence (RPE) is missing or invalid; avoid automatic load changes.'};
 if(readiness.low===true)return {status:'review',suggestedKg:weight,readOnly:true,reason:'Low readiness reported. Review recovery and training stress before progressing.'};
 const hard=sets.some(s=>Number(s.rpe)>=9.5||Number(s.reps)<item.repsMin);
 const prev=rows.length>=2?rows[0]:null;
 const priorHard=!!prev&&prev.sets.length>=item.sets&&prev.sets.some(s=>Number(s.rpe)>=9.5||Number(s.reps)<item.repsMin);
 if(hard&&priorHard){
  const reduced=Math.max(0,Math.round((weight*.975)*2)/2);
  return {status:'reduce-review',suggestedKg:reduced,readOnly:true,reason:'Two difficult linked sessions: consider a small reduction and examine recovery; coach/athlete approval required.'};
 }
 if(sets.every(s=>Number(s.reps)>=item.repsMax&&Number(s.rpe)<=10-item.rir+.5)){
  const small=['biceps','triceps','lateral','rearDelts','calves'].includes(item.pattern);
  return {status:'increase-review',suggestedKg:Math.round((weight+(small?1:2.5))*2)/2,readOnly:true,
   reason:'Upper rep targets met at the planned effort. A small increase can be considered, subject to technique and recovery.'};
 }
 return {status:'hold',suggestedKg:weight,readOnly:true,reason:'Continue at the current load while building reps and maintaining the desired effort.'};
}
const API=Object.freeze({VERSION,EVIDENCE,MUSCLES,EXERCISES,TEMPLATES,profileOptions,generate,audit,exposure,adjustFromHistory});
root.SXScientificEngine=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
