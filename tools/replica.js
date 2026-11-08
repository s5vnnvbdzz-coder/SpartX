(function(){
const host=document.getElementById('toolsReplica');
if(!host)return;
const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML="<style>:host{color-scheme:dark;--bg:#0b0d0f;--panel:#171a1e;--panel2:#22272d;--line:#30363e;--txt:#f3f4f6;--muted:#9ba3ad;--lime:#c8f169}\n*{box-sizing:border-box}\n.round-option{display:flex;align-items:center;gap:7px;margin-top:9px;font-size:11px;color:var(--muted)}.round-option input{width:15px;height:15px;margin:0;accent-color:var(--lime)}\n:host{margin:0;min-height:0;width:100%;background:transparent;color:var(--txt);font:15px -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;padding:0}\n.brand{font-size:22px;font-weight:950;letter-spacing:3px}.brand span{color:var(--lime)}.sub{font-size:10px;color:var(--muted);letter-spacing:1.7px;margin-top:3px}\nmain{width:100%;max-width:none;margin:0;padding:0}\n.eyebrow{font-size:11px;color:var(--lime);font-weight:850;letter-spacing:1.6px}\nh1{font-size:27px;margin:7px 0}.page-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.page-title-row h1{flex:1}.page-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}h2{font-size:18px;margin:0}\n.intro{color:var(--muted);margin:0 0 19px;line-height:1.5}\n.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin:13px 0}\n.card.is-collapsed{padding-bottom:16px}.card.is-collapsed .card-head{margin-bottom:0}.card-collapse{flex:0 0 34px;width:34px;height:34px;padding:0;display:inline-flex;align-items:center;justify-content:center;background:#252a30;color:var(--lime);border:1px solid var(--line);border-radius:9px;font-size:19px;line-height:1}.card-collapse:focus-visible{outline:2px solid var(--lime);outline-offset:2px}.card.is-collapsed>:not(.card-head){display:none!important}\n#cyclePlannerCard[hidden],section.card[hidden]{display:none!important}\n.card-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}.card-head h2{flex:1}.gear-btn{display:inline-flex;align-items:center;justify-content:center;position:relative;z-index:5;width:38px;height:38px;padding:0;border:1px solid var(--line);background:#252a30;color:var(--txt);font-size:20px;border-radius:10px;text-decoration:none;cursor:pointer}\n#reorderMenuBar{display:none;align-items:center;gap:8px;margin:0 0 14px;padding:10px;background:#171a1e;border:1px solid var(--line);border-radius:12px}\n#reorderMenuBar.active{display:flex}#reorderMenuBar .reorder-message{flex:1;color:var(--muted);font-size:12px}\n#reorderMenuBar button{padding:9px 12px;border-radius:9px;font-size:12px;font-weight:850}\n#reorderMenuBar .reorder-cancel{background:#252a30;color:var(--txt);border:1px solid var(--line)}\n#reorderMenuBar .reorder-save{background:var(--lime);color:#11150b}\n.reorder-mode .card.reorder-enabled{border-color:#657044;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}\n.reorder-mode .card.reorder-enabled *{user-select:none;-webkit-user-select:none}\n.reorder-mode .card.reorder-active{opacity:.72;border:2px dashed var(--lime);cursor:grabbing}\n.page-actions{display:flex;align-items:center;gap:8px}\n.settings-page{display:none;max-width:700px;min-height:calc(100vh - env(safe-area-inset-top));margin:0 auto;padding:22px 16px 40px}.settings-page.active{display:block}.settings-top{display:flex;align-items:center;gap:12px;margin-bottom:18px}.back-btn{background:#252a30;color:var(--txt);border:1px solid var(--line)}.setting-row{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:14px 0;border-bottom:1px solid var(--line)}.setting-row:last-child{border-bottom:0}.setting-copy strong{display:block;font-size:14px}.setting-copy small{display:block;color:var(--muted);font-size:11px;line-height:1.4;margin-top:4px}.switch{position:relative;width:48px;height:28px;flex:0 0 48px}.switch input{opacity:0;width:0;height:0}.switch span{position:absolute;inset:0;border-radius:20px;background:#454b53;transition:.2s;cursor:pointer}.switch span:before{content:'';position:absolute;width:20px;height:20px;left:4px;top:4px;background:#fff;border-radius:50%;transition:.2s}.switch input:checked+span{background:var(--lime)}.switch input:checked+span:before{transform:translateX(20px);background:#18200d}.plate-settings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.plate-setting{display:flex;align-items:center;gap:8px;background:#101316;border:1px solid var(--line);padding:10px;border-radius:10px;font-size:13px}.plate-dot{width:13px;height:13px;border-radius:4px;flex:0 0 13px}.warmup{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}.warmup-title{font-size:12px;color:var(--muted);font-weight:800;letter-spacing:.8px;margin-bottom:5px}.warmup .calc-row strong{color:#dce7f3}\n .tool-icon{display:none}\n:host(.sx-premium-monster){--bg:#050a06;--panel:#0d1610;--panel2:#17261b;--line:#467a36;--txt:#fff9ed;--muted:#c1bba9;--lime:#8cff12;}:host(.sx-premium-monster) .card,:host(.sx-premium-monster) .week-card{background:linear-gradient(145deg,#17261b,#0d1610 60%,#050a06);border-color:#467a36;box-shadow:0 0 13px #8cff1222}:host(.sx-premium-monster) button{background:#17261b!important;color:#fff9ed!important;border:1px solid #467a36!important}:host(.sx-premium-monster) input,:host(.sx-premium-monster) select{background:#17261b;color:#fff9ed;border-color:#467a36}:host(.sx-premium-monster) .eyebrow,:host(.sx-premium-monster) .result{color:#8cff12}:host(.sx-premium-olympus){--bg:#090c14;--panel:#111824;--panel2:#1a2534;--line:#a68043;--txt:#fff9ed;--muted:#c1bba9;--lime:#ffd376;}:host(.sx-premium-olympus) .card,:host(.sx-premium-olympus) .week-card{background:linear-gradient(145deg,#1a2534,#111824 60%,#090c14);border-color:#a68043;box-shadow:0 0 13px #ffd37622}:host(.sx-premium-olympus) button{background:#1a2534!important;color:#fff9ed!important;border:1px solid #a68043!important}:host(.sx-premium-olympus) input,:host(.sx-premium-olympus) select{background:#1a2534;color:#fff9ed;border-color:#a68043}:host(.sx-premium-olympus) .eyebrow,:host(.sx-premium-olympus) .result{color:#ffd376}:host(.sx-halloween){--bg:#120b14;--panel:#261326;--panel2:#3a2031;--line:#72435b;--txt:#f6f5ee;--muted:#c0b9b3;--lime:#ff872b;}\n:host(.sx-halloween) .card,:host(.sx-halloween) .week-card{background:linear-gradient(225deg,color-mix(in srgb,#ff872b 12%,#3a2031),#261326 55%,#120b14);border-color:#72435b}\n:host(.sx-halloween) button{background:#3a2031;border:1px solid #72435b;color:#f6f5ee}\n:host(.sx-halloween) .eyebrow,:host(.sx-halloween) .result{color:#ff872b}\n:host(.sx-christmas){--bg:#091b19;--panel:#142d29;--panel2:#22423c;--line:#4c8174;--txt:#f6f5ee;--muted:#c0b9b3;--lime:#e8c66b;}\n:host(.sx-christmas) .card,:host(.sx-christmas) .week-card{background:linear-gradient(225deg,color-mix(in srgb,#e8c66b 12%,#22423c),#142d29 55%,#091b19);border-color:#4c8174}\n:host(.sx-christmas) button{background:#22423c;border:1px solid #4c8174;color:#f6f5ee}\n:host(.sx-christmas) .eyebrow,:host(.sx-christmas) .result{color:#e8c66b}\n:host(.sx-monster){--bg:#090d09;--panel:#171e13;--panel2:#24311c;--line:#4b7134;--txt:#f6f5ee;--muted:#c0b9b3;--lime:#8fe51b;}\n:host(.sx-monster) .card,:host(.sx-monster) .week-card{background:linear-gradient(225deg,color-mix(in srgb,#8fe51b 12%,#24311c),#171e13 55%,#090d09);border-color:#4b7134}\n:host(.sx-monster) button{background:#24311c;border:1px solid #4b7134;color:#f6f5ee}\n:host(.sx-monster) .eyebrow,:host(.sx-monster) .result{color:#8fe51b}\n:host(.spartanx-olympian-female){--bg:#0d0912;--panel:#1a1422;--panel2:#292033;--line:#70577d;--txt:#f7edf6;--muted:#c2abc9;--lime:#e8b4dd}\n:host(.spartanx-olympian-female) .card{background:linear-gradient(225deg,#5a345b55,#292033 34%,#16121e 85%);border-color:#916995;box-shadow:inset 0 1px 0 #e8b4dd18,0 0 12px #b875bb15}\n:host(.spartanx-olympian-female) button{background:#292033aa!important;color:#f6e9f4!important;border:1px solid #916995!important}\n:host(.spartanx-olympian-female) .eyebrow,:host(.spartanx-olympian-female) .result,:host(.spartanx-olympian-female) .calc-row strong{color:#e8b4dd}\n:host(.spartanx-olympian-female) input,:host(.spartanx-olympian-female) select{background:#211829;color:#f7edf6;border-color:#70577d}\n:host(.spartanx-olympian){--bg:#080808;--panel:#151414;--panel2:#242222;--line:#51483a;--txt:#f3eee5;--muted:#b8ad9b;--lime:#d8c49a}\n:host(.spartanx-olympian) .card{background:linear-gradient(140deg,rgba(177,145,91,.13),rgba(75,67,56,.48) 22%,#24211e 52%,#151414 100%);border-color:rgba(203,174,125,.36);box-shadow:0 0 0 1px rgba(211,184,137,.045),0 0 13px rgba(190,158,99,.075),inset 0 1px 0 rgba(255,239,208,.045)}\n:host(.spartanx-olympian) .card-collapse,:host(.spartanx-olympian) .gear-btn{border-color:rgba(203,174,125,.3);color:#d8c49a}\n:host(.spartanx-olympian) .eyebrow,:host(.spartanx-olympian) .brand span{color:#ead7ae}\n:host(.spartanx-olympian) button{background:rgba(39,38,36,.68)!important;color:#eee9df!important;border:1px solid rgba(190,171,137,.22)!important;box-shadow:none!important}\n:host(.spartanx-olympian) .result,:host(.spartanx-olympian) .calc-row strong{color:#d8c49a}\n\n.fields{display:flex;gap:10px;margin:10px 0}.field{flex:1;min-width:0}\nlabel{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}\ninput,select,button{font:inherit}\ninput,select{width:100%;min-width:0;padding:12px;background:#0f1215;color:var(--txt);border:1px solid var(--line);border-radius:10px;font-size:16px}\ninput:focus,select:focus{outline:1px solid var(--lime);border-color:var(--lime)}\\ninput::placeholder{color:#737c86;font-style:italic;opacity:1}\n#apply531{width:100%;margin:8px 0 10px}\n.result{font-size:28px;font-weight:900;color:var(--lime);font-variant-numeric:tabular-nums;margin:14px 0 2px}\n.hint{font-size:11px;color:var(--muted);line-height:1.5}\n.rows{margin-top:10px}.calc-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 2px;border-bottom:1px solid var(--line)}.calc-row:last-child{border-bottom:0}.calc-row strong{font-size:18px;color:var(--lime);white-space:nowrap}.calc-row small{display:block;color:var(--muted);font-size:11px;margin-top:3px}\n.plate-output{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.plate-diagram-wrap{margin:16px 0 8px;padding:12px 8px;background:#101316;border:1px solid #30363e;border-radius:12px}#plateDiagram{width:100%;display:block;height:auto;min-height:100px}.plate-diagram-caption{text-align:center;color:var(--muted);font-size:10px;margin-top:2px}.plate{border:1px solid #ffffff55;padding:8px 11px;border-radius:9px;font-size:13px;font-weight:850;}.empty{color:var(--muted);font-size:13px;padding:8px 0}\nbutton{border:0;border-radius:10px;padding:11px 13px;background:var(--lime);color:#11150b;font-weight:850;cursor:pointer}\nfooter{text-align:center;color:#68717a;font-size:10px;letter-spacing:1.4px;padding:10px}\n@media(max-width:390px){main{padding:0}.card{padding:15px}.fields{gap:8px}.result{font-size:25px}}\n#cyclePlannerOverlay{position:fixed;inset:0;z-index:100000;background:#0a090a;display:none;flex-direction:column;padding:0}#cyclePlannerOverlay.open{display:flex}#cyclePlannerFrame{border:0;display:block;flex:1;width:100%;height:100%;min-height:0;background:#0a090a}\n</style>\n<main>\n<div class=\"eyebrow\">NUMBERS DON'T LIE</div>\n<div class=\"page-title-row\"><h1>Training Tools</h1><div class=\"page-actions\"><button class=\"gear-btn\" id=\"reorderMenuButton\" type=\"button\" aria-label=\"Rearrange tools\" title=\"Rearrange tools\">☰</button><a class=\"gear-btn\" href=\"./tools/settings.html?return=tracker\" aria-label=\"Open settings\" title=\"Settings\">⚙</a></div></div>\n<div id=\"reorderMenuBar\"><span class=\"reorder-message\">Hold a handle and drag tools into your preferred order.</span><button type=\"button\" class=\"reorder-cancel\" id=\"cancelToolOrder\">CANCEL</button><button type=\"button\" class=\"reorder-save\" id=\"saveToolOrder\">SAVE</button></div>\n\n<section class=\"card\" aria-labelledby=\"ormTitle\">\n<div class=\"card-head\"><h2 id=\"ormTitle\">1RM Calculator</h2></div>\n<div class=\"fields\">\n<div class=\"field\"><label for=\"ormWeight\">Weight (kg)</label><input id=\"ormWeight\" type=\"number\" min=\"0\" step=\"0.5\" placeholder=\"e.g. 100\" inputmode=\"decimal\"></div>\n<div class=\"field\"><label for=\"ormReps\">Reps</label><input id=\"ormReps\" type=\"number\" min=\"1\" max=\"12\" step=\"1\" placeholder=\"e.g. 5\" inputmode=\"numeric\"></div>\n</div>\n<div class=\"result\" id=\"ormResult\">—</div>\n<div class=\"hint\">Most useful for sets of 1–10 reps. This is an estimate, not a tested max.</div>\n</section>\n\n\n\n\n<section class=\"card\" aria-labelledby=\"531Title\">\n<div class=\"card-head\"><h2 id=\"531Title\">5/3/1/ Calculator</h2></div>\n<div class=\"fields\"><div class=\"field\"><label for=\"tmFinderOneRm\">1RM (kg)</label><input id=\"tmFinderOneRm\" type=\"number\" min=\"0\" step=\"0.5\" placeholder=\"e.g. 160\" inputmode=\"decimal\"></div><div class=\"field\"><label for=\"tm\">Training max (kg)</label><input id=\"tm\" type=\"number\" min=\"0\" step=\"0.5\" placeholder=\"90% of 1RM\" inputmode=\"decimal\"></div></div><div class=\"hint\" style=\"margin:7px 0 12px\">Enter your 1RM to calculate a 90% training max automatically, or edit the TM directly.</div><div class=\"fields\"><div class=\"field\"><label for=\"applyLift\">Exercise</label><select id=\"applyLift\"><option value=\"Back Squat\" selected>Squat</option><option value=\"Bench Press\">Bench press</option><option value=\"Conventional Deadlift\">Deadlift</option></select></div><div class=\"field\"><label for=\"week\">Week</label><select id=\"week\"><option value=\"1\">Week 1 · 5s</option><option value=\"2\">Week 2 · 3s</option><option value=\"3\">Week 3 · 5/3/1</option><option value=\"4\">Week 4 · Deload</option></select></div></div><div id=\"tmFinderResult\" hidden></div><input type=\"checkbox\" id=\"tmFinderRound\" hidden><button type=\"button\" id=\"apply531\">ADD TO WORKOUT</button><button type=\"button\" id=\"quickCreate531Cycle\" style=\"display:none;width:100%;margin-top:10px;background:var(--panel2);color:var(--lime);border:1px solid var(--lime)\">CREATE CYCLE</button><div class=\"hint\" id=\"applyHint\">Send these three working sets to the first exercise in your workout.</div>\n<div class=\"rows\" id=\"wendler\"></div>\n<div class=\"hint\">Weights are rounded to the nearest 2.5 kg. Percentages are based on your training max.</div><div class=\"warmup\" id=\"warmupOutput\" hidden></div>\n</section>\n\n<section class=\"card\" aria-labelledby=\"plateTitle\">\n<div class=\"card-head\"><div class=\"tool-icon\">▤</div><h2 id=\"plateTitle\">Plate Calculator</h2></div>\n<div class=\"fields\">\n<div class=\"field\"><label for=\"target\">Target bar weight (kg)</label><input id=\"target\" type=\"number\" min=\"0\" step=\"2.5\" placeholder=\"e.g. 180\" inputmode=\"decimal\"></div>\n<div class=\"field\"><label for=\"bar\">Bar weight (kg)</label><input id=\"bar\" type=\"number\" min=\"0\" step=\"0.5\" value=\"20\" placeholder=\"e.g. 20\" inputmode=\"decimal\"></div>\n</div>\n<div class=\"result\" id=\"plateTotal\">—</div>\n<div class=\"plate-output\" id=\"plates\"></div><div class=\"plate-diagram-wrap\" id=\"plateDiagramWrap\"><svg id=\"plateDiagram\" viewBox=\"0 0 440 116\" role=\"img\" aria-label=\"Diagram showing the plates loaded on each side of the barbell\"></svg><div class=\"plate-diagram-caption\" id=\"plateDiagramCaption\">Plate layout updates with your target weight.</div></div>\n<div class=\"hint\" id=\"plateHint\">Plates required per side, using standard plate sizes.</div>\n</section>\n<section class=\"card\" id=\"cyclePlannerCard\" aria-labelledby=\"cyclePlannerTitle\">\n<div class=\"card-head\"><h2 id=\"cyclePlannerTitle\">5/3/1 Cycle Planner</h2></div>\n<div class=\"hint\" style=\"margin-bottom:13px\">Build progressive 4, 8 or 12-week cycles, add optional BBB work and save programmes to revisit later.</div>\n<button type=\"button\" id=\"openCyclePlanner\" style=\"display:block;width:100%;text-align:center;background:var(--lime);color:#11150b;font-weight:850;padding:13px;border-radius:10px\">OPEN CYCLE PLANNER →</button>\n</section>\n</main>\n<div id=\"cyclePlannerOverlay\" aria-hidden=\"true\"><iframe id=\"cyclePlannerFrame\" title=\"5/3/1 Cycle Planner\" src=\"about:blank\"></iframe></div>\n";
(function(){
const themeStyle=document.createElement('style');themeStyle.textContent=':host(.spartanx-amethyst){--bg:#0b0911;--panel:#17121f;--panel2:#292037;--line:#4b385f;--lime:#b58ae9;--txt:#f1eaf7;--muted:#b5a5c4}:host(.spartanx-amethyst) .card{background:linear-gradient(225deg,rgba(114,56,169,.33),rgba(53,43,65,.88) 24%,#251c30 48%,#17121f 82%);border-color:#59436d}:host(.spartanx-amethyst) button{background:rgba(40,34,49,.65)!important;color:#eae3f3!important;border-color:rgba(171,133,211,.22)!important}:host(.spartanx-amethyst) .gear-btn{background:rgba(40,34,49,.7)!important;color:#c19df1!important;border:1px solid #684d81!important}:host(.spartanx-amethyst) .eyebrow,:host(.spartanx-amethyst) .brand span,:host(.spartanx-amethyst) .result{color:#c19df1}:host(.spartanx-red){--lime:#ef2029;--line:#393438;--panel:#151518;--panel2:#242428}:host(.spartanx-red) .card{background:linear-gradient(225deg,rgba(125,20,29,.42) 0%,rgba(65,65,69,.88) 24%,#242326 48%,#171719 82%);border-color:#514044}:host(.spartanx-red) .eyebrow,:host(.spartanx-red) .brand span{color:#ff3943}:host(.spartanx-red) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}:host(.spartanx-red) button:active{background:rgba(52,52,56,.82)!important}:host(.spartanx-red) .gear-btn,:host(.spartanx-red) .card-collapse{background:rgba(39,40,43,.62)!important;border-color:rgba(145,139,143,.22)!important}:host(.spartanx-red) #reorderMenuBar{background:#171719;border-color:#403437}:host(.spartanx-red) .result,:host(.spartanx-red) .calc-row strong{color:#ff3943}';themeStyle.textContent+=":host(.spartanx-gold){--lime:#b89b5e;--line:#494232;--panel:#171613;--panel2:#25231e}:host(.spartanx-gold) .card{background:linear-gradient(225deg,rgba(116,91,42,.22) 0%,rgba(65,65,69,.88) 24%,#242326 48%,#171719 82%);border-color:#4b4434}:host(.spartanx-gold) .eyebrow,:host(.spartanx-gold) .brand span{color:#d6bb7b}:host(.spartanx-gold) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}:host(.spartanx-gold) button:active{background:rgba(52,52,56,.82)!important}:host(.spartanx-gold) .gear-btn,:host(.spartanx-gold) .card-collapse{background:rgba(39,40,43,.62)!important;border-color:rgba(145,139,143,.22)!important}:host(.spartanx-gold) #reorderMenuBar{background:#171613;border-color:#494232}:host(.spartanx-gold) .result,:host(.spartanx-gold) .calc-row strong{color:#d6bb7b}:host(.spartanx-bronze){--lime:#a8794f;--line:#40352d;--panel:#171513;--panel2:#26211d}:host(.spartanx-bronze) .card{background:linear-gradient(225deg,rgba(105,69,42,.20) 0%,rgba(65,62,59,.88) 24%,#27221f 48%,#171513 82%);border-color:#4a3a2e}:host(.spartanx-bronze) .eyebrow,:host(.spartanx-bronze) .brand span{color:#c09163}:host(.spartanx-bronze) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}:host(.spartanx-bronze) button:active{background:rgba(52,52,56,.82)!important}:host(.spartanx-bronze) .gear-btn,:host(.spartanx-bronze) .card-collapse{background:rgba(39,40,43,.62)!important;border-color:rgba(145,139,143,.22)!important}:host(.spartanx-bronze) #reorderMenuBar{background:#171513;border-color:#40352d}:host(.spartanx-bronze) .result,:host(.spartanx-bronze) .calc-row strong{color:#c09163}:host(.spartanx-blue){--lime:#628bb8;--line:#34465b;--panel:#141b25;--panel2:#202c3b}:host(.spartanx-blue) .card{background:linear-gradient(225deg,rgba(55,91,132,.20) 0%,rgba(58,68,82,.88) 24%,#202a38 48%,#141b25 82%);border-color:#3a506a}:host(.spartanx-blue) .eyebrow,:host(.spartanx-blue) .brand span{color:#8fb4dc}:host(.spartanx-blue) button{background:rgba(39,40,43,.62)!important;color:#e8e6e7!important;border:1px solid rgba(145,139,143,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}:host(.spartanx-blue) button:active{background:rgba(52,52,56,.82)!important}:host(.spartanx-blue) .gear-btn,:host(.spartanx-blue) .card-collapse{background:rgba(39,40,43,.62)!important;border-color:rgba(145,139,143,.22)!important}:host(.spartanx-blue) #reorderMenuBar{background:#141b25;border-color:#34465b}:host(.spartanx-blue) .result,:host(.spartanx-blue) .calc-row strong{color:#8fb4dc}:host .page-actions .gear-btn{background:color-mix(in srgb,var(--panel2) 78%,transparent)!important;color:var(--lime)!important;border:1px solid var(--line)!important;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--lime) 13%,transparent)!important}:host .page-actions .gear-btn:hover,:host .page-actions .gear-btn:focus-visible{border-color:var(--lime)!important;box-shadow:0 0 12px color-mix(in srgb,var(--lime) 22%,transparent)!important}:host(.spartanx-red) .page-actions .gear-btn,:host(.spartanx-gold) .page-actions .gear-btn,:host(.spartanx-bronze) .page-actions .gear-btn,:host(.spartanx-blue) .page-actions .gear-btn,:host(.spartanx-amethyst) .page-actions .gear-btn,:host(.spartanx-olympian) .page-actions .gear-btn{background:color-mix(in srgb,var(--panel2) 78%,transparent)!important;color:var(--lime)!important;border-color:var(--lime)!important}:host .page-actions .gear-btn,:host(.spartanx-red) .page-actions .gear-btn,:host(.spartanx-gold) .page-actions .gear-btn,:host(.spartanx-bronze) .page-actions .gear-btn,:host(.spartanx-blue) .page-actions .gear-btn,:host(.spartanx-amethyst) .page-actions .gear-btn,:host(.spartanx-olympian) .page-actions .gear-btn{color:var(--lime)!important;border:1px solid var(--lime)!important;background:color-mix(in srgb,var(--panel2) 85%,transparent)!important;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--lime) 12%,transparent)!important}:host(.spartanx-amazonian){--bg:#0e0b10;--panel:#1d141d;--panel2:#341b2a;--line:#79435a;--lime:#c84b76;--txt:#f4e7ed;--muted:#baa1ae}:host(.spartanx-amazonian) .card{background:linear-gradient(225deg,color-mix(in srgb,var(--lime) 15%,var(--panel)),var(--panel) 55%,var(--bg));border-color:var(--line)}:host(.spartanx-amazonian) button,:host(.spartanx-amazonian) .gear-btn{background:var(--panel2)!important;color:var(--txt)!important;border:1px solid var(--line)!important}:host(.spartanx-amazonian) .page-actions .gear-btn{color:var(--lime)!important;border-color:var(--lime)!important}:host(.spartanx-amazonian) .eyebrow,:host(.spartanx-amazonian) .brand span{color:var(--lime)}:host(.spartanx-aegis){--bg:#0c0b13;--panel:#191625;--panel2:#29233c;--line:#65527f;--lime:#c5a0f1;--txt:#f2ebfa;--muted:#b8a9cb}:host(.spartanx-aegis) .card{background:linear-gradient(225deg,color-mix(in srgb,var(--lime) 15%,var(--panel)),var(--panel) 55%,var(--bg));border-color:var(--line)}:host(.spartanx-aegis) button,:host(.spartanx-aegis) .gear-btn{background:var(--panel2)!important;color:var(--txt)!important;border:1px solid var(--line)!important}:host(.spartanx-aegis) .page-actions .gear-btn{color:var(--lime)!important;border-color:var(--lime)!important}:host(.spartanx-aegis) .eyebrow,:host(.spartanx-aegis) .brand span{color:var(--lime)}";themeStyle.textContent+="\n:host(.sx-obsidian-white){--bg:#030303;--panel:#0b0b0b;--panel2:#171717;--line:#333333;--txt:#f0f0f0;--muted:#999999;--lime:#dfdfdf}\n:host(.sx-obsidian-white) .card{background:linear-gradient(225deg,#191919,#101010 40%,#070707)!important;border:1px solid #343434!important;box-shadow:inset 0 1px 0 #ffffff0a,0 3px 16px #0005!important}\n:host(.sx-obsidian-white) button:not(.danger){background:linear-gradient(165deg,#222,#101010)!important;color:#eeeeee!important;border:1px solid #414141!important}\n:host(.sx-obsidian-white) .eyebrow,:host(.sx-obsidian-white) .brand span,:host(.sx-obsidian-white) .result{color:#e7e7e7!important}\n:host(.sx-obsidian-white) input,:host(.sx-obsidian-white) select,:host(.sx-obsidian-white) textarea{background:#111!important;color:#f0f0f0!important;border-color:#3b3b3b!important}\n:host(.sx-obsidian-white) .gear-btn,:host(.sx-obsidian-white) .card-collapse{background:#181818!important;border-color:#555!important;color:#eaeaea!important}\n:host(.sx-obsidian-white) .ascension-launch{background:#191919!important;border-color:#555!important;color:#eaeaea!important}\n";themeStyle.textContent+=`:host(.sx-black-yellow){--bg:#050505;--panel:#101010;--panel2:#191919;--line:#40371e;--txt:#f3f3ed;--muted:#a5a39a;--lime:#f4cd37;color-scheme:dark}
:host(.sx-black-yellow) .card,:host(.sx-black-yellow) .detail-panel,:host(.sx-black-yellow) .exercise-card{background:linear-gradient(225deg,#1b190f,#141414 24%,#0a0a0a 85%)!important;border:1px solid #40371e!important}
:host(.sx-black-yellow) button{background:#191919!important;color:#f3f3ed!important;border:1px solid #40371e!important;box-shadow:none!important}
:host(.sx-black-yellow) button:focus-visible,:host(.sx-black-yellow) button:active{border-color:#f4cd37!important}
:host(.sx-black-yellow) .brand span,:host(.sx-black-yellow) .eyebrow,:host(.sx-black-yellow) .result{color:#f4cd37!important}
:host(.sx-black-yellow) input,:host(.sx-black-yellow) select{background:#111!important;color:#f3f3ed!important;border-color:#40371e!important}
:host(.sx-black-yellow) .gear-btn,:host(.sx-black-yellow) .ascension-launch{border-color:#f4cd37!important;color:#f4cd37!important}
`;
// Keep the shadow-root palette synchronised with the tracker for future themes.
const trackerThemeTokens=['--bg','--panel','--panel2','--line','--txt','--muted','--lime'];
themeStyle.textContent += "\n:host(.sx-jade){--bg:#08130f;--panel:#142820;--panel2:#233b31;--line:#63846b;--txt:#f5f7ef;--muted:#bdcec0;--lime:#aaff37}\n:host(.sx-jade) .card{border:2px solid #9cc77d!important;border-radius:17px 4px 17px 4px!important;background:linear-gradient(120deg,#e7f5e010,transparent 21%),linear-gradient(150deg,#264735,#12291e 65%,#07150e)!important;box-shadow:inset 0 1px 0 #eaffdc55,0 0 22px #aaff374e,0 7px 19px #0008!important}\n:host(.sx-jade) :is(.eyebrow,.brand span,.result){color:#baff68!important;text-shadow:0 0 10px #aaff3755}\n:host(.sx-jade) :is(button,.gear-btn,.ascension-launch){border-color:#9ac780!important;background:linear-gradient(140deg,#304b38,#142a1d)!important;color:#f3f9ed!important;box-shadow:0 0 10px #baff373d!important}\n:host(.sx-jade) :is(button.primary,#openCyclePlanner){background:linear-gradient(140deg,#e2ff93,#aaff37)!important;color:#12250c!important;box-shadow:0 0 18px #aaff3794!important}\n:host(.sx-jade) :is(input,select){border-color:#749d78!important;background:#0a1c14!important;color:#f5ffe9!important}\n:host(.sx-jade) input[type=checkbox]{accent-color:#aaff37}\n";themeStyle.textContent+="\n:host(.sx-cosmic){--bg:#070919;--panel:#12162c;--panel2:#202644;--line:#6367a0;--txt:#f2f5ff;--muted:#afb9d8;--lime:#8bdcff;color-scheme:dark}\n:host(.sx-cosmic) :is(.card,.detail-panel,.exercise-card){background:radial-gradient(ellipse at 100% 0%,#725bb24a,transparent 50%),linear-gradient(155deg,#222044,#141b33 57%,#0b1128)!important;border:1px solid #7777b28a!important;box-shadow:0 0 15px #8d79d42f!important}\n:host(.sx-cosmic) button:not(.danger){background:linear-gradient(160deg,#30344dad,#171d32eb)!important;color:#f2f5ff!important;border:1px solid #747da6!important}\n:host(.sx-cosmic) :is(.eyebrow,.brand span,.result,.calc-row strong){color:#a7e2ff!important}\n:host(.sx-cosmic) :is(input:not([type=checkbox]),select,textarea){background:#10172fe8!important;border:1px solid #68719c!important;color:#f4f6ff!important}\n:host(.sx-cosmic) input[type=checkbox]{accent-color:#8bdcff}\n:host(.sx-cosmic) .gear-btn{color:#b4e7ff!important;border-color:#a094da!important}\n:host(.sx-cosmic) .ascension-launch{background:#1b1b3b!important;border-color:#9891d0!important;color:#e2f7ff!important}\n";shadow.append(themeStyle);function syncToolsTheme(){let p={};try{p=JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}')}catch(e){}const parentStyle=getComputedStyle(document.body);for(const token of trackerThemeTokens){const value=parentStyle.getPropertyValue(token).trim();if(value)host.style.setProperty(token,value)}host.classList.toggle('spartanx-red',p.theme==='spartan-red');host.classList.toggle('spartanx-gold',p.theme==='spartan-gold');host.classList.toggle('spartanx-bronze',p.theme==='spartan-bronze');host.classList.toggle('spartanx-blue',p.theme==='spartan-blue');host.classList.toggle('spartanx-amethyst',p.theme==='spartan-amethyst');host.classList.toggle('sx-jade',p.theme==='jade-sentinel');host.classList.toggle('sx-cosmic',p.theme==='cosmic-nebula');host.classList.toggle('spartanx-olympian',p.theme==='spartan-olympian');host.classList.toggle('spartanx-olympian-female',p.theme==='olympian-athena');host.classList.toggle('sx-halloween',p.theme==='sx-halloween');host.classList.toggle('sx-christmas',p.theme==='sx-christmas');host.classList.toggle('sx-monster',p.theme==='sx-monster');host.classList.toggle('sx-obsidian-white',p.theme==='sx-obsidian-white');host.classList.toggle('sx-black-yellow',p.theme==='sx-black-yellow');host.classList.toggle('sx-premium-monster',p.theme==='premium-monster');host.classList.toggle('sx-premium-olympus',p.theme==='premium-olympus');host.classList.toggle('spartanx-amazonian',p.theme==='amazonian-crimson');host.classList.toggle('spartanx-aegis',p.theme==='athenas-aegis')}syncToolsTheme();window.addEventListener('storage',e=>{if(e.key==='spartx_preferences_v1')syncToolsTheme()});window.addEventListener('spartx:preferencesChanged',()=>{syncToolsTheme();syncPlannerTheme();});const $=id=>shadow.getElementById(id);
const plannerOverlay=$('cyclePlannerOverlay'),plannerFrame=$('cyclePlannerFrame');
function syncPlannerTheme(){try{const prefs=JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}');if(plannerFrame.contentWindow)plannerFrame.contentWindow.postMessage({type:'spartx:applyTheme',theme:prefs.theme||'dark'},location.origin);}catch(e){}}
$('openCyclePlanner').addEventListener('click',()=>window.spartanxOpenPlanner());

window.addEventListener('message',e=>{
 if(e.origin!==location.origin)return;
 if(e.data?.type==='spartx:closeCyclePlanner')window.spartanxOpenTools();
 if(e.data?.type==='spartx:cycleSaved'){
  window.spartanxOpenHome();
  document.documentElement.style.overflowY='auto';
  document.body.style.overflow='';
  document.body.style.overflowY='auto';
  document.querySelector('#trackerNav [data-screen="home"]')?.click();
  requestAnimationFrame(()=>{document.documentElement.scrollTop=0;document.body.scrollTop=0;window.scrollTo(0,0);});
 }
});

 

/* AscensionX embedded edition. This is the SAME AscensionX app loaded inside
   SpartanX — no fork of its six-week cycle engine or standalone state format. */
const ascensionToolCard=document.createElement('section');
ascensionToolCard.className='card';
ascensionToolCard.id='ascensionXToolCard';
ascensionToolCard.setAttribute('aria-labelledby','ascensionXToolTitle');
ascensionToolCard.innerHTML=
 '<div class="card-head"><h2 id="ascensionXToolTitle">AscensionX</h2></div>'+
 '<p class="hint" style="margin:0 0 13px;line-height:1.55">Full six-week strength programming, workout logging, adaptive progression, rest timers, training history and profile.</p>'+
 '<button id="openAscensionX" type="button" class="ascension-launch">OPEN ASCENSIONX <span aria-hidden="true">↗</span></button>'+
 '<p class="hint" style="margin:11px 0 0">Opens within SpartanX. The standalone AscensionX app remains available separately.</p>';
shadow.querySelector('main').appendChild(ascensionToolCard);

// Mount the full-screen AscensionX overlay outside the hidden Tools screen.
// This lets Workout-page quick access open it reliably without changing Tools layout.
const ascensionPortalHost=document.createElement('div');
ascensionPortalHost.id='sxAscensionPortalHost';
document.body.appendChild(ascensionPortalHost);
const ascensionPortal=ascensionPortalHost.attachShadow({mode:'open'});
const ascensionOverlay=document.createElement('div');
ascensionOverlay.id='ascensionXOverlay';
ascensionOverlay.setAttribute('role','dialog');
ascensionOverlay.setAttribute('aria-modal','true');
ascensionOverlay.setAttribute('aria-label','AscensionX embedded training');
ascensionOverlay.setAttribute('aria-hidden','true');
ascensionOverlay.setAttribute('tabindex','-1');
ascensionOverlay.innerHTML=
 '<div class="sx-ascension-window">'+
 '<div class="ascensionx-embedded-toolbar">'+
   '<button id="closeAscensionX" type="button" aria-label="Close AscensionX and return to Training Tools">← TOOLS</button>'+
   '<div class="ascensionx-embedded-brand"><strong id="ascensionXOverlayTitle">ASCENSION<span>X</span></strong><small>STRENGTH METHOD</small></div>'+
 '</div>'+
 '<iframe id="ascensionXEmbedFrame" title="AscensionX full training application" src="about:blank" allow="fullscreen" referrerpolicy="same-origin"></iframe>'+
 '</div>';
ascensionPortal.appendChild(ascensionOverlay);

const ascensionStyle=document.createElement('style');
ascensionStyle.textContent=[
 '#ascensionXToolCard .ascension-launch{display:flex!important;align-items:center;justify-content:center;gap:9px;width:100%;min-height:47px;font-size:12px;letter-spacing:.7px;background:color-mix(in srgb,var(--lime) 16%,var(--panel2))!important;border:1px solid color-mix(in srgb,var(--lime) 58%,var(--line))!important;color:var(--txt)!important;border-radius:11px;box-shadow:inset 0 1px 0 #ffffff09}',
 '#ascensionXToolCard .ascension-launch span{color:var(--lime);font-size:19px;line-height:1}',
 '#ascensionXOverlay{display:none;position:fixed;inset:0;width:100%;height:100dvh;z-index:2147483647;flex-direction:column;background:var(--bg,#090b0f);color:var(--txt,#f5f5f7);overflow:hidden;overscroll-behavior:contain}',
 '#ascensionXOverlay.open{display:flex}',
 '#ascensionXOverlay .sx-ascension-window{display:flex;flex-direction:column;flex:1 1 auto;width:100%;height:100%;min-height:0;overflow:hidden;background:var(--bg,#090b0f)}',
 '#ascensionXOverlay.sx-ascension-quick{align-items:center;justify-content:center;padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}',
 '#ascensionXOverlay.sx-ascension-quick .sx-ascension-window{flex:none;width:min(100%,660px);height:min(88dvh,870px);max-height:100%;border:1px solid var(--lime,#c8f169);border-radius:17px;box-shadow:0 20px 60px #000c}',
 '#ascensionXOverlay.sx-ascension-quick #ascensionXEmbedFrame{overflow-y:auto;overscroll-behavior:contain}',
 '#ascensionXOverlay.sx-ascension-quick #closeAscensionX{display:inline-flex!important;align-items:center;justify-content:center;order:2;margin-left:auto}',
 '#ascensionXOverlay .ascensionx-embedded-toolbar{display:flex;flex:0 0 auto;align-items:center;gap:12px;min-height:54px;padding:calc(7px + env(safe-area-inset-top,0px)) 12px 8px;background:linear-gradient(100deg,var(--bg,#111419),var(--panel,#111419));border-bottom:1px solid var(--line,#343b44);box-shadow:0 2px 12px #0007}',
 '#ascensionXOverlay .ascensionx-embedded-toolbar button{min-height:37px;flex-shrink:0;padding:8px 12px;background:color-mix(in srgb,var(--panel2) 80%,#111)!important;border:1px solid var(--line)!important;color:var(--txt)!important;border-radius:10px;font-weight:850;font-size:11px}',
 '#ascensionXOverlay .ascensionx-embedded-brand{display:flex;flex-direction:column;gap:2px;min-width:0}',
 '#ascensionXOverlay .ascensionx-embedded-brand strong{font-size:15px;letter-spacing:1.7px;font-weight:950}',
 '#ascensionXOverlay .ascensionx-embedded-brand strong span{color:var(--lime)}',
 '#ascensionXOverlay .ascensionx-embedded-brand small{font-size:8px;letter-spacing:1.1px;color:#a9afb9}',
 '#ascensionXEmbedFrame{display:block;flex:1 1 auto;width:100%;height:100%;min-height:0;border:0;background:var(--bg,#08090c);-webkit-overflow-scrolling:touch}',
 '@media(prefers-reduced-motion:reduce){#ascensionXOverlay *{scroll-behavior:auto}}'
].join('\n');
ascensionStyle.textContent+='\n'+"\n/* iPhone/PWA viewport fit for Quick Start from a workout.\n   Safe-area padding must be INSIDE the 100dvh viewport, not added onto it. */\n#ascensionXOverlay,#ascensionXOverlay *,#ascensionXOverlay *::before,#ascensionXOverlay *::after{box-sizing:border-box}\n#ascensionXOverlay{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important}\n#ascensionXOverlay.sx-ascension-quick{\n  padding:calc(8px + env(safe-area-inset-top,0px))\n          calc(8px + env(safe-area-inset-right,0px))\n          calc(8px + env(safe-area-inset-bottom,0px))\n          calc(8px + env(safe-area-inset-left,0px))!important\n}\n#ascensionXOverlay.sx-ascension-quick .sx-ascension-window{\n  flex:0 1 auto!important;\n  width:min(100%,660px)!important;\n  height:min(100%,790px)!important;\n  max-height:100%!important;\n  min-width:0!important;\n  min-height:0!important;\n  overflow:hidden!important;\n}\n#ascensionXOverlay.sx-ascension-quick .ascensionx-embedded-toolbar{\n  flex:0 0 auto!important;min-height:48px!important;padding:7px 10px!important\n}\n#ascensionXOverlay #ascensionXEmbedFrame{\n  display:block!important;flex:1 1 auto!important;\n  width:100%!important;height:0!important;min-height:0!important;\n  max-height:100%!important;overflow:auto!important;touch-action:pan-y;\n}\n@media(max-height:560px){\n #ascensionXOverlay.sx-ascension-quick{padding-top:calc(4px + env(safe-area-inset-top,0px))!important;padding-bottom:calc(4px + env(safe-area-inset-bottom,0px))!important}\n #ascensionXOverlay.sx-ascension-quick .ascensionx-embedded-toolbar{min-height:42px!important;padding:4px 8px!important}\n}\n";
ascensionStyle.textContent+='\n'+"\n/* Build 265: one header only. AscensionX's own header and navigation own the\n   entire embedded viewport; remove the duplicate SpartanX Tools toolbar. */\n#ascensionXOverlay .ascensionx-embedded-toolbar{display:none!important}\n#ascensionXOverlay,\n#ascensionXOverlay.sx-ascension-quick{\n inset:0!important;width:100vw!important;height:100dvh!important;\n max-width:100vw!important;max-height:100dvh!important;\n padding:0!important;margin:0!important;\n align-items:stretch!important;justify-content:stretch!important;\n background:var(--bg,#08090c)!important;backdrop-filter:none!important\n}\n#ascensionXOverlay .sx-ascension-window,\n#ascensionXOverlay.sx-ascension-quick .sx-ascension-window{\n flex:1 1 auto!important;display:flex!important;flex-direction:column!important;\n width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;\n min-width:0!important;min-height:0!important;overflow:hidden!important;\n padding:0!important;margin:0!important;\n border:0!important;border-radius:0!important;box-shadow:none!important\n}\n#ascensionXOverlay #ascensionXEmbedFrame{\n flex:1 1 auto!important;width:100%!important;height:0!important;\n min-height:0!important;max-height:100%!important;overflow:hidden!important\n}\n";
ascensionStyle.textContent+=`
#ascensionXOverlay,#ascensionXOverlay.sx-ascension-quick{
 top:var(--sx-asc-viewport-top,0px)!important;bottom:auto!important;
 height:var(--sx-asc-viewport-height,100dvh)!important;
 max-height:var(--sx-asc-viewport-height,100dvh)!important
}
#ascensionXOverlay .sx-ascension-window,
#ascensionXOverlay.sx-ascension-quick .sx-ascension-window{
 height:100%!important;max-height:100%!important
}`;
shadow.appendChild(ascensionStyle);
ascensionPortal.appendChild(ascensionStyle.cloneNode(true));

const ascensionRootStyle=document.createElement('style');
ascensionRootStyle.textContent='body.sx-ascensionx-open #trackerNav, body.sx-ascensionx-open .minimized-session{display:none!important}';
document.head.appendChild(ascensionRootStyle);

const ascensionEmbedFrame=ascensionPortal.getElementById('ascensionXEmbedFrame');
const ascensionOpenButton=$('openAscensionX');
const ascensionCloseButton=ascensionPortal.getElementById('closeAscensionX');
function syncAscensionViewport(){
 const viewport=window.visualViewport;
 const height=viewport?.height||window.innerHeight||document.documentElement.clientHeight;
 const top=viewport?.offsetTop||0;
 if(Number.isFinite(height)&&height>0)
  ascensionPortalHost.style.setProperty('--sx-asc-viewport-height',Math.round(height)+'px');
 ascensionPortalHost.style.setProperty('--sx-asc-viewport-top',Math.max(0,Math.round(top))+'px');
}
syncAscensionViewport();
window.visualViewport?.addEventListener('resize',syncAscensionViewport,{passive:true});
window.visualViewport?.addEventListener('scroll',syncAscensionViewport,{passive:true});
window.addEventListener('resize',syncAscensionViewport,{passive:true});
window.addEventListener('orientationchange',syncAscensionViewport,{passive:true});

function syncEmbeddedAscensionTheme(){
 let theme=document.body.dataset.activeTheme||'dark';
 if(!document.body.dataset.activeTheme){
  try{
   const p=JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}');
   if(typeof p.theme==='string')theme=p.theme;
  }catch(e){}
 }
 // The portal lives in its own shadow root; pass the active parent colours
 // through its host so the toolbar and frame chrome match SpartanX.
 const computed=getComputedStyle(document.body);
 for(const key of ['--bg','--panel','--panel2','--line','--txt','--muted','--lime']){
  const value=computed.getPropertyValue(key).trim();
  if(value)ascensionPortalHost.style.setProperty(key,value);
 }
 if(theme==='sx-halo'||theme==='sx-goku')theme='dark';
 if(ascensionEmbedFrame.getAttribute('src')!=='about:blank'){
  // The iframe is same-origin and owned by SpartanX. Set its theme attribute
  // directly after load as well as messaging, avoiding a stale visual state
  // if its initial handshake is delayed during iOS PWA restoration.
  if(ascensionEmbedReadyForShortcut){
   try{
    const childBody=ascensionEmbedFrame.contentDocument?.body;
    if(childBody)childBody.dataset.spartxParentTheme=theme;
   }catch(e){}
  }
  try{ascensionEmbedFrame.contentWindow?.postMessage(
   {type:'spartx:applyParentTheme',theme},location.origin);}catch(e){}
 }
}
new MutationObserver(syncEmbeddedAscensionTheme).observe(document.body,{attributes:true,attributeFilter:['data-active-theme']});
window.addEventListener('pageshow',syncEmbeddedAscensionTheme);
window.addEventListener('spartx:preferencesChanged',syncEmbeddedAscensionTheme);
window.addEventListener('storage',e=>{
 if(e.key==='spartx_preferences_v1')syncEmbeddedAscensionTheme();
});

let ascensionReturnScroll=0,ascensionOldBodyOverflow='',ascensionOldHtmlOverflow='';
let ascensionPreviousBodyLayout=null;
let ascensionQuickCaller=null,ascensionQuickPending=null,ascensionEmbedReadyForShortcut=false;
function deliverAscensionShortcut(){
 if(!ascensionQuickPending||!ascensionEmbedReadyForShortcut||!ascensionOverlay.classList.contains('open'))return;
 const destination=ascensionQuickPending;ascensionQuickPending=null;
 try{ascensionEmbedFrame.contentWindow?.postMessage({type:'spartx:ascensionQuickNavigate',mode:destination.mode,lift:destination.lift,quickImport:destination.quickImport===true},location.origin)}catch(e){}
}
window.spartanxOpenEmbeddedAscensionX=(mode='home',lift=null,context='auto')=>{
 const option=mode==='continue'?'continue':'home';
 ascensionQuickCaller=document.activeElement;
 const current=document.querySelector('.screen.active')?.id;
 const fromActiveSession=current==='activeWorkout';
 const fromNewWorkout=context==='new-workout'&&current==='workout';
 const quick=fromActiveSession||fromNewWorkout;
 ascensionOverlay.classList.toggle('sx-ascension-quick',quick);
 ascensionQuickPending={mode:option,lift:typeof lift==='string'?lift:null,quickImport:quick};
 ascensionCloseButton.textContent=quick?'← Back':'← TOOLS';
 ascensionCloseButton.setAttribute('aria-label',quick?'Back to workout choices':'Close AscensionX and return to Training Tools');
 openEmbeddedAscensionX();
 if(!ascensionOverlay.classList.contains('open')){ascensionQuickPending=null;return false}
 deliverAscensionShortcut();
 return true;
};

function openEmbeddedAscensionX(){
 syncAscensionViewport();
 if(ascensionOverlay.classList.contains('open'))return;
 if(shadow.querySelector('main').classList.contains('reorder-mode'))return;
 ascensionReturnScroll=window.scrollY||document.documentElement.scrollTop||0;
 ascensionOldBodyOverflow=document.body.style.overflow;
 ascensionOldHtmlOverflow=document.documentElement.style.overflow;
 ascensionPreviousBodyLayout={};
 for(const key of ['position','top','left','right','width'])ascensionPreviousBodyLayout[key]=document.body.style[key];
 document.body.classList.add('sx-ascensionx-open');
 // Fixed-body lock prevents iOS/PWA rubber-band scrolling behind the active modal.
 Object.assign(document.body.style,{position:'fixed',top:'-'+ascensionReturnScroll+'px',left:'0',right:'0',width:'100%',overflow:'hidden'});
 document.documentElement.style.overflow='hidden';
 ascensionOverlay.classList.add('open');
 ascensionOverlay.setAttribute('aria-hidden','false');
 syncEmbeddedAscensionTheme();
 // Load only on first open; reopening preserves the full AscensionX session.
 if(ascensionEmbedFrame.getAttribute('src')==='about:blank'){
  ascensionEmbedFrame.src='./AscensionX/index.html?from=spartanx&v=271';
 }
 // The wrapper toolbar is hidden; focus the labelled dialog instead.
 ascensionOverlay.focus({preventScroll:true});
}
function closeEmbeddedAscensionX(){
 if(!ascensionOverlay.classList.contains('open'))return;
 ascensionOverlay.classList.remove('open','sx-ascension-quick');
 ascensionOverlay.setAttribute('aria-hidden','true');
 if(ascensionEmbedFrame.getAttribute('src')!=='about:blank'){
  try{ascensionEmbedFrame.contentWindow?.postMessage({type:'spartx:ascensionQuickExit'},location.origin)}catch(e){}
 }
 document.body.classList.remove('sx-ascensionx-open');
 document.body.style.overflow=ascensionOldBodyOverflow;
 if(ascensionPreviousBodyLayout){
  for(const key of ['position','top','left','right','width'])document.body.style[key]=ascensionPreviousBodyLayout[key];
  ascensionPreviousBodyLayout=null;
 }
 document.documentElement.style.overflow=ascensionOldHtmlOverflow;
 window.scrollTo(0,ascensionReturnScroll);
 requestAnimationFrame(()=>window.scrollTo(0,ascensionReturnScroll));
 const returnTarget=ascensionQuickCaller?.isConnected?ascensionQuickCaller:ascensionOpenButton;
 ascensionQuickCaller=null;ascensionQuickPending=null;
 ascensionCloseButton.textContent='← TOOLS';
 ascensionCloseButton.setAttribute('aria-label','Close AscensionX and return to Training Tools');
 if(returnTarget?.isConnected)returnTarget.focus({preventScroll:true});
 window.dispatchEvent(new CustomEvent('spartx:ascensionCycleUpdated'));
}
ascensionOpenButton.addEventListener('click',()=>{ascensionQuickCaller=null;ascensionQuickPending=null;ascensionOverlay.classList.remove('sx-ascension-quick');ascensionCloseButton.textContent='← TOOLS';openEmbeddedAscensionX()});
function exitAscensionToCaller(){
 const backToChoices=ascensionOverlay.classList.contains('sx-ascension-quick');
 closeEmbeddedAscensionX();
 if(backToChoices)window.dispatchEvent(new CustomEvent('spartx:showSessionOptions'));
}
ascensionCloseButton.addEventListener('click',exitAscensionToCaller);
ascensionOverlay.addEventListener('click',e=>{
 if(e.target===ascensionOverlay&&ascensionOverlay.classList.contains('sx-ascension-quick'))exitAscensionToCaller();
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&ascensionOverlay.classList.contains('open')){
  e.preventDefault();exitAscensionToCaller();
 }
});
window.spartanxCloseEmbeddedAscensionX=closeEmbeddedAscensionX;
// Handshake only with the AscensionX iframe owned by this Tools card.
ascensionEmbedFrame.addEventListener('load',()=>{
 if(ascensionEmbedFrame.getAttribute('src')==='about:blank')return;
 ascensionEmbedReadyForShortcut=true;
 try{ascensionEmbedFrame.contentWindow?.postMessage({type:'spartx:ascensionEmbedReady'},location.origin)}catch(e){}
 syncEmbeddedAscensionTheme();
 deliverAscensionShortcut();
});
window.addEventListener('message',e=>{
 if(e.origin!==location.origin || e.source!==ascensionEmbedFrame.contentWindow || !ascensionOverlay.classList.contains('open'))return;
 if(e.data?.type==='spartx:ascensionRequestClose'){
  exitAscensionToCaller();return;
 }
 if(e.data?.type==='spartx:ascensionQuickCancel'&&ascensionOverlay.classList.contains('sx-ascension-quick')){
  exitAscensionToCaller();return;
 }
 if(e.data?.type==='spartx:ascensionEmbedAcknowledged'){
  syncEmbeddedAscensionTheme();
  return;
 }
 if(e.data?.type!=='spartx:ascensionImportWorkout')return;
 const p=e.data.payload||{},requestId=e.data.requestId;
 const allowed=['Back Squat','Bench Press','Deadlift','Overhead Press'];
 const validSet=x=>Number.isFinite(Number(x?.weight))&&Number(x.weight)>0&&Number.isInteger(Number(x?.reps))&&Number(x.reps)>0;
 const valid=p.source==='AscensionX'&&allowed.includes(p.exercise)&&typeof p.cycleId==='string'&&Number.isFinite(Date.parse(p.cycleId))&&Number.isInteger(p.week)&&p.week>=1&&p.week<=6&&Number(p.tm)>0&&
  Array.isArray(p.warmupSets)&&p.warmupSets.length===4&&p.warmupSets.every(validSet)&&
  Array.isArray(p.sets)&&p.sets.length>0&&p.sets.length<=8&&p.sets.every(validSet);
 let success=false,message='Check your training max and set targets in AscensionX.';
 if(valid){
  try{
   success=typeof window.spartanxImport531==='function'&&window.spartanxImport531(p);
   if(!success)message='SpartanX could not start the workout. Try reopening SpartanX.';
  }catch(err){message='SpartanX could not import this workout. No sets were saved.';}
 }
 try{ascensionEmbedFrame.contentWindow?.postMessage({type:'spartx:ascensionImportResult',requestId,success,message},location.origin)}catch(e){}
 if(success){
  // Return to SpartanX's active workout, not the old Tools scroll position.
  ascensionReturnScroll=0;
  closeEmbeddedAscensionX();
  requestAnimationFrame(()=>{
   window.scrollTo(0,0);
   document.getElementById('activeWorkoutName')?.focus({preventScroll:true});
  });
 }
});


// Preload the original app to prevent a blank iframe on first launch.
window.addEventListener('load',()=>{
 if(ascensionEmbedFrame.getAttribute('src')==='about:blank')
  ascensionEmbedFrame.src='./AscensionX/index.html?from=spartanx&v=271';
},{once:true});

// The child stays mounted after leaving its overlay. Notify it immediately
// after saving a linked SpartanX workout; the durable queue also survives reloads.
window.addEventListener('spartx:ascensionLinkedSessionSaved',()=>{
 if(ascensionEmbedFrame.getAttribute('src')==='about:blank')return;
 try{ascensionEmbedFrame.contentWindow?.postMessage({type:'spartx:ascensionProcessCompletedWorkouts'},location.origin)}catch(e){}
});

// Every Training Tools card can be minimised independently. Remember each choice on this device.
(function setupCollapsibleCards(){
 const cards=[...shadow.querySelectorAll('main > .card')];


 let saved={};
 try{saved=JSON.parse(localStorage.getItem('spartxToolsCardStates')||'{}')||{};}catch(e){}
 cards.forEach((card,index)=>{
  const head=card.querySelector('.card-head');
  if(!head)return;
  const key=card.id||card.getAttribute('aria-labelledby')||('tool-card-'+index);
  const button=document.createElement('button');
  button.type='button';
  button.className='card-collapse';
  button.setAttribute('aria-controls',key+'-content');
  button.setAttribute('aria-label','Minimise '+(head.querySelector('h2')?.textContent||'tool'));
  button.title='Minimise card';
  button.textContent='−';
  head.appendChild(button);
  const contentWrap=document.createElement('div');
  contentWrap.id=key+'-content';
  contentWrap.className='card-content';
  while(head.nextSibling)contentWrap.appendChild(head.nextSibling);
  card.appendChild(contentWrap);
  const setCollapsed=collapsed=>{
   card.classList.toggle('is-collapsed',collapsed);
   button.textContent=collapsed?'+':'−';
   button.title=collapsed?'Expand card':'Minimise card';
   const name=head.querySelector('h2')?.textContent||'tool';
   button.setAttribute('aria-label',(collapsed?'Expand ':'Minimise ')+name);
   button.setAttribute('aria-expanded',String(!collapsed));
   saved[key]=collapsed;
   try{localStorage.setItem('spartxToolsCardStates',JSON.stringify(saved));}catch(e){}
  };
  setCollapsed(saved[key]===true);
  button.addEventListener('click',()=>setCollapsed(!card.classList.contains('is-collapsed')));
 });
})();

 // Reorder tools by dragging the highlighted card itself.
 (function setupToolReordering(){
  const main=shadow.querySelector('main'),toggle=$('reorderMenuButton'),bar=$('reorderMenuBar');
  if(!main||!toggle||!bar)return;
  const getCards=()=>Array.from(main.children).filter(el=>el.classList&&el.classList.contains('card'));
  const keyFor=(card,index)=>card.id||card.getAttribute('aria-labelledby')||('tool-card-'+index);
  let originalOrder=[],activeCard=null,pointerId=null;
  const currentOrder=()=>getCards().map((card,index)=>keyFor(card,index));
  function setMode(on){
   main.classList.toggle('reorder-mode',on);bar.classList.toggle('active',on);toggle.hidden=on;
   getCards().forEach(card=>card.classList.toggle('reorder-enabled',on));
   bar.querySelector('.reorder-message').textContent=on?'Press and drag any highlighted card to change its position.':'';
  }
  function restoreOrder(order){
   const cards=getCards(),map=new Map(cards.map((card,index)=>[keyFor(card,index),card]));
   order.forEach(key=>{const card=map.get(key);if(card){main.appendChild(card);map.delete(key);}});
   map.forEach(card=>main.appendChild(card));
  }
  try{const stored=JSON.parse(localStorage.getItem('spartxToolsCardOrder')||'[]');if(Array.isArray(stored)&&stored.length)restoreOrder(stored);}catch(e){}
  toggle.addEventListener('click',()=>{originalOrder=currentOrder();setMode(true);});
  $('cancelToolOrder').addEventListener('click',()=>{finishDrag();restoreOrder(originalOrder);setMode(false);});
  $('saveToolOrder').addEventListener('click',()=>{
   finishDrag();
   try{localStorage.setItem('spartxToolsCardOrder',JSON.stringify(currentOrder()));}catch(e){}
   setMode(false);
  });
  function finishDrag(){
   if(!activeCard)return;
   activeCard.classList.remove('reorder-active');
   try{if(main.hasPointerCapture(pointerId))main.releasePointerCapture(pointerId);}catch(e){}
   activeCard=null;pointerId=null;
  }
  // Capture the pointer on MAIN, not on the card being moved. This keeps
  // pointermove events flowing while cards are reinserted in the DOM.
  main.addEventListener('pointerdown',e=>{
   if(!main.classList.contains('reorder-mode')||activeCard)return;
   const card=e.target instanceof Element?e.target.closest('.card'):null;
   if(!card||card.parentElement!==main||e.target.closest('button,a,input,select,textarea,label'))return;
   if(e.pointerType==='mouse'&&e.button!==0)return;
   e.preventDefault();
   if(window.getSelection)window.getSelection().removeAllRanges();
   activeCard=card;pointerId=e.pointerId;
   card.classList.add('reorder-active');
   try{main.setPointerCapture(pointerId);}catch(err){}
  },true);
  main.addEventListener('pointermove',e=>{
   if(!activeCard||e.pointerId!==pointerId)return;
   e.preventDefault();
   const cards=getCards().filter(card=>card!==activeCard);
   let before=null;
   for(const card of cards){
    const rect=card.getBoundingClientRect();
    if(e.clientY<rect.top+rect.height/2){before=card;break;}
   }
   if(before)main.insertBefore(activeCard,before);
   else main.appendChild(activeCard);
  },true);
  main.addEventListener('pointerup',e=>{if(activeCard&&e.pointerId===pointerId)finishDrag();},true);
  main.addEventListener('pointercancel',e=>{if(activeCard&&e.pointerId===pointerId)finishDrag();},true);
  main.addEventListener('lostpointercapture',()=>{if(activeCard)finishDrag();},true);
  setMode(false);
 })();

$('ormResult').textContent='—';$('plateTotal').textContent='—';$('plates').replaceChildren();$('plateHint').textContent='Enter a target weight and bar weight to calculate the plates.';$('applyLift').value='Back Squat';if(!$('bar').value)$('bar').value='20';

const plateColors={25:{fill:'#d62828',text:'#ffffff'},20:{fill:'#1769aa',text:'#ffffff'},15:{fill:'#f4d03f',text:'#171717'},10:{fill:'#238b45',text:'#ffffff'},5:{fill:'#f1f3f5',text:'#171717'},2.5:{fill:'#f28c28',text:'#171717'},1.25:{fill:'#7e57c2',text:'#ffffff'}};
const fmt=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:2});let unitPrefs={weight:'kg'};try{unitPrefs={...unitPrefs,...JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}')}}catch(e){}const fromKg=n=>unitPrefs.weight==='lb'?n*2.2046226218:n,toKg=n=>unitPrefs.weight==='lb'?n/2.2046226218:n,unit=()=>unitPrefs.weight==='lb'?'lbs':'kg';
function calcOrm(){const w=toKg(+$('ormWeight').value),r=Math.max(1,Math.min(12,+$('ormReps').value||1));$('ormResult').textContent=w>0?fmt(fromKg(w*(1+r/30)))+' '+unit():'—';}
function calcTrainingMaxFinder(){const oneRm=toKg(+$('tmFinderOneRm').value);$('tm').value=oneRm>0?fmt(fromKg(Math.round((oneRm*.9)/2.5)*2.5)):'';calc531();saveCalculatorInputs();}

const TOOL_VISIBILITY_KEY='spartxTrainingToolVisibility';
let toolVisibility={workingWeights:true,cyclePlanner:true};
try{toolVisibility={...toolVisibility,...JSON.parse(localStorage.getItem(TOOL_VISIBILITY_KEY)||'{}')}}catch(e){}
function applyToolVisibility(){
 const weights=$('531Title')?.closest('.card'),cycle=$('cyclePlannerCard');
 if(weights)weights.hidden=toolVisibility.workingWeights===false;
 if(cycle)cycle.hidden=toolVisibility.cyclePlanner===false;
}
applyToolVisibility();
window.addEventListener('spartx:toolVisibilityChanged',e=>{toolVisibility={...toolVisibility,...(e.detail||{})};applyToolVisibility();});
const defaultSettings={warmup:true,diagram:true,trainingMaxFinder:true,plates:{25:true,20:true,15:true,10:true,5:true,2.5:true,1.25:true}};
let settings={...defaultSettings,plates:{...defaultSettings.plates}};
try{const saved=JSON.parse(localStorage.getItem('spartxToolsSettings')||'null');if(saved)settings={...settings,...saved,plates:{...defaultSettings.plates,...(saved.plates||{})}};}catch(e){}
function saveSettings(){try{localStorage.setItem('spartxToolsSettings',JSON.stringify(settings));}catch(e){}}
function calc531(){const tm=toKg(+$('tm').value),w=+$('week').value,pcts=[[.65,.75,.85],[.70,.80,.90],[.75,.85,.95],[.40,.50,.60]][w-1],reps=[['5','5','5+'],['3','3','3+'],['5','3','1+'],['5','5','5']][w-1];$('wendler').innerHTML=pcts.map((p,i)=>{const load=Math.round(tm*p/2.5)*2.5;return '<div class="calc-row"><div>Set '+(i+1)+'<small>'+Math.round(p*100)+'% · '+reps[i]+' reps</small></div><strong>'+(tm>0?fmt(fromKg(load))+' '+unit():'—')+'</strong></div>';}).join('');
 const warm=$('warmupOutput');warm.hidden=!settings.warmup||w===4;if(settings.warmup&&w!==4){const stages=[{pct:.4,reps:5},{pct:.5,reps:5},{pct:.6,reps:3}].map(x=>({weight:Math.round((tm*x.pct)/2.5)*2.5,reps:x.reps,pct:x.pct,label:Math.round(x.pct*100)+'% of training max'})).filter(x=>tm>0&&x.weight>0);const firstWorking=tm>0?Math.round((tm*pcts[0])/2.5)*2.5:0;const bridge=firstWorking>0?Math.round((firstWorking*.875)/2.5)*2.5:0;if(w===3&&bridge>0&&(!stages.length||bridge>stages[stages.length-1].weight)){stages.push({weight:bridge,reps:1,label:'87.5% of first working set'});}warm.innerHTML='<div class="warmup-title">SUGGESTED WARM-UP - BASED ON YOUR TRAINING MAX</div>'+stages.map((x,i)=>'<div class="calc-row"><div>Warm-up '+(i+1)+'<small>'+x.label+' · '+x.reps+' reps</small></div><strong>'+fmt(x.weight)+' kg</strong></div>').join('')+'<div class="hint">Keep every rep crisp and comfortable.'+(w===3?' The final ramp-up set bridges the gap to your first working set ('+fmt(firstWorking)+' kg).':'')+'</div>';}}

function renderPlateDiagram(loaded){
 const svg=$('plateDiagram');if(!svg)return;
 
 const plateWidth=size=>size>=25?16:size>=20?14:size>=15?12:size>=10?10:size>=5?8:7;
 const rawWidth=loaded.reduce((sum,p)=>sum+p.count*plateWidth(p.size),0);
 const scale=Math.min(1,88/Math.max(1,rawWidth));
 const totalWidth=rawWidth*scale;
 let left='',right='',offset=0;
 // Plates are packed against the collars at the outer ends of each sleeve.
 // The largest plate sits innermost; progressively smaller plates sit outboard.
 loaded.forEach(({size,count})=>{
  const w=plateWidth(size)*scale;
  const h=Math.max(32,Math.min(88,34+size*2.0));
  const y=(116-h)/2;
  const color=(plateColors[size]||{fill:'#9ca6b1'}).fill;
  for(let i=0;i<count;i++){
   const rx=370-totalWidth+offset;
   const lx=70+totalWidth-offset-w;
   right+=`<rect x="${rx.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="3" fill="${color}" stroke="#20262b" stroke-width="1.5"/><rect x="${(rx+w*.22).toFixed(2)}" y="52" width="${(w*.56).toFixed(2)}" height="12" rx="3" fill="#3d454e" opacity=".85"/>`;
   left+=`<rect x="${lx.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="3" fill="${color}" stroke="#20262b" stroke-width="1.5"/><rect x="${(lx+w*.22).toFixed(2)}" y="52" width="${(w*.56).toFixed(2)}" height="12" rx="3" fill="#3d454e" opacity=".85"/>`;
   offset+=w;
  }
 });
 // Bar shaft, sleeves and end caps are drawn first so the plates sit on top.
 const collarLeft=63;
 const collarRight=370;
 svg.innerHTML=
  '<rect x="20" y="54" width="400" height="8" rx="4" fill="#aeb7c0"/>'+
  '<rect x="70" y="51" width="100" height="14" rx="3" fill="#aeb7c0"/>'+
  '<rect x="270" y="51" width="100" height="14" rx="3" fill="#aeb7c0"/>'+
  '<rect x="170" y="47" width="100" height="22" rx="6" fill="#737d87"/>'+
  left+right;
 $('plateDiagramCaption').textContent=loaded.length?loaded.map(p=>p.count+' × '+fmt(fromKg(p.size))+' '+unit()).join(' · ')+' per side':'No plates required — bar only';
}
function calcPlates(){const target=toKg(+$('target').value),bar=toKg(+$('bar').value);const out=$('plates');out.innerHTML='';if($('target').value.trim()===''||$('bar').value.trim()===''){$('plateTotal').textContent='—';$('plateHint').textContent='Enter a target weight and bar weight to calculate the plates.';renderPlateDiagram([]);return;}if(target<bar){$('plateTotal').textContent='—';$('plateHint').textContent='Target weight cannot be lower than the bar weight.';renderPlateDiagram([]);return;}let rem=(target-bar)/2,loaded=[];$('plateTotal').textContent=fmt(fromKg(rem))+' '+unit()+' per side';const sizes=[25,20,15,10,5,2.5,1.25].filter(p=>settings.plates[p]);sizes.forEach(p=>{const n=Math.floor((rem+0.0001)/p);if(n>0){const chip=document.createElement('span');chip.className='plate';chip.textContent=n+' × '+fmt(fromKg(p))+' '+unit();chip.style.backgroundColor=plateColors[p].fill;chip.style.color=plateColors[p].text;out.appendChild(chip);loaded.push({size:p,count:n});rem=+(rem-n*p).toFixed(4);}});renderPlateDiagram(loaded);$('plateHint').textContent=rem>.01?'Unmatched: '+fmt(fromKg(rem))+' '+unit()+' per side. Enable more plate sizes in settings or check the target/bar weight.':'Plates required per side, using your enabled plate sizes.';}
$('plateDiagramWrap').style.display=settings.diagram?'block':'none';
// Training Max is integrated into 5/3/1 Working Weights.
// Keep calculator entries while navigating to Settings and back in the same app session.
const calculatorInputIds=['ormWeight','ormReps','tmFinderOneRm','tmFinderRound','tm','applyLift','week','target','bar'];
const tracked531Lifts=['Back Squat','Bench Press','Conventional Deadlift'];
// Save each lift's actual 1RM in kg so values survive an exercise switch,
// reopening SpartanX, and a future kg/lb preference change.
let savedCalculatorInputs=null;
try{savedCalculatorInputs=JSON.parse(localStorage.getItem('spartxToolsInputs')||'null');}catch(e){}
const savedLiftMaxes=savedCalculatorInputs?.oneRmsByLiftKg;
const oneRmsByLiftKg={};
if(savedLiftMaxes&&typeof savedLiftMaxes==='object'&&!Array.isArray(savedLiftMaxes)){
 tracked531Lifts.forEach(lift=>{
  const n=Number(savedLiftMaxes[lift]);
  if(savedLiftMaxes[lift]!==''&&Number.isFinite(n)&&n>0)oneRmsByLiftKg[lift]=n;
 });
}
if(savedCalculatorInputs&&typeof savedCalculatorInputs==='object'){
 calculatorInputIds.forEach(id=>{
  if(!Object.prototype.hasOwnProperty.call(savedCalculatorInputs,id))return;
  if(id==='tmFinderRound')$(id).checked=savedCalculatorInputs[id]===true||savedCalculatorInputs[id]==='true';
  else if(id==='applyLift'){
   if(tracked531Lifts.includes(savedCalculatorInputs[id]))$(id).value=savedCalculatorInputs[id];
  }else $(id).value=savedCalculatorInputs[id];
 });
}
if(!$('bar').value)$('bar').value='20';
let active531Lift=$('applyLift').value;
// Migrate the older single saved 1RM once. That version always defaulted to
// Squat; never copy that legacy value into Bench or Deadlift automatically.
if(!savedLiftMaxes){
 const oldOneRm=Number(savedCalculatorInputs?.tmFinderOneRm);
 if(Number.isFinite(oldOneRm)&&oldOneRm>0)oneRmsByLiftKg[active531Lift]=toKg(oldOneRm);
}
function rememberActive531OneRm(){
 const raw=$('tmFinderOneRm').value.trim();
 if(raw===''){delete oneRmsByLiftKg[active531Lift];return;}
 // Don't re-convert an unchanged formatted value: kg → lb → kg rounding
 // must never gradually alter the stored 1RM across app reloads.
 const saved=oneRmsByLiftKg[active531Lift];
 if(Number.isFinite(saved)&&saved>0&&raw===String(Number(fromKg(saved).toFixed(2))))return;
 const displayValue=Number(raw);
 if(Number.isFinite(displayValue)&&displayValue>0)oneRmsByLiftKg[active531Lift]=toKg(displayValue);
}
function restore531OneRm(lift){
 const saved=oneRmsByLiftKg[lift];
 $('tmFinderOneRm').value=Number.isFinite(saved)&&saved>0?String(Number(fromKg(saved).toFixed(2))):'';
 calcTrainingMaxFinder();
}
function saveCalculatorInputs(){
 try{
  rememberActive531OneRm();
  const values={};
  calculatorInputIds.forEach(id=>{values[id]=id==='tmFinderRound'?$(id).checked:$(id).value;});
  values.oneRmsByLiftKg={...oneRmsByLiftKg};
  localStorage.setItem('spartxToolsInputs',JSON.stringify(values));
 }catch(e){}
}
restore531OneRm(active531Lift);
calculatorInputIds.filter(id=>id!=='applyLift').forEach(id=>$(id).addEventListener('input',saveCalculatorInputs));
calculatorInputIds.filter(id=>id!=='applyLift').forEach(id=>$(id).addEventListener('change',saveCalculatorInputs));
$('applyLift').addEventListener('change',()=>{
 rememberActive531OneRm();
 active531Lift=$('applyLift').value;
 restore531OneRm(active531Lift);
});
window.addEventListener('spartx:531OneRmUpdated',e=>{
 const lift=e.detail?.lift,rm=Number(e.detail?.oneRm);
 if(!tracked531Lifts.includes(lift)||!(rm>0)||!Number.isFinite(rm))return;
 oneRmsByLiftKg[lift]=rm;
 if(active531Lift===lift){
  $('tmFinderOneRm').value=String(Number(fromKg(rm).toFixed(2)));
  calcTrainingMaxFinder();
 }
});

window.addEventListener('pagehide',saveCalculatorInputs);
// Select the existing value when a numeric field receives focus, so a new entry replaces it.
shadow.querySelectorAll('input[type="number"]').forEach(input=>input.addEventListener('focus',()=>input.select()));
$('tmFinderOneRm').addEventListener('input',calcTrainingMaxFinder);
['ormWeight','ormReps'].forEach(id=>$(id).addEventListener('input',calcOrm));['tm'].forEach(id=>$(id).addEventListener('input',calc531));$('week').addEventListener('change',calc531);
function apply531ToWorkout(){
 const tm=toKg(+$('tm').value),w=+$('week').value;if(!(tm>0)){$('applyHint').textContent='Enter a training max first.';return;}
 const pcts=[[.65,.75,.85],[.70,.80,.90],[.75,.85,.95],[.40,.50,.60]][w-1],reps=[['5','5','5+'],['3','3','3+'],['5','3','1+'],['5','5','5']][w-1];
 const sets=pcts.map((p,i)=>({weight:Math.round(tm*p/2.5)*2.5,reps:reps[i].replace('+',''),rpe:'',type:'Working Set',done:false}));
 const warmupSets=[];
 if(settings.warmup&&w!==4){
  [{pct:.4,reps:5},{pct:.5,reps:5},{pct:.6,reps:3}].forEach(x=>{const weight=Math.round((tm*x.pct)/2.5)*2.5;if(weight>0)warmupSets.push({weight,reps:x.reps});});
  if(w===3){const firstWorking=sets[0]?.weight||0;const bridge=Math.round((firstWorking*.875)/2.5)*2.5;if(bridge>0&&(!warmupSets.length||bridge>warmupSets[warmupSets.length-1].weight))warmupSets.push({weight:bridge,reps:1});}
 }
 const detail={exercise:$('applyLift').value,week:w,weekLabel:['5s','3s','5/3/1','Deload'][w-1],tm,warmupSets,sets};
 const imported=typeof window.spartanxImport531==='function'&&window.spartanxImport531(detail);
 $('applyHint').textContent=window.spartanx531StartPending
  ?'Review the workout details and confirm to start.'
  :imported?'Added '+detail.exercise+' · Week '+w+' to your workout.'
  :'Could not connect to the workout logger. Refresh the tracker and try again.';
}
$('apply531').addEventListener('click',apply531ToWorkout);
$('quickCreate531Cycle').addEventListener('click',()=>{
 const currentTm=toKg(Number($('tm').value)),rm=toKg(Number($('tmFinderOneRm').value));
 // The planner also supports entering a new 1RM from scratch; no TM prerequisite.
 // Open the existing 4 / 8 / 12 week planner; never duplicate its saved data.
 window.dispatchEvent(new CustomEvent('spartx:create531CycleFromCalculator',{
  detail:{lift:$('applyLift').value,tm:currentTm,oneRm:rm>0?rm:null}
 }));
});
$('target').addEventListener('input',calcPlates);$('bar').addEventListener('input',calcPlates);
calcOrm();calcTrainingMaxFinder();calc531();calcPlates();
window.addEventListener('spartx:preferencesChanged',e=>{const next=e.detail?.weight||'kg',old=unitPrefs.weight||'kg';if(next!==old){const factor=next==='lb'?2.2046226218:1/2.2046226218;['ormWeight','tmFinderOneRm','tm','target','bar'].forEach(id=>{const el=$(id);if(el.value!=='')el.value=fmt(+el.value*factor)});unitPrefs.weight=next;saveCalculatorInputs();}const finderLabel=shadow.querySelector('label[for="tmFinderOneRm"]');if(finderLabel)finderLabel.textContent='One-rep max ('+unit()+')';const labels=[['ormWeight','Weight ('+unit()+')'],['tm','Training max ('+unit()+')'],['target','Target bar weight ('+unit()+')'],['bar','Bar weight ('+unit()+')']];labels.forEach(([id,value])=>{const label=shadow.querySelector('label[for="'+id+'"]');if(label)label.textContent=value});calcOrm();calc531();calcPlates();});

})();
})();