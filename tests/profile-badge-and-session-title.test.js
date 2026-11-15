/* node tests/profile-badge-and-session-title.test.js
 * Profile rank labels precede emblems; saved-session title stays clickable
 * without the visual pill that appeared on iPhone.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const style=fs.readFileSync('assets/profile/profile-layout-hevy.css','utf8');
const profile=fs.readFileSync('assets/profile/profile-preview-parity.js','utf8');
const start=html.indexOf(" $('profileBadgeGrid').innerHTML=badges.map(b=>");
assert(start>=0,'Badge tile markup is still rendered');
const badges=html.slice(start,html.indexOf("}).join('');",start)+12);
assert.equal((badges.match(/profile-badge-rank-name/g)||[]).length,2,
 'Locked and unlocked badges have dedicated labels');
const locked=badges.slice(badges.indexOf("return locked?"),badges.indexOf(":'<button type="));
const unlocked=badges.slice(badges.indexOf(":'<button type="));
for(const [kind,markup] of [['locked',locked],['unlocked',unlocked]]){
 assert(markup.indexOf('profile-badge-rank-name')>=0,
  kind+' includes name');
 assert(markup.indexOf('profile-badge-rank-name')<markup.indexOf('badge-art'),
  kind+' rank name precedes the emblem');
 assert(markup.indexOf('badge-art')<markup.indexOf('</small>'),
  kind+' emblem precedes its status description');
}
assert(style.includes('#profile #profileBadgeGrid .profile-badge .profile-badge-rank-name'),
 'Profile label has scoped layout styles');
assert(style.includes('font-size:clamp(10px,2.65vw,12px)'),
 'Label typography adapts to four-column mobile layout');
assert(style.includes('#profile #profileBadgeGrid .profile-badge .badge-art'),
 'Emblem spacing is explicitly set');
assert(profile.includes('data-profile-view='),
 'Logged workout title retains the existing click handler attribute');
assert(profile.includes('openCompletedWorkout(id)'),
 'Tapping logged title still opens the completed workout');
assert(style.includes('button[data-profile-view]'),
 'Only profile workout titles are reset to borderless text');
assert(style.includes('background:transparent!important;')&&
 style.includes('border:0!important;')&&
 style.includes('box-shadow:none!important;'),
 'Workout title does not have a visible button container');
assert(style.includes('button[data-profile-view]:focus-visible'),
 'Keyboard focus remains perceptible');
assert(html.includes('profile-layout-hevy.css?v=343'),
 'Mobile app loads the changed stylesheet version');
console.log('PASS: Profile badge titles are above icons and session titles remain clickable without containers.');
