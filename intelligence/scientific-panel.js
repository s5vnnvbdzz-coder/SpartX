/* Inline panel for the existing Spartan Intelligence Insights tab.
 * Everything is read-only; source data stays in SpartanX storage.
 */
(function(root){
'use strict';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
function render(target='sxScientificVolume',options={}){
 const host=root.document?.getElementById(target),V=root.SXVolumeIntelligence;
 if(!host)return;
 if(!V){host.innerHTML='<h3>Unified programming</h3><p>Scientific volume policy is temporarily unavailable.</p>';return;}
 if(options.demo===true){host.innerHTML='<h3>Unified programming</h3><p>Real programme-volume analysis is hidden while viewing a demo athlete. Connect your SpartanX workout history to analyse your own cycles.</p>';return;}
 const data=V.report(root.localStorage,options),contexts=data.sources;
 const status=contexts.length?'CONNECTED PROGRAMMES':'NO SAVED PROGRAMME FOUND';
 let html='<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">'+
  '<div><div class="eyebrow">SPARTAN INTELLIGENCE · PROGRAMMING</div><h3>Unified workload &amp; working sets</h3></div>'+
  '<span class="micro-tag">'+esc(status)+'</span></div>'+
  '<p style="margin:10px 0 12px;color:var(--muted,#a9b0b8)">One programming policy for AscensionX, 5/3/1 and bespoke plans. Main lifting prescriptions are preserved; assistance is judged against weekly muscle exposure, not a fixed two-set default.</p>';
 if(!contexts.length)html+='<p>No active programmes detected in this browser. Your training history is not modified.</p>';
 for(const source of contexts){
  const label=source.type==='531'?'5/3/1':source.type==='ascension'?'AscensionX':'Bespoke';
  const summary=source.main?.map(m=>m.exercise+' · W'+m.week+
    (Number.isFinite(m.workingSets)?' · '+(m.workingSets+m.bbbSets)+' main/BBB sets':' · main sets owned by AscensionX')).join(' | ')||'';
  const sessionSets=source.sessions?.reduce((a,day)=>a+(day.exercises||[]).reduce((n,e)=>n+Number(e.sets||0),0),0);
  html+='<div style="padding:12px;margin:8px 0;border:1px solid var(--line,#333);border-radius:12px">'+
   '<strong>'+esc(label)+' · '+esc(source.name)+'</strong>'+
   '<p style="color:var(--muted,#aaa);margin:3px 0 5px;font-size:12px">'+esc(summary||(sessionSets+' planned working sets per week'))+'</p>'+
   '<p style="font-size:12px;margin:0">'+esc(source.notes)+'</p></div>';
 }
 if(data.warnings.length)html+='<div style="margin-top:10px">'+data.warnings.map(w=>'<p style="color:#e8c98c;font-size:12px;margin:5px 0">ⓘ '+esc(w)+'</p>').join('')+'</div>';
 const muscleData=data.recorded.exposure;
 const muscles=Object.entries(muscleData).filter(([m,v])=>v.effective>0).sort((a,b)=>b[1].effective-a[1].effective);
 html+='<details style="margin-top:12px" open><summary style="cursor:pointer;font-weight:750">Last seven days · completed working sets ('+data.recorded.sessions+' sessions)</summary>'+
  '<div style="overflow-x:auto;margin-top:10px"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left">Muscle</th><th>Direct</th><th>Indirect*</th><th>Fractional total</th><th>Starting band**</th></tr></thead><tbody>'+
  (muscles.length?muscles.map(([m,v])=>{
    const mode=contexts.find(s=>s.type==='ascension'||s.type==='531')?'powerbuilding':'bodybuilding';
    const band=V.bandFor(m,{goal:mode,experience:'intermediate'});
    return '<tr><td style="padding:6px 3px;border-top:1px solid #333">'+esc(m)+'</td>'+
      '<td style="text-align:center">'+v.direct+'</td><td style="text-align:center">'+v.indirect+'</td>'+
      '<td style="text-align:center">'+v.effective+'</td><td style="text-align:center">'+band.min+'–'+band.max+'</td></tr>';
  }).join(''):'<tr><td colspan="5">No recent completed working sets mapped to muscles. Warm-ups are excluded.</td></tr>')+
  '</tbody></table></div></details>';
 if(data.suggestions.length){
  html+='<details style="margin-top:14px"><summary style="cursor:pointer;font-weight:750">5/3/1 assistance · set suggestions (review only)</summary>'+
   '<p style="font-size:12px;color:var(--muted,#aaa)">The 5/3/1 percentages, three main sets and optional BBB five sets are not changed. Suggestions are not loaded into your workouts automatically.</p>'+
   data.suggestions.slice(0,12).map(r=>'<div style="border-top:1px solid #303030;padding:8px 0"><strong>'+esc(r.name)+' · '+r.sets+' working sets</strong><div style="font-size:12px;color:var(--muted,#aaa)">'+esc(r.lift)+': '+esc(r.reason)+'</div></div>').join('')+'</details>';
 }
 html+='<p style="font-size:11px;color:var(--muted,#aaa);margin-top:15px">* Indirect sets are counted at 0.5 for workload bookkeeping; this is not a validated personal stimulus score. **Bands are provisional coaching starting ranges, not individual optimal volumes. Incomplete or unsynchronised workouts can understate the totals. No programme edits are made.</p>';
 host.innerHTML=html;
}
root.SXScientificPanels=Object.freeze({render});
})(window);
