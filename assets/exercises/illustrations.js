/* Original illustrated exercise thumbnails for SpartanX. No external image service required. */
(function(){
'use strict';
/* Positions: head, torso, left arm, right arm, left leg, right leg; 128x128 canvas. */
const shapes={
bench:[[27,69],[[40,72],[69,65]],[[46,70],[48,49],[48,25]],[[55,70],[76,49],[76,25]],[[68,67],[92,88],[114,91]],[[68,68],[88,101],[111,108]]],
incline:[[35,35],[[43,45],[69,81]],[[45,50],[40,29],[33,18]],[[52,52],[72,30],[80,17]],[[69,81],[96,91],[111,113]],[[68,81],[82,106],[98,117]]],
fly:[[29,69],[[40,73],[69,68]],[[46,71],[25,50],[14,41]],[[53,71],[84,50],[112,42]],[[69,69],[90,90],[112,98]],[[69,69],[81,105],[100,116]]],
squat:[[63,23],[[64,37],[63,73]],[[57,41],[39,44],[28,42]],[[70,41],[89,44],[100,42]],[[63,73],[39,90],[47,110]],[[63,73],[86,91],[82,111]]],
lunge:[[62,23],[[63,37],[60,75]],[[56,41],[49,66],[47,83]],[[69,41],[80,64],[81,82]],[[60,75],[86,89],[112,103]],[[60,75],[38,104],[21,117]]],
deadlift:[[82,37],[[74,49],[45,73]],[[70,52],[75,75],[78,103]],[[65,58],[60,85],[66,103]],[[46,73],[33,94],[39,114]],[[45,73],[63,94],[59,114]]],
hipthrust:[[20,61],[[32,65],[68,63]],[[40,66],[48,87],[57,88]],[[44,69],[62,88],[74,91]],[[68,63],[94,75],[110,106]],[[69,63],[89,84],[92,111]]],
overhead:[[64,39],[[64,53],[63,87]],[[57,57],[40,35],[34,17]],[[71,57],[88,35],[94,17]],[[63,87],[49,109],[47,123]],[[63,87],[77,110],[81,123]]],
raise:[[64,23],[[64,38],[64,84]],[[57,43],[33,48],[12,49]],[[71,43],[96,49],[117,48]],[[64,84],[51,106],[49,121]],[[64,84],[78,106],[80,121]]],
rear:[[78,31],[[72,43],[44,72]],[[66,49],[40,44],[17,30]],[[62,56],[83,57],[104,42]],[[46,71],[38,96],[37,121]],[[46,71],[68,94],[80,120]]],
pulldown:[[64,52],[[64,65],[64,93]],[[57,70],[34,52],[24,27]],[[71,70],[94,52],[105,27]],[[64,93],[42,109],[34,117]],[[64,93],[87,109],[93,117]]],
pullup:[[64,49],[[64,64],[64,91]],[[56,66],[37,47],[32,15]],[[72,66],[91,47],[97,15]],[[64,91],[49,112],[48,123]],[[64,91],[78,112],[79,123]]],
row:[[81,40],[[74,52],[45,74]],[[71,55],[81,72],[66,85]],[[62,60],[68,81],[56,87]],[[45,75],[34,97],[40,118]],[[45,75],[65,95],[70,118]]],
curl:[[64,21],[[64,36],[64,85]],[[57,41],[39,68],[48,51]],[[71,41],[88,68],[80,50]],[[64,85],[52,108],[50,123]],[[64,85],[78,108],[80,123]]],
triceps:[[52,22],[[53,36],[54,84]],[[46,41],[39,65],[42,92]],[[60,42],[70,65],[72,92]],[[54,84],[42,110],[39,122]],[[54,84],[70,109],[76,121]]],
legpress:[[38,62],[[48,71],[73,92]],[[51,75],[64,91],[71,100]],[[58,77],[70,95],[81,102]],[[73,91],[95,64],[107,29]],[[74,92],[106,80],[115,35]]],
extension:[[46,23],[[46,37],[47,77]],[[39,44],[30,68],[38,85]],[[53,44],[64,68],[57,86]],[[47,78],[86,78],[106,51]],[[47,78],[91,86],[111,57]]],
legcurl:[[22,58],[[36,64],[68,66]],[[41,66],[39,83],[49,85]],[[50,67],[55,83],[63,85]],[[69,67],[93,64],[101,40]],[[68,68],[93,78],[108,53]]],
calf:[[64,19],[[64,33],[64,80]],[[56,40],[41,62],[42,83]],[[72,40],[87,61],[88,83]],[[64,81],[53,109],[59,120]],[[64,81],[76,108],[83,119]]],
dip:[[64,20],[[64,35],[63,77]],[[56,41],[44,60],[42,83]],[[71,41],[84,60],[85,83]],[[63,77],[51,105],[58,121]],[[63,77],[81,106],[77,121]]],
core:[[20,74],[[34,81],[74,77]],[[41,81],[43,99],[56,100]],[[47,80],[58,94],[66,99]],[[74,78],[101,89],[116,108]],[[73,78],[94,101],[112,113]]],
carry:[[64,22],[[64,37],[65,84]],[[57,42],[41,65],[38,94]],[[71,42],[87,65],[90,94]],[[65,84],[48,108],[50,123]],[[65,84],[84,108],[79,123]]]
};
const gear={
bench:'M12 91H91M18 91V112M86 91V112M11 24H112',
incline:'M26 26L81 108M81 108L88 117M26 26V48M12 16H108',
fly:'M11 91H91M17 91V115M89 91V115M8 38H20M107 38H120',
squat:'M15 41H113M15 32V50M113 32V50',
lunge:'M39 80V94M89 80V94',
deadlift:'M8 105H120M19 92V118M109 92V118',
hipthrust:'M10 82H49M13 82V113M48 82V113M51 57H85M14 118H120',
overhead:'M12 16H116M18 6V27M110 6V27',
raise:'M6 44V55M122 43V55',
rear:'M9 27H26M100 36H118',
pulldown:'M13 22H115M20 21V34M108 21V34M64 9V18M41 104H89M37 116H91',
pullup:'M12 13H116M16 13V32M112 13V32',
row:'M15 89H115M21 84V96M109 84V96',
curl:'M38 46H51M77 45H90',
triceps:'M104 8V120M54 9H105M54 9V52M40 54H68',
legpress:'M25 58L89 118M20 62L47 103M10 113H84M99 9L118 57',
extension:'M16 88H75M25 88V118M75 87V117M106 45L116 60',
legcurl:'M12 90H91M18 90V114M88 90V114',
calf:'M33 117H91M33 110V120',
dip:'M21 72H48M81 72H108M23 72V122M107 72V122',
core:'M7 116H121',
carry:'M27 91H50M77 91H102M32 86V99M97 86V99'
};
const typeCache=Object.create(null);
function select(name){
const n=String(name||'').toLowerCase();
if(/incline/.test(n)&&/(press|chest)/.test(n))return'incline';
if(/chest fly|dumbbell fly|cable fly|crossover/.test(n))return'fly';
if(/dip/.test(n))return'dip';
if(/bench press|chest press|flat dumbbell|close-grip bench|push-up/.test(n))return'bench';
if(/hip thrust|glute bridge|kickback/.test(n))return'hipthrust';
if(/leg press/.test(n))return'legpress';
if(/leg extension/.test(n))return'extension';
if(/leg curl|hamstring curl|single-leg curl/.test(n))return'legcurl';
if(/calf raise/.test(n))return'calf';
if(/lunge|split squat|step-up/.test(n))return'lunge';
if(/deadlift|romanian/.test(n))return'deadlift';
if(/squat/.test(n))return'squat';
if(/lateral raise|front raise/.test(n))return'raise';
if(/reverse pec deck|rear delt|face pull/.test(n))return'rear';
if(/overhead press|shoulder press|arnold press|military press/.test(n))return'overhead';
if(/pull-up|chin-up|assisted pull/.test(n))return'pullup';
if(/pulldown|pull down/.test(n))return'pulldown';
if(/row/.test(n))return'row';
if(/curl/.test(n)&&!/crunch/.test(n))return'curl';
if(/triceps|skull crusher|pushdown/.test(n))return'triceps';
if(/plank|ab wheel|crunch|sit-up|knee raise|leg raise|pallof/.test(n))return'core';
if(/carry/.test(n))return'carry';
return'carry';
}
function stroke(pts,active){
const d='M'+pts.map(p=>p[0]+' '+p[1]).join('L');
return '<path d="'+d+'" stroke="#161c21" stroke-width="15" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'+
'<path d="'+d+'" stroke="'+(active?'#d95b50':'#aeb7bb')+'" stroke-width="9" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'+
'<path d="'+d+'" stroke="'+(active?'#ffac80':'#f5f5f0')+'" stroke-opacity=".55" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>';
}
function draw(t){
const p=shapes[t]||shapes.carry;
const z=/bench|incline|fly|core/.test(t)?'torso':/squat|lunge|legpress|extension|legcurl|calf|hipthrust/.test(t)?'legs':/deadlift|row|pulldown|pullup|rear/.test(t)?'back':'arms';
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 128 128">'+
'<rect width="128" height="128" rx="13" fill="#111519"/>'+
'<path d="M0 104L128 82M0 125L128 103M16 0V128M112 0V128" stroke="#2d363d" stroke-width="1" opacity=".46"/>'+
'<rect x="3" y="3" width="122" height="122" rx="12" stroke="#4a545c" stroke-width="1.7" fill="none"/>'+
'<path d="'+(gear[t]||gear.carry)+'" stroke="#59676f" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="none"/>'+
stroke(p[4],z==='legs')+stroke(p[5],z==='legs')+
stroke(p[1],z==='torso'||z==='back')+
stroke(p[2],z==='arms')+stroke(p[3],z==='arms')+
'<circle cx="'+p[0][0]+'" cy="'+p[0][1]+'" r="10.5" stroke="#1b242b" stroke-width="2.5" fill="#b9c2c5"/>'+
'<path d="M'+(p[0][0]-3)+' '+(p[0][1]-4)+'q5 -3 8 1" fill="none" stroke="#f1f0e9" stroke-width="2.1" opacity=".8"/>'+
'<path d="M10 10H30M10 15H20" stroke="#e54b45" stroke-width="2.5" stroke-linecap="round"/>'+
'</svg>';
return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
window.spartanExerciseImage=function(name){
 const t=select(name);
 return typeCache[t]||(typeCache[t]=draw(t));
};
})();