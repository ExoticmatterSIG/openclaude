/* Ads Simulator – Übersicht als Baukasten: Karten ein-/ausblenden, anordnen (Ziehen oder Pfeile), Breite wählen */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, C = G.C, UI = G.UI, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc, I = E.I;

  // Verfügbare Karten: name, Beschreibung, Standardbreite; render(dim, id) für zusätzliche Karten
  const CAT = [
    { id: 'kpi', name: 'Kennzahlen & Diagramm', desc: 'Bis zu 8 KPI-Kacheln mit Vergleichszeitraum und Zeitverlauf.', size: 'full' },
    { id: 'guide', name: 'Geführte Hilfe', desc: 'Aktuelle Probleme mit Schritt-für-Schritt-Lösung, abgestimmt auf die Vorgaben der Geschäftsleitung.', size: 'full' },
    { id: 'month', name: 'Monatsvergleich', desc: 'Kalendermonate im Vergleich mit Hochrechnung.', size: 'full' },
    { id: 'camps', name: 'Kampagnen', desc: 'Kampagnen mit Status, Budget und Leistung.', size: 'half' },
    { id: 'goals', name: 'Zielvorgaben der Geschäftsleitung', desc: 'Vertrauen, Quartalsziele und Monatsbudget.', size: 'half' },
    { id: 'pacing', name: 'Budget-Pacing', desc: 'Kumulierte Ausgaben im Monat gegenüber dem Monatsbudget.', size: 'half' },
    { id: 'score', name: 'Optimierungsfaktor', desc: 'Googles Empfehlungen im Überblick.', size: 'half' },
    { id: 'topkw', name: 'Top-Keywords', desc: 'Keywords mit den höchsten Kosten und ihrer Leistung.', size: 'half' },
    { id: 'waste', name: 'Suchbegriffe ohne Conversion', desc: 'Teuerste Suchbegriffe ohne Conversion – Kandidaten für Ausschlüsse.', size: 'half' },
    { id: 'devices', name: 'Geräte', desc: 'Kosten und Conversions nach Gerät.', size: 'half' },
    { id: 'hours', name: 'Tageszeiten', desc: 'Klicks und Conversions nach Uhrzeit.', size: 'half' },
    { id: 'auction', name: 'Mitbewerber (Auktionsdaten)', desc: 'Wichtigste Mitbewerber mit Anteil an Impressionen und Überschneidung.', size: 'half' },
    { id: 'measure', name: 'Messqualität', desc: 'Gemessene vs. echte Conversions, Messlücke, Tracking-Status.', size: 'half' },
    { id: 'market', name: 'Marktpuls', desc: 'Nachfrage-, CPC- und Kauflaune-Index, Saison.', size: 'half' },
    { id: 'pnl', name: 'Unternehmensergebnis', desc: 'Umsatz, Rohertrag, Werbekosten und Gewinn.', size: 'half' },
    { id: 'news', name: 'Neuigkeiten aus dem Markt', desc: 'Ereignisse, Mitbewerber und Vorgaben.', size: 'half' },
  ];
  const BY = Object.fromEntries(CAT.map((c) => [c.id, c]));
  const DEFAULT = ['kpi', 'guide', 'camps', 'goals', 'pacing', 'score', 'month', 'news', 'market', 'pnl'].map((id) => ({ id, size: BY[id].size }));
  const layout = () => { const l = UI.prefs().ovLayout; return Array.isArray(l) && l.length ? l.filter((x) => BY[x.id]) : DEFAULT.map((x) => ({ ...x })); };
  const save = (l) => UI.setPref('ovLayout', l);

  // Persistente KPI-Auswahl (unabhängig vom Spielstand)
  const P0 = UI.prefs();
  if (Array.isArray(P0.kpis) && P0.kpis.length) APP.kpis = P0.kpis.filter((k) => UI.MET[k]);
  if (Array.isArray(P0.chart) && P0.chart.length) APP.chart = P0.chart.filter((k) => UI.MET[k]);
  if (Array.isArray(P0.mcKeys) && P0.mcKeys.length) APP.mcKeys = P0.mcKeys.filter((k) => UI.MET[k]);
  function persistKpis() {
    const p = UI.prefs(), j = (x) => JSON.stringify(x || null);
    if (j(p.kpis) !== j(APP.kpis)) UI.setPref('kpis', APP.kpis.slice());
    if (j(p.chart) !== j(APP.chart)) UI.setPref('chart', APP.chart.slice());
    if (APP.mcKeys && j(p.mcKeys) !== j(APP.mcKeys)) UI.setPref('mcKeys', APP.mcKeys.slice());
  }

  // ---------- Zusätzliche Karten ----------
  const X = {
    guide: () => {
      const h = G.GUIDE ? G.GUIDE.panel('overview') : '';
      if (h) return h;
      return UI.card('🧭 Geführte Hilfe', UI.prefs().guide ? '<div class="small muted">Aktuell keine dringenden Hinweise. 👍</div>' : '<div class="small muted">Ausgeschaltet. <a data-act="nav" data-v="settings">In den Einstellungen einschalten</a></div>');
    },
    pacing: (S) => {
      const g = S.goals;
      if (!g) return UI.card('Budget-Pacing', '<div class="muted small">Keine Monatsvorgabe.</div>');
      const date = M.today(S), dim = U.daysInMonth(date), dom = date.getUTCDate(), start = S.day - (dom - 1);
      const cx = G.GUIDE ? G.GUIDE.ctx(S) : null;
      const daily = cx ? cx.l7 : 0;
      let cum = 0;
      const vals = [], plan = [], lab = [];
      for (let i = 0; i < dim; i++) {
        const d = start + i;
        lab.push(String(i + 1));
        plan.push((g.monthBudget / dim) * (i + 1));
        if (d < S.day) cum += E.sumRange(S, 'acct', 'all', d, d)[I.cost]; else cum += daily; // ab heute: Hochrechnung
        vals.push(cum);
      }
      const proj = cx ? cx.proj : cum;
      const chart = C.line({ labels: lab, height: 170, series: [{ name: 'Ausgaben kumuliert (ab heute hochgerechnet)', color: 'var(--s1)', values: vals, fmt: f.eur0, area: true }, { name: 'Gleichmäßig verteiltes Monatsbudget', color: 'var(--text-3)', values: plan, fmt: f.eur0, dash: true }], marks: dom > 1 ? [{ i: dom - 1, label: 'Heute', color: 'var(--s3)' }] : [] });
      cum = cx ? cx.ms : 0;
      return UI.card('Budget-Pacing (Monat)', `<div class="small" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>Bisher <b>${f.eur0(cum)}</b> von ${f.eur0(g.monthBudget)}</span><span>Hochrechnung <b class="${proj > g.monthBudget ? 'down' : 'up'}">${f.eur0(proj)}</b></span>${cx ? `<span>Kurs: <b>${G.GUIDE.modeText[cx.mode]}</b></span>` : ''}</div>${chart}`);
    },
    topkw: (S) => {
      const kws = S.keywords.filter((k) => k.status !== 'removed');
      const rows = kws.map((k) => ({ id: k.id, kw: k, m: UI.m('kw', k.id) })).filter((r) => r.m.imp > 0);
      return UI.card('Top-Keywords', UI.table('ov_kw', [
        { k: 'kw', l: 'Keyword', f: (r) => UI.match(r.kw), sort: (r) => r.kw.text },
        { k: 'qs', l: 'QF', num: true, f: (r) => UI.qs(r.kw.rt && r.kw.rt.qs), sort: (r) => (r.kw.rt && r.kw.rt.qs ? r.kw.rt.qs.score : 0) },
        ...UI.mcols(['clk', 'cost', 'conv', 'cpa']),
      ], rows, { defaultSort: { k: 'cost', dir: 'desc' }, limit: 6, empty: 'Noch keine Keyword-Daten.' }), { flush: true, tools: '<a data-act="nav" data-v="keywords">Alle Keywords</a>' });
    },
    waste: (S) => {
      const [a, b] = UI.rng(), rows = [];
      for (const c of S.campaigns.filter((x) => x.status !== 'removed')) for (const k of E.keys(S, 'st', c.id + '~')) {
        const v = E.sumRange(S, 'st', k, a, b), q = M.byId(S.queries, k.split('~')[1]);
        if (q && v[I.cost] > 0 && v[I.conv] < 0.5) rows.push({ q, c, cost: v[I.cost], clk: v[I.clk] });
      }
      rows.sort((x, y) => y.cost - x.cost);
      const tot = U.sum(rows, (r) => r.cost);
      return UI.card('Suchbegriffe ohne Conversion', rows.length ? `<div class="small" style="margin-bottom:6px">${rows.length} Suchbegriffe, zusammen <b class="down">${f.eur0(tot)}</b> ohne Conversion im Zeitraum.</div><ul class="feed">${rows.slice(0, 6).map((r) => `<li><span class="what"><b>${esc(r.q.text)}</b><div class="small muted">${esc(r.c.name)} · ${f.int(r.clk)} Klicks</div></span><span class="down nowrap">${f.eur0(r.cost)}</span></li>`).join('')}</ul>` : '<div class="muted small">Keine auffälligen Suchbegriffe.</div>', { tools: '<a data-act="nav" data-v="searchterms">Suchbegriffe</a>' });
    },
    devices: (S, dim, id) => {
      const camps = id === 'all' ? S.campaigns : [M.camp(S, id)];
      const rows = D.DEVICES.map((dv, i) => { const v = E.zero(); for (const c of camps) E.add(v, UI.sum('dev', c.id + '~' + dv.id)); return { dv, m: E.derive(v), i }; });
      return UI.card('Geräte', C.bars({ items: rows.map((r) => ({ label: r.dv.name, value: r.m.cost, color: C.SERIES[r.i] })), fmt: f.eur0, height: 150 }) + `<dl class="kv" style="margin-top:8px">${rows.map((r) => `<dt>${esc(r.dv.name)}</dt><dd>${f.num1(r.m.conv)} Conv. · ${f.eur(r.m.cpa)} je Conv.</dd>`).join('')}</dl>`, { tools: '<a data-act="nav" data-v="devices">Geräte</a>' });
    },
    hours: (S, dim, id) => {
      const [a, b] = UI.rng(), camps = id === 'all' ? S.campaigns : [M.camp(S, id)];
      const hv = Array.from({ length: 24 }, () => E.zero());
      for (const c of camps) for (let h = 0; h < 24; h++) { const e = S.stats.hour && S.stats.hour[c.id + '~' + h]; if (e) for (let d = Math.max(0, a); d <= b; d++) if (e[d]) E.add(hv[h], e[d]); }
      const der = hv.map((v) => E.derive(v));
      return UI.card('Tageszeiten', C.bars({ items: der.map((m, h) => ({ label: String(h), value: m.clk, color: C.SERIES[0] })), fmt: f.int, height: 150 }) + `<div class="small muted" style="margin-top:6px">Klicks je Stunde. Beste Conv.-Stunden: ${der.map((m, h) => ({ h, c: m.conv })).sort((x, y) => y.c - x.c).slice(0, 3).map((x) => x.h + ' Uhr').join(', ')}</div>`, { tools: '<a data-act="nav" data-v="schedule">Werbezeitplaner</a>' });
    },
    auction: (S, dim, id) => {
      const pre = id === 'all' ? 'all~' : id + '~';
      const you = UI.sum('ai', pre + '_you');
      const rows = S.competitors.map((c) => { const v = UI.sum('ai', pre + c.id); return { c, is: v[0] ? v[1] / v[0] : 0, ov: v[2] / Math.max(you[1], 1e-9) }; }).filter((r) => r.is >= 0.1).sort((x, y) => y.is - x.is).slice(0, 5);
      return UI.card('Mitbewerber (Auktionsdaten)', `<dl class="kv"><dt><b>Sie</b></dt><dd>${you[0] ? f.pct(you[1] / you[0], 1) : '–'} Anteil an Impr.</dd>${rows.map((r) => `<dt>${esc(r.c.domain)}</dt><dd>${f.pct(r.is, 1)} · Überschneidung ${f.pct(r.ov, 0)}</dd>`).join('') || '<dt class="muted">Keine relevanten Mitbewerber</dt><dd></dd>'}</dl>`, { tools: '<a data-act="nav" data-v="auction">Auktionsdaten</a>' });
    },
    measure: (S, dim, id) => {
      const m = UI.m(dim, id), gap = m.rconv > 0 ? 1 - m.conv / m.rconv : 0;
      return UI.card('Messqualität', `<dl class="kv"><dt>Conversion-Tracking</dt><dd>${S.account.trackingOk ? UI.pill(['Funktioniert', 'good']) : UI.pill(['Ausgefallen', 'bad'])}</dd><dt>Consent Mode</dt><dd>${S.account.consentMode === 'advanced' ? 'Erweitert' : S.account.consentMode === 'basic' ? 'Einfach' : 'Aus'}</dd><dt>Erweiterte Conversions</dt><dd>${S.account.enhancedConv ? 'Aktiv' : 'Aus'}</dd><dt>Gemessene Conversions</dt><dd>${f.num1(m.conv)}</dd><dt>Echte Conversions (Sim)</dt><dd>${f.num1(m.rconv)}</dd><dt>Messlücke (Sim)</dt><dd class="${gap > 0.25 ? 'down' : ''}">${f.pct0(gap)}</dd></dl>`, { tools: '<a data-act="nav" data-v="conversions">Conversions</a>' });
    },
  };

  // ---------- Layout ----------
  UI.ovLayout = function (W, dim, id) {
    const S = APP.S, edit = !!APP.ovEdit;
    persistKpis();
    const L = layout();
    const cards = L.map((it, i) => {
      let html = '';
      try { html = W[it.id] ? W[it.id]() : X[it.id] ? X[it.id](S, dim, id) : ''; } catch (e) { console.error(e); html = UI.card(BY[it.id].name, '<div class="muted small">Karte konnte nicht geladen werden.</div>'); }
      if (!html && !edit) return '';
      if (!html) html = UI.card(BY[it.id].name, '<div class="muted small">Derzeit keine Daten.</div>');
      const bar = edit ? `<div class="ovbar"><span class="ovgrip" title="Ziehen zum Verschieben">⠿</span><b>${esc(BY[it.id].name)}</b><span class="ovtools"><button class="iconbtn" data-act="ovmove" data-i="${i}" data-d="-1" title="Nach vorne" ${i === 0 ? 'disabled' : ''}>↑</button><button class="iconbtn" data-act="ovmove" data-i="${i}" data-d="1" title="Nach hinten" ${i === L.length - 1 ? 'disabled' : ''}>↓</button><button class="iconbtn" data-act="ovsize" data-i="${i}" title="Breite umschalten">${it.size === 'full' ? '◧ halbe Breite' : '▭ volle Breite'}</button><button class="iconbtn" data-act="ovhide" data-i="${i}" title="Ausblenden">✕</button></span></div>` : '';
      return `<div class="ovw ${it.size === 'full' ? 'full' : 'half'} ${edit ? 'editing' : ''}" data-ovi="${i}" ${edit ? 'draggable="true"' : ''}>${bar}${html}</div>`;
    }).join('');
    const hidden = CAT.filter((c) => !L.some((x) => x.id === c.id));
    const editBar = edit ? `<div class="callout ovhint"><b>Übersicht anpassen:</b> Karten per ⠿ ziehen oder mit ↑ ↓ verschieben, Breite umschalten oder mit ✕ ausblenden. Die Anordnung gilt für alle Spielstände in diesem Browser.<div class="tipjump"><button class="btn sm primary" data-act="ovadd">＋ Karte hinzufügen${hidden.length ? ` (${hidden.length})` : ''}</button><button class="btn sm" data-act="ovreset">Standard wiederherstellen</button><button class="btn sm" data-act="ovedit">✓ Fertig</button></div></div>` : '';
    return editBar + `<div class="ovgrid" id="ovgrid">${cards}</div>` + (!edit ? '<div class="center" style="margin:4px 0 16px"><button class="btn sm" data-act="ovedit">✎ Übersicht anpassen</button></div>' : '');
  };

  ACT.ovedit = () => { APP.ovEdit = !APP.ovEdit; UI.renderMain(true); };
  ACT.ovmove = (el, d) => { const L = layout(), i = +d.i, j = i + +d.d; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; save(L); UI.renderMain(true); };
  ACT.ovsize = (el, d) => { const L = layout(); L[+d.i].size = L[+d.i].size === 'full' ? 'half' : 'full'; save(L); UI.renderMain(true); };
  ACT.ovhide = (el, d) => { const L = layout(); const it = L.splice(+d.i, 1)[0]; save(L); UI.toast(`„${BY[it.id].name}" ausgeblendet – über „＋ Karte hinzufügen" wieder einblenden`); UI.renderMain(true); };
  ACT.ovreset = () => UI.confirm('Standard wiederherstellen?', 'Die Übersicht wird auf die Standardkarten und -reihenfolge zurückgesetzt.', () => { save(null); UI.renderMain(true); }, 'Zurücksetzen');
  ACT.ovadd = () => {
    const L = layout();
    UI.modal('Karte hinzufügen', `<div class="small muted" style="margin-bottom:8px">Wählen Sie die Karten, die in Ihrer Übersicht erscheinen sollen.</div><div class="ovcat">${CAT.map((c) => `<label class="ovopt"><input type="checkbox" name="ov_${c.id}" ${L.some((x) => x.id === c.id) ? 'checked' : ''}><span><b>${esc(c.name)}</b><span class="small muted">${esc(c.desc)}</span></span></label>`).join('')}</div>`, {
      saveLabel: 'Übernehmen',
      onSave: () => {
        let next = layout().filter((x) => UI.val('ov_' + x.id));
        for (const c of CAT) if (UI.val('ov_' + c.id) && !next.some((x) => x.id === c.id)) next.push({ id: c.id, size: c.size });
        if (!next.length) { UI.toast('Mindestens eine Karte auswählen', 'bad'); return false; }
        save(next);
      },
    });
  };
  // Ziehen & Ablegen (Desktop); auf Touch-Geräten die Pfeile nutzen
  let dragI = null;
  document.addEventListener('dragstart', (ev) => { const w = ev.target.closest && ev.target.closest('.ovw.editing'); if (!w) return; dragI = +w.dataset.ovi; w.classList.add('dragging'); try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(dragI)); } catch (e) { /* ignore */ } });
  document.addEventListener('dragover', (ev) => { const w = ev.target.closest && ev.target.closest('.ovw.editing'); if (dragI === null || !w) return; ev.preventDefault(); document.querySelectorAll('.ovw.dropto').forEach((x) => x !== w && x.classList.remove('dropto')); w.classList.add('dropto'); });
  document.addEventListener('drop', (ev) => {
    const w = ev.target.closest && ev.target.closest('.ovw.editing');
    if (dragI === null || !w) return;
    ev.preventDefault();
    const L = layout(), to = +w.dataset.ovi, it = L.splice(dragI, 1)[0];
    L.splice(to, 0, it); dragI = null; save(L); UI.renderMain(true);
  });
  document.addEventListener('dragend', () => { dragI = null; document.querySelectorAll('.ovw.dragging, .ovw.dropto').forEach((x) => x.classList.remove('dragging', 'dropto')); });
})();
