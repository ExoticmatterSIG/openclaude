/* Ads Simulator – Ansichten: Übersicht, Empfehlungen, Kampagnen, Anzeigengruppen, Anzeigen, Assets, Keywords, Suchbegriffe, Ausschlüsse */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, C = G.C, R = G.R, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc, I = E.I;

  const KPI_CHOICES = ['clk', 'imp', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'val', 'valPerConv', 'roas', 'roasP', 'gp', 'aconv', 'is', 'lostB', 'lostR', 'topIS', 'views', 'rconv', 'rroas', 'rgp', 'gap'];
  const INVERT = new Set(['cpc', 'cost', 'cpa', 'lostB', 'lostR', 'gap', 'rcpa']);

  // Tagesreihe für Konto oder gewählte Kampagne
  UI.dailySeries = function (keys, range = UI.rng()) {
    const S = APP.S;
    const [a, b] = range;
    const ids = APP.scope.cid ? [['camp', APP.scope.cid]] : [['acct', 'all']];
    const vecs = [];
    for (let d = a; d <= b; d++) {
      const v = E.zero();
      for (const [dim, id] of ids) { const s = S.stats[dim] && S.stats[dim][id] && S.stats[dim][id][d]; if (s) E.add(v, s); }
      vecs.push(UI.ext(E.derive(v)));
    }
    const labels = [], tips = [];
    for (let d = a; d <= b; d++) { const dt = U.dayToDate(S.startDate, d); labels.push(U.fmtShort(dt)); tips.push(U.fmtDate(dt)); }
    return { labels, tips, series: keys.map((k) => vecs.map((v) => v[k])) };
  };
  UI.eventMarks = function (range) {
    const S = APP.S, [a] = range;
    return S.market.log.filter((l) => l.day >= a && l.sev !== 'info').map((l) => ({ i: l.day - a, label: l.name, color: l.sev === 'crit' ? 'var(--bad)' : 'var(--s3)' }));
  };

  // ---------- Übersicht ----------
  V.overview = {
    render() {
      const S = APP.S;
      const dim = APP.scope.cid ? 'camp' : 'acct', id = APP.scope.cid || 'all';
      const cur = UI.m(dim, id), prev = UI.m(dim, id, UI.prevRng());
      let range = UI.rng();
      if (range[1] - range[0] < 6) range = [Math.max(0, S.day - 14), S.day - 1];
      const tiles = APP.kpis.map((k, i) => {
        const sel = APP.chart.indexOf(k);
        return `<div class="kpi ${sel === 0 ? 'sel1' : sel === 1 ? 'sel2' : ''}" data-act="kpichart" data-k="${k}">
          <div class="lbl"><select data-chg="kpi" data-i="${i}" onclick="event.stopPropagation()">${KPI_CHOICES.map((c) => `<option value="${c}" ${c === k ? 'selected' : ''}>${UI.MET[c].l}</option>`).join('')}</select></div>
          <div class="val">${UI.MET[k].f(cur[k])}</div>${UI.delta(cur[k], prev[k], INVERT.has(k))}</div>`;
      }).join('');
      let chart = '<div class="empty">Starten Sie die Simulation (▶ oder +1T), um Daten zu erzeugen.</div>';
      if (S.day > 0) {
        const ser = UI.dailySeries(APP.chart, range);
        chart = C.line({
          labels: ser.labels, tipLabels: ser.tips, height: 250, marks: UI.eventMarks(range),
          series: APP.chart.map((k, i) => ({ name: UI.MET[k].l, color: i ? 'var(--s2)' : 'var(--s1)', values: ser.series[i], fmt: UI.MET[k].f, axis: i ? 'right' : 'left', area: !i })),
        });
      }
      // kritische Ereignisse
      const crit = S.market.events.filter((e) => e.fixable && !e.done && e.start <= S.day && e.end >= S.day);
      const critHtml = crit.map((e) => `<div class="callout bad"><b>${esc(e.name)}</b> – ${esc(e.desc)} <button class="btn sm" data-act="fixevent" data-id="${e.id}">${esc(e.fixable.label)} (${f.eur0(e.fixable.cost)})</button></div>`).join('')
        + (S.company.cash <= 0 ? `<div class="callout bad"><b>Zahlungsproblem:</b> Ihre Unternehmenskasse ist leer – alle Anzeigen sind gestoppt. <button class="btn sm" data-act="capital">Kredit aufnehmen</button></div>` : '');
      // Kampagnen
      const camps = UI.scopeCamps();
      const rows = camps.map((c) => ({ id: c.id, c, m: UI.m('camp', c.id) }));
      const table = UI.table('ov_camps', [
        { k: 'name', l: 'Kampagne', f: (r) => `${UI.typeIcon(r.c.type)} ${UI.campLink(r.c)}`, sort: (r) => r.c.name },
        { k: 'status', l: 'Status', f: (r) => UI.pill(M.campaignStatus(S, r.c)), sort: (r) => M.campaignStatus(S, r.c)[0] },
        { k: 'budget', l: 'Budget', num: true, f: (r) => f.eur(r.c.budget) + '/Tag', sort: (r) => r.c.budget },
        ...UI.mcols(['clk', 'cost', 'conv', 'cpa', 'roas']),
      ], rows, { defaultSort: { k: 'cost', dir: 'desc' }, empty: 'Noch keine Kampagnen. <a data-act="newcampaign">Jetzt erstellen</a>' });
      const recs = APP._recs || [];
      const score = R.score(S, recs);
      const scoreCard = UI.card('Optimierungsfaktor', `<div style="display:flex;gap:16px;align-items:center">${C.ring(score)}<div><div class="small muted">${recs.length} Empfehlung(en) verfügbar.</div>${recs.slice(0, 3).map((r) => `<div class="small" style="margin-top:6px">${r.icon} ${esc(r.title)} <span class="up">+${r.impact} %</span></div>`).join('')}<div style="margin-top:10px"><a data-act="nav" data-v="recs">Alle Empfehlungen ansehen</a></div></div></div>`);
      const h = S.market.hist.slice(-30);
      const last = h[h.length - 1];
      const marketCard = UI.card('Marktpuls', last ? `<dl class="kv">
        <dt>Nachfrage-Index</dt><dd>${f.num2(last.demand)} ${C.spark(h.map((x) => x.demand))}</dd>
        <dt>CPC-Index</dt><dd>${f.num2(last.cpcIdx)} ${C.spark(h.map((x) => x.cpcIdx), 'var(--s2)')}</dd>
        <dt>Kauflaune (CVR-Index)</dt><dd>${f.num2(last.cvrIdx)} ${C.spark(h.map((x) => x.cvrIdx), 'var(--s4)')}</dd>
        <dt>Ø Markt-CPC</dt><dd>${f.eur(last.mktCpc)}</dd>
        <dt>Ihr Klickanteil</dt><dd>${f.pct(last.share, 1)}</dd>
        <dt>Aktive Mitbewerber</dt><dd>${last.comps}</dd>
        <dt>Saison</dt><dd>${(S.market.fx?.cal || []).map((n) => `<span class="tag">${esc(n)}</span>`).join(' ') || '<span class="muted">–</span>'}</dd>
      </dl><div style="margin-top:10px"><a data-act="nav" data-v="market">Markt & Wettbewerb öffnen</a></div>` : '<div class="muted">Noch keine Marktdaten.</div>');
      const [a, b] = UI.rng();
      let rev = 0, gross = 0, ads = 0, other = 0;
      for (let d = a; d <= b; d++) { const p = S.pnl[d]; if (p) { rev += p.rev; gross += p.gross; ads += p.ads; other += p.other; } }
      const accV = UI.m('acct', 'all');
      const pnl = UI.card('Unternehmensergebnis', `<dl class="kv">
        <dt>Umsatz (tatsächlich)</dt><dd>${f.eur(rev)}</dd><dt>Rohertrag</dt><dd>${f.eur(gross)}</dd><dt>Werbekosten</dt><dd>${f.eur(ads)}</dd><dt>Sonstige Kosten</dt><dd>${f.eur(other)}</dd>
        <dt><b>Gewinn nach Werbung</b></dt><dd><b class="${gross - ads - other >= 0 ? 'up' : 'down'}">${f.eur(gross - ads - other)}</b></dd>
        <dt>Organische Markenconversions</dt><dd>${f.int(UI.m('org', 'all').rconv)} <span class="muted small">(ohne Klickkosten)</span></dd>
        <dt>Gemessener ROAS</dt><dd>${f.num2(accV.roas)} <span class="muted small">(laut Google Ads)</span></dd><dt>Tatsächlicher ROAS</dt><dd>${f.num2(accV.rroas)} <span class="muted small">(Messlücke ${f.pct(1 - U.div(accV.val, accV.rval), 0)})</span></dd>
      </dl>`, { tools: '<a data-act="nav" data-v="business">Details</a>' });
      const news = S.market.log.slice(0, 6).map((l) => `<li><span class="sev ${l.sev}"></span><span class="when">${U.fmtShort(U.dayToDate(S.startDate, l.day))}</span><span class="what"><b>${esc(l.name)}</b><div class="small muted">${esc(l.desc)}</div></span></li>`).join('');
      const GL = G.GOALS;
      let goalsCard = '';
      if (GL && S.goals) {
        const g = S.goals, prog = GL.progress(S);
        const elapsed = U.clamp((S.day - g.periodStart) / Math.max(1, g.periodEnd - g.periodStart + 1), 0, 1);
        const rowsG = g.targets.map((t) => {
          const v = prog[t.id], met = GL.met(t, v);
          const share = t.dir === 'min' ? U.clamp(U.div(v || 0, t.value), 0, 1) : (v === null ? 0 : met ? 1 : U.clamp(t.value / v, 0, 1));
          const onTrack = t.dir === 'min' ? share >= elapsed * 0.95 : met;
          const req = GL.required(S, t);
          const unit = (x) => (t.unit === 'eur' ? f.eur0(x) : f.num1(x));
          const reqHtml = req && req.need > 0 ? `<div class="tiny ${req.cur !== null && req.cur < req.need ? 'down' : 'muted'}">Nötig ab heute: ${unit(req.need)} je 100 € Budget${req.cur !== null ? ` · aktuell ${unit(req.cur)}` : ''}${t.capped ? ' · an Budget angepasst' : ''}</div>` : '';
          return `<div style="margin-top:8px"><div class="small" style="display:flex;justify-content:space-between;gap:8px"><span>${U.esc(t.name)}</span><span class="${onTrack ? 'up' : 'down'}">${GL.fmt(t, v)} / ${t.dir === 'min' ? '≥' : '≤'} ${GL.fmt(t, t.value)}</span></div><div class="bar"><i style="width:${share * 100}%;background:${onTrack ? 'var(--good)' : 'var(--s3)'}"></i></div>${reqHtml}</div>`;
        }).join('');
        const ms = GL.monthSpend(S), mr = ms / g.monthBudget;
        const dim = U.daysInMonth(M.today(S)), dom = M.today(S).getUTCDate();
        const tr = g.trust ?? 60, lvl = g.sanction || 0;
        const trustCol = tr >= 50 ? 'var(--good)' : tr >= 35 ? 'var(--s3)' : 'var(--bad)';
        const trustHtml = `<div style="margin-bottom:10px"><div class="small" style="display:flex;justify-content:space-between"><span><b>Vertrauen der Geschäftsleitung</b></span><span style="color:${trustCol}"><b>${Math.round(tr)}</b> / 100</span></div><div class="bar" style="height:8px"><i style="width:${tr}%;background:${trustCol}"></i></div>${lvl ? `<div class="small" style="margin-top:6px">${UI.pill([GL.LEVELS[lvl].name, lvl >= 3 ? 'bad' : 'warn'])}${g.pip ? ` <b class="down">noch ${g.pip.until - S.day} Tage – Ziel: Vertrauen ≥ 35</b>` : ''}</div>` : ''}</div>`;
        goalsCard = UI.card('Zielvorgaben der Geschäftsleitung', trustHtml + `<div class="small muted">Zeitraum bis ${U.fmtDate(U.dayToDate(S.startDate, g.periodEnd), false)} · ${f.pct0(elapsed)} vergangen${g.history[0] ? ' · Letzte Note: <b>' + g.history[0].grade + '</b>' : ''}</div>${rowsG}
          <div style="margin-top:12px"><div class="small" style="display:flex;justify-content:space-between"><span>Monatsbudget (Controlling)</span><span class="${mr > (dom - 1) / dim * 1.08 ? 'down' : 'up'}">${f.eur0(ms)} / ${f.eur0(g.monthBudget)}</span></div><div class="bar"><i style="width:${Math.min(100, mr * 100)}%;background:${mr > 1 ? 'var(--bad)' : 'var(--primary)'}"></i></div><div class="tiny muted">Hochrechnung Monatsende: ${f.eur0(ms / Math.max(1, dom - 1) * dim)}</div></div>`, { tools: '<a data-act="nav" data-v="business">Details</a>' });
      }
      const newsCard = UI.card('Neuigkeiten aus dem Markt', news ? `<ul class="feed">${news}</ul>` : '<div class="empty">Noch ruhig im Markt …</div>', { flush: true, tools: '<a data-act="nav" data-v="events">Alle</a>' });
      return UI.head('Übersicht', `<button class="btn primary" data-act="newcampaign">＋ Neue Kampagne</button>`) + critHtml
        + `<div class="card"><div class="kpis">${tiles}</div><div class="bd" style="padding-top:12px">${chart}</div></div>`
        + `<div class="grid g21"><div>${UI.card('Kampagnen', table, { flush: true, tools: '<a data-act="nav" data-v="campaigns">Alle Kampagnen</a>' })}${newsCard}</div><div>${goalsCard}${scoreCard}${marketCard}${pnl}</div></div>`;
    },
  };
  ACT.kpichart = (el, d) => { const k = d.k; if (APP.chart[0] === k) return; APP.chart = [k, APP.chart[0]]; UI.renderMain(true); };
  ACT.chg_kpi = (el, d) => { APP.kpis[+d.i] = el.value; UI.renderMain(true); };
  ACT.fixevent = (el, d) => { const e = APP.S.market.events.find((x) => x.id === d.id); if (e) { R.fixEvent(APP.S, e); UI.toast('Problem behoben: ' + e.name, 'good'); UI.render(); } };

  // ---------- Empfehlungen ----------
  V.recs = {
    render() {
      const S = APP.S, recs = APP._recs || [];
      const score = R.score(S, recs);
      const cats = [...new Set(recs.map((r) => r.cat))];
      const body = cats.map((cat) => UI.card(cat, recs.filter((r) => r.cat === cat).map((r) => `<div class="rec"><div class="ic">${r.icon}</div><div class="body"><div class="ttl">${esc(r.title)}</div><div class="small muted" style="margin:4px 0 8px">${esc(r.desc)}</div><div class="acts">${r.apply ? `<button class="btn sm primary" data-act="recapply" data-id="${esc(r.id)}">Übernehmen</button>` : ''}${r.view ? `<button class="btn sm" data-act="${r.view === 'wizard' ? 'newcampaign' : 'nav'}" data-v="${r.view}">Ansehen</button>` : ''}<button class="btn sm ghost" data-act="recdismiss" data-id="${esc(r.id)}">Ablehnen</button></div></div><div class="imp">+${r.impact} %</div></div>`).join(''), { flush: true })).join('');
      return UI.head('Empfehlungen', recs.some((r) => r.apply) ? '<button class="btn" data-act="recall">Alle übernehmen</button>' : '', { noScope: true, noRange: true })
        + `<div class="card"><div class="bd" style="padding:16px;display:flex;gap:20px;align-items:center">${C.ring(score, 110)}<div><h3>Optimierungsfaktor</h3><div class="muted small" style="max-width:640px">Geschätzte Leistungsfähigkeit Ihres Kontos. Empfehlungen basieren auf den Daten der letzten 14–30 Tage. Wie im echten Google Ads gilt: Nicht jede Empfehlung ist für Ihre Ziele sinnvoll – prüfen Sie z. B. Budgeterhöhungen gegen Ihre Marge.</div><label class="chk small" style="margin-top:8px"><input type="checkbox" data-chg="autoapply" ${S.account.autoApply ? 'checked' : ''}> Empfehlungen wöchentlich automatisch anwenden</label></div></div></div>`
        + (recs.length ? body : '<div class="card"><div class="empty">🎉 Keine offenen Empfehlungen.</div></div>');
    },
  };
  const findRec = (id) => (APP._recs || []).find((r) => r.id === id);
  ACT.recapply = (el, d) => { const r = findRec(d.id); if (r) { R.apply(APP.S, r); UI.toast('Empfehlung übernommen', 'good'); UI.render(); } };
  ACT.recdismiss = (el, d) => { const r = findRec(d.id); if (r) { R.dismiss(APP.S, r); UI.render(); } };
  ACT.recall = () => UI.confirm('Alle Empfehlungen übernehmen?', 'Alle Empfehlungen mit automatischer Umsetzung werden angewendet (inkl. Budgeterhöhungen und kostenpflichtiger Website-Optimierungen).', () => { for (const r of APP._recs || []) if (r.apply) R.apply(APP.S, r); UI.toast('Empfehlungen übernommen', 'good'); });
  ACT.chg_autoapply = (el) => { APP.S.account.autoApply = el.checked; M.log(APP.S, 'Konto', 'Automatisch angewendete Empfehlungen', el.checked ? 'Aktiviert' : 'Deaktiviert'); };

  // ---------- Kampagnen ----------
  V.campaigns = {
    render() {
      const S = APP.S;
      const typeF = APP.q.camptype || '';
      const camps = S.campaigns.filter((c) => c.status !== 'removed' && !c.isTrial && (!typeF || c.type === typeF) && (!APP.scope.cid || c.id === APP.scope.cid));
      const rows = camps.map((c) => ({ id: c.id, c, m: UI.m('camp', c.id) }));
      const tot = UI.totals(camps.map((c) => UI.sum('camp', c.id)));
      const cols = [
        { k: 'tg', l: '', nosort: true, f: (r) => UI.toggle(r.c.status === 'enabled', 'togglecamp', `data-id="${r.c.id}"`) },
        { k: 'name', l: 'Kampagne', f: (r) => `${UI.typeIcon(r.c.type)} ${UI.campLink(r.c)}${r.c.labels.length ? ' ' + r.c.labels.map((l) => `<span class="tag">${esc(l)}</span>`).join(' ') : ''}`, sort: (r) => r.c.name },
        { k: 'budget', l: 'Budget', num: true, f: (r) => `<input class="inline" data-chg="budget" data-id="${r.c.id}" value="${r.c.budget.toFixed(2)}"> €`, sort: (r) => r.c.budget },
        { k: 'status', l: 'Status', f: (r) => UI.pill(M.campaignStatus(S, r.c)) + (r.c.learnUntil > S.day ? `<div class="tiny muted">${esc(r.c.learnReason || '')} · noch ${r.c.learnUntil - S.day} T</div>` : ''), sort: (r) => M.campaignStatus(S, r.c)[0] },
        { k: 'bid', l: 'Gebotsstrategie', f: (r) => `<a data-act="editcampaign" data-id="${r.c.id}">${esc(M.bidLabel(r.c))}</a>`, sort: (r) => r.c.bidStrategy.type },
        ...UI.mcolsFor('camps', ['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'val', 'roas', 'is', 'lostB', 'lostR']),
        { k: 'act', l: '', nosort: true, f: (r) => `<button class="btn sm ghost" data-act="editcampaign" data-id="${r.c.id}" title="Einstellungen">⚙</button><button class="btn sm ghost" data-act="copycampaign" data-id="${r.c.id}" title="Kopieren">⧉</button><button class="btn sm ghost danger" data-act="removecampaign" data-id="${r.c.id}" title="Entfernen">🗑</button>` },
      ];
      const filters = `<select data-chg="camptype"><option value="">Alle Typen</option>${Object.entries(D.CAMPAIGN_TYPES).map(([k, v]) => `<option value="${k}" ${k === typeF ? 'selected' : ''}>${v.name}</option>`).join('')}</select>`;
      return UI.head('Kampagnen', '<button class="btn primary" data-act="newcampaign">＋ Neue Kampagne</button>')
        + UI.card('Alle Kampagnen', UI.table('camps', cols, rows, { totals: tot, search: (r) => r.c.name, filters, select: true, bulk: '<button class="btn sm" data-act="bulkcamp" data-s="enabled">Aktivieren</button><button class="btn sm" data-act="bulkcamp" data-s="paused">Pausieren</button>', empty: 'Keine Kampagnen. <a data-act="newcampaign">Erstellen Sie Ihre erste Kampagne.</a>' }), { flush: true });
    },
  };
  ACT.chg_camptype = (el) => { APP.q.camptype = el.value; UI.renderMain(true); };
  ACT.togglecamp = (el, d) => { const c = M.camp(APP.S, d.id); M.setStatus(APP.S, 'Kampagne', c, c.status === 'enabled' ? 'paused' : 'enabled'); UI.render(); };
  ACT.chg_budget = (el, d) => {
    const c = M.camp(APP.S, d.id), v = parseFloat(el.value.replace(',', '.'));
    if (!(v >= 1)) { UI.toast('Budget muss mindestens 1 € betragen', 'bad'); el.value = c.budget; return; }
    M.updateCampaign(APP.S, c, { budget: v }, `Budget ${f.eur(c.budget)} → ${f.eur(v)}`);
    UI.toast('Budget gespeichert'); UI.render(true);
  };
  ACT.bulkcamp = (el, d) => { const s = APP.sel.camps; for (const id of s) M.setStatus(APP.S, 'Kampagne', M.camp(APP.S, id), d.s); s.clear(); UI.render(); };
  ACT.removecampaign = (el, d) => { const c = M.camp(APP.S, d.id); UI.confirm('Kampagne entfernen?', `„${esc(c.name)}" wird entfernt. Statistiken bleiben im Konto erhalten.`, () => { M.setStatus(APP.S, 'Kampagne', c, 'removed'); if (APP.scope.cid === c.id) APP.scope = { cid: null, agid: null }; }, 'Entfernen'); };

  // ---------- Anzeigengruppen ----------
  V.adgroups = {
    render() {
      const S = APP.S;
      const ags = UI.scopeAgs();
      const rows = ags.map((ag) => ({ id: ag.id, ag, c: M.camp(S, ag.campaignId), m: UI.m('ag', ag.id) }));
      const cols = [
        { k: 'tg', l: '', nosort: true, f: (r) => UI.toggle(r.ag.status === 'enabled', 'toggleag', `data-id="${r.ag.id}"`) },
        { k: 'name', l: 'Anzeigengruppe', f: (r) => `<a data-act="scope" data-cid="${r.c.id}" data-agid="${r.ag.id}">${esc(r.ag.name)}</a> <span class="tag">${{ standard: 'Standard', productgroup: 'Produktgruppe', assetgroup: 'Asset-Gruppe', display: 'Display', video: 'Video', app: 'App' }[r.ag.kind]}</span>`, sort: (r) => r.ag.name },
        { k: 'camp', l: 'Kampagne', f: (r) => UI.campLink(r.c), sort: (r) => r.c.name },
        { k: 'bid', l: 'Standard-Max.-CPC', num: true, f: (r) => (['manual', 'maxclicks'].includes(r.c.bidStrategy.type) || ['search', 'shopping'].includes(r.c.type) && !D.BID_STRATEGIES[r.c.bidStrategy.type].smart ? `<input class="inline" data-chg="agbid" data-id="${r.ag.id}" value="${r.ag.defaultBid.toFixed(2)}"> €` : '<span class="muted small">automatisch</span>'), sort: (r) => r.ag.defaultBid },
        { k: 'lp', l: 'Landingpage', f: (r) => `<span class="small" title="PageSpeed ${r.ag.lp.speed}/100 · Relevanz ${Math.round(r.ag.lp.relevance * 100)} %">⚡${r.ag.lp.speed} · 🎯${Math.round(r.ag.lp.relevance * 100)} % ${r.ag.lp.mobile ? '📱' : ''}</span>`, sort: (r) => M.lpScore(S, r.ag) },
        ...UI.mcolsFor('ags', ['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'roas']),
        { k: 'act', l: '', nosort: true, f: (r) => `<button class="btn sm ghost" data-act="editag" data-id="${r.ag.id}">⚙</button><button class="btn sm ghost danger" data-act="removeag" data-id="${r.ag.id}">🗑</button>` },
      ];
      return UI.head('Anzeigengruppen', '<button class="btn primary" data-act="newag">＋ Anzeigengruppe</button>')
        + UI.card('Anzeigengruppen', UI.table('ags', cols, rows, { search: (r) => r.ag.name + ' ' + r.c.name, totals: UI.totals(ags.map((a) => UI.sum('ag', a.id))) }), { flush: true });
    },
  };
  ACT.toggleag = (el, d) => { const ag = M.ag(APP.S, d.id); M.setStatus(APP.S, 'Anzeigengruppe', ag, ag.status === 'enabled' ? 'paused' : 'enabled'); UI.render(); };
  ACT.chg_agbid = (el, d) => { const ag = M.ag(APP.S, d.id), v = parseFloat(el.value.replace(',', '.')); if (!(v > 0)) return; M.log(APP.S, 'Anzeigengruppe', ag.name, `Standardgebot ${f.eur(ag.defaultBid)} → ${f.eur(v)}`); ag.defaultBid = v; UI.toast('Gebot gespeichert'); };
  ACT.removeag = (el, d) => { const ag = M.ag(APP.S, d.id); UI.confirm('Anzeigengruppe entfernen?', esc(ag.name), () => M.setStatus(APP.S, 'Anzeigengruppe', ag, 'removed'), 'Entfernen'); };

  // ---------- Anzeigen ----------
  UI.adPreview = function (ad) {
    const S = APP.S;
    const ag = M.ag(S, ad.adGroupId), c = M.camp(S, ag.campaignId);
    const dom = S.company.domain;
    if (ad.type === 'rsa') {
      const hs = ad.headlines.filter((h) => h.t), ds = ad.descriptions.filter((d) => d.t);
      const pick = [1, 2, 3].map((p) => (hs.find((h) => h.pin === p) || hs.filter((h) => !h.pin)[p - 1] || {}).t).filter(Boolean);
      const sl = M.assetsFor(S, c.id).filter((a) => a.type === 'sitelink').slice(0, 4);
      const callouts = M.assetsFor(S, c.id).filter((a) => a.type === 'callout').slice(0, 4);
      return `<div class="adprev"><div class="sp"><b>Gesponsert</b></div><div class="url">${esc(dom)}${ad.path1 ? ' › ' + esc(ad.path1) : ''}${ad.path2 ? ' › ' + esc(ad.path2) : ''}</div><div class="h">${pick.map(esc).join(' | ')}</div><div class="d">${ds.slice(0, 2).map((d) => esc(d.t)).join(' ')}${callouts.length ? ' ' + callouts.map((a) => esc(a.data.text)).join(' · ') : ''}</div>${sl.length ? `<div class="sl">${sl.map((a) => esc(a.data.text)).join('')}</div>` : ''}</div>`;
    }
    if (ad.type === 'video') return `<div class="adprev"><div style="background:#000;color:#fff;border-radius:6px;height:120px;display:flex;align-items:center;justify-content:center;font-size:30px">▶</div><div class="h" style="font-size:15px">${esc(ad.name)}</div><div class="d">${esc({ instream: 'In-Stream (überspringbar)', infeed: 'In-Feed', shorts: 'Shorts' }[ad.format])} · ${ad.lengthSec}s · ${esc({ smartphone: 'Smartphone-Video', ugc: 'Creator/UGC', pro: 'Professionelle Produktion' }[ad.quality])}${ad.cta ? ' · CTA: ' + esc(ad.cta) : ''}</div></div>`;
    const hs = (ad.headlines || []).filter((h) => h.t);
    return `<div class="adprev"><div style="background:linear-gradient(135deg,var(--primary-soft),var(--good-soft));border-radius:6px;height:90px;display:flex;align-items:center;justify-content:center;color:var(--text-2)">🖼️ ${ad.images || 0} Bild(er) · ${ad.logos ? 'Logo' : 'kein Logo'} · ${ad.videos || 0} Video(s)</div><div class="h" style="font-size:15px">${esc(hs[0] ? hs[0].t : 'Anzeigentitel')}</div><div class="d">${esc(((ad.descriptions || [])[0] || {}).t || '')}</div><div class="url">${esc(dom)}</div></div>`;
  };
  V.ads = {
    render() {
      const S = APP.S;
      const ags = UI.scopeAgs((ag) => ag.kind !== 'productgroup');
      const ads = S.ads.filter((a) => a.status !== 'removed' && ags.some((ag) => ag.id === a.adGroupId));
      const cards = ads.map((ad) => {
        const ag = M.ag(S, ad.adGroupId), c = M.camp(S, ag.campaignId);
        const m = UI.m('ad', ad.id);
        const st = M.adStrength(S, ad);
        return `<div class="adcard"><div class="meta">${UI.toggle(ad.status === 'enabled', 'togglead', `data-id="${ad.id}"`)} ${UI.pill(M.policyLabel(S, ad))} <span class="tag">${{ rsa: 'Responsive Suchanzeige', rda: 'Responsive Displayanzeige', video: 'Videoanzeige', assetgroup: 'Asset-Gruppe', app: 'App-Anzeige', dg: 'Demand-Gen-Anzeige' }[ad.type]}</span><span class="muted">${UI.campLink(c)} › ${esc(ag.name)}</span></div>
          ${UI.adPreview(ad)}
          ${ad.policy.reasons.length ? `<div class="small ${ad.policy.status === 'disapproved' ? 'down' : 'muted'}">⚠ ${ad.policy.reasons.map(esc).join(' · ')}</div>` : ''}
          <div class="meta">Anzeigenstärke: ${UI.strength(st)} <span title="Creative-Ermüdung durch häufige Auslieferung. Auffrischen durch Bearbeiten." class="${E.fatigue(ad) < 0.8 ? 'down' : 'muted'}">· Wirkung ${f.pct0(E.fatigue(ad))}</span></div>
          <div class="meta mono">Impr. <b>${f.int(m.imp)}</b> · Klicks <b>${f.int(m.clk)}</b> · CTR <b>${f.pct(m.ctr)}</b> · Conv. <b>${f.num1(m.conv)}</b> · Kosten <b>${f.eur(m.cost)}</b></div>
          <div class="meta"><button class="btn sm" data-act="editad" data-id="${ad.id}">Bearbeiten</button>${ad.type === 'rsa' ? `<button class="btn sm ghost" data-act="autoassets" data-id="${ad.id}">✨ Assets generieren</button>` : ''}<button class="btn sm ghost danger" data-act="removead" data-id="${ad.id}">Entfernen</button></div></div>`;
      }).join('');
      return UI.head('Anzeigen', '<button class="btn primary" data-act="newad">＋ Anzeige</button>', { agScope: true })
        + `<div class="card"><div class="hd"><h3>Anzeigen (${ads.length})</h3><span class="sub">Neue oder bearbeitete Anzeigen werden ca. 1 Tag geprüft.</span></div>${ads.length ? `<div class="adlist">${cards}</div>` : '<div class="empty">Keine Anzeigen im gewählten Bereich.</div>'}</div>`;
    },
  };
  ACT.togglead = (el, d) => { const ad = M.byId(APP.S.ads, d.id); M.setStatus(APP.S, 'Anzeige', ad, ad.status === 'enabled' ? 'paused' : 'enabled'); UI.render(); };
  ACT.removead = (el, d) => { const ad = M.byId(APP.S.ads, d.id); UI.confirm('Anzeige entfernen?', 'Die Anzeige wird entfernt.', () => M.setStatus(APP.S, 'Anzeige', ad, 'removed'), 'Entfernen'); };
  ACT.autoassets = (el, d) => { const ad = M.byId(APP.S.ads, d.id); R.autoHeadlines(APP.S, ad); UI.toast('Assets generiert – Anzeige wird geprüft'); UI.render(); };

  // ---------- Assets ----------
  UI.assetText = function (a) {
    const d = a.data;
    switch (a.type) {
      case 'sitelink': return `<b>${esc(d.text)}</b>${d.d1 ? ' – ' + esc(d.d1) : ''}`;
      case 'snippet': return `${esc(d.header)}: ${esc(d.values)}`;
      case 'call': return '📞 ' + esc(d.phone);
      case 'promotion': return `${esc(d.text)} (−${d.pct} %)`;
      case 'price': return `${esc(d.text || 'Preise')}`;
      default: return esc(d.text || d.name || '');
    }
  };
  V.assets = {
    render() {
      const S = APP.S;
      const list = S.assets.filter((a) => a.status !== 'removed' && (!APP.scope.cid || a.campaignId === APP.scope.cid || a.level === 'account'));
      const rows = list.map((a) => ({ id: a.id, a }));
      const cols = [
        { k: 'tg', l: '', nosort: true, f: (r) => UI.toggle(r.a.status === 'enabled', 'toggleasset', `data-id="${r.a.id}"`) },
        { k: 'type', l: 'Asset-Typ', f: (r) => esc(D.ASSET_TYPES[r.a.type].name), sort: (r) => r.a.type },
        { k: 'txt', l: 'Asset', wrap: true, f: (r) => UI.assetText(r.a), sort: (r) => JSON.stringify(r.a.data) },
        { k: 'lvl', l: 'Ebene', f: (r) => (r.a.level === 'account' ? 'Konto' : 'Kampagne: ' + esc((M.camp(S, r.a.campaignId) || {}).name || '?')), sort: (r) => r.a.level },
        { k: 'perf', l: 'Effekt (geschätzt)', f: (r) => `<span class="small muted">CTR +${Math.round(D.ASSET_TYPES[r.a.type].ctr * 100)} % · Ad Rank +${Math.round(D.ASSET_TYPES[r.a.type].rank * 100)} %</span>`, nosort: true },
        { k: 'act', l: '', nosort: true, f: (r) => `<button class="btn sm ghost danger" data-act="removeasset" data-id="${r.a.id}">🗑</button>` },
      ];
      const cov = Object.entries(D.ASSET_TYPES).map(([t, def]) => {
        const n = S.assets.filter((a) => a.type === t && a.status === 'enabled').length;
        return `<span class="tag" style="${n >= def.min ? 'color:var(--good)' : ''}">${n >= def.min ? '✓' : '○'} ${def.name} (${n})</span>`;
      }).join(' ');
      return UI.head('Assets', '<button class="btn primary" data-act="newasset">＋ Asset</button>', { noRange: true })
        + `<div class="callout">Assets (früher „Anzeigenerweiterungen") erhöhen Klickrate und Ad Rank. Sie werden vor allem in oberen Anzeigenpositionen ausgeliefert. Kampagnen-Assets überschreiben Konto-Assets desselben Typs.<div style="margin-top:8px">${cov}</div></div>`
        + UI.card('Assets', UI.table('assets', cols, rows, { search: (r) => JSON.stringify(r.a.data), empty: 'Noch keine Assets.' }), { flush: true });
    },
  };
  ACT.toggleasset = (el, d) => { const a = M.byId(APP.S.assets, d.id); M.setStatus(APP.S, 'Asset', { ...a, name: D.ASSET_TYPES[a.type].name }, a.status === 'enabled' ? 'paused' : 'enabled'); a.status = a.status === 'enabled' ? 'paused' : 'enabled'; UI.render(); };
  ACT.removeasset = (el, d) => { const a = M.byId(APP.S.assets, d.id); a.status = 'removed'; M.log(APP.S, 'Asset', D.ASSET_TYPES[a.type].name, 'Entfernt'); UI.render(); };

  // ---------- Keywords ----------
  V.keywords = {
    render() {
      const S = APP.S;
      const ags = UI.scopeAgs((ag) => ag.kind === 'standard');
      const agIds = new Set(ags.map((a) => a.id));
      const kws = S.keywords.filter((k) => k.status !== 'removed' && agIds.has(k.adGroupId));
      const rows = kws.map((kw) => { const ag = M.ag(S, kw.adGroupId); return { id: kw.id, kw, ag, c: M.camp(S, ag.campaignId), m: UI.m('kw', kw.id), qs: kw.rt && kw.rt.qs ? kw.rt.qs : M.qualityScore(S, kw) }; });
      const lvl = (t) => `<span class="small ${t.startsWith('Über') ? 'up' : t.startsWith('Unter') ? 'down' : 'muted'}">${t.replace('durchschnittlich', '-durchschn.').replace('Durchschnittlich', 'Durchschn.')}</span>`;
      const cols = [
        { k: 'tg', l: '', nosort: true, f: (r) => UI.toggle(r.kw.status === 'enabled', 'togglekw', `data-id="${r.kw.id}"`) },
        { k: 'text', l: 'Keyword', f: (r) => `<b>${UI.match(r.kw)}</b>`, sort: (r) => r.kw.text },
        { k: 'match', l: 'Keyword-Option', f: (r) => `<select data-chg="kwmatch" data-id="${r.kw.id}">${Object.entries(UI.matchName).map(([k, v]) => `<option value="${k}" ${k === r.kw.match ? 'selected' : ''}>${v}</option>`).join('')}</select>`, sort: (r) => r.kw.match },
        { k: 'ag', l: 'Anzeigengruppe', f: (r) => esc(r.ag.name) + `<div class="tiny muted">${esc(r.c.name)}</div>`, sort: (r) => r.ag.name },
        { k: 'status', l: 'Status', f: (r) => UI.pill(M.keywordStatus(S, r.kw)), sort: (r) => M.keywordStatus(S, r.kw)[0] },
        { k: 'cpc', l: 'Max. CPC', num: true, f: (r) => (r.c.bidStrategy.type === 'manual' ? `<input class="inline" data-chg="kwbid" data-id="${r.kw.id}" value="${(r.kw.maxCpc || r.ag.defaultBid).toFixed(2)}" title="${r.kw.maxCpc ? 'Keyword-Gebot' : 'Standardgebot der Anzeigengruppe'}"> €` : '<span class="muted small">auto</span>'), sort: (r) => r.kw.maxCpc || r.ag.defaultBid },
        { k: 'qs', l: 'QF', num: true, title: 'Qualitätsfaktor (1–10)', f: (r) => UI.qs(r.qs), sort: (r) => r.qs.score },
        { k: 'qctr', l: 'Erw. CTR', f: (r) => lvl(r.qs.ctr), sort: (r) => r.qs.cL },
        { k: 'qrel', l: 'Anzeigenrel.', f: (r) => lvl(r.qs.rel), sort: (r) => r.qs.rL },
        { k: 'qlp', l: 'LP-Erfahrung', f: (r) => lvl(r.qs.lp), sort: (r) => r.qs.lL },
        { k: 'fp', l: 'Gebot 1. Seite', num: true, f: (r) => (r.kw.rt && r.kw.rt.firstPage ? f.eur(r.kw.rt.firstPage) : '–'), sort: (r) => (r.kw.rt && r.kw.rt.firstPage) || 0 },
        { k: 'tp', l: 'Gebot oben', num: true, f: (r) => (r.kw.rt && r.kw.rt.topPage ? f.eur(r.kw.rt.topPage) : '–'), sort: (r) => (r.kw.rt && r.kw.rt.topPage) || 0 },
        ...UI.mcolsFor('kws', ['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'top', 'abs']),
        { k: 'act', l: '', nosort: true, f: (r) => `<button class="btn sm ghost danger" data-act="removekw" data-id="${r.kw.id}">🗑</button>` },
      ];
      return UI.head('Keywords', '<button class="btn primary" data-act="newkw">＋ Keywords</button>', { agScope: true })
        + UI.card('Such-Keywords', UI.table('kws', cols, rows, { search: (r) => r.kw.text + ' ' + r.ag.name, totals: UI.totals(kws.map((k) => UI.sum('kw', k.id))), select: true, bulk: '<button class="btn sm" data-act="bulkkw" data-s="enabled">Aktivieren</button><button class="btn sm" data-act="bulkkw" data-s="paused">Pausieren</button><button class="btn sm" data-act="bulkkwbid">Gebote ändern</button><button class="btn sm" data-act="bulkkw" data-s="removed">Entfernen</button>', defaultSort: { k: 'cost', dir: 'desc' }, empty: 'Keine Keywords. Fügen Sie Keywords zu einer Suchkampagne hinzu.' }), { flush: true })
        + '<div class="muted small">Qualitätsfaktor = 1 + erwartete CTR (0/1,75/3,5) + Anzeigenrelevanz (0/1/2) + Landingpage-Erfahrung (0/1,75/3,5). Er beeinflusst Ad Rank und tatsächlichen CPC: Ad Rank = Gebot × Qualität × Assets × Kontext.</div>';
    },
  };
  ACT.togglekw = (el, d) => { const k = M.byId(APP.S.keywords, d.id); M.setStatus(APP.S, 'Keyword', k, k.status === 'enabled' ? 'paused' : 'enabled'); UI.render(); };
  ACT.removekw = (el, d) => { const k = M.byId(APP.S.keywords, d.id); M.setStatus(APP.S, 'Keyword', k, 'removed'); UI.render(); };
  ACT.chg_kwbid = (el, d) => { const k = M.byId(APP.S.keywords, d.id), v = parseFloat(el.value.replace(',', '.')); if (!(v > 0)) return; M.log(APP.S, 'Keyword', k.text, `Max. CPC → ${f.eur(v)}`); k.maxCpc = v; UI.toast('Gebot gespeichert'); };
  ACT.chg_kwmatch = (el, d) => { const k = M.byId(APP.S.keywords, d.id); M.log(APP.S, 'Keyword', k.text, `Keyword-Option ${UI.matchName[k.match]} → ${UI.matchName[el.value]}`); k.match = el.value; UI.render(true); };
  ACT.bulkkw = (el, d) => { const s = APP.sel.kws; for (const id of s) M.setStatus(APP.S, 'Keyword', M.byId(APP.S.keywords, id), d.s); s.clear(); UI.render(); };
  ACT.bulkkwbid = () => {
    UI.modal('Gebote ändern', `<div class="row"><div class="field"><span>Aktion</span><select name="mode"><option value="set">Gebot festlegen (€)</option><option value="pct">Um % ändern</option><option value="fp">Auf „Gebot 1. Seite" setzen</option><option value="tp">Auf „Gebot oben" setzen</option></select></div><div class="field"><span>Wert</span><input type="text" name="v" value="10"></div></div>`, {
      onSave: () => {
        const mode = UI.val('mode'), v = UI.num('v');
        for (const id of APP.sel.kws) {
          const k = M.byId(APP.S.keywords, id), ag = M.ag(APP.S, k.adGroupId), cur = k.maxCpc || ag.defaultBid;
          if (mode === 'set' && v > 0) k.maxCpc = v;
          if (mode === 'pct' && v !== null) k.maxCpc = Math.max(0.01, +(cur * (1 + v / 100)).toFixed(2));
          if (mode === 'fp' && k.rt && k.rt.firstPage) k.maxCpc = +(k.rt.firstPage * 1.05).toFixed(2);
          if (mode === 'tp' && k.rt && k.rt.topPage) k.maxCpc = +(k.rt.topPage * 1.05).toFixed(2);
        }
        M.log(APP.S, 'Keywords', APP.sel.kws.size + ' Keywords', 'Gebote geändert (' + mode + ')');
        APP.sel.kws.clear();
      },
    });
  };

  // ---------- Suchbegriffe ----------
  V.searchterms = {
    render() {
      const S = APP.S;
      const camps = UI.scopeCamps((c) => ['search', 'pmax', 'shopping'].includes(c.type));
      const rows = [];
      for (const c of camps) {
        const kws = M.agsOf(S, c.id).flatMap((ag) => M.kwsOf(S, ag.id));
        const negs = M.campaignNegatives(S, c.id);
        for (const key of E.keys(S, 'st', c.id + '~')) {
          const vec = UI.sum('st', key);
          if (!vec[I.imp]) continue;
          const q = M.byId(S.queries, key.split('~')[1]);
          if (!q) continue;
          let best = null, br = 0;
          for (const k of kws) { const r = M.matchRel(k, q); if (r > br) { br = r; best = k; } }
          const added = kws.some((k) => k.text === U.norm(q.text) && k.status !== 'removed');
          const excluded = negs.some((n) => M.negBlocks(n, q));
          rows.push({ id: key, q, c, kw: best, added, excluded, m: E.derive(vec) });
        }
      }
      const cols = [
        { k: 'q', l: 'Suchbegriff', f: (r) => `<b>${esc(r.q.text)}</b>${r.q.brand === 'player' ? ' <span class="tag">Marke</span>' : r.q.brand ? ' <span class="tag">Mitbewerber-Marke</span>' : ''}`, sort: (r) => r.q.text },
        { k: 'st', l: 'Status', f: (r) => (r.added ? UI.pill(['Hinzugefügt', 'good']) : r.excluded ? UI.pill(['Ausgeschlossen', 'bad']) : UI.pill(['Keine', 'muted'])), sort: (r) => (r.added ? 2 : r.excluded ? 1 : 0) },
        { k: 'kw', l: 'Keyword', f: (r) => (r.c.type === 'search' ? (r.kw ? UI.match(r.kw) : '–') : `<span class="muted small">${r.c.type === 'pmax' ? 'PMax-Suchkategorie' : 'Shopping'}</span>`), sort: (r) => (r.kw ? r.kw.text : '') },
        { k: 'mt', l: 'Übereinstimmung', f: (r) => (r.kw ? (U.norm(r.q.text) === r.kw.text ? 'Genau passend' : r.kw.match === 'exact' ? 'Genau passend (ähnl. Variante)' : UI.matchName[r.kw.match]) : '–'), sort: (r) => (r.kw ? r.kw.match : '') },
        { k: 'camp', l: 'Kampagne', f: (r) => UI.campLink(r.c), sort: (r) => r.c.name },
        { k: 'intent', l: 'Kaufabsicht (Sim)', f: (r) => `<span class="bar" title="${f.num2(r.q.intent)}"><i style="width:${Math.min(100, r.q.intent * 50)}%;background:${r.q.intent >= 1 ? 'var(--good)' : r.q.intent >= 0.5 ? 'var(--s3)' : 'var(--bad)'}"></i></span>`, sort: (r) => r.q.intent },
        ...UI.mcolsFor('st', ['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa']),
      ];
      return UI.head('Suchbegriffe')
        + '<div class="callout">Hier sehen Sie, bei welchen tatsächlichen Suchanfragen Ihre Anzeigen ausgeliefert wurden. Fügen Sie gute Suchbegriffe als Keywords hinzu und schließen Sie irrelevante aus. Die Spalte „Kaufabsicht" ist ein Simulations-Einblick, den es im echten Google Ads nicht gibt.</div>'
        + UI.card('Suchbegriffe', UI.table('st', cols, rows, { search: (r) => r.q.text, select: true, bulk: '<button class="btn sm" data-act="staddkw">Als Keyword hinzufügen</button><button class="btn sm" data-act="staddneg">Als ausschließendes Keyword</button>', defaultSort: { k: 'cost', dir: 'desc' }, empty: 'Noch keine Suchbegriffe im Zeitraum.' }), { flush: true });
    },
  };
  ACT.staddneg = () => {
    const S = APP.S, sel = [...APP.sel.st];
    UI.modal('Als ausschließende Keywords hinzufügen', `<div class="field"><span>Keyword-Option</span><select name="m"><option value="exact">Genau passend</option><option value="phrase">Passende Wortgruppe</option></select></div><div class="field"><span>Ebene</span><select name="lvl"><option value="camp">Jeweilige Kampagne</option><option value="acct">Konto (alle Kampagnen)</option></select></div><div class="small muted">${sel.map((k) => esc(M.byId(S.queries, k.split('~')[1]).text)).join(', ')}</div>`, {
      onSave: () => {
        for (const key of sel) { const [cid, qid] = key.split('~'); const q = M.byId(S.queries, qid); S.negatives.push({ id: M.nid(S, 'ng'), text: q.text, match: UI.val('m'), campaignId: UI.val('lvl') === 'acct' ? null : cid }); }
        M.log(S, 'Ausschließende Keywords', sel.length + ' Suchbegriffe', 'Hinzugefügt'); APP.sel.st.clear(); UI.toast('Ausschließende Keywords hinzugefügt');
      },
    });
  };
  ACT.staddkw = () => {
    const S = APP.S, sel = [...APP.sel.st];
    const ags = S.adGroups.filter((a) => a.kind === 'standard' && a.status !== 'removed');
    if (!ags.length) { UI.toast('Keine Such-Anzeigengruppe vorhanden', 'bad'); return; }
    UI.modal('Als Keywords hinzufügen', `<div class="field"><span>Anzeigengruppe</span><select name="ag">${ags.map((a) => `<option value="${a.id}">${esc(M.camp(S, a.campaignId).name)} › ${esc(a.name)}</option>`).join('')}</select></div><div class="field"><span>Keyword-Option</span><select name="m"><option value="exact">Genau passend</option><option value="phrase">Passende Wortgruppe</option><option value="broad">Weitgehend passend</option></select></div><div class="small muted">${sel.map((k) => esc(M.byId(S.queries, k.split('~')[1]).text)).join(', ')}</div>`, {
      onSave: () => {
        const ag = M.ag(S, UI.val('ag'));
        for (const key of sel) S.keywords.push(M.makeKeyword(S, ag, M.byId(S.queries, key.split('~')[1]).text, UI.val('m')));
        M.log(S, 'Keywords', ag.name, sel.length + ' Keyword(s) aus Suchbegriffen hinzugefügt'); APP.sel.st.clear(); UI.toast('Keywords hinzugefügt');
      },
    });
  };

  // ---------- Ausschließende Keywords ----------
  V.negatives = {
    render() {
      const S = APP.S;
      const tab = APP.tab.neg || 'kw';
      const tabs = `<div class="tabs"><button class="${tab === 'kw' ? 'on' : ''}" data-act="tab" data-g="neg" data-v="kw">Keywords</button><button class="${tab === 'lists' ? 'on' : ''}" data-act="tab" data-g="neg" data-v="lists">Listen mit ausschließenden Keywords</button></div>`;
      let body;
      if (tab === 'kw') {
        const negs = S.negatives.filter((n) => !APP.scope.cid || n.campaignId === APP.scope.cid || n.campaignId === null);
        body = UI.card('Ausschließende Keywords', UI.table('negs', [
          { k: 'text', l: 'Ausschließendes Keyword', f: (r) => `<b>${UI.match(r.n)}</b>`, sort: (r) => r.n.text },
          { k: 'match', l: 'Option', f: (r) => UI.matchName[r.n.match], sort: (r) => r.n.match },
          { k: 'lvl', l: 'Ebene', f: (r) => (r.n.campaignId ? 'Kampagne: ' + esc((M.camp(S, r.n.campaignId) || {}).name || '?') : 'Konto'), sort: (r) => r.n.campaignId || '' },
          { k: 'blk', l: 'Blockierte Suchanfragen (Sim)', f: (r) => { const n = S.queries.filter((q) => M.negBlocks(r.n, q)); return `<span class="small muted" title="${esc(n.map((q) => q.text).join('\n'))}">${n.length}</span>`; }, nosort: true },
          { k: 'act', l: '', nosort: true, f: (r) => `<button class="btn sm ghost danger" data-act="removeneg" data-id="${r.n.id}">🗑</button>` },
        ], negs.map((n) => ({ id: n.id, n })), { search: (r) => r.n.text, empty: 'Keine ausschließenden Keywords.' }), { flush: true, tools: '<button class="btn primary" data-act="newneg">＋ Ausschließende Keywords</button>' });
      } else {
        body = UI.card('Listen', S.negLists.length ? S.negLists.map((l) => `<div class="rec"><div class="ic">📃</div><div class="body"><div class="ttl">${esc(l.name)}</div><div class="small muted">${l.terms.map((t) => UI.match(t)).join(', ') || 'leer'}</div><div class="small" style="margin-top:6px">Angewendet auf: ${l.campaigns.map((id) => esc((M.camp(S, id) || {}).name || '?')).join(', ') || '<span class="muted">keine Kampagnen</span>'}</div></div><div class="acts"><button class="btn sm" data-act="editneglist" data-id="${l.id}">Bearbeiten</button><button class="btn sm ghost danger" data-act="removeneglist" data-id="${l.id}">🗑</button></div></div>`).join('') : '<div class="empty">Noch keine Listen. Listen lassen sich auf mehrere Kampagnen anwenden.</div>', { flush: true, tools: '<button class="btn primary" data-act="editneglist">＋ Liste</button>' });
      }
      return UI.head('Ausschließende Keywords', '', { noRange: true }) + tabs + body;
    },
  };
  ACT.removeneg = (el, d) => { const S = APP.S; const n = M.byId(S.negatives, d.id); S.negatives = S.negatives.filter((x) => x.id !== d.id); M.log(S, 'Ausschließende Keywords', n.text, 'Entfernt'); UI.render(); };
  ACT.removeneglist = (el, d) => { const S = APP.S; S.negLists = S.negLists.filter((x) => x.id !== d.id); M.log(S, 'Ausschließende Keywords', 'Liste', 'Entfernt'); UI.render(); };
})();
