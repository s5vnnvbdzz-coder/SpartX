'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'xp-engine.js'),'utf8'),context);
const xp=context.window.SpartanXXP;
assert.ok(xp&&typeof xp.calculate==='function','XP engine loads');
const day=(date,id,exercises=[{name:'Bench Press',sets:[{type:'Working Set',done:true,weight:60,reps:5}]}])=>
 ({id,date:date+'T10:00:00',exercises});
const cycle='2026-11-01T12:00:00.000Z';
const lifts=['Back Squat','Bench Press','Deadlift'];
const state=logs=>({cycle:{created:cycle,exercises:lifts},logs});
const ascLog=(lift,date,week=1,complete=true,sourceSessionId)=>({
 cycleId:cycle,lift,week,date:date+'T10:00:00',setsComplete:complete,
 ...(sourceSessionId===undefined?{}:{sourceSessionId})
});
const linked=(lift,date,id,complete=true)=>day(date,id,[{
 name:lift,ascensionLink:{cycleId:cycle,lift,week:1,plannedSets:[{weight:80,reps:5}]},
 sets:[{type:'Working Set',done:true,weight:80,reps:complete?5:3}]
}]);
const dates=['2026-11-02','2026-11-03','2026-11-05','2026-11-06'];
let standard=dates.map((d,i)=>day(d,'std-'+i));
let result=xp.calculate(standard);
assert.equal(result.totalXP,1500);
assert.equal(result.standardDays,4);
assert.equal(result.prestige,0);
assert.equal(result.rankXP,500);
assert.equal(result.index,1);
assert.deepEqual(Array.from(result.awards,x=>x.xp),[225,325,425,525]);
assert.equal(xp.calculate([...standard,day(dates[1],'duplicate')]).totalXP,1500,
 'Only one qualifying workout per calendar day');
assert.equal(xp.calculate([...standard,day('2026-11-07','fifth')]).totalXP,2025,
 'Fifth training day receives capped marginal award');
assert.equal(xp.calculate([day('2026-11-09','next-week')]).totalXP,225,
 'Weekly ladder resets every Monday');
const logs=[
 ascLog('Back Squat','2026-11-02'),
 ascLog('Bench Press','2026-11-04'),
 ascLog('Deadlift','2026-11-06')
];
result=xp.calculate([],state(logs));
assert.equal(result.totalXP,1700);
assert.equal(result.ascensionDays,3);
assert.equal(result.completedWeeks,1);
assert.equal(result.bonusXP,350);
assert.equal(xp.calculate([],state([ascLog('Back Squat','2026-11-02',1,false)])).totalXP,0);
assert.equal(xp.calculate([],state([ascLog('Back Squat','2026-11-02')])).totalXP,450);
const imports=[
 linked('Back Squat','2026-11-02','sq'),
 linked('Bench Press','2026-11-04','bp'),
 linked('Deadlift','2026-11-06','dl')
];
assert.equal(xp.calculate(imports,state([])).totalXP,1700,'Linked imported workouts count as programme days');
assert.equal(xp.calculate(imports,state([
 ascLog('Back Squat','2026-11-02',1,true,'sq')
])).totalXP,1700,'Synced AscensionX logs do not double-pay');
assert.equal(xp.calculate([],state([
 ascLog('Back Squat','2026-11-02',1,true,'deleted')
])).totalXP,0,'Deleted linked workouts do not pay');
assert.equal(xp.calculate([linked('Back Squat','2026-11-02','part',false)],state([])).totalXP,225,
 'Incomplete AscensionX imported workouts count only as normal logged workouts');
assert.equal(xp.calculate([day('2026-11-02','standard'),linked('Back Squat','2026-11-02','asc')],
 state([])).totalXP,450,'AscensionX replaces standard XP on the same calendar day');
const cardio=day('2026-11-02','cardio',[{name:'StairMaster (Floors)',sets:[{
 type:'Cardio',done:true,weight:0,reps:0,durationSeconds:1800,floors:100
}]}]);
assert.equal(xp.calculate([cardio]).totalXP,225,'Completed cardio workouts qualify');
const fourWeeks=Array.from({length:4},(_,i)=>dates.map((d,k)=>{
 const base=new Date(d+'T12:00:00Z');base.setUTCDate(base.getUTCDate()+7*i);
 return day(base.toISOString().slice(0,10),'month-'+i+'-'+k);
})).flat();
result=xp.calculate(fourWeeks);
assert.equal(result.totalXP,6000);
assert.equal(result.prestige,1);
assert.equal(result.cycleXP,0);
assert.equal(result.index,0);
assert.equal(result.remainingToNext,1000);
const threeWeeks=Array.from({length:3},(_,i)=>logs.map((log,j)=>{
 const date=new Date(log.date);date.setUTCDate(date.getUTCDate()+7*i);
 return {...log,week:i+1,date:date.toISOString()};
})).flat();
assert.equal(xp.calculate([],state(threeWeeks)).totalXP,5100,
 'Three complete AscensionX programme weeks pay 1700 each');
const twoLifts={cycle:{created:cycle,exercises:['Back Squat','Deadlift']},
 logs:[ascLog('Back Squat','2026-11-02'),ascLog('Deadlift','2026-11-06')]};
assert.equal(xp.calculate([],twoLifts).totalXP,1250,
 'Selected programme lifts determine full-week completion');
assert.equal(xp.calculate([],state(logs.concat(logs))).totalXP,1700,
 'Duplicate AscensionX records cannot award twice');
// Four-day AscensionX: the imported support day earns 450 XP (not standard
// Day 1 XP), and the 350 XP full-week reward waits for the prescribed support.
const fourDayPreferences={[cycle]:{enabled:true,days:4}};
const support=(date,id,finished=true,week=1,slot='SAT')=>day(date,id,
 Array.from({length:3},(_,n)=>({
  name:['Bench Press','Iso-Lateral Row','Lateral Raise'][n],
  sxPowerbuildingSupport:{cycleId:cycle,week,day:slot,plannedSets:3,plannedExerciseCount:3},
  sets:Array.from({length:3},(_,i)=>({type:'Working Set',
   done:finished||i<2,weight:20,reps:10}))
 })));
assert.equal(xp.calculate(imports,state([]),fourDayPreferences).totalXP,1700,
 'Protect the weekly 350 XP bonus earned under the old rule');
assert.equal(xp.calculate(imports,state([]),fourDayPreferences).legacyBonusXP,350,
 'Older earned weeks are auditable as grandfathered bonuses');
const fourth=support('2026-11-07','upper-assistance');
const fullWeek=xp.calculate([...imports,fourth],state([]),fourDayPreferences);
assert.equal(fullWeek.totalXP,2150,
 'Three main days, Day 4 assistance and one weekly bonus total 2150 XP');
assert.equal(fullWeek.ascensionXP,1800);
assert.equal(fullWeek.bonusXP,350);
assert.equal(fullWeek.ascensionDays,4);
assert.equal(fullWeek.awards.find(x=>x.date==='2026-11-07').xp,450,
 'Completed Day 4 assistance is paid as AscensionX, not standard workout');
assert.equal(xp.calculate([...imports,support('2026-11-07','partial',false)],
 state([]),fourDayPreferences).totalXP,1925,
 'Incomplete assistance receives standard XP without revoking a previously earned bonus');
assert.equal(xp.calculate([...imports,fourth,fourth],state([]),fourDayPreferences).totalXP,2150,
 'Repeatedly saving the same support session does not duplicate XP');
assert.equal(xp.calculate([...imports,fourth,support('2026-11-07','repeat')],
 state([]),fourDayPreferences).totalXP,2150,
 'Repeated assistance on the same day cannot award another daily 450');
assert.equal(xp.calculate([...imports,fourth],state([]),
 {[cycle]:{enabled:true,days:5}}).bonusXP,350,
 'Five-day programming retains bonus already earned before the rule update');
assert.equal(xp.calculate([...imports,fourth,support('2026-11-08','fifth',true,1,'SUN')],
 state([]),{[cycle]:{enabled:true,days:5}}).bonusXP,350,
 'Five-day programming awards the weekly bonus after both support slots');
// New post-cutoff weeks must complete all programme days before the 350 XP bonus.
const futureCycle='2026-12-01T12:00:00.000Z';
const futurePrefs={[futureCycle]:{enabled:true,days:4}};
const futureImports=['Back Squat','Bench Press','Deadlift'].map((lift,i)=>({
 id:'future-'+i,date:'2026-12-0'+(i+1)+'T10:00:00',
 exercises:[{name:lift,ascensionLink:{cycleId:futureCycle,lift,week:1,
  plannedSets:[{weight:80,reps:5}]},
  sets:[{type:'Working Set',done:true,weight:80,reps:5}]}]
}));
const futureState={cycle:{created:futureCycle,exercises:['Back Squat','Bench Press','Deadlift']},logs:[]};
assert.equal(xp.calculate(futureImports,futureState,futurePrefs).totalXP,1350,
 'New weeks have no earned bonus until the support workout is complete');
const futureDay4={...fourth,date:'2026-12-04T10:00:00',id:'future-support',
 exercises:fourth.exercises.map(ex=>({
  ...ex,sxPowerbuildingSupport:{...ex.sxPowerbuildingSupport,cycleId:futureCycle}
 }))};
assert.equal(xp.calculate([...futureImports,futureDay4],futureState,futurePrefs).totalXP,2150,
 'New completed four-day week earns four programme days and weekly bonus');
const historicWeeks=[0,1,2].flatMap(week=>
 ['Back Squat','Bench Press','Deadlift'].map((lift,i)=>({
  id:'historical-'+week+'-'+i,
  date:'2026-11-'+String(2+7*week+i).padStart(2,'0')+'T10:00:00',
  exercises:[{name:lift,ascensionLink:{cycleId:cycle,lift,week:week+1,
   plannedSets:[{weight:80,reps:5}]},
   sets:[{type:'Working Set',done:true,weight:80,reps:5}]}]
 })));
const legacyScore=xp.calculate(historicWeeks,state([]),fourDayPreferences);
assert.equal(legacyScore.totalXP,5100,
 'All three previously earned 350 XP week bonuses remain credited');
assert.equal(legacyScore.legacyBonusXP,1050,
 'Three older weekly rewards retain the exact 1050 XP previously earned');
assert.equal(xp.calculate(historicWeeks.slice(0,8),state([]),fourDayPreferences).legacyBonusXP,700,
 'Incomplete historic programme weeks do not receive a bonus');
// Badges are permanent achievements, not repeated prestige-cycle rewards.
assert.equal(xp.badgeHighWater({totalXP:0,index:0,prestige:0}),0);
assert.equal(xp.badgeHighWater({totalXP:4800,index:4,prestige:0}),4);
assert.equal(xp.badgeHighWater({totalXP:6000,index:0,prestige:1}),5,
 'All six rank badges remain unlocked after prestige');
assert.equal(xp.badgeHighWater({totalXP:6120,index:0,prestige:1}),5,
 'Prestige Rank I still owns the Olympian badge');
assert.equal(xp.badgeHighWater({totalXP:1500,index:1,prestige:0},4),4,
 'Previously earned badges survive later workout-history edits');
assert.equal(xp.badgeHighWater({totalXP:12100,index:0,prestige:2},5),5,
 'Repeated prestiges do not revoke prior rank badges');
// A full, consistently completed AscensionX week pays 1,700 XP:
 // 52 weeks * 1,700 XP / 6,000 XP per prestige rounds to 15.
assert.equal(xp.BASELINE_PRESTIGES_PER_YEAR,15);
assert.deepEqual(Array.from(xp.LAUREL_TIERS,t=>t.name),
 ['bronze','silver','gold','platinum','mythic','apotheosis']);
assert.deepEqual(Array.from(xp.LAUREL_TIERS,t=>t.start),[1,16,28,36,41,60]);
assert.deepEqual(Array.from(xp.LAUREL_TIERS,t=>t.span),[15,12,8,5,3,null]);
assert.deepEqual(Array.from(xp.LAUREL_TIERS,t=>t.milestone),[15,27,35,40,43,60]);
assert.deepEqual(Array.from(xp.LAUREL_TIERS,t=>t.end),[15,27,35,40,59,null]);
for(const [prestige,name] of [[0,'none'],[1,'bronze'],[15,'bronze'],
 [16,'silver'],[27,'silver'],[28,'gold'],[35,'gold'],
 [36,'platinum'],[40,'platinum'],[41,'mythic'],
 [43,'mythic'],[59,'mythic'],[60,'apotheosis'],[100,'apotheosis']]){
 assert.equal(xp.prestigeBand(prestige),name,'Laurel stage for P'+prestige);
}
assert.equal(xp.prestigeTier(0),null);
assert.equal(xp.prestigeTier(16).milestone,27);
assert.equal(xp.prestigeTier(41).milestone,43);
assert.equal(xp.prestigeTier(44).name,'mythic',
 'Mythic persists after its three-prestige internal milestone until P59');
assert.equal(xp.APOTHEOSIS_PRESTIGE,60);
assert.equal(xp.prestigeTier(59).end,59);
assert.equal(xp.prestigeTier(60).start,60);
assert.equal(xp.prestigeTier(100).name,'apotheosis',
 'Apotheosis stays highest after P60');
assert.equal(xp.laurelUpgrade(0,1)?.name,'bronze');
assert.equal(xp.laurelUpgrade(14,15),null);
assert.equal(xp.laurelUpgrade(15,16)?.name,'silver');
assert.equal(xp.laurelUpgrade(40,41)?.name,'mythic');
assert.equal(xp.laurelUpgrade(59,60)?.name,'apotheosis');
assert.equal(xp.laurelUpgrade(60,61),null,'Ordinary prestiges should not retrigger a tier celebration');
assert.equal(xp.laurelUpgrade(59,59),null,'No celebration when prestige did not increase');
const root=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const profile=fs.readFileSync(path.join(__dirname,'../profile/profile-preview-parity.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'prestige-visuals.css'),'utf8');
assert(root.includes('unlocked:i<=state.badgeHighWater'),
 'Badge gallery uses lifetime ownership rather than current rank');
assert(root.includes('i<=state.badgeHighWater')&&root.includes('rank>state.badgeHighWater'),
 'Feed badge choices remain selectable after prestige');
assert(root.includes('spartanx_badge_high_water_v1'), 'Lifetime badge high-water persists locally');
assert(root.includes('sx-prestige-earned')&&root.includes('sx-prestige-laurel'),
 'Prestige adds visible insignia without replacing the current rank frame');
assert(profile.includes('rank.rankProgress')&&profile.includes('rank.rankXP'),
 'Profile progress reflects only XP earned within the current rank');
assert(style.includes('[data-sx-prestige-band="mythic"]'),
 'Prestige visual bands progress independently of the current rank');
assert(style.includes('[data-sx-prestige-band="platinum"]'),
 'The fourth laurel receives its own visual finish');
assert(style.includes('[data-sx-prestige-band="apotheosis"]'),
 'The sixth laurel receives a unique white-gold finish');
assert(!root.includes("const next=window.SpartanXXP.LAUREL_TIERS.find(t=>t.start>state.prestige)"),
 'Next-laurel details move out of the compact Rank Progression tile and remain in Prestige Showcase');
assert(root.includes("sx-prestige-tier-name"),
 'Feed cards show the unlocked laurel stage, not just a number');
assert(root.includes('spartanxPrestigeTileInner(prestige)'),
 'Rank Progression and Workout Feed reuse the same prestige visual markup');
assert(root.includes('rankPrestigeMark')&&root.includes("prestigeMark.innerHTML=state.prestige?spartanxPrestigeTileInner(state.prestige):''"),
 'The wide Rank Progression prestige text is replaced by the compact laurel');
assert(!root.includes('LAUREL\'+(next?'),
 'The long next-laurel banner no longer appears inside the rank panel');
assert(root.includes('data-open-prestige-showcase'),
 'Prestige container is clickable');
assert(root.includes('SpartanXPrestigeShowcase?.celebrate?.(state)'),
 'Laurel achievement uses a dedicated celebration only on tier upgrades');
assert(root.includes('prestige-showcase.js?v=383'),
 'Prestige Showcase is loaded into the main iOS app');
const showcase=fs.readFileSync(path.join(__dirname,'prestige-showcase.js'),'utf8');
assert(showcase.includes('role="dialog" aria-modal="true"'),
 'Prestige Showcase is presented as a modal');
assert(showcase.includes('data-sx-prestige-view')&&showcase.includes('data-sx-prestige-close'),
 'The unlock celebration has functioning showcase and dismissal controls');
assert(!root.includes('spartanx_prestige_month'), 'Prestige is not monthly gated');

console.log('PASS: XP, lifetime badge and prestige display scenarios');
