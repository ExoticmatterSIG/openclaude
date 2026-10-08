/* Ads Simulator – Notfall-Assistent: Leitfäden für Ereignisse (Ausfälle, Wettbewerb, Recht, Geschäftsleitung, Bank) mit Sofortmaßnahmen */
(function () {
  const G = globalThis.GA;
  const U = G.U, M = G.M, E = G.E, UI = G.UI, ACT = G.ACT, APP = G.APP, GD = G.GUIDE;
  const f = U.fmt, esc = U.esc;
  const btn = (label, act, data = {}) => ({ label, act, data });
  const live = (S) => S.campaigns.filter((c) => c.status === 'enabled' && !c.isTrial);
  const smart = (S) => live(S).filter((c) => G.D.BID_STRATEGIES[c.bidStrategy.type].smart);
  const visual = (S) => live(S).filter((c) => ['display', 'video', 'demandgen', 'pmax'].includes(c.type));
  const theme = (S, id) => (M.ind(S).themes.find((t) => t.id === id) || { name: id });
  const compName = (S, id) => (S.competitors.find((c) => c.id === id) || { name: 'Mitbewerber' }).name;

  // Leitfaden je Ereignis-Typ: Auswirkung, Sofortmaßnahmen, was Sie lassen sollten, Schnellaktionen
  const PB = {
    lp_down: (S, ev) => ({ sev: 'bad', impact: 'Klicks kosten weiter Geld, konvertieren aber nicht. Hält der Ausfall an, lehnt Google Anzeigen wegen „Ziel nicht erreichbar" ab.', steps: [`Sofort den Hosting-Support beauftragen (${f.eur0(ev.fixable.cost)}) – das beendet den Ausfall`, 'Bis dahin alle Kampagnen pausieren, damit kein Budget verbrennt', 'Nach der Behebung Kampagnen wieder aktivieren und einen Tag beobachten', 'Smart Bidding: Ausfalltage nicht als Grundlage für Zieländerungen nehmen'], dont: ['Budgets oder Zielwerte jetzt nicht dauerhaft ändern – der Ausfall ist vorübergehend'], fix: [btn(`${ev.fixable.label} (${f.eur0(ev.fixable.cost)})`, 'fixevent', { id: ev.id }), btn('Alle Kampagnen pausieren', 'gdpauseall'), btn('Kampagnen wieder aktivieren', 'gdresumeall')] }),
    tracking: (S, ev) => ({ sev: 'bad', impact: 'Es werden keine Conversions mehr erfasst. Smart Bidding glaubt, nichts funktioniert, und senkt die Gebote drastisch; Berichte zeigen falsche Werte.', steps: ['Google-Tag reparieren (Schnellaktion unten oder Tools → Conversions → „Tag testen")', smart(S).length ? `${smart(S).length} Smart-Bidding-Kampagne(n) betroffen: bis zur Reparatur keine Zielwerte ändern` : 'Manuelle Gebote: Kennzahlen der Ausfalltage nicht bewerten', 'Nach der Reparatur Conversions einige Tage nachlaufen lassen', 'In der Praxis: Datenausschluss für den Ausfallzeitraum einrichten (in Google Ads möglich)'], dont: ['Kampagnen nicht wegen „0 Conversions" pausieren – die Verkäufe finden statt, nur die Messung fehlt'], fix: [btn(`${ev.fixable.label} (${f.eur0(ev.fixable.cost)})`, 'fixevent', { id: ev.id }), btn('Zu Conversions', 'nav', { v: 'conversions' })] }),
    comp_sale: (S, ev) => ({ sev: 'warn', impact: `${compName(S, ev.comp)} bietet höher und lockt Preisvergleicher weg: CPCs steigen, Conversion-Rate sinkt – für ${ev.end - S.day + 1} Tage.`, steps: ['Nicht in den Preiskampf einsteigen: Gebote nicht pauschal erhöhen', 'Mit Mehrwert statt Preis werben (Gratis-Rückversand, Bewertungen, schnelle Lieferung)', 'Optional eigene Promotion-Assets nutzen, wenn die Marge es erlaubt', 'Generische Suchbegriffe mit hoher Preissensibilität beobachten, Ziel-ROAS halten'], dont: ['Budget nicht erhöhen, um Klicks „zurückzukaufen" – die Aktion endet von selbst'], fix: [btn('Anzeigen öffnen', 'nav', { v: 'ads' }), btn('Auktionsdaten', 'nav', { v: 'auction' })] }),
    comp_enter: (S, ev) => ({ sev: 'warn', impact: 'Ein finanzstarker Neuling bietet aggressiv. CPCs und Konkurrenz um die Top-Positionen steigen dauerhaft, bis ihm das Geld ausgeht.', steps: ['Auktionsdaten beobachten: Überschneidungsrate und Rate der höheren Position', 'Qualitätsfaktor stärken – günstiger als ein Gebotswettlauf', 'Markenkampagne schützen, falls er auf Ihre Marke bietet', 'Mit Tipps & Beratung → „Marktgerüchte" seine Finanzlage prüfen'], dont: ['Nicht reflexartig überbieten – VC-Neulinge halten oft nur einige Monate durch'], fix: [btn('Auktionsdaten', 'nav', { v: 'auction' }), btn('Keywords (QF)', 'nav', { v: 'keywords' })] }),
    bid_war: (S, ev) => ({ sev: 'warn', impact: `Mitbewerber treiben die Klickpreise im Bereich „${esc(theme(S, ev.theme).name)}" hoch.`, steps: [`Rentabilität der Keywords zu „${esc(theme(S, ev.theme).name)}" prüfen (Spalte Deckungsbeitrag)`, 'Smart Bidding: Ziel-ROAS/-CPA halten – Google bietet dann automatisch weniger, wo es sich nicht lohnt', 'Manuell: Gebote im Thema leicht senken, Budget zu ruhigeren Themen verschieben', 'Long-Tail-Keywords mit weniger Konkurrenz stärken'], dont: ['Nicht mitbieten, nur um die Position zu halten'], fix: [btn('Keywords öffnen', 'nav', { v: 'keywords' }), btn('Auktionsdaten', 'nav', { v: 'auction' })] }),
    supply: (S, ev) => ({ sev: 'warn', impact: `Produkte zu „${esc(theme(S, ev.theme).name)}" sind nicht lieferbar. Klicks auf diese Produkte konvertieren kaum – reines Geldverbrennen.`, steps: [`Anzeigengruppen und Produkte zu „${esc(theme(S, ev.theme).name)}" pausieren (Schnellaktion)`, 'Budget vorübergehend auf lieferbare Themen umleiten', `Nach Ende des Engpasses (in ${ev.end - S.day + 1} Tagen) wieder aktivieren`], dont: ['Nicht das ganze Konto pausieren – nur das betroffene Thema'], fix: [btn('Thema pausieren', 'gdpausetheme', { t: ev.theme }), btn('Thema wieder aktivieren', 'gdresumetheme', { t: ev.theme })] }),
    capacity: (S, ev) => ({ sev: 'warn', impact: 'Ein Teil der Anfragen kann nicht bedient werden. Werbung erzeugt Leads, die verfallen.', steps: ['Tagesbudgets vorübergehend um ca. 30 % senken (Schnellaktion)', 'Werbezeitplan auf Zeiten mit Personal begrenzen', 'Nach Ende des Engpasses Budgets wiederherstellen'], dont: ['Smart-Bidding-Ziele nicht dauerhaft ändern'], fix: [btn('Budgets −30 %', 'gdbudget', { p: '-30' }), btn('Budgets wiederherstellen', 'gdbudgetrestore'), btn('Werbezeitplaner', 'nav', { v: 'schedule' })] }),
    recession: (S, ev) => ({ sev: 'warn', impact: 'Weniger Kauflaune: Conversion-Raten und Warenkörbe sinken für mehrere Wochen.', steps: ['Effizienz vor Volumen: Ziel-ROAS halten oder leicht erhöhen', 'Streuverluste konsequent ausschließen', 'Mit Sicherheit und Vertrauen werben (Rückgaberecht, Zahlung auf Rechnung)', 'Quartalsziele mit der Geschäftsleitung im Blick behalten – die Ziele passen sich teils dem Markt an'], dont: ['Nicht mit Rabatten die Marge zerstören'], fix: [btn('Suchbegriffe', 'nav', { v: 'searchterms' }), btn('Conversion & Psychologie', 'nav', { v: 'cro' })] }),
    media_negative: (S, ev) => ({ sev: 'warn', impact: 'Kunden sind verunsichert: Nachfrage und Vertrauen sinken.', steps: ['Vertrauenssignale in Anzeigen stärken (Bewertungen, Siegel, Garantien)', 'Seriöse Shop-Hebel aktivieren (Bewertungen, Kauf auf Rechnung)', 'Keine Verknappung oder aggressive Versprechen'], dont: ['Keine Dark Patterns – sie verstärken den Vertrauensverlust'], fix: [btn('Anzeigen', 'nav', { v: 'ads' }), btn('Conversion & Psychologie', 'nav', { v: 'cro' })] }),
    click_fraud: (S, ev) => ({ sev: 'warn', impact: 'Bot-Traffic verrauscht Ihre Daten; Google filtert den Großteil (nicht berechnet).', steps: ['Spalte „Ungültige Klicks" beobachten (▦ Spalten)', 'Display-/App-Inventar ausschließen, dort ist Betrug häufiger', 'Kennzahlen dieser Tage vorsichtig interpretieren'], dont: ['Keine überstürzten Gebotsänderungen auf Basis verrauschter Daten'], fix: [btn('Display-Inventar absichern', 'gdsafe'), btn('Kampagnen', 'nav', { v: 'campaigns' })] }),
    consent: () => ({ sev: 'warn', impact: 'Mehr Nutzer lehnen Cookies ab – ohne Consent Mode (erweitert) fehlen dauerhaft mehr Conversions in den Berichten.', steps: ['Tools → Conversions: Consent Mode auf „erweitert"', 'Erweiterte Conversions aktivieren', 'Messlücke in der Karte „Messqualität" beobachten'], dont: [], fix: [btn('Zu Conversions', 'nav', { v: 'conversions' })] }),
    policy_update: () => ({ sev: 'warn', impact: 'Alle Anzeigen werden neu geprüft. Superlative und Versprechen können zur Einschränkung führen.', steps: ['Anzeigen nach „Zulässig (eingeschränkt)" bzw. „Abgelehnt" durchsehen', 'Superlative („beste", „Nr. 1") belegen oder entfernen', 'Geführte Hilfe im Bereich Anzeigen zeigt die betroffenen Textstellen'], dont: [], fix: [btn('Anzeigen prüfen', 'nav', { v: 'ads' })] }),
    reporting_delay: () => ({ sev: 'info', impact: 'Conversion-Daten kommen verspätet – die letzten Tage sehen schlechter aus, als sie sind.', steps: ['Abwarten, keine Entscheidungen auf Basis der letzten Tage', 'Zeitraum ohne die jüngsten Tage wählen'], dont: ['Nicht pausieren oder Ziele ändern'], fix: [] }),
    brand_safety: (S) => ({ sev: 'bad', impact: 'Ihre Anzeige erschien neben problematischen Inhalten. Die Unternehmenskommunikation erwartet sofortiges Handeln.', steps: ['Sensible Inhalte und App-Inventar in allen Display-/Video-/PMax-Kampagnen ausschließen (Schnellaktion)', 'Optimierte Ausrichtung prüfen und Frequency Capping setzen', 'Der Geschäftsleitung die Maßnahme melden (passiert im Simulator automatisch über das Änderungsprotokoll)'], dont: ['Den Vorfall nicht ignorieren – er wiederholt sich sonst'], fix: [btn(`Brand Safety aktivieren (${visual(S).length} Kampagne/n)`, 'gdsafe')] }),
    ai_overview: () => ({ sev: 'info', impact: 'Informationssuchen bekommen weniger Klicks. Kaufnahe Suchen sind kaum betroffen.', steps: ['Budget auf kaufnahe Keywords konzentrieren', 'Informationelle Begriffe („was ist", „anleitung") prüfen und ggf. ausschließen'], dont: [], fix: [btn('Suchbegriffe', 'nav', { v: 'searchterms' })] }),
    comp_pause: (S, ev) => ({ sev: 'info', chance: true, impact: `${compName(S, ev.comp)} pausiert – Auktionen werden günstiger.`, steps: ['Chance nutzen: profitable Kampagnen mit Budget-Engpass leicht ausbauen (im Rahmen des Monatsbudgets)', 'Impression Share in Auktionsdaten beobachten'], dont: ['Nicht dauerhaft planen – der Mitbewerber kehrt meist zurück'], fix: [btn('Kampagnen', 'nav', { v: 'campaigns' })] }),
    price_hike: (S, ev) => ({ sev: 'info', chance: true, impact: `${compName(S, ev.comp)} wird teurer – Ihre Angebote wirken attraktiver.`, steps: ['Preisvorteil in Anzeigen betonen', 'Profitable Kampagnen leicht ausbauen, wenn Budget-Spielraum besteht'], dont: [], fix: [btn('Anzeigen', 'nav', { v: 'ads' })] }),
    boom: () => ({ sev: 'info', chance: true, impact: 'Höhere Nachfrage und bessere Conversion-Raten.', steps: ['Budget-Engpässe profitabler Kampagnen prüfen', 'Monatsbudget beachten – mehr Nachfrage heißt auch mehr Ausgaben'], dont: [], fix: [btn('Kampagnen', 'nav', { v: 'campaigns' })] }),
    viral: (S, ev) => ({ sev: 'info', chance: true, impact: `Viele Neugierige suchen nach „${esc(theme(S, ev.theme).name)}" – Volumen hoch, Kaufabsicht etwas geringer.`, steps: ['Suchbegriffe beobachten und reine Neugier-Suchen ausschließen', 'Budget nur bei guter Rentabilität erhöhen'], dont: [], fix: [btn('Suchbegriffe', 'nav', { v: 'searchterms' })] }),
    influencer: () => ({ sev: 'info', chance: true, impact: 'Markensuchen steigen stark.', steps: ['Markenkampagne mit ausreichend Budget ausstatten (Markenklicks sind günstig)', 'Sitelinks zu Bestsellern prüfen'], dont: [], fix: [btn('Kampagnen', 'nav', { v: 'campaigns' })] }),
    heat: () => ({ sev: 'info', impact: 'Weniger Online-Aktivität, saisonale Sortimente verschieben sich für einige Tage.', steps: ['Keine Panik bei schwächeren Tagen – Effekt ist vorübergehend', 'Sommerliche Sortimente/Leistungen in Anzeigen hervorheben', 'Ggf. abends (wenn es kühler ist) Gebote leicht erhöhen'], dont: ['Keine dauerhaften Zieländerungen'], fix: [btn('Werbezeitplaner', 'nav', { v: 'schedule' })] }),
    cold: () => ({ sev: 'info', chance: true, impact: 'Winterbedarf und Notdienste sind gefragt.', steps: ['Passende Themen/Sortimente mit Budget ausstatten', 'Budget-Engpässe profitabler Kampagnen prüfen'], dont: [], fix: [btn('Kampagnen', 'nav', { v: 'campaigns' })] }),
    bank_trust: () => ({ sev: 'info', chance: true, impact: 'Unternehmen suchen sichere Banken mit gesetzlicher Einlagensicherung.', steps: ['Einlagensicherung und etablierte Marke in Anzeigen betonen', 'Budget für Tagesgeld/Festgeld-Suchen prüfen'], dont: [], fix: [btn('Anzeigen', 'nav', { v: 'ads' })] }),
    core_update: () => ({ sev: 'info', impact: 'Organische Rankings schwanken; mehr Nutzer klicken auf Anzeigen.', steps: ['Markensuchen und Kosten beobachten', 'Keine großen Änderungen nötig'], dont: [], fix: [] }),
    // Bank-Modus
    rate_offensive: (S, ev) => ({ sev: 'warn', impact: `${compName(S, ev.comp)} lockt mit Spitzenzins – Abschlussquote bei Zinssuchen sinkt.`, steps: ['Nicht sofort nachziehen: effektiven 12-Monats-Zins mit dem oberen Marktquartil vergleichen', 'Mit Sicherheit (Einlagensicherung, etablierte Bank) und Service werben', 'Zinssuchen-Gebote halten, Budget auf Geschäftskonto/Visa verlagern', 'Tipps & Beratung → Zinsberatung der Treasury nutzen'], dont: ['Keinen Lockzins ohne ALCO-Freigabe und Margenprüfung – heißes Geld fließt wieder ab'], fix: [btn('Konditionen & Zinsen', 'nav', { v: 'conditions' })] }),
    portal_test: (S, ev) => ({ sev: 'warn', impact: `${compName(S, ev.comp)} ist Testsieger – Anleger vergleichen kritischer.`, steps: ['Eigene Stärken in Anzeigen nennen (Konditionen, Einlagensicherung)', 'Gebote auf Vergleichssuchen prüfen'], dont: [], fix: [btn('Anzeigen', 'nav', { v: 'ads' })] }),
    kyc_backlog: (S, ev) => ({ sev: 'warn', impact: 'Kontoeröffnungen verzögern sich, Antragsteller springen ab – bezahlte Klicks verfallen.', steps: [ev.fixable ? `Zusätzliche KYC-Kapazität einkaufen (${f.eur0(ev.fixable.cost)})` : 'Backoffice-Kapazität erhöhen', 'Alternativ Budgets vorübergehend senken', 'Funnel unter Konditionen & Zinsen beobachten'], dont: [], fix: [ev.fixable ? btn(`${ev.fixable.label} (${f.eur0(ev.fixable.cost)})`, 'fixevent', { id: ev.id }) : null, btn('Budgets −30 %', 'gdbudget', { p: '-30' }), btn('Budgets wiederherstellen', 'gdbudgetrestore')].filter(Boolean) }),
    videoident_down: () => ({ sev: 'bad', impact: 'Legitimationen schlagen fehl – Anträge bleiben unvollständig, Klicks werden weiter bezahlt.', steps: ['Budgets für die Dauer der Störung deutlich senken (−60 %)', 'Nach Ende der Störung wiederherstellen', 'Kennzahlen dieser Tage nicht für Zieländerungen verwenden'], dont: [], fix: [btn('Budgets −60 %', 'gdbudget', { p: '-60' }), btn('Budgets wiederherstellen', 'gdbudgetrestore')] }),
    fin_reverify: (S) => ({ sev: 'bad', impact: 'Ohne erneute Verifizierung werden nach Ablauf der Frist keine Finanzanzeigen mehr ausgeliefert.', steps: ['Unterlagen sofort einreichen (Konditionen & Zinsen → Verifizierung)', 'Prüfung dauert 1–2 Wochen – nicht bis kurz vor Fristende warten', S.bank && S.bank.verify.deadline ? `Frist: noch ${Math.max(0, S.bank.verify.deadline - S.day)} Tage` : 'Frist beachten'], dont: [], fix: [btn('Unterlagen einreichen', 'bankverify'), btn('Konditionen & Zinsen', 'nav', { v: 'conditions' })] }),
    zins_abmahnung: () => ({ sev: 'warn', impact: 'Anzeigen mit Zinsangaben werden geprüft.', steps: ['Alle Zinsangaben mit den aktuellen Konditionen abgleichen', '„p. a." und Bedingungen (Aktionszeitraum) vollständig angeben', '„kostenlos" nur verwenden, wenn wirklich keine Entgelte anfallen'], dont: [], fix: [btn('Anzeigen prüfen', 'nav', { v: 'ads' })] }),
  };

  // Weitere Notlagen ohne Ereignis-Objekt (Geschäftsleitung, Abmahnung, EZB, Verifizierung)
  function others(S) {
    const out = [], g = S.goals;
    const recentLog = (re, days = 10) => S.market.log.find((l) => re.test(l.name) && S.day - l.day <= days);
    if (g && g.sanction >= 1) {
      const lv = G.GOALS.LEVELS[g.sanction], cx = GD.ctx(S);
      out.push({ id: 'emg_sanction', sev: g.sanction >= 2 ? 'bad' : 'warn', title: `🚨 Geschäftsleitung: ${esc(lv.name)}`, why: `Vertrauen ${Math.round(g.trust)} / 100.${g.pip ? ` Bewährungsplan: noch ${g.pip.until - S.day} Tage, Ziel Vertrauen ≥ 35.` : ''} Weitere Verschlechterung führt bis zur Kündigung.`, steps: ['Monatsbudget strikt einhalten (Hochrechnung in der Karte „Budget-Pacing")', `Quartalsziele priorisieren: ${cx.targets.filter((t) => !t.onTrack).map((t) => esc(t.name)).join(', ') || 'alle im Plan – halten'}`, 'Messung sauber halten (Tracking, Consent Mode) – Revisionen kosten sonst zusätzlich Vertrauen', 'Keine riskanten Experimente, keine Dark Patterns', 'Schulden reduzieren, wenn möglich'], fix: [btn('Unternehmen & GuV', 'nav', { v: 'business' }), btn('Kampagnen', 'nav', { v: 'campaigns' })], views: ['overview', 'business'] });
    }
    const spar = g && g.events && g.events.find((e) => e.name === 'Sparrunde' && S.day - e.day <= 14);
    if (spar) { const cx = GD.ctx(S); out.push({ id: 'emg_spar', sev: 'warn', title: '🚨 Sparrunde: Monatsbudget −20 %', why: `Neues Monatsbudget ${f.eur0(cx.mb)}, Hochrechnung ${f.eur0(cx.proj)}.`, steps: [`Summe der Tagesbudgets auf höchstens ${f.eur0(cx.maxDaily)} senken (aktuell ${f.eur0(cx.budgets)})`, 'Zuerst bei Kampagnen mit dem geringsten Deckungsbeitrag kürzen', 'Profitable Kampagnen schützen; Streuverluste ausschließen', 'Google-Empfehlungen zu Budgeterhöhungen ablehnen'], fix: [btn('Budgets auf Vorgabe anpassen', 'gdfitbudget'), btn('Kampagnen', 'nav', { v: 'campaigns' })], views: ['overview', 'campaigns', 'business'] }); }
    const push = g && g.events && g.events.find((e) => e.name === 'Wachstumsoffensive' && S.day - e.day <= 14);
    if (push) out.push({ id: 'emg_push', sev: 'info', chance: true, title: '📈 Wachstumsoffensive: Ziele +15 %, Budget +10 %', why: 'Mehr Volumen wird erwartet – bei weiter sauberer Rentabilität.', steps: ['Profitable Kampagnen mit Budget-Engpass ausbauen', 'Zielwerte leicht lockern (Geführte Hilfe im Gebotsformular zeigt die Auswirkungen)', 'Neue Keywords/Kampagnentypen testen'], fix: [btn('Kampagnen', 'nav', { v: 'campaigns' })], views: ['overview', 'campaigns'] });
    const audit = g && g.events && g.events.find((e) => /Revision/.test(e.name) && S.day - e.day <= 7);
    if (audit) out.push({ id: 'emg_audit', sev: 'warn', title: '🚨 Interne Revision prüft das Reporting', why: 'Gemeldete und echte Conversions werden verglichen. Große Abweichungen kosten Vertrauen.', steps: ['Tracking prüfen und ggf. reparieren', 'Consent Mode (erweitert) und erweiterte Conversions aktivieren', 'Messlücke in der Karte „Messqualität" beobachten'], fix: [btn('Zu Conversions', 'nav', { v: 'conversions' })], views: ['overview', 'conversions'] });
    const abm = recentLog(/^Abmahnung erhalten/, 14);
    if (abm) out.push({ id: 'emg_abm', sev: 'bad', title: '🚨 Abmahnung erhalten', why: esc(abm.desc), steps: ['Abgemahntes Element sofort abschalten (Conversion & Psychologie → riskante Hebel)', 'Anzeigen auf unzulässige Versprechen prüfen', 'Unterlassungserklärung einhalten – Wiederholung wird teurer'], fix: [btn('Conversion & Psychologie', 'nav', { v: 'cro' }), btn('Anzeigen', 'nav', { v: 'ads' })], views: ['overview', 'cro'] });
    const ecb = recentLog(/^EZB /, 6);
    if (ecb && S.bank) out.push({ id: 'emg_ecb', sev: 'warn', title: `🏦 ${esc(ecb.name)}`, why: esc(ecb.desc), steps: ['Konditionen prüfen: Abstand zum oberen Marktquartil und zur Refinanzierung', 'Zinsänderung bei der ALCO beantragen, falls nötig', 'Alle Anzeigen mit Zinsangaben am Tag der Änderung anpassen'], fix: [btn('Konditionen & Zinsen', 'nav', { v: 'conditions' }), btn('Anzeigen', 'nav', { v: 'ads' })], views: ['overview', 'conditions', 'ads'] });
    if (S.bank && S.bank.verify && S.bank.verify.status === 'suspended') out.push({ id: 'emg_vsusp', sev: 'bad', title: '🚨 Finanzanzeigen gesperrt – Verifizierung fehlt', why: 'Die Frist ist abgelaufen. Keine Finanzanzeigen werden ausgeliefert.', steps: ['Unterlagen sofort einreichen', 'Prüfung dauert 1–2 Wochen'], fix: [btn('Unterlagen einreichen', 'bankverify')], views: ['overview', 'conditions', 'campaigns'] });
    return out;
  }

  GD.emergencies = function (S) {
    const out = [];
    const act = S.market.events.filter((e) => e.start <= S.day && e.end >= S.day && !e.done && PB[e.def]);
    for (const ev of act) {
      let p;
      try { p = PB[ev.def](S, ev); } catch (e) { console.error(e); continue; }
      const left = ev.end > S.day + 500 ? 'bis behoben' : `noch ${ev.end - S.day + 1} Tag(e)`;
      out.push({ id: 'emg_' + ev.id, ev, sev: p.sev, chance: p.chance, title: `${p.chance ? '💡 Chance' : p.sev === 'bad' ? '🚨 Notfall' : '⚠️ Ereignis'}: ${esc(ev.name)}`, why: `${p.impact} <span class="small muted">(${left})</span>`, steps: p.steps.concat((p.dont || []).map((d) => `<span class="down">Nicht:</span> ${d}`)), fix: p.fix, views: ['overview', 'events', 'campaigns'] });
    }
    return out.concat(others(S)).map((x) => ({ ...x, emg: true, views: x.views || ['overview', 'events'] }));
  };
  const origProblems = GD.problems;
  GD.problems = function (S) {
    const order = { bad: 0, warn: 1, info: 2 };
    return GD.emergencies(S).concat(origProblems(S)).sort((a, b) => order[a.sev] - order[b.sev] || (b.emg ? 1 : 0) - (a.emg ? 1 : 0));
  };

  // Notfall-Fenster, wenn die Simulation wegen eines Ereignisses anhält
  GD.emergencyModal = function (S) {
    if (!UI.prefs().guide) return false;
    const fresh = GD.emergencies(S).filter((x) => !x.chance && (x.ev ? x.ev.start >= S.day - 1 : true) && x.sev !== 'info');
    const seen = (APP._emgSeen = APP._emgSeen || new Set());
    const list = fresh.filter((x) => !seen.has(x.id));
    if (!list.length) return false;
    list.forEach((x) => seen.add(x.id));
    const body = list.map((x, i) => `<details class="gd-item ${x.sev}" ${i === 0 ? 'open' : ''}><summary>${x.title}</summary><div class="gd-body"><p>${x.why}</p><b>Jetzt tun:</b><ol>${x.steps.map((s) => `<li>${s}</li>`).join('')}</ol>${x.fix.length ? `<div class="gd-fix">${x.fix.map((b, j) => `<button class="btn sm ${j === 0 ? 'primary' : ''}" data-act="${b.act}" ${Object.entries(b.data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${b.label}</button>`).join('')}</div>` : ''}</div></details>`).join('');
    UI.modal('🚨 Notfall-Assistent', `<div class="small muted" style="margin-bottom:8px">Die Simulation wurde angehalten. Hier steht, was passiert ist und was Sie jetzt tun sollten. Die Hinweise bleiben in der Übersicht unter „Geführte Hilfe" sichtbar, solange das Ereignis wirkt.</div><div class="card gd-panel gdm" style="margin:0">${body}</div>`, { footer: '<button class="btn" data-act="gdoffmodal">Notfall-Assistent ausschalten</button><button class="btn primary" data-act="mclose">Verstanden</button>' });
    return true;
  };
  ACT.gdoffmodal = () => { UI.setPref('guide', false); UI.closeModal(); UI.toast('Geführte Hilfe ausgeschaltet – unter Einstellungen → Lernhilfen wieder einschalten'); UI.render(true); };

  GD.hasPlaybook = (ev) => !!PB[ev.def];
  ACT.evguide = (el, d) => {
    const x = GD.emergencies(APP.S).find((e) => e.ev && e.ev.id === d.id);
    if (!x) return;
    UI.modal('🧭 ' + x.title, `<p style="margin-top:0">${x.why}</p><b>So gehen Sie vor:</b><ol>${x.steps.map((s) => `<li>${s}</li>`).join('')}</ol>${x.fix.length ? `<div class="gd-fix">${x.fix.map((b, j) => `<button class="btn sm ${j === 0 ? 'primary' : ''}" data-act="${b.act}" ${Object.entries(b.data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${b.label}</button>`).join('')}</div>` : ''}<div class="gdm"></div>`, { footer: '<button class="btn primary" data-act="mclose">Schließen</button>' });
  };

  // Aktionen aus Notfall-Fenstern schließen das Fenster (Navigation, Reparatur, Schnellaktion)
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest && ev.target.closest('#modal-root [data-act]');
    if (!b || !document.querySelector('#modal-root .gdm') || !['nav', 'editcampaign', 'editad', 'newasset', 'capital', 'gdasset'].includes(b.dataset.act)) return;
    setTimeout(() => { if (document.querySelector('#modal-root .gdm')) UI.closeModal(); }, 0);
  });

  // ---------- Schnellaktionen ----------
  const after = (msg) => { UI.toast(msg, 'good'); UI.render(true); const b = document.activeElement; if (b && b.closest && b.closest('#modal-root .gdm')) { b.disabled = true; b.textContent = '✓ ' + b.textContent; } };
  ACT.gdpauseall = () => {
    const S = APP.S, cs = live(S);
    if (!cs.length) return UI.toast('Keine aktiven Kampagnen');
    S.guidePaused = cs.map((c) => c.id);
    for (const c of cs) M.setStatus(S, 'Kampagne', c, 'paused');
    after(`${cs.length} Kampagne(n) pausiert – nach der Behebung „Kampagnen wieder aktivieren"`);
  };
  ACT.gdresumeall = () => {
    const S = APP.S, ids = S.guidePaused || [];
    const cs = S.campaigns.filter((c) => ids.includes(c.id) && c.status === 'paused');
    for (const c of cs) M.setStatus(S, 'Kampagne', c, 'enabled');
    S.guidePaused = null;
    after(cs.length ? `${cs.length} Kampagne(n) wieder aktiviert` : 'Keine vom Assistenten pausierten Kampagnen');
  };
  ACT.gdbudget = (el, d) => {
    const S = APP.S, p = +d.p / 100, store = (S.guideBudget = S.guideBudget || {});
    for (const c of live(S)) { if (store[c.id] === undefined) store[c.id] = c.budget; M.updateCampaign(S, c, { budget: Math.max(1, Math.round(store[c.id] * (1 + p))) }, `Notfall: Budget ${d.p} %`); }
    after(`Tagesbudgets um ${Math.abs(+d.p)} % gesenkt – später „Budgets wiederherstellen"`);
  };
  ACT.gdbudgetrestore = () => {
    const S = APP.S, store = S.guideBudget || {};
    let n = 0;
    for (const c of S.campaigns) if (store[c.id] !== undefined) { M.updateCampaign(S, c, { budget: store[c.id] }, 'Notfall beendet: Budget wiederhergestellt'); n++; }
    S.guideBudget = null;
    after(n ? `${n} Budget(s) wiederhergestellt` : 'Keine gespeicherten Budgets');
  };
  ACT.gdfitbudget = () => {
    const S = APP.S, cx = GD.ctx(S), cs = live(S);
    const tot = cs.reduce((a, c) => a + c.budget, 0);
    if (!tot || tot <= cx.maxDaily) return UI.toast('Budgets passen bereits zur Vorgabe');
    const k = cx.maxDaily / tot;
    for (const c of cs) M.updateCampaign(S, c, { budget: Math.max(1, Math.floor(c.budget * k)) }, 'Budget an Monatsvorgabe angepasst');
    after(`Tagesbudgets anteilig um ${f.pct0(1 - k)} gesenkt (Summe ≤ ${f.eur0(cx.maxDaily)})`);
  };
  const agsOfTheme = (S, t) => S.adGroups.filter((ag) => ag.status !== 'removed' && ((ag.themes || []).includes(t) || S.keywords.some((k) => k.adGroupId === ag.id && k.status !== 'removed' && k.theme === t)));
  ACT.gdpausetheme = (el, d) => {
    const S = APP.S, ags = agsOfTheme(S, d.t).filter((ag) => ag.status === 'enabled');
    S.guideTheme = (S.guideTheme || []).concat(ags.map((a) => a.id));
    for (const ag of ags) M.setStatus(S, 'Anzeigengruppe', ag, 'paused');
    let np = 0;
    for (const p of S.products.filter((p) => p.theme === d.t && p.status === 'enabled')) { p.status = 'excluded'; p._guide = true; np++; }
    after(`${ags.length} Anzeigengruppe(n)${np ? ` und ${np} Produkt(e)` : ''} pausiert`);
  };
  ACT.gdresumetheme = (el, d) => {
    const S = APP.S, ids = S.guideTheme || [];
    const ags = S.adGroups.filter((ag) => ids.includes(ag.id) && ag.status === 'paused');
    for (const ag of ags) M.setStatus(S, 'Anzeigengruppe', ag, 'enabled');
    S.guideTheme = [];
    let np = 0;
    for (const p of S.products.filter((p) => p._guide)) { p.status = 'enabled'; delete p._guide; np++; }
    after(`${ags.length} Anzeigengruppe(n)${np ? ` und ${np} Produkt(e)` : ''} wieder aktiv`);
  };
  ACT.gdsafe = () => {
    const S = APP.S, cs = visual(S);
    for (const c of cs) { c.display.excludeSensitive = true; c.display.excludeApps = true; M.log(S, 'Brand Safety', c.name, 'Sensible Inhalte & App-Inventar ausgeschlossen'); }
    after(cs.length ? `Brand Safety in ${cs.length} Kampagne(n) aktiviert` : 'Keine Display-/Video-/PMax-Kampagnen aktiv');
  };
})();
