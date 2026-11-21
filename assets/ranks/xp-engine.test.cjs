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
assert.equal(xp.prestigeBand(0),'none');
assert.equal(xp.prestigeBand(1),'bronze');
assert.equal(xp.prestigeBand(3),'silver');
assert.equal(xp.prestigeBand(5),'gold');
assert.equal(xp.prestigeBand(10),'mythic');
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
assert(!root.includes('spartanx_prestige_month'), 'Prestige is not monthly gated');

console.log('PASS: XP, lifetime badge and prestige display scenarios');
