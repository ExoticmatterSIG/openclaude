/* Ads Simulator – Einstellungen › Simulationskriterien: alle Regeln, Formeln und Parameter offengelegt (live aus den Spieldaten) */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, UI = G.UI, V = G.V, APP = G.APP;
  const f = U.fmt, esc = U.esc;
  const pct = (x) => (x >= 1 ? '+' : '') + Math.round((x - 1) * 100) + ' %';
  const tbl = (head, rows) => `<div class="tablewrap"><table class="t"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td class="wrap">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const sec = (id, title, body) => `<details class="crit" ${APP._critOpen && APP._critOpen.has(id) ? 'open' : ''} data-crit="${id}"><summary>${title}</summary><div class="crit-body">${body}</div></details>`;
  const fx2 = (fx) => Object.entries(fx || {}).map(([k, v]) => (typeof v === 'object' ? Object.entries(v).map(([t, m]) => `${t} ${pct(m)}`).join(', ') : `${{ demand: 'Nachfrage', cvr: 'Conv.-Rate', cpc: 'CPC-Niveau', compAggr: 'Bietdruck', aov: 'Warenkorb', ctr: 'CTR', compBudget: 'Budgets Mitbewerber', playerCvr: 'Ihre Conv.-Rate' }[k] || k} ${pct(v)}`)).join(' · ') || '–';

  function criteria() {
    const S = APP.S, ind = M.ind(S), diff = M.DIFFICULTY[S.settings.difficulty];
    const a = S.account;
    const out = [];
    out.push(`<div class="callout">Hier sehen Sie, nach welchen Regeln der Simulator rechnet – direkt aus den Daten Ihres Spielstands (Branche: <b>${esc(ind.name)}</b>, Schwierigkeit: <b>${esc(diff.name)}</b>). Alle Zahlen sind Modellannahmen, die plausible Größenordnungen abbilden; Google veröffentlicht seine Algorithmen nicht. Bereiche lassen sich aufklappen.</div>`);

    out.push(sec('day', '1. Ablauf eines simulierten Tages', `<ol>
      <li><b>Markt aktualisieren:</b> Marktnachfrage, CPC-Niveau, Kauflaune und Themen-Trends bewegen sich als Zufallsprozesse mit Rückkehr zum Mittel; das Wetter folgt einem eigenen Zufallsprozess.</li>
      <li><b>Ereignisse:</b> Zufallsereignisse starten mit ihrer Tageswahrscheinlichkeit × Schwierigkeitsfaktor ${diff.events}; jedes bekommt eine zufällige <b>Stärke</b> (0,4–2,2, log-normal), die seine Effekte skaliert. Dazu kommen Kalender (Saison, Feiertage, Brückentage, Turniere).</li>
      <li><b>Nachfrage je Suchbegriff</b> berechnen (Abschnitt 2).</li>
      <li><b>Auktionen:</b> Die Suchen werden auf ${ind.hours === 'b2b' ? 'Geschäftszeiten-lastige' : 'branchentypische'} Stunden, Geräte, Bundesländer, Alter und Geschlecht verteilt; pro Stunde und Suchbegriff laufen gebündelte Teilauktionen (Abschnitt 3).</li>
      <li><b>Klicks & Conversions</b> mit Klick- und Conversion-Wahrscheinlichkeiten (Abschnitte 4 und 5); Conversions werden verzögert gemeldet und nur teilweise gemessen (Abschnitt 7).</li>
      <li><b>Smart Bidding lernt</b> aus den gemessenen Conversions; Mitbewerber passen Gebote und Budgets an.</li>
      <li><b>Team & Marketing-Aktionen</b> wirken; Personalkosten werden gebucht.</li>
      <li><b>Tagesabschluss:</b> GuV und Kasse, Markenbekanntheit, Bewertungen, Geschäftsleitung (Ziele, Vertrauen, Sanktionen).</li></ol>`));

    out.push(sec('demand', '2. Suchvolumen (Nachfrage)', `<p class="mono small">Suchen/Tag = Monatsvolumen ÷ 30,4 × Branchensaison × Themensaison × Wochentag × Marktnachfrage × Ereignis-/Kalenderfaktoren × Themen-Trend × Themen-Ereignisse × Wetter × Zufall (log-normal, σ = 12 %)</p>
      <ul><li><b>Wochentage</b> (Mo–So): ${ind.dow.map((x) => f.num2(x)).join(' · ')}</li>
      <li><b>Branchensaison</b> (Jan–Dez): ${ind.season.map((x) => f.num2(x)).join(' · ')}</li>
      <li><b>Markensuchen</b> = Basisvolumen × ${S.bank ? '1 (Bank: etablierte Marke)' : '(0,4 + Markenbekanntheit × 10)'} + Rückkehrer aus früheren Anzeigenklicks, × Markenfaktoren (Influencer, Marketing-Aktionen, Social Media, Shitstorms). Aktuelle Bekanntheit: <b>${f.pct(S.company.awareness, 1)}</b>.</li>
      <li><b>Bekanntheit</b> wächst durch Display-/Video-Reichweite und Klicks, Marketing-Aktionen und Social Media und verfällt täglich um 0,35 %.</li>
      <li><b>Wetter</b> (aktuell ${S.market.weather > 0.5 ? 'regnerisch' : S.market.weather < -0.5 ? 'sonnig' : 'durchwachsen'}, Index ${f.num2(S.market.weather || 0)}): Regen steigert Online-Nachfrage in Mode, Fitness und Software um 2,5 % je Indexpunkt, in Reisen um 3 %; bei Kälte + Regen steigen Notdienst-Suchen (Heizung, Sanitär).</li>
      <li><b>Suchbegriffe</b> entstehen aus Themen-Keywords × Modifikatoren (z. B. „kaufen", „günstig", „kostenlos", „jobs") mit eigener Kaufabsicht und eigenem CPC-Niveau.</li></ul>`));

    out.push(sec('auction', '3. Auktion, Ad Rank & Klickpreis', `<p class="mono small">Ad Rank = Gebot × Qualitätsfaktor-Wert × Asset-Faktor × Relevanz<sup>0,3</sup> × Zufall (log-normal, σ = 16 %) · Qualitätsfaktor-Wert = (QF + 2) ÷ 12</p>
      <ul><li><b>Teilnehmer:</b> Ihre Kampagnen, die Mitbewerber (Abschnitt 8) und eine Zahl weiterer Hintergrund-Bieter (Poisson, Ø ${ind.bgDensity || 3} je Auktion; bei Markensuchen Ø 0,4).</li>
      <li><b>Mindestschwelle:</b> Ad Rank ≥ 14 % des Basis-CPC des Suchbegriffs, sonst keine Anzeige. <b>Oben</b> (max. 4 Plätze): Ad Rank ≥ 42 % des Basis-CPC.</li>
      <li><b>Tatsächlicher CPC</b> = min(Gebot, Gebot × Ad Rank des Nächsten ÷ eigener Ad Rank + 0,01 €) – Zweitpreis-Prinzip.</li>
      <li><b>Smart Bidding</b> bietet je Auktion: Ziel-CPA → erwartete Conv.-Rate × Ziel-CPA; Ziel-ROAS → erwartete Conv.-Rate × erwarteter Wert ÷ Ziel-ROAS; Conversions/Wert maximieren → mit einem Schattenpreis, der das Budget ausschöpft. Die Schätzung der Conv.-Rate hat einen Fehler, der mit mehr Daten sinkt; Lernphasen: 7 Tage (Strategiewechsel), 5 (Zieländerung > 20 %), 3 (Budget > 50 %).</li>
      <li><b>Gebotsanpassungen</b> (Gerät, Ort, Zeit, Zielgruppe, Demografie) wirken bei manuellen Geboten multiplikativ; −100 % schließt aus.</li>
      <li><b>Shopping/PMax</b> haben eigene Auktionen mit Feed-Qualität (GTIN, Bild, Titel) und Preis-Wettbewerbsfähigkeit.</li></ul>`));

    out.push(sec('ctr', '4. Klickrate (CTR)', `<p class="mono small">CTR = Basis-CTR (${f.pct(ind.baseCtr, 1)}) × Positionsfaktor × Kaufabsicht-Faktor × Markenfaktor × Relevanz<sup>0,5</sup> × Anzeigenstärke-Faktor × Assets × Gerät × Ereignisse × Bekanntheit × Zielgruppen × Psychologie & Sterne × Creative-Ermüdung (max. 60 %)</p>
      <ul><li><b>Position:</b> oben deutlich höher als unten (Platz 1 am höchsten).</li>
      <li><b>Markensuchen:</b> eigene Marke × 4,5; Marke eines Mitbewerbers × 0,35.</li>
      <li><b>Anzeigenstärke:</b> Faktor 0,82 (Schlecht) bis 1,18 (Sehr gut) – Simulator-Annahme.</li>
      <li><b>Assets:</b> ${Object.values(D.ASSET_TYPES).map((x) => `${x.name} +${Math.round(x.ctr * 100)} %`).join(', ')} (oben voll, unten zu 25 %).</li>
      <li><b>Geräte:</b> ${D.DEVICES.map((d) => `${d.name} ${f.num2(ind.devices[d.id].ctr)}`).join(', ')}.</li>
      <li><b>Bekanntheit:</b> × (1 + Bekanntheit × 0,6).</li>
      <li><b>Creative-Ermüdung:</b> Suchanzeigen verlieren bis 14 %, Display bis 42 %, Video bis 38 % Wirkung mit zunehmender Auslieferung; Bearbeiten oder ein Creative im Team frischt auf.</li>
      <li><b>Team:</b> Texter/in ± bis 3,6 %, Creative ± bis 1,3 %; Ideen und Fehler wirken zeitweise.</li></ul>`));

    out.push(sec('cvr', '5. Conversion-Rate & Umsatz', `<p class="mono small">Conv.-Rate = Basis (${f.pct(ind.baseCvr, 1)}) × Kaufabsicht × Bundesland × Gerät × Alter × Geschlecht × Tageszeit × Zielgruppen-Lift (max. 3) × Kauflaune × Ereignisse × Themen-Ereignisse × Preisposition × Ihre Ereignisfaktoren × Landingpage × Psychologie/Shop-Hebel × Markenfaktor (eigene Marke × ${S.bank ? '1' : '2,6'})</p>
      <ul><li><b>Warenkorb:</b> Ø ${f.eur(ind.aov)} (log-normal, σ = ${f.num2(ind.aovSigma)}), Marge ${f.pct0(ind.margin)}${ind.returns ? `, Retourenquote ${f.pct0(ind.returns)}` : ''}.</li>
      <li><b>Geräte:</b> ${D.DEVICES.map((d) => `${d.name} ${f.num2(ind.devices[d.id].cvr)}`).join(', ')}.</li>
      <li><b>Zielgruppen:</b> kaufbereite Segmente × 1,45, Interessen × 1,08, Lebensereignisse × 1,18, Remarketing/Kundenlisten deutlich höher (z. B. Warenkorbabbrecher × 3,1).</li>
      <li><b>Landingpage-Wert</b> = Relevanz × 0,55 + Ladezeit × 0,3 + Mobil 0,15; ein Serverausfall setzt ihn auf 0.</li>
      <li><b>Wiederkäufe</b> bringen späteren Umsatz ohne Klickkosten; <b>organische Markenconversions</b> entstehen aus Markensuchen ohne Anzeige.</li></ul>`));

    out.push(sec('qs', '6. Qualitätsfaktor', `<p class="mono small">QF = 1 + Erwartete CTR (0 / 1,75 / 3,5) + Anzeigenrelevanz (0 / 1 / 2) + Landingpage (0 / 1,75 / 3,5)</p>
      <ul><li><b>Erwartete CTR:</b> Verhältnis Ihrer CTR zur erwarteten CTR – überdurchschnittlich ab 1,12, durchschnittlich ab 0,9.</li>
      <li><b>Anzeigenrelevanz:</b> Anteil der Keyword-Wörter in Anzeigentiteln/-texten der Gruppe – überdurchschnittlich ab 0,75, durchschnittlich ab 0,45.</li>
      <li><b>Landingpage:</b> überdurchschnittlich ab 0,7, durchschnittlich ab 0,48.</li></ul>`));

    out.push(sec('measure', '7. Messung & Attribution', `<ul><li><b>Messquote</b> = Zustimmungsrate (${f.pct0(a.consentRate)}) + bei Consent Mode (erweitert) 70 % der Lücke modelliert + 5 % durch erweiterte Conversions; ohne automatisches Tagging × 0,55; bei Tracking-Ausfall 0. Aktuell: Consent Mode ${a.consentMode === 'advanced' ? 'erweitert' : 'einfach'}, erweiterte Conversions ${a.enhancedConv ? 'an' : 'aus'}, Tagging ${a.autoTagging ? 'an' : 'aus'}, Tracking ${a.trackingOk ? 'funktioniert' : 'ausgefallen'}.</li>
      <li><b>Verzögerung</b> (Anteil der Conversions je Tag nach dem Klick): ${ind.lag.map((x, i) => `${i}T ${Math.round(x * 100)} %`).join(', ')}.</li>
      <li><b>Ungültige Klicks:</b> Basis ${f.pct(a.invalidRate, 1)} der Klicks (bei Klickbetrug höher), werden nicht berechnet.</li>
      <li><b>Attribution:</b> ${a.attribution === 'dda' ? 'Datengetrieben: bis zu 25 % des Werts gehen an Display/Video/Demand Gen mit Sichtkontakt' : 'Letzter Klick'}.</li></ul>`));

    out.push(sec('comp', '8. Mitbewerber', `<p>Jeder Mitbewerber hat Budget, Qualitätsfaktor, Bietaggressivität, Kasse und ein Strategieprofil. Er reagiert auf Ihre Position (wer dauerhaft oben steht, provoziert Gegenreaktionen), auf CPC-Niveau und Rentabilität, kann pausieren, zurückkehren oder pleitegehen; Neulinge steigen mit Risikokapital ein.</p>
      ${tbl(['Mitbewerber', 'Profil', 'Tagesbudget', 'QF', 'Aggressivität', 'Status'], S.competitors.map((c) => [esc(c.name), esc({ aggressive: 'wachstumsgetrieben', profit: 'renditeorientiert', budget: 'budgetgetrieben', brand: 'Markenverteidiger', erratic: 'sprunghaft', marketplace: 'Marktplatz' }[c.style] || c.style), f.eur0(c.budget), String(c.qs), f.num2(c.aggr), c.active ? 'aktiv' : 'inaktiv']))}`));

    out.push(sec('budget', '9. Budget & Pacing', `<ul><li>Tagesbudget = Durchschnitt: an einzelnen Tagen bis 2×, im Kalendermonat max. 30,4 × Tagesbudget.</li><li>Das Budget wird über eine Teilnahmewahrscheinlichkeit je Stunde verteilt; reicht es nicht, entstehen verlorene Impressionen (Budget).</li><li>„Eingeschränkt durch Budget": mehr als 10 % der möglichen Impressionen wegen Budget verloren (7 Tage).</li><li>„Eingeschränkt durch Ziel": Smart Bidding gibt < 40 % des Budgets aus und erreicht < 35 % der möglichen Impressionen.</li></ul>`));

    const evRows = D.RANDOM_EVENTS.filter((e) => (!e.industries || e.industries.includes(S.ind)) && !(e.notIndustries || []).includes(S.ind)).map((e) => [esc(e.name.replace('{comp}', 'Mitbewerber').replace('{theme}', 'Thema')), `${(e.p * diff.events * 100).toFixed(2)} %`, e.dur[0] === e.dur[1] ? (e.dur[0] >= 999 ? 'bis behoben' : e.dur[0] + ' T') : `${e.dur[0]}–${e.dur[1]} T`, { crit: '<span class="down">kritisch</span>', warn: 'Warnung', info: 'Info/Chance' }[e.sev], esc(e.desc.replace(/\{comp\}/g, 'Ein Mitbewerber').replace(/\{theme\}/g, 'ein Thema'))]);
    out.push(sec('events', '10. Zufallsereignisse', `<p>Wahrscheinlichkeit je Tag inkl. Schwierigkeitsfaktor ${diff.events}. Jedes Ereignis erhält eine zufällige Stärke (0,4–2,2), die seine Effekte skaliert; die Dauer wird zufällig im Bereich gewählt.</p>${tbl(['Ereignis', 'p / Tag', 'Dauer', 'Schwere', 'Wirkung'], evRows)}`));

    const g = S.goals;
    const mg = G.GOALS && G.GOALS.MGMT ? G.GOALS.MGMT : [];
    out.push(sec('mgmt', '11. Geschäftsleitung, Ziele & Sanktionen', `<ul><li><b>Vertrauen</b> (0–100, aktuell ${g ? Math.round(g.trust) : '–'}): Monatsreviews nach zeitanteiliger Zielerreichung, Quartalsnoten, Budgetdisziplin (Überschreitung > 5 % wird vom Folgemonat abgezogen), Revisionen, Abmahnungen.</li>
      <li><b>Sanktionen:</b> ${G.GOALS ? G.GOALS.LEVELS.map((l) => `${esc(l.name)} unter ${Math.round(l.min)}`).slice(1).join(' · ') : ''}; Vertrauen 0 oder gescheiterter Bewährungsplan = Kündigung. Insolvenz: Kasse < 0 und Kreditrahmen ausgeschöpft für 30 Tage.</li>
      <li><b>Ziele</b> werden täglich neu abgeleitet: Plan = Quartalsbasis × Marktlage × Budgetfaktor (nur der Restzeitraum skaliert mit Budgetänderungen, z. B. Sparrunde oder Zusatzbudget). Nach guten Quartalen steigt die Basis (Vorquartal + 8 %). Mengenziele werden auf das mit dem Budget Erreichbare gedeckelt (beobachtete Effizienz × 1,2).</li>
      <li><b>Zielvereinbarung bei Investitionen:</b> Genehmigte Personalkosten zählen zu ${G.GOALS ? Math.round(G.GOALS.RELIEF.staff * 100) : 100} %, Marketing-Aktionen zu ${G.GOALS ? Math.round(G.GOALS.RELIEF.act * 100) : 80} % nicht gegen das Deckungsbeitragsziel (sie werden beim Ist-Wert herausgerechnet). Im Gegenzug enthält der Plan je Teammitglied +${G.GOALS ? Math.round(G.GOALS.RELIEF.uplift * 100) : 2} % mehr Deckungsbeitrag aus den Anzeigen (max. +${G.GOALS ? Math.round(G.GOALS.RELIEF.upliftMax * 100) : 10} %). Abfindungen, Strafen, Tipps und Shop-Hebel zählen voll.${g && g.relief && g.relief.total ? ` Aktuell eingeplant: ${f.eur0(g.relief.total)}.` : ''}</li></ul>
      <p><b>Ad-hoc-Ereignisse</b> (max. eines alle 30 Tage, jedes mit eigener Abklingzeit; die Wahrscheinlichkeit hängt von der Lage ab):</p>
      ${tbl(['Ereignis', 'Basis-p / Tag', 'Abklingzeit', 'Situativ'], mg.map((e) => [esc(e.name), `${(e.p * diff.events * 100).toFixed(2)} %`, `${e.cd} Tage`, { audit: 'häufiger bei großer Messlücke oder Tracking-Ausfall, selten bei sauberem Reporting', spar: 'häufiger bei schwacher Kauflaune', push: 'häufiger, wenn Ziele im Plan', bonus: 'häufiger bei hohem Vertrauen', freeze: 'häufiger bei schwacher Kauflaune', praise: 'nur wenn Ziele im Plan und Vertrauen ≥ 55' }[e.id] || '–']))}`));

    const cal = D.CAL_EVENTS.map((c) => [esc(c.name), fx2(c.fx[S.ind] || c.fx._all)]).filter((r) => r[1] !== '–');
    out.push(sec('cal', '12. Kalender: Saison, Feiertage, Turniere', `<p>Kalenderereignisse wirken auf Ihre Branche wie folgt (Faktor gegenüber Normalniveau). Bundesweite Feiertage: Neujahr, Karfreitag, Ostermontag, 1. Mai, Christi Himmelfahrt, Pfingstmontag, 3. Oktober, 1./2. Weihnachtstag; Brückentage: Montag/Freitag neben einem Feiertag am Dienstag/Donnerstag.</p>${tbl(['Ereignis', 'Wirkung (Ihre Branche)'], cal)}`));

    out.push(sec('ind', `13. Branchenparameter: ${esc(ind.name)}`, tbl(['Parameter', 'Wert'], [
      ['Ø Warenkorb / Lead-Wert', f.eur(ind.aov)], ['Marge', f.pct0(ind.margin)], ['Basis-Conv.-Rate', f.pct(ind.baseCvr, 2)], ['Basis-CTR', f.pct(ind.baseCtr, 2)],
      ['Retouren', ind.returns ? f.pct0(ind.returns) : '–'], ['Geräteanteile', D.DEVICES.map((d) => `${d.name} ${f.pct0(ind.devices[d.id].share)}`).join(', ')],
      ['Hintergrund-Bieter je Auktion', String(ind.bgDensity || 3)], ['Display-Conv.-Faktor', String(ind.dispCvr ?? 1)], ['Tageszeit-Profil', esc(ind.hours)],
      ['Themen', ind.themes.map((t) => esc(t.name)).join(', ')],
    ])));

    out.push(sec('diff', '14. Schwierigkeitsgrade', tbl(['Stufe', 'Startkapital', 'Mitbewerber-Stärke', 'Ereignis-Häufigkeit', 'Fixkosten-Faktor', 'Ziel-Faktor'], Object.values(M.DIFFICULTY).map((d) => [d.name + (d === diff ? ' ✓' : ''), f.eur0(d.cash), '× ' + d.comp, '× ' + d.events, '× ' + d.fixed, '× ' + d.goal]))));

    if (G.PSY) out.push(sec('psy', '15. Psychologie & Shop-Hebel', `<p>Trigger im Anzeigentext (Social Proof, Autorität, Verknappung, Preisanker, Risikoumkehr, Gratis, Call-to-Action) wirken je nach Kaufabsicht, Branche und Bekanntheit (bis ca. ±8 % CTR). Kundenvertrauen (aktuell ${S.psy ? f.pct0(S.psy.trust) : '–'}) skaliert die Conv.-Rate mit 0,85 + 0,2 × Vertrauen; Verkäufer-Sterne ab 100 Rezensionen und 3,5★.</p>${tbl(['Shop-Hebel', 'Conv.-Rate', 'Warenkorb', 'Kosten', 'Hinweis'], G.PSY.CRO.map((c) => [esc(c.name) + (c.dark ? ' <span class="down">(Dark Pattern)</span>' : c.legal ? ' <span class="down">(rechtlich riskant)</span>' : ''), c.cvr ? pct(c.cvr) : '–', c.aov ? pct(c.aov) : '–', (c.month ? f.eur0(c.month) + '/Monat' : '') + (c.setup ? ` + ${f.eur0(c.setup)} einmalig` : '') || '–', esc(c.tip || '')]))}`));

    if (G.MKT) {
      const MK = G.MKT;
      out.push(sec('mix', '16. Marketing & Team', `<p>Personalkosten werden täglich gebucht (Monatskosten ÷ 30,4). Wirkung steigt während der Einarbeitung linear an; Freelancer wirken zu 55 %. Qualität (1–5 Sterne) ist bis Tag 30 verborgen. Team-Ereignisse: Krankheit (0,25–0,45 %/Tag, im Winter häufiger), Urlaub, Abwerbung mit Gehaltsforderung (gute Leute mit Gehalt unter Marktniveau), Ideen (ab 4★) und Fehler (bis 2★).</p>
        ${tbl(['Rolle', 'Kosten ca.', 'Einarbeitung', 'Wirkung', 'Risiko'], Object.values(MK.ROLES).map((r) => [r.icon + ' ' + esc(r.name), f.eur0(r.salary) + '/Monat', r.onboard + ' T', esc(r.desc), esc(r.bad)]))}
        <p style="margin-top:10px">Marketing-Aktionen: Kosten = Typfaktor × Umfang (0,5 / 1,2 / 3 × Monatsbudget) × Umsetzung (1 / 1,2 / 1,45). Qualität = 0,32 + Umsetzung (0 / 0,2 / 0,34) + Team-Bonus + Passung × 0,22 + Saison ± 0,08 + Zufall (σ = 0,1). Wirkung = Umfang (1 / 2 / 3,5) × Passung × (0,25 + 1,1 × Qualität) × Zufall; Rückschlag-Risiko = Basisrisiko × (1,5 − Qualität)².</p>
        ${tbl(['Aktion', 'Kostenfaktor', 'Laufzeit + Nachwirkung', 'Markensuchen je Wirkung', 'Passung Ihre Branche', 'Basisrisiko', 'Rückschlag'], Object.values(MK.TYPES).map((t) => [t.icon + ' ' + esc(t.name), '× ' + t.cost, `${t.dur} + ${t.tail} T`, '+' + Math.round(t.brand * 100) + ' %' + (t.gen ? `, Gattung +${Math.round(t.gen * 100)} %` : ''), f.pct0(t.fit[S.ind] ?? 0.5), f.pct0(t.risk), esc(MK.DISASTERS[t.disaster].name)]))}`));
    }
    if (S.bank) out.push(sec('bank', '17. Bank-Modus', `<ul><li>Abschlussquote je Produkt hängt vom Abstand des effektiven 12-Monats-Zinses zum oberen Marktquartil ab; die Marge ergibt sich gegenüber der Refinanzierungsalternative (EZB-Pfad).</li><li>Anteil Geschäftskunden je Suchbegriff; Privatkunden-Anträge werden abgelehnt. B2B-Anzeigen senken die CTR bei Privatkunden-Suchen, filtern aber Fehlanträge.</li><li>Funnel: Antrag → Legitimation → KYC → Eröffnung → Ersteinzahlung mit Verzögerungen; Offline-Import meldet Eröffnungen zurück.</li><li>Zinsangaben im Anzeigentext müssen zu den Konditionen passen, sonst Ablehnung; Konditionsänderungen brauchen eine ALCO-Freigabe.</li></ul>`));
    out.push(sec('rng', 'Zufall & Reproduzierbarkeit', `<p>Alle Zufallsentscheidungen nutzen einen Zufallsgenerator mit Startwert (Seed <span class="mono">${S.seed}</span>). Mit demselben Seed und denselben Entscheidungen verläuft die Simulation gleich.</p>`));
    return out.join('');
  }

  const origRender = V.settings.render;
  V.settings.render = function () {
    const tab = APP.tab.settings || 'general';
    const tabs = `<div class="tabs" style="margin-bottom:12px">${[['general', 'Allgemein'], ['criteria', 'Simulationskriterien']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-g="settings" data-v="${k}">${l}</button>`).join('')}</div>`;
    if (tab === 'criteria') return UI.head('Einstellungen', '', { noScope: true, noRange: true }) + tabs + criteria();
    const html = origRender.call(this);
    const i = html.indexOf('<div class="grid g2">');
    return i >= 0 ? html.slice(0, i) + tabs + html.slice(i) : tabs + html;
  };
  // Offene Abschnitte merken
  document.addEventListener('toggle', (ev) => { const d = ev.target; if (!d.dataset || !d.dataset.crit) return; APP._critOpen = APP._critOpen || new Set(); d.open ? APP._critOpen.add(d.dataset.crit) : APP._critOpen.delete(d.dataset.crit); }, true);
})();
