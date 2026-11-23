/* SpartanX XP / Prestige engine, Build 324.
 * Pure calculation from completed, saved training: never grants XP on a tap,
 * draft, incomplete AscensionX day or repeat save. No monthly expiry.
 */
(function(root){
 'use strict';
 const PER_RANK=1000, RANKS=6, PRESTIGE_XP=PER_RANK*RANKS;
 const STANDARD_AWARDS=[225,325,425,525], ASCENSION_DAY_XP=450, ASCENSION_WEEK_BONUS=350;
 // The four-/five-day eligibility rule was introduced on 23 November 2026.
 // Do not retroactively revoke weekly bonuses earned under the old rule.
 const LEGACY_WEEK_CUTOFF='2026-11-23';
 const LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
 const isoDate=date=>{
  if(typeof date!=='string'||!date.trim())return '';
  const value=new Date(date);
  if(!Number.isFinite(value.getTime()))return '';
  // Calendar-only workout dates are local, not UTC instants.
  if(/^\d{4}-\d{2}-\d{2}$/.test(date))return date;
  return [value.getFullYear(),String(value.getMonth()+1).padStart(2,'0'),String(value.getDate()).padStart(2,'0')].join('-');
 };
 const monday=date=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return '';
  const d=new Date(date+'T12:00:00Z');
  if(!Number.isFinite(d.getTime()))return '';
  d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
  return d.toISOString().slice(0,10);
 };
 const validSavedSession=s=>Array.isArray(s?.exercises)&&s.exercises.some(ex=>
  Array.isArray(ex?.sets)&&ex.sets.some(set=>{
   if(set?.done!==true)return false;
   if(set.type==='Cardio')return Number(set.durationSeconds)>0&&
    [set.floors,set.steps,set.distanceKm].some(v=>Number(v)>0);
   return Number.isFinite(Number(set.weight))&&Number.isFinite(Number(set.reps))&&
    (Number(set.reps)>0||Number(set.weight)>0);
  }));
 const validAscLink=(ex)=>{
  const link=ex?.ascensionLink;
  if(!link||typeof link.cycleId!=='string'||!Number.isFinite(Date.parse(link.cycleId))||
     !LIFTS.includes(link.lift)||!Number.isInteger(link.week)||link.week<1||link.week>6||
     !Array.isArray(link.plannedSets)||!link.plannedSets.length)return null;
  const required=link.plannedSets,sets=Array.isArray(ex?.sets)?ex.sets.filter(s=>s?.type==='Working Set'&&s.done===true):[];
  if(sets.length!==required.length)return null;
  if(!sets.every((set,i)=>Number(set.weight)>0&&Number.isInteger(Number(set.reps))&&
     Number(set.reps)>=Number(required[i]?.reps)&&Number(required[i]?.reps)>0))return null;
  return {cycleId:link.cycleId,lift:link.lift,week:link.week};
 };
 // A support workout belongs to AscensionX even though it has no main-lift ascensionLink.
 // Trust only the cycle/week/day and prescription metadata saved with that session.
 const supportCompletions=session=>{
  const groups=new Map();
  for(const ex of Array.isArray(session?.exercises)?session.exercises:[]){
   const link=ex?.sxPowerbuildingSupport;
   if(!link||typeof link.cycleId!=='string'||!Number.isFinite(Date.parse(link.cycleId))||
      !Number.isInteger(Number(link.week))||Number(link.week)<1||Number(link.week)>6||
      !['MON','TUE','WED','THU','FRI','SAT','SUN'].includes(link.day)||
      !Number.isInteger(Number(link.plannedSets))||Number(link.plannedSets)<1||
      !Number.isInteger(Number(link.plannedExerciseCount))||
      Number(link.plannedExerciseCount)<1||Number(link.plannedExerciseCount)>30)continue;
   const key=link.cycleId+'|'+link.week+'|'+link.day;
   if(!groups.has(key))groups.set(key,{cycleId:link.cycleId,week:Number(link.week),
    day:link.day,required:Number(link.plannedExerciseCount),exercises:[]});
   groups.get(key).exercises.push({ex,link});
  }
  return [...groups.values()].filter(group=>
   group.exercises.length>=group.required&&group.exercises.every(({ex,link})=>{
    if(Number(link.plannedExerciseCount)!==group.required)return false;
    const done=(Array.isArray(ex.sets)?ex.sets:[]).filter(set=>
     set?.done===true&&set.type==='Working Set'&&
     Number.isFinite(Number(set.weight))&&Number(set.weight)>=0&&
     Number.isInteger(Number(set.reps))&&Number(set.reps)>0);
    return done.length>=Number(link.plannedSets);
   }));
 };
 function calculate(savedSessions,ascension,adaptivePreferences){
  const days=new Map(),completions=new Map(),sessionById=new Map();
  const sessions=Array.isArray(savedSessions)?savedSessions:[];
  const state=ascension&&typeof ascension==='object'?ascension:{};
  const logs=Array.isArray(state.logs)?state.logs:[];
  const getDay=date=>{if(!days.has(date))days.set(date,{date,hasStandard:false,hasAscension:false});return days.get(date);};
  const record=(item,date)=>{
   const key=item.cycleId+'|'+item.week;
   if(!completions.has(key))completions.set(key,{cycleId:item.cycleId,week:item.week,
    lifts:new Set(),firstLiftDate:new Map(),supportDays:new Set(),dates:new Set()});
   const entry=completions.get(key);
   if(item.lift){
    entry.lifts.add(item.lift);
    const prior=entry.firstLiftDate.get(item.lift);
    if(!prior||date<prior)entry.firstLiftDate.set(item.lift,date);
   }
   if(item.day)entry.supportDays.add(item.day);
   entry.dates.add(date);
  };
  for(const session of sessions){
   if(session?.id!==undefined&&session.id!==null)sessionById.set(String(session.id),session);
   const date=isoDate(session?.date);
   if(!date||!validSavedSession(session))continue;
   const day=getDay(date);day.hasStandard=true;
   for(const ex of session.exercises){
    const link=validAscLink(ex);
    if(link){day.hasAscension=true;record(link,date);}
   }
   // Day 4/5 assistance is not an AscensionX compound log. Read the saved
   // sxPowerbuildingSupport prescription and require every prescribed set.
   for(const support of supportCompletions(session)){
    day.hasAscension=true;record(support,date);
   }
  }
  for(const log of logs){
   if(log?.setsComplete!==true||typeof log?.cycleId!=='string'||
      !Number.isFinite(Date.parse(log.cycleId))||
      !LIFTS.includes(log.lift)||!Number.isInteger(log.week)||
      log.week<1||log.week>6)continue;
   const date=isoDate(log.date);
   if(!date)continue;
   // Linked SpartanX logs must still have a matching, completed source session.
   // Deleting/editing an imported workout revokes its unearned reward.
   if(log.sourceSessionId!==undefined&&log.sourceSessionId!==null){
    const source=sessionById.get(String(log.sourceSessionId));
    if(!source||!Array.isArray(source.exercises)||!source.exercises.some(ex=>{
     const link=validAscLink(ex);
     return link&&link.cycleId===log.cycleId&&link.week===log.week&&link.lift===log.lift;
    }))continue;
   }
   getDay(date).hasAscension=true;
   record(log,date);
  }
  let standardXP=0,ascensionXP=0,standardDays=0,ascensionDays=0;
  const perWeek=new Map();
  const awards=[];
  for(const day of [...days.values()].sort((a,b)=>a.date.localeCompare(b.date))){
   if(day.hasAscension){
    ascensionXP+=ASCENSION_DAY_XP;ascensionDays++;
    awards.push({date:day.date,kind:'ascension',xp:ASCENSION_DAY_XP});
    continue;
   }
   if(!day.hasStandard)continue;
   const week=monday(day.date);
   const count=(perWeek.get(week)||0)+1;perWeek.set(week,count);
   const xp=STANDARD_AWARDS[Math.min(count,STANDARD_AWARDS.length)-1];
   standardXP+=xp;standardDays++;
   awards.push({date:day.date,kind:'standard',xp,week,dayNumber:count});
  }
  let completedWeeks=0,legacyBonusWeeks=0;
  for(const item of completions.values()){
   const active=state.cycle?.created===item.cycleId;
   const selected=active&&Array.isArray(state.cycle.exercises)
    ?[...new Set(state.cycle.exercises.filter(l=>LIFTS.includes(l)))]
    :LIFTS.slice(0,3); // Conservative default for legacy archived cycles.
   const prefs=adaptivePreferences&&typeof adaptivePreferences==='object'?
    adaptivePreferences[item.cycleId]:null;
   const configuredDays=prefs?.enabled===true&&[3,4,5].includes(Number(prefs.days))?
    Number(prefs.days):selected.length;
   // Prescribed assistance days count toward the weekly bonus. The Week 6
   // deload has no additional support-day requirement.
   const requiredSupport=item.week===6?0:Math.max(0,configuredDays-selected.length);
   const mainsComplete=selected.length>0&&selected.every(lift=>item.lifts.has(lift));
   const supportComplete=item.supportDays.size>=requiredSupport;
   // Prior to Build 397 the bonus was earned as soon as all primary lifts
   // were complete. Retain those historical earned rewards for all athletes.
   // Repeated workouts after the cutoff cannot create a new legacy award:
   // each required lift must already have completed by that date.
   const legacyEarned=requiredSupport>0&&mainsComplete&&selected.every(lift=>
    (item.firstLiftDate.get(lift)||'9999-12-31')<=LEGACY_WEEK_CUTOFF);
   if(mainsComplete&&(supportComplete||legacyEarned)){
    completedWeeks++;
    if(legacyEarned&&!supportComplete)legacyBonusWeeks++;
   }
  }
  const bonusXP=completedWeeks*ASCENSION_WEEK_BONUS;
  const totalXP=standardXP+ascensionXP+bonusXP;
  const prestige=Math.floor(totalXP/PRESTIGE_XP);
  const cycleXP=totalXP%PRESTIGE_XP;
  const index=Math.floor(cycleXP/PER_RANK);
  const rankXP=cycleXP%PER_RANK;
  return {
   totalXP,prestige,cycleXP,index,rankXP,
   rankProgress:rankXP/PER_RANK,remainingToNext:PER_RANK-rankXP,
   toPrestige:PRESTIGE_XP-cycleXP,
   standardXP,standardDays,ascensionXP,ascensionDays,bonusXP,completedWeeks,
   legacyBonusWeeks,legacyBonusXP:legacyBonusWeeks*ASCENSION_WEEK_BONUS,
   workouts:sessions.length,awards
  };
 }
 // A rank repeats after each prestige, but its badge is permanent once
 // earned. The persisted high-water mark also preserves pre-prestige badges
 // when a historical session is later edited or no longer locally available.
 const badgeHighWater=(score,stored=0)=>{
  const earned=(Number(score?.prestige)||0)>0||(Number(score?.totalXP)||0)>=PRESTIGE_XP?
   RANKS-1:Number(score?.index)||0;
  return Math.max(0,Math.min(RANKS-1,Math.max(Number(stored)||0,earned)));
 };
 // A typical consistent three-day AscensionX week earns 1,700 XP:
 // three completed lift days + a full prescribed-week bonus. At 52 weeks
 // that is ~14.7 prestiges a year. Use a rounded 15 as the FIRST laurel band.
 // Do not cap prestige by month or year. Every threshold is a lifetime count.
 const BASELINE_PRESTIGES_PER_YEAR=Math.round(
  52*(3*ASCENSION_DAY_XP+ASCENSION_WEEK_BONUS)/PRESTIGE_XP);
 const LAUREL_NAMES=['bronze','silver','gold','platinum','mythic'];
 const LAUREL_RATIOS=[.8,.7,.6,.5];
 const LAUREL_WIDTHS=[BASELINE_PRESTIGES_PER_YEAR];
 for(const ratio of LAUREL_RATIOS)
  LAUREL_WIDTHS.push(Math.max(1,Math.round(LAUREL_WIDTHS.at(-1)*ratio)));
 let nextStart=1;
 const APOTHEOSIS_PRESTIGE=60;
 const LAUREL_TIERS=Object.freeze([
  ...LAUREL_NAMES.map((name,i)=>{
   const start=nextStart,span=LAUREL_WIDTHS[i],milestone=start+span-1;
   nextStart=milestone+1;
   return Object.freeze({name,start,span,milestone,
    // Mythic holds from P41 through P59. Its original third-prestige
    // milestone remains P43; the sixth tier is a deliberate long-term goal.
    end:i===LAUREL_NAMES.length-1?APOTHEOSIS_PRESTIGE-1:milestone});
  }),
  Object.freeze({name:'apotheosis',start:APOTHEOSIS_PRESTIGE,
   span:null,milestone:APOTHEOSIS_PRESTIGE,end:null})
 ]);
 const prestigeTier=value=>{
  const count=Math.max(0,Math.floor(Number(value)||0));
  if(count<1)return null;
  for(let i=LAUREL_TIERS.length-1;i>=0;i--)
   if(count>=LAUREL_TIERS[i].start)return LAUREL_TIERS[i];
  return null;
 };
 const prestigeBand=value=>prestigeTier(value)?.name||'none';
 const laurelUpgrade=(previous,next)=>{
  const before=Math.max(0,Math.floor(Number(previous)||0));
  const after=Math.max(0,Math.floor(Number(next)||0));
  const tier=prestigeTier(after);
  return after>before&&tier&&before<tier.start?tier:null;
 };
 root.SpartanXXP=Object.freeze({
  calculate,badgeHighWater,prestigeBand,prestigeTier,laurelUpgrade,LAUREL_TIERS,
  APOTHEOSIS_PRESTIGE,BASELINE_PRESTIGES_PER_YEAR,PER_RANK,PRESTIGE_XP,
  STANDARD_AWARDS,ASCENSION_DAY_XP,ASCENSION_WEEK_BONUS
 });
})(typeof window!=='undefined'?window:globalThis);
