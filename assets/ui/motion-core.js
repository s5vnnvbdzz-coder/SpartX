/* Side-view 2D pose estimates, not a clinical or coaching diagnosis. */
(function(root){
'use strict';
function angle(a,b,c,w=1,h=1){const x=(a.x-b.x)*w,y=(a.y-b.y)*h,u=(c.x-b.x)*w,v=(c.y-b.y)*h;const d=Math.hypot(x,y)*Math.hypot(u,v);return d>0?Math.acos(Math.max(-1,Math.min(1,(x*u+y*v)/d)))*180/Math.PI:null;}
const sides=[[11,13,15,23,25,27],[12,14,16,24,26,28]];
const visible=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&(p.visibility??0)>=.55;
function measure(l,w,h,lift){
 if(!l)return null;const upper=lift==='Bench Press'||lift==='Overhead Press';
 const candidates=sides.map(ids=>({ids,score:(upper?ids.slice(0,3):[ids[0],...ids.slice(3)]).reduce((a,i)=>a+(l[i]?.visibility||0),0)})).sort((a,b)=>b.score-a.score);
 for(const {ids} of candidates){const [s,e,r,hip,k,a]=ids.map(i=>l[i]);const req=upper?[s,e,r]:[s,hip,k,a];if(!req.every(visible))continue;const elbow=upper?angle(s,e,r,w,h):null,hipAngle=upper?null:angle(s,hip,k,w,h),knee=upper?null:angle(hip,k,a,w,h);const primary=upper?elbow:lift==='Back Squat'?knee:hipAngle;if(!Number.isFinite(primary))continue;return {primary,elbow,hip:hipAngle,knee,side:ids[0]===11?'left':'right',points:l};}
 return null;
}
function summarize(frames,lift,total){
 const data=frames.filter(x=>x&&Number.isFinite(x.primary));const quality=total?data.length/total:0;
 if(data.length<5||quality<.6)return {quality,usable:false,count:data.length};
 const range=key=>{const v=data.map(x=>x[key]).filter(Number.isFinite).sort((a,b)=>a-b);return v.length?[Math.round(v[Math.floor((v.length-1)*.05)]),Math.round(v[Math.ceil((v.length-1)*.95)])]:null;};
 const primary=range('primary'),span=primary[1]-primary[0];let reps=0;const durations=[];const dead=lift==='Deadlift'||lift==='Romanian Deadlift',low=primary[0]+span*.22,high=primary[0]+span*.78;let stage=0,t0=0;
 if(span>=30)for(const f of frames){if(!f){stage=0;continue;}const begin=dead?f.primary<=low:f.primary>=high,end=dead?f.primary>=high:f.primary<=low;if(stage===0&&begin){stage=1;t0=f.t;}else if(stage===1){if(begin)t0=f.t;else if(end)stage=2;}else if(stage===2&&begin){if(f.t-t0>=.45){reps++;durations.push(f.t-t0);}stage=1;t0=f.t;}}
 return {quality,usable:true,count:data.length,primary,hip:range('hip'),knee:range('knee'),elbow:range('elbow'),reps,durations,span};
}
root.SXMotionCore=Object.freeze({angle,measure,summarize});
})(typeof window==='undefined'?globalThis:window);
