/* Ads Simulator – Lernakademie: Kurse, Lektionen, Quiz, Fortschritt & Praxisaufgaben in einer Sandbox (unabhängig vom Spielstand) */
(function () {
  const G = globalThis.GA;
  const U = G.U, M = G.M, UI = G.UI, ACT = G.ACT, APP = G.APP, V = G.V;
  const esc = U.esc;
  const COURSES = G.ACADEMY_CONTENT.COURSES;
  const KEY = 'gads-sim-academy';
  const A = (G.ACAD = {});

  // ---------- Fortschritt (getrennt vom Spielstand) ----------
  let mem = null;
  A.progress = function () {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { mem = null; }
    if (!mem || typeof mem !== 'object') mem = {};
    mem.lessons = mem.lessons || {}; mem.quiz = mem.quiz || {}; mem.missions = mem.missions || {};
    return mem;
  };
  function store() { try { localStorage.setItem(KEY, JSON.stringify(A.progress())); } catch (e) { /* nur im Speicher */ } }
  const course = (id) => COURSES.find((c) => c.id === id);
  const lessonKey = (c, l) => c.id + '.' + l.id;
  A.courseStats = function (c) {
    const P = A.progress();
    const total = c.lessons.length + (c.mission ? 1 : 0);
    const done = c.lessons.filter((l) => P.lessons[lessonKey(c, l)]).length + (c.mission && P.missions[c.id] ? 1 : 0);
    return { done, total, pct: total ? done / total : 0 };
  };

  // ---------- Navigation innerhalb der Akademie ----------
  const nav = (A.nav = { course: null, lesson: null });
  A.standalone = false; // ohne geladenes Spiel (vom Startbildschirm aus)
  A.refresh = function () {
    if (A.standalone) {
      const main = document.getElementById('main');
      main.innerHTML = A.html();
      UI.annotate(main);
    } else UI.renderMain(true);
    window.scrollTo(0, 0);
  };
  A.openStandalone = function () {
    A.standalone = true;
    document.getElementById('topbar').innerHTML = `<div class="brand"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 25 15 7" stroke="#fbbc04" stroke-width="6" stroke-linecap="round"/><path d="M17 7l9 18" stroke="#4285f4" stroke-width="6" stroke-linecap="round"/><circle cx="6.5" cy="24.5" r="3.6" fill="#34a853"/></svg><span class="brand-title" style="display:inline"><b>Ads</b> Simulator · Akademie</span></div><div class="top-spacer"></div><button class="btn" data-act="acadhome">← Startbildschirm</button>`;
    const sn = document.getElementById('sidenav'); sn.innerHTML = ''; sn.style.display = 'none';
    A.refresh();
  };

  // ---------- Darstellung ----------
  const bar = (pct) => `<div class="acad-bar"><i style="width:${Math.round(pct * 100)}%"></i></div>`;
  function head(title, back) {
    return `<div class="pagehead"><div>${back ? `<div class="crumbs">${back}</div>` : ''}<h1>${title}</h1></div><div class="tools">${A.standalone ? '' : '<span class="muted small">Unabhängig vom Spielstand</span>'}</div></div>`;
  }
  A.html = function () {
    const c = nav.course && course(nav.course);
    if (c && nav.lesson) { const l = c.lessons.find((x) => x.id === nav.lesson); if (l) return lessonView(c, l); }
    if (c) return courseView(c);
    return listView();
  };

  function listView() {
    const P = A.progress();
    const all = COURSES.reduce((a, c) => { const s = A.courseStats(c); return [a[0] + s.done, a[1] + s.total]; }, [0, 0]);
    const levels = ['Einsteiger', 'Fortgeschritten', 'Profi', 'Alle'];
    return head('📚 Akademie') + `
      <div class="card"><div class="bd" style="padding:16px">
        <p style="margin-top:0">Lernkurse zu allen wichtigen Google-Ads-Themen – jeweils mit kurzen Lektionen, Wissensquiz und einer <b>Praxisaufgabe in einer eigenen Übungsumgebung</b>. Ihr Spielstand bleibt dabei unberührt; der Lernfortschritt wird separat in diesem Browser gespeichert.</p>
        <div class="callout warn" style="margin-bottom:12px"><b>⚠ Unterschied zum echten Google Ads</b> – Jede Lektion enthält einen solchen Hinweis, wo der Simulator vereinfacht, abweicht oder Dinge zeigt, die es in Google Ads nicht gibt. Der Kurs „Simulator vs. echtes Google Ads" fasst alles zusammen.</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><b>Gesamtfortschritt: ${all[0]} / ${all[1]}</b><div style="flex:1;min-width:160px">${bar(all[1] ? all[0] / all[1] : 0)}</div>${all[0] ? '<button class="btn" data-act="acadreset">Fortschritt zurücksetzen</button>' : ''}</div>
      </div></div>
      ${levels.map((lv) => {
        const cs = COURSES.filter((c) => c.level === lv);
        if (!cs.length) return '';
        return `<h3 class="acad-lv">${lv === 'Alle' ? 'Für alle' : lv}</h3><div class="acad-grid">${cs.map((c) => {
          const s = A.courseStats(c);
          return `<a class="acad-card ${s.done === s.total ? 'done' : ''}" data-act="acadcourse" data-c="${c.id}">
            <span class="ico">${c.icon}</span><span class="t">${esc(c.title)}</span><span class="d">${esc(c.desc)}</span>
            <span class="meta">${c.lessons.length} Lektionen${c.mission ? ' · Praxisaufgabe' : ''}${P.missions[c.id] ? ' · 🏅' : ''}</span>
            ${bar(s.pct)}<span class="meta">${s.done === s.total ? '✓ Abgeschlossen' : `${s.done} / ${s.total} erledigt`}</span></a>`;
        }).join('')}</div>`;
      }).join('')}`;
  }

  function courseView(c) {
    const P = A.progress(), s = A.courseStats(c), m = c.mission;
    const idx = COURSES.indexOf(c), next = COURSES[idx + 1];
    return head(`${c.icon} ${esc(c.title)}`, '<a data-act="acadcourse" data-c="">Akademie</a> › Kurs') + `
      <div class="card"><div class="bd" style="padding:16px"><p style="margin-top:0">${esc(c.desc)}</p><div style="display:flex;gap:12px;align-items:center"><span class="pill">${esc(c.level)}</span><div style="flex:1">${bar(s.pct)}</div><span class="small">${s.done} / ${s.total}</span></div></div></div>
      ${UI.card('Lektionen', `<div class="acad-list">${c.lessons.map((l, i) => {
        const ok = P.lessons[lessonKey(c, l)];
        return `<a class="acad-row" data-act="acadlesson" data-c="${c.id}" data-l="${l.id}"><span class="num ${ok ? 'ok' : ''}">${ok ? '✓' : i + 1}</span><span>${esc(l.title)}</span><span class="muted small" style="margin-left:auto">${l.quiz.length} Quizfrage${l.quiz.length > 1 ? 'n' : ''}${l.widget ? ' · Rechner' : ''}</span></a>`;
      }).join('')}</div>`, { flush: true })}
      ${m ? UI.card(`🧪 Praxisaufgabe: ${esc(m.title)}`, `
        <p style="margin-top:0">${m.brief}</p>
        <ul class="acad-checks">${m.checks.map((k) => `<li>${P.missions[c.id] ? '✓' : '○'} ${esc(k.label)}</li>`).join('')}</ul>
        <details><summary class="small">Hinweis anzeigen</summary><p class="small">${esc(m.hint)}</p></details>
        <div class="callout" style="margin-top:12px">Die Aufgabe läuft in einem eigenen Übungskonto (${esc(G.D.IND_BY_ID[m.industry].name)}). ${APP.S && !APP.sandbox ? 'Ihr laufendes Spiel wird pausiert und danach unverändert fortgesetzt.' : ''} In der Übungsumgebung wird nichts gespeichert.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${P.missions[c.id] ? '<span class="pill good">🏅 Bestanden</span>' : ''}<button class="btn primary" data-act="acadmission" data-c="${c.id}">${P.missions[c.id] ? 'Erneut üben' : 'Praxisaufgabe starten'}</button></div>`) : ''}
      <div style="display:flex;justify-content:space-between;gap:8px;margin-top:8px"><button class="btn" data-act="acadcourse" data-c="">← Alle Kurse</button>${next ? `<button class="btn" data-act="acadcourse" data-c="${next.id}">Nächster Kurs: ${esc(next.title)} →</button>` : ''}</div>`;
  }

  function lessonView(c, l) {
    const P = A.progress(), key = lessonKey(c, l);
    const ans = P.quiz[key] || {};
    const allRight = l.quiz.every((q, i) => ans[i] === q.c);
    const i = c.lessons.indexOf(l), next = c.lessons[i + 1];
    const quiz = l.quiz.map((q, qi) => {
      const a = ans[qi];
      return `<div class="acad-q"><div class="qq"><b>${qi + 1}.</b> ${esc(q.q)}</div>${q.a.map((t, ai) => {
        const cls = a === undefined ? '' : ai === q.c && a === ai ? 'right' : a === ai ? 'wrong' : '';
        return `<button class="acad-opt ${cls}" data-act="acadans" data-c="${c.id}" data-l="${l.id}" data-q="${qi}" data-a="${ai}">${esc(t)}</button>`;
      }).join('')}${a !== undefined ? `<div class="callout ${a === q.c ? 'good' : 'bad'}" style="margin:8px 0 0">${a === q.c ? '✓ Richtig. ' : '✗ Leider falsch – versuchen Sie es noch einmal. '}${a === q.c ? esc(q.why) : ''}</div>` : ''}</div>`;
    }).join('');
    return head(esc(l.title), `<a data-act="acadcourse" data-c="">Akademie</a> › <a data-act="acadcourse" data-c="${c.id}">${esc(c.title)}</a> › Lektion ${i + 1}/${c.lessons.length}`) + `
      <div class="card"><div class="bd acad-body">${l.body}</div></div>
      ${l.widget === 'adrank' ? UI.card('🧮 Ad-Rank-Rechner', adrankWidget()) : ''}
      <div class="callout warn acad-diff"><b>⚠ Unterschied zum echten Google Ads</b><br>${l.diff}</div>
      ${UI.card('Wissensquiz', quiz)}
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn" data-act="acadcourse" data-c="${c.id}">← Kursübersicht</button>
        ${P.lessons[key] ? `<span class="pill good">✓ Lektion abgeschlossen</span>` : ''}
        <button class="btn primary" data-act="acaddone" data-c="${c.id}" data-l="${l.id}" ${allRight ? '' : 'disabled title="Beantworten Sie zuerst alle Quizfragen richtig"'}>${next ? 'Abschließen & weiter →' : 'Abschließen'}</button>
      </div>`;
  }

  // Interaktiver Rechner: Ad Rank ≈ Gebot × Qualitätswert; tatsächlicher CPC = Rang des Nächsten ÷ eigene Qualität + 0,01 €
  const W = { bid: 1.5, qs: 5 };
  const RIVALS = [{ n: 'Mitbewerber A', bid: 2.2, qs: 4 }, { n: 'Mitbewerber B', bid: 1.3, qs: 8 }, { n: 'Mitbewerber C', bid: 0.9, qs: 6 }];
  const qf = (qs) => (qs + 2) / 12;
  A.adrankRows = function (bid, qs) {
    const rows = [{ n: 'Sie', bid, qs, you: true }, ...RIVALS].map((r) => ({ ...r, rank: r.bid * qf(r.qs) }));
    rows.sort((a, b) => b.rank - a.rank);
    const reserve = 0.3;
    rows.forEach((r, i) => { const below = rows[i + 1] ? rows[i + 1].rank : reserve; r.cpc = r.rank < reserve ? null : Math.min(r.bid, below / qf(r.qs) + 0.01); r.pos = i + 1; });
    return rows;
  };
  function adrankResult() {
    const rows = A.adrankRows(W.bid, W.qs);
    return `<div class="tablewrap"><table class="t"><thead><tr><th>Pos.</th><th>Werbetreibender</th><th class="right">Max. CPC</th><th class="right">QF</th><th class="right">Ad Rank</th><th class="right">Tats. CPC</th></tr></thead><tbody>${rows.map((r) => `<tr ${r.you ? 'style="font-weight:600;background:var(--primary-soft)"' : ''}><td>${r.cpc === null ? '–' : r.pos}</td><td>${esc(r.n)}</td><td class="right">${U.fmt.eur(r.bid)}</td><td class="right">${r.qs}</td><td class="right">${r.rank.toFixed(2)}</td><td class="right">${r.cpc === null ? 'unter Schwelle' : U.fmt.eur(r.cpc)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function adrankWidget() {
    return `<p class="small muted" style="margin-top:0">Ändern Sie Ihr Gebot und Ihren Qualitätsfaktor und beobachten Sie Position und Klickpreis. Formel wie im Simulator: Ad Rank = Gebot × (QF + 2) ÷ 12; Mindestschwelle 0,30.</p>
      <div class="row"><label class="field"><span>Ihr Max. CPC (€)</span><input type="number" step="0.1" min="0.1" max="10" value="${W.bid}" data-inp="acadw" data-k="bid"></label>
      <label class="field"><span>Ihr Qualitätsfaktor (1–10)</span><input type="range" min="1" max="10" step="1" value="${W.qs}" data-inp="acadw" data-k="qs"><span class="small" id="acad-qsv">QF ${W.qs}</span></label></div>
      <div id="acad-w">${adrankResult()}</div>
      <p class="small muted">Beobachtung: Mit QF 8 statt 4 erreichen Sie dieselbe Position mit rund 40 % niedrigerem Gebot – und zahlen pro Klick weniger.</p>`;
  }

  // ---------- Sandbox / Praxisaufgabe ----------
  A.startMission = function (cid) {
    const c = course(cid), m = c && c.mission;
    if (!m) return;
    if (APP.running && G.APPX) G.APPX.pause();
    if (!APP.sandbox) { APP._savedS = APP.S; APP._savedView = APP.view; APP._savedScope = { ...APP.scope }; }
    UI.closeModal();
    let S;
    try {
      S = M.newGame({ industry: m.industry, seed: 4242 + COURSES.indexOf(c), difficulty: 'normal', starter: true });
      m.setup(S);
    } catch (e) { console.error(e); UI.toast('Übungsumgebung konnte nicht erstellt werden: ' + e.message, 'bad'); return; }
    S.settings.autoPause = false;
    S.company.name = 'Übungskonto · ' + c.title.split(':')[0];
    APP.S = S;
    APP.sandbox = { cid, started: S.day };
    A.standalone = false;
    APP.scope = { cid: null, agid: null }; APP.view = 'overview'; APP.alertsSeen = S.day; APP.unreadEvents = 0;
    document.getElementById('sidenav').style.display = '';
    UI.render(true);
    window.scrollTo(0, 0);
    A.showBrief();
  };
  A.runChecks = function (S = APP.S) {
    const c = APP.sandbox && course(APP.sandbox.cid);
    if (!c) return [];
    return c.mission.checks.map((k) => { let ok = false; try { ok = !!k.test(S); } catch (e) { console.error(e); } return { label: k.label, ok }; });
  };
  A.showBrief = function () {
    const c = course(APP.sandbox.cid), m = c.mission;
    UI.modal(`🧪 ${esc(m.title)}`, `<p style="margin-top:0">${m.brief}</p><ul class="acad-checks">${m.checks.map((k) => `<li>○ ${esc(k.label)}</li>`).join('')}</ul><details><summary class="small">Hinweis anzeigen</summary><p class="small">${esc(m.hint)}</p></details><div class="callout small" style="margin-top:12px">Sie befinden sich in einem Übungskonto. Simulieren Sie bei Bedarf Tage (▶ oder +1T) – über „Aufgabe prüfen" im blauen Balken sehen Sie jederzeit, was noch fehlt. Nichts hiervon wird gespeichert.</div>`, { footer: '<button class="btn primary" data-act="mclose">Los geht\'s</button>' });
  };
  A.check = function () {
    const res = A.runChecks(), c = course(APP.sandbox.cid);
    const ok = res.length && res.every((r) => r.ok);
    if (ok) { A.progress().missions[c.id] = true; store(); }
    UI.modal(ok ? '🏅 Aufgabe gelöst!' : 'Noch nicht ganz …', `<ul class="acad-checks">${res.map((r) => `<li class="${r.ok ? 'up' : 'down'}">${r.ok ? '✓' : '✗'} ${esc(r.label)}</li>`).join('')}</ul>${ok ? '<div class="callout good">Sehr gut! Die Praxisaufgabe ist als bestanden gespeichert. Sie können noch weiter im Übungskonto experimentieren oder zur Akademie zurückkehren.</div>' : `<details><summary class="small">Hinweis anzeigen</summary><p class="small">${esc(c.mission.hint)}</p></details>`}`,
      { footer: ok ? '<button class="btn" data-act="mclose">Weiter üben</button><button class="btn primary" data-act="acadexit">Zur Akademie</button>' : '<button class="btn primary" data-act="mclose">Weiter</button>' });
  };
  A.exit = function () {
    if (!APP.sandbox) return;
    const cid = APP.sandbox.cid;
    if (APP.running && G.APPX) G.APPX.pause();
    UI.closeModal();
    APP.sandbox = null;
    APP.S = APP._savedS || null;
    APP._savedS = null;
    nav.course = cid; nav.lesson = null;
    if (APP.S) {
      APP.scope = APP._savedScope || { cid: null, agid: null };
      APP.view = 'academy'; APP.alertsSeen = APP.S.day;
      UI.render(true); window.scrollTo(0, 0);
    } else A.openStandalone();
  };
  A.banner = function () {
    if (!APP.sandbox) return '';
    const c = course(APP.sandbox.cid);
    const res = A.runChecks(), n = res.filter((r) => r.ok).length;
    return `<div class="acad-banner"><span>🧪 <b>Übungsumgebung</b> · ${esc(c.mission.title)} <span class="small">(${n}/${res.length} erfüllt · Tag ${APP.S.day - APP.sandbox.started} der Übung)</span></span><span class="tools"><button class="btn" data-act="acadbrief">Aufgabe</button><button class="btn primary" data-act="acadcheck">Aufgabe prüfen</button><button class="btn" data-act="acadexit">Verlassen</button></span></div>`;
  };

  // ---------- View & Aktionen ----------
  V.academy = { title: 'Akademie', render: () => A.html() };
  Object.assign(ACT, {
    acadopen: () => { nav.course = null; nav.lesson = null; if (APP.S && !APP.sandbox) UI.go('academy'); else if (!APP.S) A.openStandalone(); else UI.go('academy'); },
    acadhome: () => { A.standalone = false; nav.course = null; nav.lesson = null; G.APPX.startScreen(); },
    acadcourse: (el, d) => { nav.course = d.c || null; nav.lesson = null; A.refresh(); },
    acadlesson: (el, d) => { nav.course = d.c; nav.lesson = d.l; A.refresh(); },
    acadans: (el, d) => {
      const P = A.progress(), key = d.c + '.' + d.l;
      const q = P.quiz[key] || (P.quiz[key] = {});
      q[d.q] = +d.a; store();
      const y = window.scrollY; A.refresh(); window.scrollTo(0, y);
    },
    acaddone: (el, d) => {
      const c = course(d.c), l = c.lessons.find((x) => x.id === d.l);
      const ans = A.progress().quiz[lessonKey(c, l)] || {};
      if (!l.quiz.every((q, i) => ans[i] === q.c)) { UI.toast('Bitte zuerst alle Quizfragen richtig beantworten', 'bad'); return; }
      A.progress().lessons[lessonKey(c, l)] = true; store();
      const next = c.lessons[c.lessons.indexOf(l) + 1];
      nav.lesson = next ? next.id : null;
      UI.toast(next ? 'Lektion abgeschlossen ✓' : 'Alle Lektionen abgeschlossen ✓' + (c.mission && !A.progress().missions[c.id] ? ' – jetzt die Praxisaufgabe!' : ''), 'good');
      A.refresh();
    },
    acadreset: () => UI.confirm('Lernfortschritt zurücksetzen?', 'Alle abgeschlossenen Lektionen, Quizantworten und Praxisaufgaben werden gelöscht. Ihr Spielstand bleibt erhalten.', () => { mem = { lessons: {}, quiz: {}, missions: {} }; store(); A.refresh(); }, 'Zurücksetzen'),
    acadmission: (el, d) => A.startMission(d.c),
    acadbrief: () => A.showBrief(),
    acadcheck: () => A.check(),
    acadexit: () => A.exit(),
    inp_acadw: (el, d) => {
      const v = parseFloat(String(el.value).replace(',', '.'));
      if (!isFinite(v)) return;
      W[d.k] = d.k === 'qs' ? Math.round(U.clamp(v, 1, 10)) : U.clamp(v, 0.05, 20);
      const box = document.getElementById('acad-w'); if (box) box.innerHTML = adrankResult();
      const qv = document.getElementById('acad-qsv'); if (qv) qv.textContent = 'QF ' + W.qs;
    },
  });
})();
