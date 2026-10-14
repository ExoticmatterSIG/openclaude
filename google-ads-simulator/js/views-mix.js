/* Ads Simulator – Ansicht „Marketing & Team": Mitarbeitende, Freelancer, Agentur und Marketing-Aktionen planen */
(function () {
  const G = globalThis.GA;
  const U = G.U, M = G.M, E = G.E, C = G.C, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP, MK = G.MKT;
  const f = U.fmt, esc = U.esc;
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  const SKILL = ['', 'schwach', 'unterdurchschnittlich', 'solide', 'stark', 'herausragend'];

  // Markenkampagne finden (Keywords mit dem Markennamen)
  MK.brandCamps = function (S) {
    const b = S.company.brand.toLowerCase().split(/\s+/)[0];
    const ids = new Set(S.keywords.filter((k) => k.status === 'enabled' && k.text.includes(b)).map((k) => (M.ag(S, k.adGroupId) || {}).campaignId));
    return S.campaigns.filter((c) => ids.has(c.id) && c.status === 'enabled');
  };

  V.mix = {
    render() {
      const S = APP.S, st = MK.state(S), staff = st.staff.filter((p) => p.status === 'active');
      const running = st.actions.filter((a) => a.status !== 'done');
      const done = st.actions.filter((a) => a.status === 'done');
      const g = S.goals;
      const head = UI.head('Marketing & Team', '<button class="btn" data-act="mixhire">＋ Stelle besetzen</button><button class="btn primary" data-act="mixplan">＋ Aktion planen</button>', { noScope: true, noRange: true });
      const intro = `<div class="callout">Überschüssiges Geld können Sie in Personal und Marketing außerhalb von Google Ads investieren. Die Kosten gehen aus der Kasse und zählen in den <b>Marketing-Deckungsbeitrag</b> der Geschäftsleitung. Aktionen erhöhen Marken- und Gattungssuchen – planen Sie das Budget Ihrer Markenkampagne mit. Schlecht umgesetzte Aktionen können floppen oder schaden (Shitstorm, Abmahnung).</div>`;
      const stats = `<div class="grid g4">
        <div class="card"><div class="stat"><div class="lbl">Personalkosten / Monat</div><div class="val">${f.eur0(MK.monthlyStaff(S))}</div><div class="sub">${staff.length} Person(en)/Dienstleister</div></div></div>
        <div class="card"><div class="stat"><div class="lbl">Aktionen laufend / geplant</div><div class="val">${running.length}</div><div class="sub">${done.length} abgeschlossen</div></div></div>
        <div class="card"><div class="stat"><div class="lbl">In Aktionen investiert</div><div class="val">${f.eur0(st.spent)}</div><div class="sub">seit Spielbeginn</div></div></div>
        <div class="card"><div class="stat"><div class="lbl">Kasse</div><div class="val ${S.company.cash < 0 ? 'down' : ''}">${f.eur0(S.company.cash)}</div><div class="sub">${g ? 'Freigabegrenze GL: ' + f.eur0(g.monthBudget * 0.8) : ''}</div></div></div></div>`;
      const team = staff.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Rolle</th><th>Name</th><th>Vertrag</th><th>Qualität</th><th class="num">Kosten/Monat</th><th>Status</th><th></th></tr></thead><tbody>${staff.map((p) => {
        const R = MK.ROLES[p.role], ramp = U.clamp((S.day - p.start) / R.onboard, 0, 1);
        return `<tr><td>${R.icon} <b>${esc(R.name)}</b><div class="tiny muted">${esc(R.desc)}</div></td><td>${esc(p.name)}</td><td>${p.mode === 'free' ? 'Freelancer (Teilzeit)' : R.agency ? 'Retainer' : 'Festanstellung'}</td><td>${p.revealed ? `<span class="${p.skill <= 2 ? 'down' : p.skill >= 4 ? 'up' : ''}" title="Tatsächliche Leistung">${stars(p.skill)}</span><div class="tiny">${SKILL[p.skill]}</div>` : `<span class="muted" title="Eindruck aus dem Gespräch – zeigt sich nach 30 Tagen">${stars(p.seen)}?</span><div class="tiny muted">noch ${Math.max(0, 30 - (S.day - p.start))} T bis Einschätzung</div>`}</td><td class="num">${f.eur0(p.cost)}</td><td>${p.absentUntil && p.absentUntil >= S.day ? `<span class="pill warn">abwesend bis ${U.fmtShort(U.dayToDate(S.startDate, p.absentUntil))}</span>` : ramp < 1 ? `Einarbeitung ${f.pct0(ramp)}` : 'Voll wirksam'}</td><td><button class="btn sm ghost danger" data-act="mixfire" data-id="${p.id}">Beenden</button></td></tr>`;
      }).join('')}</tbody></table></div>` : '<div class="empty">Noch kein Team. Mit „＋ Stelle besetzen" können Sie Mitarbeitende, Freelancer oder eine Agentur gewinnen.</div>';
      const actRow = (a) => {
        const t = MK.TYPES[a.type], prog = U.clamp((S.day - a.start) / Math.max(1, a.tailEnd - a.start + 1), 0, 1), c = MK.curve(a, S.day);
        const phase = S.day < a.start ? `startet in ${a.start - S.day} Tag(en)` : S.day <= a.end ? 'läuft' : S.day <= a.tailEnd ? 'Nachwirkung' : 'abgeschlossen';
        return `<div class="mixact"><div class="ic">${t.icon}</div><div class="body"><div><b>${esc(t.name)}</b> <span class="tag">${MK.SIZES[a.size].name}</span> <span class="tag">${MK.EXEC[a.exec].name}</span> ${a.hit ? `<span class="pill bad">${esc(MK.DISASTERS[a.hit].name)}</span>` : a.flop ? '<span class="pill warn">Flop</span>' : ''}</div>
          <div class="small muted">${f.eur0(a.cost)} · ${phase} · Tag ${U.fmtShort(U.dayToDate(S.startDate, a.start))} – ${U.fmtShort(U.dayToDate(S.startDate, a.tailEnd))}</div>
          ${a.status !== 'done' ? `<div class="bar" style="margin-top:6px"><i style="width:${prog * 100}%"></i></div><div class="tiny">${c > 0 ? `Aktuelle Wirkung: Markensuchen ca. <b>+${Math.round(t.brand * a.lift * c * 100)} %</b>${t.gen ? `, Gattungssuchen +${Math.round(t.gen * a.lift * c * 100)} %` : ''}` : 'Noch keine Wirkung'}</div>` : `<div class="small" style="margin-top:4px">${esc(a.report.verdict)}</div><div class="tiny muted">Umsetzungsqualität: ${f.pct0(a.q)} (erwartet ${f.pct0(a.qExp)}). Die Mehrumsatz-Schätzung vergleicht mit den 14 Tagen vor dem Start – Saison und Zufall verzerren sie.</div>`}</div></div>`;
      };
      const acts = (running.length ? running.map(actRow).join('') : '<div class="empty">Keine laufenden Aktionen.</div>') + (done.length ? `<h4 style="margin:14px 16px 6px">Abgeschlossen</h4>${done.slice(0, 8).map(actRow).join('')}` : '');
      const reqs = (st.requests || []).map((r) => { const p = st.staff.find((x) => x.id === r.pid); if (!p) return ''; return `<div class="callout warn"><b>💼 ${esc(p.name)} (${esc(MK.ROLES[p.role].name)})</b> hat ein Angebot eines Mitbewerbers und möchte <b>${f.eur0(r.amount)}</b> mehr pro Monat (neu ${f.eur0(p.cost + r.amount)}). Entscheidung bis ${U.fmtShort(U.dayToDate(S.startDate, r.until))} – ohne Entscheidung gilt es als abgelehnt.<div class="tipjump"><button class="btn sm primary" data-act="mixraise" data-id="${r.id}" data-v="1">Zustimmen</button><button class="btn sm" data-act="mixraise" data-id="${r.id}" data-v="0">Ablehnen (Kündigungsrisiko)</button></div></div>`; }).join('');
      return head + intro + reqs + stats + UI.card('Team & Dienstleister', team, { flush: true }) + UI.card('Marketing-Aktionen', acts, { flush: true })
        + '<div class="small muted">⚠ Unterschied zum echten Google Ads: Personal und Offline-Marketing gehören nicht zu Google Ads. Wirkungen, Kosten und Risiken sind Modellannahmen des Simulators. In der Praxis ist die Wirkung von Offline-Marketing auf Suchanfragen nur über Tests (z. B. Regionen-Vergleich) sauber messbar.</div>';
    },
  };

  ACT.mixraise = (el, d) => { const r = MK.decide(APP.S, d.id, d.v === '1'); UI.toast(r === 'left' ? 'Abgelehnt – die Person hat gekündigt' : d.v === '1' ? 'Gehaltserhöhung zugesagt' : 'Abgelehnt – die Person bleibt vorerst', r === 'left' ? 'bad' : 'good'); UI.render(true); };

  // ---------- Stelle besetzen ----------
  ACT.mixhire = () => {
    const S = APP.S;
    const taken = new Set(MK.state(S).staff.filter((p) => p.status === 'active').map((p) => p.role));
    const body = `<div class="small muted" style="margin-bottom:8px">Festanstellung wirkt voll und braucht Einarbeitung; Freelancer kosten ca. 45 % und wirken zu ca. 55 %. Recruiting-Gebühr bei Festanstellung: 25 % eines Monatsgehalts.</div><div class="ovcat">${Object.entries(MK.ROLES).map(([id, R]) => `<div class="ovopt" style="cursor:default"><span><b>${R.icon} ${esc(R.name)}</b><span class="small">${esc(R.desc)}</span><span class="small down">Risiko: ${esc(R.bad)}</span><span class="small muted">ab ca. ${f.eur0(R.salary * 0.9)}/Monat · Einarbeitung ${R.onboard} Tage</span><span class="tipjump">${taken.has(id) ? '<span class="pill good">besetzt</span>' : `<button class="btn sm primary" data-act="mixcands" data-r="${id}" data-m="fix">${R.agency ? 'Agenturen anfragen' : 'Festanstellung'}</button>${R.agency ? '' : `<button class="btn sm" data-act="mixcands" data-r="${id}" data-m="free">Freelancer</button>`}`}</span></span></div>`).join('')}</div>`;
    UI.modal('Stelle besetzen', body, { wide: true, footer: '<button class="btn" data-act="mclose">Schließen</button>' });
  };
  ACT.mixcands = (el, d) => {
    const S = APP.S, R = MK.ROLES[d.r];
    APP._cands = MK.candidates(S, d.r, d.m);
    const err = MK.hireCheck(S, Math.min(...APP._cands.map((c) => c.cost)));
    const body = `${err ? `<div class="callout bad">${esc(err)}</div>` : ''}<div class="small muted" style="margin-bottom:8px">Die Sterne sind Ihr <b>Eindruck</b> aus Gespräch und Unterlagen – die tatsächliche Leistung zeigt sich nach ca. 30 Tagen. Wer mehr verlangt, ist oft (nicht immer) besser.</div>
      ${APP._cands.map((c, i) => `<div class="mixcand"><div><b>${esc(c.name)}</b><div class="small">${stars(c.seen)} <span class="muted">Eindruck</span></div><div class="tiny muted">${c.notes.map(esc).join(' · ') || '–'}</div></div><div class="right"><b>${f.eur0(c.cost)}</b><div class="tiny muted">/Monat</div><button class="btn sm primary" data-act="mixhireone" data-i="${i}" ${err ? 'disabled' : ''}>Einstellen</button></div></div>`).join('')}`;
    UI.modal(`${R.icon} ${esc(R.name)} – ${d.m === 'free' ? 'Freelancer' : R.agency ? 'Agenturen' : 'Bewerbungen'}`, body, { footer: '<button class="btn" data-act="mixhire">← Zurück</button><button class="btn" data-act="mclose">Abbrechen</button>' });
  };
  ACT.mixhireone = (el, d) => {
    const S = APP.S, c = APP._cands[+d.i];
    const r = MK.hire(S, c);
    if (r !== true) { UI.toast(r, 'bad'); return; }
    UI.closeModal(); UI.toast(`${c.name} ist an Bord – Einarbeitung läuft`, 'good'); UI.render(true);
  };
  ACT.mixfire = (el, d) => {
    const S = APP.S, p = MK.state(S).staff.find((x) => x.id === d.id), R = MK.ROLES[p.role];
    const probation = S.day - p.start < 90 || p.mode === 'free' || R.agency;
    UI.confirm('Zusammenarbeit beenden?', `${esc(p.name)} (${esc(R.name)}) verlässt das Team. Einmalige Kosten: <b>${f.eur0(probation ? p.cost * 0.5 : p.cost * 1.5)}</b> (${probation ? 'Probezeit bzw. Kündigungsfrist' : 'Kündigungsfrist & Abfindung'}).`, () => { MK.fire(S, d.id); UI.toast('Zusammenarbeit beendet'); }, 'Beenden');
  };

  // ---------- Aktion planen ----------
  const draft = () => APP._mixDraft || (APP._mixDraft = { type: null, size: 'M', exec: 'agency', delay: 7 });
  ACT.mixplan = () => { const S = APP.S, d = draft(); if (!d.type || !MK.TYPES[d.type] || !(MK.TYPES[d.type].fit[S.ind] > 0)) d.type = MK.available(S).sort((a, b) => (b.fit[S.ind] || 0) - (a.fit[S.ind] || 0))[0].id; drawPlan(); };
  function drawPlan() {
    const S = APP.S, d = draft(), p = MK.plan(S, d), t = MK.TYPES[d.type];
    const brand = MK.brandCamps(S);
    const peakPct = Math.round(p.liftExp * 100);
    const bLimited = brand.some((c) => c.rt && c.rt.limited);
    const fitTxt = p.fit >= 0.85 ? '<span class="up">passt sehr gut zu Ihrer Branche</span>' : p.fit >= 0.55 ? 'passt ordentlich' : '<span class="down">passt schlecht zu Ihrer Branche – geringe Wirkung</span>';
    const ap = MK.approve(S, p.cost);
    const hints = [];
    if (!brand.length) hints.push(['bad', `Sie haben keine Markenkampagne. Die zusätzlichen Markensuchen (bis ca. +${peakPct} %) fängt dann das organische Ergebnis – oder ein Mitbewerber, der auf Ihre Marke bietet. Legen Sie vorher eine Markenkampagne an.`]);
    else if (bLimited) hints.push(['warn', `Ihre Markenkampagne ist schon jetzt durch das Budget eingeschränkt. Bei bis zu +${peakPct} % Markensuchen verpuffen viele Klicks – Budget für die Aktionsdauer anheben (Monatsbudget beachten).`]);
    else if (peakPct > 60) hints.push(['', `Markensuchen steigen voraussichtlich um bis zu ${peakPct} %. Planen Sie das Budget der Markenkampagne für ${t.dur} Tage mit.`]);
    if (d.exec === 'inhouse' && !MK.has(S, 'creative') && !MK.has(S, 'copy')) hints.push(['warn', 'Ohne Creative oder Texter im Team ist die Eigenumsetzung riskant (geringere Qualität, höheres Risiko).']);
    if (t.gen) hints.push(['', 'Die Aktion weckt auch Interesse an der Produktkategorie – davon profitieren Mitbewerber mit.']);
    if (t.brand * p.liftExp > 1.6 && !MK.has(S, 'dev')) hints.push(['warn', 'Starker Ansturm erwartet: Ohne Web-Entwickler/in droht Server-Überlast.']);
    if (p.tm.rel < 0.92) hints.push(['warn', `Timing: In der Aktionsmitte ist Nebensaison (Nachfrage ${f.pct0(p.tm.rel)} von heute).`]);
    if (p.tm.rel > 1.08) hints.push(['good', `Timing: Die Aktion fällt in eine nachfragestarke Phase (${f.pct0(p.tm.rel)} von heute).`]);
    if (d.type === 'sale') hints.push(['', `Kosten entstehen vor allem durch ${Math.round((1 - t.aov) * 100)} % niedrigere Preise während der Aktion; danach kaufen Kunden einige Wochen zögerlicher.`]);
    if (S.goals && G.GUIDE && G.GUIDE.ctx) { const cx = G.GUIDE.ctx(S); if (cx.mode === 'save') hints.push(['warn', 'Kurs „Budget sparen": Die Kosten belasten den Marketing-Deckungsbeitrag – prüfen Sie, ob die Aktion jetzt sinnvoll ist.']); if (cx.profitBehind) hints.push(['warn', 'Das Deckungsbeitragsziel liegt hinter Plan – die Aktion muss sich schnell rechnen.']); }
    const types = MK.available(S).map((x) => `<button class="mixtype ${x.id === d.type ? 'on' : ''}" data-act="mixset" data-k="type" data-v="${x.id}" title="${esc(x.desc)}"><span class="ico">${x.icon}</span><span class="t">${esc(x.name)}</span><span class="d">Passung ${'●'.repeat(Math.round((x.fit[S.ind] || 0) * 5))}${'○'.repeat(5 - Math.round((x.fit[S.ind] || 0) * 5))}</span></button>`).join('');
    const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(d[k]) === String(v) ? 'on' : ''}" data-act="mixset" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const body = `<div class="mixtypes">${types}</div><div class="small" style="margin-top:8px"><b>${t.icon} ${esc(t.name)}:</b> ${esc(t.desc)}</div>
      <div class="row" style="margin-top:14px;align-items:flex-end;flex-wrap:wrap;gap:16px">
        <div class="field"><span>Umfang</span>${seg('size', Object.entries(MK.SIZES).map(([k, v]) => [k, v.name]))}</div>
        <div class="field"><span>Umsetzung</span>${seg('exec', Object.entries(MK.EXEC).map(([k, v]) => [k, v.name]))}</div>
        <div class="field"><span>Start</span>${seg('delay', [[0, 'Sofort'], [7, 'In 7 Tagen'], [14, 'In 14 Tagen'], [28, 'In 4 Wochen']])}</div></div>
      <div class="grid g2" style="margin-top:12px"><div class="callout"><b>Prognose</b><dl class="kv" style="margin-top:6px">
        <dt>Kosten</dt><dd><b>${f.eur0(p.cost)}</b>${d.type === 'sale' ? ' + Preisnachlass' : ''}</dd>
        <dt>Laufzeit</dt><dd>${t.dur} Tage + ${t.tail} Tage Nachwirkung</dd>
        <dt>Passung</dt><dd>${fitTxt}</dd>
        <dt>Erwartete Qualität</dt><dd><div class="bar" style="height:8px;position:relative"><i style="width:${p.qHi * 100}%;background:color-mix(in srgb, var(--primary) 30%, transparent)"></i><i style="position:absolute;left:0;top:0;width:${p.qLo * 100}%"></i></div><span class="tiny">${f.pct0(p.qLo)}–${f.pct0(p.qHi)} (Unsicherheit)</span></dd>
        <dt>Markensuchen (Spitze)</dt><dd>ca. +${peakPct} %${t.gen ? `, Gattung +${Math.round(t.gen / t.brand * peakPct)} %` : ''}</dd>
        <dt>Risiko Rückschlag</dt><dd class="${p.risk > 0.06 ? 'down' : ''}">${f.pct(p.risk, 1)} – ${esc(MK.DISASTERS[t.disaster].name)}</dd>
        <dt>Freigabe</dt><dd>${p.needOk ? (ap.ok ? '<span class="up">GL-Freigabe erforderlich – wird erteilt</span>' : `<span class="down">${esc(ap.why)}</span>`) : 'nicht nötig'}</dd>
        <dt>Kasse danach</dt><dd class="${S.company.cash - p.cost < 0 ? 'down' : ''}">${f.eur0(S.company.cash - p.cost)}</dd></dl></div>
        <div>${hints.map(([c, h]) => `<div class="callout ${c}">${h}</div>`).join('') || '<div class="callout good">Keine besonderen Hinweise.</div>'}</div></div>`;
    UI.modal('Marketing-Aktion planen', body, { wide: true, saveLabel: `Beauftragen (${f.eur0(p.cost)})`, onSave: () => {
      const r = MK.launch(S, d);
      if (r !== true) { UI.toast(r, 'bad'); return false; }
      UI.toast(`${t.name} beauftragt`, 'good');
    } });
  }
  ACT.mixset = (el, d) => { const x = draft(); x[d.k] = d.k === 'delay' ? +d.v : d.v; drawPlan(); };
})();
