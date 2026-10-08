/* Ads Simulator – Ansichten: Keyword-Planer, Conversions, Merchant Center, Tests, Berichte, Verlauf, Unternehmen, Abrechnung, Einstellungen */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, C = G.C, R = G.R, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc, I = E.I;

  // ---------- Keyword-Planer ----------
  V.planner = {
    render() {
      const S = APP.S;
      const seed = APP.q.plannerSeed || '';
      const ideas = E.keywordIdeas(S, seed);
      const rows = ideas.map((x) => ({ id: x.q.id, ...x }));
      const t = UI.table('planner', [
        { k: 'text', l: 'Keyword', f: (r) => `<b>${esc(r.text)}</b>`, sort: (r) => r.text },
        { k: 'theme', l: 'Thema', f: (r) => esc(r.theme), sort: (r) => r.theme },
        { k: 'vol', l: 'Ø monatl. Suchanfragen', num: true, f: (r) => f.int(r.vol), sort: (r) => r.vol },
        { k: 'trend3', l: 'Änderung in 3 Mon.', num: true, f: (r) => `<span class="${r.trend3 >= 0 ? 'up' : 'down'}">${f.signedPct(r.trend3)}</span>`, sort: (r) => r.trend3 },
        { k: 'comp', l: 'Wettbewerb', f: (r) => esc(r.comp), sort: (r) => r.compIdx },
        { k: 'low', l: 'Gebot obere Seite (niedrig)', num: true, f: (r) => f.eur(r.low), sort: (r) => r.low },
        { k: 'high', l: 'Gebot obere Seite (hoch)', num: true, f: (r) => f.eur(r.high), sort: (r) => r.high },
      ], rows, { select: true, bulk: '<button class="btn sm primary" data-act="planadd">Zu Anzeigengruppe hinzufügen</button><button class="btn sm" data-act="planforecast">Prognose</button>', defaultSort: { k: 'vol', dir: 'desc' } });
      return UI.head('Keyword-Planer', '', { noScope: true, noRange: true })
        + `<div class="card"><div class="bd" style="padding:16px"><div class="row"><div class="field" style="flex:3"><span>Neue Keywords finden – Produkte oder Dienstleistungen eingeben</span><input type="search" id="plannerSeed" value="${esc(seed)}" placeholder="z. B. ${esc(M.ind(S).themes[0].kws[0][0])}"></div><div class="field" style="flex:0"><button class="btn primary" data-act="plansearch">Ergebnisse abrufen</button></div></div><div class="small muted">Suchvolumen berücksichtigen aktuelle Saisonalität und Markttrends. Gebotsschätzungen basieren auf dem aktuellen Wettbewerb.</div></div></div>`
        + UI.card('Keyword-Ideen', t, { flush: true });
    },
  };
  ACT.plansearch = () => { APP.q.plannerSeed = document.getElementById('plannerSeed').value; UI.renderMain(true); };
  ACT.planadd = () => {
    const S = APP.S, sel = [...APP.sel.planner];
    const ags = S.adGroups.filter((a) => a.kind === 'standard' && a.status !== 'removed');
    if (!ags.length) { UI.toast('Erstellen Sie zuerst eine Suchkampagne', 'bad'); return; }
    UI.modal('Keywords hinzufügen', `<div class="field"><span>Anzeigengruppe</span><select name="ag">${ags.map((a) => `<option value="${a.id}">${esc(M.camp(S, a.campaignId).name)} › ${esc(a.name)}</option>`).join('')}</select></div><div class="field"><span>Keyword-Option</span><select name="m"><option value="phrase">Passende Wortgruppe</option><option value="exact">Genau passend</option><option value="broad">Weitgehend passend</option></select></div><div class="small muted">${sel.map((id) => esc(M.byId(S.queries, id).text)).join(', ')}</div>`, {
      onSave: () => { const ag = M.ag(S, UI.val('ag')); for (const id of sel) S.keywords.push(M.makeKeyword(S, ag, M.byId(S.queries, id).text, UI.val('m'))); M.log(S, 'Keywords', ag.name, sel.length + ' Keyword(s) aus Keyword-Planer'); APP.sel.planner.clear(); UI.toast('Keywords hinzugefügt'); },
    });
  };
  ACT.planforecast = () => {
    const S = APP.S, sel = [...APP.sel.planner].map((id) => M.byId(S.queries, id));
    const render = () => {
      const cpc = UI.num('cpc') || 1;
      const fc = E.forecast(S, sel, cpc, 6);
      document.getElementById('fcout').innerHTML = `<div class="grid g4"><div class="stat"><div class="lbl">Klicks/Monat</div><div class="val">${f.int(fc.clk)}</div></div><div class="stat"><div class="lbl">Impressionen</div><div class="val">${f.compact(fc.imp)}</div></div><div class="stat"><div class="lbl">Kosten/Monat</div><div class="val">${f.eur0(fc.cost)}</div></div><div class="stat"><div class="lbl">Ø CPC</div><div class="val">${f.eur(fc.cpc)}</div></div></div><div class="small muted">Geschätzt ≈ ${f.num1(fc.conv)} Conversions/Monat bei durchschnittlicher Qualität (QF 6) und unbegrenztem Budget.</div>`;
    };
    UI.modal('Prognose für ' + sel.length + ' Keyword(s)', `<div class="field"><span>Max. CPC (€)</span><input type="number" step="0.05" name="cpc" value="${f.num2(U.avg(sel, (q) => q.cpc) * S.market.cpcIdx).replace(',', '.')}" data-inp="fc"></div><div id="fcout"></div>`, { footer: '<button class="btn primary" data-act="mclose">Schließen</button>' });
    ACT.inp_fc = render; render();
  };

  // ---------- Conversions ----------
  V.conversions = {
    render() {
      const S = APP.S, a = S.account;
      const rows = S.convActions.map((c) => ({ id: c.id, c }));
      const t = UI.table('conv', [
        { k: 'tg', l: '', nosort: true, f: (r) => UI.toggle(r.c.status === 'enabled', 'toggleconv', `data-id="${r.c.id}"`) },
        { k: 'name', l: 'Conversion-Aktion', f: (r) => `<b>${esc(r.c.name)}</b>`, sort: (r) => r.c.name },
        { k: 'cat', l: 'Kategorie', f: (r) => esc(r.c.category), sort: (r) => r.c.category },
        { k: 'prim', l: 'Optimierung', f: (r) => `<select data-chg="convprim" data-id="${r.c.id}"><option value="1" ${r.c.primary ? 'selected' : ''}>Primär</option><option value="0" ${!r.c.primary ? 'selected' : ''}>Sekundär</option></select>`, sort: (r) => (r.c.primary ? 1 : 0) },
        { k: 'val', l: 'Wert', f: (r) => (r.c.value === 'dynamic' ? 'Dynamisch (Transaktionswert)' : f.eur(r.c.value)), sort: (r) => (r.c.value === 'dynamic' ? 9999 : r.c.value) },
        { k: 'cnt', l: 'Zählung', f: (r) => (r.c.countType === 'every' ? 'Jede' : 'Eine'), sort: (r) => r.c.countType },
        { k: 'win', l: 'Conversion-Zeitraum', f: (r) => r.c.window + ' Tage', nosort: true },
      ], rows, {});
      const pending = S.pending.filter((p) => p.recorded && p.prim).length;
      const lag = M.ind(S).lag;
      const lagChart = C.bars({ items: lag.map((p, i) => ({ label: i + 'T', value: p * 100 })), fmt: (x) => f.num1(x) + ' %', height: 170 });
      const status = a.trackingOk ? UI.pill(['Aufzeichnung aktiv', 'good']) : UI.pill(['Keine aktuellen Conversions – Tag fehlt', 'bad']);
      const v = UI.m('acct', 'all');
      return UI.head('Conversions', '', { noScope: true })
        + `<div class="grid g2"><div>${UI.card('Messung', `<dl class="kv"><dt>Google-Tag</dt><dd>${status} ${a.trackingOk ? '' : '<button class="btn sm" data-act="fixtracking">Reparieren (150 €)</button>'} <button class="btn sm ghost" data-act="testtag">Tag testen</button></dd>
          <dt>Attributionsmodell</dt><dd><select data-chg="attrib"><option value="dda" ${a.attribution === 'dda' ? 'selected' : ''}>Datengetrieben</option><option value="last" ${a.attribution === 'last' ? 'selected' : ''}>Letzter Klick</option></select></dd>
          <dt>Consent Mode</dt><dd><select data-chg="consent"><option value="basic" ${a.consentMode === 'basic' ? 'selected' : ''}>Einfach</option><option value="advanced" ${a.consentMode === 'advanced' ? 'selected' : ''}>Erweitert (Modellierung)</option></select> <span class="small muted">Zustimmungsrate ${f.pct0(a.consentRate)}</span></dd>
          <dt>Erweiterte Conversions</dt><dd><label class="chk"><input type="checkbox" data-chg="ec" ${a.enhancedConv ? 'checked' : ''}> aktiviert</label></dd>
          <dt>Ausstehend (Verzögerung)</dt><dd>${f.int(pending)} Conversions werden noch nachgemeldet</dd>
          <dt>Messquote (Sim)</dt><dd>${f.pct(U.div(v.conv, v.rconv), 0)} der tatsächlichen Conversions erfasst</dd></dl>`)}</div><div>${UI.card('Conversion-Verzögerung (Tage nach Klick)', lagChart + '<div class="small muted">Conversions werden dem Klickdatum zugeordnet. Die letzten Tage wirken daher anfangs schwächer, bis Conversions nachgemeldet sind – Smart Bidding berücksichtigt das.</div>')}</div></div>`
        + UI.card('Conversion-Aktionen', t, { flush: true, tools: '<button class="btn" data-act="newconv">＋ Conversion-Aktion</button>' });
    },
  };
  ACT.toggleconv = (el, d) => { const c = M.byId(APP.S.convActions, d.id); c.status = c.status === 'enabled' ? 'paused' : 'enabled'; M.log(APP.S, 'Conversion-Aktion', c.name, 'Status: ' + c.status); UI.renderMain(true); };
  ACT.chg_convprim = (el, d) => { const c = M.byId(APP.S.convActions, d.id); c.primary = el.value === '1'; M.log(APP.S, 'Conversion-Aktion', c.name, c.primary ? 'Primär' : 'Sekundär'); for (const cc of APP.S.campaigns) M.startLearning(APP.S, cc, 'Conversion-Ziele geändert', 5); };
  ACT.chg_attrib = (el) => { APP.S.account.attribution = el.value; M.log(APP.S, 'Messung', 'Attributionsmodell', el.value === 'dda' ? 'Datengetrieben' : 'Letzter Klick'); };
  ACT.chg_consent = (el) => { APP.S.account.consentMode = el.value; M.log(APP.S, 'Messung', 'Consent Mode', el.value); UI.renderMain(true); };
  ACT.chg_ec = (el) => { APP.S.account.enhancedConv = el.checked; M.log(APP.S, 'Messung', 'Erweiterte Conversions', el.checked ? 'an' : 'aus'); };
  ACT.fixtracking = () => { R.fixTracking(APP.S); UI.render(); };
  ACT.testtag = () => UI.toast(APP.S.account.trackingOk ? 'Tag Assistant: Google-Tag gefunden, Conversion-Ereignis wird ausgelöst ✓' : 'Tag Assistant: Auf der Bestätigungsseite wurde kein Google-Tag gefunden ✗', APP.S.account.trackingOk ? 'good' : 'bad');
  ACT.newconv = () => {
    const S = APP.S;
    UI.modal('Conversion-Aktion erstellen', `<div class="field"><span>Name</span><input type="text" name="n" value="Newsletter-Anmeldung"></div><div class="row"><div class="field"><span>Kategorie</span><select name="cat">${['Kauf', 'Lead-Formular', 'Registrierung', 'Anruf', 'Seitenaufruf', 'In den Einkaufswagen', 'Sonstiges'].map((c) => `<option>${c}</option>`).join('')}</select></div><div class="field"><span>Wert (€, leer = dynamisch)</span><input type="number" name="v" value="5"></div></div><div class="row"><div class="field"><span>Häufigkeit (rel. zu Hauptconversion)</span><input type="number" name="r" step="0.1" value="1.5"></div><div class="field"><span>Optimierung</span><select name="p"><option value="0">Sekundär</option><option value="1">Primär</option></select></div></div>`, {
      onSave: () => { S.convActions.push({ id: M.nid(S, 'ca'), name: UI.val('n'), category: UI.val('cat'), rate: UI.num('r') || 1, value: UI.val('v') === '' ? 'dynamic' : UI.num('v'), primary: UI.val('p') === '1', countType: 'one', window: 30, status: 'enabled' }); M.log(S, 'Conversion-Aktion', UI.val('n'), 'Erstellt'); },
    });
  };

  // ---------- Merchant Center ----------
  V.products = {
    render() {
      const S = APP.S;
      if (!M.ind(S).hasShopping) return UI.head('Merchant Center', '', { noScope: true }) + '<div class="card"><div class="empty">In dieser Branche gibt es keinen Produktfeed.</div></div>';
      const rows = S.products.map((p) => ({ id: p.id, p, m: UI.m('prod', p.id), q: M.productQuality(S, p), th: M.theme(S, p.theme) }));
      const t = UI.table('prods', [
        { k: 'tg', l: '', nosort: true, f: (r) => UI.toggle(r.p.status === 'enabled', 'toggleprod', `data-id="${r.p.id}"`) },
        { k: 'title', l: 'Produkt', f: (r) => `<b>${esc(r.p.title)}</b><div class="tiny muted">${esc(r.th ? r.th.name : '')}</div>`, sort: (r) => r.p.title },
        { k: 'st', l: 'Status', f: (r) => UI.pill(M.productStatus(S, r.p)), sort: (r) => M.productStatus(S, r.p)[0] },
        { k: 'price', l: 'Preis', num: true, f: (r) => `<input class="inline" data-chg="prodprice" data-id="${r.p.id}" value="${r.p.price.toFixed(2)}"> €`, sort: (r) => r.p.price },
        { k: 'bench', l: 'Preis-Benchmark', num: true, f: (r) => { const d = r.p.price / r.p.marketPrice - 1; return `${f.eur(r.p.marketPrice)} <span class="${d <= 0 ? 'up' : 'down'} small">${f.signedPct(d)}</span>`; }, sort: (r) => r.p.price / r.p.marketPrice },
        { k: 'gtin', l: 'GTIN', f: (r) => (r.p.gtin ? '✓' : `<button class="btn sm" data-act="prodgtin" data-id="${r.p.id}">Ergänzen</button>`), sort: (r) => (r.p.gtin ? 1 : 0) },
        { k: 'img', l: 'Bildqualität', f: (r) => `<span class="bar" style="display:inline-block;width:60px"><i style="width:${r.p.imgQ * 100}%"></i></span> ${r.p.imgQ < 0.85 ? `<button class="btn sm ghost" data-act="prodimg" data-id="${r.p.id}" title="Professionelles Fotoshooting (180 €)">📷</button>` : ''}`, sort: (r) => r.p.imgQ },
        { k: 'q', l: 'Feed-Qualität', num: true, f: (r) => f.pct0(r.q), sort: (r) => r.q },
        { k: 'stock', l: 'Verfügbarkeit', f: (r) => (r.p.stock ? 'Auf Lager' : '<span class="down">Nicht verfügbar</span>'), sort: (r) => (r.p.stock ? 1 : 0) },
        ...UI.mcols(['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'roas']),
      ], rows, { search: (r) => r.p.title, defaultSort: { k: 'cost', dir: 'desc' } });
      return UI.head('Merchant Center', '', { noScope: true }) + '<div class="callout">Preis-Wettbewerbsfähigkeit, Bildqualität und vollständige Attribute (GTIN) beeinflussen Ad Rank, Klickrate und Conversion-Rate Ihrer Shopping-Anzeigen stark. Lieferengpässe führen zu „Nicht verfügbar".</div>' + UI.card('Produkte', t, { flush: true });
    },
  };
  ACT.toggleprod = (el, d) => { const p = M.byId(APP.S.products, d.id); p.status = p.status === 'enabled' ? 'excluded' : 'enabled'; M.log(APP.S, 'Merchant Center', p.title, p.status === 'enabled' ? 'Eingeschlossen' : 'Ausgeschlossen'); UI.renderMain(true); };
  ACT.chg_prodprice = (el, d) => { const p = M.byId(APP.S.products, d.id), v = parseFloat(el.value.replace(',', '.')); if (!(v > 0)) return; M.log(APP.S, 'Merchant Center', p.title, `Preis ${f.eur(p.price)} → ${f.eur(v)}`); p.price = v; UI.renderMain(true); };
  ACT.prodgtin = (el, d) => { const p = M.byId(APP.S.products, d.id); p.gtin = true; M.log(APP.S, 'Merchant Center', p.title, 'GTIN ergänzt'); UI.renderMain(true); };
  ACT.prodimg = (el, d) => { const p = M.byId(APP.S.products, d.id); p.imgQ = Math.min(0.97, p.imgQ + 0.25); R.spend(APP.S, 180, 'Produktfotos: ' + p.title); UI.render(); };

  // ---------- Tests (Experimente) ----------
  function zTest(c1, n1, c2, n2) {
    if (n1 < 30 || n2 < 30) return null;
    const p1 = c1 / n1, p2 = c2 / n2, p = (c1 + c2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
    if (!se) return null;
    const z = Math.abs(p2 - p1) / se;
    return 1 - 2 * (1 - normCdf(z));
  }
  function normCdf(z) { const t = 1 / (1 + 0.2316419 * z); const d = 0.3989423 * Math.exp(-z * z / 2); return 1 - d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); }
  V.experiments = {
    render() {
      const S = APP.S;
      const cards = S.experiments.slice().reverse().map((x) => {
        const base = M.camp(S, x.baseId), trial = M.camp(S, x.trialId);
        const to = x.status === 'running' ? S.day - 1 : x.endDay;
        const b = E.derive(E.sumRange(S, 'exp', x.id + '~base', x.startDay, to)), t = E.derive(E.sumRange(S, 'exp', x.id + '~trial', x.startDay, to));
        const conf = zTest(b.conv, b.clk, t.conv, t.clk);
        const ctrConf = zTest(b.clk, b.imp, t.clk, t.imp);
        const row = (k, inv) => { const d = U.div(t[k], b[k]) - 1; return `<tr><td>${UI.MET[k].l}</td><td class="num">${UI.MET[k].f(b[k])}</td><td class="num">${UI.MET[k].f(t[k])}</td><td class="num ${isFinite(d) && b[k] ? ((inv ? d < 0 : d > 0) ? 'up' : 'down') : ''}">${b[k] ? f.signedPct(d) : '–'}</td></tr>`; };
        const verdict = conf === null ? 'Noch zu wenige Daten für eine statistische Aussage.' : conf >= 0.95 ? `<b class="${t.cvr > b.cvr ? 'up' : 'down'}">Statistisch signifikant (${f.pct0(conf)} Konfidenz)</b> – der Test-Arm konvertiert ${t.cvr > b.cvr ? 'besser' : 'schlechter'}.` : `Nicht signifikant (${f.pct0(conf)} Konfidenz bei Conv.-Rate).`;
        return UI.card(`🧪 ${esc(x.name)}`, `<div class="small muted" style="margin-bottom:8px">${esc(x.desc)} · Aufteilung ${Math.round((1 - x.split) * 100)}/${Math.round(x.split * 100)} · gestartet ${U.fmtDate(U.dayToDate(S.startDate, x.startDay), false)} · ${UI.pill(x.status === 'running' ? ['Läuft', 'learn'] : x.status === 'applied' ? ['Übernommen', 'good'] : ['Beendet', 'muted'])}</div>
          <div class="tablewrap"><table class="t"><thead><tr><th>Messwert</th><th class="num">Basis: ${esc(base ? base.name : '?')}</th><th class="num">Test</th><th class="num">Differenz</th></tr></thead><tbody>${['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'val', 'roas'].map((k) => row(k, ['cpc', 'cpa', 'cost'].includes(k))).join('')}</tbody></table></div>
          <div style="margin-top:10px">${verdict} ${ctrConf !== null ? `<span class="small muted">· CTR-Konfidenz ${f.pct0(ctrConf)}</span>` : ''}</div>
          ${x.status === 'running' ? `<div style="margin-top:10px;display:flex;gap:8px"><button class="btn primary" data-act="expapply" data-id="${x.id}">Test übernehmen</button><button class="btn" data-act="expend" data-id="${x.id}">Test beenden</button></div>` : ''}`);
      }).join('');
      return UI.head('Tests', '<button class="btn primary" data-act="newexp">＋ Benutzerdefinierter Test</button>', { noScope: true, noRange: true })
        + '<div class="callout">Mit Tests teilen Sie den Traffic einer Suchkampagne zwischen Basis- und Testversion auf (A/B). Testen Sie Gebotsstrategien, Zielwerte oder Landingpages – und übernehmen Sie Gewinner mit einem Klick. Planen Sie mind. 2–4 Wochen ein.</div>'
        + (cards || '<div class="card"><div class="empty">Noch keine Tests.</div></div>');
    },
  };
  ACT.expend = (el, d) => G.FORMS.endExperiment(APP.S, d.id, false);
  ACT.expapply = (el, d) => G.FORMS.endExperiment(APP.S, d.id, true);

  // ---------- Berichte ----------
  const DIMS = {
    day: 'Tag', week: 'Woche', month: 'Monat', campaign: 'Kampagne', ctype: 'Kampagnentyp', network: 'Netzwerk', device: 'Gerät', location: 'Standort', hour: 'Stunde', dow: 'Wochentag', age: 'Alter', gender: 'Geschlecht', keyword: 'Keyword', query: 'Suchbegriff',
  };
  function reportRows(S, dim) {
    const [a, b] = UI.rng();
    const camps = UI.scopeCamps();
    const out = new Map();
    const add = (key, label, vec, sortKey) => { let r = out.get(key); if (!r) { r = { id: key, label, v: E.zero(), sk: sortKey ?? label }; out.set(key, r); } E.add(r.v, vec); };
    const prefixDim = (d, fn) => { for (const c of camps) for (const k of E.keys(S, d, c.id + '~')) { const sub = k.slice(c.id.length + 1); add(sub, fn(sub), E.sumRange(S, d, k, a, b), sub); } };
    if (['day', 'week', 'month', 'dow'].includes(dim)) {
      for (let d = a; d <= b; d++) {
        const v = E.zero();
        for (const c of camps) { const s = S.stats.camp && S.stats.camp[c.id] && S.stats.camp[c.id][d]; if (s) E.add(v, s); }
        const dt = U.dayToDate(S.startDate, d);
        if (dim === 'day') add(d, U.fmtDate(dt), v, d);
        if (dim === 'week') { const w = d - U.dowMon0(dt); add(w, 'Woche ab ' + U.fmtDate(U.dayToDate(S.startDate, w), false), v, w); }
        if (dim === 'month') { const k = dt.getUTCFullYear() * 12 + dt.getUTCMonth(); add(k, U.MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear(), v, k); }
        if (dim === 'dow') add(U.dowMon0(dt), U.DOW[U.dowMon0(dt)], v, U.dowMon0(dt));
      }
    } else if (dim === 'campaign') for (const c of camps) add(c.id, c.name, E.sumRange(S, 'camp', c.id, a, b));
    else if (dim === 'ctype') for (const c of camps) add(c.type, D.CAMPAIGN_TYPES[c.type].name, E.sumRange(S, 'camp', c.id, a, b));
    else if (dim === 'network') prefixDim('net', (k) => ({ search: 'Google-Suche', partners: 'Suchnetzwerk-Partner', shopping: 'Shopping', display: 'Displaynetzwerk', youtube: 'YouTube', discover: 'Discover & Gmail' }[k] || k));
    else if (dim === 'device') prefixDim('dev', (k) => D.DEVICES.find((x) => x.id === k).name);
    else if (dim === 'location') prefixDim('loc', (k) => D.LOC_BY_ID[k].name);
    else if (dim === 'hour') prefixDim('hour', (k) => String(k).padStart(2, '0') + ':00');
    else if (dim === 'age') prefixDim('age', (k) => D.AGES[+k]);
    else if (dim === 'gender') prefixDim('gen', (k) => D.GENDERS.find((g) => g.id === k).name);
    else if (dim === 'query') prefixDim('st', (k) => (M.byId(S.queries, k) || { text: k }).text);
    else if (dim === 'keyword') { const ags = new Set(UI.scopeAgs().map((x) => x.id)); for (const kw of S.keywords) if (ags.has(kw.adGroupId)) add(kw.id, UI.match(kw), E.sumRange(S, 'kw', kw.id, a, b)); }
    return [...out.values()].map((r) => ({ ...r, m: E.derive(r.v) })).filter((r) => r.v[I.imp] > 0 || r.v[I.cost] > 0);
  }
  V.reports = {
    render() {
      const S = APP.S;
      const dim = APP.q.repDim || 'week';
      const mets = APP.q.repMets || ['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cpa', 'val', 'roas'];
      const rows = reportRows(S, dim);
      APP._report = { rows, dim, mets };
      const timeDim = ['day', 'week', 'month', 'hour', 'dow'].includes(dim);
      const sorted = rows.slice().sort((x, y) => (timeDim ? (+x.sk) - (+y.sk) : y.m[mets[0]] - x.m[mets[0]]));
      const chartMet = APP.q.repChart || mets[0];
      const chart = rows.length ? (timeDim && sorted.length > 2 ? C.line({ labels: sorted.map((r) => String(r.label).replace(/^Woche ab /, '').replace(/^\w\w\., /, '')), height: 220, series: [{ name: UI.MET[chartMet].l, color: C.SERIES[0], values: sorted.map((r) => r.m[chartMet]), fmt: UI.MET[chartMet].f, area: true }] }) : C.bars({ horizontal: true, items: sorted.slice(0, 12).map((r, i) => ({ label: String(r.label).replace(/<[^>]+>/g, '').slice(0, 28), value: r.m[chartMet], color: C.SERIES[i % 6] })), fmt: UI.MET[chartMet].f, height: Math.min(12, sorted.length) * 30 + 20 })) : '';
      const t = UI.table('rep_' + dim, [{ k: 'label', l: DIMS[dim], f: (r) => (dim === 'keyword' ? r.label : esc(r.label)), sort: (r) => (timeDim ? r.sk : String(r.label)) }, ...UI.mcols(mets)], rows, { totals: UI.totals(rows.map((r) => r.v)), defaultSort: timeDim ? { k: 'label', dir: 'asc' } : { k: mets[0], dir: 'desc' }, limit: 500 });
      const metBoxes = Object.entries(UI.MET).map(([k, v]) => `<label class="chk small"><input type="checkbox" data-chg="repmet" value="${k}" ${mets.includes(k) ? 'checked' : ''}>${v.l}</label>`).join(' ');
      return UI.head('Berichte', `<button class="btn" data-act="repcsv">⬇ CSV</button>`)
        + `<div class="card"><div class="bd" style="padding:16px"><div class="row"><div class="field" style="flex:0 0 220px"><span>Dimension</span><select data-chg="repdim">${Object.entries(DIMS).map(([k, v]) => `<option value="${k}" ${k === dim ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="field" style="flex:0 0 220px"><span>Diagramm</span><select data-chg="repchart">${mets.map((k) => `<option value="${k}" ${k === chartMet ? 'selected' : ''}>${UI.MET[k].l}</option>`).join('')}</select></div></div><details><summary class="small" style="cursor:pointer">Spalten auswählen (${mets.length})</summary><div style="display:flex;gap:6px 14px;flex-wrap:wrap;margin-top:8px">${metBoxes}</div></details></div></div>`
        + (chart ? UI.card(DIMS[dim] + ' · ' + UI.MET[chartMet].l, chart) : '') + UI.card('Tabelle', t, { flush: true });
    },
  };
  ACT.chg_repdim = (el) => { APP.q.repDim = el.value; UI.renderMain(true); };
  ACT.chg_repchart = (el) => { APP.q.repChart = el.value; UI.renderMain(true); };
  ACT.chg_repmet = () => { APP.q.repMets = [...document.querySelectorAll('[data-chg="repmet"]:checked')].map((x) => x.value); if (!APP.q.repMets.length) APP.q.repMets = ['clk']; if (!APP.q.repMets.includes(APP.q.repChart)) APP.q.repChart = APP.q.repMets[0]; UI.renderMain(true); };
  ACT.repcsv = () => {
    const r = APP._report; if (!r) return;
    const csvEsc = (s) => '"' + String(s).replace(/<[^>]+>/g, '').replace(/"/g, '""') + '"';
    const lines = [[DIMS[r.dim], ...r.mets.map((k) => UI.MET[k].l)].map(csvEsc).join(';')];
    for (const row of r.rows) lines.push([csvEsc(row.label), ...r.mets.map((k) => (isFinite(row.m[k]) ? String(+row.m[k].toFixed(4)).replace('.', ',') : ''))].join(';'));
    G.APPX.download('bericht_' + r.dim + '.csv', '﻿' + lines.join('\n'), 'text/csv');
  };

  // ---------- Änderungsverlauf ----------
  V.history = {
    render() {
      const S = APP.S;
      const rows = S.history.map((h, i) => ({ id: i, h }));
      return UI.head('Änderungsverlauf', '', { noScope: true, noRange: true }) + UI.card('Änderungen', UI.table('hist', [
        { k: 'day', l: 'Datum', f: (r) => U.fmtDate(U.dayToDate(S.startDate, r.h.day)), sort: (r) => r.h.day * 10000 - r.id },
        { k: 'type', l: 'Bereich', f: (r) => esc(r.h.type), sort: (r) => r.h.type },
        { k: 'name', l: 'Element', f: (r) => esc(r.h.name), sort: (r) => r.h.name },
        { k: 'change', l: 'Änderung', wrap: true, f: (r) => esc(r.h.change), sort: (r) => r.h.change },
      ], rows, { search: (r) => r.h.type + ' ' + r.h.name + ' ' + r.h.change, defaultSort: { k: 'day', dir: 'desc' } }), { flush: true });
    },
  };

  // ---------- Unternehmen & GuV ----------
  V.business = {
    render() {
      const S = APP.S, co = S.company, ind = M.ind(S);
      const days = Object.keys(S.pnl).map(Number).sort((a, b) => a - b);
      let cash = co.startCash + (co.injected || 0) * 0;
      const cashSeries = [], labels = [], profitS = [];
      let run = co.startCash;
      for (const d of days) { const p = S.pnl[d]; run += p.profit; cashSeries.push(run); profitS.push(p.profit); labels.push(U.fmtShort(U.dayToDate(S.startDate, d))); }
      void cash;
      const [a, b] = UI.rng();
      let rev = 0, gross = 0, ads = 0, other = 0, conv = 0;
      for (let d = a; d <= b; d++) { const p = S.pnl[d]; if (p) { rev += p.rev; gross += p.gross; ads += p.ads; other += p.other; conv += p.conv; } }
      const profit = gross - ads - other;
      const totProfit = U.sum(days, (d) => S.pnl[d].profit);
      const stats = `<div class="grid g4">${[['Umsatz', f.eur0(rev), 'tatsächlich, inkl. nicht gemessener Conversions'], ['Rohertrag', f.eur0(gross), 'Marge ' + f.pct0(1 - (1 - ind.margin) / (1 + co.priceAdj))], ['Werbekosten', f.eur0(ads), 'POAS ' + f.num2(U.div(gross, ads))], ['Gewinn', `<span class="${profit >= 0 ? 'up' : 'down'}">${f.eur0(profit)}</span>`, 'nach Werbung & Sonstigem']].map(([l, v, s]) => `<div class="card"><div class="stat"><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${s}</div></div></div>`).join('')}</div>`;
      const chart = days.length > 1 ? C.line({ labels, height: 230, series: [{ name: 'Kassenstand (ohne Einzahlungen)', color: C.SERIES[3], values: cashSeries, fmt: f.eur0, area: true, axisFmt: (x) => f.compact(x) }, { name: 'Tagesgewinn', color: C.SERIES[0], values: profitS, fmt: f.eur0, axis: 'right', axisFmt: (x) => f.compact(x) }] }) : '<div class="empty">Noch keine Daten.</div>';
      const ags = S.adGroups.filter((ag) => ag.status !== 'removed');
      const lpRows = ags.map((ag) => `<tr><td><label class="chk"><input type="checkbox" class="lpsel" value="${ag.id}"> ${esc(ag.name)}</label><div class="tiny muted">${esc((M.camp(S, ag.campaignId) || {}).name || '')}</div></td><td class="num">${ag.lp.speed}</td><td class="num">${f.pct0(ag.lp.relevance)}</td><td>${ag.lp.mobile ? '✓' : '✗'}</td><td class="num">${f.pct0(M.lpScore(S, ag))}</td></tr>`).join('');
      const invest = Object.entries(R.LP_INVEST).map(([k, v]) => `<button class="btn sm" data-act="lpinvest" data-k="${k}">${esc(v.label)} – ${f.eur0(v.cost)}${k === 'relevance' ? ' je Gruppe' : ''}</button>`).join(' ');
      return UI.head('Unternehmen & GuV', '', { noScope: true }) + stats
        + `<div class="grid g21"><div>${UI.card('Kasse & Gewinn', chart)}</div><div>${UI.card('Unternehmen', `<dl class="kv"><dt>Kasse</dt><dd><b>${f.eur(co.cash)}</b></dd><dt>Startkapital</dt><dd>${f.eur0(co.startCash)}</dd><dt>Kredit offen</dt><dd>${f.eur0(co.debt || 0)} <span class="small muted">von ${f.eur0(G.GOALS.creditLimit(S))} · ${f.pct(G.GOALS.rate(S), 1)} p. a.</span></dd><dt>Gesamtgewinn</dt><dd class="${totProfit >= 0 ? 'up' : 'down'}">${f.eur0(totProfit)}</dd><dt>Echte Conversions</dt><dd>${f.int(conv)} im Zeitraum</dd><dt>Ø Warenkorb/Wert</dt><dd>${f.eur(U.div(rev, conv))}</dd></dl><div style="margin-top:12px"><button class="btn" data-act="capital">Kredit aufnehmen / tilgen</button></div>`)}
          ${UI.card('Preispositionierung', `<div class="field"><span>Preise relativ zum Markt: <b id="pv">${f.signedPct(co.priceAdj)}</b></span><input type="range" min="-20" max="20" step="1" value="${Math.round(co.priceAdj * 100)}" data-chg="price" data-inp="pricepv"></div><div class="small muted">Niedrigere Preise erhöhen die Conversion-Rate (Elastizität ≈ −2,2), senken aber Warenkorb und Marge. Höhere Preise wirken umgekehrt.</div>`)}</div></div>`
        + (S.goals && S.goals.trustHist && S.goals.trustHist.length ? UI.card('Vertrauen der Geschäftsleitung – Verlauf', `<div class="tablewrap"><table class="t"><thead><tr><th>Datum</th><th class="num">Änderung</th><th class="num">Stand</th><th>Grund</th></tr></thead><tbody>${S.goals.trustHist.slice(0, 25).map((h) => `<tr><td>${U.fmtDate(U.dayToDate(S.startDate, h.day), false)}</td><td class="num ${h.delta >= 0 ? 'up' : 'down'}">${h.delta >= 0 ? '+' : ''}${h.delta}</td><td class="num">${h.trust}</td><td class="wrap small">${esc(h.reason)}</td></tr>`).join('')}</tbody></table></div>`, { flush: true }) : '')
        + (S.goals ? UI.card('Zielvorgaben & Bewertungen', S.goals.history.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Zeitraum</th><th>Note</th><th>Ziele</th><th>Konsequenz</th></tr></thead><tbody>${S.goals.history.map((h) => `<tr><td>${U.fmtDate(U.dayToDate(S.startDate, h.from), false)} – ${U.fmtDate(U.dayToDate(S.startDate, h.to), false)}</td><td><b>${h.grade}</b></td><td class="wrap small">${h.results.map((r) => `${r.met ? '✓' : '✗'} ${esc(r.name)}: ${G.GOALS.fmt(r, r.actual)} (Ziel ${r.dir === 'min' ? '≥' : '≤'} ${G.GOALS.fmt(r, r.value)})`).join('<br>')}</td><td class="wrap small">${esc(h.consequence)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="muted small">Die erste Quartalsbewertung erfolgt am ' + U.fmtDate(U.dayToDate(S.startDate, S.goals.periodEnd), false) + '. Gesamtpunktzahl: ' + S.goals.score + '</div>', { sub: 'Punktzahl: ' + S.goals.score }) : '')
        + UI.card('Website & Landingpages', `<div class="filterbar" style="padding:0 0 10px">Investitionen für ausgewählte Anzeigengruppen: ${invest}</div><div class="tablewrap"><table class="t"><thead><tr><th>Anzeigengruppe</th><th class="num">PageSpeed</th><th class="num">Relevanz</th><th>Mobil</th><th class="num">LP-Qualität</th></tr></thead><tbody>${lpRows}</tbody></table></div>`, { sub: 'Landingpage-Qualität beeinflusst Qualitätsfaktor und Conversion-Rate' });
    },
  };
  ACT.inp_pricepv = (el) => { const pv = document.getElementById('pv'); if (pv) pv.textContent = f.signedPct(el.value / 100); };
  ACT.chg_price = (el) => { const S = APP.S; S.company.priceAdj = +el.value / 100; M.log(S, 'Unternehmen', 'Preisniveau', f.signedPct(S.company.priceAdj) + ' vs. Markt'); UI.renderMain(true); };
  ACT.lpinvest = (el, d) => {
    const S = APP.S, ids = [...document.querySelectorAll('.lpsel:checked')].map((x) => x.value);
    if (!ids.length) { UI.toast('Bitte Anzeigengruppen auswählen', 'bad'); return; }
    const ags = ids.map((id) => M.ag(S, id));
    const inv = R.LP_INVEST[d.k];
    const cost = d.k === 'relevance' ? inv.cost * ags.length : inv.cost;
    UI.confirm('Investition bestätigen', `${esc(inv.label)} für ${ags.length} Anzeigengruppe(n): <b>${f.eur0(cost)}</b>`, () => { R.optimizeLP(S, ags, d.k); UI.toast('Website verbessert', 'good'); }, 'Beauftragen');
  };
  ACT.capital = () => {
    const S = APP.S, GL = G.GOALS, c = S.company, lim = GL.creditLimit(S), debt = c.debt || 0;
    UI.modal(S.bank ? 'Budgetvorschuss der Treasury' : 'Kredit & Tilgung', `<dl class="kv"><dt>Kasse</dt><dd><b>${f.eur(c.cash)}</b></dd><dt>Kredit offen</dt><dd>${f.eur0(debt)}</dd><dt>Kreditrahmen</dt><dd>${f.eur0(lim)} (frei: ${f.eur0(lim - debt)})</dd><dt>Zinssatz</dt><dd>${f.pct(GL.rate(S), 1)} p. a. · aktuell ${f.eur0((debt * GL.rate(S)) / 12)} / Monat</dd></dl>
      <div class="row" style="margin-top:12px"><div class="field"><span>Betrag (€)</span><input type="number" name="a" value="${Math.min(10000, Math.max(1000, debt || 10000))}" step="1000" min="100"></div></div>
      <div class="small muted">Zinsen werden täglich als Kosten verbucht. Hohe Verschuldung belastet das Vertrauen der Geschäftsleitung. Kasse negativ und Rahmen ausgeschöpft für 30 Tage = Insolvenz.</div>`, {
      footer: '<button class="btn" data-act="mclose">Schließen</button><button class="btn" data-act="loanrepay">Tilgen</button><button class="btn primary" data-act="loanborrow">Kredit aufnehmen</button>',
    });
  };
  ACT.loanborrow = () => { const v = UI.num('a'); const got = v > 0 ? G.GOALS.borrow(APP.S, v) : 0; UI.toast(got ? 'Kredit aufgenommen: ' + f.eur0(got) : 'Kreditrahmen ausgeschöpft', got ? 'good' : 'bad'); UI.closeModal(); UI.render(); };
  ACT.loanrepay = () => { const v = UI.num('a'); const paid = v > 0 ? G.GOALS.repay(APP.S, v) : 0; UI.toast(paid ? 'Getilgt: ' + f.eur0(paid) : 'Nichts zu tilgen oder Kasse leer', paid ? 'good' : 'bad'); UI.closeModal(); UI.render(); };

  // ---------- Abrechnung ----------
  V.billing = {
    render() {
      const S = APP.S;
      const months = new Map();
      const acc = (S.stats.acct && S.stats.acct.all) || {};
      for (const k of Object.keys(acc)) {
        const d = +k; const dt = U.dayToDate(S.startDate, d); const key = dt.getUTCFullYear() * 12 + dt.getUTCMonth();
        let m = months.get(key); if (!m) { m = { key, label: U.MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear(), cost: 0, inv: 0, clk: 0 }; months.set(key, m); }
        m.cost += acc[k][I.cost]; m.inv += acc[k][I.inv]; m.clk += acc[k][I.clk];
      }
      const rows = [...months.values()].sort((a, b) => b.key - a.key).map((m) => {
        const credit = m.inv * U.div(m.cost, m.clk) * 0.08; // nachträglich erkannte ungültige Klicks
        const net = m.cost - credit;
        return { id: m.key, ...m, credit, net, vat: net * 0.19, total: net * 1.19 };
      });
      const t = UI.table('bill', [
        { k: 'label', l: 'Abrechnungszeitraum', sort: (r) => r.key },
        { k: 'cost', l: 'Kosten', num: true, f: (r) => f.eur(r.cost), sort: (r) => r.cost },
        { k: 'inv', l: 'Ungültige Klicks (gefiltert)', num: true, f: (r) => f.int(r.inv), sort: (r) => r.inv },
        { k: 'credit', l: 'Gutschrift ungültige Aktivität', num: true, f: (r) => '−' + f.eur(r.credit), sort: (r) => r.credit },
        { k: 'net', l: 'Netto', num: true, f: (r) => f.eur(r.net), sort: (r) => r.net },
        { k: 'vat', l: 'USt. 19 %', num: true, f: (r) => f.eur(r.vat), sort: (r) => r.vat },
        { k: 'total', l: 'Rechnungsbetrag', num: true, f: (r) => `<b>${f.eur(r.total)}</b>`, sort: (r) => r.total },
      ], rows, { defaultSort: { k: 'label', dir: 'desc' } });
      return UI.head('Abrechnung', '', { noScope: true, noRange: true })
        + `<div class="grid g3"><div class="card"><div class="stat"><div class="lbl">Zahlungseinstellung</div><div class="val" style="font-size:16px">Automatische Zahlungen</div><div class="sub">Abbuchung vom Unternehmenskonto</div></div></div><div class="card"><div class="stat"><div class="lbl">Status</div><div class="val" style="font-size:16px">${S.account.paymentOk ? UI.pill(['Zahlungen OK', 'good']) : UI.pill(['Zahlung abgelehnt', 'bad'])}</div><div class="sub">Kasse: ${f.eur(S.company.cash)}</div></div></div><div class="card"><div class="stat"><div class="lbl">Ungültige Klicks gesamt</div><div class="val">${f.int(U.sum(rows, (r) => r.inv))}</div><div class="sub">automatisch gefiltert, nicht berechnet</div></div></div></div>`
        + UI.card('Monatsabrechnungen', t, { flush: true }) + '<div class="small muted">Hinweis: Die USt. wird im Simulator nur ausgewiesen; die Kasse wird mit den Nettokosten belastet (Vorsteuerabzug).</div>';
    },
  };

  // ---------- Einstellungen ----------
  V.settings = {
    render() {
      const S = APP.S;
      const size = (() => { try { return JSON.stringify(S).length; } catch (e) { return 0; } })();
      return UI.head('Einstellungen', '', { noScope: true, noRange: true })
        + `<div class="grid g2"><div>${UI.card('Simulation', `<dl class="kv"><dt>Schwierigkeit</dt><dd>${esc(M.DIFFICULTY[S.settings.difficulty].name)}</dd><dt>Seed</dt><dd class="mono">${S.seed}</dd><dt>Startdatum</dt><dd>${U.fmtDate(U.parseISO(S.startDate))}</dd><dt>Spielstand</dt><dd>${f.num1(size / 1e6)} MB</dd></dl>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px"><label class="chk"><input type="checkbox" data-chg="autopause" ${S.settings.autoPause ? 'checked' : ''}> Simulation bei kritischen Ereignissen automatisch pausieren</label>
          <label class="chk">Darstellung: <select data-chg="theme"><option value="">System</option><option value="light" ${document.documentElement.dataset.theme === 'light' ? 'selected' : ''}>Hell</option><option value="dark" ${document.documentElement.dataset.theme === 'dark' ? 'selected' : ''}>Dunkel</option></select></label></div>`)}
          ${UI.card('Konto', `<dl class="kv"><dt>Unternehmensname</dt><dd><input type="text" data-chg="coname" value="${esc(S.company.name)}"></dd><dt>Domain</dt><dd>${esc(S.company.domain)}</dd><dt>Automatische Tagging</dt><dd><label class="chk"><input type="checkbox" data-chg="autotag" ${S.account.autoTagging ? 'checked' : ''}> aktiviert (GCLID)</label></dd><dt>Zeitzone</dt><dd>(GMT+01:00) Mitteleuropäische Zeit</dd><dt>Währung</dt><dd>Euro (EUR)</dd></dl>`)}</div>
          <div>${UI.card('Spielstand', `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="save">💾 Speichern</button><button class="btn" data-act="export">⬇ Exportieren (JSON)</button><label class="btn">⬆ Importieren<input type="file" accept="application/json" data-chg="import" hidden></label><button class="btn danger" data-act="newgame">Neues Spiel</button></div><div class="small muted" style="margin-top:10px">Der Spielstand wird automatisch im Browser gespeichert (lokaler Speicher, wöchentlich und beim Pausieren).</div>`)}
          ${UI.card('Über die Simulation', `<div class="small">Ein Lern- und Trainingssimulator für Google Ads. Alle Unternehmen, Marken und Daten sind fiktiv. Mechaniken wie Ad Rank, Qualitätsfaktor, Smart Bidding und Auktionsdaten sind modellhaft nachgebildet und keine exakte Kopie der Google-Algorithmen.</div>`)}</div></div>`;
    },
  };
  ACT.chg_autopause = (el) => { APP.S.settings.autoPause = el.checked; };
  ACT.chg_autotag = (el) => { APP.S.account.autoTagging = el.checked; if (!el.checked) UI.toast('Ohne automatisches Tagging gehen Conversion-Daten verloren!', 'bad'); };
  ACT.chg_coname = (el) => { APP.S.company.name = el.value.trim() || APP.S.company.name; UI.renderTop(); };
  ACT.chg_theme = (el) => { if (el.value) document.documentElement.dataset.theme = el.value; else delete document.documentElement.dataset.theme; try { localStorage.setItem('gads-sim-theme', el.value); } catch (e) { /* ignore */ } C.redrawAll(); };
})();
