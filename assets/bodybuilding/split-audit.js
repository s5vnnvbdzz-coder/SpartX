/* Split generation and transparent plan audit; no writes to active cycles. */
(function(root){
'use strict';
const hybrid5=[
 ['Upper Push',[['Bench Press',3,6,10],['Incline Dumbbell Press',3,8,12],['Lateral Raise',3,12,20],['Triceps Pushdown',3,10,15]]],
 ['Lower Pull',[['Romanian Deadlift',3,6,10],['Hip Thrust',3,8,12],['Seated Leg Curl',3,10,15],['Seated Calf Raise',3,10,15]]],
 ['Upper Pull',[['Chest-Supported Row',3,8,12],['Lat Pulldown',3,8,12],['Rear Delt Fly',3,12,20],['Dumbbell Curl',3,10,15]]],
 ['Lower Push',[['Back Squat',3,6,10],['Leg Press',3,8,12],['Leg Extension',3,10,15],['Standing Calf Raise',3,10,15]]],
 ['Accessory & Core',[['Cable Lateral Raise',3,12,20],['Cable Curl',3,10,15],['Overhead Triceps Extension',3,10,15],['Cable Crunch',3,10,15],['Pallof Press',3,10,15]]]
];
function build(model,preset,p){
 const days={default3:3,default4:4,default5:5,default6:6,hybrid5:5}[preset];if(!days)throw Error('Unknown split');
 if(preset!=='hybrid5')return {...p,days,sessions:model.buildDays(days,p.priority)};
 return {...p,days,sessions:hybrid5.map(([name,ex],i)=>({id:model.exercise({name}).id,name,exercises:ex.map(([name,sets,repsMin,repsMax])=>model.exercise({name,sets,repsMin,repsMax,rir:2,restSeconds:repsMin<=6?180:repsMin>=10?90:120}))}))};
}
function audit(p,V){
 if(!p||!V)return null;
 const opt={goal:p.kind==='hybrid'?'powerbuilding':'bodybuilding',experience:p.experience,priority:p.priority==='upper'?'Shoulders':p.priority==='lower'?'Quads':'Balanced'};
 const exposure=V.countExposure(p.sessions),muscles=Object.entries(exposure).map(([name,x])=>{const band=V.bandFor(name,opt);return {name,...x,min:band.min,max:band.max,status:x.effective===0?'Missing':x.effective<band.min?'Below guide':x.effective>band.max?'Above guide':'Within guide'}});
 const days=p.sessions.map(d=>{let axial=0,sets=0;const unknown=[],patterns=new Set();for(const e of d.exercises){const count=Math.max(0,Number(e.sets)||0),c=V.classify(e.name);sets+=count;if(c){axial+=count*(c.axial||0);patterns.add(c.pattern)}else unknown.push(e.name);}return {name:d.name,sets,axial,patterns:[...patterns],unknown};});
 const notes=[];
 for(let i=1;i<days.length;i++)if(days[i-1].axial>=8&&days[i].axial>=8)notes.push(days[i-1].name+' → '+days[i].name+': review recovery if scheduled on consecutive days.');
 for(const d of days){if(d.sets>25)notes.push(d.name+': '+d.sets+' working sets; check available session time and fatigue.');if(d.unknown.length)notes.push(d.name+': unclassified '+d.unknown.join(', ')+'.');}
 return {muscles,days,notes};
}
root.SXSplitAudit=Object.freeze({build,audit});
})(typeof window==='undefined'?globalThis:window);
