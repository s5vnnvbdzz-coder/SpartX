/* SpartanX XP / Prestige engine, Build 323.
 * Pure calculation from completed, saved training: never grants XP on a tap,
 * draft, incomplete AscensionX day or repeat save. No monthly expiry.
 */
(function(root){
 'use strict';
 const PER_RANK=1000, RANKS=6, PRESTIGE_XP=PER_RANK*RANKS;
 const STANDARD_AWARDS=[225,325,425,525], ASCENSION_DAY_XP=450, ASCENSION_WEEK_BONUS=350;
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
  Array.isArray(ex?.sets)&&ex.sets.some(set=>set?.done===true&&
   Number.isFinite(Number(set.weight))&&Number.isFinite(Number(set.reps))&&
   (Number(set.reps)>0||Number(set.weight)>0)));
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
 function calculate(savedSessions,ascension){
  const days=new Map(),completions=new Map(),sessionById=new Map();
  const sessions=Array.isArray(savedSessions)?savedSessions:[];
  const state=ascension&&typeof ascension==='object'?ascension:{};
  const logs=Array.isArray(state.logs)?state.logs:[];
  const getDay=date=>{if(!days.has(date))days.set(date,{date,hasStandard:false,hasAscension:false});return days.get(date);};
  const record=(item,date)=>{
   const key=item.cycleId+'|'+item.week;
   if(!completions.has(key))completions.set(key,{cycleId:item.cycleId,week:item.week,lifts:new Set(),dates:new Set()});
   const entry=completions.get(key);
   entry.lifts.add(item.lift);entry.dates.add(date);
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
  let completedWeeks=0;
  for(const item of completions.values()){
   const active=state.cycle?.created===item.cycleId;
   const selected=active&&Array.isArray(state.cycle.exercises)
    ?[...new Set(state.cycle.exercises.filter(l=>LIFTS.includes(l)))]
    :LIFTS.slice(0,3); // Conservative default for legacy archived cycles.
   if(selected.length&&selected.every(lift=>item.lifts.has(lift)))completedWeeks++;
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
   workouts:sessions.length,awards
  };
 }
 root.SpartanXXP=Object.freeze({
  calculate,PER_RANK,PRESTIGE_XP,STANDARD_AWARDS,ASCENSION_DAY_XP,ASCENSION_WEEK_BONUS
 });
})(typeof window!=='undefined'?window:globalThis);
