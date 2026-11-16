/* Keep each Profile dashboard's scroll content exactly below its fixed title.
   Measure the real title height, including safe-area padding and wrapped text. */
(()=>{
 'use strict';
 const pages=[
  ['trainingStatsOverlay','.sx-statistics-heading'],
  ['exerciseStatsScreen',':scope > .row.between:first-child'],
  ['measuresOverlay',':scope > .sx-measure-page-head'],
  ['sxMeasureLogPage',':scope > .sx-measure-page-head']
 ].map(([id,selector])=>{
  const screen=document.getElementById(id);
  return {screen,header:screen?.querySelector(selector)};
 }).filter(item=>item.screen&&item.header);
 if(!pages.length)return;
 const sync=()=>{
  for(const {screen,header} of pages){
   if(!screen.classList.contains('active'))continue;
   const height=Math.ceil(header.getBoundingClientRect().height);
   if(height>0&&Number.isFinite(height))
    screen.style.setProperty('--sx-profile-detail-header-height',height+14+'px');
  }
 };
 const classes=new MutationObserver(sync);
 for(const {screen} of pages)classes.observe(screen,{attributes:true,attributeFilter:['class']});
 if('ResizeObserver' in window){
  const sizes=new ResizeObserver(sync);
  for(const {header} of pages)sizes.observe(header);
 }
 window.addEventListener('resize',sync,{passive:true});
 window.addEventListener('orientationchange',sync,{passive:true});
 sync();
 requestAnimationFrame(sync);
})();
