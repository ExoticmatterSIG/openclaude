/* Ads Simulator – Marketing-Mix & Team: Mitarbeitende/Freelancer und Marketing-Aktionen außerhalb von Google Ads */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U, M = G.M, E = G.E;
  const MK = (G.MKT = {});

  // ---------- Rollen ----------
  // salary = Arbeitgeberkosten/Monat (Festanstellung), Freelancer: 45 % der Kosten bei 55 % Wirkung
  MK.ROLES = {
    creative: { name: 'Creative-Designer/in', icon: '🎨', salary: 4600, onboard: 14, desc: 'Frischt Bild-, Video- und Anzeigen-Creatives laufend auf (weniger Creative-Ermüdung) und verbessert selbst umgesetzte Marketing-Aktionen.', bad: 'Schwache Creatives senken die Klickrate und machen Aktionen riskanter.' },
    copy: { name: 'Texter/in (Performance)', icon: '✍️', salary: 4000, onboard: 10, desc: 'Optimiert Anzeigentexte laufend: höhere Klickrate in allen Kampagnen, bessere Aktionsbotschaften.', bad: 'Schlechte Texte senken die Klickrate leicht.' },
    analyst: { name: 'Web-Analyst/in', icon: '📏', salary: 5200, onboard: 14, desc: 'Überwacht das Tracking: Ausfälle werden binnen eines Tages behoben, erweiterte Conversions und Consent Mode werden sauber eingerichtet.', bad: 'Ein schwacher Analyst bemerkt Ausfälle später.' },
    dev: { name: 'Web-Entwickler/in (CRO)', icon: '🛠️', salary: 5800, onboard: 21, desc: 'Macht Landingpages schneller und mobilfreundlicher und hebt die Conversion-Rate. Server halten Lastspitzen besser aus.', bad: 'Fehlerhafte Releases können die Conversion-Rate kurzzeitig senken.' },
    social: { name: 'Social-Media-Manager/in', icon: '📱', salary: 4100, onboard: 14, desc: 'Baut Markenbekanntheit auf: mehr Markensuchen, die günstig konvertieren.', bad: 'Unprofessionelle Posts können einen kleinen Shitstorm auslösen.', notBank: false },
    sea: { name: 'Werkstudent/in SEA', icon: '🎓', salary: 1600, onboard: 7, desc: 'Pflegt wöchentlich ausschließende Keywords aus dem Suchbegriffbericht.', bad: 'Unerfahrene schließen manchmal gute Suchbegriffe aus.' },
    agency: { name: 'Performance-Agentur (Retainer)', icon: '🏢', salary: 5000, onboard: 7, agency: true, desc: 'Setzt jeden Monat die wichtigsten Empfehlungen um. Gute Agenturen filtern Budgeterhöhungen gegen Ihre Vorgaben, schwache übernehmen alles.', bad: 'Schwache Agenturen setzen auch Budgeterhöhungen um – gegen Ihre Vorgaben.' },
  };
  const NAMES = ['Lena', 'Jonas', 'Mira', 'Tim', 'Sara', 'Paul', 'Elif', 'Noah', 'Anna', 'Luca', 'Hanna', 'Ben', 'Aylin', 'Felix', 'Clara', 'Max', 'Nora', 'Emil'];
  const SUR = ['Wagner', 'Krüger', 'Yilmaz', 'Hoffmann', 'Schulz', 'Novak', 'Richter', 'Becker', 'Lorenz', 'Fischer', 'Kaya', 'Brandt'];
  const AGENCIES = ['Klickwerk', 'Searchlabs', 'Rankstar Media', 'Performance Pilots', 'Adhero', 'Conversion Crew'];

  // ---------- Marketing-Aktionen ----------
  // cost = Faktor × Monatsbudget Google Ads; dur = Laufzeit; tail = Nachwirkung (Tage); fit = Branchen-Passung
  MK.TYPES = {
    tv: { name: 'TV-/CTV-Spot', icon: '📺', cost: 2.6, dur: 21, tail: 21, risk: 0.05, brand: 0.6, gen: 0.06, aware: 0.02, disaster: 'shitstorm', fit: { fashion: 0.9, saas: 0.45, local: 0.35, travel: 1, insurance: 0.9, fitness: 0.8, vwbank: 0.55 }, desc: 'Große Reichweite: Marken- und Gattungssuchen steigen. Gattungseffekte helfen auch der Konkurrenz.' },
    radio: { name: 'Radio-Spot (regional)', icon: '📻', cost: 0.9, dur: 14, tail: 10, risk: 0.03, brand: 0.35, gen: 0.03, aware: 0.008, disaster: 'shitstorm', fit: { fashion: 0.6, saas: 0.3, local: 1, travel: 0.7, insurance: 0.7, fitness: 0.9, vwbank: 0.45 }, desc: 'Gut für regionale Anbieter; günstiger als TV.' },
    influencer: { name: 'Influencer-Kooperation', icon: '🤳', cost: 0.75, dur: 10, tail: 7, risk: 0.12, brand: 1.0, gen: 0.05, aware: 0.01, cvr: 0.92, disaster: 'schleichwerbung', fit: { fashion: 1, saas: 0.55, local: 0.4, travel: 0.9, insurance: 0.3, fitness: 1, vwbank: 0.25 }, desc: 'Kurze, starke Spitze bei Markensuchen – viele Neugierige. Risiko: Fake-Follower, fehlende Werbekennzeichnung.' },
    ooh: { name: 'Plakate / Out-of-Home', icon: '🪧', cost: 1.1, dur: 28, tail: 14, risk: 0.02, brand: 0.3, gen: 0.02, aware: 0.012, disaster: 'shitstorm', fit: { fashion: 0.7, saas: 0.3, local: 0.9, travel: 0.7, insurance: 0.6, fitness: 0.9, vwbank: 0.5 }, desc: 'Langsamer Aufbau von Bekanntheit, geringes Risiko.' },
    event: { name: 'Messe / Kundenevent', icon: '🎪', cost: 0.85, dur: 5, tail: 25, risk: 0.03, brand: 0.25, gen: 0, aware: 0.005, cvr: 1.08, disaster: 'noshow', fit: { fashion: 0.4, saas: 1, local: 0.6, travel: 0.6, insurance: 0.8, fitness: 0.5, vwbank: 1 }, desc: 'Persönliche Kontakte: Markensuchen und Abschlussquote steigen, vor allem im B2B.' },
    crm: { name: 'Newsletter-/CRM-Kampagne', icon: '📧', cost: 0.22, dur: 7, tail: 7, risk: 0.04, brand: 0.15, gen: 0, aware: 0, cvr: 1.05, disaster: 'dsgvo', fit: { fashion: 1, saas: 0.8, local: 0.5, travel: 0.9, insurance: 0.6, fitness: 0.9, vwbank: 0.7 }, desc: 'Günstig: aktiviert Bestandskunden. Voraussetzung: saubere Einwilligungen (DSGVO).' },
    pr: { name: 'PR & Pressearbeit', icon: '📰', cost: 0.45, dur: 30, tail: 20, risk: 0.02, brand: 0.15, gen: 0, aware: 0.006, trust: 0.02, disaster: 'shitstorm', fit: { fashion: 0.6, saas: 0.8, local: 0.7, travel: 0.7, insurance: 0.9, fitness: 0.6, vwbank: 1 }, desc: 'Stärkt Vertrauen und Bekanntheit langsam, wenig Risiko.' },
    sale: { name: 'Rabatt-Event / Sale', icon: '🏷️', cost: 0.15, dur: 7, tail: 0, risk: 0.05, brand: 0.4, gen: 0, aware: 0, cvr: 1.32, aov: 0.86, hangover: 21, disaster: 'pangv', fit: { fashion: 1, saas: 0.7, local: 0.4, travel: 0.9, insurance: 0.2, fitness: 0.9, vwbank: 0 }, desc: 'Mehr Abschlüsse zu geringeren Preisen. Danach warten Kunden auf den nächsten Rabatt.' },
    contest: { name: 'Gewinnspiel / Social-Aktion', icon: '🎁', cost: 0.32, dur: 14, tail: 5, risk: 0.12, brand: 0.5, gen: 0, aware: 0.006, cvr: 0.9, disaster: 'teilnahme', fit: { fashion: 0.9, saas: 0.4, local: 0.7, travel: 0.8, insurance: 0.3, fitness: 0.9, vwbank: 0.2 }, desc: 'Viel Aufmerksamkeit, aber oft geringe Kaufabsicht. Teilnahmebedingungen müssen stimmen.' },
    sponsor: { name: 'Sponsoring (Verein/Event)', icon: '🏟️', cost: 0.8, dur: 60, tail: 30, risk: 0.04, brand: 0.12, gen: 0, aware: 0.01, trust: 0.01, disaster: 'shitstorm', fit: { fashion: 0.6, saas: 0.3, local: 1, travel: 0.5, insurance: 0.7, fitness: 1, vwbank: 0.7 }, desc: 'Langfristige regionale Sichtbarkeit und Sympathie.' },
    verband: { name: 'Kooperation mit Verbänden/Steuerberatern', icon: '🤝', cost: 1.0, dur: 45, tail: 30, risk: 0.02, brand: 0.3, gen: 0, aware: 0.004, cvr: 1.1, disaster: 'noshow', fit: { fashion: 0, saas: 0.6, local: 0.3, travel: 0, insurance: 0.7, fitness: 0, vwbank: 1 }, desc: 'Empfehlungen über Multiplikatoren – passt vor allem zu B2B-Finanzprodukten.' },
  };
  MK.SIZES = { S: { name: 'Klein', f: 0.5, lift: 1 }, M: { name: 'Mittel', f: 1.2, lift: 2 }, L: { name: 'Groß', f: 3, lift: 3.5 } };
  MK.EXEC = {
    inhouse: { name: 'Selbst umsetzen (Team)', costF: 1, q: 0 },
    agency: { name: 'Agentur', costF: 1.2, q: 0.2 },
    top: { name: 'Top-Agentur', costF: 1.45, q: 0.34 },
  };
  const DISASTERS = {
    shitstorm: { name: 'Shitstorm nach Marketing-Aktion', desc: 'Die Botschaft kam schlecht an: Kritik in sozialen Medien, Markensuchen und Vertrauen sinken.', fine: 0 },
    schleichwerbung: { name: 'Abmahnung: Influencer-Post nicht als Werbung gekennzeichnet', desc: 'Schleichwerbung (UWG): Abmahnkosten und ein Imageschaden.', fine: 2600 },
    pangv: { name: 'Abmahnung: Streichpreise falsch angegeben', desc: 'Die Streichpreise bezogen sich nicht auf den niedrigsten Preis der letzten 30 Tage (PAngV).', fine: 2400 },
    teilnahme: { name: 'Abmahnung: Gewinnspiel ohne gültige Teilnahmebedingungen', desc: 'Fehlende Teilnahmebedingungen und Kopplung an einen Kauf – Abmahnung durch einen Verband.', fine: 1800 },
    dsgvo: { name: 'Beschwerde: Newsletter ohne gültige Einwilligung', desc: 'Empfänger ohne Double-Opt-in angeschrieben – Beschwerden bei der Datenschutzbehörde, viele Abmeldungen.', fine: 1500 },
    noshow: { name: 'Event-Flop: kaum Besucher', desc: 'Das Event war schlecht beworben und kaum besucht – die Kosten sind weitgehend verloren.', fine: 0 },
  };

  MK.state = function (S) {
    if (!S.mkt) S.mkt = { staff: [], cands: null, actions: [], spent: 0, nid: 1, adhoc: [] };
    return S.mkt;
  };
  MK.scale = function (S) { return S.goals ? S.goals.monthBudget : (M.STARTER_BUDGET[S.ind] || 100) * 30.4; };
  const nid = (st, p) => p + st.nid++;
  const rngFor = (S, salt) => U.makeRng(((S.seed >>> 0) ^ (S.day * 2654435761) ^ salt) >>> 0);
  const active = (S) => MK.state(S).staff.filter((x) => x.status === 'active');
  MK.has = (S, role) => active(S).find((x) => x.role === role) || null;
  // Wirkung eines Teammitglieds (0…1 Ramp-up × Freelancer-Anteil), Qualität skill 1–5
  const power = (S, p) => U.clamp((S.day - p.start) / Math.max(1, MK.ROLES[p.role].onboard), 0, 1) * (p.mode === 'free' ? 0.55 : 1);
  MK.monthlyStaff = (S) => U.sum(active(S), (p) => p.cost);
  MK.dailyStaff = (S) => MK.monthlyStaff(S) / 30.4;

  // ---------- Kandidaten & Einstellungen ----------
  MK.candidates = function (S, role, mode) {
    const r = rngFor(S, role.length * 97 + (mode === 'free' ? 7 : 3));
    const R = MK.ROLES[role];
    const n = R.agency ? 3 : 3;
    const out = [];
    for (let i = 0; i < n; i++) {
      const skill = U.clamp(Math.round(r.range(1, 5.4)), 1, 5);
      const seen = U.clamp(skill + r.pick([-1, 0, 0, 0, 1, 1]), 1, 5); // Eindruck im Gespräch – nicht immer zutreffend
      const pay = R.salary * (0.82 + 0.1 * skill + r.range(-0.08, 0.08)) * (mode === 'free' ? 0.45 : 1);
      const name = R.agency ? r.pick(AGENCIES) : `${r.pick(NAMES)} ${r.pick(SUR)}`;
      const notes = [];
      if (seen - skill >= 1) notes.push('überzeugt im Gespräch');
      if (skill >= 4) notes.push(r.pick(['starke Referenzen', 'Portfolio mit messbaren Erfolgen', 'Erfahrung in Ihrer Branche']));
      if (skill <= 2) notes.push(r.pick(['wenig Praxiserfahrung', 'Referenzen schwer prüfbar', 'häufige Jobwechsel']));
      out.push({ id: 'cd' + i, role, mode, name, skill, seen, cost: Math.round(pay / 10) * 10, notes });
    }
    return out;
  };
  MK.hireCheck = function (S, cost) {
    const g = S.goals;
    if (S.company.cash < cost) return 'Nicht genug Geld in der Kasse für den ersten Monat.';
    if (g && g.trust < 35) return 'Einstellungsstopp: Die Geschäftsleitung genehmigt bei Ihrem aktuellen Vertrauen keine neuen Personalkosten.';
    if (g && g.sanction >= 2) return 'Während der Sanktion genehmigt die Geschäftsleitung keine neuen Stellen.';
    return null;
  };
  MK.hire = function (S, c) {
    const st = MK.state(S);
    const err = MK.hireCheck(S, c.cost);
    if (err) return err;
    if (active(S).some((p) => p.role === c.role)) return 'Diese Rolle ist bereits besetzt.';
    const fee = c.mode === 'free' || MK.ROLES[c.role].agency ? 0 : Math.round(MK.ROLES[c.role].salary * 0.25);
    S._otherCosts = (S._otherCosts || 0) + fee;
    st.staff.push({ id: nid(st, 'em'), role: c.role, mode: c.mode, name: c.name, skill: c.skill, seen: c.seen, cost: c.cost, start: S.day, status: 'active', revealed: false });
    M.log(S, 'Team', MK.ROLES[c.role].name, `${c.name} eingestellt (${c.mode === 'free' ? 'Freelancer' : MK.ROLES[c.role].agency ? 'Retainer' : 'Festanstellung'}, ${U.fmt.eur0(c.cost)}/Monat${fee ? ', Recruiting ' + U.fmt.eur0(fee) : ''})`);
    return true;
  };
  MK.fire = function (S, id) {
    const st = MK.state(S), p = st.staff.find((x) => x.id === id);
    if (!p || p.status !== 'active') return 0;
    const probation = S.day - p.start < 90 || p.mode === 'free' || MK.ROLES[p.role].agency;
    const sev = Math.round(probation ? p.cost * 0.5 : p.cost * 1.5);
    S._otherCosts = (S._otherCosts || 0) + sev;
    p.status = 'left'; p.end = S.day;
    M.log(S, 'Team', MK.ROLES[p.role].name, `${p.name} – Zusammenarbeit beendet (${probation ? 'Probezeit/Kündigungsfrist' : 'Kündigungsfrist & Abfindung'}: ${U.fmt.eur0(sev)})`);
    return sev;
  };

  // ---------- Aktionen planen ----------
  MK.available = (S) => Object.entries(MK.TYPES).filter(([, t]) => (t.fit[S.ind] ?? 0.5) > 0).map(([id, t]) => ({ id, ...t }));
  MK.teamBonus = function (S) {
    const cr = MK.has(S, 'creative'), cp = MK.has(S, 'copy');
    const sk = (p) => (p ? ((p.skill - 2.5) / 2.5) * power(S, p) : 0);
    return { inhouse: (cr ? 0.12 + 0.08 * sk(cr) : -0.08) + (cp ? 0.06 + 0.05 * sk(cp) : -0.04), all: 0.04 * sk(cr) + 0.03 * sk(cp) };
  };
  MK.timing = function (S, start, dur) {
    const ind = M.ind(S), d0 = U.dayToDate(S.startDate, S.day), mid = U.addDays(U.dayToDate(S.startDate, start), Math.round(dur / 2));
    const r = U.seasonAt(ind.season, mid) / U.seasonAt(ind.season, d0);
    return { rel: r, q: U.clamp((U.seasonAt(ind.season, mid) - 1) * 0.35, -0.08, 0.08) };
  };
  MK.plan = function (S, o) {
    const t = MK.TYPES[o.type], sz = MK.SIZES[o.size], ex = MK.EXEC[o.exec];
    const cost = Math.round((t.cost * sz.f * ex.costF * MK.scale(S)) / 100) * 100;
    const fit = t.fit[S.ind] ?? 0.5;
    const tb = MK.teamBonus(S);
    const start = S.day + (o.delay || 0);
    const tm = MK.timing(S, start, t.dur);
    const qExp = U.clamp(0.32 + ex.q + (o.exec === 'inhouse' ? tb.inhouse : 0) + tb.all + fit * 0.22 + tm.q, 0.05, 0.95);
    const risk = U.clamp(t.risk * Math.pow(1.5 - qExp, 2), 0.004, 0.5);
    const liftExp = sz.lift * fit * (0.25 + 1.1 * qExp) * t.brand;
    const g = S.goals;
    const needOk = g && cost > g.monthBudget * 0.8;
    return { cost, fit, qExp, qLo: U.clamp(qExp - 0.15, 0, 1), qHi: U.clamp(qExp + 0.15, 0, 1), risk, liftExp, start, tm, needOk, tb };
  };
  MK.approve = function (S, cost) {
    const g = S.goals;
    if (!g || cost <= g.monthBudget * 0.8) return { ok: true };
    const spar = g.events && g.events.some((e) => e.name === 'Sparrunde' && S.day - e.day <= 45);
    if (spar) return { ok: false, why: 'Abgelehnt: Während der Sparrunde genehmigt die Geschäftsleitung keine großen Marketingausgaben.' };
    if (g.trust < 50) return { ok: false, why: `Abgelehnt: Für Ausgaben über ${U.fmt.eur0(g.monthBudget * 0.8)} braucht es ein Vertrauen von mindestens 50 (aktuell ${Math.round(g.trust)}).` };
    if (g.sanction >= 1) return { ok: false, why: 'Abgelehnt: Unter Verwarnung genehmigt die Geschäftsleitung keine großen Projekte.' };
    return { ok: true, note: 'Von der Geschäftsleitung freigegeben.' };
  };
  MK.launch = function (S, o) {
    const st = MK.state(S), t = MK.TYPES[o.type], p = MK.plan(S, o);
    if (S.company.cash < p.cost) return 'Nicht genug Geld in der Kasse.';
    const ap = MK.approve(S, p.cost);
    if (!ap.ok) return ap.why;
    const r = rngFor(S, 911 + st.nid * 13);
    const q = U.clamp(p.qExp + r.normal() * 0.1, 0.02, 0.98);
    const lift = MK.SIZES[o.size].lift * p.fit * (0.25 + 1.1 * q) * r.logn(0.25);
    const disaster = r() < U.clamp(t.risk * Math.pow(1.5 - q, 2), 0.004, 0.5) ? Math.round(p.start + r.range(0.2, 0.8) * t.dur) : null;
    const baseRev = U.avg(Array.from({ length: 14 }, (_, i) => (S.pnl[S.day - 1 - i] ? S.pnl[S.day - 1 - i].rev : 0)), (x) => x);
    const baseBrand = U.sum(S.queries.filter((x) => x.brand === 'player'), (x) => x.vol);
    S._otherCosts = (S._otherCosts || 0) + p.cost;
    st.spent += p.cost;
    const a = { id: nid(st, 'ma'), type: o.type, size: o.size, exec: o.exec, cost: p.cost, start: p.start, end: p.start + t.dur - 1, tailEnd: p.start + t.dur - 1 + t.tail, q, lift, disaster, disasterDone: false, qExp: p.qExp, baseRev, baseBrand, aware0: S.company.awareness, rev: 0, days: 0, status: 'planned', report: null, overload: false };
    st.actions.unshift(a);
    M.log(S, 'Marketing', t.name, `${MK.SIZES[o.size].name}, ${MK.EXEC[o.exec].name}: ${U.fmt.eur0(p.cost)}${ap.note ? ' · ' + ap.note : ''}`);
    return true;
  };
  // Wirkungsverlauf: schneller Anstieg, Plateau, Nachwirkung
  MK.curve = function (a, day) {
    const t = MK.TYPES[a.type];
    if (day < a.start || day > a.tailEnd) return 0;
    const i = day - a.start, dur = t.dur;
    if (i < dur) { const up = Math.max(1, Math.round(dur * 0.2)); return i < up ? (i + 1) / up : 1 - 0.25 * ((i - up) / Math.max(1, dur - up)); }
    return 0.75 * (1 - (i - dur) / Math.max(1, t.tail));
  };

  // ---------- Effekte auf den Markt (aus computeFx) ----------
  MK.fx = function (S, fx, mul) {
    const st = S.mkt;
    if (!st) return;
    const day = S.day;
    for (const p of st.staff) {
      if (p.status !== 'active') continue;
      const w = power(S, p), s = p.skill;
      if (p.role === 'copy') fx.ctr *= 1 + (s - 2) * 0.012 * w;
      if (p.role === 'creative') fx.ctr *= 1 + (s - 2.5) * 0.005 * w;
      if (p.role === 'dev') fx.playerCvr *= 1 + (s - 2) * 0.01 * w;
      if (p.role === 'social') fx.brandVol *= 1 + (s - 1.5) * 0.04 * w;
    }
    for (const a of st.actions) {
      const c = MK.curve(a, day);
      if (c > 0) {
        const t = MK.TYPES[a.type];
        fx.brandVol *= 1 + t.brand * a.lift * c;
        if (t.gen) for (const th of M.ind(S).themes) mul(fx.themeDemand, th.id, 1 + t.gen * a.lift * c);
        if (t.cvr && day <= a.end) fx.playerCvr *= 1 + (t.cvr - 1) * Math.min(1.5, 0.6 + a.q) * (t.cvr > 1 ? Math.min(2, a.lift / 2 + 0.5) : 1) * c;
        if (t.aov && day <= a.end) fx.aov *= t.aov;
      }
      if (a.type === 'sale' && day > a.end && day <= a.end + MK.TYPES.sale.hangover) fx.playerCvr *= 0.94; // Rabattgewöhnung
    }
    for (const x of st.adhoc || []) if (day >= x.start && day <= x.end) { fx.brandVol *= x.brand || 1; fx.playerCvr *= x.cvr || 1; }
  };

  // ---------- Täglich (vor dem Tagesabschluss) ----------
  MK.daily = function (S, rng, ctx) {
    const st = S.mkt;
    if (!st) return;
    const day = S.day;
    // Personalkosten
    S._otherCosts = (S._otherCosts || 0) + MK.dailyStaff(S);
    for (const p of st.staff) {
      if (p.status !== 'active') continue;
      const w = power(S, p), R = MK.ROLES[p.role];
      if (!p.revealed && day - p.start >= 30) { p.revealed = true; S.alerts.unshift({ day, level: p.skill <= 2 ? 'bad' : p.skill >= 4 ? 'good' : 'info', text: `Team: Nach 30 Tagen zeigt sich – ${p.name} (${R.name}) leistet ${['', 'schwach', 'unterdurchschnittlich', 'solide', 'stark', 'herausragend'][p.skill]}.` }); }
      if (w <= 0) continue;
      if (p.role === 'creative') for (const ad of S.ads) if (ad.status === 'enabled' && ad.fat) ad.fat *= 1 - (ad.type === 'rsa' ? 0.004 : 0.012) * (p.skill / 3) * w;
      if (p.role === 'analyst') {
        if (!S.account.trackingOk && rng() < (0.35 + 0.15 * p.skill) * w) { S.account.trackingOk = true; for (const e of S.market.events) if (e.def === 'tracking' && !e.done) { e.end = day - 1; e.done = true; } S.alerts.unshift({ day, level: 'good', text: `Team: ${p.name} hat den Tracking-Ausfall entdeckt und behoben.` }); M.log(S, 'Team', 'Web-Analyse', 'Tracking repariert'); }
        if (w >= 1 && p.skill >= 3 && !S.account.enhancedConv) { S.account.enhancedConv = true; M.log(S, 'Team', 'Web-Analyse', 'Erweiterte Conversions eingerichtet'); }
        if (w >= 1 && p.skill >= 3 && S.account.consentMode !== 'advanced') { S.account.consentMode = 'advanced'; M.log(S, 'Team', 'Web-Analyse', 'Consent Mode (erweitert) eingerichtet'); }
      }
      if (p.role === 'dev') {
        for (const ag of S.adGroups) if (ag.lp) { ag.lp.speed = Math.min(60 + p.skill * 7, ag.lp.speed + 0.08 * p.skill * w); if (p.skill >= 3 && w >= 1) ag.lp.mobile = true; }
        if (p.skill <= 2 && rng() < 0.004) { st.adhoc.push({ start: day, end: day + 2, cvr: 0.8 }); S.alerts.unshift({ day, level: 'bad', text: `Team: Ein fehlerhaftes Website-Release von ${p.name} senkt die Conversion-Rate für drei Tage.` }); }
      }
      if (p.role === 'social') {
        S.company.awareness = Math.min(0.6, S.company.awareness + 0.00012 * p.skill * w);
        if (p.skill <= 2 && rng() < 0.0025) disasterNow(S, { type: 'social' }, 'shitstorm', 0.6);
      }
      if (p.role === 'sea' && (day - p.start) % 7 === 6) seaHousekeeping(S, p, rng);
      if (p.role === 'agency' && (day - p.start) % 30 === 29 && G.R) agencyMonth(S, p);
    }
    // Aktionen
    for (const a of st.actions) {
      const t = MK.TYPES[a.type];
      if (a.status === 'planned' && day >= a.start) { a.status = 'running'; S.market.log.unshift({ day, name: 'Marketing: ' + t.name + ' startet', desc: `${MK.SIZES[a.size].name}e Aktion, ${MK.EXEC[a.exec].name}. Erwarten Sie mehr Markensuchen – Budget der Markenkampagne prüfen.`, sev: 'info' }); }
      const c = MK.curve(a, day);
      if (c > 0) {
        a.days++;
        if (t.aware) S.company.awareness = Math.min(0.6, S.company.awareness + (t.aware * a.lift * c) / (t.dur * 0.6));
        if (t.trust && S.psy) S.psy.trust = Math.min(0.9, S.psy.trust + (t.trust * a.lift * c) / t.dur);
        // Lastspitze: Server-Überlast ohne Entwickler/in
        const peak = t.brand * a.lift * c;
        if (!a.overload && peak > 2.2 && rng() < 0.08 * (MK.has(S, 'dev') ? 0.3 : 1)) {
          a.overload = true;
          const def = G.D.RANDOM_EVENTS.find((d) => d.id === 'lp_down');
          S.market.events.push({ id: M.nid(S, 'ev'), def: 'lp_down', sev: 'crit', start: day, end: day, fixable: def ? def.fixable : { label: 'Notfall-Hosting-Support beauftragen', cost: 400 }, name: 'Server-Überlast durch Marketing-Aktion', desc: 'Der Ansturm nach Ihrer Aktion legt die Website lahm. Klicks werden bezahlt, konvertieren aber nicht.' });
          S.market.log.unshift({ day, name: 'Server-Überlast durch Marketing-Aktion', desc: 'Website nicht erreichbar – Ansturm nach der Aktion.', sev: 'crit' });
          S._pauseRequest = S._pauseRequest || 'Server-Überlast';
        }
      }
      if (a.disaster && !a.disasterDone && day >= a.disaster) { a.disasterDone = true; disasterNow(S, a, t.disaster, 1); }
      if (day >= a.start && day <= a.tailEnd && S.pnl[day - 1]) a.rev += S.pnl[day - 1].rev;
      if (a.status !== 'done' && day > a.tailEnd) { a.status = 'done'; a.report = report(S, a); S.alerts.unshift({ day, level: a.report.roi >= 0 ? 'good' : 'warn', text: `Marketing-Auswertung „${t.name}": ${a.report.verdict}` }); }
    }
    st.adhoc = (st.adhoc || []).filter((x) => x.end >= day - 1);
  };
  function disasterNow(S, a, kind, scale) {
    const st = MK.state(S), D = DISASTERS[kind], day = S.day;
    if (kind === 'noshow') { a.lift *= 0.25; S.market.log.unshift({ day, name: D.name, desc: D.desc, sev: 'warn' }); S.alerts.unshift({ day, level: 'bad', text: '📉 ' + D.name }); a.flop = true; return; }
    st.adhoc.push({ start: day, end: day + 14, brand: 1 - 0.3 * scale, cvr: 1 - 0.15 * scale, kind });
    if (S.psy) { S.psy.trust = Math.max(0.3, S.psy.trust - 0.08 * scale); S.psy.rating = Math.max(1, S.psy.rating - 0.15 * scale); }
    if (D.fine) S._otherCosts = (S._otherCosts || 0) + D.fine;
    if (S.goals && G.GOALS.changeTrust) G.GOALS.changeTrust(S, -5 * scale, D.name);
    if (a.id) { a.lift *= 0.5; a.hit = kind; }
    S.market.log.unshift({ day, name: '🔥 ' + D.name, desc: D.desc + (D.fine ? ` Kosten: ${U.fmt.eur0(D.fine)}.` : ''), sev: 'crit', mkt: kind });
    S.alerts.unshift({ day, level: 'bad', text: '🔥 ' + D.name });
    S._pauseRequest = S._pauseRequest || D.name;
  }
  MK.DISASTERS = DISASTERS;
  function report(S, a) {
    const t = MK.TYPES[a.type], days = a.tailEnd - a.start + 1;
    const incr = a.rev - a.baseRev * days; // grobe Inkrementalität: Umsatz ggü. Vorperiode
    const mg = M.ind(S).margin || 0.3;
    const gp = incr * mg, roi = gp - a.cost;
    const peakBrand = t.brand * a.lift;
    const verdict = a.hit ? `Rückschlag (${DISASTERS[a.hit].name}). ` : a.flop ? 'Flop. ' : '';
    const dAw = S.company.awareness - (a.aware0 ?? S.company.awareness);
    const awTxt = !S.bank && dAw > 0.003 ? ` Markenbekanntheit +${(dAw * 100).toFixed(1)} Punkte (wirkt langfristig weiter, nicht eingerechnet).` : '';
    return { incr, gp, roi, peakBrand, dAw, q: a.q, verdict: verdict + (S.bank ? `Markensuchen in der Spitze ca. +${Math.round(peakBrand * 100)} %.` : `geschätzter Mehrumsatz ${U.fmt.eur0(incr)}, Deckungsbeitrag ${U.fmt.eur0(gp)} bei ${U.fmt.eur0(a.cost)} Kosten → ${roi >= 0 ? 'lohnend' : 'im Zeitraum nicht lohnend'} (${U.fmt.eur0(roi)}).${awTxt}`) };
  }
  // Werkstudent/in: wöchentliche Pflege ausschließender Keywords
  function seaHousekeeping(S, p, rng) {
    const camps = S.campaigns.filter((c) => c.type === 'search' && c.status === 'enabled');
    const bad = ['kostenlos', 'jobs', 'gebraucht', 'wasist', 'anleitung', 'erfahrungen'];
    let added = 0;
    for (const c of camps) {
      const negs = M.campaignNegatives(S, c.id).map((n) => n.text);
      for (const q of S.queries) {
        if (!bad.includes(q.mod) || added >= 2 + p.skill) continue;
        const w = q.text.replace(q.kw, '').trim().split(/\s+/)[0];
        if (!w || negs.includes(w)) continue;
        if (rng() > 0.3 + 0.12 * p.skill) continue;
        S.negatives.push({ id: M.nid(S, 'ng'), text: w, match: 'phrase', campaignId: c.id }); negs.push(w); added++;
      }
      if (p.skill <= 2 && rng() < 0.25 && !negs.includes('online')) { S.negatives.push({ id: M.nid(S, 'ng'), text: 'online', match: 'phrase', campaignId: c.id }); S.alerts.unshift({ day: S.day, level: 'warn', text: `Team: ${p.name} hat „online" ausgeschlossen – damit fallen auch kaufbereite Suchen weg. Prüfen Sie die ausschließenden Keywords.` }); }
    }
    if (added) M.log(S, 'Team', 'SEA-Pflege', `${added} ausschließende Keyword(s) ergänzt`);
  }
  // Agentur: setzt monatlich Empfehlungen um – schwache auch Budgeterhöhungen
  function agencyMonth(S, p) {
    const recs = G.R.compute(S).filter((r) => r.apply && !String(r.id).startsWith('trk'));
    const spar = G.GUIDE && G.GUIDE.ctx ? G.GUIDE.ctx(S).mode === 'save' : false;
    const filtered = recs.filter((r) => p.skill >= 3 ? !/^(budget_|broad_)/.test(r.id) || (!spar && r.id.startsWith('budget_') && p.skill >= 4) : true).slice(0, 1 + p.skill);
    for (const r of filtered) G.R.apply(S, r);
    const budgetUps = filtered.filter((r) => r.id.startsWith('budget_')).length;
    S.alerts.unshift({ day: S.day, level: budgetUps && spar ? 'bad' : 'info', text: `Agentur ${p.name}: ${filtered.length} Optimierung(en) umgesetzt${budgetUps ? ` – darunter ${budgetUps} Budgeterhöhung(en)${spar ? ' trotz Sparkurs!' : ''}` : ''}.` });
    M.log(S, 'Team', 'Agentur', `${filtered.length} Empfehlungen umgesetzt`);
  }
})();
