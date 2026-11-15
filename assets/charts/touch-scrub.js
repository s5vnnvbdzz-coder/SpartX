/* SpartanX Chart Scrub v340 — hold and drag over a chart to inspect values.
 * Progressive enhancement: no data mutation or chart re-render.
 * Works with circles and bars that carry SVG <title> or aria-label.
 */
(function(global){
 'use strict';
 const chartSelectors=[
  '.performance-chart','.history-chart-wrap','#exerciseHistoryCharts',
  '.sx-exercise-chart','.sx-session-trend-chart','#trainingRadar',
  '#performanceChart','#overviewStrengthChart','.large-chart','.chart-wrap','.chart-container','.chart-frame','.chart-surface',
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
  const match=svg.closest(chartSelectors);
  return match===svg?svg.parentElement:match||svg.parentElement;
 }
 // Use chart axes when present so the guide spans the PLOT rather than
 // cutting across dates and labels below the graph.
 function plotBounds(svg){
  const view=svg.viewBox?.baseVal;
  const top=view?.y||0,height=view?.height||svg.getBoundingClientRect().height||200;
  const lines=Array.from(svg.querySelectorAll('line')).map(line=>({
   x1:Number(line.getAttribute('x1')),x2:Number(line.getAttribute('x2')),
   y1:Number(line.getAttribute('y1')),y2:Number(line.getAttribute('y2'))
  })).filter(l=>[l.x1,l.x2,l.y1,l.y2].every(Number.isFinite));
  const axes=lines.filter(l=>Math.abs(l.x1-l.x2)<.75&&Math.abs(l.y2-l.y1)>height*.35)
   .sort((a,b)=>Math.abs(b.y2-b.y1)-Math.abs(a.y2-a.y1));
  if(axes.length)return {top:Math.min(axes[0].y1,axes[0].y2),bottom:Math.max(axes[0].y1,axes[0].y2)};
  const grid=lines.filter(l=>Math.abs(l.y1-l.y2)<.75&&Math.abs(l.x2-l.x1)>(view?.width||200)*.25)
   .map(l=>l.y1);
  if(grid.length>1){
   const min=Math.min(...grid),max=Math.max(...grid);
   if(max-min>height*.35)return {top:min,bottom:max};
  }
  return {top:top+Math.max(3,height*.04),bottom:top+height-Math.max(10,height*.14)};
 }
 function pointX(svg,node){
  const b=node.getBoundingClientRect(),clientX=b.left+b.width/2,clientY=b.top+b.height/2;
  // Screen-to-SVG conversion keeps the guide centred in scaled iPhone charts.
  try{
   const point=svg.createSVGPoint?.(),matrix=svg.getScreenCTM?.();
   if(point&&matrix){
    point.x=clientX;point.y=clientY;
    const local=point.matrixTransform(matrix.inverse());
    if(Number.isFinite(local.x))return local.x;
   }
  }catch(_){}
  const rect=svg.getBoundingClientRect(),view=svg.viewBox?.baseVal;
  return (view?.x||0)+(clientX-rect.left)*(view?.width||rect.width)/Math.max(1,rect.width);
 }
 function clear(){
  if(!active)return;
  active.highlight?.classList.remove('sx-chart-scrub-active');
  active.guide?.remove();
  if(active.tooltip)active.tooltip.hidden=true;
  if(active.root)active.root.classList.remove('sx-chart-is-scrubbing');
  active=null;
 }
 function update(clientX){
  if(!active)return;
  const {points,root,tooltip,svg,guide}=active,node=nearest(points,clientX);
  if(!node)return;
  const x=pointX(svg,node);
  guide.setAttribute('x1',String(x));
  guide.setAttribute('x2',String(x));
  if(active.highlight!==node){
   active.highlight?.classList.remove('sx-chart-scrub-active');
   node.classList.add('sx-chart-scrub-active');
   active.highlight=node;
  }
  const b=node.getBoundingClientRect(),r=root.getBoundingClientRect();
  tooltip.textContent=labelFor(node);
  tooltip.hidden=false;
  tooltip.style.left=Math.max(48,Math.min(r.width-48,b.left+b.width/2-r.left))+'px';
  tooltip.style.top=Math.max(42,b.top-r.top-11)+'px';
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
  const guide=document.createElementNS('http://www.w3.org/2000/svg','line');
  const bounds=plotBounds(svg);
  guide.setAttribute('class','sx-chart-scrub-line');
  guide.setAttribute('aria-hidden','true');
  guide.setAttribute('y1',String(bounds.top));
  guide.setAttribute('y2',String(bounds.bottom));
  guide.style.pointerEvents='none';
  svg.appendChild(guide);
  active={pointerId:event.pointerId,svg,root,tooltip,points,guide,highlight:null};
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
