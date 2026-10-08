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
  };

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
  GL.daily = function (S) {
    if (!S.goals) GL.init(S);
    const g = S.goals, date = M.today(S), prevDay = S.day - 1;
    // Monatsabschluss (Controlling)
    if (date.getUTCDate() === 1 && prevDay >= 0) {
      const pd = U.addDays(date, -1);
      const ms = prevDay - (pd.getUTCDate() - 1);
      const spend = E.sumRange(S, 'acct', 'all', Math.max(0, ms), prevDay)[E.I.cost];
      const ratio = spend / g.monthBudget;
      const rec = { month: U.MONTHS[pd.getUTCMonth()] + ' ' + pd.getUTCFullYear(), budget: g.monthBudget, spend };
      g.months.unshift(rec);
      if (ratio > 1.05) {
        const cut = Math.round((spend - g.monthBudget) / 100) * 100;
        g.penalty += 5;
        g.monthBudget = Math.max(1000, g.monthBudget - cut);
        S.alerts.unshift({ day: S.day, level: 'bad', text: `Controlling: Werbebudget im ${rec.month} um ${U.fmt.pct(ratio - 1, 0)} überschritten. Die Überschreitung wird vom Budget des Folgemonats abgezogen (${U.fmt.eur0(g.monthBudget)}).` });
        S._pauseRequest = S._pauseRequest || 'Budgetüberschreitung';
      } else if (ratio < 0.7) {
        S.alerts.unshift({ day: S.day, level: 'warn', text: `Controlling: Nur ${U.fmt.pct(ratio, 0)} des Monatsbudgets genutzt. Nicht genutzte Mittel verfallen.` });
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
      if (grade === 'A') g.mult *= 1.08; // Erfolg hebt die Messlatte
      GL.setTargets(S);
    }
  };
})();
