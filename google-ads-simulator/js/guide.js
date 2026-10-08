/* Ads Simulator – Lernhilfen: ausführliche Kennzahl-Erklärungen, Ziel-ROAS/CPA-Rechner und geführte Problemhilfe (abschaltbar) */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, UI = G.UI, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc;
  const GD = (G.GUIDE = {});

  // ---------- Zweite Ebene über Modals (damit Formulare offen bleiben) ----------
  UI.sheet = function (title, html) {
    UI.closeSheet();
    const el = document.createElement('div');
    el.id = 'sheet-root';
    el.className = 'backdrop sheet';
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="mh"><h2>${title}</h2><button class="iconbtn" data-act="sheetclose" title="Schließen">✕</button></div><div class="mb">${html}</div><div class="mf"><button class="btn primary" data-act="sheetclose">Verstanden</button></div></div>`;
    el.addEventListener('click', (ev) => { if (ev.target === el) UI.closeSheet(); });
    document.body.appendChild(el);
    UI.annotate(el);
  };
  UI.closeSheet = () => { const el = document.getElementById('sheet-root'); if (el) el.remove(); };
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && document.getElementById('sheet-root')) { ev.stopImmediatePropagation(); UI.closeSheet(); } }, true);

  // ---------- Ausführliche Erklärung ----------
  const margin = () => (APP.S ? M.ind(APP.S).margin || 0 : 0);
  function liveBlock(d) {
    const S = APP.S;
    if (!S || S.day < 1) return '';
    const r = [Math.max(0, S.day - 30), S.day - 1];
    const m = UI.ext(E.derive(E.sumRange(S, 'acct', 'all', r[0], r[1])));
    const rows = [];
    if (d.key && UI.MET[d.key]) rows.push([`Ihr Konto (letzte 30 Tage): ${UI.MET[d.key].l}`, UI.MET[d.key].f(m[d.key])]);
    if (d.key === 'roas' || d.id === 'troas') rows.push(['… als Ziel-ROAS ausgedrückt', m.roas > 0 ? f.int(m.roas * 100) + ' %' : '–']);
    if (d.margin && margin() > 0) {
      rows.push(['Ihre Marge (Branche)', f.pct0(margin())]);
      rows.push(['Break-even-ROAS (1 ÷ Marge)', `${f.num2(1 / margin())} = ${f.int(100 / margin())} %`]);
    }
    if (d.id === 'tcpa' || d.id === 'cpa') {
      rows.push(['Ihr Konto: Kosten/Conv.', f.eur(m.cpa)]);
      if (m.valPerConv > 0 && margin() > 0) rows.push(['Max. CPA für Gewinn (Wert/Conv. × Marge)', f.eur(m.valPerConv * margin())]);
    }
    if (!rows.length) return '';
    return `<div class="callout good"><b>Ihre Zahlen</b><dl class="kv" style="margin-top:6px">${rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${b}</dd>`).join('')}</dl></div>`;
  }
  GD.detailHtml = function (d) {
    return `<p style="margin-top:0">${d.what}</p>
      ${d.formula && d.formula !== '–' ? `<div class="gd-sec"><b>Formel</b><div class="mono gd-formula">${d.formula}</div></div>` : ''}
      ${d.example && d.example !== '–' ? `<div class="gd-sec"><b>Beispiel</b><div>${d.example}</div></div>` : ''}
      <div class="gd-sec"><b>Wie lese ich den Wert?</b><div>${d.read}</div></div>
      ${d.levers && d.levers.length ? `<div class="gd-sec"><b>So beeinflussen Sie ihn</b><ul>${d.levers.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${liveBlock(d)}
      <div class="callout warn"><b>⚠ Unterschied zum echten Google Ads</b><br>${d.google}</div>`;
  };
  ACT.glossmore = (el, dd) => {
    const d = G.GLOSS_DETAIL.all.find((x) => x.id === dd.id);
    if (!d) return;
    UI.hideTip();
    UI.sheet('ⓘ ' + esc(d.title), GD.detailHtml(d));
  };
  ACT.sheetclose = () => UI.closeSheet();

  // ---------- Unternehmenskontext: Vorgaben der Geschäftsleitung, Budget-Spielraum, Marge, Ziele ----------
  GD.ctx = function (S) {
    const g = S.goals, GL = G.GOALS, mg = margin();
    const date = M.today(S), dim = U.daysInMonth(date), dom = date.getUTCDate(), daysLeft = dim - dom + 1;
    const ms = g && GL ? GL.monthSpend(S) : 0;
    const l7 = E.sumRange(S, 'acct', 'all', Math.max(0, S.day - 7), S.day - 1)[E.I.cost] / Math.max(1, Math.min(7, S.day));
    const budgets = S.campaigns.filter((c) => c.status === 'enabled' && !c.isTrial).reduce((a, c) => a + c.budget, 0);
    const proj = ms + l7 * daysLeft;
    const mb = g ? g.monthBudget : null;
    const r30 = [Math.max(0, S.day - 30), S.day - 1];
    const acct = UI.ext(E.derive(E.sumRange(S, 'acct', 'all', r30[0], r30[1])));
    const measure = acct.rconv > 0 ? U.clamp(acct.conv / acct.rconv, 0.3, 1.2) : 0.85; // Messquote: gemessen ÷ echt
    const recent = (name) => !!(g && g.events && g.events.some((e) => e.name === name && S.day - e.day <= 45));
    const ctx = { g, mg, ms, l7, budgets, proj, mb, daysLeft, dim, dom, acct, measure, spar: recent('Sparrunde'), push: recent('Wachstumsoffensive'), sanction: g ? g.sanction || 0 : 0, targets: [] };
    ctx.room = mb ? mb - proj : Infinity;
    ctx.roomDaily = mb ? (mb - proj) / Math.max(1, daysLeft) : Infinity;
    ctx.maxDaily = mb ? Math.max(0, (mb - ms) / Math.max(1, daysLeft)) : Infinity; // max. Tagesausgaben bis Monatsende
    if (g && GL) {
      const prog = GL.progress(S), elapsed = U.clamp((S.day - g.periodStart) / Math.max(1, g.periodEnd - g.periodStart + 1), 0, 1);
      ctx.targets = g.targets.map((t) => { const v = prog[t.id]; const met = GL.met(t, v); const onTrack = t.dir === 'min' ? U.div(v || 0, t.value) >= elapsed * 0.95 : met; return { ...t, v, met, onTrack }; });
    }
    const T = (id) => ctx.targets.find((t) => t.id === id);
    ctx.roasGoal = T('rroas') ? T('rroas').value : null; // echter ROAS
    ctx.roasGoalMeasured = ctx.roasGoal ? ctx.roasGoal * ctx.measure : null; // als gemessener ROAS (Spalte Conv.-Wert/Kosten)
    ctx.volBehind = ctx.targets.some((t) => ['conv', 'vol', 'accts'].includes(t.id) && !t.onTrack);
    ctx.profitBehind = ctx.targets.some((t) => t.id === 'profit' && !t.onTrack);
    ctx.mode = !g ? 'free' : ctx.spar || proj > mb * 0.98 || ctx.sanction >= 2 ? 'save' : ctx.room > mb * 0.08 && (ctx.volBehind || ctx.push) ? 'grow' : 'hold';
    return ctx;
  };
  // Hinweis an Google-Empfehlungen, wenn sie den internen Vorgaben widersprechen
  GD.recNote = function (S, r) {
    if (!UI.prefs().guide || !S.goals) return '';
    const cx = GD.ctx(S);
    const spendUp = /^(budget_|target_|broad_|firstpage_|pmax$)/.test(r.id);
    if (spendUp && cx.mode === 'save') return `<div class="callout warn small" style="margin:6px 0">🏢 Widerspricht Ihren Vorgaben: Kurs „Budget sparen" (Hochrechnung ${f.eur0(cx.proj)} von ${f.eur0(cx.mb)}${cx.spar ? ', Sparrunde aktiv' : ''}). Google kennt Ihr internes Budget nicht – diese Empfehlung würde die Ausgaben erhöhen.</div>`;
    if (/^budget_/.test(r.id) && cx.room > 0 && cx.room < Infinity) return `<div class="callout small" style="margin:6px 0">🏢 Spielraum im Monatsbudget: ${f.eur0(cx.room)} (≈ ${f.eur0(cx.roomDaily)}/Tag). Prüfen Sie, ob die vorgeschlagene Erhöhung hineinpasst.</div>`;
    return '';
  };
  GD.modeText = { save: 'Budget sparen', hold: 'Budget halten', grow: 'Wachstum mit Budget-Spielraum', free: 'keine Vorgaben' };
  GD.ctxHtml = function (S, cx = GD.ctx(S)) {
    if (!cx.g) return '';
    const rows = [
      ['Monatsbudget (Controlling)', `${f.eur0(cx.mb)} · bisher ${f.eur0(cx.ms)} · Hochrechnung <b class="${cx.proj > cx.mb ? 'down' : 'up'}">${f.eur0(cx.proj)}</b>`],
      ['Spielraum bis Monatsende', cx.room >= 0 ? `<span class="up">${f.eur0(cx.room)}</span> (≈ ${f.eur0(cx.roomDaily)}/Tag zusätzlich)` : `<span class="down">${f.eur0(-cx.room)} Überschreitung droht</span> – Tagesausgaben auf max. ${f.eur0(cx.maxDaily)} senken`],
      ['Marge / Break-even-ROAS', cx.mg ? `${f.pct0(cx.mg)} / ${f.int(100 / cx.mg)} %` : '–'],
    ];
    if (cx.roasGoal) rows.push(['ROAS-Ziel der Geschäftsleitung', `echt ≥ ${f.num2(cx.roasGoal)} ≈ gemessen ≥ <b>${f.int(cx.roasGoalMeasured * 100)} %</b> <span class="small muted">(Messquote ${f.pct0(cx.measure)})</span>`]);
    for (const t of cx.targets.filter((t) => t.id !== 'rroas')) rows.push([t.name, `${G.GOALS.fmt(t, t.v)} / ${t.dir === 'min' ? '≥' : '≤'} ${G.GOALS.fmt(t, t.value)} ${t.onTrack ? '<span class="up">✓ im Plan</span>' : '<span class="down">✗ hinter Plan</span>'}`]);
    if (cx.spar) rows.push(['Sparrunde', '<span class="down">aktiv – die Geschäftsleitung erwartet Zurückhaltung</span>']);
    if (cx.sanction) rows.push(['Sanktionsstufe', `<span class="down">${esc(G.GOALS.LEVELS[cx.sanction].name)}</span>`]);
    return `<div class="callout ${cx.mode === 'save' ? 'warn' : cx.mode === 'grow' ? 'good' : ''}"><b>🏢 Vorgaben der Geschäftsleitung · Kurs: ${GD.modeText[cx.mode]}</b><dl class="kv" style="margin-top:6px">${rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${b}</dd>`).join('')}</dl></div>`;
  };

  // ---------- Rechner für Ziel-ROAS / Ziel-CPA im Gebotsstrategie-Formular ----------
  function campMetrics() {
    const S = APP.S, r = [Math.max(0, S.day - 30), S.day - 1];
    const cid = APP._bidCid && M.camp(S, APP._bidCid) ? APP._bidCid : null;
    const m = UI.ext(E.derive(cid ? E.sumRange(S, 'camp', cid, r[0], r[1]) : E.sumRange(S, 'acct', 'all', r[0], r[1])));
    return { m, src: cid ? 'diese Kampagne, letzte 30 Tage' : 'gesamtes Konto, letzte 30 Tage' };
  }
  GD.bidHelp = function (type, val) {
    if (!APP.S || !['troas', 'maxvalue', 'tcpa', 'maxconv'].includes(type)) return '';
    const { m, src } = campMetrics(), mg = margin();
    const lines = [];
    let verdict = '';
    if (type === 'troas' || type === 'maxvalue') {
      const be = mg > 0 ? 1 / mg : null, cur = m.roas;
      lines.push(['Ist-Wert (' + src + ')', cur > 0 ? `Conv.-Wert/Kosten ${f.num2(cur)} → <b>${f.int(cur * 100)} %</b>` : 'noch keine Conversion-Werte']);
      if (be) lines.push(['Break-even bei ' + f.pct0(mg) + ' Marge', `<b>${f.int(be * 100)} %</b> (darunter verlieren Sie Geld)`]);
      const cxb = GD.ctx(APP.S);
      if (cxb.roasGoalMeasured) lines.push(['ROAS-Ziel der Geschäftsleitung', `echt ${f.num2(cxb.roasGoal)} ≈ gemessen <b>${f.int(cxb.roasGoalMeasured * 100)} %</b>`]);
      if (cxb.g) lines.push(['Monatsbudget', `Hochrechnung ${f.eur0(cxb.proj)} von ${f.eur0(cxb.mb)} · Kurs: <b>${GD.modeText[cxb.mode]}</b>`]);
      if (val > 0) {
        const t = val / 100, adPer100 = 100 / t, dbPer100 = 100 * mg - adPer100;
        lines.push([`Ihr Ziel ${f.int(val)} % bedeutet`, `je 100 € Umsatz höchstens ${f.eur(adPer100)} Werbung${mg ? ` → Deckungsbeitrag ≈ <span class="${dbPer100 >= 0 ? 'up' : 'down'}">${f.eur(dbPer100)}</span> je 100 € Umsatz` : ''}`]);
        if (be && t < be) verdict = ['bad', 'Unter Break-even: Jeder Umsatz kostet mehr Werbung, als er an Rohertrag bringt.'];
        else if (cxb.roasGoalMeasured && t < cxb.roasGoalMeasured) verdict = ['warn', `Unter dem ROAS-Ziel der Geschäftsleitung (≈ ${f.int(cxb.roasGoalMeasured * 100)} % gemessen): mehr Volumen, aber das Quartalsziel ist gefährdet.`];
        else if (cur > 0 && t > cur * 1.3) verdict = ['warn', `Deutlich über dem Ist-Wert (${f.int(cur * 100)} %): Smart Bidding wird sehr vorsichtig bieten – Volumen bricht ein, Status „Eingeschränkt durch Ziel" droht. Besser in 10–15-%-Schritten erhöhen.`];
        else if (cur > 0 && t < cur * 0.75) verdict = ['warn', 'Deutlich unter dem Ist-Wert: Google bietet aggressiver – mehr Umsatz, aber geringere Effizienz. Prüfen Sie, ob der Wert noch über Break-even liegt.'];
        else if (cur > 0) verdict = ['good', 'Realistischer Startwert nahe Ihrem Ist-Wert.'];
      }
    } else {
      const cur = m.cpa, maxCpa = m.valPerConv > 0 && mg ? m.valPerConv * mg : M.ind(APP.S).aov * mg;
      lines.push(['Ist-Wert (' + src + ')', cur > 0 ? `<b>${f.eur(cur)}</b> Kosten/Conv.` : 'noch keine Conversions']);
      if (maxCpa > 0) lines.push(['Max. CPA für Gewinn', `<b>${f.eur(maxCpa)}</b> (Wert/Conv. × Marge)`]);
      if (val > 0) {
        if (maxCpa > 0 && val > maxCpa) verdict = ['bad', 'Über dem Deckungsbeitrag je Conversion: Jede Conversion kostet mehr, als sie einbringt (außer bei hohem Kundenwert).'];
        else if (cur > 0 && val < cur * 0.75) verdict = ['warn', `Deutlich unter dem Ist-Wert (${f.eur(cur)}): Smart Bidding schränkt die Auslieferung stark ein. Besser schrittweise senken.`];
        else if (cur > 0 && val > cur * 1.4) verdict = ['warn', 'Deutlich über dem Ist-Wert: mehr Volumen, aber teurere Conversions.'];
        else if (cur > 0) verdict = ['good', 'Realistischer Startwert nahe Ihrem Ist-Wert.'];
      }
    }
    const det = type === 'troas' || type === 'maxvalue' ? 'troas' : 'tcpa';
    return `<div class="bidhelp callout"><b>${type === 'troas' || type === 'maxvalue' ? 'So lesen Sie den Ziel-ROAS' : 'So wählen Sie den Ziel-CPA'}</b>
      ${type === 'troas' || type === 'maxvalue' ? '<div class="small">Ziel-ROAS in % = gewünschter Conv.-Wert ÷ Kosten × 100. 400 % = 4 € Umsatz je 1 € Werbung. <b>Höher = vorsichtiger</b> (weniger Volumen), <b>niedriger = aggressiver</b>.</div>' : '<div class="small">Durchschnittliche Kosten pro Conversion, die Google anstrebt. <b>Niedriger = vorsichtiger</b> (weniger Volumen), <b>höher = aggressiver</b>.</div>'}
      <dl class="kv" style="margin:8px 0 0">${lines.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
      ${verdict ? `<div class="callout ${verdict[0]}" style="margin:8px 0 0">${verdict[1]}</div>` : ''}
      <div class="tipjump"><button type="button" class="btn sm primary" data-act="bidwizard" data-t="${type}">🧭 Geführte Hilfe (mit Marge, Budget & Zielen)</button><button type="button" class="btn sm" data-act="glossmore" data-id="${det}">ⓘ Ausführlich erklärt</button></div></div>`;
  };
  // ---------- Geführte Hilfe für Zielwerte: Szenarien mit Marge, Monatsbudget und Zielen ----------
  GD.scenarios = function (S, type, c, budget) {
    const cx = GD.ctx(S), r30 = [Math.max(0, S.day - 30), S.day - 1];
    const m = UI.ext(E.derive(c ? E.sumRange(S, 'camp', c.id, r30[0], r30[1]) : E.sumRange(S, 'acct', 'all', r30[0], r30[1])));
    const days = Math.max(1, Math.min(30, S.day - (c ? Math.max(0, c.created || 0) : 0)));
    const roas = type === 'troas' || type === 'maxvalue';
    const ok = m.conv >= 5 && m.cost > 0;
    if (!ok) return { cx, m, ok };
    const spend0 = m.cost / days, cap = budget || (c ? c.budget : spend0 * 1.5);
    const vpc = m.valPerConv || M.ind(S).aov, real = cx.measure > 0 ? 1 / cx.measure : 1;
    const rows = [];
    const mk = (target, label) => {
      let spend, rr, conv;
      if (roas) {
        const r0 = m.roas, t = target;
        spend = spend0 * U.clamp(Math.pow(r0 / t, 1.6), 0.12, 3);
        rr = r0 * Math.pow(t / r0, 0.55);
      } else {
        const a0 = m.cpa, t = target;
        spend = spend0 * U.clamp(Math.pow(t / a0, 1.9), 0.12, 3);
        rr = (vpc / (a0 * Math.pow(t / a0, 0.55)));
      }
      const limited = spend > cap;
      spend = Math.min(spend, cap);
      const rev = spend * rr; conv = rev / vpc;
      const db = rev * real * cx.mg - spend; // echter Deckungsbeitrag je Tag
      const monthDelta = (spend - spend0) * cx.daysLeft;
      const budgetOk = !cx.g || cx.proj + monthDelta <= cx.mb * 1.0;
      const goalOk = !cx.roasGoal || rr * real >= cx.roasGoal;
      rows.push({ target, label, spend, rr, rev, conv, db, limited, monthDelta, budgetOk, goalOk, beOk: cx.mg ? rr * real >= 1 / cx.mg : true });
    };
    const base = roas ? m.roas : m.cpa;
    const facs = roas ? [0.75, 0.9, 1, 1.15, 1.3, 1.5] : [0.7, 0.85, 1, 1.15, 1.3, 1.5];
    const seen = new Set();
    const add = (t, l) => { const k = roas ? Math.round(t * 20) / 20 : Math.round(t); if (k > 0 && !seen.has(k)) { seen.add(k); mk(roas ? k : k, l); } };
    for (const fa of facs) add(base * fa, fa === 1 ? 'Ist-Wert' : '');
    if (roas && cx.mg) add(1 / cx.mg, 'Break-even');
    if (roas && cx.roasGoalMeasured) add(cx.roasGoalMeasured, 'Ziel der GL');
    if (!roas && cx.mg) add(vpc * cx.mg * cx.measure, 'Break-even');
    rows.sort((a, b) => (roas ? a.target - b.target : b.target - a.target)); // von aggressiv zu vorsichtig
    // Empfehlung: höchster Deckungsbeitrag unter Einhaltung von Budget, Zielen und Break-even; bei Wachstum mehr Volumen
    const valid = rows.filter((r) => r.budgetOk && r.goalOk && r.beOk);
    let best = null;
    if (valid.length) best = cx.mode === 'grow' ? valid.slice().sort((a, b) => b.conv - a.conv).find((r) => r.db >= 0) || valid[0] : cx.mode === 'save' ? (valid.filter((r) => r.monthDelta <= 1).sort((a, b) => b.db - a.db)[0] || valid.slice().sort((a, b) => a.spend - b.spend)[0]) : valid.slice().sort((a, b) => b.db - a.db)[0];
    if (best) best.best = true;
    return { cx, m, ok, rows, roas, best, spend0, cap };
  };
  GD.wizardHtml = function (S, type, cid, budget) {
    const c = cid ? M.camp(S, cid) : null;
    const sc = GD.scenarios(S, type, c, budget), cx = sc.cx, m = sc.m;
    const roas = type === 'troas' || type === 'maxvalue';
    let html = GD.ctxHtml(S, cx) || '<div class="callout">Keine Vorgaben der Geschäftsleitung aktiv.</div>';
    html += `<div class="gd-sec"><b>${c ? 'Kampagne „' + esc(c.name) + '"' : 'Konto'} – letzte 30 Tage</b><dl class="kv" style="margin-top:4px"><dt>Kosten</dt><dd>${f.eur(m.cost)} (Tagesbudget ${f.eur0(sc.cap || (c ? c.budget : 0))})</dd><dt>Conversions / Wert</dt><dd>${f.num1(m.conv)} / ${f.eur(m.val)}</dd><dt>Conv.-Wert/Kosten</dt><dd>${f.num2(m.roas)} = ${m.roas ? f.int(m.roas * 100) + ' %' : '–'}</dd><dt>Kosten/Conv.</dt><dd>${f.eur(m.cpa)}</dd><dt>Verl. Impr.-Anteil Budget / Rang</dt><dd>${f.pct0(m.lostB)} / ${f.pct0(m.lostR)}</dd><dt>Deckungsbeitrag (echt)</dt><dd class="${m.rgp >= 0 ? 'up' : 'down'}">${f.eur(m.rgp)}</dd></dl></div>`;
    if (!sc.ok) return html + '<div class="callout warn">Zu wenige Conversions (unter 5 in 30 Tagen) für eine belastbare Schätzung. Empfehlung: zunächst „Conversions maximieren" bzw. „Conversion-Wert maximieren" ohne Zielwert oder manueller CPC, bis genug Daten vorliegen. Untergrenze für spätere Ziel-ROAS: Break-even ' + (cx.mg ? f.int(100 / cx.mg) + ' %' : '–') + (cx.roasGoalMeasured ? `, Ziel der Geschäftsleitung ≈ ${f.int(cx.roasGoalMeasured * 100)} %` : '') + '.</div>';
    const fmtT = (t) => (roas ? f.int(t * 100) + ' %' : f.eur(t));
    const yes = (b, t) => (b ? '<span class="up">✓</span>' : `<span class="down" title="${t}">✗</span>`);
    const rows = sc.rows.map((r) => `<tr class="${r.best ? 'gd-best' : ''}"><td><b>${fmtT(r.target)}</b>${r.label ? `<div class="tiny muted">${r.label}</div>` : ''}${r.best ? '<div class="tiny up"><b>★ Empfehlung</b></div>' : ''}</td><td class="num">${f.eur0(r.spend)}${r.limited ? '<div class="tiny muted">Budget-Limit</div>' : ''}</td><td class="num">${f.num1(r.conv * 30)}</td><td class="num">${f.eur0(r.rev * 30)}</td><td class="num">${f.int(r.rr * 100)} %</td><td class="num ${r.db >= 0 ? 'up' : 'down'}">${f.eur0(r.db * 30)}</td><td class="num ${r.monthDelta > 0 ? 'down' : 'up'}">${r.monthDelta >= 0 ? '+' : ''}${f.eur0(r.monthDelta)}</td><td class="center">${yes(r.budgetOk, 'Monatsbudget würde überschritten')} ${yes(r.goalOk, 'ROAS-Ziel der Geschäftsleitung verfehlt')} ${yes(r.beOk, 'unter Break-even')}</td><td><button class="btn sm ${r.best ? 'primary' : ''}" data-act="bidwset" data-v="${roas ? Math.round(r.target * 100) : r.target.toFixed(2)}" data-n="${roas ? 'targetRoas' : 'targetCpa'}">Übernehmen</button></td></tr>`).join('');
    const why = sc.best ? (cx.mode === 'save' ? 'Kurs „Budget sparen": empfohlen wird der Wert mit dem höchsten Deckungsbeitrag, der die Ausgaben nicht erhöht und Monatsbudget sowie Ziele einhält.' : cx.mode === 'grow' ? 'Kurs „Wachstum": empfohlen wird der Wert mit den meisten Conversions, der noch Budget, Ziele und Break-even einhält.' : 'Empfohlen wird der Wert mit dem höchsten Deckungsbeitrag, der Monatsbudget, Ziele und Break-even einhält.') : '<span class="down">Kein Szenario erfüllt alle Vorgaben gleichzeitig.</span> Prüfen Sie, ob das Budget anderer Kampagnen gesenkt werden kann, oder priorisieren Sie das wichtigste Ziel.';
    return html + `<div class="gd-sec"><b>Szenarien (Schätzung)</b><div class="small muted">Von aggressiv (oben) zu vorsichtig (unten). Werte je 30 Tage; „Monat Δ" = Mehr-/Minderausgaben bis Monatsende gegenüber heute. Prüfung: Monatsbudget · ROAS-Ziel · Break-even.</div>
      <div class="tablewrap" style="margin-top:6px"><table class="t"><thead><tr><th>${roas ? 'Ziel-ROAS' : 'Ziel-CPA'}</th><th class="num">Kosten/Tag</th><th class="num">Conv.</th><th class="num">Conv.-Wert</th><th class="num">ROAS (gem.)</th><th class="num">Deckungsbeitrag (echt)</th><th class="num">Monat Δ</th><th>Budget · Ziel · BE</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div class="callout ${sc.best ? 'good' : 'warn'}">${why}</div>
      <div class="callout warn small"><b>⚠ Unterschied zum echten Google Ads</b><br>Die Szenarien sind eine vereinfachte Schätzung des Simulators (Elastizität von Volumen und Effizienz). Google Ads bietet dafür den <i>Gebotsstrategie-Simulator</i> bzw. Zielwert-Simulationen, kennt aber weder Ihre Marge noch Ihr internes Monatsbudget – diese Abwägung müssen Sie in der Praxis selbst treffen.</div>`;
  };
  ACT.bidwizard = (el, d) => {
    const modal = document.getElementById('modal-root');
    const bud = modal ? UI.num('budget', modal) : null;
    UI.hideTip();
    UI.sheet('🧭 Geführte Hilfe: ' + (d.t === 'troas' || d.t === 'maxvalue' ? 'Ziel-ROAS' : 'Ziel-CPA') + ' festlegen', GD.wizardHtml(APP.S, d.t, APP._bidCid, bud));
  };
  ACT.bidwset = (el, d) => {
    const inp = document.querySelector(`#modal-root [name="${d.n}"]`);
    UI.closeSheet();
    if (!inp) { UI.toast('Feld nicht gefunden – bitte Wert manuell eintragen: ' + d.v, 'bad'); return; }
    inp.value = d.v;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.focus();
    UI.toast('Zielwert eingetragen – mit „Speichern" übernehmen', 'good');
  };
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (!el.name || !['targetRoas', 'targetCpa'].includes(el.name)) return;
    const box = el.closest('#bidbox, #expbid, .modal');
    const help = box && box.querySelector('.bidhelp');
    const sel = box && box.querySelector('[name="bidType"]');
    if (!help || !sel) return;
    help.outerHTML = GD.bidHelp(sel.value, parseFloat(String(el.value).replace(',', '.')));
  });
  // Kampagnenbezug für den Rechner merken
  const origEdit = ACT.editcampaign;
  ACT.editcampaign = (el, d) => { APP._bidCid = d.id; origEdit(el, d); };
  const origNew = ACT.newcampaign;
  ACT.newcampaign = (el, d) => { APP._bidCid = null; origNew(el, d); };

  // ---------- Geführte Problemhilfe ----------
  const RULES = [
    { re: /!/, where: 'h', fix: 'Ausrufezeichen aus dem Anzeigentitel entfernen (in Beschreibungen ist eines erlaubt).' },
    { re: /!!|\?\?|€€|\*\*/, fix: 'Doppelte Satzzeichen/Symbole entfernen.' },
    { re: /\b[A-ZÄÖÜ]{5,}\b/, fix: 'Wörter in GROSSBUCHSTABEN normal schreiben (Abkürzungen bis 4 Zeichen sind ok).' },
    { re: /(\+49|\b0\d{3,4}[ /-]?\d{4,})/, fix: 'Telefonnummer entfernen – nutzen Sie stattdessen ein Anruf-Asset.' },
    { re: /(nr\.?\s?1|#1|\bbeste[rsn]?\b|weltweit führend|marktführer)/i, fix: 'Superlativ entfernen oder belegen (z. B. „Testsieger Stiftung Warentest 05/2026").', lim: true },
  ];
  function offending(S, ad) {
    const out = [];
    const items = [].concat((ad.headlines || []).map((h) => ['Titel', h.t, 'h']), (ad.descriptions || []).map((x) => ['Beschreibung', x.t, 'd']), (ad.longHeadlines || []).map((x) => ['Langer Titel', x.t, 'l']));
    const comps = S.competitors.map((c) => c.name.toLowerCase());
    for (const [kind, t, w] of items) {
      if (!t) continue;
      for (const r of RULES) if ((!r.where || r.where === w) && r.re.test(t)) out.push(`${kind} „${esc(t)}": ${r.fix}`);
      if (comps.some((c) => t.toLowerCase().includes(c))) out.push(`${kind} „${esc(t)}": Fremden Markennamen entfernen.`);
    }
    return out;
  }
  const btn = (label, act, data = {}) => ({ label, act, data });
  GD.problems = function (S) {
    const P = [];
    const live = S.campaigns.filter((c) => c.status === 'enabled' && !c.isTrial);
    const r30 = [Math.max(0, S.day - 30), S.day - 1];
    const cx = GD.ctx(S);
    // Vorgaben der Geschäftsleitung
    if (cx.g && S.day > 3 && cx.proj > cx.mb * 1.02) P.push({ id: 'mbudget', sev: 'bad', views: ['overview', 'campaigns', 'business'], title: `Monatsbudget wird voraussichtlich überschritten (${f.eur0(cx.proj)} von ${f.eur0(cx.mb)})`, why: 'Das Controlling zieht Überschreitungen vom Folgemonat ab und die Geschäftsleitung verliert Vertrauen.', steps: [`Summe der Tagesbudgets bis Monatsende auf höchstens <b>${f.eur0(cx.maxDaily)}</b> senken (aktuell ${f.eur0(cx.budgets)})`, 'Zuerst bei Kampagnen mit dem geringsten Deckungsbeitrag kürzen', 'Alternativ Zielwerte verschärfen (Ziel-ROAS höher / Ziel-CPA niedriger)'], fix: [btn('Zu Kampagnen', 'nav', { v: 'campaigns' })] });
    // Geld & Messung
    if (S.company.cash <= 0) P.push({ id: 'cash', sev: 'bad', views: ['overview', 'billing', 'business'], title: 'Kasse leer – alle Anzeigen gestoppt', why: 'Ohne Zahlungsmittel kann Google nicht abbuchen; die Auslieferung steht.', steps: ['Kredit aufnehmen oder Kosten senken', 'Unprofitable Kampagnen pausieren', 'Danach Tage simulieren und Kasse beobachten'], fix: [btn('Kredit aufnehmen', 'capital')] });
    if (!S.account.trackingOk) P.push({ id: 'trk', sev: 'bad', views: ['overview', 'conversions', 'campaigns'], title: 'Conversion-Tracking funktioniert nicht', why: 'Google sieht keine Conversions mehr. Smart Bidding senkt die Gebote, Berichte zeigen falsche Werte.', steps: ['Tools → Conversions öffnen', '„Tag testen" klicken – zeigt, ob das Tag fehlt', '„Tracking reparieren" ausführen', 'Ein paar Tage simulieren: Conversions erscheinen wieder (nachgemeldet)'], fix: [btn('Zu Conversions', 'nav', { v: 'conversions' })] });
    if (!S.account.autoTagging) P.push({ id: 'tag', sev: 'warn', views: ['overview', 'settings', 'conversions'], title: 'Automatisches Tagging ist aus', why: 'Ohne GCLID können Klicks schlechter mit Conversions verknüpft werden.', steps: ['Einstellungen öffnen', '„Automatisches Tagging" aktivieren'], fix: [btn('Zu Einstellungen', 'nav', { v: 'settings' })] });
    // Anzeigen
    for (const ad of S.ads.filter((a) => a.status === 'enabled')) {
      const ag = M.ag(S, ad.adGroupId), c = ag && M.camp(S, ag.campaignId);
      if (!c || c.status === 'removed' || c.isTrial) continue;
      if (ad.policy.status === 'disapproved' && !(ad.reviewUntil > S.day)) {
        const off = offending(S, ad);
        P.push({ id: 'dis_' + ad.id, sev: 'bad', views: ['overview', 'ads'], title: `Anzeige abgelehnt: ${esc(c.name)} › ${esc(ag.name)}`, why: `Abgelehnte Anzeigen werden nicht ausgeliefert. Grund: ${ad.policy.reasons.map(esc).join(' · ')}.`, steps: ['Auf „Anzeige bearbeiten" klicken', ...(off.length ? off : ['Den genannten Richtlinienverstoß im Text beheben']), 'Speichern – die Anzeige wird ca. 1 Tag geprüft', 'Einen Tag simulieren (+1T) und Status prüfen'], fix: [btn('Anzeige bearbeiten', 'editad', { id: ad.id })] });
      } else if (ad.policy.status === 'limited' && !(ad.reviewUntil > S.day)) {
        P.push({ id: 'lim_' + ad.id, sev: 'warn', views: ['ads'], title: `Anzeige eingeschränkt: ${esc(ag.name)}`, why: `Die Anzeige läuft nur eingeschränkt. Grund: ${ad.policy.reasons.map(esc).join(' · ')}.`, steps: ['Anzeige bearbeiten', ...(offending(S, ad).length ? offending(S, ad) : ['Betroffene Formulierung entschärfen']), 'Speichern und Prüfung abwarten'], fix: [btn('Anzeige bearbeiten', 'editad', { id: ad.id })] });
      }
      if (ad.type === 'rsa' && ad.policy.status !== 'disapproved') {
        const st = M.adStrength(S, ad);
        if (st.score < 55) P.push({ id: 'str_' + ad.id, sev: 'warn', views: ['ads'], title: `Anzeigenstärke „${st.label}": ${esc(ag.name)}`, why: 'Schwache Anzeigen erhalten weniger Klicks. Google hat zu wenige unterschiedliche Bausteine zum Kombinieren.', steps: [...st.tips.map(esc), 'Alternativ „✨ Assets generieren" nutzen und das Ergebnis prüfen', 'Ziel: mindestens „Gut"'], fix: [btn('Anzeige bearbeiten', 'editad', { id: ad.id }), btn('✨ Assets generieren', 'autoassets', { id: ad.id })] });
      }
    }
    // Kampagnen
    for (const c of live) {
      const [lab, cls] = M.campaignStatus ? M.campaignStatus(S, c) : ['', ''];
      const m = UI.ext(E.derive(E.sumRange(S, 'camp', c.id, r30[0], r30[1])));
      if (cls === 'bad' && /Anzeigen|Keywords|Produkte/.test(lab)) P.push({ id: 'cst_' + c.id, sev: 'bad', views: ['overview', 'campaigns'], title: `${esc(c.name)}: ${esc(lab)}`, why: 'Die Kampagne ist aktiv, kann aber nichts ausliefern.', steps: /Keywords/.test(lab) ? ['Keywords öffnen', 'Keyword hinzufügen oder pausierte aktivieren'] : /Produkte/.test(lab) ? ['Merchant Center öffnen', 'Produkte aktivieren bzw. Lagerbestand prüfen'] : ['Anzeigen öffnen', 'Abgelehnte Anzeigen korrigieren oder neue Anzeige anlegen'], fix: [btn('Beheben', 'nav', { v: /Keywords/.test(lab) ? 'keywords' : /Produkte/.test(lab) ? 'products' : 'ads' })] });
      if (c.rt && c.rt.limited && m.cost > 0) {
        const prof = m.gp > 0;
        const others = live.filter((o) => o.id !== c.id && o.status === 'enabled').map((o) => ({ o, m: UI.ext(E.derive(E.sumRange(S, 'camp', o.id, r30[0], r30[1]))) })).filter((x) => x.m.cost > 0).sort((a, b) => U.div(a.m.gp, a.m.cost) - U.div(b.m.gp, b.m.cost));
        const donor = others.find((x) => U.div(x.m.gp, x.m.cost) < U.div(m.gp, m.cost));
        const why = `Sie verpassen ${f.pct0(m.lostB)} der möglichen Impressionen wegen Budget. Deckungsbeitrag (gemessen, 30 T): ${f.eur(m.gp)}.`;
        let steps, title = `${esc(c.name)}: Eingeschränkt durch Budget`, sev = 'info', extra = '';
        if (!prof) steps = ['Die Kampagne ist nicht profitabel – Budget NICHT erhöhen', 'Gebote bzw. Zielwerte senken → mehr, aber günstigere Klicks', 'Streuverluste über Suchbegriffe ausschließen'];
        else if (cx.mode === 'save') {
          extra = ` <b>Aber:</b> Die Geschäftsleitung verlangt ${cx.spar ? 'nach der Sparrunde ' : ''}Budgetdisziplin – Hochrechnung ${f.eur0(cx.proj)} von ${f.eur0(cx.mb)} Monatsbudget. Mehr Budget würde das Controlling-Ziel verletzen und Vertrauen kosten.`;
          steps = [donor ? `Budget <b>umschichten</b> statt erhöhen: z. B. von „${esc(donor.o.name)}" (geringerer Deckungsbeitrag je €) zu dieser Kampagne – Gesamtbudget bleibt gleich` : 'Budget nicht erhöhen – Gesamtausgaben müssen gleich bleiben oder sinken', 'Gebote/Zielwerte leicht senken: mehr Klicks fürs gleiche Geld (z. B. Ziel-ROAS +10 % bzw. CPC −10 %)', 'Streuverluste ausschließen und Werbezeitplan auf die stärksten Zeiten konzentrieren', `Summe aller Tagesbudgets höchstens ${f.eur0(cx.maxDaily)} bis Monatsende`];
          sev = 'info'; title = `${esc(c.name)}: Budget knapp – aber Sparvorgabe beachten`;
        } else if (cx.room > 0) {
          const inc = Math.min(c.budget * 0.25, cx.roomDaily);
          steps = [`Die Kampagne ist profitabel und das Monatsbudget hat Spielraum (${f.eur0(cx.room)}).`, inc >= 1 ? `Tagesbudget um höchstens <b>${f.eur0(inc)}</b> erhöhen (auf ${f.eur0(c.budget + inc)}) – mehr sprengt das Monatsbudget` : 'Spielraum ist sehr klein – lieber umschichten', donor ? `Alternativ von „${esc(donor.o.name)}" umschichten` : 'Nach 1 Woche prüfen, ob der Deckungsbeitrag mitwächst', 'Hochrechnung in der Übersicht im Blick behalten'];
          sev = cx.volBehind ? 'warn' : 'info';
        } else steps = ['Kein Spielraum im Monatsbudget – nicht erhöhen', donor ? `Von „${esc(donor.o.name)}" umschichten` : 'Gebote senken für mehr günstige Klicks', 'Streuverluste ausschließen'];
        P.push({ id: 'bud_' + c.id, sev, views: ['campaigns', 'overview'], title, why: why + extra, steps, fix: [btn('Kampagne bearbeiten', 'editcampaign', { id: c.id })] });
      }
      if (c.rt && c.rt.limitedTarget) {
        const tr = c.bidStrategy.type === 'troas' || c.bidStrategy.type === 'maxvalue';
        const floor = tr && cx.roasGoalMeasured ? Math.max(cx.roasGoalMeasured, cx.mg ? 1 / cx.mg : 0) : cx.mg ? 1 / cx.mg : null;
        const stepsT = ['Kampagne bearbeiten – im Formular „🧭 Geführte Hilfe" öffnen: zeigt Szenarien mit Marge, Monatsbudget und Zielen', tr ? `Ziel-ROAS um 10–15 % senken${floor ? `, aber nicht unter <b>${f.int(floor * 100)} %</b> (${cx.roasGoalMeasured && floor === cx.roasGoalMeasured ? 'ROAS-Ziel der Geschäftsleitung' : 'Break-even'})` : ''}` : 'Ziel-CPA um 10–15 % erhöhen (Ist-Wert im Formular)', cx.mode === 'save' ? 'Achtung Sparvorgabe: mehr Volumen heißt mehr Ausgaben – Monatsbudget prüfen' : 'Lernphase von ca. 5 Tagen abwarten'];
        P.push({ id: 'tgt_' + c.id, sev: 'warn', views: ['campaigns', 'overview'], title: `${esc(c.name)}: Eingeschränkt durch Ziel`, why: 'Ihr Ziel-CPA ist zu niedrig bzw. Ziel-ROAS zu hoch – Smart Bidding findet kaum Auktionen, die das Ziel erfüllen. Das Budget wird nicht ausgegeben.' + (cx.mode === 'save' ? ' Bei der aktuellen Sparvorgabe kann das sogar gewollt sein.' : ''), steps: stepsT, fix: [btn('Zielwert anpassen', 'editcampaign', { id: c.id })] });
      }
      const bs = D.BID_STRATEGIES[c.bidStrategy.type];
      if (bs && bs.smart && ['tcpa', 'troas', 'maxconv', 'maxvalue'].includes(c.bidStrategy.type) && S.day - (c.created || 0) > 21 && m.conv < 15) P.push({ id: 'dat_' + c.id, sev: 'info', views: ['campaigns'], title: `${esc(c.name)}: wenig Daten für Smart Bidding`, why: `Nur ${f.num1(m.conv)} Conversions in 30 Tagen. Smart Bidding schätzt dann ungenau.`, steps: ['Kampagnen bündeln, um mehr Daten pro Strategie zu haben', 'Oder vorübergehend „Klicks maximieren" bzw. manuellen CPC nutzen', 'Conversion-Tracking prüfen'], fix: [btn('Kampagne bearbeiten', 'editcampaign', { id: c.id })] });
      if (c.learnUntil !== null && c.learnUntil > S.day) P.push({ id: 'lrn_' + c.id, sev: 'info', views: ['campaigns'], title: `${esc(c.name)}: Lernphase bis Tag ${c.learnUntil + 1}`, why: 'Nach Änderungen lernt Smart Bidding neu; die Leistung schwankt.', steps: ['Keine weiteren großen Änderungen vornehmen', 'Erst nach der Lernphase bewerten'], fix: [] });
      // Assets für Suchkampagnen
      if (c.type === 'search') {
        const as = M.assetsFor(S, c.id), n = (t) => as.filter((a) => a.type === t).length;
        const miss = [];
        if (n('sitelink') < 4) miss.push(`Sitelinks: ${n('sitelink')} von empfohlen 4+`);
        if (n('callout') < 2) miss.push(`Zusatzinformationen: ${n('callout')} von 2+`);
        if (n('snippet') < 1) miss.push('Snippets: keines');
        if (miss.length) P.push({ id: 'ast_' + c.id, sev: n('sitelink') < 2 ? 'warn' : 'info', views: ['assets', 'ads'], title: `${esc(c.name)}: Assets unvollständig`, why: `Assets vergrößern die Anzeige, erhöhen die Klickrate und den Ad Rank. Fehlend: ${miss.join(' · ')}.`, steps: ['Assets öffnen und „＋ Asset" klicken', 'Typ wählen (z. B. Sitelinks) – Ebene „Konto" gilt für alle Kampagnen', 'Für Sitelinks kurze, unterschiedliche Linktexte (max. 25 Zeichen) verwenden, z. B. Kategorien, Angebote, Kontakt', 'Bis zur Empfehlung wiederholen; Assets erscheinen vor allem in oberen Positionen'], fix: [btn(n('sitelink') < 4 ? 'Sitelink hinzufügen' : 'Asset hinzufügen', 'gdasset', { t: n('sitelink') < 4 ? 'sitelink' : n('callout') < 2 ? 'callout' : 'snippet' })] });
      }
    }
    // Keywords
    const lowQs = S.keywords.filter((k) => k.status === 'enabled' && k.rt && k.rt.qs && k.rt.qs.score <= 4).sort((a, b) => a.rt.qs.score - b.rt.qs.score).slice(0, 4);
    for (const k of lowQs) {
      const q = k.rt.qs, steps = [];
      if (q.rel === 'Unterdurchschnittlich') steps.push(`Anzeigenrelevanz: „${esc(k.text)}" in mindestens einen Anzeigentitel der Anzeigengruppe aufnehmen`);
      if (q.ctr === 'Unterdurchschnittlich') steps.push('Erwartete CTR: Nutzen/Angebot im Titel, mehr Assets, ggf. Keyword in eigene, engere Anzeigengruppe verschieben');
      if (q.lp === 'Unterdurchschnittlich') steps.push('Landingpage: Ladezeit verbessern (Unternehmen & GuV → Investitionen) oder passendere Zielseite');
      if (!steps.length) steps.push('Alle Bestandteile sind „durchschnittlich": Titel mit Keyword und attraktivem Nutzen verbessern');
      const ad = S.ads.find((a) => a.adGroupId === k.adGroupId && a.status === 'enabled' && a.type === 'rsa');
      P.push({ id: 'qs_' + k.id, sev: 'warn', views: ['keywords'], title: `Niedriger Qualitätsfaktor ${q.score}: „${esc(k.text)}"`, why: `Erw. CTR ${q.ctr} · Anzeigenrelevanz ${q.rel} · Landingpage ${q.lp}. Niedriger QF = höhere Klickpreise und schlechtere Positionen.`, steps: [...steps, 'QF aktualisiert sich nach einigen Tagen mit neuen Daten'], fix: ad ? [btn('Anzeige der Gruppe bearbeiten', 'editad', { id: ad.id })] : [] });
    }
    const below = S.keywords.filter((k) => k.status === 'enabled' && k.rt && k.rt.belowFirst).length;
    if (below) P.push({ id: 'below', sev: 'info', views: ['keywords'], title: `${below} Keyword(s) unter dem Gebot für die erste Seite`, why: 'Diese Keywords erscheinen selten, weil Ihr Gebot zu niedrig für Seite 1 ist.', steps: ['Keywords nach Status filtern/sortieren', 'Gebot auf mindestens „Gebot 1. Seite" anheben – nur wenn das Keyword profitabel sein kann', 'Oder Qualitätsfaktor verbessern, dann sinkt die Schwelle'], fix: [] });
    // Produkte
    if (M.ind(S).hasShopping) {
      const bad = S.products.filter((p) => p.status === 'enabled' && M.productStatus(S, p)[1] !== 'good');
      if (bad.length) P.push({ id: 'prod', sev: 'warn', views: ['products', 'overview'], title: `${bad.length} Produkt(e) mit Problemen im Merchant Center`, why: `Z. B. ${bad.slice(0, 3).map((p) => `${esc(p.title)}: ${esc(M.productStatus(S, p)[0])}`).join(' · ')}. Produkte ohne Lagerbestand werden nicht ausgeliefert, fehlende GTIN oder zu hohe Preise kosten Sichtbarkeit.`, steps: ['Merchant Center öffnen', 'Fehlende GTIN ergänzen (Schaltfläche in der Zeile)', 'Preise mit dem Markt-Benchmark vergleichen und ggf. anpassen', 'Bildqualität verbessern'], fix: [btn('Zum Merchant Center', 'nav', { v: 'products' })] });
    }
    const order = { bad: 0, warn: 1, info: 2 };
    return P.sort((a, b) => order[a.sev] - order[b.sev]);
  };

  GD.panel = function (view) {
    const S = APP.S;
    if (!S || !UI.prefs().guide || APP.view === 'academy') return '';
    let list;
    try { list = GD.problems(S).filter((p) => p.views.includes(view)); } catch (e) { console.error(e); return ''; }
    if (view === 'overview') list = list.filter((p) => p.sev !== 'info');
    if (!list.length) return '';
    const shown = list.slice(0, view === 'overview' ? 5 : 8);
    const ico = { bad: '⛔', warn: '⚠️', info: 'ℹ️' };
    return `<div class="card gd-panel"><div class="hd"><h3>🧭 Geführte Hilfe · ${list.length} Hinweis${list.length > 1 ? 'e' : ''}</h3><div class="tools"><a class="small" data-act="gdoff">Für Profis: ausschalten</a></div></div><div class="bd flush">${shown.map((p, i) => `
      <details class="gd-item ${p.sev}" ${i === 0 && p.sev === 'bad' ? 'open' : ''}><summary>${ico[p.sev]} ${p.title}</summary>
        <div class="gd-body"><p>${p.why}</p><b>So beheben Sie es:</b><ol>${p.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        ${p.fix.length ? `<div class="gd-fix">${p.fix.map((b) => `<button class="btn sm ${b === p.fix[0] ? 'primary' : ''}" data-act="${b.act}" ${Object.entries(b.data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${b.label}</button>`).join('')}</div>` : ''}</div></details>`).join('')}
      ${list.length > shown.length ? `<div class="small muted" style="padding:8px 16px">${list.length - shown.length} weitere Hinweise in den jeweiligen Bereichen</div>` : ''}</div></div>`;
  };
  ACT.gdoff = () => UI.confirm('Geführte Hilfe ausschalten?', 'Die Problemhinweise mit Schritt-für-Schritt-Anleitung werden ausgeblendet. Sie können sie jederzeit unter Einstellungen → Lernhilfen wieder einschalten.', () => { UI.setPref('guide', false); UI.render(true); }, 'Ausschalten');
  ACT.gdasset = (el, d) => { APP._assetType = d.t; ACT.newasset(); };
  ACT.chg_pref = (el, d) => { UI.setPref(d.k, el.checked); UI.render(true); };
  GD.prefsCard = function () {
    const p = UI.prefs();
    const row = (k, label, hint) => `<label class="chk" style="align-items:flex-start"><input type="checkbox" data-chg="pref" data-k="${k}" ${p[k] ? 'checked' : ''}> <span>${label}<br><span class="small muted">${hint}</span></span></label>`;
    return UI.card('Lernhilfen', `<div style="display:flex;flex-direction:column;gap:10px">
      ${row('guide', 'Geführte Hilfe bei Problemen', 'Zeigt bei abgelehnten Anzeigen, fehlenden Assets, Budget-/Zielproblemen, Tracking usw. Ursache und Schritt-für-Schritt-Lösung.')}
      ${row('tips', 'Erklärungen beim Überfahren', 'Kurze Erklärung zu Kennzahlen und Begriffen (Tabellenköpfe, Kacheln, Formularfelder).')}
      ${row('cmpTables', 'Veränderung in Tabellen anzeigen', 'Bei aktivem Vergleichszeitraum (z. B. „Vgl.: Vormonat") steht unter jedem Kennzahlwert die prozentuale Veränderung.')}
      ${row('tipMore', '„Mehr erfahren" in Erklärungen', 'Button im Tooltip zu ausführlichen Erklärungen mit Formel, Beispiel, Ihren Zahlen und Unterschieden zu Google Ads.')}
      <div class="small muted">Gilt für alle Spielstände in diesem Browser. Profis können alles ausschalten.</div></div>`);
  };
})();
