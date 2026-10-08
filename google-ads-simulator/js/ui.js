/* Ads Simulator – UI-Kern: Zustand, Layout, Tabellen, Modals, Ereignis-Delegation */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U, D = G.D, M = G.M, E = G.E, C = G.C, R = G.R;
  const f = U.fmt, esc = U.esc;

  const APP = (G.APP = {
    S: null, view: 'overview', scope: { cid: null, agid: null }, range: 'last30', running: false, speed: 2,
    chart: ['clk', 'cost'], kpis: ['clk', 'imp', 'cost', 'conv'], compare: 'prev', sort: {}, sel: {}, q: {}, tab: {}, busy: false,
  });
  const V = (G.V = {}); // Views: name -> { title, render() }
  const ACT = (G.ACT = {}); // Aktionen: name -> (el, data, ev)
  const UI = (G.UI = {});

  // ---------- Kennzahlen ----------
  const MET = (UI.MET = {
    imp: { l: 'Impr.', f: f.int },
    clk: { l: 'Klicks', f: f.int },
    ctr: { l: 'CTR', f: (x) => f.pct(x) },
    cpc: { l: 'Ø CPC', f: f.eur },
    cost: { l: 'Kosten', f: f.eur },
    conv: { l: 'Conversions', f: f.num1 },
    cvr: { l: 'Conv.-Rate', f: (x) => f.pct(x) },
    cpa: { l: 'Kosten/Conv.', f: f.eur },
    val: { l: 'Conv.-Wert', f: f.eur },
    roas: { l: 'Conv.-Wert/Kosten', f: f.num2 },
    aconv: { l: 'Alle Conv.', f: f.num1 },
    is: { l: 'Anteil mögl. Impr.', f: (x) => (x > 0 ? (x > 0.9 ? '> 90 %' : x < 0.1 ? '< 10 %' : f.pct(x)) : '–') },
    lostB: { l: 'Verl. Impr.-Anteil (Budget)', f: (x) => f.pct(x) },
    lostR: { l: 'Verl. Impr.-Anteil (Rang)', f: (x) => f.pct(x) },
    top: { l: 'Impr. (oben) %', f: (x) => f.pct(x) },
    abs: { l: 'Impr. (ganz oben) %', f: (x) => f.pct(x) },
    cpm: { l: 'Ø CPM', f: f.eur },
    views: { l: 'Aufrufe', f: f.int },
    viewRate: { l: 'Aufrufrate', f: (x) => f.pct(x) },
    cpv: { l: 'Ø CPV', f: f.eur },
    vconv: { l: 'View-through-Conv.', f: f.int },
    inv: { l: 'Ungültige Klicks', f: f.int },
    calls: { l: 'Anrufe', f: f.int },
    rconv: { l: 'Echte Conv. (Sim)', f: f.num1 },
    rval: { l: 'Echter Umsatz (Sim)', f: f.eur },
    rroas: { l: 'Echter ROAS (Sim)', f: f.num2 },
    roasP: { l: 'ROAS in %', f: (x) => (x > 0 ? f.int(x * 100) + ' %' : '–') },
    valPerConv: { l: 'Wert/Conv.', f: f.eur },
    valPerClk: { l: 'Wert/Klick', f: f.eur },
    topIS: { l: 'Anteil Impr. oben', f: (x) => f.pct(x) },
    absIS: { l: 'Anteil Impr. ganz oben', f: (x) => f.pct(x) },
    gp: { l: 'Deckungsbeitrag (gemessen)', f: f.eur },
    rcpa: { l: 'Echte Kosten/Conv. (Sim)', f: f.eur },
    rgp: { l: 'Echter Deckungsbeitrag (Sim)', f: f.eur },
    gap: { l: 'Messlücke (Sim)', f: (x) => f.pct0(x) },
  });
  // Spaltengruppen für die Spaltenauswahl
  UI.MET_GROUPS = [
    ['Leistung', ['imp', 'clk', 'ctr', 'cpc', 'cost', 'cpm']],
    ['Conversions', ['conv', 'cvr', 'cpa', 'val', 'valPerConv', 'valPerClk', 'roas', 'roasP', 'aconv', 'vconv', 'calls']],
    ['Wirtschaftlichkeit', ['gp']],
    ['Wettbewerb', ['is', 'lostB', 'lostR', 'top', 'abs', 'topIS', 'absIS']],
    ['Video', ['views', 'viewRate', 'cpv']],
    ['Nur im Simulator', ['rconv', 'rval', 'rroas', 'rcpa', 'rgp', 'gap', 'inv']],
  ];
  // Kennzahlen, die die Branchenmarge brauchen, ergänzen
  UI.ext = function (m) {
    const mg = APP.S ? M.ind(APP.S).margin || 0 : 0;
    m.gp = m.val * mg - m.cost; m.rgp = m.rval * mg - m.cost;
    return m;
  };
  UI.SUMMABLE = ['imp', 'clk', 'cost', 'conv', 'val', 'aconv', 'views', 'vconv', 'inv', 'calls', 'rconv', 'rval'];

  // ---------- Zeitraum ----------
  UI.RANGES = { yesterday: 'Gestern', last7: 'Letzte 7 Tage', last14: 'Letzte 14 Tage', last30: 'Letzte 30 Tage', last90: 'Letzte 90 Tage', month: 'Dieser Monat', all: 'Gesamte Laufzeit' };
  UI.rng = function (key = APP.range) {
    const S = APP.S, to = S.day - 1;
    const date = M.today(S);
    const map = { yesterday: 1, last7: 7, last14: 14, last30: 30, last90: 90 };
    if (key === 'all') return [0, to];
    if (key === 'month') return [S.day - (date.getUTCDate() - 1), to];
    return [Math.max(0, S.day - map[key]), to];
  };
  UI.prevRng = function () { const [a, b] = UI.rng(); const len = b - a + 1; return [a - len, a - 1]; };
  // Vergleichszeitraum wie in Google Ads: vorheriger Zeitraum, Vormonat oder Vorjahr
  UI.COMPARE = { off: 'Kein Vergleich', prev: 'Vorheriger Zeitraum', month: 'Vormonat', year: 'Vorjahr' };
  const shiftMonths = (S, day, n) => {
    const d = U.dayToDate(S.startDate, day), y = d.getUTCFullYear(), m = d.getUTCMonth() - n;
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const t = Date.UTC(y, m, Math.min(d.getUTCDate(), dim));
    return Math.round((t - U.parseISO(S.startDate).getTime()) / 86400000);
  };
  UI.cmpRng = function (key = APP.compare) {
    if (!key || key === 'off' || !APP.S) return null;
    const [a, b] = UI.rng();
    if (key === 'prev') return UI.prevRng();
    const n = key === 'month' ? 1 : 12;
    return [shiftMonths(APP.S, a, n), shiftMonths(APP.S, b, n)];
  };
  UI.cmpLabel = function () {
    const r = UI.cmpRng();
    if (!r) return '';
    const S = APP.S;
    return r[1] < 0 ? 'keine Daten' : `${U.fmtDate(U.dayToDate(S.startDate, Math.max(0, r[0])), false)} – ${U.fmtDate(U.dayToDate(S.startDate, r[1]), false)}`;
  };
  // Vergleichswert einer Tabellenzeile (Metrik-Objekt kennt seine Quelle)
  UI._cmpCache = new Map();
  UI.mPrev = function (m) {
    const src = m && m._src, r = UI.cmpRng();
    if (!src || !r) return null;
    const key = src.join('|') + '|' + r.join('-');
    if (!UI._cmpCache.has(key)) UI._cmpCache.set(key, r[1] < 0 ? null : UI.ext(E.derive(E.sumRange(APP.S, src[0], src[1], Math.max(0, r[0]), r[1]))));
    return UI._cmpCache.get(key);
  };
  UI.sum = (dim, id, r = UI.rng()) => E.sumRange(APP.S, dim, id, r[0], r[1]);
  UI.m = (dim, id, r) => { const m = UI.ext(E.derive(UI.sum(dim, id, r))); if (!r) Object.defineProperty(m, '_src', { value: [dim, id], enumerable: false }); return m; };
  UI.rangeLabel = function () {
    const S = APP.S, [a, b] = UI.rng();
    if (b < a) return 'Noch keine Daten';
    return U.fmtDate(U.dayToDate(S.startDate, Math.max(a, 0)), false) + ' – ' + U.fmtDate(U.dayToDate(S.startDate, b), false);
  };

  // ---------- Tabellen ----------
  UI.INVERT = new Set(['cpc', 'cost', 'cpa', 'lostB', 'lostR', 'gap', 'rcpa', 'cpm', 'cpv', 'inv']);
  UI.cellDelta = function (k, m) {
    if (!UI.prefs().cmpTables || !m || !m._src) return '';
    const p = UI.mPrev(m);
    if (!p || !p[k] || !isFinite(m[k])) return '';
    const d = m[k] / p[k] - 1;
    if (!isFinite(d)) return '';
    const good = UI.INVERT.has(k) ? d < 0 : d > 0;
    return `<div class="cdelta ${Math.abs(d) < 0.005 ? 'muted' : good ? 'up' : 'down'}" title="Vergleich: ${esc(MET[k].f(p[k]))}">${d > 0 ? '▲' : d < 0 ? '▼' : '±'}${f.pct0(Math.abs(d))}</div>`;
  };
  UI.mcol = (k, extra = {}) => ({ k, l: MET[k].l, num: true, f: (r) => MET[k].f(r.m[k]) + UI.cellDelta(k, r.m), sort: (r) => r.m[k], ...extra });
  UI.mcols = (keys) => keys.map((k) => UI.mcol(k));
  UI.table = function (id, cols, rows, o = {}) {
    const st = APP.sort[id] || o.defaultSort || null;
    let rs = rows.slice();
    if (st) {
      const col = cols.find((c) => c.k === st.k);
      if (col) {
        const get = col.sort || ((r) => r[col.k]);
        rs.sort((a, b) => { const x = get(a), y = get(b); const c = typeof x === 'string' ? String(x).localeCompare(String(y), 'de') : (x || 0) - (y || 0); return st.dir === 'asc' ? c : -c; });
      }
    }
    const q = (APP.q[id] || '').toLowerCase();
    if (q && o.search) rs = rs.filter((r) => o.search(r).toLowerCase().includes(q));
    const total = rs.length;
    const limit = o.limit || 300;
    rs = rs.slice(0, limit);
    const sel = APP.sel[id] || (APP.sel[id] = new Set());
    const head = (o.select ? `<th style="width:28px"><input type="checkbox" data-act="selall" data-t="${id}" ${rs.length && rs.every((r) => sel.has(r.id)) ? 'checked' : ''}></th>` : '') + cols.map((c) => {
      const s = st && st.k === c.k ? (st.dir === 'asc' ? ' ▲' : ' ▼') : '';
      return `<th class="${c.num ? 'num' : ''} ${c.nosort ? '' : 'sortable'}" ${c.nosort ? '' : `data-act="sort" data-t="${id}" data-k="${c.k}"`} ${c.title ? `title="${esc(c.title)}"` : ''}>${c.l}${s}</th>`;
    }).join('');
    const body = rs.map((r) => `<tr ${r._cls ? `class="${r._cls}"` : ''}>` + (o.select ? `<td><input type="checkbox" data-act="sel" data-t="${id}" data-id="${esc(r.id)}" ${sel.has(r.id) ? 'checked' : ''}></td>` : '') + cols.map((c) => `<td class="${c.num ? 'num' : ''} ${c.wrap ? 'wrap' : ''}">${c.f ? c.f(r) : esc(r[c.k])}</td>`).join('') + '</tr>').join('');
    let foot = '';
    if (o.totals) {
      foot = '<tfoot><tr>' + (o.select ? '<td></td>' : '') + cols.map((c, i) => `<td class="${c.num ? 'num' : ''}">${i === 0 ? (o.totalsLabel || 'Gesamt') : c.num && MET[c.k] ? MET[c.k].f(o.totals[c.k]) : ''}</td>`).join('') + '</tr></tfoot>';
    }
    const search = o.search ? `<div class="filterbar"><input type="search" placeholder="Suchen …" data-inp="tsearch" data-t="${id}" value="${esc(APP.q[id] || '')}">${o.filters || ''}${UI._colDefaults[id] ? `<button class="btn sm" data-act="colpick" data-t="${id}" title="Kennzahl-Spalten auswählen">▦ Spalten</button>` : ''}<span class="muted small">${total} Zeile(n)</span></div>` : '';
    const selbar = o.select && sel.size ? `<div class="selbar"><b>${sel.size} ausgewählt</b> ${o.bulk || ''} <a data-act="selclear" data-t="${id}" style="margin-left:auto">Auswahl aufheben</a></div>` : '';
    if (!rows.length) return search + `<div class="empty">${o.empty || 'Keine Daten im ausgewählten Zeitraum.'}</div>`;
    return search + selbar + `<div class="tablewrap"><table class="t"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table></div>` + (total > limit ? `<div class="muted small" style="padding:8px 16px">${total - limit} weitere Zeilen ausgeblendet</div>` : '');
  };
  UI.totals = (vecs) => UI.ext(E.derive(vecs.reduce((a, v) => E.add(a, v), E.zero())));
  // Benutzereinstellungen (unabhängig vom Spielstand)
  const PREF_KEY = 'gads-sim-prefs';
  let prefs = null;
  UI.prefs = function () {
    if (prefs) return prefs;
    try { prefs = JSON.parse(localStorage.getItem(PREF_KEY) || 'null'); } catch (e) { prefs = null; }
    prefs = Object.assign({ guide: true, tips: true, tipMore: true, cmpTables: true, cols: {} }, prefs || {});
    return prefs;
  };
  UI.setPref = function (k, v) { UI.prefs()[k] = v; try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* nur im Speicher */ } };
  // Metrik-Spalten mit Spaltenauswahl
  UI._colDefaults = {};
  UI.mcolsFor = function (id, defaults) {
    UI._colDefaults[id] = defaults;
    const sel = (UI.prefs().cols[id] || defaults).filter((k) => MET[k]);
    return UI.mcols(sel);
  };

  // ---------- Bausteine ----------
  UI.pill = ([txt, cls]) => `<span class="pill ${cls}">${esc(txt)}</span>`;
  UI.toggle = (on, act, data = '') => `<button class="toggle ${on ? 'on' : ''}" data-act="${act}" ${data} title="${on ? 'Aktiv – klicken zum Pausieren' : 'Pausiert – klicken zum Aktivieren'}"></button>`;
  UI.qs = (q) => (q ? `<span class="qs ${q.score >= 7 ? 'hi' : q.score >= 5 ? 'mid' : 'lo'}" title="Erwartete CTR: ${q.ctr}\nAnzeigenrelevanz: ${q.rel}\nLandingpage: ${q.lp}">${q.score}</span>` : '<span class="muted">–</span>');
  UI.match = (kw) => (kw.match === 'exact' ? `[${esc(kw.text)}]` : kw.match === 'phrase' ? `"${esc(kw.text)}"` : esc(kw.text));
  UI.matchName = { exact: 'Genau passend', phrase: 'Passende Wortgruppe', broad: 'Weitgehend passend' };
  UI.card = (title, body, o = {}) => `<div class="card ${o.cls || ''}"><div class="hd"><h3>${title}</h3>${o.sub ? `<span class="sub">${o.sub}</span>` : ''}${o.tools ? `<div class="tools">${o.tools}</div>` : ''}</div><div class="bd ${o.flush ? 'flush' : ''}">${body}</div></div>`;
  UI.campOpts = function (sel, filter) {
    return APP.S.campaigns.filter((c) => c.status !== 'removed' && !c.isTrial && (!filter || filter(c))).map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  };
  UI.delta = function (cur, prev, invert) {
    if (!prev || !isFinite(cur) || !isFinite(prev)) return '';
    const d = cur / prev - 1;
    if (!isFinite(d) || Math.abs(d) < 0.001) return '<span class="delta muted">±0 %</span>';
    const good = invert ? d < 0 : d > 0;
    return `<span class="delta ${good ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${f.pct(Math.abs(d), 1)}</span>`;
  };
  UI.strength = function (st) {
    const col = st.score >= 78 ? 'var(--good)' : st.score >= 55 ? 'var(--s4)' : st.score >= 30 ? 'var(--s3)' : 'var(--bad)';
    return `<span class="strength" title="${esc(st.tips.join('\n'))}"><span class="bar"><i style="width:${st.score}%;background:${col}"></i></span>${esc(st.label)}</span>`;
  };
  UI.campLink = (c) => `<a data-act="scope" data-cid="${c.id}">${esc(c.name)}</a>`;
  UI.typeIcon = (t) => `<span title="${esc(D.CAMPAIGN_TYPES[t].name)}">${D.CAMPAIGN_TYPES[t].icon}</span>`;

  // Kampagnen im aktuellen Bereich
  UI.scopeCamps = function (filter) {
    const S = APP.S;
    return S.campaigns.filter((c) => c.status !== 'removed' && (APP.scope.cid ? c.id === APP.scope.cid : !c.isTrial) && (!filter || filter(c)));
  };
  UI.scopeAgs = function (filter) {
    const cids = new Set(UI.scopeCamps().map((c) => c.id));
    return APP.S.adGroups.filter((a) => a.status !== 'removed' && cids.has(a.campaignId) && (!APP.scope.agid || a.id === APP.scope.agid) && (!filter || filter(a)));
  };

  // Seitenkopf mit Bereichsauswahl und Zeitraum
  UI.head = function (title, tools = '', o = {}) {
    const S = APP.S;
    const c = APP.scope.cid && M.camp(S, APP.scope.cid);
    const ag = APP.scope.agid && M.ag(S, APP.scope.agid);
    const crumbs = `<div class="crumbs"><a data-act="scope" data-cid="">Alle Kampagnen</a>${c ? ` › <a data-act="scope" data-cid="${c.id}">${esc(c.name)}</a>` : ''}${ag ? ` › ${esc(ag.name)}` : ''}</div>`;
    const scopeSel = o.noScope ? '' : `<select data-chg="scope" title="Kampagne"><option value="">Alle Kampagnen</option>${UI.campOpts(APP.scope.cid)}</select>`;
    const agSel = o.agScope && c ? `<select data-chg="agscope" title="Anzeigengruppe"><option value="">Alle Anzeigengruppen</option>${M.agsOf(S, c.id).map((a) => `<option value="${a.id}" ${a.id === APP.scope.agid ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>` : '';
    const rangeSel = o.noRange ? '' : `<select data-chg="range" title="Zeitraum">${Object.entries(UI.RANGES).map(([k, v]) => `<option value="${k}" ${k === APP.range ? 'selected' : ''}>${v}</option>`).join('')}</select><span class="muted small hide-sm">${UI.rangeLabel()}</span><select data-chg="compare" title="Vergleichen mit">${Object.entries(UI.COMPARE).map(([k, v]) => `<option value="${k}" ${k === APP.compare ? 'selected' : ''}>${k === 'off' ? v : 'Vgl.: ' + v}</option>`).join('')}</select>${APP.compare !== 'off' ? `<span class="muted small hide-sm" title="Vergleichszeitraum">${UI.cmpLabel()}</span>` : ''}`;
    return `<div class="pagehead"><div>${o.noScope ? '' : crumbs}<h1>${title}</h1></div><div class="tools">${scopeSel}${agSel}${rangeSel}${tools}</div></div>`;
  };

  // ---------- Modal / Toast / Popover ----------
  UI.modal = function (title, body, o = {}) {
    UI.closeModal();
    if (UI.hideTip) UI.hideTip();
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="backdrop" data-act="${o.static ? '' : 'mclose-bg'}"><div class="modal ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="mh"><h2>${title}</h2><button class="iconbtn" data-act="mclose" title="Schließen">✕</button></div><div class="mb">${body}</div>${o.footer !== false ? `<div class="mf">${o.footer || `<button class="btn" data-act="mclose">Abbrechen</button><button class="btn primary" data-act="msave">${o.saveLabel || 'Speichern'}</button>`}</div>` : ''}</div></div>`;
    UI._onSave = o.onSave || null;
    UI._onClose = o.onClose || null;
    const first = root.querySelector('input:not([type=checkbox]),select,textarea');
    if (first && !o.noFocus) setTimeout(() => first.focus(), 30);
    C.mount(root);
    UI.annotate(root);
    return root.querySelector('.modal');
  };
  UI.closeModal = function () {
    const root = document.getElementById('modal-root');
    if (root.innerHTML && UI._onClose) UI._onClose();
    root.innerHTML = ''; UI._onSave = null; UI._onClose = null;
  };
  UI.mbody = () => document.querySelector('#modal-root .mb');
  UI.val = (name, root = document.getElementById('modal-root')) => { const el = root.querySelector(`[name="${name}"]`); if (!el) return undefined; if (el.type === 'checkbox') return el.checked; return el.value; };
  UI.num = (name, root) => { const v = UI.val(name, root); if (v === undefined || v === '') return null; const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  UI.toast = function (msg, cls = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + cls; el.textContent = msg;
    const root = document.getElementById('toast-root');
    root.appendChild(el);
    while (root.children.length > 3) root.firstChild.remove();
    setTimeout(() => el.remove(), 4200);
  };
  UI.popover = function (anchor, html) {
    const root = document.getElementById('popover-root');
    if (root.innerHTML) { root.innerHTML = ''; return; }
    root.innerHTML = `<div class="popover">${html}</div>`;
    const p = root.firstChild, r = anchor.getBoundingClientRect();
    p.style.top = r.bottom + 6 + 'px';
    p.style.left = Math.max(8, Math.min(window.innerWidth - p.offsetWidth - 8, r.right - p.offsetWidth)) + 'px';
  };
  UI.closePopover = () => { document.getElementById('popover-root').innerHTML = ''; };
  UI.confirm = function (title, text, onOk, okLabel = 'Bestätigen') {
    UI.modal(title, `<p>${text}</p>`, { saveLabel: okLabel, onSave: () => { onOk(); return true; } });
  };

  // ---------- Navigation ----------
  const NAV = [
    ['', [['overview', '🏠', 'Übersicht'], ['recs', '💡', 'Empfehlungen'], ['tips', '🎓', 'Tipps & Beratung'], ['academy', '📚', 'Akademie']]],
    ['Kampagnen', [['campaigns', '📣', 'Kampagnen'], ['adgroups', '🗂️', 'Anzeigengruppen'], ['ads', '📝', 'Anzeigen'], ['assets', '🧩', 'Assets'], ['keywords', '🔑', 'Keywords'], ['searchterms', '🔎', 'Suchbegriffe'], ['negatives', '🚫', 'Ausschließende Keywords']]],
    ['Ausrichtung', [['audiences', '👥', 'Zielgruppen'], ['demographics', '🎂', 'Demografie'], ['locations', '📍', 'Standorte'], ['schedule', '🕒', 'Werbezeitplaner'], ['devices', '📱', 'Geräte']]],
    ['Statistiken & Markt', [['auction', '⚔️', 'Auktionsdaten'], ['market', '📈', 'Markt & Wettbewerb'], ['events', '📰', 'News & Ereignisse'], ['pmaxinsights', '⚡', 'PMax-Kanalbericht']]],
    ['Tools', [['planner', '🧭', 'Keyword-Planer'], ['conversions', '🎯', 'Conversions'], ['products', '🛒', 'Merchant Center'], ['experiments', '🧪', 'Tests'], ['reports', '📊', 'Berichte'], ['history', '🕘', 'Änderungsverlauf']]],
    ['Unternehmen', [['cro', '🧠', 'Conversion & Psychologie'], ['conditions', '🏦', 'Konditionen & Zinsen'], ['business', '🏢', 'Unternehmen & GuV'], ['billing', '💳', 'Abrechnung'], ['settings', '⚙️', 'Einstellungen']]],
  ];
  UI.renderNav = function () {
    const S = APP.S;
    let recCount = 0;
    try { recCount = APP._recs ? APP._recs.length : 0; } catch (e) { /* ignore */ }
    const disapproved = S.ads.filter((a) => a.status === 'enabled' && a.policy.status === 'disapproved').length;
    const html = NAV.map(([grp, items]) => (grp ? `<div class="navgroup">${grp}</div>` : '') + items.map(([id, ico, label]) => {
      if (id === 'products' && !M.ind(S).hasShopping) return '';
      if (id === 'conditions' && !S.bank) return '';
      const cnt = id === 'recs' && recCount ? recCount : id === 'ads' && disapproved ? disapproved : id === 'events' && APP.unreadEvents ? APP.unreadEvents : 0;
      return `<a class="navitem ${APP.view === id ? 'on' : ''}" data-act="nav" data-v="${id}"><span class="ico">${ico}</span>${label}${cnt ? `<span class="cnt">${cnt}</span>` : ''}</a>`;
    }).join('')).join('');
    document.getElementById('sidenav').innerHTML = html;
  };

  UI.renderTop = function () {
    const S = APP.S;
    const date = M.today(S);
    const unread = S.alerts.filter((a) => a.day >= (APP.alertsSeen ?? -1)).length;
    const cash = S.company.cash;
    const speeds = [[1, '1×'], [2, '3×'], [3, '10×'], [4, 'Max']];
    document.getElementById('topbar').innerHTML = `
      <button class="iconbtn" id="navtoggle" data-act="navtoggle" title="Menü">☰</button>
      <div class="brand">
        <svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 25 15 7" stroke="#fbbc04" stroke-width="6" stroke-linecap="round"/><path d="M17 7l9 18" stroke="#4285f4" stroke-width="6" stroke-linecap="round"/><circle cx="6.5" cy="24.5" r="3.6" fill="#34a853"/></svg>
        <span class="brand-title"><b>Ads</b> Simulator</span>
      </div>
      <div class="acct"><span class="name">${esc(S.company.name)}</span><span class="id">${esc(M.ind(S).icon + ' ' + M.ind(S).name)}</span></div>
      <div class="top-spacer"></div>
      <div class="simbar">
        <div class="simdate"><span class="d">${U.fmtDate(date)}</span><span class="t">Tag ${S.day + 1} · KW ${isoWeek(date)}</span></div>
        <span class="cash ${cash < 0 ? 'neg' : ''}" title="Unternehmenskasse">${f.eur0(cash)}</span>
        <button class="playbtn ${APP.running ? 'running' : ''}" data-act="play" title="${APP.running ? 'Pause (Leertaste)' : 'Simulation starten (Leertaste)'}">${APP.running ? '❚❚' : '▶'}</button>
        <div class="seg hide-sm">${speeds.map(([v, l]) => `<button class="${APP.speed === v ? 'on' : ''}" data-act="speed" data-v="${v}" title="Geschwindigkeit">${l}</button>`).join('')}</div>
        <div class="seg"><button data-act="step" data-n="1" title="Einen Tag simulieren">+1T</button><button data-act="step" data-n="7" title="Eine Woche simulieren">+7T</button><button data-act="step" data-n="30" class="hide-sm" title="30 Tage simulieren">+30T</button></div>
        <button class="iconbtn" data-act="alerts" title="Benachrichtigungen">🔔${unread ? `<span class="badge">${Math.min(unread, 99)}</span>` : ''}</button>
        <button class="iconbtn hide-sm" data-act="help" title="Hilfe & Mechaniken">?</button>
      </div>`;
  };
  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }

  UI.renderMain = function (force) {
    const main = document.getElementById('main');
    const ae = document.activeElement;
    if (!force && ae && main.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.type !== 'checkbox') return; // Eingaben nicht zerstören
    const v = V[APP.view] || V.overview;
    C.reset();
    if (UI.hideTip) UI.hideTip();
    UI._cmpCache = new Map();
    const y = window.scrollY;
    try {
      main.innerHTML = (APP.sandbox && G.ACAD ? G.ACAD.banner() : '') + v.render();
      const gp = G.GUIDE ? G.GUIDE.panel(APP.view) : '';
      if (gp) { const ph = main.querySelector(':scope > .pagehead'); if (ph) ph.insertAdjacentHTML('afterend', gp); else main.insertAdjacentHTML('afterbegin', gp); }
    } catch (e) {
      console.error(e);
      main.innerHTML = `<div class="card"><div class="bd" style="padding:16px"><b>Fehler beim Rendern der Ansicht.</b><pre class="small">${esc(e.stack || e)}</pre></div></div>`;
    }
    C.mount(main);
    UI.annotate(main);
    if (!force) window.scrollTo(0, y);
  };
  // Erklärungen aus dem Glossar an Tabellenköpfe, Kacheln & Kennzahl-Listen hängen
  UI.annotate = function (root) {
    if (!G.GLOSS || !UI.prefs().tips) return;
    for (const el of root.querySelectorAll('th, .lbl, dt, .stat .lbl, .kv dt, .field > span:first-child')) {
      if (el.dataset.tip) continue;
      const sel = el.querySelector('select');
      const txt = sel ? sel.options[sel.selectedIndex].text : el.textContent;
      const tip = G.GLOSS.get(txt);
      if (tip) { el.dataset.tip = tip; el.dataset.tipKey = txt; el.classList.add('has-tip'); }
    }
  };
  // Tooltip (Hover am Desktop, Antippen auf Touch-Geräten) – mit „Mehr erfahren" zu ausführlichen Erklärungen
  let tipEl = null, tipTimer = null, hideTimer = null, tipOwner = null;
  const detailFor = (el) => (G.GLOSS_DETAIL && UI.prefs().tipMore ? G.GLOSS_DETAIL.get(el.dataset.tipKey || el.textContent) : null);
  function showTip(el) {
    if (!tipEl) {
      tipEl = document.createElement('div'); tipEl.className = 'tipbox'; document.body.appendChild(tipEl);
      tipEl.addEventListener('mouseenter', () => clearTimeout(hideTimer));
      tipEl.addEventListener('mouseleave', () => { if (!touch) scheduleHide(); });
    }
    clearTimeout(hideTimer);
    if (tipOwner === el && tipEl.style.display === 'block') return;
    tipOwner = el;
    const det = detailFor(el);
    tipEl.innerHTML = esc(el.dataset.tip) + (det ? `<button class="tipmore" data-act="glossmore" data-id="${det.id}">ⓘ Mehr erfahren</button>` : '');
    tipEl.style.display = 'block';
    const r = el.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
    tipEl.style.maxWidth = w + 'px';
    const left = Math.max(12, Math.min(window.innerWidth - tipEl.offsetWidth - 12, r.left + r.width / 2 - tipEl.offsetWidth / 2));
    let top = r.bottom + 6;
    if (top + tipEl.offsetHeight > window.innerHeight - 8) top = r.top - tipEl.offsetHeight - 6;
    tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
  }
  function hideTip() { if (tipEl) tipEl.style.display = 'none'; tipOwner = null; }
  function scheduleHide() { clearTimeout(hideTimer); hideTimer = setTimeout(hideTip, 350); }
  UI.hideTip = hideTip;
  const touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  document.addEventListener('mouseover', (ev) => {
    if (touch) return;
    if (tipEl && tipEl.contains(ev.target)) return;
    const el = ev.target.closest && ev.target.closest('[data-tip]');
    if (el) showTip(el); else if (tipOwner) scheduleHide();
  });
  document.addEventListener('click', (ev) => {
    if (!touch) return;
    if (tipEl && tipEl.contains(ev.target)) return;
    const el = ev.target.closest && ev.target.closest('[data-tip]');
    if (el) { showTip(el); clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 6000); } else hideTip();
  }, true);
  window.addEventListener('scroll', hideTip, { passive: true });
  UI.render = function (force) {
    if (!APP.S) return;
    try { APP._recs = R.compute(APP.S); } catch (e) { console.error(e); APP._recs = []; }
    UI.renderTop(); UI.renderNav(); UI.renderMain(force);
  };
  UI.go = function (view, scope) {
    APP.view = view;
    if (scope) Object.assign(APP.scope, scope);
    document.getElementById('sidenav').classList.remove('open');
    UI.render(true);
    window.scrollTo(0, 0);
  };

  // ---------- Ereignis-Delegation ----------
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    const pop = document.getElementById('popover-root');
    if (pop.innerHTML && !ev.target.closest('.popover') && !(el && el.dataset.act === 'alerts')) UI.closePopover();
    if (!el) return;
    const act = el.dataset.act;
    if (!act) return;
    if (act === 'mclose-bg') { if (ev.target === el) UI.closeModal(); return; }
    const fn = ACT[act];
    if (fn) { if (el.tagName === 'A') ev.preventDefault(); fn(el, el.dataset, ev); }
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-chg]');
    if (el && ACT['chg_' + el.dataset.chg]) ACT['chg_' + el.dataset.chg](el, el.dataset, ev);
  });
  let inpTimer = null;
  document.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-inp]');
    if (!el) return;
    const fn = ACT['inp_' + el.dataset.inp];
    if (!fn) return;
    clearTimeout(inpTimer);
    inpTimer = setTimeout(() => fn(el, el.dataset, ev), el.dataset.inp === 'tsearch' ? 220 : 0);
  });
  window.addEventListener('resize', () => { clearTimeout(UI._rz); UI._rz = setTimeout(C.redrawAll, 150); });

  // Basis-Aktionen
  Object.assign(ACT, {
    nav: (el, d) => UI.go(d.v),
    navtoggle: () => document.getElementById('sidenav').classList.toggle('open'),
    mclose: () => UI.closeModal(),
    msave: () => { if (!UI._onSave || UI._onSave() !== false) { UI.closeModal(); UI.render(); } },
    sort: (el, d) => { const cur = APP.sort[d.t]; APP.sort[d.t] = { k: d.k, dir: cur && cur.k === d.k && cur.dir === 'desc' ? 'asc' : 'desc' }; UI.renderMain(true); },
    sel: (el, d) => { const s = APP.sel[d.t] || (APP.sel[d.t] = new Set()); el.checked ? s.add(d.id) : s.delete(d.id); UI.renderMain(true); },
    selall: (el, d) => { const s = APP.sel[d.t] || (APP.sel[d.t] = new Set()); const boxes = document.querySelectorAll(`[data-act="sel"][data-t="${d.t}"]`); boxes.forEach((b) => (el.checked ? s.add(b.dataset.id) : s.delete(b.dataset.id))); UI.renderMain(true); },
    selclear: (el, d) => { APP.sel[d.t] = new Set(); UI.renderMain(true); },
    scope: (el, d) => { APP.scope = { cid: d.cid || null, agid: d.agid || null }; if (d.cid && APP.view === 'campaigns') APP.view = 'adgroups'; if (d.agid) { const c = M.camp(APP.S, d.cid); APP.view = c && c.type === 'search' ? 'keywords' : 'ads'; } UI.render(true); },
    chg_scope: (el) => { APP.scope = { cid: el.value || null, agid: null }; UI.render(true); },
    chg_agscope: (el) => { APP.scope.agid = el.value || null; UI.render(true); },
    chg_range: (el) => { APP.range = el.value; UI.render(true); },
    chg_compare: (el) => { APP.compare = el.value; UI.render(true); },
    inp_tsearch: (el, d) => { APP.q[d.t] = el.value; UI.renderMain(true); const n = document.querySelector(`[data-inp="tsearch"][data-t="${d.t}"]`); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } },
    tab: (el, d) => { APP.tab[d.g] = d.v; UI.renderMain(true); },
    colpick: (el, d) => {
      const id = d.t, def = UI._colDefaults[id] || [], cur = UI.prefs().cols[id] || def;
      const body = `<p class="small muted" style="margin-top:0">Wählen Sie, welche Kennzahlen als Spalten erscheinen. Die Reihenfolge folgt Ihrer Auswahl; die Einstellung gilt für alle Spielstände. Fahren Sie über einen Spaltenkopf, um die Kennzahl erklärt zu bekommen.</p>`
        + UI.MET_GROUPS.map(([g, keys]) => `<h3 style="margin:12px 0 6px;font-size:14px">${g}</h3><div class="colpick">${keys.map((k) => `<label class="chk" ${G.GLOSS && G.GLOSS.get(MET[k].l) ? `title="${esc(G.GLOSS.get(MET[k].l))}"` : ''}><input type="checkbox" name="col_${k}" ${cur.includes(k) ? 'checked' : ''}> ${esc(MET[k].l)}</label>`).join('')}</div>`).join('');
      UI.modal('Spalten anpassen', body, {
        footer: `<button class="btn" data-act="colreset" data-t="${id}">Standard</button><button class="btn" data-act="mclose">Abbrechen</button><button class="btn primary" data-act="msave">Übernehmen</button>`,
        onSave: () => {
          const all = UI.MET_GROUPS.flatMap((x) => x[1]);
          const chosen = all.filter((k) => UI.val('col_' + k));
          const keep = cur.filter((k) => chosen.includes(k));
          const next = keep.concat(chosen.filter((k) => !keep.includes(k)));
          if (!next.length) { UI.toast('Mindestens eine Kennzahl auswählen', 'bad'); return false; }
          UI.setPref('cols', { ...UI.prefs().cols, [id]: next });
        },
      });
    },
    colreset: (el, d) => { const c = { ...UI.prefs().cols }; delete c[d.t]; UI.setPref('cols', c); UI.closeModal(); UI.render(true); },
  });

  G.UI = UI;
})();
