/* Native SpartanX 5/3/1 Cycle Planner — derived from the standalone planner; standalone remains as fallback. */
(function(){const host=document.getElementById('native531Host');if(!host)return;const shadow=host.attachShadow({mode:'open'});shadow.addEventListener('click',event=>{if(event.composedPath().some(el=>el&&el.id==='plannerBack')){event.preventDefault();event.stopPropagation();if(host.classList.contains('sx-531-cycle-quick-mode')){window.dispatchEvent(new Event('spartx:quickCycleCancel'));return;}document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id==='tools'));document.body.classList.add('tools-screen-active');document.querySelectorAll('#trackerNav [data-screen]').forEach(el=>el.classList.toggle('active',el.dataset.screen==='tools'));try{history.replaceState(null,'','#tools')}catch(_){}window.scrollTo(0,0);}},true);shadow.innerHTML="<style>\n:host{color-scheme:dark;--bg:#0b0d0f;--panel:#171a1e;--panel2:#22272d;--line:#30363e;--txt:#f3f4f6;--muted:#9ba3ad;--lime:#c8f169}\n*{box-sizing:border-box}[hidden]{display:none!important}:host{margin:0;background:var(--bg);color:var(--txt);font:15px -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;padding-bottom:35px}\nheader{display:none;position:sticky;top:0;z-index:5;background:#101114f2;backdrop-filter:blur(12px);padding:calc(15px + env(safe-area-inset-top)) 18px 14px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}\n.brand{font-size:22px;font-weight:950;letter-spacing:3px}.brand span{color:var(--lime)}.sub{font-size:10px;color:var(--muted);letter-spacing:1.7px;margin-top:3px}\nmain{padding-bottom:100px;max-width:760px;margin:auto;padding:18px 16px 35px}.page-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.page-top-copy{min-width:0;flex:1}.back-button{width:48px;min-width:48px;height:48px;padding:0!important;display:inline-flex;align-items:center;justify-content:center;gap:0;margin:0;background:var(--bg);color:var(--txt);border:1px solid var(--line);border-radius:11px;padding:8px 10px;font-size:12px;font-weight:800;text-decoration:none;white-space:nowrap}.eyebrow{font-size:11px;color:var(--lime);font-weight:850;letter-spacing:1.6px}\nh1{font-size:28px;margin:7px 0 5px;line-height:1.15}h2{font-size:18px;margin:0}h3{font-size:14px;margin:0}\n.intro{color:var(--muted);line-height:1.5;margin:0 0 18px;font-size:13px}\n.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin:13px 0}\n.card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}\n.fields{display:flex;gap:10px;margin:11px 0}.field{flex:1;min-width:0}\nlabel{display:block;color:var(--muted);font-size:12px;margin-bottom:6px}\ninput,select,button{font:inherit}input,select{width:100%;min-width:0;background:#0f1215;color:var(--txt);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:16px}\ninput:focus,select:focus{outline:1px solid var(--lime);border-color:var(--lime)}\nbutton{border:0;border-radius:10px;padding:12px 14px;background:var(--lime);color:#11150b;font-weight:850;cursor:pointer}\nbutton.secondary{background:var(--panel2);color:var(--txt);border:1px solid var(--line)}\nbutton.danger{background:#342022;color:#ffb8b8;border:1px solid #60383b}\nbutton.small{padding:8px 10px;font-size:12px}\n.segment{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;width:100%;min-width:0}.segment button{min-width:0;white-space:nowrap;font-size:12px;background:#101316;color:var(--muted);border:1px solid var(--line);padding:11px 3px}.segment button.active{background:var(--lime);color:#11150b;border-color:var(--lime)}\n.hint{font-size:11px;color:var(--muted);line-height:1.5}\n.preview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}\n.stat{background:#101316;border:1px solid #282f35;border-radius:11px;padding:11px;min-width:0}.stat span{display:block;font-size:10px;color:var(--muted)}.stat strong{display:block;font-size:18px;color:var(--lime);margin-top:5px;overflow-wrap:anywhere}\n.switch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-top:1px solid var(--line);margin-top:14px}\n.switch-row strong{font-size:13px;display:block}.switch-row small{font-size:11px;color:var(--muted);display:block;margin-top:3px}\n.switch{width:46px;height:26px;position:relative;flex:0 0 46px}.switch input{opacity:0;width:0;height:0}.switch span{position:absolute;inset:0;border-radius:20px;background:#454b53;cursor:pointer}.switch span:before{content:'';position:absolute;left:4px;top:4px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.18s}.switch input:checked+span{background:var(--lime)}.switch input:checked+span:before{transform:translateX(20px);background:#18200d}\n.primary{width:100%;margin-top:14px;padding:15px;font-size:14px;letter-spacing:.4px}\n.programme{display:none}.programme.visible{display:block}\n.cycle-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.cycle-name{font-weight:850;font-size:17px}.pill{font-size:10px;color:var(--lime);background:#29321c;border:1px solid #46552d;padding:5px 8px;border-radius:20px;white-space:nowrap}\n.cycle-meta{font-size:11px;color:var(--muted);margin-top:5px}\n.cycle-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:14px 0}\n.cycle-actions{display:flex;gap:8px;flex-wrap:wrap}.cycle-actions button{flex:1}\n.expand-btn{width:100%;background:#20262b;color:var(--txt);border:1px solid var(--line);margin-top:9px}\n.cycle-detail{display:none;margin-top:14px}.cycle-detail.open{display:block}\n.block-title{font-size:12px;font-weight:850;letter-spacing:1px;color:var(--lime);margin:18px 0 8px}\n.week-card{background:#101316;border:1px solid #2b3238;border-radius:12px;padding:12px;margin:8px 0}\n.week-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px}.week-head strong{font-size:13px}.week-head span{font-size:11px;color:var(--muted)}\n.set-line{display:flex;justify-content:space-between;gap:10px;padding:8px 2px;border-top:1px solid #252b30;font-size:12px}.set-line strong{color:var(--lime);font-size:13px;white-space:nowrap}\n.saved-item{padding:13px 0;border-bottom:1px solid var(--line)}.saved-item:last-child{border:0;padding-bottom:0}.saved-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.saved-head strong{font-size:14px}.saved-meta{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.5}.saved-actions{display:flex;gap:7px;margin-top:10px}.saved-actions button{flex:1}\n.edit-modal{position:fixed;inset:0;z-index:20;background:#000c;display:flex;align-items:center;justify-content:center;padding:16px;padding-top:calc(16px + env(safe-area-inset-top));padding-bottom:calc(16px + env(safe-area-inset-bottom))}.edit-dialog{width:100%;max-width:560px;max-height:100%;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:0 20px 70px #000b}.edit-dialog-head{display:flex;justify-content:space-between;align-items:center;padding:3px 3px 12px}.edit-dialog-head strong{font-size:14px;letter-spacing:.7px}.edit-dialog-head button{padding:7px 11px}.edit-dialog #setupCard{margin:0}.edit-dialog #setupCard .card-head{display:none}.edit-dialog #setupCard .hint{margin-top:12px}.edit-dialog #generate{margin-top:14px}.edit-modal{position:fixed;inset:0;z-index:30;background:#000c;display:flex;align-items:center;justify-content:center;padding:16px;padding-top:calc(16px + env(safe-area-inset-top));padding-bottom:calc(16px + env(safe-area-inset-bottom))}.edit-dialog{width:100%;max-width:560px;max-height:100%;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:0 20px 70px #000b}.edit-dialog-head{display:flex;justify-content:space-between;align-items:center;padding:3px 3px 12px}.edit-dialog-head strong{font-size:14px;letter-spacing:.7px}.edit-dialog #setupCard{margin:0}.edit-dialog #setupCard .card-head{display:none}.edit-dialog #setupCard .hint{margin-top:12px}.empty{color:var(--muted);font-size:13px;padding:8px 0}.status{min-height:16px;color:var(--lime);font-size:11px;margin-top:8px}\nfooter{text-align:center;color:#68717a;font-size:10px;letter-spacing:1.4px;padding:15px}\n@media(max-width:430px){main{padding-bottom:100px;padding:16px 13px 28px}.card{padding:14px}.fields{gap:8px}.cycle-stats{gap:5px}.stat{padding:9px}.stat strong{font-size:16px}}\n\\n/* Shared SpartanX appearance themes */\\n:host{--bg:#0b0d0f;--panel:#171a1e;--panel2:#22272d;--line:#30363e;--txt:#f3f4f6;--muted:#9ba3ad;--lime:#c8f169}\\n:host(.theme-red){--bg:#0a090a;--panel:#171315;--panel2:#251b1e;--line:#45272d;--txt:#f5f1f2;--muted:#b6a8ab;--lime:#ef3340}:host(.theme-gold){--bg:#0a090a;--panel:#171613;--panel2:#25231e;--line:#494232;--txt:#f5f1e9;--muted:#b8b09e;--lime:#b89b5e}:host(.theme-bronze){--bg:#0a0909;--panel:#171513;--panel2:#26211d;--line:#40352d;--txt:#f4eee8;--muted:#b6a99d;--lime:#a8794f}:host(.theme-blue){--bg:#090e15;--panel:#141b25;--panel2:#202c3b;--line:#34465b;--txt:#eef3f8;--muted:#aab8c8;--lime:#628bb8}:host(.theme-amethyst){--bg:#0b0911;--panel:#17121f;--panel2:#292037;--line:#4b385f;--txt:#f1eaf7;--muted:#b5a5c4;--lime:#b58ae9}:host(.theme-amethyst) .card{background:linear-gradient(225deg,rgba(114,56,169,.33),#251c30 48%,#17121f 82%);border-color:#59436d}:host(.theme-premium-monster){--bg:#050a06;--panel:#0d1610;--panel2:#17261b;--line:#467a36;--txt:#fff9ed;--muted:#c1bba9;--lime:#8cff12;}:host(.theme-premium-monster) .card,:host(.theme-premium-monster) .week-card{background:linear-gradient(145deg,#17261b,#0d1610 60%,#050a06);border-color:#467a36;box-shadow:0 0 13px #8cff1222}:host(.theme-premium-monster) button{background:#17261b!important;color:#fff9ed!important;border:1px solid #467a36!important}:host(.theme-premium-monster) input,:host(.theme-premium-monster) select{background:#17261b;color:#fff9ed;border-color:#467a36}:host(.theme-premium-monster) .eyebrow,:host(.theme-premium-monster) .result{color:#8cff12}:host(.theme-premium-olympus){--bg:#090c14;--panel:#111824;--panel2:#1a2534;--line:#a68043;--txt:#fff9ed;--muted:#c1bba9;--lime:#ffd376;}:host(.theme-premium-olympus) .card,:host(.theme-premium-olympus) .week-card{background:linear-gradient(145deg,#1a2534,#111824 60%,#090c14);border-color:#a68043;box-shadow:0 0 13px #ffd37622}:host(.theme-premium-olympus) button{background:#1a2534!important;color:#fff9ed!important;border:1px solid #a68043!important}:host(.theme-premium-olympus) input,:host(.theme-premium-olympus) select{background:#1a2534;color:#fff9ed;border-color:#a68043}:host(.theme-premium-olympus) .eyebrow,:host(.theme-premium-olympus) .result{color:#ffd376}:host(.theme-halloween){--bg:#120b14;--panel:#261326;--panel2:#3a2031;--line:#72435b;--txt:#f6f5ee;--muted:#c0b9b3;--lime:#ff872b;}\n:host(.theme-halloween) .card,:host(.theme-halloween) .week-card{background:linear-gradient(225deg,color-mix(in srgb,#ff872b 12%,#3a2031),#261326 55%,#120b14);border-color:#72435b}\n:host(.theme-halloween) button{background:#3a2031;border:1px solid #72435b;color:#f6f5ee}\n:host(.theme-halloween) .eyebrow,:host(.theme-halloween) .result{color:#ff872b}\n:host(.theme-christmas){--bg:#091b19;--panel:#142d29;--panel2:#22423c;--line:#4c8174;--txt:#f6f5ee;--muted:#c0b9b3;--lime:#e8c66b;}\n:host(.theme-christmas) .card,:host(.theme-christmas) .week-card{background:linear-gradient(225deg,color-mix(in srgb,#e8c66b 12%,#22423c),#142d29 55%,#091b19);border-color:#4c8174}\n:host(.theme-christmas) button{background:#22423c;border:1px solid #4c8174;color:#f6f5ee}\n:host(.theme-christmas) .eyebrow,:host(.theme-christmas) .result{color:#e8c66b}\n:host(.theme-monster){--bg:#090d09;--panel:#171e13;--panel2:#24311c;--line:#4b7134;--txt:#f6f5ee;--muted:#c0b9b3;--lime:#8fe51b;}\n:host(.theme-monster) .card,:host(.theme-monster) .week-card{background:linear-gradient(225deg,color-mix(in srgb,#8fe51b 12%,#24311c),#171e13 55%,#090d09);border-color:#4b7134}\n:host(.theme-monster) button{background:#24311c;border:1px solid #4b7134;color:#f6f5ee}\n:host(.theme-monster) .eyebrow,:host(.theme-monster) .result{color:#8fe51b}\n:host(.theme-olympian-female){--bg:#0d0912;--panel:#1a1422;--panel2:#292033;--line:#70577d;--txt:#f7edf6;--muted:#c2abc9;--lime:#e8b4dd}\n:host(.theme-olympian-female) .card,:host(.theme-olympian-female) .week-card{background:linear-gradient(225deg,#5a345b55,#292033 34%,#16121e 85%);border-color:#916995;box-shadow:0 0 12px #b875bb15,inset 0 1px 0 #e8b4dd18}\n:host(.theme-olympian-female) button{background:#292033;color:#f6e9f4;border:1px solid #916995}\n:host(.theme-olympian-female) input,:host(.theme-olympian-female) select{background:#211829;color:#f7edf6;border-color:#70577d}\n:host(.theme-olympian-female) .eyebrow,:host(.theme-olympian-female) .result{color:#e8b4dd}\n:host(.theme-olympian){--bg:#080808;--panel:#151414;--panel2:#242222;--line:#51483a;--txt:#f3eee5;--muted:#b8ad9b;--lime:#d8c49a}\\n:host(.theme-light){color-scheme:light;--bg:#f2f4f6;--panel:#ffffff;--panel2:#e9edf0;--line:#d5dbe0;--txt:#171b20;--muted:#68727c;--lime:#718f27}\\n:host(.theme-light){background:var(--bg);color:var(--txt)}:host(.theme-light) header{display:none;background:#f2f4f6f2}:host(.theme-light) input,:host(.theme-light) select{background:#fff;color:var(--txt)}:host(.theme-light) .segment button{background:#f4f6f7;color:var(--muted)}:host(.theme-light) .segment button.active{background:var(--lime);color:#fff}:host(.theme-light) .stat,:host(.theme-light) .week-card{background:#f7f8f9;border-color:var(--line)}:host(.theme-light) .set-line{border-color:var(--line)}:host(.theme-light) .expand-btn{background:var(--panel2);color:var(--txt)}:host(.theme-light) .pill{background:#edf2df;border-color:#d5e0b7;color:#526b1e}:host(.theme-light) .switch span{background:#b7bec5}:host(.theme-light) .edit-dialog{background:var(--bg)}:host(.theme-light) .home-cycle-menu{box-shadow:0 8px 24px #0002}\\n:host(.theme-red) header{display:none;background:#100d0ff2;border-color:#45272d}:host(.theme-gold) header{display:none;background:#100f0cf2;border-color:#494232}:host(.theme-bronze) header{display:none;background:#100e0cf2;border-color:#40352d}:host(.theme-blue) header{display:none;background:#101925f2;border-color:#34465b}:host(.theme-olympian) header{display:none;background:linear-gradient(100deg,#0e0d0cf7,#252019f7);border-color:rgba(210,184,133,.34);box-shadow:0 0 16px rgba(190,158,99,.08)}:host(.theme-olympian) .card,:host(.theme-olympian) .week-card{background:linear-gradient(140deg,rgba(177,145,91,.13),rgba(75,67,56,.48) 22%,#24211e 52%,#151414 100%);border-color:rgba(203,174,125,.36);box-shadow:0 0 13px rgba(190,158,99,.075),inset 0 1px 0 rgba(255,239,208,.045)}:host(.theme-olympian) header .brand span,:host(.theme-olympian) .eyebrow{color:#ead7ae!important}:host(.theme-gold) header .brand span,:host(.theme-gold) .eyebrow{color:#d6bb7b!important}:host(.theme-bronze) header .brand span,:host(.theme-bronze) .eyebrow{color:#c09163!important}:host(.theme-bronze) .sub{color:#b6a99d}:host(.theme-blue) header .brand span,:host(.theme-blue) .eyebrow{color:#8fb4dc!important}:host(.theme-blue) .sub{color:#aab8c8}:host(.theme-gold) .sub{color:#b8b09e}:host(.theme-red) header .brand span,:host(.theme-red) .eyebrow{color:#ff3943!important}:host(.theme-red) .sub{color:#b6a8ab}\n:host(.theme-bronze) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:none!important}:host(.theme-bronze) button:active{background:rgba(52,52,56,.82)!important}:host(.theme-bronze) .back-button{background:rgba(39,40,43,.62);color:#e8e6e7;border-color:rgba(145,139,143,.22)}:host(.theme-bronze) .segment button.active{background:rgba(91,62,42,.36)!important;color:#d0a27a!important;border-color:rgba(168,121,79,.42)!important}:host(.theme-bronze) .switch input:checked+span{background:#a8794f}:host(.theme-bronze) .status,:host(.theme-bronze) .eyebrow,:host(.theme-bronze) .block-title{color:#c09163}:host(.theme-bronze) .pill{background:#30251d;border-color:#5e4431;color:#d0a27a}:host(.theme-bronze) .stat,:host(.theme-bronze) .week-card{background:rgba(22,20,18,.78);border-color:#4a3a2e}:host(.theme-bronze) .set-line{border-color:#4a3a2e}:host(.theme-bronze) .expand-btn{background:rgba(37,36,39,.7);border-color:#4a3a2e;color:var(--txt)}:host(.theme-bronze) input,:host(.theme-bronze) select{background:rgba(29,27,25,.72);border-color:#4a3a2e}:host(.theme-bronze) .cycle-detail{color:var(--txt)}\\n:host(.theme-blue) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:none!important}:host(.theme-blue) button:active{background:rgba(52,52,56,.82)!important}:host(.theme-blue) .back-button{background:rgba(39,40,43,.62);color:#e8e6e7;border-color:rgba(145,139,143,.22)}:host(.theme-blue) .segment button.active{background:rgba(55,91,132,.36)!important;color:#a9c7e6!important;border-color:rgba(98,139,184,.42)!important}:host(.theme-blue) .switch input:checked+span{background:#628bb8}:host(.theme-blue) .status,:host(.theme-blue) .eyebrow,:host(.theme-blue) .block-title{color:#8fb4dc}:host(.theme-blue) .pill{background:#1d2c3e;border-color:#3a506a;color:#a9c7e6}:host(.theme-blue) .stat,:host(.theme-blue) .week-card{background:rgba(20,27,37,.78);border-color:#3a506a}:host(.theme-blue) .set-line{border-color:#3a506a}:host(.theme-blue) .expand-btn{background:rgba(37,36,39,.7);border-color:#3a506a;color:var(--txt)}:host(.theme-blue) input,:host(.theme-blue) select{background:rgba(20,27,37,.72);border-color:#3a506a}:host(.theme-blue) .cycle-detail{color:var(--txt)}\\n:host(.theme-gold) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:none!important}\n:host(.theme-gold) button:active{background:rgba(52,52,56,.82)!important}\n:host(.theme-gold) .back-button{background:rgba(39,40,43,.62);color:#e8e6e7;border-color:rgba(145,139,143,.22)}\n:host(.theme-gold) .segment button.active{background:rgba(91,75,43,.36)!important;color:#e0c98f!important;border-color:rgba(184,155,94,.42)!important}\n:host(.theme-gold) .switch input:checked+span{background:#b89b5e}\n:host(.theme-gold) .status,:host(.theme-gold) .eyebrow,:host(.theme-gold) .block-title{color:#d6bb7b}\n:host(.theme-gold) .pill{background:#30291d;border-color:#675638;color:#dfc58a}:host(.theme-gold) .card{background:linear-gradient(225deg,rgba(116,91,42,.22) 0%,rgba(65,65,69,.88) 24%,#242326 48%,#171719 82%);border-color:#4b4434}:host(.theme-bronze) .card{background:linear-gradient(225deg,rgba(105,69,42,.20) 0%,rgba(65,62,59,.88) 24%,#27221f 48%,#171513 82%);border-color:#4a3a2e}:host(.theme-blue) .card{background:linear-gradient(225deg,rgba(55,91,132,.20) 0%,rgba(58,68,82,.88) 24%,#202a38 48%,#141b25 82%);border-color:#3a506a}:host(.theme-gold) .stat,:host(.theme-gold) .week-card{background:rgba(22,22,24,.78);border-color:#4b4434}:host(.theme-gold) .set-line{border-color:#4b4434}:host(.theme-gold) .expand-btn{background:rgba(37,36,39,.7);border-color:#4b4434;color:var(--txt)}:host(.theme-gold) input,:host(.theme-gold) select{background:rgba(29,29,32,.72);border-color:#4b4434}:host(.theme-gold) .cycle-detail{color:var(--txt)}\n:host(.theme-red) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:none!important}\n:host(.theme-red) button:active{background:rgba(52,52,56,.82)!important}\n:host(.theme-red) .back-button{background:rgba(39,40,43,.62);color:#e8e6e7;border-color:rgba(145,139,143,.22)}\n:host(.theme-red) .segment button.active{background:rgba(92,24,30,.48)!important;color:#ff626b!important;border-color:rgba(239,32,41,.42)!important}\n:host(.theme-red) .switch input:checked+span{background:#ef2029}\n:host(.theme-red) .status,:host(.theme-red) .eyebrow,:host(.theme-red) .block-title{color:#ff3943}\n:host(.theme-red) .pill{background:#35191e;border-color:#71303a;color:#ff7a85}:host(.theme-red) .card{background:linear-gradient(225deg,rgba(125,20,29,.42) 0%,rgba(65,65,69,.88) 24%,#242326 48%,#171719 82%);border-color:#514044}:host(.theme-red) .stat,:host(.theme-red) .week-card{background:rgba(22,22,24,.78);border-color:#514044}:host(.theme-red) .set-line{border-color:#514044}:host(.theme-red) .expand-btn{background:rgba(37,36,39,.7);border-color:#514044;color:var(--txt)}:host(.theme-red) input,:host(.theme-red) select{background:rgba(29,29,32,.72);border-color:#514044}:host(.theme-red) .cycle-detail{color:var(--txt)}:host(.theme-red) .switch input:checked+span{background:#ef3340}\\n:host(.theme-red) button#plannerBack,:host(.theme-gold) button#plannerBack,:host(.theme-bronze) button#plannerBack,:host(.theme-blue) button#plannerBack,:host(.theme-amethyst) button#plannerBack,:host(.theme-olympian) button#plannerBack,:host(.theme-light) button#plannerBack,:host button#plannerBack{color:var(--lime)!important;-webkit-text-fill-color:var(--lime)!important;border:1px solid var(--lime)!important;background:var(--panel2)!important;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--lime) 12%,transparent)!important}:host #plannerBack{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-height:38px!important;padding:9px 13px!important;border:1px solid var(--lime)!important;border-radius:11px!important;background:var(--panel2)!important;color:var(--lime)!important;font-size:12px!important;font-weight:800!important;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--lime) 12%,transparent)!important}:host(.theme-amazonian){--bg:#0e0b10;--panel:#1d141d;--panel2:#341b2a;--line:#79435a;--lime:#c84b76;--txt:#f4e7ed;--muted:#baa1ae}:host(.theme-amazonian) .card{background:linear-gradient(225deg,color-mix(in srgb,var(--lime) 15%,var(--panel)),var(--panel) 55%,var(--bg));border-color:var(--line)}:host(.theme-amazonian) button{background:var(--panel2)!important;color:var(--txt)!important;border-color:var(--line)!important}:host(.theme-amazonian) #plannerBack{color:var(--lime)!important;border-color:var(--lime)!important}:host(.theme-amazonian) .eyebrow{color:var(--lime)}:host(.theme-aegis){--bg:#0c0b13;--panel:#191625;--panel2:#29233c;--line:#65527f;--lime:#c5a0f1;--txt:#f2ebfa;--muted:#b8a9cb}:host(.theme-aegis) .card{background:linear-gradient(225deg,color-mix(in srgb,var(--lime) 15%,var(--panel)),var(--panel) 55%,var(--bg));border-color:var(--line)}:host(.theme-aegis) button{background:var(--panel2)!important;color:var(--txt)!important;border-color:var(--line)!important}:host(.theme-aegis) #plannerBack{color:var(--lime)!important;border-color:var(--lime)!important}:host(.theme-aegis) .eyebrow{color:var(--lime)}</style><main>\n<div class=\"page-top\"><div class=\"page-top-copy\"><div class=\"eyebrow\">PLAN WITH PURPOSE</div><h1>5/3/1 Cycle Planner</h1></div><button type=\"button\" class=\"back-button sx-page-back\" id=\"plannerBack\" aria-label=\"Back to Training Tools\"><span class=\"sx-page-back-arrow\" aria-hidden=\"true\">←</span></button></div>\n<p class=\"intro\">Build a progressive 4, 8 or 12-week block from your Training Max. Save it to revisit your working weights whenever you need them.</p>\n\n<div id=\"setupPlaceholder\"></div>\n<section class=\"card\" id=\"setupCard\">\n<div class=\"card-head\"><h2>Build your cycle</h2><span class=\"pill\">SETUP</span></div>\n<div class=\"fields\">\n<div class=\"field\"><label for=\"lift\">Main lift</label><select id=\"lift\"><option>Bench Press</option><option>Back Squat</option><option>Deadlift</option><option>Overhead Press</option></select></div>\n<div class=\"field\"><label for=\"oneRm\">1RM (kg)</label><input id=\"oneRm\" type=\"number\" min=\"0\" step=\"0.5\" placeholder=\"e.g. 160\" inputmode=\"decimal\"></div>\n</div>\n<div class=\"fields\"><div class=\"field\"><label for=\"tm\">Starting Training Max (kg)</label><input id=\"tm\" type=\"number\" min=\"2.5\" step=\"2.5\" value=\"140\" inputmode=\"decimal\"></div>\n<div class=\"field\"><label for=\"increase\">TM increase each 4-week cycle (kg)</label><input id=\"increase\" type=\"number\" min=\"0\" step=\"2.5\" value=\"2.5\" inputmode=\"decimal\"></div></div>\n<div class=\"field\" style=\"margin:12px 0\"><label>Cycle length</label><div class=\"segment\" id=\"lengthChoices\"><button type=\"button\" data-weeks=\"4\" class=\"active\">4 weeks</button><button type=\"button\" data-weeks=\"8\">8 weeks</button><button type=\"button\" data-weeks=\"12\">12 weeks</button></div></div>\n<div class=\"switch-row\"><div><strong>Boring But Big (BBB)</strong><small>Add 5 × 10 assistance after the main work. Skipped during deloads.</small></div><label class=\"switch\"><input id=\"bbb\" type=\"checkbox\"><span></span></label></div>\n<div class=\"fields\" id=\"bbbOptions\" hidden><div class=\"field\"><label for=\"bbbPct\">BBB percentage of TM</label><select id=\"bbbPct\"><option value=\"50\">50%</option><option value=\"60\" selected>60%</option><option value=\"70\">70%</option></select></div><div class=\"field\"><label>BBB volume</label><input value=\"5 sets × 10 reps\" disabled></div></div>\n<div class=\"hint\">Main work uses standard 5/3/1 percentages. Every new four-week cycle adds your chosen TM increase. All weights round to the nearest 2.5 kg.</div>\n<button type=\"button\" class=\"primary\" id=\"generate\">GENERATE CYCLE</button>\n</section>\n\n<section class=\"card programme\" id=\"programmeCard\">\n<div class=\"card-head\"><h2>Your programme</h2><span class=\"pill\" id=\"programmeStatus\">GENERATED</span></div>\n<div class=\"cycle-top\"><div><div class=\"cycle-name\" id=\"programmeName\">Bench Press</div><div class=\"cycle-meta\" id=\"programmeMeta\"></div></div><div class=\"pill\" id=\"programmeLength\">4 WEEKS</div></div>\n<div class=\"cycle-stats\"><div class=\"stat\"><span>Starting TM</span><strong id=\"startTM\">—</strong></div><div class=\"stat\"><span>Final cycle TM</span><strong id=\"finalTM\">—</strong></div><div class=\"stat\"><span>Four-week blocks</span><strong id=\"blockCount\">—</strong></div></div>\n<div class=\"cycle-actions\"><button type=\"button\" id=\"saveCycle\">SAVE CYCLE</button></div>\n<button type=\"button\" class=\"expand-btn\" id=\"expandCycle\">VIEW ENTIRE CYCLE ↓</button>\n<div class=\"cycle-detail\" id=\"cycleDetail\"></div>\n<div class=\"status\" id=\"saveStatus\" aria-live=\"polite\"></div>\n</section>\n\n<section class=\"card\" id=\"savedCard\">\n<div class=\"card-head\"><h2>Saved cycles</h2><span class=\"pill\" id=\"savedCount\">0 SAVED</span></div>\n<div id=\"savedList\" class=\"empty\">Your saved programmes will appear here.</div>\n</section>\n</main>";

// Reuse the native cycle editor for saved programme changes. Previously these
// missing controls interrupted initialization before the save-complete handler.
const editOverlay=document.createElement('div');
editOverlay.id='editModal';editOverlay.className='edit-modal';editOverlay.hidden=true;
editOverlay.innerHTML='<div class="edit-dialog" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">'+
 '<div class="edit-dialog-head"><strong id="editModalTitle">Edit saved cycle</strong><button type="button" id="closeEdit" class="secondary small" aria-label="Close cycle editor">✕</button></div>'+
 '<div id="editModalBody"></div>'+
 '<button id="cancelEdit" type="button" class="secondary" style="width:100%;margin-top:12px">DISCARD CHANGES</button>'+
 '</div>';
shadow.appendChild(editOverlay);

(()=>{
const obsidianPlannerStyle=document.createElement('style');obsidianPlannerStyle.textContent=":host(.theme-obsidian-white){--bg:#030303;--panel:#0b0b0b;--panel2:#171717;--line:#333333;--txt:#f0f0f0;--muted:#999999;--lime:#dfdfdf;color-scheme:dark}\n:host(.theme-obsidian-white) .card,:host(.theme-obsidian-white) .week-card{background:linear-gradient(225deg,#191919,#101010 40%,#060606)!important;border:1px solid #343434!important;box-shadow:inset 0 1px 0 #ffffff0b,0 4px 17px #0006}\n:host(.theme-obsidian-white) button:not(.danger){background:#1b1b1b!important;border:1px solid #474747!important;color:#f0f0f0!important}\n:host(.theme-obsidian-white) input,:host(.theme-obsidian-white) select{background:#111!important;color:#f0f0f0!important;border:1px solid #3a3a3a!important}\n:host(.theme-obsidian-white) .eyebrow,:host(.theme-obsidian-white) .result{color:#ececec!important}\n";shadow.append(obsidianPlannerStyle);


const $=id=>shadow.getElementById(id);
const quickStyle=document.createElement('style');
quickStyle.id='sx-531-cycle-quick-style';
quickStyle.textContent=`
 :host(.sx-531-cycle-quick-mode){display:block;background:transparent!important;padding-bottom:8px!important}
 :host(.sx-531-cycle-quick-mode) header,
 :host(.sx-531-cycle-quick-mode) .page-top,
 :host(.sx-531-cycle-quick-mode) .intro,
 :host(.sx-531-cycle-quick-mode) #savedCard{display:none!important}
 :host(.sx-531-cycle-quick-mode) main{max-width:none!important;margin:0!important;padding:0 3px 8px!important}
 :host(.sx-531-cycle-quick-mode) #setupCard{margin:0 0 12px!important;padding:13px 10px!important;background:transparent!important;border:0!important;box-shadow:none!important}
 :host(.sx-531-cycle-quick-mode) #programmeCard{margin:12px 0!important}
 :host(.sx-531-cycle-quick-mode) #programmeCard.visible{display:block!important}
`;
shadow.append(quickStyle);
const manageModalStyle=document.createElement('style');
manageModalStyle.textContent=`
:host(.sx-531-manage-inline) main{display:none!important}
:host(.sx-531-manage-inline) #editModal:not([hidden]){position:static!important;inset:auto!important;
 display:block!important;background:transparent!important;min-height:0!important;
 height:auto!important;margin:0!important;padding:0!important;z-index:auto!important}
:host(.sx-531-manage-inline) #editModal[hidden]{display:none!important}
:host(.sx-531-manage-inline) #editModal .edit-dialog{width:100%!important;max-width:none!important;
 max-height:none!important;overflow:visible!important;background:transparent!important;
 box-shadow:none!important;border:0!important;padding:4px!important}
:host(.sx-531-manage-inline) #editModal .edit-dialog-head{display:none!important}
:host(.sx-531-manage-inline) #editModal #cancelEdit,:host(.sx-531-manage-inline) #editModal #generate{display:none!important}
`;
shadow.appendChild(manageModalStyle);
const sxNavPlannerStyle=document.createElement('link');sxNavPlannerStyle.rel='stylesheet';sxNavPlannerStyle.href='./assets/ui/page-navigation.css?v=318';shadow.appendChild(sxNavPlannerStyle);


// Cosmic Nebula must theme this native planner inside its shadow root.
const cosmicPlannerStyle=document.createElement('style');
cosmicPlannerStyle.id='sx-cosmic-531-native';
cosmicPlannerStyle.textContent=`
:host(.theme-cosmic){
 --bg:#070919;--panel:#12162c;--panel2:#202644;--line:#6367a0;
 --txt:#f2f5ff;--muted:#afb9d8;--lime:#8bdcff;color-scheme:dark;
 background:transparent!important;color:var(--txt)!important
}
:host(.theme-cosmic) :is(.card,.programme,.week-card,.stat,.edit-dialog,.saved-item){
 background:radial-gradient(ellipse at 100% 0%,#7952ce3d,transparent 50%),linear-gradient(150deg,#252044,#151c38 55%,#0a1026)!important;
 color:var(--txt)!important;border-color:#7a81b7!important;
 box-shadow:inset 0 1px 0 #e0d8ff15,0 0 15px #856bc52c!important
}
:host(.theme-cosmic) .edit-modal{background:#04051be0!important}
:host(.theme-cosmic) :is(.edit-dialog,.edit-dialog-head){border-color:#8581c1!important}
:host(.theme-cosmic) :is(button:not(.danger),.back-button,.segment button,.expand-btn){
 background:linear-gradient(155deg,#323652,#171e38)!important;
 color:#f1f5ff!important;border:1px solid #7984b2!important;
 box-shadow:inset 0 1px 0 #e3dbff13,0 0 9px #8069d51b!important
}
:host(.theme-cosmic) :is(button.primary,.segment button.active){
 background:linear-gradient(140deg,#244466,#243557)!important;
 color:#e1f7ff!important;border-color:#a1dfff!important;
 box-shadow:0 0 12px #8bdcff3b!important
}
:host(.theme-cosmic) button.danger{
 background:linear-gradient(140deg,#593246,#302039)!important;
 color:#ffd6e1!important;border:1px solid #af6b91!important
}
:host(.theme-cosmic) :is(input,select,textarea){
 background:#121a36!important;color:#f5f6ff!important;border:1px solid #7480b1!important
}
:host(.theme-cosmic) :is(input:focus-visible,select:focus-visible,button:focus-visible){
 outline:2px solid #8bdcff!important;outline-offset:2px
}
:host(.theme-cosmic) input[type=checkbox]{accent-color:#8bdcff!important}
:host(.theme-cosmic) :is(.eyebrow,.block-title,.status,.result,.stat strong,.pill){color:#9edfff!important}
:host(.theme-cosmic) :is(.pill,.stat,.week-card,.segment){border-color:#7180b0!important}
:host(.theme-cosmic) footer{color:#aebad9!important}
`;
shadow.append(cosmicPlannerStyle);
const sxPlannerBackStyle=document.createElement('style');sxPlannerBackStyle.textContent=':host #plannerBack.sx-page-back{width:48px!important;min-width:48px!important;max-width:48px!important;height:48px!important;min-height:48px!important;max-height:48px!important;padding:0!important;background:linear-gradient(180deg,#272727,#141414)!important;border:1px solid #414141!important;border-radius:13px!important;color:#fafafa!important;-webkit-text-fill-color:#fafafa!important;box-shadow:inset 0 1px 0 #ffffff12!important;font-size:0!important} :host #plannerBack .sx-page-back-arrow{font-size:23px!important} :host main{padding-top:0!important;padding-bottom:calc(42px + env(safe-area-inset-bottom,0px))!important}';shadow.appendChild(sxPlannerBackStyle);
const PREF_KEY='spartx_preferences_v1';function applySavedTheme(){let theme='dark';try{const saved=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');theme=document.body.dataset.activeTheme||saved.theme||theme;}catch(e){theme=document.body.dataset.activeTheme||theme;}host.classList.remove('theme-red','theme-light','theme-gold','theme-bronze','theme-blue','theme-amethyst','theme-olympian','theme-amazonian','theme-aegis','theme-crimson-forge');host.classList.toggle(theme==='crimson-forge');host.classList.toggle('theme-red',theme==='spartan-red');host.classList.toggle('theme-gold',theme==='spartan-gold');host.classList.toggle('theme-bronze',theme==='spartan-bronze');host.classList.toggle('theme-blue',theme==='spartan-blue');host.classList.toggle('theme-amethyst',theme==='spartan-amethyst');host.classList.toggle('theme-amazonian',theme==='amazonian-crimson');host.classList.toggle('theme-aegis',theme==='athenas-aegis');host.classList.toggle('theme-olympian',theme==='spartan-olympian');host.classList.toggle('theme-olympian-female',theme==='olympian-athena');host.classList.toggle('theme-monster',theme==='sx-monster');host.classList.toggle('theme-obsidian-white',theme==='sx-obsidian-white');host.classList.toggle('theme-premium-olympus',theme==='premium-olympus');host.classList.toggle('theme-light',theme==='light');host.classList.toggle('theme-cosmic',theme==='cosmic-nebula');host.style.colorScheme=theme==='light'?'light':'dark';for(const name of ['--bg','--panel','--panel2','--line','--txt','--muted','--lime']){const v=getComputedStyle(document.body).getPropertyValue(name).trim();if(v)host.style.setProperty(name,v)}const meta=null;if(meta)meta.content=theme==='light'?'#f2f4f6':theme==='spartan-red'?'#100d0f':theme==='spartan-olympian'?'#11100f':'#101114';}function syncPlannerBackAccent(){const button=shadow.getElementById('plannerBack');if(!button)return;for(const key of ['color','-webkit-text-fill-color','border-color','background-color'])button.style.removeProperty(key);}applySavedTheme();syncPlannerBackAccent();new MutationObserver(()=>{applySavedTheme();syncPlannerBackAccent()}).observe(document.body,{attributes:true,attributeFilter:['data-active-theme']});window.addEventListener('pageshow',()=>{applySavedTheme();syncPlannerBackAccent();});window.addEventListener('storage',e=>{if(e.key===PREF_KEY){applySavedTheme();syncPlannerBackAccent();}});window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='spartx:applyTheme'){const theme=e.data.theme||'dark';host.classList.remove('theme-red','theme-light','theme-gold','theme-bronze','theme-blue','theme-olympian');host.classList.toggle('theme-red',theme==='spartan-red');host.classList.toggle('theme-gold',theme==='spartan-gold');host.classList.toggle('theme-bronze',theme==='spartan-bronze');host.classList.toggle('theme-blue',theme==='spartan-blue');host.classList.toggle('theme-olympian',theme==='spartan-olympian');host.classList.toggle('theme-olympian-female',theme==='olympian-athena');host.classList.toggle('theme-monster',theme==='sx-monster');host.classList.toggle('theme-obsidian-white',theme==='sx-obsidian-white');host.classList.toggle('theme-premium-olympus',theme==='premium-olympus');host.classList.toggle('theme-light',theme==='light');host.classList.toggle('theme-cosmic',theme==='cosmic-nebula');host.style.colorScheme=theme==='light'?'light':'dark';syncPlannerBackAccent();}});const STORAGE_KEY='spartanx_531_saved_cycles_v1';
const DRAFT_KEY='spartanx_531_cycle_draft_v1';
let weeks=4,generated=null,expanded=false,editingId=null;
const fmt=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:1});
const round=n=>Math.round(n/2.5)*2.5;
const schemes=[
 {name:'Week 1 · 5s',p:[.65,.75,.85],r:['5','5','5+']},
 {name:'Week 2 · 3s',p:[.70,.80,.90],r:['3','3','3+']},
 {name:'Week 3 · 5/3/1',p:[.75,.85,.95],r:['5','3','1+']},
 {name:'Week 4 · Deload',p:[.45,.55,.65],r:['5','5','5']}
];
function getDraft(){return {lift:$('lift').value,oneRm:$('oneRm').value,tm:$('tm').value,increase:$('increase').value,weeks,bbb:$('bbb').checked,bbbPct:$('bbbPct').value};}
function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(getDraft()));}catch(e){}}
function restoreDraft(){try{const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');if(!d)return;if(d.lift)$('lift').value=d.lift;if(d.oneRm)$('oneRm').value=d.oneRm;if(d.tm)$('tm').value=d.tm;if(d.increase!==undefined)$('increase').value=d.increase;if(d.weeks)weeks=[4,8,12].includes(+d.weeks)?+d.weeks:4;$('bbb').checked=!!d.bbb;if(d.bbbPct)$('bbbPct').value=d.bbbPct;}catch(e){}}
const CALCULATOR_KEY='spartxToolsInputs';
const calculatorLift=lift=>lift==='Deadlift'?'Conventional Deadlift':lift;
function calculatorOneRm(lift){
 try{const data=JSON.parse(localStorage.getItem(CALCULATOR_KEY)||'{}');
  const rm=Number(data.oneRmsByLiftKg?.[calculatorLift(lift)]);return rm>0&&Number.isFinite(rm)?rm:null;}catch(e){return null;}
}
function updatePlannerOneRm(value,lift=$('lift').value){
 const rm=Number(value);if(!(rm>0)||!Number.isFinite(rm))return;
 try{
  const data=JSON.parse(localStorage.getItem(CALCULATOR_KEY)||'{}');
  if(!data||typeof data!=='object')return;
  data.oneRmsByLiftKg={...(data.oneRmsByLiftKg||{}),[calculatorLift(lift)]:rm};
  localStorage.setItem(CALCULATOR_KEY,JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('spartx:531OneRmUpdated',{detail:{lift:calculatorLift(lift),oneRm:rm}}));
 }catch(e){}
}
function selectPlannerLift(){
 const rm=calculatorOneRm($('lift').value);
 $('oneRm').value=rm?String(rm):'';
 if(rm)$('tm').value=String(round(rm*.9));
 else $('tm').value='';
 saveDraft();
}
function recalcPlannerTM(){
 const rm=Number($('oneRm').value);
 if(Number.isFinite(rm)&&rm>0){
  $('tm').value=String(round(rm*.9));
  updatePlannerOneRm(rm);
 }else if(!$('oneRm').value.trim())$('tm').value='';
 saveDraft();
}
// Called only by the Active Session's 5/3/1 Create Cycle shortcut.
// The same real native planner is moved into a scroll-locked modal.
window.spartanxPrefill531Cycle=detail=>{
 if(!detail)return false;
 if(editingId!==null)closeEditForm();
 const lift=detail.lift==='Conventional Deadlift'?'Deadlift':detail.lift;
 if(['Bench Press','Back Squat','Deadlift','Overhead Press'].includes(lift))$('lift').value=lift;
 const rm=Number(detail.oneRm)||calculatorOneRm($('lift').value)||0;
 $('oneRm').value=rm>0?String(rm):'';
 const requestedTM=Number(detail.tm);
 $('tm').value=requestedTM>0?String(round(requestedTM)):(rm>0?String(round(rm*.9)):'');
 if(rm>0)updatePlannerOneRm(rm);
 $('programmeCard').classList.remove('visible');
 generated=null;
 saveDraft();
 return true;
};
function setLength(){shadow.querySelectorAll('#lengthChoices button').forEach(b=>b.classList.toggle('active',+b.dataset.weeks===weeks));}
function buildCycle(config){
 const blocks=config.weeks/4,cycles=[];
 for(let block=0;block<blocks;block++){
  const tm=round(+config.tm+block*(+config.increase));
  const cycleWeeks=[];
  schemes.forEach((scheme,i)=>{
   const sets=scheme.p.map((p,j)=>({pct:p,rep:scheme.r[j],weight:round(tm*p)}));
   const bbb=!!config.bbb&&i!==3?{pct:+config.bbbPct,sets:5,reps:10,weight:round(tm*(+config.bbbPct/100))}:null;
   cycleWeeks.push({number:block*4+i+1,name:scheme.name,tm,sets,bbb});
  });
  cycles.push({number:block+1,tm,weeks:cycleWeeks});
 }
 return {id:null,name:config.lift+' · '+config.weeks+' weeks',lift:config.lift,created:new Date().toISOString(),startTM:+config.tm,increase:+config.increase,weeks:config.weeks,bbb:config.bbb,bbbPct:+config.bbbPct,cycles};
}
function renderProgramme(data,isSaved=false){
 generated=data;$('programmeCard').classList.add('visible');$('programmeName').textContent=data.name;$('programmeMeta').textContent='TM +'+fmt(data.increase)+' kg every four weeks · '+(data.bbb?'BBB '+data.bbbPct+'%':'Standard 5/3/1');$('programmeLength').textContent=data.weeks+' WEEKS';$('startTM').textContent=fmt(data.startTM)+' kg';$('finalTM').textContent=fmt(data.cycles[data.cycles.length-1].tm)+' kg';$('blockCount').textContent=data.cycles.length;$('programmeStatus').textContent=isSaved?'SAVED CYCLE':'GENERATED';$('saveStatus').textContent=isSaved?'Loaded from saved cycles.':'';expanded=false;$('cycleDetail').classList.remove('open');$('expandCycle').textContent='VIEW ENTIRE CYCLE ↓';$('saveCycle').textContent=isSaved?'SAVE AS NEW CYCLE':'SAVE CYCLE';renderDetails(data);$('programmeCard').scrollIntoView({behavior:'smooth',block:'start'});}
function cycleDetailsHtml(data){
 let html='';
 data.cycles.forEach(c=>{
  html+='<div class="block-title">BLOCK '+c.number+' · TRAINING MAX '+fmt(c.tm)+' KG</div>';
  c.weeks.forEach(w=>{
   const weekDone=(data.completedWeeks||[]).includes(+w.number);
   html+='<div class="week-card" style="'+(weekDone?'opacity:.58':'')+'"><div class="week-head"><strong>'+w.name+'</strong><span>Week '+w.number+' · '+(weekDone?'✓ COMPLETED · ':'')+'TM '+fmt(w.tm)+' kg</span></div>';
   w.sets.forEach((s,i)=>{html+='<div class="set-line"><span>Set '+(i+1)+' · '+Math.round(s.pct*100)+'% · '+s.rep+' reps</span><strong>'+fmt(s.weight)+' kg</strong></div>';});
   if(w.bbb)html+='<div class="set-line"><span>BBB · '+w.bbb.pct+'% · 5 × 10</span><strong>'+fmt(w.bbb.weight)+' kg</strong></div>';
   else if(data.bbb&&w.name.includes('Deload'))html+='<div class="hint" style="padding-top:8px">BBB omitted during deload.</div>';
   html+='</div>';
  });
 });
 return html;
}
function renderDetails(data){$('cycleDetail').innerHTML=cycleDetailsHtml(data);}
function readSaved(){try{const d=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(d)?d:[];}catch(e){return[];}}
function creationBlocked(){return window.spartanxHasActive531Cycle?.()===true}
const creationNote=document.createElement('p');
creationNote.className='hint';
creationNote.textContent='A 5/3/1 cycle is already active. Open Saved Cycles to view or edit it.';
creationNote.hidden=true;
$('generate').after(creationNote);
const cycleGuardStyle=document.createElement('style');
cycleGuardStyle.textContent='#generate[hidden],#saveCycle[hidden],.sx531-cycle-create-note[hidden]{display:none!important}';
shadow.appendChild(cycleGuardStyle);
function sync531CreationControls(){
 const blocked=creationBlocked(),editing=!$('editModal').hidden;
 $('generate').hidden=blocked&&!editing;
 $('saveCycle').hidden=blocked;
 creationNote.hidden=!blocked||editing;
}
window.spartanxSync531CreationAvailability=sync531CreationControls;
function writeSaved(items){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));return true;}catch(e){$('saveStatus').textContent='Could not save. Check device storage settings.';return false;}}
function renderSaved(){
 sync531CreationControls();
 const items=readSaved();$('savedCount').textContent=items.length+' SAVED';
 if(!items.length){$('savedList').className='empty';$('savedList').textContent='Your saved programmes will appear here.';return;}
 $('savedList').className='';
 $('savedList').innerHTML=items.map(item=>'<div class="saved-item"><div class="saved-head"><div><strong>'+escapeHtml(item.name)+'</strong><div class="saved-meta">'+item.weeks+' weeks · Starting TM '+fmt(item.startTM)+' kg · '+(item.bbb?'BBB '+item.bbbPct+'%':'Standard 5/3/1')+'<br>Saved '+new Date(item.created).toLocaleDateString()+'</div></div></div><div class="saved-actions"><button type="button" class="small" data-load="'+item.id+'">OPEN</button><button type="button" class="small secondary" data-edit="'+item.id+'">EDIT</button><button type="button" class="small danger" data-delete="'+item.id+'">DELETE</button></div><div class="cycle-detail saved-cycle-detail" data-detail="'+item.id+'"></div></div>').join('');
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('lengthChoices').addEventListener('click',e=>{const b=e.target.closest('button[data-weeks]');if(!b)return;weeks=+b.dataset.weeks;setLength();saveDraft();});
function syncBbbOptions(){$('bbbOptions').hidden=!$('bbb').checked;}
function openEditForm(){ $('editModalBody').appendChild($('setupCard')); $('setupCard').hidden=false; $('generate').textContent='SAVE CHANGES'; $('editModal').hidden=false; sync531CreationControls(); host.style.overflow='hidden'; $('tm').focus(); }
function closeEditForm(){ const returnToWorkout=host.classList.contains('sx-531-manage-inline'); $('setupPlaceholder').after($('setupCard')); $('setupCard').hidden=false; $('editModal').hidden=true; host.style.overflow=''; editingId=null; $('generate').textContent='GENERATE CYCLE'; sync531CreationControls(); if(returnToWorkout)window.dispatchEvent(new Event('spartx:quickCycleCancel')); }
$('bbb').addEventListener('change',()=>{syncBbbOptions();saveDraft();});
['tm','increase','bbbPct'].forEach(id=>$(id).addEventListener('input',saveDraft));
$('lift').addEventListener('change',selectPlannerLift);
$('oneRm').addEventListener('input',recalcPlannerTM);
$('generate').addEventListener('click',()=>{
 if(!editingId&&creationBlocked()){sync531CreationControls();return}
 const tm=+$('tm').value,inc=+$('increase').value;
 if(!(tm>0)||tm>1000||inc<0||inc>50){alert('Enter a valid Training Max and a TM increase of 0 kg or more.');return;}
 generated=buildCycle(getDraft());
 if(editingId){
  const items=readSaved(),idx=items.findIndex(x=>x.id===editingId);
  if(idx<0){alert('This saved cycle could not be found. It may have been deleted.');closeEditForm();return;}
  generated.id=editingId;generated.created=items[idx].created;generated.completedWeeks=(items[idx].completedWeeks||[]).filter(n=>n<=generated.weeks);items[idx]=JSON.parse(JSON.stringify(generated));
  if(writeSaved(items)){renderSaved();window.dispatchEvent(new Event('spartx:cycleUpdated'));saveDraft();$('programmeCard').classList.remove('visible');closeEditForm();}
 }else{renderProgramme(generated);saveDraft();}
});
$('expandCycle').addEventListener('click',()=>{expanded=!expanded;$('cycleDetail').classList.toggle('open',expanded);$('expandCycle').textContent=expanded?'HIDE FULL CYCLE ↑':'VIEW ENTIRE CYCLE ↓';});
$('saveCycle').addEventListener('click',()=>{
 if(creationBlocked()){sync531CreationControls();return}
 if(!generated)return;
 const items=readSaved();const copy=JSON.parse(JSON.stringify(generated));copy.id='sx531_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);copy.created=new Date().toISOString();
 copy.completedWeeks=[];items.unshift(copy);if(writeSaved(items)){renderSaved();{window.dispatchEvent(new Event('spartx:cycleUpdated'));window.dispatchEvent(new Event('spartx:cycleSaved'));}$('programmeCard').classList.remove('visible');$('saveStatus').textContent='Cycle saved on this device. You can reopen it from Saved Cycles.';}
});
$('savedList').addEventListener('click',e=>{
 const load=e.target.closest('[data-load]'),edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(load){const item=readSaved().find(x=>x.id===load.dataset.load);if(item){const detail=$('savedList').querySelector('[data-detail="'+item.id+'"]');const isOpen=detail.classList.contains('open');detail.innerHTML=isOpen?'':cycleDetailsHtml(item);detail.classList.toggle('open',!isOpen);load.textContent=isOpen?'OPEN':'CLOSE';}}
 if(edit){const item=readSaved().find(x=>x.id===edit.dataset.edit);if(item){editingId=item.id;$('lift').value=item.lift;$('tm').value=item.startTM;$('increase').value=item.increase;weeks=[4,8,12].includes(+item.weeks)?+item.weeks:4;$('bbb').checked=!!item.bbb;$('bbbPct').value=String([50,60,70].includes(+item.bbbPct)?item.bbbPct:60);syncBbbOptions();setLength();saveDraft();openEditForm();}}
 if(del){const items=readSaved().filter(x=>x.id!==del.dataset.delete);if(writeSaved(items)){if(editingId===del.dataset.delete){closeEditForm();}renderSaved();window.dispatchEvent(new Event('spartx:cycleUpdated'));}}
});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)renderSaved()});
window.addEventListener('spartx:cycleUpdated',sync531CreationControls);
window.addEventListener('pageshow',sync531CreationControls);window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='spartx:cycleUpdated')renderSaved()});
$('closeEdit').addEventListener('click',closeEditForm);$('cancelEdit').addEventListener('click',closeEditForm);$('editModal').addEventListener('click',e=>{if(e.target===$('editModal'))closeEditForm();});shadow.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('editModal').hidden)closeEditForm();});
$('plannerBack').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(host.classList.contains('sx-531-cycle-quick-mode')){window.dispatchEvent(new Event('spartx:quickCycleCancel'));return;}if(typeof window.spartanxOpenTools==='function')window.spartanxOpenTools();else document.querySelector('#trackerNav [data-screen="tools"]')?.click();});
restoreDraft();if(!$('oneRm').value){const stored=calculatorOneRm($('lift').value);if(stored)$('oneRm').value=String(stored);}setLength();$('bbbOptions').hidden=!$('bbb').checked;$('setupCard').hidden=false;renderSaved();
shadow.querySelectorAll('input[type=number]').forEach(el=>el.addEventListener('focus',()=>el.select()));
})();

window.addEventListener('spartx:preferencesChanged',()=>window.dispatchEvent(new Event('pageshow')));
window.addEventListener('spartx:cycleSaved',()=>{
 if(host.classList.contains('sx-531-cycle-quick-mode'))window.dispatchEvent(new Event('spartx:quickCycleSaved'));
 else window.spartanxOpenHome();
});
})();