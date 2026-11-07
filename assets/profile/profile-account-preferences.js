/* SpartanX Account / Profile / Preferences UI (device-local v242).
   Real authentication and password operations intentionally disabled offline. */
(()=>{
 'use strict';
 const byId=id=>document.getElementById(id);
 const profileEditor=byId('editProfileOverlay'),settings=byId('profileSettingsOverlay');
 const editButton=byId('editProfile'),saveButton=byId('saveProfile');
 if(!profileEditor||!settings||!editButton||!saveButton)return;
 const editPanel=profileEditor.querySelector('.detail-panel');
 const panel=settings.querySelector('.detail-panel');
 const profile=()=>db.profile||(db.profile={});
 const currentYear=()=>new Date().getFullYear();
 const m=byId('profileBirthdayMonth'),d=byId('profileBirthdayDay'),y=byId('profileBirthdayYear'),links=byId('profileLinksInput');
 const months=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat(undefined,{month:'long'}).format(new Date(2024,i,1)));
 m.innerHTML='<option value="">Month</option>'+months.map((label,i)=>'<option value="'+String(i+1)+'">'+label+'</option>').join('');
 y.innerHTML='<option value="">Year</option>'+Array.from({length:currentYear()-1959},(_,i)=>currentYear()-i).map(n=>'<option value="'+n+'">'+n+'</option>').join('');
 function syncDays(preserve){
  const previous=preserve==null?d.value:String(preserve);
  const month=Number(m.value),year=Number(y.value)||2000;
  const max=month?new Date(year,month,0).getDate():31;
  d.innerHTML='<option value="">Day</option>'+Array.from({length:max},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('');
  d.value=Number(previous)>=1&&Number(previous)<=max?String(Number(previous)):'';
 }
 m.addEventListener('change',()=>syncDays());
 y.addEventListener('change',()=>syncDays());
 syncDays();
 const error=document.createElement('p');error.id='sxProfileEditorError';error.className='sx-edit-error';error.setAttribute('role','alert');error.hidden=true;
 saveButton.closest('.sx-edit-profile-actions').before(error);
 function showEditorError(value){error.textContent=value||'';error.hidden=!value;if(value)error.scrollIntoView({block:'nearest'});}
 function birthdayFromFields(){
  if(!m.value&&!d.value&&!y.value)return '';
  if(!m.value||!d.value||!y.value)throw Error('Choose a month, day and year, or leave all three birthday fields empty.');
  const year=Number(y.value),month=Number(m.value),day=Number(d.value);
  if(year<1960||year>currentYear())throw Error('Choose a birth year between 1960 and '+currentYear()+'.');
  const date=new Date(year,month-1,day);
  if(date.getFullYear()!==year||date.getMonth()+1!==month||date.getDate()!==day)throw Error('Choose a valid date for your birthday.');
  const now=new Date();if(date>new Date(now.getFullYear(),now.getMonth(),now.getDate()))throw Error('Your birthday cannot be in the future.');
  return [year,String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
 }
 function sanitizeLink(input){
  const value=String(input).trim();
  if(!value)return '';
  const full=/^https?:\/\//i.test(value)?value:'https://'+value;
  try{
   const url=new URL(full);
   if(!['https:','http:'].includes(url.protocol)||!url.hostname.includes('.')||url.username||url.password)throw Error();
   return url.href;
  }catch(e){throw Error('Enter valid website links, one per line (for example, instagram.com/yourname).');}
 }
 function linksFromField(){
  const input=links.value.split(/[\n\r]+/).map(s=>s.trim()).filter(Boolean);
  if(input.length>5)throw Error('Add no more than five profile links.');
  return [...new Set(input.map(sanitizeLink))];
 }
 function fillProfileExtras(){
  const p=profile();showEditorError('');
  links.value=Array.isArray(p.links)?p.links.join('\n'):'';
  const birthday=String(p.birthday||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  y.value=birthday?String(Number(birthday[1])):'';
  m.value=birthday?String(Number(birthday[2])):'';
  syncDays(birthday?Number(birthday[3]):'');
 }
 editButton.addEventListener('click',fillProfileExtras);
 let prepared=null;
 saveButton.addEventListener('click',event=>{
  try{prepared={birthday:birthdayFromFields(),links:linksFromField()};showEditorError('');}
  catch(e){prepared=null;event.preventDefault();event.stopImmediatePropagation();showEditorError(e.message);}
 },true);
 saveButton.addEventListener('click',()=>{
  if(!prepared)return;
  const p=profile();p.birthday=prepared.birthday;p.links=prepared.links;
  prepared=null;persist();renderProfile();
 });
 const publicLinks=document.createElement('div');publicLinks.id='sxProfilePublicLinks';publicLinks.className='sx-profile-public-links';publicLinks.setAttribute('aria-label','Public profile links');
 byId('profileDisplayBio').insertAdjacentElement('afterend',publicLinks);
 function renderPublicLinks(){
  publicLinks.replaceChildren();
  const entries=Array.isArray(profile().links)?profile().links:[];
  for(const item of entries.slice(0,5)){
   let href;try{href=sanitizeLink(item);}catch(e){continue;}
   const anchor=document.createElement('a');anchor.href=href;anchor.target='_blank';anchor.rel='noopener noreferrer';
   anchor.className='sx-public-link';anchor.textContent=new URL(href).hostname.replace(/^www\./,'');
   anchor.title=href;publicLinks.appendChild(anchor);
  }
  publicLinks.hidden=!publicLinks.childElementCount;
 }
 const previousRender=renderProfile;
 renderProfile=function(){const result=previousRender.apply(this,arguments);renderPublicLinks();return result;};
 renderPublicLinks();

 // New Settings navigation, using the existing active Settings modal/window.
 const heading=panel.querySelector('.row.between');
 const unitSection=panel.querySelector('section');
 if(!heading||!unitSection||!byId('unitWeight'))return;
 unitSection.classList.add('sx-units-section');
 const dashboard=document.createElement('section');
 dashboard.id='sxSettingsDashboard';dashboard.className='sx-settings-dashboard';
 dashboard.innerHTML='<h3 class="sx-settings-heading">Account</h3>'+
  '<div class="sx-settings-menu">'+
   '<button type="button" id="sxSettingsEditProfile"><span class="sx-settings-menu-icon">✎</span><span class="sx-settings-menu-text"><strong>Edit Profile</strong><small>Public and private profile data</small></span><span class="sx-settings-chevron">›</span></button>'+
   '<button type="button" id="sxSettingsAccount"><span class="sx-settings-menu-icon">◎</span><span class="sx-settings-menu-text"><strong>Account</strong><small>Username, email and login preparation</small></span><span class="sx-settings-chevron">›</span></button>'+
  '</div><h3 class="sx-settings-heading">Preferences</h3>'+
  '<div class="sx-settings-menu">'+
   '<button type="button" id="sxSettingsUnits"><span class="sx-settings-menu-icon">⚖</span><span class="sx-settings-menu-text"><strong>Units</strong><small id="sxSettingsUnitsSummary">KG · KM · CM</small></span><span class="sx-settings-chevron">›</span></button>'+
   '<button type="button" id="sxSettingsLanguage"><span class="sx-settings-menu-icon">文</span><span class="sx-settings-menu-text"><strong>Language</strong><small id="sxSettingsLanguageSummary">English</small></span><span class="sx-settings-chevron">›</span></button>'+
  '</div>';
 heading.insertAdjacentElement('afterend',dashboard);
 const subpage=document.createElement('div');subpage.id='sxSettingsSubpage';subpage.className='sx-settings-subpage';subpage.hidden=true;
 subpage.innerHTML='<div class="sx-settings-subhead"><button type="button" id="sxSettingsBack" aria-label="Back to Settings">← Back</button><h2 id="sxSettingsSubpageTitle"></h2></div><div id="sxSettingsSubpageContent"></div>';
 panel.appendChild(subpage);
 const subContent=byId('sxSettingsSubpageContent');
 let currentSub='';
 function updateSettingsSummaries(){
  const pretty=preferences.weight.toUpperCase()+' · '+preferences.distance.toUpperCase()+' · '+preferences.body.toUpperCase();
  byId('sxSettingsUnitsSummary').textContent=pretty;
  const key=preferences.language||'en';
  const current=languageOptions.find(item=>item.code===key)||languageOptions[0];
  byId('sxSettingsLanguageSummary').textContent=current.label;
 }
 function closeSub(){
  if(currentSub==='units')dashboard.insertAdjacentElement('afterend',unitSection);
  currentSub='';
  panel.classList.remove('sx-settings-subview-open');subpage.hidden=true;
  subContent.replaceChildren();panel.scrollTop=0;updateSettingsSummaries();
 }
 function openSub(kind){
  if(currentSub)closeSub();
  currentSub=kind;panel.classList.add('sx-settings-subview-open');
  subpage.hidden=false;subContent.replaceChildren();panel.scrollTop=0;
  byId('sxSettingsSubpageTitle').textContent=kind==='units'?'Units':kind==='language'?'Language':'Account';
  if(kind==='units'){subContent.appendChild(unitSection);unitSection.hidden=false;}
  if(kind==='language')renderLanguageSettings();
  if(kind==='account')renderAccountSettings();
 }
 const languageOptions=[
  {code:'en',label:'English'},{code:'es',label:'Español (Spanish)'},{code:'fr',label:'Français (French)'},
  {code:'de',label:'Deutsch (German)'},{code:'it',label:'Italiano (Italian)'},{code:'pt',label:'Português (Portuguese)'},
  {code:'nl',label:'Nederlands (Dutch)'},{code:'pl',label:'Polski (Polish)'},{code:'uk',label:'Українська (Ukrainian)'},
  {code:'ru',label:'Русский (Russian)'},{code:'ar',label:'العربية (Arabic)'},{code:'hi',label:'हिन्दी (Hindi)'},
  {code:'zh-Hans',label:'简体中文 (Mandarin Chinese)'},{code:'zh-Hant',label:'繁體中文 (Traditional Chinese)'},
  {code:'ja',label:'日本語 (Japanese)'},{code:'ko',label:'한국어 (Korean)'},{code:'tr',label:'Türkçe (Turkish)'},
  {code:'id',label:'Bahasa Indonesia'},{code:'vi',label:'Tiếng Việt (Vietnamese)'},{code:'th',label:'ไทย (Thai)'},
  {code:'el',label:'Ελληνικά (Greek)'},{code:'sv',label:'Svenska (Swedish)'},{code:'no',label:'Norsk (Norwegian)'},
  {code:'da',label:'Dansk (Danish)'},{code:'fi',label:'Suomi (Finnish)'},{code:'ro',label:'Română (Romanian)'},
  {code:'cs',label:'Čeština (Czech)'},{code:'hu',label:'Magyar (Hungarian)'},{code:'bn',label:'বাংলা (Bengali)'},
  {code:'ur',label:'اردو (Urdu)'},{code:'sw',label:'Kiswahili (Swahili)'},{code:'he',label:'עברית (Hebrew)'},
  {code:'fa',label:'فارسی (Persian)'},{code:'ms',label:'Bahasa Melayu (Malay)'},{code:'fil',label:'Filipino'},
  {code:'ta',label:'தமிழ் (Tamil)'},{code:'te',label:'తెలుగు (Telugu)'},{code:'pa',label:'ਪੰਜਾਬੀ (Punjabi)'}
 ];
 function renderLanguageSettings(){
  const content=document.createElement('section');content.className='sx-settings-form';
  const label=document.createElement('label');label.htmlFor='sxLanguageSelection';label.textContent='PREFERRED LANGUAGE';content.appendChild(label);
  const input=document.createElement('select');input.id='sxLanguageSelection';input.setAttribute('aria-label','Choose preferred language');
  input.innerHTML=languageOptions.map(x=>'<option value="'+x.code+'">'+x.label+'</option>').join('');
  input.value=languageOptions.some(x=>x.code===preferences.language)?preferences.language:'en';
  content.appendChild(input);
  const note=document.createElement('p');note.className='tiny muted';note.textContent='Your selection will be saved on this device. SpartanX will remain in English until translations are added.';content.appendChild(note);
  const btn=document.createElement('button');btn.type='button';btn.className='sx-settings-save';btn.textContent='SAVE LANGUAGE';content.appendChild(btn);
  btn.addEventListener('click',()=>{preferences.language=input.value;savePreferences();closeSub();});
  subContent.appendChild(content);
 }
 function renderAccountSettings(){
  const account=db.account&&typeof db.account==='object'?db.account:{};
  const section=document.createElement('section');section.className='sx-settings-form';
  section.innerHTML='<p class="tiny muted">Offline account settings. Username and email are stored on this device only; no online account is created.</p>'+
   '<label for="sxAccountUsername">ACCOUNT USERNAME</label><input id="sxAccountUsername" maxlength="24" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="your_username">'+
   '<p class="tiny muted">This username appears in the Profile header. Use 3–24 letters, numbers, periods or underscores.</p>'+
   '<label for="sxAccountEmail">EMAIL ADDRESS</label><input id="sxAccountEmail" type="email" maxlength="180" inputmode="email" autocomplete="email" placeholder="you@example.com">'+
   '<p class="tiny muted">For future sign-in only. Not sent or verified.</p>'+
   '<label>PASSWORD</label><button type="button" disabled class="sx-disabled-password">Change password · available with online accounts</button>'+
   '<p class="tiny muted">Password changes require secure online authentication. SpartanX does not store a password locally.</p>'+
   '<p role="alert" class="sx-edit-error" id="sxAccountError" hidden></p>'+
   '<button type="button" class="sx-settings-save" id="sxSaveAccount">SAVE ACCOUNT DETAILS</button>';
  subContent.appendChild(section);
  const name=byId('sxAccountUsername'),email=byId('sxAccountEmail');
  name.value=String(account.username||profile().username||profile().name?.toLowerCase().replace(/[^a-z0-9._]+/g,'_').replace(/^[_\.]+|[_\.]+$/g,'')||'').slice(0,24);
  email.value=String(account.email||'');
  byId('sxSaveAccount').addEventListener('click',()=>{
   const username=name.value.trim().toLowerCase(),mail=email.value.trim().toLowerCase();
   const error=byId('sxAccountError');
   let message='';
   if(!/^[a-z0-9._]{3,24}$/.test(username))message='Choose a username of 3–24 letters, numbers, periods or underscores.';
   else if(mail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))message='Enter a valid email address or leave the email field empty.';
   if(message){error.hidden=false;error.textContent=message;return;}
   db.account={username,email:mail,localOnly:true};
   profile().username=username;
   persist();renderProfile();closeSub();
  });
 }
 byId('sxSettingsEditProfile').addEventListener('click',()=>{
  closeSub();byId('closeProfileSettings').click();editButton.click();
 });
 byId('sxSettingsAccount').addEventListener('click',()=>openSub('account'));
 byId('sxSettingsUnits').addEventListener('click',()=>openSub('units'));
 byId('sxSettingsLanguage').addEventListener('click',()=>openSub('language'));
 byId('sxSettingsBack').addEventListener('click',closeSub);
 byId('closeProfileSettings').addEventListener('click',closeSub);
 settings.addEventListener('click',event=>{if(event.target===settings)closeSub();});
 for(const id of ['unitWeight','unitDistance','unitBody'])byId(id).addEventListener('change',updateSettingsSummaries);
 updateSettingsSummaries();
})();
