/* Ads Simulator – Bank-Modus: Passivgeschäft Geschäftskunden (Tagesgeld, Festgeld, Geschäftskonto, Visa Business)
 *
 * Recherche-Stand Oktober 2026 (Quellen siehe README):
 * - EZB-Einlagesatz 2,50 % seit 16.09.2026 (Anhebungen Juni & September 2026), nächste Sitzungen 29.10. und 17.12.2026
 * - VW Bank Geschäftskunden: Tagesgeld 2,00 % p. a. (bis 100 Mio. €), Festgeld Business ab 5.000 €, 90–720 Tage, ca. 2,60–3,20 %
 * - Markt: Aktionszinsen 3,75–5,00 % für 4–5 Monate (danach 1–2 %), Großbanken ~0,50 % Tagesgeld, Festgeld 12M ~2,5–2,9 %
 * - Fintech-Geschäftskonten (E-Geld-Institute) teils ohne gesetzliche Einlagensicherung
 * - Finanz-CPCs DACH Ø 4–7 €, einzelne Keywords > 30 €; Google-Verifizierung für Finanzdienstleister (DE seit 24.01.2023)
 * Annahmen (nicht öffentlich belegt): Geschäftskonto- und Visa-Business-Konditionen der VW Bank, Suchvolumina, Einlagengrößen.
 */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U, D = G.D;
  const B = (G.BANK = {});

  // ---------- Suchanfragen-Modifikatoren (Bank) ----------
  Object.assign(D.MODS, {
    zinsen: { t: '{k} zinsen', vol: 0.16, intent: 1.15, cpc: 1.05 },
    beste: { t: 'bestes {k}', vol: 0.06, intent: 1.2, cpc: 1.1 },
    aktuell: { t: '{k} aktuell', vol: 0.05, intent: 0.9, cpc: 0.9 },
    m12: { t: '{k} 12 monate', vol: 0.09, intent: 1.35, cpc: 1.05 },
    m6: { t: '{k} 6 monate', vol: 0.05, intent: 1.3, cpc: 1.0 },
    eroeffnen: { t: '{k} eröffnen', vol: 0.12, intent: 1.75, cpc: 1.2 },
    gruender: { t: '{k} gründer', vol: 0.06, intent: 1.3, cpc: 1.1, biz: 1.05 },
    beantragen: { t: '{k} beantragen', vol: 0.08, intent: 1.6, cpc: 1.15 },
    ohneschufa: { t: '{k} ohne schufa', vol: 0.07, intent: 0.6, cpc: 0.8, biz: 0.4, quality: 0.3 },
    bvergleich: { t: '{k} vergleich', vol: 0.12, intent: 0.95, cpc: 1.15 },
  });

  // ---------- EZB-Zinspfad ----------
  // Einlagesatz; Änderungen gelten 6 Tage nach dem Beschluss. Termine 2027 sind angenommen (typischer 6-Wochen-Rhythmus).
  B.ECB = [
    ['2026-02-05', 0], ['2026-03-19', 0], ['2026-04-30', 0], ['2026-06-11', 0.25], ['2026-07-23', 0], ['2026-09-10', 0.25],
    ['2026-10-29', null, { hike: 0.12, cut: 0.03 }], ['2026-12-17', null, { hike: 0.35, cut: 0.03 }], ['2027-02-04', null], ['2027-03-18', null], ['2027-04-29', null], ['2027-06-10', null],
    ['2027-07-22', null], ['2027-09-09', null], ['2027-10-28', null], ['2027-12-16', null], ['2028-02-03', null], ['2028-03-16', null],
  ];
  B.START_REF = 2.0; // Einlagesatz Anfang 2026

  // ---------- Branchendefinition ----------
  const IND = {
    id: 'vwbank', bank: true, name: 'Bank: Passivgeschäft Geschäftskunden (VW Bank)', icon: '🏦', goal: 'leads',
    desc: 'Realitätsmodus: Tagesgeld, Festgeld, Geschäftskonto & Visa Business für Firmen. EZB-Zinsentscheide, Aktionszins-Wettbewerb, Privatkunden-Streuverluste, KYC-Funnel, Offline-Conversions, Zinsangaben-Compliance.',
    aov: 1200, aovSigma: 0.9, margin: 1, baseCvr: 0.042, baseCtr: 0.06, bgDensity: 3, dispCvr: 0.35, dispBiz: 0.35,
    displayCpm: 6.5, cpv: 0.06, displayInventory: 280000, hours: 'b2b', startDate: '2026-10-12', cashMult: 10,
    lag: [0.5, 0.18, 0.1, 0.07, 0.05, 0.04, 0.03, 0.03],
    devices: { mobile: { share: 0.36, ctr: 0.95, cvr: 0.55 }, desktop: { share: 0.59, ctr: 1.05, cvr: 1.25 }, tablet: { share: 0.05, ctr: 1.0, cvr: 0.9 } },
    dow: [1.18, 1.12, 1.1, 1.06, 0.95, 0.55, 0.62], season: [1.12, 1.02, 1.0, 0.97, 0.95, 0.92, 0.85, 0.85, 1.0, 1.03, 1.05, 1.1],
    hasShopping: false, hasApp: false, mods: ['base'],
    themes: [
      { id: 'tagesgeld', name: 'Tagesgeld Business', product: 'tg', mods: ['base', 'bvergleich', 'zinsen', 'beste', 'aktuell', 'online'],
        kws: [['tagesgeld geschäftskunden', 1300, 2.6, 0.92], ['firmentagesgeld', 1600, 2.4, 0.95], ['tagesgeld gmbh', 880, 2.9, 0.95], ['tagesgeld für firmen', 590, 2.5, 0.93], ['tagesgeld', 165000, 1.9, 0.04], ['tagesgeldkonto', 49500, 1.8, 0.04]] },
      { id: 'festgeld', name: 'Festgeld Business', product: 'fg', mods: ['base', 'bvergleich', 'zinsen', 'beste', 'm12', 'm6'],
        kws: [['festgeld geschäftskunden', 720, 2.8, 0.93], ['firmenfestgeld', 480, 2.6, 0.95], ['festgeld gmbh', 390, 2.9, 0.95], ['festgeld', 110000, 1.7, 0.04], ['festgeldkonto', 27100, 1.6, 0.04]] },
      { id: 'giro', name: 'Geschäftskonto', product: 'giro', mods: ['base', 'bvergleich', 'kostenlos', 'eroeffnen', 'online', 'test', 'gruender', 'erfahrungen'],
        kws: [['geschäftskonto', 40500, 6.2, 0.95], ['firmenkonto', 9900, 5.6, 0.95], ['geschäftskonto gmbh', 6600, 7.4, 0.98], ['geschäftskonto selbstständige', 3600, 5.2, 0.9], ['girokonto', 201000, 1.4, 0.03]] },
      { id: 'visa', name: 'Visa Business', product: 'visa', mods: ['base', 'bvergleich', 'kostenlos', 'beantragen', 'ohneschufa'],
        kws: [['firmenkreditkarte', 6600, 3.9, 0.92], ['business kreditkarte', 5400, 4.1, 0.85], ['kreditkarte für unternehmen', 2900, 3.8, 0.93], ['kreditkarte selbstständige', 2400, 3.4, 0.8], ['kreditkarte', 246000, 2.2, 0.03]] },
    ],
    brand: { name: 'VW Bank', vol: 0 },
    // [Suchbegriff, Suchvolumen/Monat, Kaufabsicht, Geschäftskunden-Anteil]
    brandQueries: [['volkswagen bank', 60500, 0.9, 0.06], ['vw bank', 33100, 0.9, 0.06], ['volkswagen bank login', 22200, 0.02, 0.05], ['volkswagen bank tagesgeld', 4400, 1.8, 0.08], ['volkswagen bank festgeld', 2900, 1.8, 0.08], ['volkswagen bank geschäftskunden', 590, 2.2, 0.97], ['vw bank geschäftskonto', 320, 2.2, 0.95]],
    competitors: [
      { name: 'ZinsRadar24', domain: 'zinsradar24.de', style: 'marketplace', kind: 'Vergleichsportal', portal: true, budget: 2600, qs: 8, aggr: 1.1, themes: ['tagesgeld', 'festgeld', 'giro', 'visa'] },
      { name: 'Kontoprofi Vergleich', domain: 'kontoprofi-vergleich.de', style: 'aggressive', kind: 'Vergleichsportal', portal: true, budget: 900, qs: 7, aggr: 1.05, themes: ['giro', 'visa'] },
      { name: 'Nordstern Direktbank', domain: 'nordstern-direktbank.de', style: 'aggressive', kind: 'Direktbank', budget: 1400, qs: 8, aggr: 1.1, themes: ['tagesgeld', 'festgeld', 'giro'],
        rates: { tgPromo: 3.75, tgPromoM: 4, tgBase: 1.0, fg: { 3: 2.2, 6: 2.35, 12: 2.5, 24: 2.6 }, giroFee: 0, visaFee: 0, insured: true, rx: 0.8, lag: 7 } },
      { name: 'Qubit Business', domain: 'qubit-business.com', style: 'aggressive', kind: 'Neobank (E-Geld-Institut)', budget: 900, qs: 7, aggr: 1.1, themes: ['giro', 'visa', 'tagesgeld'],
        rates: { tgPromo: 4.0, tgPromoM: 4, tgBase: 2.0, fg: null, giroFee: 11, visaFee: 0, insured: false, rx: 0.9, lag: 5 } },
      { name: 'Finova Business', domain: 'finova-business.de', style: 'erratic', kind: 'Neobank (E-Geld-Institut)', budget: 650, qs: 6, aggr: 1.0, themes: ['giro', 'visa', 'tagesgeld'],
        rates: { tgPromo: 5.0, tgPromoM: 5, tgBase: 1.5, fg: null, giroFee: 9, visaFee: 0, insured: false, rx: 0.9, lag: 6 } },
      { name: 'Commerzial Bank', domain: 'commerzial-bank.de', style: 'brand', kind: 'Großbank', budget: 1600, qs: 8, aggr: 0.95, themes: ['giro', 'visa', 'festgeld', 'tagesgeld'],
        rates: { tgPromo: 0, tgPromoM: 0, tgBase: 0.5, fg: { 3: 2.3, 6: 2.5, 12: 2.78, 24: 2.85 }, giroFee: 15.9, visaFee: 69, insured: true, rx: 0.35, lag: 25 } },
      { name: 'Hanse Autobank', domain: 'hanse-autobank.de', style: 'profit', kind: 'Autobank', budget: 420, qs: 7, aggr: 1.0, themes: ['tagesgeld', 'festgeld'],
        rates: { tgPromo: 0, tgPromoM: 0, tgBase: 1.9, fg: { 3: 2.5, 6: 2.7, 12: 2.9, 24: 3.0 }, giroFee: null, visaFee: null, insured: true, rx: 0.7, lag: 10 } },
      { name: 'Regionalbank-Verbund', domain: 'regionalbank-verbund.de', style: 'brand', kind: 'Regionalbanken', budget: 700, qs: 9, aggr: 0.9, themes: ['giro', 'visa'], geo: ['NW', 'BY', 'BW', 'NI', 'HE', 'SN'],
        rates: { tgPromo: 0, tgPromoM: 0, tgBase: 0.5, fg: { 3: 2.0, 6: 2.2, 12: 2.4, 24: 2.5 }, giroFee: 14.9, visaFee: 45, insured: true, rx: 0.3, lag: 30 } },
    ],
    entrants: ['Ledgerly Business', 'Zinsfabrik Direkt', 'Kontora Neobank'],
    audiences: {
      inmarket: [{ name: 'Kaufbereit: Geschäftskonten & Zahlungsdienste', themes: ['giro', 'visa'], share: 0.06 }, { name: 'Kaufbereit: Geldanlage & Sparkonten', themes: ['tagesgeld', 'festgeld'], share: 0.09 }],
      affinity: [{ name: 'Unternehmer & Selbstständige', share: 0.1 }, { name: 'Finanz- & Anlageinteressierte', share: 0.15 }],
      life: [{ name: 'Unternehmensgründung', share: 0.015 }],
    },
    age: [0.4, 0.9, 1.2, 1.25, 1.15, 0.9, 0.9], gender: { m: 1.02, f: 0.97, u: 0.9 },
    conv: [
      { name: 'Antrag gestartet', category: 'Sonstiges', rate: 2.6, value: 0, primary: false },
      { name: 'Antrag abgeschickt', category: 'Lead-Formular', rate: 1, value: 50, primary: true, appSubmit: true },
      { name: 'Legitimation abgeschlossen (VideoIdent)', category: 'Sonstiges', rate: 0.7, value: 0, primary: false, qualified: true, qRate: 0.78, lagExtra: [1, 4] },
      { name: 'Konto eröffnet & Erstanlage (Offline-Import)', category: 'Kauf', rate: 0.58, value: 'dynamic', primary: false, qualified: true, opening: true, lagExtra: [5, 14], requiresImport: true },
    ],
    lp: { speed: 62, relevance: 0.6 },
  };
  D.INDUSTRIES.push(IND);
  D.IND_BY_ID[IND.id] = IND;

  // Saisonkalender (Bank)
  D.CAL_EVENTS.push(
    { id: 'jahresendliq', name: 'Jahresend-Liquidität der Unternehmen', range: (y) => [new Date(Date.UTC(y, 10, 25)), new Date(Date.UTC(y, 11, 20))], fx: { vwbank: { themeDemand: { tagesgeld: 1.25, festgeld: 1.3 } } } },
    { id: 'gruendung', name: 'Gründungs-Hochsaison (Jahresanfang)', range: (y) => [new Date(Date.UTC(y, 0, 2)), new Date(Date.UTC(y, 1, 15))], fx: { vwbank: { themeDemand: { giro: 1.25, visa: 1.1 } } } },
    ...[2, 5, 8, 11].map((m) => ({ id: 'steuer' + m, name: 'Steuer-Vorauszahlungstermin (10.)', range: (y) => [new Date(Date.UTC(y, m, 6)), new Date(Date.UTC(y, m, 11))], fx: { vwbank: { themeCvr: { tagesgeld: 0.85, festgeld: 0.8 } } } })),
  );
  for (const ev of D.CAL_EVENTS) {
    if (ev.id === 'zwischenjahre') ev.fx.vwbank = { demand: 0.55, cvr: 0.75 };
    if (ev.id === 'sommerferien') ev.fx.vwbank = { demand: 0.88 };
  }
  // Allgemeine Ereignisse, die für eine Bank keinen Sinn ergeben
  for (const ev of D.RANDOM_EVENTS) if (['comp_sale', 'viral', 'heat', 'cold', 'price_hike', 'media_negative'].includes(ev.id)) ev.notIndustries = ['vwbank'];
  D.RANDOM_EVENTS.push(
    { id: 'rate_offensive', p: 0.012, dur: [30, 60], sev: 'warn', industries: ['vwbank'], compFilter: 'rates', name: 'Zinsoffensive: {comp}', desc: '{comp} hebt den Neukunden-Aktionszins für Tagesgeld deutlich an und erhöht die Gebote auf Zinssuchen.' },
    { id: 'portal_test', p: 0.004, dur: [14, 30], sev: 'warn', industries: ['vwbank'], compFilter: 'rates', name: 'Vergleichsportal kürt Testsieger: {comp}', desc: 'Ein großes Vergleichsportal empfiehlt {comp} als bestes Firmentagesgeld. Anleger vergleichen kritischer.' },
    { id: 'bank_trust', p: 0.002, dur: [20, 45], sev: 'info', industries: ['vwbank'], name: 'Debatte um Einlagensicherung', desc: 'Die Schieflage eines Zahlungsdienstleisters verunsichert Unternehmen. Etablierte Banken mit gesetzlicher Einlagensicherung profitieren, Neobanken halten sich zurück.' },
    { id: 'kyc_backlog', p: 0.004, dur: [10, 25], sev: 'warn', industries: ['vwbank'], name: 'Rückstau in der Kontoeröffnung (KYC)', desc: 'Das Backoffice kommt mit der Prüfung von Handelsregister, Transparenzregister und wirtschaftlich Berechtigten nicht hinterher. Eröffnungen verzögern sich, Antragsteller springen ab.', fixable: { label: 'Zusätzliche KYC-Kapazität einkaufen', cost: 3000 } },
    { id: 'videoident_down', p: 0.004, dur: [1, 3], sev: 'crit', industries: ['vwbank'], name: 'Störung beim VideoIdent-Dienstleister', desc: 'Legitimationen schlagen fehl. Anträge bleiben unvollständig – Klicks werden weiter bezahlt.' },
    { id: 'fin_reverify', p: 0.0015, dur: [1, 1], sev: 'crit', industries: ['vwbank'], name: 'Google fordert erneute Finanzdienstleister-Verifizierung', desc: 'Google verlangt eine erneute Verifizierung (Abgleich mit dem BaFin-Register). Frist: 30 Tage, Prüfung dauert 1–2 Wochen. Ohne Verifizierung werden keine Finanzanzeigen mehr ausgeliefert.' },
    { id: 'brand_safety', p: 0.004, dur: [1, 1], sev: 'crit', requires: 'unsafeDisplay', name: 'Brand-Safety-Vorfall', desc: 'Screenshots zeigen Ihre Anzeige neben Desinformations-Inhalten auf einer Ramsch-Website. Die Unternehmenskommunikation fordert sofortige Inhaltsausschlüsse.' },
    { id: 'zins_abmahnung', p: 0.002, dur: [1, 1], sev: 'warn', industries: ['vwbank'], name: 'Prüfung von Zinswerbung durch Wettbewerbshüter', desc: 'Nach Beschwerden über irreführende Zinswerbung werden Anzeigen mit Zinsangaben erneut geprüft.' },
  );

  // ---------- Zustand ----------
  B.refAtDate = function (dateISO) {
    let r = B.START_REF;
    for (const [d, ch] of B.ECB) {
      const eff = U.toISO(U.addDays(U.parseISO(d), 6));
      if (ch !== null && eff <= dateISO) r += ch;
    }
    return +r.toFixed(2);
  };
  B.init = function (S, rng) {
    const ind = D.IND_BY_ID[S.ind];
    S.bank = {
      ref: B.refAtDate(S.startDate), infl: 0.1, decided: {},
      own: { tgBase: 2.0, tgPromo: 0, tgPromoM: 0, fg: { 3: 2.6, 6: 2.75, 12: 3.0, 24: 3.2 }, giroFee: 9.9, visaFee: 0 },
      ownHist: [], book: { tg: [], fg: [], giro: { n: 0, bal: 0 }, visa: { n: 0 } },
      offline: { status: 'off', readyDay: null }, verify: { status: 'verified', deadline: null, readyDay: null },
      flows: {}, pendingAdj: [], hist: [],
    };
    B.snapshotOwn(S);
    for (const c of S.competitors) {
      const def = ind.competitors.find((x) => x.name === c.name);
      if (def && def.rates) c.rates = JSON.parse(JSON.stringify(def.rates));
      B.compThemeAggr(c);
    }
    void rng;
  };
  B.compThemeAggr = function (c) {
    if (!c.rates) return;
    const promo = c.rates.tgPromo || c.rates.tgBase;
    c.themeAggr.tagesgeld = U.clamp(0.75 + 0.18 * promo, 0.6, 1.8);
    if (c.rates.fg) c.themeAggr.festgeld = U.clamp(0.4 + 0.25 * c.rates.fg[12], 0.6, 1.5);
  };
  B.snapshotOwn = function (S) {
    S.bank.ownHist.push({ day: S.day, own: JSON.parse(JSON.stringify(S.bank.own)) });
    if (S.bank.ownHist.length > 60) S.bank.ownHist.shift();
  };

  // ---------- Zinsen & Wettbewerbsfähigkeit ----------
  B.altTG = (S) => S.bank.ref + 0.45; // Refinanzierungsalternative für Sichteinlagen
  B.altFG = (S, m) => S.bank.ref + 0.6 + 0.2 * (m / 12); // Kapitalmarkt-Refinanzierung inkl. Laufzeitprämie
  B.eff12 = (r) => (r.tgPromo > 0 ? (r.tgPromo * r.tgPromoM + r.tgBase * (12 - r.tgPromoM)) / 12 : r.tgBase);
  B.headlineTG = (r) => Math.max(r.tgPromo || 0, r.tgBase);
  function quantile(arr, q) { if (!arr.length) return 0; const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; }
  B.market = function (S) {
    const comps = S.competitors.filter((c) => c.active && c.rates);
    const tg = comps.map((c) => B.eff12(c.rates) - (c.rates.insured ? 0 : 0.35));
    const fg = comps.filter((c) => c.rates.fg).map((c) => c.rates.fg[12]);
    const giro = comps.filter((c) => c.rates.giroFee !== null && c.rates.giroFee !== undefined).map((c) => c.rates.giroFee);
    const visa = comps.filter((c) => c.rates.visaFee !== null && c.rates.visaFee !== undefined).map((c) => c.rates.visaFee);
    return { tgP75: quantile(tg, 0.75), tgHead: Math.max(0, ...comps.map((c) => B.headlineTG(c.rates))), fgP75: quantile(fg, 0.75), giroMed: quantile(giro, 0.5), visaMed: quantile(visa, 0.5) };
  };
  B.cvrMults = function (S) {
    const o = S.bank.own, m = B.market(S);
    const tgSpread = B.eff12(o) - m.tgP75;
    const fgSpread = o.fg[12] - m.fgP75;
    return {
      tagesgeld: U.clamp(Math.exp(1.5 * tgSpread), 0.3, 2.2),
      festgeld: U.clamp(Math.exp(1.8 * fgSpread), 0.3, 2.2),
      giro: U.clamp(Math.exp(-0.07 * (o.giroFee - m.giroMed)), 0.4, 1.8),
      visa: U.clamp(Math.exp(-0.015 * (o.visaFee - m.visaMed)), 0.5, 1.5),
      _tgSpread: tgSpread, _fgSpread: fgSpread,
    };
  };

  // ---------- Produkte, Volumina, Kundenwert ----------
  const THEME_PROD = { tagesgeld: 'tg', festgeld: 'fg', giro: 'giro', visa: 'visa' };
  B.prodOf = (themeId) => THEME_PROD[themeId] || null;
  B.drawOpening = function (S, rng, prod, q) {
    const o = S.bank.own;
    if (!prod) prod = rng.weighted([['tg', 0.35], ['fg', 0.25], ['giro', 0.25], ['visa', 0.15]], (x) => x[1])[0];
    const e = { prod };
    if (prod === 'tg') { e.amt = Math.min(5e6, 60000 * rng.logn(1.1) * 1.8); e.value = e.amt * Math.max(0, B.altTG(S) - B.eff12(o)) / 100 * 1.5; }
    else if (prod === 'fg') {
      e.term = rng.weighted([[3, 0.15], [6, 0.2], [12, 0.45], [24, 0.2]], (x) => x[1])[0];
      e.amt = Math.min(5e6, Math.max(5000, 80000 * rng.logn(1.0) * 1.6));
      e.value = e.amt * Math.max(0, B.altFG(S, e.term) - o.fg[e.term]) / 100 * (e.term / 12);
    } else if (prod === 'giro') { e.amt = 18000 * rng.logn(0.9); e.value = o.giroFee * 36 + e.amt * B.altTG(S) / 100 * 3; }
    else { e.amt = 4000 * rng.logn(0.8); e.value = (o.visaFee + e.amt * 12 * 0.008) * 3; }
    e.value = Math.round(e.value);
    // Finanzagenten-/Geldwäscherisiko bei Geschäftskonten aus „kostenlos"/„ohne Schufa"/generischen Suchen
    if (e.prod === 'giro') e.fraud = rng() < (q && (['kostenlos', 'ohneschufa'].includes(q.mod) || (q.biz ?? 1) < 0.3) ? 0.07 : 0.015);
    if (e.prod === 'tg') e.hot = Math.max(0, B.eff12(o) - B.market(S).tgP75); // Zinsjäger kommen bei Spitzenzinsen
    return e;
  };
  // Eröffnung realisieren (wird bei Eintreffen der Conversion aufgerufen)
  B.onOpen = function (S, e) {
    const b = S.bank, o = b.own, day = S.day;
    const f = (b.flows[day] = b.flows[day] || B.emptyFlow());
    if (e.prod === 'tg') { b.book.tg.push({ amt: e.amt, promo: o.tgPromo, until: o.tgPromo > 0 ? day + Math.round(o.tgPromoM * 30.4) : day, hot: e.hot || 0 }); f.inTG += e.amt; f.nTG++; }
    else if (e.prod === 'fg') { b.book.fg.push({ amt: e.amt, rate: o.fg[e.term], term: e.term, mat: day + Math.round(e.term * 30.4), alt: B.altFG(S, e.term) }); f.inFG += e.amt; f.nFG++; }
    else if (e.prod === 'giro') { b.book.giro.n++; b.book.giro.bal += e.amt; f.nGiro++; if (e.fraud) (b.fraud = b.fraud || []).push({ day: day + 20 + Math.floor(Math.random() * 40), bal: e.amt }); }
    else { b.book.visa.n++; f.nVisa++; }
    S._otherCosts = (S._otherCosts || 0) + 45; // KYC- und Eröffnungskosten
    f.kyc += 45;
  };
  B.emptyFlow = () => ({ inTG: 0, inFG: 0, outTG: 0, outFG: 0, nTG: 0, nFG: 0, nGiro: 0, nVisa: 0, apps: 0, rejects: 0, nii: 0, fees: 0, kyc: 0, rejectCost: 0 });
  B.onApplications = function (S, n, priv) {
    const f = (S.bank.flows[S.day] = S.bank.flows[S.day] || B.emptyFlow());
    f.apps += n; f.rejects += priv; f.rejectCost += priv * 12;
    S._otherCosts = (S._otherCosts || 0) + priv * 12; // Bearbeitung & Ablehnung von Privatkunden-Anträgen
  };

  // B2B-Qualifizierung in Anzeigentexten
  const B2B_RE = /(geschäftskund|firm|business|unternehm|gmbh|selbstständig|selbständig|gewerb|freiberuf|gründer)/i;
  B.isB2B = (ad) => [].concat(ad.headlines || [], ad.descriptions || [], ad.longHeadlines || []).some((h) => B2B_RE.test(h.t));
  B.bizEff = (biz, b2b) => (b2b ? biz / (biz + (1 - biz) * 0.35) : biz);
  // Privatkunden auf einer Geschäftskunden-Landingpage stellen nur selten (versehentlich) einen Antrag
  B.appMix = function (biz, b2b) {
    const be = B.bizEff(biz, b2b), priv = b2b ? 0.05 : 0.15;
    const factor = be + (1 - be) * priv;
    return { factor, privShare: ((1 - be) * priv) / factor, bizEff: be };
  };
  B.ctrQual = (biz, b2b) => (b2b ? biz + (1 - biz) * 0.35 : 1);

  // ---------- Compliance: Zinsangaben in Anzeigen ----------
  const RATE_RE = /(\d{1,2}[,.]\d{1,2})\s?%/g;
  function adProduct(S, ad) {
    const M = G.M;
    const ag = M.ag(S, ad.adGroupId);
    if (!ag) return null;
    const counts = {};
    for (const k of M.kwsOf(S, ag.id)) { const p = B.prodOf(k.theme); if (p) counts[p] = (counts[p] || 0) + 1; }
    for (const t of ag.themes || []) { const p = B.prodOf(t); if (p) counts[p] = (counts[p] || 0) + 1; }
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }
  B.validRates = function (S, prod) {
    const set = new Set();
    for (const h of S.bank.ownHist.filter((x) => x.day >= S.day - 2).concat([{ own: S.bank.own }])) {
      const o = h.own;
      const add = (v) => v && set.add(v.toFixed(2));
      if (!prod || prod === 'tg') { add(o.tgBase); add(o.tgPromo); }
      if (!prod || prod === 'fg') for (const k in o.fg) add(o.fg[k]);
    }
    return set;
  };
  B.policy = function (S, ad) {
    const texts = [].concat(ad.headlines || [], ad.descriptions || [], ad.longHeadlines || []).map((x) => x.t);
    const out = { status: 'approved', reasons: [] };
    const all = texts.join(' | ');
    const rates = [...all.matchAll(RATE_RE)].map((m) => parseFloat(m[1].replace(',', '.')).toFixed(2));
    if (rates.length) {
      const prod = adProduct(S, ad);
      const valid = B.validRates(S, prod === 'giro' || prod === 'visa' ? null : prod);
      const wrong = rates.filter((r) => !valid.has(r));
      if (wrong.length) { out.status = 'disapproved'; out.reasons.push(`Irreführende Zinsangabe: Anzeige nennt ${wrong.map((r) => r.replace('.', ',')).join(' / ')} %, Landingpage nennt andere Konditionen`); }
      else if (!/p\.?\s?a\.?/i.test(all)) { out.status = 'limited'; out.reasons.push('Preisangabe unvollständig: Zinssatz ohne „p. a."'); }
    }
    if (/kostenlos|gebührenfrei|0\s?€/i.test(all) && adProduct(S, ad) === 'giro' && S.bank.own.giroFee > 0) { out.status = 'disapproved'; out.reasons.push('Irreführend: „kostenlos" trotz Kontoführungsentgelt'); }
    if (/(100\s?%|absolut)\s*sicher|risikolos/i.test(all)) { if (out.status === 'approved') out.status = 'limited'; out.reasons.push('Nicht belegte Sicherheitsversprechen (Einlagensicherung korrekt angeben)'); }
    return out;
  };

  // ---------- Tagesablauf ----------
  B.daily = function (S, ctx, rng) {
    const b = S.bank, day = S.day, date = ctx.date, iso = U.toISO(date);
    const f = (b.flows[day] = b.flows[day] || B.emptyFlow());
    // EZB-Entscheidungen
    b.infl = U.clamp(b.infl * 0.995 + rng.normal() * 0.03, -1, 1);
    for (const [d, ch, prob] of B.ECB) {
      if (d !== iso || b.decided[d] !== undefined) continue;
      let change = ch;
      if (change === null) {
        const r = rng();
        const pHike = prob ? prob.hike : U.clamp(0.15 + 0.35 * b.infl, 0.03, 0.7), pCut = prob ? prob.cut : U.clamp(0.08 - 0.3 * b.infl, 0.02, 0.6);
        change = r < pHike ? 0.25 : r > 1 - pCut ? -0.25 : 0;
      }
      b.decided[d] = change;
      const txt = change > 0 ? `erhöht den Einlagesatz um 25 Bp. auf ${(b.ref + change).toFixed(2).replace('.', ',')} %` : change < 0 ? `senkt den Einlagesatz um 25 Bp. auf ${(b.ref + change).toFixed(2).replace('.', ',')} %` : `belässt den Einlagesatz bei ${b.ref.toFixed(2).replace('.', ',')} %`;
      S.market.log.unshift({ day, name: 'EZB ' + txt, desc: change ? 'Wirksam in 6 Tagen. Mitbewerber werden ihre Konditionen anpassen – prüfen Sie Ihre Zinsen und Anzeigentexte. Zinssuchen steigen in den nächsten Tagen.' : 'Zinsentscheid ohne Änderung. Das Interesse an Zinsprodukten steigt kurzfristig.', sev: change ? 'warn' : 'info' });
      S.alerts.unshift({ day, level: change ? 'warn' : 'info', text: '🏛️ EZB ' + txt });
      S.market.events.push({ id: G.M.nid(S, 'ev'), def: 'ecb_decision', sev: 'info', start: day + 1, end: day + 7, name: 'Zinsentscheid-Effekt', desc: '', done: false });
      if (change) {
        b.pendingRef = { day: day + 6, change };
        for (const c of S.competitors) if (c.rates) b.pendingAdj.push({ comp: c.id, day: day + 6 + Math.round(c.rates.lag * rng.range(0.6, 1.4)), d: change * c.rates.rx });
        S._pauseRequest = S._pauseRequest || 'EZB-Zinsentscheid';
      }
    }
    if (b.pendingRef && b.pendingRef.day === day) { b.ref = +(b.ref + b.pendingRef.change).toFixed(2); b.pendingRef = null; }
    // Konditionsanpassungen der Mitbewerber
    b.pendingAdj = b.pendingAdj.filter((a) => {
      if (a.day > day) return true;
      const c = S.competitors.find((x) => x.id === a.comp);
      if (c && c.rates) {
        const r = c.rates;
        r.tgBase = Math.max(0, +(r.tgBase + a.d).toFixed(2));
        if (r.tgPromo) r.tgPromo = Math.max(0, +(r.tgPromo + a.d).toFixed(2));
        if (r.fg) for (const k in r.fg) r.fg[k] = Math.max(0, +(r.fg[k] + a.d * 1.1).toFixed(2));
        B.compThemeAggr(c);
        S.market.log.unshift({ day, name: `${c.name} passt Konditionen an`, desc: `Tagesgeld ${a.d > 0 ? '+' : ''}${a.d.toFixed(2).replace('.', ',')} Pp., Festgeld entsprechend.`, sev: 'info' });
      }
      return false;
    });
    // Einlagenbuch: Zinsüberschuss, Abflüsse, Fälligkeiten
    const o = b.own, m = B.market(S), altTG = B.altTG(S);
    let nii = 0;
    const tgOut = 0.0005 + 0.004 * Math.max(0, m.tgP75 - o.tgBase);
    for (const c of b.book.tg) {
      const rate = c.until > day ? c.promo : o.tgBase;
      nii += (c.amt * (altTG - rate)) / 36500;
      let out = c.amt * tgOut * (1 + 4 * (c.hot || 0));
      if (c.until === day && c.promo > o.tgBase) out += c.amt * U.clamp(0.25 + 0.3 * (m.tgP75 - o.tgBase), 0.05, 0.6); // Zinshopper nach Aktionsende
      c.amt -= out; f.outTG += out;
    }
    b.book.tg = b.book.tg.filter((c) => c.amt > 50);
    const keepFg = [];
    for (const c of b.book.fg) {
      nii += (c.amt * (c.alt - c.rate)) / 36500;
      if (c.mat <= day) {
        const roll = U.clamp(0.5 + 0.6 * (o.fg[c.term] - m.fgP75), 0.1, 0.9);
        if (rng() < roll) { c.rate = o.fg[c.term]; c.alt = B.altFG(S, c.term); c.mat = day + Math.round(c.term * 30.4); keepFg.push(c); }
        else f.outFG += c.amt;
      } else keepFg.push(c);
    }
    b.book.fg = keepFg;
    const g = b.book.giro, v = b.book.visa;
    g.n = Math.max(0, g.n - (rng() < g.n * 0.0003 ? 1 : 0));
    const fees = (g.n * o.giroFee) / 30.4 + (v.n * (o.visaFee + 4000 * 12 * 0.008)) / 365;
    nii += (g.bal * altTG) / 36500;
    f.nii = nii; f.fees = fees;
    ctx.revenue += nii + fees;
    // Finanzdienstleister-Verifizierung
    const vf = b.verify;
    if (vf.status === 'pending' && vf.readyDay <= day) { vf.status = 'verified'; vf.deadline = null; S.alerts.unshift({ day, level: 'good', text: 'Finanzdienstleister-Verifizierung abgeschlossen ✓' }); }
    if (vf.status === 'required' && vf.deadline < day) { vf.status = 'suspended'; S.alerts.unshift({ day, level: 'bad', text: 'Verifizierungsfrist abgelaufen: Finanzanzeigen werden nicht mehr ausgeliefert!' }); S._pauseRequest = 'Verifizierung abgelaufen'; }
    // Offline-Conversion-Import
    const off = b.offline;
    if (off.status === 'setup' && off.readyDay <= day) {
      off.status = 'on';
      const ca = S.convActions.find((x) => x.requiresImport);
      if (ca) ca.status = 'enabled';
      S.alerts.unshift({ day, level: 'good', text: 'Offline-Conversion-Import aktiv: Kontoeröffnungen werden aus dem CRM nach Google Ads übertragen.' });
    }
    // Compliance-Scan der Anzeigen (Google crawlt Landingpages regelmäßig)
    for (const ad of S.ads) {
      if (ad.status !== 'enabled' || (ad.reviewUntil !== null && ad.reviewUntil > day)) continue;
      const p = G.M.policyCheck(S, ad);
      if (p.status === 'disapproved' && ad.policy.status !== 'disapproved') {
        ad.policy = p; S.alerts.unshift({ day, level: 'bad', text: 'Anzeige abgelehnt: ' + p.reasons.join(', ') });
      }
    }
    // Geldwäsche-Verdachtsfälle (Finanzagenten) bei Geschäftskonten
    for (const fr of (b.fraud || []).filter((x) => x.day === day)) {
      g.n = Math.max(0, g.n - 1); g.bal = Math.max(0, g.bal - fr.bal);
      S._otherCosts = (S._otherCosts || 0) + 350; f.kyc += 350;
      S.alerts.unshift({ day, level: 'bad', text: 'Geldwäsche-Verdacht: Geschäftskonto als Finanzagenten-Konto gekündigt (Verdachtsmeldung, 350 € Aufwand)' });
      b.fraudCount = (b.fraudCount || 0) + 1;
    }
    if (b.fraud) b.fraud = b.fraud.filter((x) => x.day > day);
    // ALCO/Treasury entscheidet über Konditionsanträge
    if (b.request && b.request.decideDay <= day) {
      const r = b.request; b.request = null;
      if (rng() < r.p) { const ch = B.setOwn(S, r.own); S.alerts.unshift({ day, level: 'good', text: 'ALCO hat Ihren Konditionsantrag genehmigt: ' + (ch.join('; ') || 'keine Änderung') + '. Denken Sie an Ihre Anzeigentexte.' }); }
      else { S.alerts.unshift({ day, level: 'bad', text: 'ALCO lehnt Konditionsantrag ab: ' + r.why }); G.M.log(S, 'Konditionen', 'ALCO-Antrag', 'Abgelehnt: ' + r.why); }
    }
    // Mitbewerber ziehen nach, wenn Sie dauerhaft den Spitzenzins bieten
    const topTG = B.eff12(o) >= Math.max(...S.competitors.filter((c) => c.active && c.rates).map((c) => B.eff12(c.rates)));
    b.topDays = topTG ? (b.topDays || 0) + 1 : 0;
    if (b.topDays >= 14 && (!b.lastMatch || day - b.lastMatch > 30)) {
      const followers = S.competitors.filter((c) => c.active && c.rates && ['aggressive', 'erratic'].includes(c.style));
      for (const c of followers) { c.rates.tgPromo = +(Math.max(c.rates.tgPromo, c.rates.tgBase, B.headlineTG(o)) + 0.1).toFixed(2); c.rates.tgPromoM = Math.max(c.rates.tgPromoM, 3); B.compThemeAggr(c); }
      if (followers.length) S.market.log.unshift({ day, name: 'Mitbewerber ziehen beim Zins nach', desc: followers.map((c) => c.name).join(', ') + ' überbieten Ihren Spitzenzins. Ihr Vorsprung schmilzt.', sev: 'warn' });
      b.lastMatch = day; b.topDays = 0;
    }
    b.hist.push({ day, ref: b.ref, tg: U.sum(b.book.tg, (c) => c.amt), fg: U.sum(b.book.fg, (c) => c.amt), giro: g.n, visa: v.n, ownTG: o.tgBase, ownFG12: o.fg[12], mktTG: m.tgP75, mktFG: m.fgP75 });
    if (b.hist.length > 900) b.hist.shift();
    for (const k of Object.keys(b.flows)) if (+k < day - 400) delete b.flows[k];
  };

  // Ereignis-Hooks (aus der Engine aufgerufen)
  B.onEvent = function (S, ev, phase) {
    const c = ev.comp && S.competitors.find((x) => x.id === ev.comp);
    if (ev.def === 'rate_offensive' && c && c.rates) {
      if (phase === 'start') { ev.restore = { tgPromo: c.rates.tgPromo, tgPromoM: c.rates.tgPromoM }; c.rates.tgPromo = +(Math.max(c.rates.tgPromo, c.rates.tgBase) + 0.5).toFixed(2); c.rates.tgPromoM = Math.max(c.rates.tgPromoM, 4); }
      else if (ev.restore) Object.assign(c.rates, ev.restore);
      B.compThemeAggr(c);
    }
    if (ev.def === 'fin_reverify' && phase === 'start') { S.bank.verify = { status: 'required', deadline: S.day + 30, readyDay: null }; }
    if (ev.def === 'zins_abmahnung' && phase === 'start') for (const ad of S.ads) if (ad.status !== 'removed' && /\d[,.]\d{1,2}\s?%/.test(JSON.stringify(ad.headlines || []) + JSON.stringify(ad.descriptions || []))) G.M.reviewAd(S, ad, true);
  };
  B.fx = function (S, e, fx, mul) {
    switch (e.def) {
      case 'ecb_decision': mul(fx.themeDemand, 'tagesgeld', 1.35); mul(fx.themeDemand, 'festgeld', 1.3); break;
      case 'portal_test': mul(fx.compAggrById, e.comp, 1.2); mul(fx.themeCvr, 'tagesgeld', 0.9); break;
      case 'bank_trust': mul(fx.themeCvr, 'tagesgeld', 1.15); mul(fx.themeCvr, 'festgeld', 1.12); for (const c of S.competitors) if (c.rates && !c.rates.insured) mul(fx.compAggrById, c.id, 0.7); break;
      case 'kyc_backlog': fx.kyc = (fx.kyc || 1) * 0.8; fx.kycLag = 7; break;
      case 'videoident_down': fx.kyc = (fx.kyc || 1) * 0.4; break;
    }
  };

  // ---------- Startkonto ----------
  B.createStarter = function (S) {
    const M = G.M;
    const mk = (name, budget, kws, heads, descs) => {
      const c = M.makeCampaign(S, 'search', { name, budget, bidStrategy: { type: 'manual' }, locations: D.DE_IDS.slice() });
      S.campaigns.push(c);
      for (const [agName, bid, list] of kws) {
        const ag = M.makeAdGroup(S, c, { name: agName, defaultBid: bid });
        S.adGroups.push(ag);
        for (const [t, mt] of list) S.keywords.push(M.makeKeyword(S, ag, t, mt));
        S.ads.push(M.makeAd(S, ag, { type: 'rsa', headlines: heads.map((t) => ({ t, pin: 0 })), descriptions: descs.map((t) => ({ t, pin: 0 })), noReview: true }));
      }
      return c;
    };
    mk('Suche | Brand', 60, [['Marke', 0.6, [['volkswagen bank', 'phrase'], ['vw bank', 'phrase']]]],
      ['Volkswagen Bank', 'Tagesgeld 2,00 % p. a.', 'Jetzt Konto eröffnen', 'Sicher anlegen'],
      ['Die Bank von Volkswagen Financial Services. Jetzt informieren.', 'Einlagensicherung bis 100.000 € pro Kunde.']);
    mk('Suche | Tagesgeld & Festgeld', 180, [
      ['Tagesgeld', 2.2, [['tagesgeld', 'broad'], ['tagesgeld geschäftskunden', 'phrase'], ['firmentagesgeld', 'phrase']]],
    ], ['Tagesgeld 2,00 % p. a.', 'Volkswagen Bank', 'Jetzt online eröffnen', 'Täglich verfügbar', 'Ohne Mindestanlage'],
    ['Attraktive Zinsen ohne Kontoführungsgebühr. Jetzt in wenigen Minuten eröffnen.', 'Einlagensicherung bis 100.000 €. Zinsen monatlich gutgeschrieben.']);
    const fgCamp = S.campaigns[S.campaigns.length - 1];
    const ag = M.makeAdGroup(S, fgCamp, { name: 'Festgeld', defaultBid: 2.0 });
    S.adGroups.push(ag);
    for (const [t, mt] of [['festgeld', 'broad'], ['festgeld geschäftskunden', 'phrase']]) S.keywords.push(M.makeKeyword(S, ag, t, mt));
    S.ads.push(M.makeAd(S, ag, { type: 'rsa', headlines: ['Festgeld bis 3,20 % p. a.', 'Volkswagen Bank', 'Garantierte Zinsen', 'Laufzeit 3 bis 24 Monate', 'Jetzt online anlegen'].map((t) => ({ t, pin: 0 })), descriptions: ['Feste Zinsen über die gesamte Laufzeit. Ab 5.000 € Anlagebetrag.', 'Einlagensicherung bis 100.000 €. Jetzt in wenigen Minuten eröffnen.'].map((t) => ({ t, pin: 0 })), noReview: true }));
    S.assets.push({ id: M.nid(S, 'as'), type: 'callout', level: 'account', campaignId: null, status: 'enabled', data: { text: 'Einlagensicherung' } });
  };

  // ---------- Aktionen ----------
  B.setOwn = function (S, own) {
    const old = S.bank.own;
    const ch = [];
    if (own.tgBase !== old.tgBase) ch.push(`Tagesgeld ${old.tgBase} → ${own.tgBase} %`);
    if (own.tgPromo !== old.tgPromo || own.tgPromoM !== old.tgPromoM) ch.push(`Aktionszins ${own.tgPromo} % für ${own.tgPromoM} Mon.`);
    for (const k of [3, 6, 12, 24]) if (own.fg[k] !== old.fg[k]) ch.push(`Festgeld ${k}M ${old.fg[k]} → ${own.fg[k]} %`);
    if (own.giroFee !== old.giroFee) ch.push(`Geschäftskonto ${old.giroFee} → ${own.giroFee} €/Monat`);
    if (own.visaFee !== old.visaFee) ch.push(`Visa Business ${old.visaFee} → ${own.visaFee} €/Jahr`);
    S.bank.own = own;
    B.snapshotOwn(S);
    if (ch.length) G.M.log(S, 'Konditionen', 'Produktkonditionen', ch.join('; '));
    return ch;
  };
  // Konditionsänderungen müssen von ALCO/Treasury freigegeben werden (2–6 Tage)
  B.requestOwn = function (S, own) {
    const o = S.bank.own, alt = B.altTG(S);
    let p = 0.85, why = 'Marge unter der Mindestmarge der Treasury';
    const tgMargin = alt - B.eff12(own), fgMargin = Math.min(...[3, 6, 12, 24].map((t) => B.altFG(S, t) - own.fg[t]));
    const cheaper = own.tgBase <= o.tgBase && own.tgPromo <= o.tgPromo && [3, 6, 12, 24].every((t) => own.fg[t] <= o.fg[t]);
    if (cheaper) p = 0.97;
    else if (tgMargin < 0.15 || fgMargin < 0.05) p = 0.2;
    else if (tgMargin < 0.35 || fgMargin < 0.15) { p = 0.55; why = 'Liquiditätsbedarf aktuell gering – Treasury hält Zinserhöhung für zu teuer'; }
    if (own.tgPromo > 0 && own.tgPromo > o.tgPromo) { p *= 0.85; why = 'Aktionszins ohne ausreichende Bindungswirkung'; }
    S.bank.request = { own, submitted: S.day, decideDay: S.day + 2 + Math.floor(Math.random() * 5), p, why };
    G.M.log(S, 'Konditionen', 'ALCO-Antrag', 'Eingereicht');
  };
  B.startOffline = function (S) {
    if (S.bank.offline.status !== 'off') return false;
    S.bank.offline = { status: 'setup', readyDay: S.day + 7 };
    G.R.spend(S, 2500, 'CRM-Anbindung Offline-Conversion-Import');
    return true;
  };
  B.submitVerify = function (S, rng) {
    const v = S.bank.verify;
    if (v.status === 'verified' || v.status === 'pending') return false;
    v.status = 'pending'; v.readyDay = S.day + 7 + Math.floor(Math.random() * 8);
    G.M.log(S, 'Konto', 'Finanzdienstleister-Verifizierung', 'Unterlagen eingereicht (BaFin-Registerabgleich)');
    void rng;
    return true;
  };
})();
