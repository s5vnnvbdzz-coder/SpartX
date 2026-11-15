/* SpartanX Chart Scrub v340 — hold and drag over a chart to inspect values.
 * Progressive enhancement: no data mutation or chart re-render.
 * Works with circles and bars that carry SVG <title> or aria-label.
 */
(function(global){
 'use strict';
 const chartSelectors=[
  '.performance-chart','.history-chart-wrap','#exerciseHistoryCharts',
  '.sx-exercise-chart','.sx-session-trend-chart','#trainingRadar',
  '.chart-wrap','.chart-container','.chart-frame','.chart-surface',
  '.sx-intel-chart','.trend-chart','.chart-area','.chart','.performance-chart-wrap'
 ].join(',');
 let active=null;
 function candidates(svg){
  return Array.from(svg.querySelectorAll('circle,rect')).filter(node=>
   !!(node.querySelector('title')?.textContent?.trim()||
      node.getAttribute('aria-label')||
      node.hasAttribute('data-ex-stat-point')||
      node.getAttribute('data-sx-point-label')));
 }
 function nearest(points,clientX){
  return points.reduce((best,node)=>{
   const rect=node.getBoundingClientRect(),x=rect.left+rect.width/2;
   const distance=Math.abs(x-clientX);
   return !best||distance<best.distance?{node,distance}:best;
  },null)?.node||null;
 }
 function labelFor(node){
  return node.getAttribute('data-sx-point-label')||
   node.getAttribute('aria-label')||
   node.querySelector('title')?.textContent?.trim()||'Data point';
 }
 function containerFor(svg){
  return svg.closest(chartSelectors)||svg.parentElement;
 }
 function clear(){
  if(!active)return;
  active.highlight?.classList.remove('sx-chart-scrub-active');
  if(active.tooltip)active.tooltip.hidden=true;
  if(active.root)active.root.classList.remove('sx-chart-is-scrubbing');
  active=null;
 }
 function update(clientX){
  if(!active)return;
  const {points,root,tooltip}=active,node=nearest(points,clientX);
  if(!node)return;
  if(active.highlight!==node){
   active.highlight?.classList.remove('sx-chart-scrub-active');
   node.classList.add('sx-chart-scrub-active');
   active.highlight=node;
  }
  const b=node.getBoundingClientRect(),r=root.getBoundingClientRect();
  tooltip.textContent=labelFor(node);
  tooltip.hidden=false;
  tooltip.style.left=Math.max(48,Math.min(r.width-48,b.left+b.width/2-r.left))+'px';
  tooltip.style.top=Math.max(18,b.top-r.top-11)+'px';
 }
 function start(event){
  if(event.button!=null&&event.button!==0)return;
  const svg=event.target?.closest?.('svg');
  if(!svg||!svg.closest(chartSelectors)||active)return;
  const points=candidates(svg);
  if(!points.length)return;
  const root=containerFor(svg);
  if(!root)return;
  let tooltip=root.querySelector(':scope > .sx-chart-scrub-tooltip');
  if(!tooltip){
   tooltip=document.createElement('div');
   tooltip.className='sx-chart-scrub-tooltip';
   tooltip.hidden=true;
   tooltip.setAttribute('role','status');
   tooltip.setAttribute('aria-live','off');
   root.appendChild(tooltip);
  }
  root.classList.add('sx-chart-scrub-target','sx-chart-is-scrubbing');
  active={pointerId:event.pointerId,svg,root,tooltip,points,highlight:null};
  try{svg.setPointerCapture?.(event.pointerId)}catch(_){}
  update(event.clientX);
 }
 function move(event){if(active&&event.pointerId===active.pointerId)update(event.clientX)}
 function stop(event){
  if(!active||event.pointerId!==active.pointerId)return;
  const svg=active.svg;
  try{if(svg.hasPointerCapture?.(event.pointerId))svg.releasePointerCapture(event.pointerId)}catch(_){}
  clear();
 }
 function init(){
  if(!global.document)return;
  document.addEventListener('pointerdown',start,true);
  document.addEventListener('pointermove',move,true);
  document.addEventListener('pointerup',stop,true);
  document.addEventListener('pointercancel',stop,true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 global.SXChartScrub=Object.freeze({nearest,labelFor,candidates,clear});
})(window);
