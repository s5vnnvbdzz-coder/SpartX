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
  global.SXBridge=Object.freeze({read,storageKey:KEY});
})(window);
