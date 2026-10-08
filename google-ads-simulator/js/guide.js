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
      if (val > 0) {
        const t = val / 100, adPer100 = 100 / t, dbPer100 = 100 * mg - adPer100;
        lines.push([`Ihr Ziel ${f.int(val)} % bedeutet`, `je 100 € Umsatz höchstens ${f.eur(adPer100)} Werbung${mg ? ` → Deckungsbeitrag ≈ <span class="${dbPer100 >= 0 ? 'up' : 'down'}">${f.eur(dbPer100)}</span> je 100 € Umsatz` : ''}`]);
        if (be && t < be) verdict = ['bad', 'Unter Break-even: Jeder Umsatz kostet mehr Werbung, als er an Rohertrag bringt.'];
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
      <button type="button" class="btn sm" data-act="glossmore" data-id="${det}" style="margin-top:8px">ⓘ Ausführlich erklärt</button></div>`;
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
        P.push({ id: 'bud_' + c.id, sev: prof ? 'warn' : 'info', views: ['campaigns', 'overview'], title: `${esc(c.name)}: Eingeschränkt durch Budget`, why: `Sie verpassen ${f.pct0(m.lostB)} der möglichen Impressionen wegen Budget. Deckungsbeitrag (gemessen, 30 T): ${f.eur(m.gp)}.`, steps: prof ? ['Die Kampagne ist profitabel – Budget schrittweise erhöhen (z. B. +20 %)', 'Monatsbudget der Geschäftsleitung im Blick behalten', 'Nach 1 Woche prüfen, ob Deckungsbeitrag mitwächst'] : ['Die Kampagne ist nicht profitabel – Budget NICHT erhöhen', 'Gebote bzw. Zielwerte senken → mehr, aber günstigere Klicks', 'Streuverluste über Suchbegriffe ausschließen'], fix: [btn('Kampagne bearbeiten', 'editcampaign', { id: c.id })] });
      }
      if (c.rt && c.rt.limitedTarget) P.push({ id: 'tgt_' + c.id, sev: 'warn', views: ['campaigns', 'overview'], title: `${esc(c.name)}: Eingeschränkt durch Ziel`, why: 'Ihr Ziel-CPA ist zu niedrig bzw. Ziel-ROAS zu hoch – Smart Bidding findet kaum Auktionen, die das Ziel erfüllen. Das Budget wird nicht ausgegeben.', steps: ['Kampagne bearbeiten', c.bidStrategy.type === 'troas' ? 'Ziel-ROAS um 10–15 % senken (der Rechner im Formular zeigt Ist-Wert und Break-even)' : 'Ziel-CPA um 10–15 % erhöhen (Ist-Wert im Formular)', 'Lernphase von ca. 5 Tagen abwarten'], fix: [btn('Zielwert anpassen', 'editcampaign', { id: c.id })] });
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
