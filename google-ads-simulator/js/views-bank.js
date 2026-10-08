/* Ads Simulator – Bank-Modus: Ansicht „Konditionen & Zinsen" (Konditionen, Marktvergleich, Einlagenbuch, Funnel) */
(function () {
  const G = globalThis.GA;
  const U = G.U, M = G.M, E = G.E, C = G.C, R = G.R, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP, B = G.BANK;
  const f = U.fmt, esc = U.esc, I = E.I;
  const pct = (x) => (x === null || x === undefined ? '–' : f.num2(x) + ' %');
  const mio = (x) => (Math.abs(x) >= 1e6 ? f.num2(x / 1e6) + ' Mio. €' : f.eur0(x));

  function nextEcb(S) {
    const iso = U.toISO(M.today(S));
    const n = B.ECB.find(([d]) => d >= iso);
    return n ? U.fmtDate(U.parseISO(n[0]), false) : '–';
  }

  V.conditions = {
    render() {
      const S = APP.S, b = S.bank, o = b.own, m = B.market(S), mult = B.cvrMults(S);
      const [a, z] = UI.rng();
      const fl = B.emptyFlow();
      for (let d = a; d <= z; d++) { const x = b.flows[d]; if (x) for (const k in fl) fl[k] += x[k]; }
      const tgBook = U.sum(b.book.tg, (c) => c.amt), fgBook = U.sum(b.book.fg, (c) => c.amt);
      const acct = UI.m('acct', 'all');
      const newVol = fl.inTG + fl.inFG;
      const opened = fl.nTG + fl.nFG + fl.nGiro + fl.nVisa;
      const tile = (l, v, s) => `<div class="card"><div class="stat"><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${s}</div></div></div>`;
      const stats = `<div class="grid g4">${tile('EZB-Einlagesatz', pct(b.ref), 'Nächster Zinsentscheid: ' + nextEcb(S))}${tile('Einlagenbestand (SEA)', mio(tgBook + fgBook), `Tagesgeld ${mio(tgBook)} · Festgeld ${mio(fgBook)}`)}${tile('Neuvolumen im Zeitraum', mio(newVol), `Abflüsse ${mio(fl.outTG + fl.outFG)} · netto ${mio(newVol - fl.outTG - fl.outFG)}`)}${tile('Kosten je 1.000 € Neuvolumen', newVol ? f.eur(acct.cost / newVol * 1000) : '–', `${opened} Konten eröffnet · ${f.eur0(U.div(acct.cost, opened))} je Konto`)}</div>`;

      // Eigene Konditionen
      const inp = (name, val, step = '0.05', w = 90) => `<input type="number" step="${step}" name="${name}" id="bk-${name}" value="${val}" style="width:${w}px">`;
      const form = `<div class="tablewrap" id="bankform"><table class="t"><tbody>
        <tr><td><b>Tagesgeld Business</b> – Basiszins (variabel)</td><td>${inp('tgBase', o.tgBase)} % p. a.</td><td class="wrap small muted">Refinanzierungswert ${pct(B.altTG(S))} → Marge ${pct(B.altTG(S) - o.tgBase)}</td></tr>
        <tr><td>Neukunden-Aktionszins</td><td>${inp('tgPromo', o.tgPromo)} % für ${inp('tgPromoM', o.tgPromoM, '1', 60)} Monate</td><td class="wrap small muted">0 = keine Aktion. Effektiv 12 Monate: ${pct(B.eff12(o))}</td></tr>
        ${[3, 6, 12, 24].map((t) => `<tr><td><b>Festgeld Business</b> ${t} Monate</td><td>${inp('fg' + t, o.fg[t])} % p. a.</td><td class="wrap small muted">Kapitalmarkt-Refinanzierung ${pct(B.altFG(S, t))} → Marge ${pct(B.altFG(S, t) - o.fg[t])}</td></tr>`).join('')}
        <tr><td><b>Geschäftskonto</b> Kontoführung</td><td>${inp('giroFee', o.giroFee, '0.5')} € / Monat</td><td class="wrap small muted">Markt-Median ${f.eur(m.giroMed)} (Annahme: Produkt neu im Portfolio)</td></tr>
        <tr><td><b>Visa Business</b> Jahresgebühr</td><td>${inp('visaFee', o.visaFee, '1')} € / Jahr</td><td class="wrap small muted">Markt-Median ${f.eur(m.visaMed)} · Interchange-Ertrag ca. 0,8 % des Umsatzes</td></tr>
      </tbody></table></div><div style="margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn primary" data-act="banksave">Konditionen speichern</button><span class="small muted">Achtung: Anzeigen mit alten Zinsangaben werden nach ca. 2 Tagen wegen irreführender Preisangabe abgelehnt.</span></div>`;
      const pos = (x) => (x >= 1.15 ? UI.pill(['sehr attraktiv', 'good']) : x >= 0.9 ? UI.pill(['marktgerecht', 'info']) : x >= 0.6 ? UI.pill(['unter Markt', 'warn']) : UI.pill(['nicht wettbewerbsfähig', 'bad']));
      const posCard = `<dl class="kv"><dt>Tagesgeld</dt><dd>${pos(mult.tagesgeld)} <span class="small muted">Conv.-Effekt ×${f.num2(mult.tagesgeld)}</span></dd><dt>Festgeld</dt><dd>${pos(mult.festgeld)} <span class="small muted">×${f.num2(mult.festgeld)}</span></dd><dt>Geschäftskonto</dt><dd>${pos(mult.giro)} <span class="small muted">×${f.num2(mult.giro)}</span></dd><dt>Visa Business</dt><dd>${pos(mult.visa)} <span class="small muted">×${f.num2(mult.visa)}</span></dd></dl><div class="small muted" style="margin-top:8px">Vergleichsmaßstab: oberes Quartil der effektiven 12-Monats-Zinsen der Mitbewerber (Institute ohne gesetzliche Einlagensicherung mit Abschlag).</div>`;

      // Marktvergleich
      const rows = S.competitors.filter((c) => c.rates).map((c) => ({ id: c.id, name: c.name, kind: c.kind, active: c.active, r: c.rates }));
      rows.push({ id: '_own', name: S.company.brand + ' (Sie)', kind: 'Autobank', active: true, r: { ...o, insured: true }, own: true });
      const mt = UI.table('bankmkt', [
        { k: 'name', l: 'Anbieter', f: (r) => (r.own ? `<b>${esc(r.name)}</b>` : esc(r.name) + (r.active ? '' : ' <span class="tag">inaktiv</span>')) + `<div class="tiny muted">${esc(r.kind || '')}</div>`, sort: (r) => r.name },
        { k: 'promo', l: 'TG Aktionszins', num: true, f: (r) => (r.r.tgPromo ? `${pct(r.r.tgPromo)} <span class="small muted">/${r.r.tgPromoM} M</span>` : '–'), sort: (r) => r.r.tgPromo || 0 },
        { k: 'base', l: 'TG danach/Basis', num: true, f: (r) => pct(r.r.tgBase), sort: (r) => r.r.tgBase },
        { k: 'eff', l: 'TG effektiv 12 M', num: true, f: (r) => `<b>${pct(B.eff12(r.r))}</b>`, sort: (r) => B.eff12(r.r) },
        { k: 'fg', l: 'FG 12 M', num: true, f: (r) => (r.r.fg ? pct(r.r.fg[12]) : '–'), sort: (r) => (r.r.fg ? r.r.fg[12] : 0) },
        { k: 'giro', l: 'Konto €/Monat', num: true, f: (r) => (r.r.giroFee === null || r.r.giroFee === undefined ? '–' : f.eur(r.r.giroFee)), sort: (r) => r.r.giroFee ?? 99 },
        { k: 'visa', l: 'Visa €/Jahr', num: true, f: (r) => (r.r.visaFee === null || r.r.visaFee === undefined ? '–' : f.eur(r.r.visaFee)), sort: (r) => r.r.visaFee ?? 999 },
        { k: 'ins', l: 'Einlagensicherung', f: (r) => (r.r.insured ? '✓ gesetzlich' : '<span class="down">✗ E-Geld-Institut</span>'), sort: (r) => (r.r.insured ? 1 : 0) },
      ], rows, { defaultSort: { k: 'eff', dir: 'desc' } });

      // Funnel
      const clk = acct.clk;
      const funnel = [['Klicks', clk], ['Anträge abgeschickt', fl.apps], ['davon Privatkunden (abgelehnt)', fl.rejects], ['Konten eröffnet', opened]];
      const fun = `<div class="tablewrap"><table class="t"><tbody>${funnel.map(([l, v], i) => `<tr><td>${l}</td><td class="num"><b>${f.int(v)}</b></td><td class="num small muted">${i === 1 ? f.pct(U.div(v, clk)) + ' der Klicks' : i === 2 ? f.pct(U.div(v, fl.apps), 0) + ' der Anträge' : i === 3 ? f.pct(U.div(v, fl.apps - fl.rejects), 0) + ' der Geschäftskunden-Anträge' : ''}</td></tr>`).join('')}
        <tr><td>Kosten für abgelehnte Anträge</td><td class="num">${f.eur0(fl.rejectCost)}</td><td></td></tr><tr><td>KYC-/Eröffnungskosten</td><td class="num">${f.eur0(fl.kyc)}</td><td></td></tr>
        <tr><td>Zinsüberschuss + Gebühren</td><td class="num"><b>${f.eur0(fl.nii + fl.fees)}</b></td><td class="num small muted">Werbekosten ${f.eur0(acct.cost)}</td></tr></tbody></table></div>
        <div class="small muted" style="margin-top:8px">Google Ads sieht standardmäßig nur „Antrag abgeschickt" – auch Privatkunden-Anträge, die später abgelehnt werden. Erst der Offline-Import liefert echte Eröffnungen und Anlagevolumen als Conversion-Wert.</div>`;

      // Status-Karten
      const off = b.offline, vf = b.verify;
      const offTxt = off.status === 'on' ? UI.pill(['Aktiv', 'good']) + ' <span class="small muted">Aktion „Konto eröffnet" kann jetzt primär gesetzt werden (Conversions)</span>' : off.status === 'setup' ? UI.pill(['Einrichtung läuft', 'learn']) + ` <span class="small muted">bereit in ${off.readyDay - S.day} T</span>` : UI.pill(['Nicht eingerichtet', 'warn']) + ' <button class="btn sm" data-act="bankoffline">CRM-Anbindung beauftragen (2.500 €, 7 Tage)</button>';
      const vfTxt = vf.status === 'verified' ? UI.pill(['Verifiziert', 'good']) : vf.status === 'pending' ? UI.pill(['In Prüfung', 'learn']) + ` <span class="small muted">noch ca. ${Math.max(0, vf.readyDay - S.day)} T</span>` : vf.status === 'required' ? UI.pill(['Erforderlich', 'bad']) + ` <span class="small muted">Frist: ${vf.deadline - S.day} T</span> <button class="btn sm" data-act="bankverify">Unterlagen einreichen</button>` : UI.pill(['Gesperrt – keine Auslieferung', 'bad']) + ' <button class="btn sm" data-act="bankverify">Verifizierung nachholen</button>';
      const status = `<dl class="kv"><dt>Offline-Conversion-Import</dt><dd>${offTxt}</dd><dt>Finanzdienstleister-Verifizierung</dt><dd>${vfTxt}</dd><dt>Bestand Geschäftskonten</dt><dd>${f.int(b.book.giro.n)} · Ø-Guthaben gesamt ${mio(b.book.giro.bal)}</dd><dt>Bestand Visa Business</dt><dd>${f.int(b.book.visa.n)}</dd></dl>`;

      // Charts
      const h = b.hist.slice(-240);
      const labels = h.map((x) => U.fmtShort(U.dayToDate(S.startDate, x.day)));
      const rateChart = h.length > 1 ? C.line({ labels, height: 220, series: [
        { name: 'EZB-Einlagesatz', color: C.SERIES[1], values: h.map((x) => x.ref), fmt: pct, axisFmt: (x) => f.num2(x) + '%' },
        { name: 'Ihr Tagesgeld', color: C.SERIES[0], values: h.map((x) => x.ownTG), fmt: pct, axisFmt: (x) => f.num2(x) + '%' },
        { name: 'Markt Tagesgeld (eff., oberes Quartil)', color: C.SERIES[2], values: h.map((x) => x.mktTG), fmt: pct, dash: true, axisFmt: (x) => f.num2(x) + '%' },
        { name: 'Ihr Festgeld 12 M', color: C.SERIES[3], values: h.map((x) => x.ownFG12), fmt: pct, axisFmt: (x) => f.num2(x) + '%' },
      ] }) : '<div class="empty">Simulieren Sie einige Tage.</div>';
      const bookChart = h.length > 1 ? C.line({ labels, height: 220, series: [
        { name: 'Tagesgeld-Bestand', color: C.SERIES[0], values: h.map((x) => x.tg), fmt: mio, area: true, axisFmt: (x) => f.compact(x) },
        { name: 'Festgeld-Bestand', color: C.SERIES[3], values: h.map((x) => x.fg), fmt: mio, axisFmt: (x) => f.compact(x) },
      ] }) : '';

      return UI.head('Konditionen & Zinsen', '', { noScope: true })
        + '<div class="callout">Bank-Modus: Ihr eigentlicher Erfolg ist das <b>Einlagenvolumen</b> und dessen Marge gegenüber der Refinanzierungsalternative, nicht die Zahl der Anträge. Zinsen, EZB-Entscheide und Aktionszinse der Mitbewerber bestimmen die Abschlussquote. Konditionen von Geschäftskonto und Visa Business sind Annahmen.</div>'
        + stats
        + `<div class="grid g21"><div>${UI.card('Ihre Konditionen', form)}</div><div>${UI.card('Wettbewerbsposition', posCard)}${UI.card('Status', status)}</div></div>`
        + UI.card('Marktvergleich (simulierte Mitbewerber)', mt, { flush: true })
        + `<div class="grid g2"><div>${UI.card('Zinsentwicklung', rateChart)}</div><div>${UI.card('Einlagenbestand aus SEA', bookChart || '<div class="empty">–</div>')}</div></div>`
        + UI.card('Funnel & Wirtschaftlichkeit im Zeitraum', fun);
    },
  };

  ACT.banksave = () => {
    const S = APP.S, root = document.getElementById('bankform');
    const n = (k) => { const v = UI.num(k, root); return v === null ? null : Math.round(v * 100) / 100; };
    const own = { tgBase: n('tgBase'), tgPromo: n('tgPromo') || 0, tgPromoM: Math.round(n('tgPromoM') || 0), fg: { 3: n('fg3'), 6: n('fg6'), 12: n('fg12'), 24: n('fg24') }, giroFee: n('giroFee'), visaFee: n('visaFee') };
    const rates = [own.tgBase, own.fg[3], own.fg[6], own.fg[12], own.fg[24], own.tgPromo];
    if (rates.some((v) => v === null || v < 0 || v > 15)) { UI.toast('Bitte gültige Zinssätze zwischen 0 und 15 % eingeben', 'bad'); return; }
    if ([own.giroFee, own.visaFee].some((v) => v === null || v < 0 || v > 500)) { UI.toast('Bitte gültige Entgelte eingeben', 'bad'); return; }
    if (own.tgPromo && (own.tgPromo <= own.tgBase || own.tgPromoM < 1 || own.tgPromoM > 12)) { UI.toast('Aktionszins muss über dem Basiszins liegen und 1–12 Monate laufen', 'bad'); return; }
    const ch = B.setOwn(S, own);
    UI.toast(ch.length ? 'Konditionen gespeichert: ' + ch.length + ' Änderung(en)' : 'Keine Änderungen');
    UI.render(true);
  };
  ACT.bankoffline = () => UI.confirm('Offline-Conversion-Import einrichten?', 'Ihr CRM überträgt eröffnete Konten inkl. Anlagevolumen per GCLID an Google Ads. Kosten: 2.500 €, Einrichtung ca. 7 Tage. Danach können Sie auf echte Kontoeröffnungen und deren Wert bieten.', () => { B.startOffline(APP.S); UI.toast('Einrichtung beauftragt', 'good'); }, 'Beauftragen');
  ACT.bankverify = () => { if (B.submitVerify(APP.S)) UI.toast('Unterlagen eingereicht – Prüfung dauert 1–2 Wochen', 'good'); UI.render(); };

  // Conversions: Offline-Aktion erst nach Einrichtung aktivierbar
  const origToggle = ACT.toggleconv;
  ACT.toggleconv = (el, d) => {
    const S = APP.S, ca = M.byId(S.convActions, d.id);
    if (ca.requiresImport && S.bank && S.bank.offline.status !== 'on') { UI.toast('Erst den Offline-Conversion-Import einrichten (Konditionen & Zinsen)', 'bad'); return; }
    origToggle(el, d);
  };

  // Empfehlungen ergänzen
  const origCompute = R.compute;
  R.compute = function (S) {
    const out = origCompute(S);
    if (!S.bank) return out;
    const push = (r) => { const dis = S.dismissed[r.id]; if (dis === undefined || S.day - dis > 30) out.push(r); };
    if (S.bank.offline.status === 'off') push({ id: 'bank_offline', cat: 'Messung', icon: '🔁', impact: 12, title: 'Offline-Conversions importieren', desc: 'Google Ads optimiert aktuell auf abgeschickte Anträge – inklusive abgelehnter Privatkunden. Importieren Sie eröffnete Konten mit Anlagevolumen aus dem CRM.', view: 'conditions' });
    if (S.bank.verify.status === 'required' || S.bank.verify.status === 'suspended') push({ id: 'bank_verify', cat: 'Konto', icon: '🛂', impact: 25, title: 'Finanzdienstleister-Verifizierung abschließen', desc: 'Ohne Verifizierung werden Finanzanzeigen gestoppt.', view: 'conditions' });
    const nonB2B = S.ads.filter((a) => a.type === 'rsa' && a.status === 'enabled' && !B.isB2B(a));
    if (nonB2B.length) push({ id: 'bank_b2b_' + nonB2B.length, cat: 'Keywords & Anzeigen', icon: '🏢', impact: 4, title: 'Zielgruppe im Anzeigentext nennen', desc: `${nonB2B.length} Anzeige(n) erwähnen nicht, dass sich das Angebot an Geschäftskunden richtet. Privatkunden klicken und stellen Anträge, die abgelehnt werden.`, view: 'ads' });
    return out.sort((a, b) => b.impact - a.impact);
  };
})();
