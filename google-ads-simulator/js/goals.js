/* Ads Simulator – Zielvorgaben der Geschäftsleitung: Monatsbudget (Controlling) & Quartalsziele mit Konsequenzen */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U, M = G.M, E = G.E;
  const GL = (G.GOALS = {});

  function quarterOf(date) { return { y: date.getUTCFullYear(), q: Math.floor(date.getUTCMonth() / 3) }; }
  function quarterEnd(date) { const { y, q } = quarterOf(date); return new Date(Date.UTC(y, q * 3 + 3, 0)); }
  function dayOf(S, date) { return Math.round((date - U.parseISO(S.startDate)) / 86400000); }

  GL.init = function (S) {
    const ind = M.ind(S);
    const diff = M.DIFFICULTY[S.settings.difficulty] || M.DIFFICULTY.normal;
    const g = diff.goal || 1;
    const base = M.STARTER_BUDGET[ind.id] || 100;
    const start = M.today(S);
    let qEnd = quarterEnd(start);
    if (dayOf(S, qEnd) - S.day < 45) qEnd = quarterEnd(U.addDays(qEnd, 5)); // Rumpfquartal mit dem Folgequartal zusammenfassen
    S.goals = {
      monthBudget: Math.round((ind.bank ? 14000 : base * 30.4 * 1.6) / 100) * 100,
      periodStart: S.day, periodEnd: dayOf(S, qEnd), mult: g, history: [], months: [], failStreak: 0, penalty: 0, score: 0,
      trust: 60, sanction: 0, pip: null, mkt: 1, trustHist: [], events: [], cashNegDays: 0,
    };
    GL.setTargets(S);
  };

  GL.setTargets = function (S) {
    const ind = M.ind(S), g = S.goals, len = g.periodEnd - g.periodStart + 1, m = g.mult;
    if (ind.bank) {
      g.targets = [
        { id: 'vol', name: 'Neuvolumen Einlagen (Tages- & Festgeld)', unit: 'eur', dir: 'min', value: Math.round((12e6 * m * len) / 91 / 1e5) * 1e5 },
        { id: 'cpk', name: 'Werbekosten je 1.000 € Neuvolumen', unit: 'eur2', dir: 'max', value: +(2.5 / m).toFixed(2) },
        { id: 'rej', name: 'Anteil abgelehnter Privatkunden-Anträge', unit: 'pct', dir: 'max', value: +(0.35 / m).toFixed(2) },
        { id: 'accts', name: 'Neue Geschäftskonten & Visa-Karten', unit: 'int', dir: 'min', value: Math.round((40 * m * len) / 91) },
      ];
    } else {
      const base = M.STARTER_BUDGET[ind.id] || 100;
      const be = 1 / ind.margin;
      g.targets = [
        { id: 'profit', name: 'Marketing-Deckungsbeitrag (Rohertrag − Werbe- & Projektkosten)', unit: 'eur', dir: 'min', value: Math.round((base * len * 1.0 * m) / 100) * 100 },
        { id: 'rroas', name: 'Echter ROAS (Umsatz ÷ Werbekosten)', unit: 'num', dir: 'min', value: +(be * 1.25 * Math.sqrt(m)).toFixed(2) },
        { id: 'conv', name: 'Echte Conversions', unit: 'int', dir: 'min', value: Math.round((base / (ind.aov * ind.margin * 0.45)) * len * m) },
      ];
    }
    for (const t of g.targets) {
      // Planung auf Basis des Vorquartals: Ist + 8 % Wachstum (die Messlatte steigt mit dem Erfolg)
      const last = g.lastActual && g.lastActual[t.id];
      if (last !== undefined && last !== null && SCALABLE.has(t.id) && last > 0) t.value = Math.max(t.value, last * len * 1.08);
      t.base = t.value;
      if (SCALABLE.has(t.id)) t.value = GL.round(t.base * (g.mkt || 1));
    }
  };
  const SCALABLE = new Set(['vol', 'accts', 'profit', 'conv']);
  GL.round = (v) => (v >= 1e5 ? Math.round(v / 1e5) * 1e5 : v >= 1000 ? Math.round(v / 100) * 100 : Math.round(v));

  // Marktlage der letzten 21 Tage (Nachfrage inkl. Saison & Ereignisse) – Ziele werden daran angepasst
  GL.marketFactor = function (S) {
    const h = S.market.hist.slice(-21);
    if (!h.length) return 1;
    const ind = M.ind(S);
    const season = U.avg(h, (x) => ind.season[U.dayToDate(S.startDate, x.day).getUTCMonth()]);
    return U.clamp(U.avg(h, (x) => x.demand) * Math.pow(season, 0.7), 0.7, 1.35);
  };

  // ---------- Vertrauen der Geschäftsleitung & Sanktionen ----------
  const LEVELS = [
    { name: 'Keine', min: 50 },
    { name: 'Verwarnung', min: 35 },
    { name: 'Abmahnung & Budgetkürzung', min: 20 },
    { name: 'Bewährungsplan (45 Tage)', min: 0.0001 },
  ];
  GL.LEVELS = LEVELS;
  GL.changeTrust = function (S, delta, reason) {
    const g = S.goals; if (!g || S.gameOver) return;
    g.trust = U.clamp((g.trust ?? 60) + delta, 0, 100);
    g.trustHist.unshift({ day: S.day, delta: Math.round(delta), reason, trust: Math.round(g.trust) });
    if (g.trustHist.length > 80) g.trustHist.length = 80;
    GL.updateSanctions(S);
  };
  GL.updateSanctions = function (S) {
    const g = S.goals;
    if (g.trust <= 0) return GL.gameOver(S, 'fired', 'Die Geschäftsleitung hat das Vertrauen vollständig verloren. Sie wurden mit sofortiger Wirkung freigestellt.');
    const lvl = g.trust >= 50 ? 0 : g.trust >= 35 ? 1 : g.trust >= 20 ? 2 : 3;
    if (g.trust >= 55 && g.sanction > 0) { g.sanction = 0; g.pip = null; S.alerts.unshift({ day: S.day, level: 'good', text: 'Die Geschäftsleitung ist wieder zufrieden – alle Sanktionen aufgehoben.' }); return; }
    if (lvl <= g.sanction) return;
    g.sanction = lvl;
    const msg = {
      1: 'Verwarnung: Die Geschäftsleitung ist mit der Entwicklung unzufrieden und erwartet eine schnelle Kurskorrektur.',
      2: 'Abmahnung: Das Monatsbudget wird um 15 % gekürzt. Weitere Verfehlungen führen zu einem Bewährungsplan.',
      3: 'Bewährungsplan: Sie haben 45 Tage, um das Vertrauen auf mindestens 35 Punkte zu bringen – sonst folgt die Kündigung.',
    }[lvl];
    if (lvl === 2) g.monthBudget = Math.round((g.monthBudget * 0.85) / 100) * 100;
    if (lvl === 3) g.pip = { until: S.day + 45, start: S.day };
    S.alerts.unshift({ day: S.day, level: 'bad', text: '🧑‍💼 ' + msg });
    S.market.log.unshift({ day: S.day, name: 'Geschäftsleitung: ' + LEVELS[lvl].name, desc: msg, sev: 'crit' });
    S._pauseRequest = S._pauseRequest || LEVELS[lvl].name;
  };
  GL.gameOver = function (S, kind, text) {
    if (S.gameOver) return;
    let profit = 0; for (const p of Object.values(S.pnl)) profit += p.profit;
    S.gameOver = { kind, text, day: S.day, profit, score: S.goals ? S.goals.score : 0, quarters: S.goals ? S.goals.history.length : 0 };
    S.alerts.unshift({ day: S.day, level: 'bad', text: '⛔ Spiel beendet: ' + text });
    S._pauseRequest = 'Spiel beendet';
  };

  // ---------- Kredite ----------
  GL.creditLimit = (S) => Math.round(S.company.startCash * (S.bank ? 0.5 : 1.5));
  GL.rate = (S) => (S.bank ? 0.04 : 0.095);
  GL.borrow = function (S, amt) {
    const c = S.company, room = GL.creditLimit(S) - (c.debt || 0);
    amt = Math.min(amt, room);
    if (amt <= 0) return 0;
    c.debt = (c.debt || 0) + amt; c.cash += amt;
    M.log(S, 'Unternehmen', 'Kredit', 'Aufgenommen: ' + U.fmt.eur0(amt) + ' (' + U.fmt.pct(GL.rate(S), 1) + ' p. a.)');
    if (c.cash > 0) S.account.paymentOk = true;
    return amt;
  };
  GL.repay = function (S, amt) {
    const c = S.company;
    amt = Math.min(amt, c.debt || 0, Math.max(0, c.cash));
    if (amt <= 0) return 0;
    c.debt -= amt; c.cash -= amt;
    M.log(S, 'Unternehmen', 'Kredit', 'Getilgt: ' + U.fmt.eur0(amt));
    return amt;
  };

  // ---------- Ad-hoc-Vorgaben der Geschäftsleitung ----------
  const MGMT = [
    { id: 'spar', p: 0.004, name: 'Sparrunde', desc: 'Die Geschäftsführung verordnet eine Sparrunde: Monatsbudget −20 % ab sofort.', fx: (S, g) => { g.monthBudget = Math.round((g.monthBudget * 0.8) / 100) * 100; } },
    { id: 'push', p: 0.004, name: 'Wachstumsoffensive', desc: 'Der Vorstand will mehr Wachstum: Mengenziele +15 %, Monatsbudget +10 %.', fx: (S, g) => { g.mult *= 1.15; g.monthBudget = Math.round((g.monthBudget * 1.1) / 100) * 100; GL.setTargets(S); } },
    { id: 'audit', p: 0.003, name: 'Interne Revision prüft Ihr Reporting', desc: 'Die Revision vergleicht gemeldete Conversions mit den echten Geschäftszahlen.', fx: (S) => {
      const v = E.derive(E.sumRange(S, 'acct', 'all', S.day - 60, S.day - 1));
      const gap = 1 - U.div(v.conv, v.rconv || v.conv);
      if (gap > 0.35 || !S.account.trackingOk) GL.changeTrust(S, -8, 'Revision: große Lücke zwischen Reporting und Realität'); else GL.changeTrust(S, 4, 'Revision: sauberes Reporting');
    } },
    { id: 'newboss', p: 0.0015, name: 'Neue Geschäftsführung', desc: 'Eine neue Geschäftsführung übernimmt. Die Ziele steigen um 10 %, das Vertrauen startet neu bei 50.', fx: (S, g) => { g.mult *= 1.1; g.trust = 50; g.sanction = 0; g.pip = null; GL.setTargets(S); } },
  ];

  // Vertrauens-Update zum Monatsende anhand der zeitanteiligen Zielerreichung
  function monthlyReview(S, overspent) {
    const g = S.goals, prog = GL.progress(S);
    const elapsed = U.clamp((S.day - g.periodStart) / Math.max(1, g.periodEnd - g.periodStart + 1), 0.05, 1);
    let delta = 0;
    const notes = [];
    for (const t of g.targets) {
      const v = prog[t.id];
      const ok = t.dir === 'min' ? (v || 0) >= t.value * elapsed * 0.92 : GL.met(t, v);
      delta += ok ? 4 : -6;
      if (!ok) notes.push(t.name);
    }
    if (overspent) { delta -= 10; notes.push('Budgetüberschreitung'); }
    const debt = S.company.debt || 0;
    if (debt > GL.creditLimit(S) * 0.5) { delta -= 4; notes.push('hohe Verschuldung'); }
    GL.changeTrust(S, delta, notes.length ? 'Monatsreview – kritisch: ' + notes.join(', ') : 'Monatsreview – alle Ziele auf Kurs');
  }

  // Aktuelle Werte im Zielzeitraum
  GL.progress = function (S) {
    const g = S.goals, a = g.periodStart, b = Math.min(S.day - 1, g.periodEnd);
    const acct = E.sumRange(S, 'acct', 'all', a, b);
    const out = {};
    if (S.bank) {
      let inV = 0, apps = 0, rej = 0, accts = 0;
      for (let d = a; d <= b; d++) { const f = S.bank.flows[d]; if (f) { inV += f.inTG + f.inFG; apps += f.apps; rej += f.rejects; accts += f.nGiro + f.nVisa; } }
      out.vol = inV; out.cpk = inV ? (acct[E.I.cost] / inV) * 1000 : null; out.rej = apps ? rej / apps : null; out.accts = accts;
    } else {
      let gross = 0, ads = 0, other = 0, rev = 0, conv = 0;
      for (let d = a; d <= b; d++) { const p = S.pnl[d]; if (p) { gross += p.gross; ads += p.ads; other += p.other; rev += p.rev; conv += p.conv; } }
      const fixed = (S.company.fixedPerDay || 0) * (b - a + 1);
      out.profit = gross - ads - (other - fixed); out.rroas = ads ? rev / ads : null; out.conv = conv;
    }
    return out;
  };
  GL.met = (t, v) => v !== null && v !== undefined && (t.dir === 'min' ? v >= t.value : v <= t.value);
  GL.fmt = function (t, v) {
    const f = U.fmt;
    if (v === null || v === undefined) return '–';
    return t.unit === 'eur' ? (Math.abs(v) >= 1e6 ? f.num2(v / 1e6) + ' Mio. €' : f.eur0(v)) : t.unit === 'eur2' ? f.eur(v) : t.unit === 'pct' ? f.pct(v, 0) : t.unit === 'int' ? f.int(v) : f.num2(v);
  };
  GL.monthSpend = function (S) {
    const date = M.today(S);
    const ms = S.day - (date.getUTCDate() - 1);
    return E.sumRange(S, 'acct', 'all', ms, S.day - 1)[E.I.cost];
  };

  // Täglich nach der Simulation aufgerufen (S.day ist bereits der neue Tag)
  GL.daily = function (S, rng) {
    if (!S.goals) GL.init(S);
    if (S.gameOver) return;
    const g = S.goals, date = M.today(S), prevDay = S.day - 1;
    if (g.trust === undefined) Object.assign(g, { trust: 60, sanction: 0, pip: null, mkt: 1, trustHist: [], events: [], cashNegDays: 0 });
    let overspent = false;
    // Kreditzinsen
    const c = S.company;
    if (c.debt > 0) S._otherCosts = (S._otherCosts || 0) + (c.debt * GL.rate(S)) / 365;
    // Insolvenz: Kasse dauerhaft negativ und Kreditrahmen ausgeschöpft
    if (c.cash < 0 && (c.debt || 0) >= GL.creditLimit(S) - 1) {
      g.cashNegDays++;
      if (g.cashNegDays === 1) S.alerts.unshift({ day: S.day, level: 'bad', text: 'Liquiditätskrise: Kasse negativ und Kreditrahmen ausgeschöpft. In 30 Tagen droht die Insolvenz.' });
      if (g.cashNegDays >= 30) return GL.gameOver(S, 'insolvent', S.bank ? 'Das Marketingbudget ist aufgebraucht und der Budgetvorschuss ausgeschöpft. Der Bereich wird aufgelöst.' : 'Das Unternehmen ist zahlungsunfähig. Der Insolvenzverwalter übernimmt.');
    } else g.cashNegDays = 0;
    // Bewährungsplan
    if (g.pip && S.day >= g.pip.until) {
      if (g.trust < 35) return GL.gameOver(S, 'fired', 'Der Bewährungsplan ist abgelaufen, ohne dass das Vertrauen der Geschäftsleitung zurückgewonnen wurde. Ihnen wurde gekündigt.');
      g.pip = null; g.sanction = 1;
      S.alerts.unshift({ day: S.day, level: 'good', text: 'Bewährungsplan bestanden. Die Geschäftsleitung beobachtet Sie aber weiter genau.' });
    }
    // Ad-hoc-Vorgaben
    if (S.day > 20 && rng) for (const ev of MGMT) {
      if (rng() < ev.p * (M.DIFFICULTY[S.settings.difficulty]?.events || 1)) {
        ev.fx(S, g);
        g.events.unshift({ day: S.day, name: ev.name });
        S.market.log.unshift({ day: S.day, name: 'Geschäftsleitung: ' + ev.name, desc: ev.desc, sev: 'warn' });
        S.alerts.unshift({ day: S.day, level: 'warn', text: '🧑‍💼 ' + ev.name + ': ' + ev.desc });
        S._pauseRequest = S._pauseRequest || ev.name;
        break;
      }
    }
    // Monatsabschluss (Controlling)
    if (date.getUTCDate() === 1 && prevDay >= 0) {
      const pd = U.addDays(date, -1);
      const ms = prevDay - (pd.getUTCDate() - 1);
      const spend = E.sumRange(S, 'acct', 'all', Math.max(0, ms), prevDay)[E.I.cost];
      const ratio = spend / g.monthBudget;
      const rec = { month: U.MONTHS[pd.getUTCMonth()] + ' ' + pd.getUTCFullYear(), budget: g.monthBudget, spend };
      g.months.unshift(rec);
      if (ratio > 1.05) {
        overspent = true;
        const cut = Math.round((spend - g.monthBudget) / 100) * 100;
        g.penalty += 5;
        g.monthBudget = Math.max(1000, g.monthBudget - cut);
        S.alerts.unshift({ day: S.day, level: 'bad', text: `Controlling: Werbebudget im ${rec.month} um ${U.fmt.pct(ratio - 1, 0)} überschritten. Die Überschreitung wird vom Budget des Folgemonats abgezogen (${U.fmt.eur0(g.monthBudget)}).` });
        S._pauseRequest = S._pauseRequest || 'Budgetüberschreitung';
      } else if (ratio < 0.7) {
        S.alerts.unshift({ day: S.day, level: 'warn', text: `Controlling: Nur ${U.fmt.pct(ratio, 0)} des Monatsbudgets genutzt. Nicht genutzte Mittel verfallen.` });
      }
      if (prevDay !== g.periodEnd) monthlyReview(S, overspent);
      // Dynamische Ziele: Anpassung an die Marktlage
      const mf = GL.marketFactor(S);
      if (Math.abs(mf - g.mkt) > 0.06) {
        const old = g.mkt; g.mkt = mf;
        for (const t of g.targets) if (SCALABLE.has(t.id)) t.value = GL.round(t.base * mf);
        S.alerts.unshift({ day: S.day, level: 'info', text: `Forecast-Anpassung: Die Geschäftsleitung passt die Mengenziele an die Marktlage an (${mf > old ? '+' : ''}${Math.round((mf / old - 1) * 100)} %).` });
      }
    }
    // Quartalsbewertung
    if (prevDay === g.periodEnd) {
      const prog = GL.progress(S);
      const res = g.targets.map((t) => ({ ...t, actual: prog[t.id], met: GL.met(t, prog[t.id]) }));
      const misses = res.filter((r) => !r.met).length;
      const grade = misses === 0 ? 'A' : misses === 1 ? 'B' : misses === 2 ? 'C' : 'D';
      const pts = { A: 100, B: 70, C: 40, D: 10 }[grade] - g.penalty;
      g.score += pts;
      let consequence = '';
      if (grade === 'A') { g.monthBudget = Math.round((g.monthBudget * 1.15) / 100) * 100; g.failStreak = 0; consequence = 'Budget +15 %'; }
      else if (grade === 'B') { g.failStreak = 0; consequence = 'Budget unverändert'; }
      else { g.failStreak++; if (g.failStreak >= 2) { g.monthBudget = Math.round((g.monthBudget * 0.75) / 100) * 100; consequence = 'Zweites verfehltes Quartal in Folge: Budget −25 %'; } else consequence = 'Verwarnung durch die Geschäftsleitung'; }
      g.history.unshift({ from: g.periodStart, to: g.periodEnd, grade, pts, results: res, consequence, penalty: g.penalty });
      S.alerts.unshift({ day: S.day, level: grade <= 'B' ? 'good' : 'bad', text: `Quartalsbewertung: Note ${grade} (${misses} von ${res.length} Zielen verfehlt). ${consequence}.` });
      S._pauseRequest = S._pauseRequest || 'Quartalsbewertung';
      g.penalty = 0;
      g.periodStart = S.day;
      g.periodEnd = dayOf(S, quarterEnd(date));
      if (g.periodEnd - g.periodStart < 20) g.periodEnd = dayOf(S, quarterEnd(U.addDays(quarterEnd(date), 5)));
      const qLen = g.periodEnd - g.periodStart + 1;
      g.lastActual = Object.fromEntries(res.map((r) => [r.id, typeof r.actual === 'number' ? r.actual / qLen : null]));
      if (grade === 'A') g.mult *= 1.03; // Erfolg hebt die Messlatte
      if (grade === 'D') g.mult *= 0.95;
      GL.setTargets(S);
      GL.changeTrust(S, { A: 14, B: 5, C: -10, D: -20 }[grade] - (overspent ? 10 : 0), 'Quartalsbewertung: Note ' + grade);
    }
  };
})();
