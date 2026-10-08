/* Ads Simulator – Ansichten: Auktionsdaten, Markt & Wettbewerb, News & Ereignisse, PMax-Kanalbericht */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, C = G.C, R = G.R, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc;

  const STYLE = { aggressive: 'Aggressiv / wachstumsorientiert', profit: 'Profitorientiert', budget: 'Budgetgetrieben', brand: 'Markenfokus, defensiv', erratic: 'Sprunghaft', marketplace: 'Marktplatz / Großbudget' };

  // ---------- Auktionsdaten ----------
  V.auction = {
    render() {
      const S = APP.S;
      const pre = APP.scope.cid ? APP.scope.cid + '~' : 'all~';
      const you = UI.sum('ai', pre + '_you');
      const rows = [];
      if (you[0] > 0) rows.push({ id: '_you', name: 'Sie', you: true, is: you[1] / you[0], overlap: null, above: null, top: you[4] / Math.max(you[1], 1e-9), abs: you[5] / Math.max(you[1], 1e-9), out: null });
      for (const comp of S.competitors) {
        const v = UI.sum('ai', pre + comp.id);
        if (!v[0] || v[1] / v[0] < 0.1) continue; // Google zeigt nur relevante Mitbewerber
        rows.push({ id: comp.id, comp, name: comp.domain, is: v[1] / v[0], overlap: v[2] / Math.max(you[1], 1e-9), above: v[3] / Math.max(v[2], 1e-9), top: v[4] / Math.max(v[1], 1e-9), abs: v[5] / Math.max(v[1], 1e-9), out: v[6] / v[0] });
      }
      const pct = (x) => (x === null ? '–' : x < 0.1 ? '< 10 %' : f.pct(x, 1));
      const cols = [
        { k: 'name', l: 'Domain des Anzeigenkunden', f: (r) => (r.you ? '<b>Sie</b>' : esc(r.name) + (r.comp && !r.comp.active ? ' <span class="tag">inaktiv</span>' : '')), sort: (r) => (r.you ? 'zzz' : r.name) },
        { k: 'is', l: 'Anteil an möglichen Impr.', num: true, f: (r) => pct(r.is), sort: (r) => r.is },
        { k: 'overlap', l: 'Überschneidungsrate', num: true, f: (r) => pct(r.overlap), sort: (r) => r.overlap || 0 },
        { k: 'above', l: 'Rate der höheren Position', num: true, f: (r) => pct(r.above), sort: (r) => r.above || 0 },
        { k: 'top', l: 'Rate oben auf der Seite', num: true, f: (r) => pct(r.top), sort: (r) => r.top },
        { k: 'abs', l: 'Rate ganz oben auf der Seite', num: true, f: (r) => pct(r.abs), sort: (r) => r.abs },
        { k: 'out', l: 'Anteil an Überholvorgängen', num: true, f: (r) => pct(r.out), sort: (r) => r.out || 0 },
      ];
      // Wochenverlauf Anteil an möglichen Impressionen
      const weeks = [];
      const top = rows.filter((r) => !r.you).sort((a, b) => b.is - a.is).slice(0, 4);
      let chart = '';
      if (S.day >= 14 && top.length) {
        for (let w = Math.max(0, S.day - 7 * 12); w + 6 < S.day; w += 7) weeks.push(w);
        const ser = [{ name: 'Sie', id: '_you', color: C.SERIES[0] }].concat(top.map((r, i) => ({ name: r.name, id: r.comp.id, color: C.SERIES[i + 1] })));
        chart = UI.card('Anteil an möglichen Impressionen im Zeitverlauf (wöchentlich)', C.line({
          labels: weeks.map((w) => 'KW ab ' + U.fmtShort(U.dayToDate(S.startDate, w))), height: 230,
          series: ser.map((s) => ({ name: s.name, color: s.color, fmt: (x) => f.pct(x, 1), axisFmt: (x) => Math.round(x * 100) + '%', values: weeks.map((w) => { const v = E.sumRange(S, 'ai', pre + s.id, w, w + 6); return v[0] ? v[1] / v[0] : 0; }) })),
        }));
      }
      return UI.head('Auktionsdaten', '', {}) + '<div class="callout">Auktionsdaten vergleichen Ihre Leistung mit anderen Werbetreibenden, die an denselben Auktionen teilgenommen haben (nur Suchnetzwerk). Kleinere Werbetreibende werden zusammengefasst und nicht angezeigt.</div>'
        + UI.card('Auktionsdaten – Suche', UI.table('ai', cols, rows, { defaultSort: { k: 'is', dir: 'desc' }, empty: 'Noch keine Auktionsdaten. Aktivieren Sie eine Suchkampagne und simulieren Sie einige Tage.' }), { flush: true }) + chart;
    },
  };

  // ---------- Markt & Wettbewerb ----------
  V.market = {
    render() {
      const S = APP.S, ind = M.ind(S);
      const h = S.market.hist;
      const n = Math.min(h.length, 180);
      const hh = h.slice(-n);
      const labels = hh.map((x) => U.fmtShort(U.dayToDate(S.startDate, x.day)));
      const marks = S.market.log.filter((l) => l.sev !== 'info' && l.day >= (hh[0] ? hh[0].day : 0)).map((l) => ({ i: l.day - hh[0].day, label: l.name }));
      const idxChart = hh.length > 1 ? C.line({ labels, height: 220, marks, series: [
        { name: 'Nachfrage (inkl. Saison/Ereignisse)', color: C.SERIES[0], values: hh.map((x) => x.demand), fmt: f.num2, axisFmt: f.num2 },
        { name: 'CPC-Index (Inflation & Wettbewerb)', color: C.SERIES[1], values: hh.map((x) => x.cpcIdx), fmt: f.num2, axisFmt: f.num2 },
        { name: 'Kauflaune (CVR-Index)', color: C.SERIES[3], values: hh.map((x) => x.cvrIdx), fmt: f.num2, axisFmt: f.num2 },
      ] }) : '<div class="empty">Noch keine Marktdaten.</div>';
      const cpcChart = hh.length > 1 ? C.line({ labels, height: 200, series: [
        { name: 'Ø Markt-CPC (Ihre Auktionen)', color: C.SERIES[1], values: hh.map((x) => x.mktCpc), fmt: f.eur, axisFmt: (x) => f.num2(x) + '€' },
        { name: 'Ihr Klickanteil', color: C.SERIES[0], values: hh.map((x) => x.share), fmt: (x) => f.pct(x, 1), axisFmt: (x) => Math.round(x * 100) + '%', axis: 'right' },
      ] }) : '';
      const rng = U.makeRng(S.seed + S.day * 7);
      const comps = S.competitors.map((c) => {
        const status = !c.active ? ['Ausgestiegen', 'muted'] : c.pausedUntil !== null && c.pausedUntil >= S.day ? ['Pausiert', 'warn'] : c.isNew ? ['Neu im Markt', 'learn'] : ['Aktiv', 'good'];
        const recent = c.h7.slice(-7);
        const spend = U.avg(recent, (x) => x.spend);
        return { id: c.id, c, status, aggr: c.aggr / (c.baseAggr || 1), spendEst: spend * rng.range(0.75, 1.3), lost: U.avg(recent, (x) => x.lost) };
      });
      const compT = UI.table('comps', [
        { k: 'name', l: 'Mitbewerber', f: (r) => `<b>${esc(r.c.name)}</b><div class="tiny muted">${esc(r.c.domain)}</div>`, sort: (r) => r.c.name },
        { k: 'st', l: 'Status', f: (r) => UI.pill(r.status), sort: (r) => r.status[0] },
        { k: 'style', l: 'Verhalten (beobachtet)', f: (r) => esc(STYLE[r.c.style] || r.c.style), sort: (r) => r.c.style },
        { k: 'aggr', l: 'Bietintensität', f: (r) => `<span class="bar" style="display:inline-block;width:80px" title="${f.num2(r.c.aggr)}"><i style="width:${Math.min(100, r.c.aggr * 40)}%;background:${r.c.aggr > 1.3 ? 'var(--bad)' : r.c.aggr > 1 ? 'var(--s3)' : 'var(--good)'}"></i></span> ${r.aggr > 1.08 ? '↗' : r.aggr < 0.92 ? '↘' : '→'}`, sort: (r) => r.c.aggr },
        { k: 'spend', l: 'Geschätzte Ausgaben/Tag', num: true, f: (r) => (r.c.active && r.spendEst ? '~' + f.eur0(Math.round(r.spendEst / 10) * 10) : '–'), sort: (r) => r.spendEst },
        { k: 'qs', l: 'Ø Qualität (geschätzt)', num: true, f: (r) => `${'★'.repeat(Math.round(r.c.qs / 2))}${'☆'.repeat(5 - Math.round(r.c.qs / 2))}`, sort: (r) => r.c.qs },
        { k: 'th', l: 'Themen', wrap: true, f: (r) => r.c.themes.map((t) => `<span class="tag">${esc((M.theme(S, t) || { name: t }).name)}</span>`).join(' ') + (r.c.shopping ? ' <span class="tag">🛒 Shopping</span>' : ''), nosort: true },
        { k: 'geo', l: 'Gebiet', f: (r) => (r.c.geo.length >= 18 ? 'DACH' : r.c.geo.length >= 16 ? 'Deutschland' : r.c.geo.join(', ')), sort: (r) => r.c.geo.length },
      ], comps, { defaultSort: { k: 'aggr', dir: 'desc' } });
      const date = M.today(S);
      const themes = ind.themes.map((t) => {
        const season = t.season ? U.seasonAt(t.season, date) : 1;
        const trend = S.market.themeTrend[t.id];
        const ev = (S.market.fx && S.market.fx.themeDemand[t.id]) || 1;
        const vol = U.sum(S.queries.filter((q) => q.theme === t.id), (q) => q.vol);
        const next = t.season ? U.seasonAt(t.season, U.addDays(date, 60)) / season - 1 : 0;
        return { id: t.id, t, season, trend, ev, vol: vol * season * trend * ev * U.seasonAt(ind.season, date), next, comps: S.competitors.filter((c) => c.active && c.themes.includes(t.id)).length };
      });
      const themeT = UI.table('themes', [
        { k: 'name', l: 'Themenbereich', f: (r) => `<b>${esc(r.t.name)}</b>`, sort: (r) => r.t.name },
        { k: 'vol', l: 'Suchvolumen/Monat (aktuell)', num: true, f: (r) => f.compact(r.vol), sort: (r) => r.vol },
        { k: 'season', l: 'Saisonfaktor', num: true, f: (r) => '×' + f.num2(r.season), sort: (r) => r.season },
        { k: 'trend', l: 'Trend', num: true, f: (r) => `<span class="${r.trend >= 1 ? 'up' : 'down'}">${f.signedPct(r.trend - 1)}</span>`, sort: (r) => r.trend },
        { k: 'ev', l: 'Ereigniseffekt', num: true, f: (r) => (r.ev !== 1 ? `<span class="${r.ev > 1 ? 'up' : 'down'}">×${f.num2(r.ev)}</span>` : '–'), sort: (r) => r.ev },
        { k: 'next', l: 'Ausblick 60 Tage', num: true, f: (r) => `<span class="${r.next >= 0 ? 'up' : 'down'}">${f.signedPct(r.next)}</span>`, sort: (r) => r.next },
        { k: 'comps', l: 'Mitbewerber', num: true, f: (r) => r.comps, sort: (r) => r.comps },
      ], themes, { defaultSort: { k: 'vol', dir: 'desc' } });
      const upcoming = E.upcomingCal(S, 8).map((u) => {
        const days = Math.round((u.start - date) / 86400000);
        const fxs = Object.entries(u.fx).filter(([k]) => typeof u.fx[k] === 'number').map(([k, v]) => `${{ demand: 'Nachfrage', cvr: 'CVR', cpc: 'CPC', compAggr: 'Wettbewerb', aov: 'Warenkorb' }[k] || k} ${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)} %`).join(' · ') || Object.entries(u.fx.themeDemand || {}).map(([t, v]) => `${(M.theme(S, t) || { name: t }).name} ${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)} %`).join(' · ');
        return `<li><span class="sev ${days <= 0 ? 'warn' : ''}"></span><span class="when">${days <= 0 ? 'läuft' : 'in ' + days + ' T'}</span><span class="what"><b>${esc(u.ev.name)}</b> <span class="small muted">${U.fmtShort(u.start)}–${U.fmtShort(u.end)}</span><div class="small muted">${esc(fxs)}</div></span></li>`;
      }).join('');
      return UI.head('Markt & Wettbewerb', '', { noScope: true, noRange: true })
        + `<div class="grid g21"><div>${UI.card('Marktindizes', idxChart)}${UI.card('Markt-CPC & Ihr Klickanteil', cpcChart || '<div class="empty">–</div>')}</div><div>${UI.card('Saisonkalender', `<ul class="feed">${upcoming}</ul>`, { flush: true })}${UI.card('Ihre Marke', `<dl class="kv"><dt>Markenbekanntheit</dt><dd>${f.pct(S.company.awareness, 1)}</dd><dt>Marken-Suchvolumen</dt><dd>${f.int(U.sum(S.queries.filter((q) => q.brand === 'player'), (q) => q.vol))}/Monat</dd><dt>Preisniveau</dt><dd>${f.signedPct(S.company.priceAdj)} vs. Markt</dd></dl><div class="small muted" style="margin-top:8px">Display-, Video- und Demand-Gen-Kampagnen steigern die Bekanntheit – und damit Markensuchen und Klickraten.</div>`)}</div></div>`
        + UI.card('Mitbewerber', compT, { flush: true, sub: 'Beobachtete Werte – Budgets sind Schätzungen mit Unsicherheit' })
        + UI.card('Themenbereiche & Nachfrage', themeT, { flush: true });
    },
  };

  // ---------- News & Ereignisse ----------
  V.events = {
    render() {
      const S = APP.S;
      APP.unreadEvents = 0;
      const active = S.market.events.filter((e) => e.start <= S.day && e.end >= S.day && !e.done);
      const act = active.map((e) => `<li><span class="sev ${e.sev}"></span><span class="when">${e.end > S.day + 500 ? 'bis behoben' : 'noch ' + (e.end - S.day + 1) + ' T'}</span><span class="what"><b>${esc(e.name)}</b><div class="small muted">${esc(e.desc)}</div>${e.fixable ? `<button class="btn sm" style="margin-top:6px" data-act="fixevent" data-id="${e.id}">${esc(e.fixable.label)} (${f.eur0(e.fixable.cost)})</button>` : ''}</span></li>`).join('');
      const cal = (S.market.fx?.cal || []).map((n) => `<li><span class="sev"></span><span class="when">Saison</span><span class="what"><b>${esc(n)}</b></span></li>`).join('');
      const log = S.market.log.slice(0, 120).map((l) => `<li><span class="sev ${l.sev}"></span><span class="when">${U.fmtShort(U.dayToDate(S.startDate, l.day))}</span><span class="what"><b>${esc(l.name)}</b><div class="small muted">${esc(l.desc)}</div></span></li>`).join('');
      const news = S.market.news.slice(0, 30).map((n) => `<li><span class="sev"></span><span class="when">${U.fmtShort(U.dayToDate(S.startDate, n.day))}</span><span class="what">${esc(n.text)}</span></li>`).join('');
      return UI.head('News & Ereignisse', '', { noScope: true, noRange: true })
        + `<div class="grid g2"><div>${UI.card('Aktuell wirksam', act || cal ? `<ul class="feed">${act}${cal}</ul>` : '<div class="empty">Keine besonderen Ereignisse.</div>', { flush: true })}${UI.card('Branchennews', news ? `<ul class="feed">${news}</ul>` : '<div class="empty">–</div>', { flush: true })}</div><div>${UI.card('Ereignis-Chronik', log ? `<ul class="feed">${log}</ul>` : '<div class="empty">Noch keine Ereignisse.</div>', { flush: true })}</div></div>`;
    },
  };

  // ---------- PMax-Kanalbericht ----------
  V.pmaxinsights = {
    render() {
      const S = APP.S;
      const camps = UI.scopeCamps((c) => c.type === 'pmax' || c.type === 'demandgen' || c.type === 'app' || c.type === 'search');
      const NETS = { search: 'Google-Suche', partners: 'Suchnetzwerk-Partner', shopping: 'Shopping', display: 'Displaynetzwerk', youtube: 'YouTube', discover: 'Discover & Gmail' };
      const rows = [];
      for (const c of camps) for (const [k, name] of Object.entries(NETS)) { const m = UI.m('net', c.id + '~' + k); if (m.imp > 0) rows.push({ id: c.id + k, c, name, k, m }); }
      const t = UI.table('nets', [
        { k: 'camp', l: 'Kampagne', f: (r) => `${UI.typeIcon(r.c.type)} ${UI.campLink(r.c)}`, sort: (r) => r.c.name },
        { k: 'name', l: 'Kanal / Netzwerk', f: (r) => `<b>${r.name}</b>`, sort: (r) => r.name },
        ...UI.mcols(['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cpa', 'val', 'roas', 'views', 'vconv']),
      ], rows, { defaultSort: { k: 'cost', dir: 'desc' }, empty: 'Keine Daten. Erstellen Sie eine Performance-Max-Kampagne oder aktivieren Sie Suchnetzwerk-Partner.' });
      const pm = camps.filter((c) => c.type === 'pmax');
      const ags = pm.flatMap((c) => M.agsOf(S, c.id));
      const agT = ags.length ? UI.table('pmaxag', [
        { k: 'name', l: 'Asset-Gruppe', f: (r) => `<b>${esc(r.ag.name)}</b><div class="tiny muted">${esc(M.camp(S, r.ag.campaignId).name)}</div>`, sort: (r) => r.ag.name },
        { k: 'str', l: 'Anzeigeneffektivität', f: (r) => { const ad = M.adsOf(S, r.ag.id)[0]; return ad ? UI.strength(M.adStrength(S, ad)) : '–'; }, nosort: true },
        { k: 'th', l: 'Suchthemen', wrap: true, f: (r) => (r.ag.themes || []).map((t) => `<span class="tag">${esc((M.theme(S, t) || { name: t }).name)}</span>`).join(' ') || '<span class="muted small">keine</span>', nosort: true },
        { k: 'sig', l: 'Zielgruppensignale', f: (r) => (r.ag.audiences || []).length + ' Segment(e)', nosort: true },
        ...UI.mcols(['clk', 'cost', 'conv', 'cpa', 'roas']),
      ], ags.map((ag) => ({ id: ag.id, ag, m: UI.m('ag', ag.id) })), {}) : '';
      const chartItems = Object.entries(NETS).map(([k, name], i) => ({ label: name, value: U.sum(rows.filter((r) => r.k === k), (r) => r.m.cost), color: C.SERIES[i % 6] })).filter((x) => x.value > 0);
      return UI.head('Kanalbericht (Performance Max & Netzwerke)') + '<div class="callout">Der Kanalbericht zeigt, wie sich Performance-Max- und andere Kampagnen auf Suche, Shopping, Display, YouTube und Discover verteilen. Display- und Video-Inventar liefert günstige Reichweite, aber meist weniger direkte Conversions.</div>'
        + `<div class="grid g21"><div>${UI.card('Leistung nach Kanal', t, { flush: true })}</div><div>${UI.card('Kostenverteilung', chartItems.length ? C.bars({ horizontal: true, items: chartItems, fmt: f.eur0, height: 40 * chartItems.length + 20 }) : '<div class="muted">–</div>')}</div></div>`
        + (agT ? UI.card('Asset-Gruppen', agT, { flush: true }) : '');
    },
  };
})();
