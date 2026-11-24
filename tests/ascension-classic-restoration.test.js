/* Classic AscensionX must remain the six-week original with improved assistance.
 * The old opt-in 2.0 beta bridge is retired and never loaded into SpartanX.
 * Run: node tests/ascension-classic-restoration.test.js
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const here=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(here,file),'utf8');
const spartan=read('index.html');
const classic=read('AscensionX/index.html');
const classicSW=read('AscensionX/sw.js');
const spartanSW=read('sw.js');
const oldBeta=read('AscensionX/beta-preview.html');
const standalone=read('AscensionX2/index.html');
const prescription=read('assets/ascension/workout-prescription.js');
const adaptive=read('assets/ascension/adaptive-programming.js');
const quality=read('assets/ascension/selection-quality.js');
let checks=0;
function ok(value,msg){assert.ok(value,msg);checks++;}
for(const [label,source] of [['SpartanX',spartan],['original AscensionX',classic],['classic offline shell',classicSW]]){
 ok(!source.includes('classic-v2-bridge.js'),label+' must never load old beta bridge');
 ok(!source.includes('programming-v2.js'),label+' must not load old 8/12/16 preview engine');
 ok(source.includes('selection-quality.js?v=420'),label+' keeps smart exercise selection');
 ok(source.includes('adaptive-programming.js?v=420'),label+' keeps updated assistance');
}
ok(!spartan.includes('sxAscensionBetaPreviewCard'),'No old 2.0 beta card in SpartanX');
ok(!spartan.includes('sxAscensionBetaOpen'),'No hidden beta open button');
ok(!spartan.includes('sx-ascension-beta-preview-link'),'No dead beta script');
ok(!spartan.includes('sx_beta_return'),'No old beta return navigation');
ok(spartan.includes('sxAscensionProgrammeSlot'),'Original AscensionX programme slot stays');
ok(spartan.includes('sxAscensionEmptySetup'),'Original AscensionX setup route stays');
ok(spartan.includes('SpartanXStartAscensionAdaptiveSupportSession'),'Improved support workout import remains');
ok(classic.includes('cycleProgressionReview'),'Six-week progression review retained');
ok(classic.includes('approveAscensionNextCycle'),'Original approved next-cycle flow remains');
ok(classic.includes('reconcileSavedSpartanSessions')||classic.includes('reconcileCompletedWeeks'),'Completion recovery stays');
ok(prescription.includes('week:6,name:\'Deload & consolidate\''),'The original sixth deload remains');
ok(prescription.includes('week:5,name:\'Heavy strength\''),'The original fifth heavy week remains');
ok(prescription.includes('reconcileSavedSpartanSessions'),'Old completion progression recovery remains');
ok(adaptive.includes('SXAscensionAdaptive'),'Six-week adaptive assistance engine preserved');
ok(quality.includes('SXAscensionSelectionQuality'),'Upgraded exercise-choice engine preserved');
ok(oldBeta.includes('../AscensionX2/'),'Old beta bookmark points to independent development app');
ok(!oldBeta.includes('APPLY REDESIGN TO CURRENT CYCLE'),'Retired beta cannot alter live cycle');
ok(standalone.includes('ASCENSION')&&standalone.includes('2.0'),'Standalone 2.0 still present');
ok(standalone.includes('id="builderForm"'),'Standalone developer cycle builder unaffected');
ok(classicSW.includes('ascensionx-shell-v133'),'Original six-week PWA shell refreshed');
ok(spartanSW.includes('spartanx-v421'),'SpartanX PWA cache updated without changing data');
console.log('PASS: classic AscensionX restored, smart assistance kept, standalone 2.0 independent ('+checks+' assertions)');
