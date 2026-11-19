/* SpartanX Cloud v1 — opt-in, training-only, upload-first snapshots.
   Does not modify spartx_db, ascensionx_strength_v1 or other training keys. */
(function () {
  'use strict';
  var cfg = window.SPARTANX_CLOUD_CONFIG || {};
  var base = String(cfg.url || '').replace(/\/+$/, '');
  var apiKey = String(cfg.publishableKey || '');
  var configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) &&
                   /^sb_publishable_[a-zA-Z0-9_-]+$/.test(apiKey);
  var AUTH = 'sx_cloud_auth_v1';
  var AUTO = 'sx_cloud_auto_v1';
  var DEVICE = 'sx_cloud_device_id_v1';
  var DIGEST_PREFIX = 'sx_cloud_last_upload_';
  var busy = false, statusNote = '', ui = null;
  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }
  function message(s) { statusNote = String(s || ''); render(); }
  function selected(value, fields) {
    var out = {};
    fields.forEach(function (k) {
      if (value && Object.prototype.hasOwnProperty.call(value, k)) out[k] = value[k];
    });
    return out;
  }
  function trainingDatasets() {
    var data = [];
    var spartan = readJson('spartx_db');
    if (spartan && Array.isArray(spartan.sessions)) {
      data.push({dataset:'spartx_sessions',data:{
        schema:1, sessions:spartan.sessions.map(function (s) {
          var result = selected(s, ['id','date','name','duration','bodybuildingLink','ascensionLink']);
          result.exercises = (Array.isArray(s.exercises) ? s.exercises : []).map(function (ex) {
            var movement = selected(ex, ['name','ascensionLink','bodybuildingLink','notes']);
            movement.sets = (Array.isArray(ex.sets) ? ex.sets : []).map(function (set) {
              return selected(set, ['weight','reps','rpe','type','done','label','notes','ascensionLink','bodybuildingLink']);
            });
            return movement;
          });
          return result;
        })
      }});
    }
    var ascension = readJson('ascensionx_strength_v1');
    if (ascension && Array.isArray(ascension.logs)) {
      data.push({dataset:'ascensionx_training',data:{
        schema:1,
        cycle:ascension.cycle || null,
        logs:ascension.logs,
        trainingMaxes:ascension.profile && ascension.profile.max || {},
        programmeSettings:selected(ascension.profile, ['tmPct','rounding','unit'])
      }});
    }
    return data;
  }
  function saveSession(obj) {
    if (!obj || !obj.access_token || !obj.refresh_token || !obj.user || !obj.user.id)
      throw Error('The authentication response was incomplete.');
    var record = {
      access_token:obj.access_token, refresh_token:obj.refresh_token,
      user_id:obj.user.id, expires_at:Date.now() + Number(obj.expires_in || 3600) * 1000
    };
    localStorage.setItem(AUTH, JSON.stringify(record));
    return record;
  }
  function session() { return readJson(AUTH); }
  async function request(path, method, payload, authenticated, customHeaders) {
    if (!configured) throw Error('Cloud configuration is not available.');
    var headers = {'apikey':apiKey, 'Content-Type':'application/json'};
    if (authenticated) {
      var access = await accessToken();
      headers.Authorization = 'Bearer ' + access;
    }
    Object.assign(headers, customHeaders || {});
    var resp = await fetch(base + path, {
      method:method || 'GET', headers:headers,
      body:payload === undefined ? undefined : JSON.stringify(payload),
      cache:'no-store'
    });
    var txt = await resp.text(), result = null;
    if (txt) { try { result = JSON.parse(txt); } catch (_) { result = txt; } }
    if (!resp.ok) {
      var reason = result && (result.msg || result.message || result.error_description || result.error);
      throw Error(typeof reason === 'string' ? reason.slice(0,180) : 'Cloud request failed ('+resp.status+').');
    }
    return result;
  }
  async function accessToken() {
    var s = session();
    if (!s || !s.refresh_token) throw Error('Sign in to SpartanX Cloud first.');
    if (Date.now() < Number(s.expires_at) - 60000) return s.access_token;
    var fresh = await request('/auth/v1/token?grant_type=refresh_token','POST',
                              {refresh_token:s.refresh_token},false);
    return saveSession(fresh).access_token;
  }
  function deviceId() {
    var id = localStorage.getItem(DEVICE);
    if (/^[0-9a-f-]{36}$/i.test(String(id || ''))) return id;
    if (!crypto || typeof crypto.randomUUID !== 'function')
      throw Error('This browser does not support secure device identifiers.');
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE,id);
    return id;
  }
  async function fingerprint(json) {
    var digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(json));
    return Array.from(new Uint8Array(digest)).map(function (n) {
      return n.toString(16).padStart(2,'0');
    }).join('');
  }
  async function upload(force) {
    if (busy || !configured || !session()) return;
    busy = true; render();
    try {
      var snapshots = trainingDatasets(), s = session();
      if (!snapshots.length) { message('No workout records found in this app’s local storage.'); return; }
      var updated = 0;
      var did = deviceId();
      for (var item of snapshots) {
        var json = JSON.stringify(item.data);
        if (json.length > 3500000) throw Error('Training records exceed the upload limit. Keep the manual JSON backup.');
        var hash = await fingerprint(json);
        var signatureKey = DIGEST_PREFIX + s.user_id + '_' + item.dataset;
        if (!force && localStorage.getItem(signatureKey) === hash) continue;
        await request('/rest/v1/sx_training_snapshots?on_conflict=user_id,device_id,dataset',
          'POST',[{
            user_id:s.user_id, device_id:did, dataset:item.dataset,
            data:item.data, captured_at:new Date().toISOString()
          }],true,{'Prefer':'resolution=merge-duplicates,return=minimal'});
        localStorage.setItem(signatureKey,hash);
        updated++;
      }
      message(updated ? 'Cloud backup completed: '+updated+' training dataset(s).' : 'Cloud copy is up to date.');
    } catch (err) { message('Backup not completed: ' + err.message); }
    finally { busy=false; render(); }
  }
  function downloadJson(name, data) {
    var link = document.createElement('a');
    var url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    link.href = url; link.download = name;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); },1000);
  }
  async function downloadCopy() {
    if (busy || !session()) return;
    busy = true; render();
    try {
      var rows = await request('/rest/v1/sx_training_snapshots?select=dataset,device_id,captured_at,data&order=captured_at.desc&limit=100','GET',undefined,true);
      if (!Array.isArray(rows) || !rows.length) throw Error('No cloud backups were found.');
      downloadJson('spartanx-cloud-training-export.json',{exportedAt:new Date().toISOString(),snapshots:rows});
      message('Cloud training archive downloaded. Local workouts were not changed.');
    } catch (err) { message('Download failed: ' + err.message); }
    finally { busy=false; render(); }
  }
  async function sendCode() {
    var input = ui.querySelector('#sxCloudEmail');
    var email = String(input.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { message('Enter a valid email address.'); return; }
    busy=true; render();
    try {
      await request('/auth/v1/otp','POST',{email:email,create_user:true},false);
      localStorage.setItem('sx_cloud_pending_email_v1',email);
      message('Sign-in email sent. Enter the six-digit code from your email.');
    } catch (err) { message('Could not send code: ' + err.message); }
    finally { busy=false; render(); }
  }
  async function verifyCode() {
    var email=localStorage.getItem('sx_cloud_pending_email_v1') || '';
    var token = String(ui.querySelector('#sxCloudCode').value || '').trim();
    if (!email || !/^\d{6,8}$/.test(token)) { message('Request a code, then enter it here.'); return; }
    busy=true; render();
    try {
      var result=await request('/auth/v1/verify','POST',{type:'email',email:email,token:token},false);
      saveSession(result);
      localStorage.removeItem('sx_cloud_pending_email_v1');
      message('Signed in. No data has been uploaded yet.');
    } catch (err) { message('Sign-in failed: ' + err.message); }
    finally { busy=false; render(); }
  }
  function render() {
    if (!ui) return;
    var signedIn = Boolean(session());
    var info = !configured ? 'Not configured — no data is being sent.' :
      signedIn ? 'Signed in · training backup available' : 'Not signed in';
    ui.querySelector('#sxCloudState').textContent = info;
    ui.querySelector('#sxCloudMessage').textContent = statusNote;
    var authorize=ui.querySelector('#sxCloudAuthorize');
    authorize.hidden = !configured || signedIn;
    ui.querySelector('#sxCloudUpload').disabled = busy || !configured || !signedIn;
    ui.querySelector('#sxCloudDownload').disabled = busy || !configured || !signedIn;
    ui.querySelector('#sxCloudLogout').hidden = !signedIn;
    ui.querySelector('#sxCloudAuto').disabled = busy || !configured || !signedIn;
    ui.querySelector('#sxCloudAuto').checked = localStorage.getItem(AUTO) === 'true' && signedIn;
  }
  function setup() {
    var host = document.querySelector('#profileSettingsOverlay .detail-panel') ||
               document.querySelector('#settingsBackdrop .settings-modal');
    if (!host) return;
    ui = document.createElement('section');
    ui.className = 'card';
    ui.id = 'sxCloudTrainingBackup';
    ui.style.cssText = 'margin-top:20px;padding:14px;border-radius:14px;';
    ui.innerHTML =
      '<h3 style="margin:0 0 8px">Cloud training backup</h3>'+
      '<p class="tiny muted">Optional private backup of completed SpartanX workouts and AscensionX cycle logs. Your existing on-device data is never replaced.</p>'+
      '<p id="sxCloudState" class="tiny" role="status"></p>'+
      '<div id="sxCloudAuthorize">'+
      '<label for="sxCloudEmail" class="tiny">Email for secure sign-in</label>'+
      '<input id="sxCloudEmail" type="email" autocomplete="email" placeholder="you@example.com" style="width:100%;margin:6px 0 8px">'+
      '<button type="button" class="secondary small" id="sxCloudSend">Email a sign-in code</button>'+
      '<label for="sxCloudCode" class="tiny" style="display:block;margin-top:10px">Email code</label>'+
      '<input id="sxCloudCode" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" style="width:100%;margin:6px 0 8px">'+
      '<button type="button" class="secondary small" id="sxCloudVerify">Verify code</button>'+
      '</div>'+
      '<div class="row wrap" style="gap:8px;margin-top:12px">'+
      '<button type="button" class="secondary small" id="sxCloudUpload">Back up training</button>'+
      '<button type="button" class="secondary small" id="sxCloudDownload">Download cloud copy</button>'+
      '<button type="button" class="secondary small" id="sxCloudLogout" hidden>Sign out</button>'+
      '</div>'+
      '<label class="tiny" style="display:flex;align-items:center;gap:8px;margin-top:14px">'+
      '<input type="checkbox" id="sxCloudAuto" style="width:18px;height:18px">Automatic backups while app is open</label>'+
      '<p id="sxCloudMessage" class="tiny" role="status" aria-live="polite" style="margin-top:10px"></p>';
    host.appendChild(ui);
    ui.querySelector('#sxCloudSend').addEventListener('click',sendCode);
    ui.querySelector('#sxCloudVerify').addEventListener('click',verifyCode);
    ui.querySelector('#sxCloudUpload').addEventListener('click',function(){ upload(true); });
    ui.querySelector('#sxCloudDownload').addEventListener('click',downloadCopy);
    ui.querySelector('#sxCloudLogout').addEventListener('click',function(){
      localStorage.removeItem(AUTH);
      localStorage.setItem(AUTO,'false');
      message('Signed out. Automatic backups are disabled.');
    });
    ui.querySelector('#sxCloudAuto').addEventListener('change',function(e){
      localStorage.setItem(AUTO,e.target.checked?'true':'false');
      if (e.target.checked) upload(false);
      else message('Automatic cloud backups disabled.');
    });
    render();
    setInterval(function(){
      if (configured && !busy && session() && localStorage.getItem(AUTO)==='true' &&
          document.visibilityState==='visible' && navigator.onLine!==false) upload(false);
    },60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
  window.SXCloudTraining = Object.freeze({trainingDatasets:trainingDatasets});
})();
