/* Ads Simulator – Tipps & Beratung: kostenpflichtige Praxistipps und individuelle Konto-Analysen */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, R = G.R, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc, I = E.I;
  const T = (G.TIPS = {});

  const last = (S, n = 30) => [Math.max(0, S.day - n), S.day - 1];
  const li = (arr) => (arr.length ? '<ul style="margin:6px 0 0 18px;padding:0">' + arr.map((x) => `<li style="margin-bottom:4px">${x}</li>`).join('') + '</ul>' : '<div class="muted">Keine Auffälligkeiten gefunden.</div>');
  const liveCamps = (S) => S.campaigns.filter((c) => c.status === 'enabled' && !c.isTrial);

  // ---------- Allgemeine Praxistipps ----------
  const GENERAL = [
    ['g_qs', 'Qualitätsfaktor zuerst', 'Warum ein guter QF billiger ist als ein höheres Gebot.', 'Der Ad Rank ist Gebot × Qualität. Ein Keyword mit QF 8 schlägt ein Keyword mit QF 4 auch bei deutlich niedrigerem Gebot – und zahlt weniger pro Klick. Hebel in dieser Reihenfolge: <b>1.</b> Keyword wörtlich in Anzeigentitel 1 bringen, <b>2.</b> Anzeigengruppen auf ein Thema eingrenzen (max. 5–15 eng verwandte Keywords), <b>3.</b> Landingpage schneller und thematisch passender machen. Die erwartete CTR verbessert sich danach von selbst.'],
    ['g_broad', 'Broad Match nur mit Smart Bidding', 'Wann weitgehend passende Keywords sinnvoll sind.', 'Weitgehend passende Keywords erreichen viele verwandte Suchen – auch irrelevante. Mit <b>manuellen Geboten</b> zahlen Sie für jede davon gleich viel. Mit <b>Ziel-CPA/ROAS</b> bietet Google je Suche unterschiedlich und hält schlechte Suchen günstig. Faustregel: Broad nur mit Smart Bidding, genügend Conversion-Daten (≥ 30/Monat) und regelmäßiger Suchbegriff-Pflege.'],
    ['g_neg', 'Ausschließende Keywords systematisch pflegen', 'Die schnellste Sparmaßnahme in jedem Konto.', 'Prüfen Sie wöchentlich den Suchbegriffbericht, sortiert nach Kosten. Begriffe mit „kostenlos", „jobs", „gebraucht", „was ist" oder Mitbewerber-Namen verbrennen oft Budget. Legen Sie sie als <b>Liste</b> an und weisen Sie die Liste allen Kampagnen zu. Vorsicht: Ein zu breites ausschließendes Keyword (z. B. weitgehend passend) kann auch gute Suchen blockieren.'],
    ['g_budget', 'Budget vs. Gebot', 'Was tun bei „Eingeschränkt durch Budget"?', 'Verloren durch <b>Budget</b> heißt: Sie verpassen Auktionen, obwohl Sie mitbieten könnten. Wenn die Kampagne profitabel ist, Budget erhöhen. Wenn nicht, ist es oft besser, die Gebote zu senken: Dann bekommen Sie mehr, aber günstigere Klicks für dasselbe Geld. Verloren durch <b>Rang</b> heißt dagegen: Gebot oder Qualität sind zu niedrig.'],
    ['g_smart', 'Lernphase respektieren', 'Warum ständige Änderungen Smart Bidding schaden.', 'Nach jeder größeren Änderung (Strategie, Ziel > 20 %, Budget > 50 %) lernt Smart Bidding ca. 7 Tage neu – mit schwankender Leistung. Ändern Sie Zielwerte daher in kleinen Schritten (10–15 %) und bewerten Sie erst nach 2 Wochen. Ohne verlässliche Conversion-Daten (Tracking-Fehler!) bietet Smart Bidding blind.'],
    ['g_brand', 'Brand-Kampagnen richtig bewerten', 'Wie viel Ihrer Markenumsätze wirklich von Anzeigen kommt.', 'Markensuchen konvertieren extrem gut – aber viele dieser Kunden kämen auch über das organische Ergebnis. Der echte Mehrwert einer Brand-Kampagne entsteht vor allem, wenn <b>Mitbewerber auf Ihre Marke bieten</b> (siehe Auktionsdaten). Halten Sie Markengebote niedrig, beobachten Sie die Überschneidungsrate und prüfen Sie die organischen Markenconversions in der Übersicht.'],
    ['g_lag', 'Conversion-Verzögerung beachten', 'Warum die letzten Tage immer schlecht aussehen.', 'Conversions werden dem Klickdatum zugeordnet, kommen aber oft Tage später. Die letzten 3–7 Tage (im B2B noch länger) wirken daher schwächer, als sie sind. Bewerten Sie Leistung mit mindestens einer Woche Abstand – sonst schalten Sie gute Kampagnen ab.'],
    ['g_psy', 'Psychologie mit Augenmaß', 'Welche Trigger wirken – und welche schaden.', 'Social Proof (Bewertungen, Kundenzahlen) und Risikoumkehr (Gratis-Rückversand, jederzeit kündbar) wirken nachhaltig. Verknappung nur bei echten, befristeten Aktionen und nicht im B2B- oder Finanzumfeld. Mehr als drei Trigger in einer Anzeige wirken reißerisch. Unechte Countdowns und erfundene Besucherzahlen werden abgemahnt.'],
    ['g_display', 'Display & PMax sauber halten', 'Wie Sie Junk-Traffic vermeiden.', 'Viele Display-Klicks stammen aus Mobile-Apps (versehentliches Tippen). Schließen Sie App-Inventar bei Lead- und Verkaufszielen aus, aktivieren Sie Inhaltsausschlüsse und frischen Sie Bildanzeigen alle paar Wochen auf (Creative-Ermüdung). Bewerten Sie Display am echten Ergebnis, nicht an View-through-Conversions.'],
    ['g_boss', 'Mit der Geschäftsleitung umgehen', 'Wie Sie Vertrauen aufbauen statt verspielen.', 'Monatsbudget nie überschreiten (Hochrechnung in der Übersicht beachten), Ziele zeitanteilig im Blick behalten und lieber eine Note B sicher als eine Note A mit Risiko. Ein sauberes Reporting (Consent Mode erweitert, funktionierendes Tracking) besteht jede Revision. Hohe Verschuldung und Abmahnungen kosten Vertrauen.'],
  ];
  const BANK_GENERAL = [
    ['g_bank_rate', 'Zins vs. Marge im Einlagengeschäft', 'Wie Sie den richtigen Zins finden.', 'Jeder Zehntelprozentpunkt mehr Zins steigert die Abschlussquote – kostet aber auf das gesamte Volumen Marge. Kluge Anleger vergleichen den <b>effektiven 12-Monats-Zins</b>, nicht den Lockzins. Spitzenzinsen ziehen „heißes Geld" an, das schnell wieder abfließt. Ziel: knapp über dem oberen Marktquartil, nicht Platz 1.'],
    ['g_bank_b2b', 'Privatkunden aussteuern', 'Weniger abgelehnte Anträge, bessere Kennzahlen.', 'Nennen Sie „Geschäftskunden", „GmbH" oder „Firmen" im Anzeigentitel. Das senkt zwar die CTR bei generischen Suchen, filtert aber Privatkunden heraus, deren Anträge abgelehnt werden und Bearbeitung kosten. Generische Keywords wie „tagesgeld" nur mit Geschäftskunden-Anzeigen und Offline-Conversions betreiben.'],
  ];

  // ---------- Individuelle Analysen ----------
  const DIAG = [
    { id: 'd_waste', title: 'Wo verbrenne ich Geld?', teaser: 'Suchbegriffe und Keywords ohne Ergebnis – mit Euro-Betrag.', base: 500, run(S) {
      const [a, b] = last(S, 45), rows = [];
      for (const c of liveCamps(S)) for (const k of E.keys(S, 'st', c.id + '~')) {
        const v = E.sumRange(S, 'st', k, a, b); const q = M.byId(S.queries, k.split('~')[1]);
        if (q && v[I.cost] > 0 && v[I.rconv] < 0.5) rows.push({ q, c, cost: v[I.cost], clk: v[I.clk] });
      }
      rows.sort((x, y) => y.cost - x.cost);
      const tot = U.sum(rows, (r) => r.cost);
      return `<p>In den letzten 45 Tagen haben <b>${rows.length}</b> Suchbegriffe zusammen <b>${f.eur0(tot)}</b> gekostet, ohne einen einzigen echten Abschluss zu bringen. Die teuersten:</p>` + li(rows.slice(0, 8).map((r) => `<b>${esc(r.q.text)}</b> (${esc(r.c.name)}): ${f.eur0(r.cost)} für ${f.int(r.clk)} Klicks – Kaufabsicht ${r.q.intent < 0.5 ? '<span class="down">gering</span>' : 'mittel/hoch'}`)) + '<p class="small muted" style="margin-top:8px">Begriffe mit geringer Kaufabsicht als ausschließende Keywords hinzufügen; bei hoher Absicht eher Anzeige und Landingpage prüfen.</p>';
    } },
    { id: 'd_camps', title: 'Welche Kampagne lohnt sich wirklich?', teaser: 'Echter Gewinnbeitrag je Kampagne – inkl. nicht gemessener Umsätze.', base: 600, run(S) {
      const [a, b] = last(S, 45), ind = M.ind(S);
      const rows = liveCamps(S).map((c) => { const v = E.derive(E.sumRange(S, 'camp', c.id, a, b)); return { c, v, contrib: S.bank ? null : v.rval * ind.margin - v.cost }; }).filter((r) => r.v.cost > 0);
      if (S.bank) return '<p>Echte Kontoeröffnungen der letzten 45 Tage je Kampagne:</p>' + li(rows.sort((x, y) => U.div(x.v.cost, x.v.rconv) - U.div(y.v.cost, y.v.rconv)).map((r) => `<b>${esc(r.c.name)}</b>: ${f.num1(r.v.rconv)} eröffnete Konten · ${r.v.rconv ? f.eur0(r.v.cost / r.v.rconv) + ' je Konto' : '<span class="down">keine Eröffnung</span>'} · gemessene Conversions: ${f.num1(r.v.conv)}`));
      rows.sort((x, y) => y.contrib - x.contrib);
      return '<p>Echter Deckungsbeitrag (echter Umsatz × Marge − Werbekosten) der letzten 45 Tage:</p>' + li(rows.map((r) => `<b>${esc(r.c.name)}</b>: <span class="${r.contrib >= 0 ? 'up' : 'down'}">${f.eur0(r.contrib)}</span> · gemessener ROAS ${f.num2(r.v.roas)} vs. echter ROAS ${f.num2(r.v.rroas)}`)) + `<p class="small muted" style="margin-top:8px">Break-even-ROAS bei Ihrer Marge: ${f.num2(1 / ind.margin)}. Kampagnen mit negativem Beitrag: Gebote/Ziele senken, Suchbegriffe bereinigen oder pausieren.</p>`;
    } },
    { id: 'd_is', title: 'Budget oder Gebot – wo liegt mein Engpass?', teaser: 'Verlorene Impressionen je Kampagne mit konkreter Handlung.', base: 400, run(S) {
      const [a, b] = last(S, 21);
      return li(liveCamps(S).filter((c) => ['search', 'shopping'].includes(c.type)).map((c) => {
        const v = E.derive(E.sumRange(S, 'camp', c.id, a, b));
        const act = v.lostB > 0.25 ? 'Budget ist der Engpass – lohnt sich die Kampagne, Budget erhöhen; sonst Gebote senken.' : v.lostR > 0.3 ? 'Ad Rank ist der Engpass – Qualitätsfaktor verbessern oder gezielt Gebote erhöhen.' : 'Kein großer Engpass – Fokus auf Effizienz.';
        return `<b>${esc(c.name)}</b>: Anteil ${f.pct0(v.is)}, verloren Budget ${f.pct0(v.lostB)}, Rang ${f.pct0(v.lostR)} → ${act}`;
      }));
    } },
    { id: 'd_qs', title: 'Qualitätsfaktor-Diagnose', teaser: 'Welche Keywords welchen QF-Bestandteil verbessern müssen.', base: 450, run(S) {
      const [a, b] = last(S, 30);
      const rows = S.keywords.filter((k) => k.status === 'enabled' && k.rt && k.rt.qs).map((k) => ({ k, qs: k.rt.qs, cost: E.sumRange(S, 'kw', k.id, a, b)[I.cost] })).filter((r) => r.qs.score <= 6).sort((x, y) => y.cost - x.cost);
      return li(rows.slice(0, 8).map((r) => { const weak = [r.qs.cL === 0 && 'erwartete CTR (Anzeigentext attraktiver, Assets)', r.qs.rL === 0 && 'Anzeigenrelevanz (Keyword in Titel, engere Gruppe)', r.qs.lL === 0 && 'Landingpage (Tempo, Relevanz)'].filter(Boolean); return `<b>${esc(r.k.text)}</b> – QF ${r.qs.score}, Kosten ${f.eur0(r.cost)} → ${weak.length ? weak.join('; ') : 'alle Bestandteile durchschnittlich: Relevanz schärfen'}`; }));
    } },
    { id: 'd_time', title: 'Beste & schlechteste Zeiten', teaser: 'Wochentage und Uhrzeiten mit der besten und schlechtesten Effizienz.', base: 350, run(S) {
      const [a, b] = last(S, 45), byH = Array.from({ length: 24 }, () => E.zero()), byD = Array.from({ length: 7 }, () => E.zero());
      for (const c of liveCamps(S)) for (let h = 0; h < 24; h++) { const e = S.stats.hour && S.stats.hour[c.id + '~' + h]; if (!e) continue; for (let d = a; d <= b; d++) if (e[d]) { E.add(byH[h], e[d]); E.add(byD[U.dowMon0(U.dayToDate(S.startDate, d))], e[d]); } }
      const eff = (v) => U.div(v[I.cost], v[I.rconv]);
      const hs = byH.map((v, h) => ({ h, cpa: eff(v), cost: v[I.cost] })).filter((x) => x.cost > 20 && x.cpa > 0).sort((x, y) => x.cpa - y.cpa);
      const ds = byD.map((v, d) => ({ d, cpa: eff(v), cost: v[I.cost] })).filter((x) => x.cost > 20 && x.cpa > 0).sort((x, y) => x.cpa - y.cpa);
      if (!hs.length) return '<div class="muted">Noch zu wenige Daten.</div>';
      return `<p>Kosten je echtem Abschluss (45 Tage):</p>` + li([`Beste Stunden: ${hs.slice(0, 3).map((x) => x.h + ' Uhr (' + f.eur0(x.cpa) + ')').join(', ')}`, `Schlechteste Stunden: ${hs.slice(-3).map((x) => x.h + ' Uhr (' + f.eur0(x.cpa) + ')').join(', ')}`, `Bester Tag: ${U.DOW[ds[0].d]} (${f.eur0(ds[0].cpa)}) · schlechtester Tag: ${U.DOW[ds[ds.length - 1].d]} (${f.eur0(ds[ds.length - 1].cpa)})`]) + '<p class="small muted" style="margin-top:8px">Bei manuellen Geboten im Werbezeitplaner anpassen (z. B. −30 % für die schwächsten Stunden). Smart Bidding berücksichtigt die Tageszeit selbst.</p>';
    } },
    { id: 'd_devices', title: 'Geräte-Analyse', teaser: 'Lohnen sich Mobilgeräte, Computer und Tablets?', base: 300, run(S) {
      const [a, b] = last(S, 45);
      const rows = D.DEVICES.map((dv) => { const v = E.zero(); for (const c of liveCamps(S)) E.add(v, E.sumRange(S, 'dev', c.id + '~' + dv.id, a, b)); return { dv, v: E.derive(v) }; }).filter((r) => r.v.cost > 0);
      const avg = U.div(U.sum(rows, (r) => r.v.cost), U.sum(rows, (r) => r.v.rconv));
      return li(rows.map((r) => { const cpa = U.div(r.v.cost, r.v.rconv); const adj = cpa ? Math.round(U.clamp(avg / cpa - 1, -0.6, 0.6) * 100) : -50; return `<b>${r.dv.name}</b>: ${f.eur0(r.v.cost)} Kosten · echte Kosten/Abschluss ${cpa ? f.eur0(cpa) : '–'} → empfohlene Gebotsanpassung <b>${adj > 0 ? '+' : ''}${adj} %</b>`; }));
    } },
    { id: 'd_comp', title: 'Marktgerüchte: Was planen die Mitbewerber?', teaser: 'Insider-Einschätzung zu Budgets, Strategien und Finanzlage der Konkurrenz.', base: 900, run(S) {
      const comps = S.competitors.filter((c) => c.active);
      const style = { aggressive: 'wachstumsgetrieben und bietet aggressiv', profit: 'achtet streng auf Rentabilität und zieht sich bei hohen Preisen zurück', budget: 'gibt sein Budget voll aus und senkt Gebote, wenn es knapp wird', brand: 'verteidigt vor allem die eigene Marke', erratic: 'handelt sprunghaft', marketplace: 'hat ein riesiges Budget und bleibt dauerhaft präsent' };
      return li(comps.map((c) => { const runway = c.cash / Math.max(1, c.budget); const fin = runway < 30 ? '<span class="down">Kasse fast leer – Ausstieg wahrscheinlich</span>' : runway < 90 ? '<span class="warn">finanziell angespannt</span>' : 'finanziell solide'; return `<b>${esc(c.name)}</b> ${style[c.style] || ''}; ${fin}${c.isNew ? ', <b>neu und VC-finanziert</b>' : ''}.`; }));
    } },
    { id: 'd_outlook', title: 'Marktausblick 60 Tage', teaser: 'Saison, Kalenderereignisse und Nachfrage in den nächsten zwei Monaten.', base: 400, run(S) {
      const ind = M.ind(S), date = M.today(S);
      const th = ind.themes.map((t) => { const now = t.season ? U.seasonAt(t.season, date) : 1, nx = t.season ? U.seasonAt(t.season, U.addDays(date, 45)) : 1; return { t, d: (nx / now) * U.seasonAt(ind.season, U.addDays(date, 45)) / U.seasonAt(ind.season, date) - 1 }; }).sort((a, b) => b.d - a.d);
      const up = E.upcomingCal(S, 5).filter((u) => (u.start - date) / 86400000 < 70);
      let bank = '';
      if (S.bank) { const n = G.BANK.ECB.find(([d]) => d >= U.toISO(date)); if (n) bank = `<li>Nächster EZB-Termin: <b>${U.fmtDate(U.parseISO(n[0]), false)}</b>${n[2] ? ` – Marktpreis: Anhebung ${Math.round(n[2].hike * 100)} %, Senkung ${Math.round(n[2].cut * 100)} %` : ''}.</li>`; }
      return li(th.map((x) => `<b>${esc(x.t.name)}</b>: Nachfrage ${x.d >= 0 ? '<span class="up">+' : '<span class="down">'}${Math.round(x.d * 100)} %</span> in ~6 Wochen`).concat(up.map((u) => `Kalender: <b>${esc(u.ev.name)}</b> ab ${U.fmtDate(u.start, false)}`))) + (bank ? `<ul style="margin:0 0 0 18px;padding:0">${bank}</ul>` : '') + '<p class="small muted" style="margin-top:8px">Budget vor Nachfragespitzen rechtzeitig umschichten – Smart Bidding braucht Vorlauf.</p>';
    } },
    { id: 'd_psy', title: 'Psychologie- & Shop-Check', teaser: 'Welcher Conversion-Hebel bei Ihnen am meisten bringt.', base: 500, run(S) {
      const st = G.PSY.state(S), av = G.PSY.available(S).filter((c) => !st.cro[c.id] && !c.dark && !c.legal);
      av.sort((a, b) => ((b.cvr || 1) * (b.aov || 1) * (b.qual || 1) - (b.fee || 0)) - ((a.cvr || 1) * (a.aov || 1) * (a.qual || 1) - (a.fee || 0)));
      const darks = G.PSY.CRO.filter((c) => (c.dark || c.legal) && st.cro[c.id]);
      const ads = S.ads.filter((a) => a.status === 'enabled' && a.type === 'rsa');
      const noSocial = ads.filter((a) => !G.PSY.analyze(a).includes('social')).length;
      return li([`Größte noch ungenutzte Hebel: ${av.slice(0, 3).map((c) => '<b>' + esc(c.name) + '</b>').join(', ') || '–'}`, darks.length ? `<span class="down">Risiko:</span> ${darks.map((c) => esc(c.name)).join(', ')} – schadet Vertrauen und Bewertung, Abmahnrisiko.` : 'Keine riskanten Muster aktiv.', `${noSocial} von ${ads.length} Suchanzeigen ohne Social Proof – ${S.company.awareness < 0.2 ? 'bei Ihrer geringen Bekanntheit besonders wirksam' : 'wirkt bei Ihrer Bekanntheit nur mäßig'}.`, `Ihre Bewertung: ${f.num1(st.rating)}★ aus ${st.reviews} Rezensionen${st.reviews < 100 ? ' – ab 100 werden Sterne in Anzeigen gezeigt' : ''}.`]);
    } },
    { id: 'd_rates', bank: true, title: 'Zinsberatung der Treasury', teaser: 'Welcher Tagesgeld- und Festgeldzins Abschlüsse und Marge optimal ausbalanciert.', base: 700, run(S) {
      const B = G.BANK, m = B.market(S), o = S.bank.own, alt = B.altTG(S);
      const best = [];
      for (let r = 0.5; r <= alt; r += 0.05) { const mult = U.clamp(Math.exp(1.5 * (r - m.tgP75)), 0.3, 2.2); best.push({ r, score: mult * (alt - r) }); }
      best.sort((a, b) => b.score - a.score);
      const fg = U.clamp(m.fgP75 + 0.05, 0, B.altFG(S, 12) - 0.15);
      return li([`Oberes Marktquartil Tagesgeld (effektiv 12 M): <b>${f.num2(m.tgP75)} %</b>, Ihr Wert: ${f.num2(B.eff12(o))} %`, `Ertragsoptimaler Basiszins Tagesgeld (Abschlüsse × Marge): <b>${f.num2(best[0].r)} %</b>`, `Empfehlung Festgeld 12 M: <b>${f.num2(fg)} %</b> (Markt ${f.num2(m.fgP75)} %, Refinanzierungswert ${f.num2(B.altFG(S, 12))} %)`, 'Konditionsanträge mit zu geringer Marge lehnt die ALCO häufig ab – Abstand zur Refinanzierung mind. 0,35 Pp. halten.']);
    } },
  ];
  const AUDIT = { id: 'd_audit', title: 'Strategie-Audit durch eine Agentur', teaser: 'Die drei wichtigsten Maßnahmen für Ihr Konto – priorisiert nach Euro-Wirkung.', base: 1800, run(S) {
    const recs = R.compute(S).slice(0, 3);
    const out = [];
    const [a, b] = last(S, 45);
    let waste = 0;
    for (const c of liveCamps(S)) for (const k of E.keys(S, 'st', c.id + '~')) { const v = E.sumRange(S, 'st', k, a, b); if (v[I.rconv] < 0.5) waste += v[I.cost]; }
    if (waste > 100) out.push(`<b>Streuverluste beseitigen:</b> ${f.eur0(waste)} in 45 Tagen ohne Ergebnis – Suchbegriffe bereinigen, Keyword-Optionen enger fassen.`);
    const v = E.derive(E.sumRange(S, 'acct', 'all', a, b));
    if (!S.account.trackingOk) out.push('<b>Tracking reparieren:</b> Ohne Conversion-Daten arbeitet Smart Bidding blind – oberste Priorität.');
    else if (v.rconv && v.conv / v.rconv < 0.75) out.push(`<b>Messung verbessern:</b> Nur ${f.pct0(v.conv / v.rconv)} der echten Abschlüsse werden erfasst – Consent Mode (erweitert) und erweiterte Conversions aktivieren.`);
    const g = S.goals;
    if (g && G.GOALS.monthSpend(S) > g.monthBudget * 0.9) out.push('<b>Budgetdisziplin:</b> Sie laufen auf eine Budgetüberschreitung zu – Tagesbudgets jetzt senken.');
    for (const r of recs) out.push(`<b>${esc(r.title)}</b> – ${esc(r.desc)}`);
    return li(out.slice(0, 5));
  } };

  T.catalog = function (S) {
    const scale = U.clamp(S.company.startCash / 30000, 1, 4);
    const gen = GENERAL.concat(S.bank ? BANK_GENERAL : []).map(([id, title, teaser, body]) => ({ id, kind: 'Praxistipp', title, teaser, price: Math.round((150 * scale) / 10) * 10, run: () => body }));
    const diag = DIAG.filter((d) => !d.bank || S.bank).map((d) => ({ ...d, kind: 'Konto-Analyse', price: Math.round((d.base * scale) / 10) * 10 }));
    return gen.concat(diag, [{ ...AUDIT, kind: 'Premium', price: Math.round((AUDIT.base * scale) / 10) * 10 }]);
  };
  T.buy = function (S, id) {
    const t = T.catalog(S).find((x) => x.id === id);
    if (!t) return false;
    if (S.company.cash < t.price) return 'nocash';
    S.tips = S.tips || {};
    let html;
    try { html = t.run(S); } catch (e) { html = '<div class="muted">Analyse nicht möglich: ' + esc(e.message) + '</div>'; }
    S.tips[id] = { day: S.day, html, paid: (S.tips[id] ? S.tips[id].paid : 0) + t.price };
    S.company.cash -= t.price; // sofort aus der Kasse bezahlt
    S.pnl[S.day - 1] && (S.pnl[S.day - 1].other += t.price, S.pnl[S.day - 1].profit -= t.price);
    M.log(S, 'Beratung', t.title, 'Gekauft für ' + f.eur0(t.price));
    return true;
  };

  V.tips = {
    render() {
      const S = APP.S, cat = T.catalog(S), bought = S.tips || {};
      const spent = U.sum(Object.values(bought), (x) => x.paid || 0);
      const card = (t) => {
        const b = bought[t.id];
        const age = b ? S.day - b.day : 0;
        const head = `<div class="rec" style="border-top:0"><div class="ic">${t.kind === 'Premium' ? '🏆' : t.kind === 'Konto-Analyse' ? '🔍' : '💡'}</div><div class="body"><div class="ttl">${esc(t.title)} <span class="tag">${t.kind}</span></div><div class="small muted" style="margin:4px 0">${esc(t.teaser)}</div>`;
        if (!b) return `<div class="card">${head}<button class="btn sm primary" data-act="tipbuy" data-id="${t.id}">Freischalten für ${f.eur0(t.price)}</button></div></div></div>`;
        return `<div class="card">${head}<div class="small" style="margin-top:6px">${b.html}</div><div class="tiny muted" style="margin-top:8px">Gekauft am ${U.fmtDate(U.dayToDate(S.startDate, Math.max(0, b.day - 1)), false)}${t.kind !== 'Praxistipp' ? ` · Stand vor ${age} Tagen <button class="btn sm ghost" data-act="tipbuy" data-id="${t.id}">Aktualisieren (${f.eur0(t.price)})</button>` : ''}</div></div></div></div>`;
      };
      const group = (k, title) => { const items = cat.filter((t) => t.kind === k); return items.length ? `<h3 style="margin:18px 0 10px">${title}</h3><div class="grid g2">${items.map(card).join('')}</div>` : ''; };
      return UI.head('Tipps & Beratung', '', { noScope: true, noRange: true })
        + `<div class="callout">Wissen kostet: Praxistipps vermitteln Grundlagen, Konto-Analysen werten <b>Ihre aktuellen Daten</b> aus – teils mit Insider-Wissen, das es im echten Google Ads nicht gibt. Bezahlt wird sofort aus der Kasse. Bisher investiert: <b>${f.eur0(spent)}</b>.</div>`
        + group('Premium', 'Premium') + group('Konto-Analyse', 'Konto-Analysen (aktuelle Daten)') + group('Praxistipp', 'Praxistipps');
    },
  };
  ACT.tipbuy = (el, d) => {
    const S = APP.S, t = T.catalog(S).find((x) => x.id === d.id);
    UI.confirm(esc(t.title), `Diesen ${t.kind === 'Praxistipp' ? 'Tipp' : 'Bericht'} für <b>${f.eur0(t.price)}</b> aus der Kasse bezahlen?`, () => {
      const r = T.buy(S, d.id);
      if (r === 'nocash') UI.toast('Nicht genug Geld in der Kasse', 'bad'); else UI.toast('Freigeschaltet', 'good');
    }, 'Bezahlen');
  };
})();
