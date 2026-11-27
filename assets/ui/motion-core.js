/* Side-view 2D pose estimates, not a clinical or coaching diagnosis. */
(function(root){
'use strict';
function angle(a,b,c,w=1,h=1){const x=(a.x-b.x)*w,y=(a.y-b.y)*h,u=(c.x-b.x)*w,v=(c.y-b.y)*h;const d=Math.hypot(x,y)*Math.hypot(u,v);return d>0?Math.acos(Math.max(-1,Math.min(1,(x*u+y*v)/d)))*180/Math.PI:null;}
const sides=[[11,13,15,23,25,27],[12,14,16,24,26,28]];
const visible=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&(p.visibility??0)>=.55;
function measure(l,w,h,lift,preferredSide){
 if(!l)return null;const upper=lift==='Bench Press'||lift==='Overhead Press';
 const candidates=sides.map(ids=>({ids,score:(upper?ids.slice(0,3):[ids[0],...ids.slice(3)]).reduce((a,i)=>a+(l[i]?.visibility||0),0)})).sort((a,b)=>b.score-a.score);
 for(const {ids} of candidates){if(preferredSide&&preferredSide!==(ids[0]===11?'left':'right'))continue;const [s,e,r,hip,k,a]=ids.map(i=>l[i]);const req=upper?[s,e,r]:[s,hip,k,a];if(!req.every(visible))continue;const elbow=upper?angle(s,e,r,w,h):null,hipAngle=upper?null:angle(s,hip,k,w,h),knee=upper?null:angle(hip,k,a,w,h);const primary=upper?elbow:lift==='Back Squat'?knee:hipAngle;if(!Number.isFinite(primary))continue;const heel=l[ids[0]===11?29:30],toe=l[ids[0]===11?31:32];
 const point=p=>visible(p)?{x:p.x*w,y:p.y*h}:null;
 const geometry=!upper?{shoulder:point(s),hip:point(hip),knee:point(k),ankle:point(a),wrist:point(r),heel:point(heel),toe:point(toe),torso:Math.atan2(Math.abs((hip.y-s.y)*h),Math.abs((hip.x-s.x)*w))*180/Math.PI,torsoLength:Math.hypot((hip.x-s.x)*w,(hip.y-s.y)*h),width:w,height:h}:null;
 return {primary,elbow,hip:hipAngle,knee,geometry,side:ids[0]===11?'left':'right',points:l};}
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

// Conventional deadlift: identify low -> rising -> high excursions from hip angle.
// These are pose phases, not measured bar lift-off. No universal ideal hip height.
function deadliftReview(frames){
 const good=frames.filter(f=>f&&f.geometry&&Number.isFinite(f.hip)&&Number.isFinite(f.knee));
 if(good.length<8||good.length/Math.max(1,frames.length)<.6)return {reps:[],reason:'Insufficient consistent side-view landmarks.'};
 const sorted=good.map(f=>f.hip).sort((a,b)=>a-b),lo=sorted[Math.floor((sorted.length-1)*.05)],hi=sorted[Math.ceil((sorted.length-1)*.95)],span=hi-lo;
 if(span<30)return {reps:[],reason:'No sufficiently large hip-extension excursion detected.'};
 const low=lo+.22*span,high=lo+.78*span;let start=null,rising=[],top=null,reps=[];
 function finish(end){
  if(!start||!top||top.t-start.t<.25)return;
  const a=start.geometry,b=top.geometry,L=a.torsoLength;
  if(!(L>0))return;
  const rise=a.hip.y-b.hip.y;
  if(rise<L*.12)return;
  const early=rising.find(f=>a.hip.y-f.geometry.hip.y>=rise*.30);
  const earlyDelta=early?early.geometry.torso-a.torso:null;
  const heelFrames=[start,...rising,top].filter(f=>f.geometry.heel&&f.geometry.toe);
  const heelBase=a.heel&&a.toe?a.heel.y-a.toe.y:null;
  const heelLift=heelBase!=null&&heelFrames.length>=4?Math.max(0,...heelFrames.map(f=>(heelBase-(f.geometry.heel.y-f.geometry.toe.y))/L*100)):null;
  const setup=(a.knee.y-a.hip.y)/L*100;
  reps.push({start:start.t,top:top.t,end:end?.t??null,up:top.t-start.t,down:end?end.t-top.t:null,setup,torsoStart:a.torso,torsoTop:b.torso,earlyDelta,hipTop:top.hip,kneeTop:top.knee,heelLift,heelCoverage:heelFrames.length/Math.max(1,rising.length+2)});
 }
 for(const f of frames){
  if(!f||!f.geometry||!Number.isFinite(f.hip)){if(top)finish(null);start=null;rising=[];top=null;continue;}
  if(!start){if(f.hip<=low){start=f;rising=[];}continue;}
  if(!top){if(f.hip<=low){start=f;rising=[];continue;}rising.push(f);if(f.hip>=high)top=f;continue;}
  if(f.hip>=high){if(f.hip>=top.hip)top=f;continue;}
  if(f.hip<=low){finish(f);start=f;rising=[];top=null;}
 }
 if(top)finish(null);
 return {reps,reason:reps.length?null:'No complete rising phase with enough visible movement was detected.'};
}
root.SXMotionCore=Object.freeze({angle,measure,summarize,deadliftReview});
})(typeof window==='undefined'?globalThis:window);
