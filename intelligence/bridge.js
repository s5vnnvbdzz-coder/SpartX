/* SpartanX Intelligence v0.2: read-only same-origin bridge.
   Never writes to spartx_db or another SpartanX-owned key.
   This module deliberately does not call a network endpoint. */
(function(global){
  'use strict';
  const KEY='spartx_db';
  const MAX_SESSIONS=5000;
  function read(storage){
    const E=global.SXEngine;
    if(!E || typeof E.normalizeSessions!=='function'){
      return {status:'error',reason:'Intelligence engine is unavailable.',sessions:[],rawCount:0};
    }
    try{
      const store=storage===undefined?global.localStorage:storage;
      if(!store || typeof store.getItem!=='function')return {status:'unavailable',reason:'Browser storage is unavailable in this window.',sessions:[],rawCount:0};
      const value=store.getItem(KEY);
      if(value===null)return {status:'empty',reason:'No SpartanX workout database was found in this browser.',sessions:[],rawCount:0};
      if(value.length>12*1024*1024)return {status:'error',reason:'Workout database is too large for this preview. Your original data is untouched.',sessions:[],rawCount:0};
      let parsed;
      try{parsed=JSON.parse(value);}catch(e){return {status:'error',reason:'SpartanX workout data could not be read as JSON. Nothing was changed.',sessions:[],rawCount:0};}
      if(!parsed || typeof parsed!=='object' || !Array.isArray(parsed.sessions))return {status:'error',reason:'SpartanX workout database has an unexpected format.',sessions:[],rawCount:0};
      const rawCount=parsed.sessions.length;
      if(rawCount>MAX_SESSIONS)return {status:'error',reason:'Too many sessions for the preview. None were modified.',sessions:[],rawCount};
      if(!rawCount)return {status:'empty',reason:'SpartanX is available, but no completed workouts are saved on this device.',sessions:[],rawCount};
      const normalized=E.normalizeSessions(parsed.sessions);
      if(!normalized.length)return {status:'empty',reason:'Saved workouts exist but no completed, valid sets could be analysed.',sessions:[],rawCount};
      // Deduplicate only in this in-memory view. Never mutate original workouts.
      const seen=new Set();
      const sessions=normalized.filter(s=>{
        const id=String(s.id||'')+'|'+String(s.date||'')+'|'+String(s.name||'');
        if(seen.has(id))return false;
        seen.add(id);
        return true;
      });
      const profile=parsed.profile&&typeof parsed.profile==='object'?parsed.profile:{};
      const name=typeof profile.name==='string'?profile.name.trim().slice(0,80):'';
      return {status:'connected',reason:'',sessions,rawCount,profile:{name},lastSession:sessions.at(-1)?.date||null};
    }catch(e){
      return {status:'unavailable',reason:'This browser blocked access to SpartanX workout storage.',sessions:[],rawCount:0};
    }
  }
  // Live read is separate from saved history. It reads the workout logger's
  // existing autosaved draft without writing to or modifying either database.
  const DRAFT_KEY='spartx_draft_v1';
  const CARDIO=/^(?:stairmaster(?:\s*\(|\b)|treadmill\b|rowing machine\b|bike\b|recumbent bike\b|cross trainer\b|skierg\b|elliptical\b)/i;
  function readLive(storage){
    try{
      const store=storage===undefined?global.localStorage:storage;
      if(!store||typeof store.getItem!=='function')
        return {status:'unavailable',reason:'Workout draft storage is unavailable.',exercises:[],sets:0};
      const text=store.getItem(DRAFT_KEY);
      if(!text)return {status:'idle',reason:'No active workout in this browser.',exercises:[],sets:0};
      if(text.length>4*1024*1024)
        return {status:'unavailable',reason:'Workout draft exceeds the live-preview limit.',exercises:[],sets:0};
      const draft=JSON.parse(text);
      if(!draft||draft.version!==1||draft.sessionActive!==true||draft.editingSessionId!=null||!Array.isArray(draft.work)){
        return {status:'idle',reason:'No active, unsaved workout. Editing historical sessions is excluded.',exercises:[],sets:0};
      }
      const E=global.SXEngine;
      const exercises=draft.work.slice(0,80).flatMap(ex=>{
        const originalName=String(ex?.name||'').trim().slice(0,100);
        if(!originalName||CARDIO.test(originalName)||!Array.isArray(ex.sets))return [];
        const name=typeof E?.canonical==='function'?E.canonical(originalName):originalName;
        const sets=ex.sets.slice(0,80).flatMap((set,index)=>{
          // Only a checked set with valid load/reps is eligible; no future sets.
          if(set?.done!==true||String(set?.type||'').toLowerCase()==='cardio')return [];
          if(set.weight===''||set.weight==null||set.reps===''||set.reps==null)return [];
          const weight=Number(set.weight),reps=Number(set.reps);
          if(!Number.isFinite(weight)||weight<0||weight>1500||!Number.isInteger(reps)||reps<1||reps>100)return [];
          const rawRpe=set.rpe===''||set.rpe==null?null:Number(set.rpe);
          const rpe=rawRpe!=null&&Number.isFinite(rawRpe)&&rawRpe>=6&&rawRpe<=10?rawRpe:null;
          return [{weight,reps,rpe,type:String(set.type||'Working Set').slice(0,40),index:index+1,done:true}];
        });
        return sets.length?[{name,originalName,sets,programmed:!!ex.ascensionLink||/cycle|5\/3\/1|ascensionx/i.test(String(ex.notes||''))}]:[];
      });
      const completed=exercises.reduce((n,ex)=>n+ex.sets.length,0);
      const elapsed=Math.max(0,Math.min(7*86400,Number(draft.elapsed)||0));
      return {
        status:completed?'live':'waiting',
        reason:completed?'':'Workout is active; finish a valid set to see live metrics.',
        name:String(draft.activeWorkoutName||'Active workout').slice(0,100),
        exercises,sets:completed,elapsed,paused:draft.sessionPaused===true,
        draftKey:DRAFT_KEY
      };
    }catch(_){
      return {status:'unavailable',reason:'Live workout draft could not be read.',exercises:[],sets:0};
    }
  }
  global.SXBridge=Object.freeze({read,readLive,storageKey:KEY,draftKey:DRAFT_KEY});
})(window);
