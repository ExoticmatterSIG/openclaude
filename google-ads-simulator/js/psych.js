/* Ads Simulator – Kaufverhalten & Marketingpsychologie
 * - Psychologische Trigger im Anzeigentext (Social Proof, Autorität, Verknappung, Preisanker, Risikoumkehr, Gratis, CTA)
 *   mit kontextabhängiger Wirkung (Kaufabsicht, Branche, Markenbekanntheit), Abnutzung und Rechtsrisiken (UWG/PAngV)
 * - Conversion-Optimierung (Shop/Landingpage): Bewertungen, Siegel, Zahlarten, Versand, Countdown, Exit-Popup, Chat …
 * - Verkäuferbewertungen (Sterne), Vertrauen, Wiederkäufe/Kundenwert, Zahltag-Effekt, Rückkehrer über Markensuche
 */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U;
  const P = (G.PSY = {});

  // ---------- Trigger im Anzeigentext ----------
  P.TRIGGERS = {
    social: { name: 'Social Proof', re: /(bewert|sterne|★|\d[\d.]*\s*(\+\s*)?(kunden|zufriedene|nutzer|unternehmen)|kunden vertrauen|beliebt|bestseller)/i, tip: 'Wirkt stark bei unbekannten Marken, schwächer bei bekannten.' },
    authority: { name: 'Autorität & Sicherheit', re: /(testsieger|tüv|stiftung|ausgezeichnet|siegel|zertifiziert|meisterbetrieb|seit \d{2,4}|einlagensicherung|bafin|geprüft|experten)/i, tip: 'Besonders wirksam bei Finanzen, Versicherung und Handwerk. „Testsieger" muss belegbar sein.' },
    urgency: { name: 'Verknappung & Dringlichkeit', re: /(nur noch|nur heute|begrenzt|endet|letzte chance|jetzt zugreifen|solange|countdown|nur bis)/i, tip: 'Hebt die Klickrate bei hoher Kaufabsicht, nutzt sich ab und wirkt im B2B-/Finanzumfeld unseriös. Dauerhafte Verknappung ist abmahnfähig.' },
    price: { name: 'Preisanker & Rabatt', re: /(statt|uvp|%\s*rabatt|-\s?\d+\s?%|sparen|spare|günstig|reduziert|sale|angebot)/i, tip: 'Zieht Schnäppchenjäger an: mehr Klicks, kleinere Warenkörbe, mehr Retouren.' },
    risk: { name: 'Risikoumkehr', re: /(kostenlose rücksendung|gratis rückversand|geld-zurück|risikofrei|ohne risiko|jederzeit kündbar|kündbar|ohne vertragsbindung|unverbindlich|probe|testen)/i, tip: 'Senkt die Kaufhürde. Im Modehandel steigen dadurch die Retouren.' },
    free: { name: 'Gratis & Reziprozität', re: /(gratis|kostenlos|geschenk|gratis-|ratgeber|0 €)/i, tip: 'Viele Klicks von Gratis-Suchern; Conversion-Rate oft niedriger.' },
    cta: { name: 'Klarer Call-to-Action', re: /(jetzt|hier|sofort|direkt)\s+[a-zäöü]+/i, tip: 'Konkrete Handlungsaufforderung erhöht die Klickrate leicht.' },
  };
  P.analyze = function (ad) {
    const text = [].concat(ad.headlines || [], ad.descriptions || [], ad.longHeadlines || []).map((x) => x.t).join(' | ');
    const cats = [];
    for (const [k, t] of Object.entries(P.TRIGGERS)) if (t.re.test(text)) cats.push(k);
    return cats;
  };
  // Wirkung eines Anzeigentextes in einem Kontext (gecacht pro Tag & Anzeige)
  P.adProfile = function (S, ad, q) {
    const key = S.day + '|' + (q ? q.intent.toFixed(1) + (q.mod || '') : '-');
    if (ad._psy && ad._psy.k === key) return ad._psy.v;
    const ind = G.M.ind(S), cats = P.analyze(ad);
    const serious = ind.bank || ['insurance', 'saas'].includes(ind.id);
    const aw = S.company.awareness;
    const intent = q ? q.intent : 1;
    const priceQuery = q && ['guenstig', 'sale', 'vergleich', 'bvergleich', 'angebot', 'kostenlos'].includes(q.mod);
    const age = S.day - (ad.created || 0);
    let ctr = 1, cvr = 1, aov = 1, ret = 0;
    for (const c of cats) {
      if (c === 'social') { const s = U.clamp(1.25 - aw * 2, 0.4, 1.2); ctr *= 1 + 0.07 * s; cvr *= 1 + 0.05 * s; }
      if (c === 'authority') { const s = serious || ind.id === 'local' ? 1.6 : 0.8; ctr *= 1 + 0.03 * s; cvr *= 1 + 0.05 * s; }
      if (c === 'urgency') {
        const decay = U.clamp(1 - age / 60, -0.6, 1); // Dauer-Verknappung verliert Glaubwürdigkeit
        ctr *= 1 + (intent >= 1 ? 0.09 : -0.02) * decay;
        cvr *= 1 + 0.05 * decay;
        if (serious) { ctr *= 0.95; cvr *= 0.94; }
      }
      if (c === 'price') { ctr *= 1 + (priceQuery ? 0.1 : 0.04); cvr *= 1.03; aov *= 0.93; ret += ind.returns ? 0.04 : 0; }
      if (c === 'risk') { cvr *= 1.07; ret += ind.returns ? 0.03 : 0; }
      if (c === 'free') { ctr *= 1.05; cvr *= ind.id === 'saas' || ind.id === 'fitness' ? 1.05 : 0.95; }
      if (c === 'cta') ctr *= 1.03;
    }
    if (cats.length >= 4) { ctr *= 0.95; cvr *= serious ? 0.9 : 0.96; } // reißerisch / überladen
    const v = { ctr, cvr, aov, ret, cats };
    ad._psy = { k: key, v };
    return v;
  };

  // ---------- Conversion-Optimierung (Shop & Landingpage) ----------
  // cvr/aov: Multiplikatoren · fee: Anteil vom Umsatz · month: Fixkosten/Monat · setup: einmalig
  P.CRO = [
    { id: 'reviews', name: 'Bewertungs-Widget & automatische Bewertungsanfragen', month: 149, setup: 0, cvr: 1.03, reviews: 3, tip: 'Mehr Bewertungen → Verkäuferbewertungen (Sterne) in Anzeigen ab 100 Rezensionen.' },
    { id: 'badges', name: 'Gütesiegel & Käuferschutz', month: 99, setup: 0, cvr: 1.04, only: ['fashion', 'travel', 'fitness'], tip: 'Vertrauen beim Erstkauf, v. a. bei unbekannter Marke.' },
    { id: 'invoice', name: 'Kauf auf Rechnung / Ratenkauf', month: 0, setup: 500, fee: 0.025, cvr: 1.09, aov: 1.06, only: ['fashion', 'travel', 'fitness'], tip: 'In Deutschland beliebteste Zahlart – kostet aber Gebühren und erhöht Retouren leicht.', ret: 0.02 },
    { id: 'wallet', name: 'Express-Checkout (Wallets)', month: 0, setup: 300, fee: 0.012, cvr: 1.06, only: ['fashion', 'travel', 'fitness'], tip: 'Weniger Abbrüche auf Mobilgeräten.' },
    { id: 'guest', name: 'Gastbestellung ohne Kundenkonto', month: 0, setup: 800, cvr: 1.05, repeat: 0.9, only: ['fashion', 'travel', 'fitness'], tip: 'Weniger Reibung, aber weniger wiederkehrende Kunden (keine Kundenkonten).' },
    { id: 'freeship', name: 'Gratisversand ab 59 €', month: 0, setup: 0, fee: 0.035, cvr: 1.06, aov: 1.09, only: ['fashion'], tip: 'Schwellenwert-Effekt: Warenkörbe werden aufgefüllt.' },
    { id: 'countdown', name: 'Countdown-Timer „Angebot endet in …"', month: 29, setup: 0, cvr: 1.08, dark: true, only: ['fashion', 'travel', 'fitness', 'saas'], tip: 'Kurzfristig wirksam. Dauerhafte, unechte Countdowns verletzen das UWG und schaden dem Vertrauen.' },
    { id: 'fakeviewers', name: '„12 Personen sehen sich das gerade an"', month: 19, setup: 0, cvr: 1.05, dark: true, only: ['fashion', 'travel'], tip: 'Erfundener Social Proof – Abmahnrisiko und Vertrauensverlust.' },
    { id: 'exitpopup', name: 'Exit-Intent-Gutschein 10 %', month: 39, setup: 0, fee: 0.04, cvr: 1.06, repeat: 0.85, only: ['fashion', 'fitness', 'travel'], tip: 'Rettet Abbrecher, erzieht aber Kunden zum Warten auf Rabatte.' },
    { id: 'strike', name: 'Streichpreise (UVP-Anker)', month: 0, setup: 0, cvr: 1.04, legal: true, only: ['fashion', 'travel', 'fitness'], tip: 'Ankereffekt. Streichpreise müssen sich auf den niedrigsten Preis der letzten 30 Tage beziehen (PAngV) – sonst Abmahnung.' },
    { id: 'chat', name: 'Live-Chat & Rückrufservice', month: 650, setup: 0, cvr: 1.04, b2bCvr: 1.08, tip: 'Beratung baut Unsicherheit ab – besonders bei erklärungsbedürftigen Produkten.' },
    { id: 'calc', name: 'Interaktiver Rechner auf der Landingpage', month: 0, setup: 1800, cvr: 1.05, only: ['insurance', 'vwbank', 'saas', 'local'], tip: 'Commitment-Effekt: Wer etwas eingegeben hat, schließt eher ab.' },
    { id: 'eid', name: 'Online-Ausweis (eID) statt nur VideoIdent', month: 120, setup: 1500, qual: 1.15, only: ['vwbank', 'insurance'], tip: 'Weniger Abbrüche bei der Legitimation.' },
    { id: 'prefill', name: 'Handelsregister-Autofill im Antrag', month: 90, setup: 2500, qual: 1.1, cvr: 1.03, only: ['vwbank'], tip: 'Kürzerer Antrag – weniger Abbrüche bei Firmenkunden.' },
  ];
  P.available = (S) => P.CRO.filter((c) => !c.only || c.only.includes(S.ind));
  P.state = function (S) {
    if (!S.psy) {
      const ind = G.M.ind(S);
      S.psy = { cro: {}, rating: ind.bank ? 4.3 : 4.2 + Math.random() * 0.3, reviews: ind.bank ? 180 : 40, trust: 0.75, repeats: [], darkDays: 0 };
    }
    return S.psy;
  };
  P.toggle = function (S, id) {
    const st = P.state(S), c = P.CRO.find((x) => x.id === id);
    if (!c) return;
    const on = !st.cro[id];
    st.cro[id] = on ? { since: S.day } : null;
    if (!on) delete st.cro[id];
    if (on && c.setup) G.R.spend(S, c.setup, 'Einrichtung: ' + c.name);
    G.M.log(S, 'Conversion-Optimierung', c.name, on ? 'Aktiviert' : 'Deaktiviert');
  };

  // Tagesvorbereitung: Multiplikatoren für Engine
  P.prep = function (S, ctx) {
    const st = P.state(S), ind = ctx.ind;
    let cvr = 1, aov = 1, fee = 0, qual = 1, ret = 0, repeat = 1, month = 0;
    const b2b = ind.bank || ['saas', 'insurance', 'local'].includes(ind.id);
    for (const c of P.available(S)) {
      if (!st.cro[c.id]) continue;
      let cv = c.b2bCvr && b2b ? c.b2bCvr : c.cvr || 1;
      if (c.dark) { const age = S.day - st.cro[c.id].since; cv = 1 + (cv - 1) * U.clamp(1 - age / 45, -0.5, 1); }
      cvr *= cv; aov *= c.aov || 1; fee += c.fee || 0; qual *= c.qual || 1; ret += c.ret || 0; repeat *= c.repeat || 1; month += c.month || 0;
    }
    // Vertrauen & Sterne
    cvr *= 0.85 + 0.2 * st.trust;
    const stars = st.rating, showStars = st.reviews >= 100 && stars >= 3.5;
    const ratingCvr = U.clamp(1 + (stars - 4.2) * 0.12, 0.8, 1.12);
    // Zahltag: Ende/Anfang des Monats kaufen Verbraucher mehr
    const dom = ctx.date.getUTCDate();
    const payday = b2b ? 1 : dom >= 27 || dom <= 4 ? 1.08 : dom >= 15 && dom <= 24 ? 0.94 : 1;
    return { cvr: cvr * ratingCvr * payday, aov, fee, qual, ret, repeat, month, starsCtr: showStars ? 1 + (stars - 3.5) * 0.06 : 1, showStars };
  };

  // Nach jeder echten Conversion: Bewertungen & Wiederkäufe
  const REPEAT = { fashion: { p: 0.32, d: [40, 160], f: 0.8 }, fitness: { p: 0.55, d: [300, 365], f: 1.0 }, saas: { p: 0.22, d: [30, 90], f: 0.8 }, travel: { p: 0.18, d: [150, 360], f: 1.0 }, local: { p: 0.12, d: [60, 365], f: 0.9 }, insurance: { p: 0.15, d: [90, 360], f: 0.7 } };
  P.onReal = function (S, ctx, rng, value) {
    const st = P.state(S), ind = ctx.ind;
    const rv = ctx.psy || {};
    if (rng() < 0.035 * (st.cro.reviews ? 3 : 1)) {
      const sat = U.clamp(4.4 + (ind.returns ? -0.25 : 0) + (st.trust - 0.75) * 1.5 - (ctx.fx.stockOut && Object.keys(ctx.fx.stockOut).length ? 0.6 : 0) - (ctx.fx.capacity < 1 ? 0.8 : 0) + rng.normal() * 0.6, 1, 5);
      st.rating = (st.rating * st.reviews + sat) / (st.reviews + 1);
      st.reviews += 1;
    }
    const r = REPEAT[ind.id];
    if (r && rng() < r.p * (rv.repeat || 1) * (0.7 + 0.3 * st.trust / 0.75)) {
      st.repeats.push({ day: S.day + rng.int(r.d[0], r.d[1]), value: value * r.f });
    }
  };

  // Tagesabschluss: Wiederkäufe, Gebühren, Dark-Pattern-Folgen, Rückkehrer
  P.daily = function (S, ctx, rng) {
    const st = P.state(S), ps = ctx.psy;
    let rep = 0, n = 0;
    st.repeats = st.repeats.filter((x) => { if (x.day <= S.day) { rep += x.value; n++; return false; } return true; });
    if (st.repeats.length > 20000) st.repeats.splice(0, st.repeats.length - 20000);
    if (rep) { ctx.revenue += rep; ctx.repeatRev = rep; ctx.realConv += n; }
    st.repeatToday = rep;
    const fee = (ctx.revenue || 0) * ps.fee + ps.month / 30.4;
    S._otherCosts = (S._otherCosts || 0) + fee;
    // Dark Patterns zehren am Vertrauen; Abmahnrisiko
    const darkOn = P.CRO.filter((c) => (c.dark || c.legal) && st.cro[c.id]);
    const urgentAds = S.ads.filter((a) => a.status === 'enabled' && P.analyze(a).includes('urgency') && S.day - (a.created || 0) > 30);
    if (darkOn.some((c) => c.dark) || urgentAds.length) { st.darkDays++; st.trust = Math.max(0.3, st.trust - 0.0015); } else st.trust = Math.min(0.85, st.trust + 0.001);
    const risk = darkOn.length * 0.004 + urgentAds.length * 0.0015 + (st.cro.strike ? 0.004 : 0);
    if (risk && rng() < risk) {
      const what = st.cro.strike && rng() < 0.5 ? 'Streichpreise ohne 30-Tage-Tiefstpreis (PAngV)' : 'irreführende Verknappung / unechter Social Proof (UWG)';
      S._otherCosts += 2400;
      st.rating = Math.max(1, st.rating - 0.05); st.trust = Math.max(0.3, st.trust - 0.05);
      S.market.log.unshift({ day: S.day, name: 'Abmahnung erhalten', desc: `Ein Wettbewerbsverband mahnt ${what} ab. Anwalts- und Vertragsstrafkosten: 2.400 €.`, sev: 'crit' });
      S.alerts.unshift({ day: S.day, level: 'bad', text: '⚖️ Abmahnung: ' + what + ' (2.400 €)' });
      if (S.goals && G.GOALS) G.GOALS.changeTrust(S, -6, 'Abmahnung');
      S._pauseRequest = S._pauseRequest || 'Abmahnung';
    }
    // Rückkehrer: Wer per Anzeige kam, sucht später oft direkt nach der Marke
    const vis = G.M.listSize(S, 'visitors');
    st.halo = vis * 0.05; // zusätzliche Markensuchen pro Monat
  };
})();
