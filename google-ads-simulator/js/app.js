/* Ads Simulator – App: Startbildschirm, Spielschleife, Speichern/Laden */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, R = G.R, UI = G.UI, ACT = G.ACT, APP = G.APP;
  const esc = U.esc, f = U.fmt;
  const APPX = (G.APPX = {});
  const SAVE_KEY = 'gads-sim-save-v1';

  // ---------- Speicher (IndexedDB mit localStorage-Fallback) ----------
  function idb() {
    return new Promise((res, rej) => {
      if (!globalThis.indexedDB) return rej(new Error('no idb'));
      const r = indexedDB.open('gads-sim', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function kvSet(k, v) {
    try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); return true; }
    catch (e) { try { localStorage.setItem(k, v); return true; } catch (e2) { return false; } }
  }
  async function kvGet(k) {
    try { const db = await idb(); const v = await new Promise((res, rej) => { const tx = db.transaction('kv', 'readonly'); const rq = tx.objectStore('kv').get(k); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); if (v) return v; } catch (e) { /* Fallback */ }
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  async function kvDel(k) {
    try { const db = await idb(); await new Promise((res) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { /* ignore */ }
    try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
  }

  const RT_SKIP = ['ags', 'aud', 'negs', 'invPrep', 'ass', 'locAdj', 'exp', 'd'];
  APPX.serialize = function (S) {
    const slim = { ...S };
    slim.campaigns = S.campaigns.map((c) => { const rt = { ...c.rt }; for (const k of RT_SKIP) delete rt[k]; return { ...c, rt }; });
    slim.adGroups = S.adGroups.map((ag) => { const o = { ...ag }; delete o.rt; return o; });
    slim.keywords = S.keywords.map((k) => { const o = { ...k }; if (o.rt) o.rt = { vol30: o.rt.vol30, firstPage: o.rt.firstPage, topPage: o.rt.topPage }; return o; });
    slim.competitors = S.competitors.map((c) => { const o = { ...c }; delete o.geoSet; return o; });
    delete slim._pauseRequest;
    return JSON.stringify(slim, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v));
  };
  APPX.deserialize = function (txt) {
    const S = JSON.parse(txt);
    if (!S || !S.version || !S.campaigns || !D.IND_BY_ID[S.ind]) throw new Error('Ungültiger Spielstand');
    for (const c of S.campaigns) c.rt = Object.assign({ pot: c.budget, lambda: null, lambdaV: 1, bias: 1, elig7: [] }, c.rt || {});
    return S;
  };
  APPX.save = async function (silent) {
    if (!APP.S || APP.sandbox) return; // Übungsumgebung der Akademie nie speichern
    const ok = await kvSet(SAVE_KEY, APPX.serialize(APP.S));
    if (!silent) UI.toast(ok ? 'Spielstand gespeichert' : 'Speichern fehlgeschlagen – bitte exportieren', ok ? 'good' : 'bad');
  };
  APPX.download = function (name, content, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  // ---------- Simulationsschleife ----------
  const SPEED_MS = { 1: 1500, 2: 500, 3: 140, 4: 0 };
  let timer = null, lastRender = 0;

  function afterDay() {
    const S = APP.S;
    if (S.account.autoApply && S.day % 7 === 0) {
      const recs = R.compute(S).filter((r) => r.apply && !['trk', 'lpspeed'].some((p) => r.id.startsWith(p)));
      for (const r of recs) R.apply(S, r);
      if (recs.length) S.alerts.unshift({ day: S.day, level: 'info', text: `${recs.length} Empfehlung(en) automatisch angewendet` });
    }
    const newEvents = S.market.log.filter((l) => l.day === S.day - 1).length;
    if (newEvents) APP.unreadEvents = (APP.unreadEvents || 0) + newEvents;
    if (S.day % 7 === 0) APPX.save(true);
    if (S._pauseRequest && S.settings.autoPause) {
      const why = S._pauseRequest; S._pauseRequest = null;
      return why;
    }
    return null;
  }

  function simOne() {
    if (APP.S.gameOver) return 'Spiel beendet';
    E.simulateDay(APP.S);
    return afterDay();
  }
  APPX.showGameOver = function () {
    const S = APP.S, go = S.gameOver;
    if (!go || APP._goShown === go.day) return;
    APP._goShown = go.day;
    const title = go.kind === 'insolvent' ? '💸 Insolvenz' : '📦 Gekündigt';
    UI.modal(title, `<p>${U.esc(go.text)}</p><dl class="kv"><dt>Durchgehalten</dt><dd>${go.day} Tage</dd><dt>Gesamtergebnis</dt><dd class="${go.profit >= 0 ? 'up' : 'down'}">${f.eur0(go.profit)}</dd><dt>Bewertete Quartale</dt><dd>${go.quarters}</dd><dt>Punktzahl</dt><dd>${go.score}</dd></dl><div class="callout warn" style="margin-top:12px">Sie können das Konto weiter ansehen und analysieren, aber nicht weiter simulieren.</div>`, { static: true, footer: '<button class="btn" data-act="mclose">Konto ansehen</button><button class="btn primary" data-act="newgame">Neues Spiel</button>' });
  };

  APPX.play = function () {
    if (APP.running) return APPX.pause();
    APP.running = true;
    loop();
    UI.renderTop();
  };
  APPX.pause = function () {
    APP.running = false;
    clearTimeout(timer); timer = null;
    APPX.save(true);
    UI.render();
  };
  function loop() {
    if (!APP.running) return;
    const ms = SPEED_MS[APP.speed];
    let why = null;
    if (ms === 0) {
      const t0 = performance.now();
      do { why = simOne(); } while (!why && performance.now() - t0 < 120);
    } else why = simOne();
    const now = performance.now();
    if (now - lastRender > (ms === 0 ? 200 : 0) || why) { UI.render(); lastRender = now; }
    if (why) { APP.running = false; UI.render(); UI.toast('⏸ Pausiert: ' + why, 'bad'); APPX.showGameOver(); return; }
    timer = setTimeout(loop, ms);
  }
  APPX.step = function (n) {
    if (APP.busy) return;
    if (APP.running) { APP.running = false; clearTimeout(timer); }
    APP.busy = true;
    const bar = document.createElement('div');
    bar.className = 'progress'; bar.innerHTML = '<i style="width:0"></i>';
    document.body.appendChild(bar);
    let done = 0;
    const chunk = () => {
      const t0 = performance.now();
      let why = null;
      while (done < n && performance.now() - t0 < 80) { why = simOne(); done++; if (why) break; }
      bar.firstChild.style.width = (done / n) * 100 + '%';
      if (done < n && !why) { setTimeout(chunk, 0); return; }
      bar.remove(); APP.busy = false;
      UI.render();
      if (why) UI.toast('⏸ Angehalten: ' + why, 'bad');
      APPX.showGameOver();
    };
    chunk();
  };

  Object.assign(ACT, {
    play: () => APPX.play(),
    speed: (el, d) => { APP.speed = +d.v; if (APP.running) { clearTimeout(timer); loop(); } UI.renderTop(); },
    step: (el, d) => APPX.step(+d.n),
    save: () => APPX.save(false),
    export: () => APPX.download(`ads-simulator-${APP.S.company.brand.toLowerCase().replace(/\W+/g, '-')}-tag${APP.S.day}.json`, APPX.serialize(APP.S), 'application/json'),
    chg_import: (el) => {
      if (APP.sandbox) { UI.toast('In der Übungsumgebung nicht verfügbar', 'bad'); return; }
      const file = el.files[0]; if (!file) return;
      file.text().then((txt) => { try { APP.S = APPX.deserialize(txt); APP.scope = { cid: null, agid: null }; APPX.save(true); UI.go('overview'); UI.toast('Spielstand importiert', 'good'); } catch (e) { UI.toast('Import fehlgeschlagen: ' + e.message, 'bad'); } });
    },
    newgame: () => APP.sandbox ? G.ACAD.exit() : UI.confirm('Neues Spiel starten?', 'Der aktuelle Spielstand wird überschrieben. Exportieren Sie ihn vorher, wenn Sie ihn behalten möchten.', () => { APPX.pause(); kvDel(SAVE_KEY); APP.S = null; setTimeout(startScreen, 0); }, 'Neues Spiel'),
  });

  document.addEventListener('keydown', (ev) => {
    if (!APP.S) return;
    const t = ev.target;
    if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
    if (document.getElementById('modal-root').innerHTML) { if (ev.key === 'Escape') UI.closeModal(); return; }
    if (ev.code === 'Space') { ev.preventDefault(); APPX.play(); }
    if (ev.key === '+' || ev.key === 'n') APPX.step(1);
  });
  window.addEventListener('beforeunload', () => { if (APP.S) { try { localStorage.setItem(SAVE_KEY + '-ping', String(APP.S.day)); } catch (e) { /* ignore */ } } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && APP.S) APPX.save(true); });

  // ---------- Startbildschirm ----------
  let startSel = { industry: 'fashion', difficulty: 'normal' };
  async function startScreen() {
    APP.S = null; APP.running = false;
    document.getElementById('topbar').innerHTML = `<div class="brand"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 25 15 7" stroke="#fbbc04" stroke-width="6" stroke-linecap="round"/><path d="M17 7l9 18" stroke="#4285f4" stroke-width="6" stroke-linecap="round"/><circle cx="6.5" cy="24.5" r="3.6" fill="#34a853"/></svg><span class="brand-title" style="display:inline"><b>Ads</b> Simulator</span></div>`;
    document.getElementById('sidenav').innerHTML = '';
    document.getElementById('sidenav').style.display = 'none';
    const saved = await kvGet(SAVE_KEY);
    let savedInfo = null;
    if (saved) { try { const s = JSON.parse(saved); savedInfo = { name: s.company.name, day: s.day, ind: D.IND_BY_ID[s.ind].name, cash: s.company.cash }; } catch (e) { savedInfo = null; } }
    const ind = D.IND_BY_ID[startSel.industry];
    document.getElementById('main').innerHTML = `<div class="start">
      <div class="hero"><svg width="64" height="64" viewBox="0 0 32 32"><path d="M6 25 15 7" stroke="#fbbc04" stroke-width="6" stroke-linecap="round"/><path d="M17 7l9 18" stroke="#4285f4" stroke-width="6" stroke-linecap="round"/><circle cx="6.5" cy="24.5" r="3.6" fill="#34a853"/></svg><div><h1>Google-Ads-Simulator</h1><p>Führen Sie ein Werbekonto in einem lebendigen Markt: echte Auktionsmechanik, Qualitätsfaktor, Smart Bidding, sieben Kampagnentypen, Wettbewerber mit eigener KI, Saisonalität und unvorhersehbare Ereignisse. Ziel: profitables Wachstum.</p></div></div>
      ${savedInfo ? `<div class="card"><div class="bd" style="padding:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div><b>Gespeicherter Spielstand:</b> ${esc(savedInfo.name)} · ${esc(savedInfo.ind)} · Tag ${savedInfo.day} · Kasse ${f.eur0(savedInfo.cash)}</div><button class="btn primary" data-act="resume" style="margin-left:auto">▶ Fortsetzen</button></div></div>` : ''}
      <div class="card"><div class="bd" style="padding:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div><b>📚 Akademie:</b> ${G.ACADEMY_CONTENT.COURSES.length} Lernkurse mit Lektionen, Quiz und Praxisaufgaben – unabhängig vom Spielstand. Mit Hinweisen, wo der Simulator von Google Ads abweicht.</div><button class="btn" data-act="acadopen" style="margin-left:auto">Zur Akademie</button></div></div>
      <div class="card"><div class="hd"><h3>1. Branche wählen</h3></div><div class="bd"><div class="choice indgrid">${D.INDUSTRIES.map((i) => `<button class="opt ${i.id === startSel.industry ? 'on' : ''}" data-act="startind" data-v="${i.id}"><span class="ico">${i.icon}</span><span class="t">${esc(i.name)}</span><span class="d">${esc(i.desc)}</span><span class="d">Ø Warenkorb/Lead-Wert ${f.eur0(i.aov)} · Marge ${f.pct0(i.margin)}</span></button>`).join('')}</div></div></div>
      <div class="card"><div class="hd"><h3>2. Unternehmen & Schwierigkeit</h3></div><div class="bd">
        <div class="row"><div class="field"><span>Marke / Unternehmensname</span><input type="text" id="st-brand" value="${esc(ind.brand.name)}" maxlength="24"></div>
        <div class="field"><span>Schwierigkeit</span><select id="st-diff">${Object.entries(M.DIFFICULTY).map(([k, v]) => `<option value="${k}" ${k === startSel.difficulty ? 'selected' : ''}>${v.name} – Startkapital ${f.eur0(v.cash)}</option>`).join('')}</select></div>
        <div class="field"><span>Startdatum</span><input type="date" id="st-date" value="${ind.startDate || '2026-01-05'}"></div>
        <div class="field"><span>Seed (optional, für reproduzierbare Märkte)</span><input type="number" id="st-seed" placeholder="zufällig"></div></div>
        <label class="chk"><input type="checkbox" id="st-starter" checked> Mit einer einfachen Start-Suchkampagne beginnen (mit Optimierungspotenzial)</label>
        <div style="margin-top:16px"><button class="btn primary" data-act="startgame" style="padding:10px 22px;font-size:15px">Simulation starten</button></div></div></div>
      <div class="card"><div class="hd"><h3>Enthaltene Features</h3></div><div class="bd"><div class="features">
        ${['Such-, Shopping-, Performance-Max-, Display-, Video-, Demand-Gen- & App-Kampagnen', 'Stündliche Auktionen mit Ad Rank & Zweitpreis-CPC', 'Qualitätsfaktor mit 3 Komponenten', '10 Gebotsstrategien inkl. Smart Bidding & Lernphase', 'Keyword-Optionen: genau, Wortgruppe, weitgehend', 'Suchbegriffe & ausschließende Keywords (+ Listen)', 'Responsive Suchanzeigen mit Anzeigenstärke & Pinning', 'Anzeigenprüfung & Richtlinien-Ablehnungen', '10 Asset-Typen (Sitelinks, Anrufe, Bilder …)', 'Zielgruppen: kaufbereit, Interessen, Remarketing, Customer Match, benutzerdefiniert', 'Demografie-, Standort-, Geräte- & Zeitplan-Gebotsanpassungen', 'Budget-Pacing (2×-Regel, 30,4× Monat)', 'Auktionsdaten (Überschneidung, höhere Position …)', 'Wettbewerber-KI mit Budgets, Strategien, Markteintritt & Insolvenz', 'Saisonkalender: Black Week, Weihnachten, Prime Day …', '20+ Zufallsereignisse: Bieterkriege, Serverausfall, Tracking-Fehler, Konjunktur …', 'Conversion-Verzögerung, Consent Mode & Attribution', 'Merchant Center mit Preis-Benchmarks', 'Tests (A/B-Experimente) mit Signifikanz', 'Keyword-Planer mit Prognose', 'Empfehlungen & Optimierungsfaktor', 'Berichte mit CSV-Export, Änderungsverlauf, Abrechnung', 'Unternehmens-GuV: echter Gewinn vs. gemessene Conversions', 'Speichern, Export & Import'].map((x) => `<div>${esc(x)}</div>`).join('')}
      </div></div></div></div>`;
  }
  APPX.startScreen = startScreen;
  Object.assign(ACT, {
    startind: (el, d) => { startSel.industry = d.v; const b = document.getElementById('st-brand'); const keepBrand = b && !D.INDUSTRIES.some((i) => i.brand.name === b.value) ? b.value : null; startScreen().then(() => { if (keepBrand) document.getElementById('st-brand').value = keepBrand; }); },
    startgame: () => {
      const brand = document.getElementById('st-brand').value.trim() || D.IND_BY_ID[startSel.industry].brand.name;
      startSel.difficulty = document.getElementById('st-diff').value;
      const seed = parseInt(document.getElementById('st-seed').value, 10);
      const date = document.getElementById('st-date').value || '2026-01-05';
      APP.S = M.newGame({ industry: startSel.industry, brand, company: brand, difficulty: startSel.difficulty, seed: isFinite(seed) ? seed : undefined, startDate: date, starter: document.getElementById('st-starter').checked });
      APP.scope = { cid: null, agid: null }; APP.view = 'overview'; APP.alertsSeen = 0;
      document.getElementById('sidenav').style.display = '';
      APPX.save(true);
      UI.render(true);
      ACT.help();
    },
    resume: async () => {
      try {
        APP.S = APPX.deserialize(await kvGet(SAVE_KEY));
        document.getElementById('sidenav').style.display = '';
        APP.alertsSeen = APP.S.day;
        if (G.GOALS && APP.S.goals) G.GOALS.enforce(APP.S); // ältere Spielstände reparieren
        UI.render(true);
        APPX.showGameOver();
      } catch (e) { UI.toast('Spielstand konnte nicht geladen werden: ' + e.message, 'bad'); }
    },
  });

  // ---------- Start ----------
  try { const th = localStorage.getItem('gads-sim-theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) { /* ignore */ }
  startScreen();
})();
