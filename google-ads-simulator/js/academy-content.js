/* Ads Simulator – Lernakademie: Kursinhalte (Lektionen, Unterschiede zu Google Ads, Quiz, Praxisaufgaben) */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});

  // Hilfsfunktionen für Praxisaufgaben (laufen gegen den Sandbox-Spielstand)
  const H = {
    sim: (S, n) => { for (let i = 0; i < n; i++) G.E.simulateDay(S); },
    search: (S) => S.campaigns.filter((c) => c.type === 'search' && c.status !== 'removed' && !c.isTrial),
    kw: (S, text) => S.keywords.find((k) => k.text === text && k.status !== 'removed'),
    rsa: (S) => S.ads.filter((a) => a.type === 'rsa' && a.status === 'enabled'),
    cpa30: (S, cid) => { const v = G.E.derive(G.E.sumRange(S, 'camp', cid, S.day - 30, S.day - 1)); return v.cpa; },
    blocks: (S, cid, mod) => { const q = S.queries.find((x) => x.mod === mod); return q ? G.M.campaignNegatives(S, cid).some((n) => G.M.negBlocks(n, q)) : false; },
  };

  const COURSES = [
    {
      id: 'c1', icon: '⚖️', level: 'Einsteiger', title: 'Grundlagen: Auktion, Ad Rank & Qualitätsfaktor',
      desc: 'Wie Google entscheidet, welche Anzeige wo erscheint und was ein Klick kostet.',
      lessons: [
        {
          id: 'l1', title: 'Wie die Google-Ads-Auktion funktioniert',
          body: `<p>Bei <b>jeder einzelnen Suchanfrage</b> findet eine eigene Auktion statt – in Millisekunden. Teilnehmen dürfen alle Werbetreibenden, deren Keywords zur Suche passen und deren Ausrichtung (Ort, Sprache, Gerät, Zeit) stimmt.</p>
            <p>Wer wo erscheint, entscheidet der <b>Ad Rank</b>. Er setzt sich zusammen aus:</p>
            <ul><li><b>Gebot</b> – wie viel Sie maximal für einen Klick zahlen würden</li><li><b>Anzeigenqualität</b> – erwartete Klickrate, Anzeigenrelevanz, Landingpage-Erfahrung</li><li><b>Mindestschwellen</b> – ein Ad Rank unter der Schwelle wird gar nicht angezeigt</li><li><b>Kontext</b> – Gerät, Ort, Uhrzeit, Suchbegriff, andere Anzeigen</li><li><b>Erwartete Wirkung von Assets</b> (z. B. Sitelinks)</li></ul>
            <p>Bis zu vier Anzeigen erscheinen oberhalb der organischen Ergebnisse, weitere darunter. Ein höheres Gebot allein garantiert also keine Top-Position – schlechte Qualität macht teuer.</p>`,
          diff: 'Im Simulator wird der Ad Rank vereinfacht als <i>Gebot × Qualitätsfaktor-Wert × Asset-Faktor × Zufallsrauschen</i> berechnet; Suchen werden pro Stunde in wenige Teilauktionen gebündelt. Google nutzt viel mehr Echtzeit-Signale und veröffentlicht die genaue Formel nicht.',
          quiz: [
            { q: 'Wann findet eine Google-Ads-Auktion statt?', a: ['Einmal täglich für alle Keywords', 'Bei jeder einzelnen Suchanfrage', 'Wöchentlich nach Budget'], c: 1, why: 'Jede Suche löst eine eigene Auktion aus – deshalb schwanken Positionen und Preise ständig.' },
            { q: 'Was bestimmt den Ad Rank?', a: ['Nur das Gebot', 'Gebot, Anzeigenqualität, Schwellenwerte, Kontext und Assets', 'Das Tagesbudget'], c: 1, why: 'Das Budget bestimmt nur, wie oft Sie teilnehmen – nicht Ihre Position.' },
          ],
        },
        {
          id: 'l2', title: 'Der Qualitätsfaktor (QF)',
          body: `<p>Der Qualitätsfaktor (1–10) fasst drei Bestandteile zusammen, die jeweils als <i>unterdurchschnittlich, durchschnittlich</i> oder <i>überdurchschnittlich</i> bewertet werden:</p>
            <ul><li><b>Erwartete Klickrate</b> – wie wahrscheinlich ein Klick im Vergleich zu anderen ist</li><li><b>Anzeigenrelevanz</b> – wie gut der Anzeigentext zum Keyword passt</li><li><b>Landingpage-Erfahrung</b> – Relevanz, Ladezeit, Mobilfreundlichkeit</li></ul>
            <p>Die wirksamsten Hebel: Keyword im Anzeigentitel, thematisch enge Anzeigengruppen (nicht 50 Keywords in eine Gruppe), eine schnelle, passende Landingpage. Die erwartete CTR folgt meist von selbst, wenn Text und Suche gut zusammenpassen.</p>`,
          diff: 'In Google Ads ist der QF ein <b>Diagnosewerkzeug</b> auf Keyword-Ebene – in die Auktion fließen Echtzeit-Qualitätssignale ein, nicht der QF selbst. Der Simulator nutzt dagegen einen stufenlosen QF-Wert direkt im Ad Rank und berechnet ihn nach der veröffentlichten Gewichtung (CTR & Landingpage stärker als Relevanz).',
          quiz: [
            { q: 'Welcher Hebel verbessert die Anzeigenrelevanz am direktesten?', a: ['Höheres Gebot', 'Keyword im Anzeigentitel und enge Anzeigengruppen', 'Mehr Budget'], c: 1, why: 'Relevanz misst den Bezug zwischen Keyword und Anzeigentext.' },
            { q: 'Was bedeutet ein niedriger QF für Ihre Kosten?', a: ['Klicks werden günstiger', 'Sie brauchen höhere Gebote für dieselbe Position und zahlen mehr', 'Keine Auswirkung'], c: 1, why: 'Schlechte Qualität muss durch Geld ausgeglichen werden.' },
          ],
          widget: 'adrank',
        },
        {
          id: 'l3', title: 'Was ein Klick tatsächlich kostet',
          body: `<p>Sie zahlen selten Ihr Maximalgebot. Der <b>tatsächliche CPC</b> ist der Betrag, der nötig ist, um den Ad Rank des Werbetreibenden direkt unter Ihnen zu übertreffen und die Schwellenwerte zu erreichen – grob: <i>Ad Rank des Nächsten ÷ Ihre Qualität + 1 Cent</i>.</p>
            <p>Daraus folgt: Wer eine höhere Qualität hat, zahlt für dieselbe Position weniger. Ein Qualitätsvorteil ist dauerhaft billiger als ein Gebotsvorteil.</p>`,
          diff: 'Der Simulator verwendet genau diese vereinfachte Zweitpreis-Logik. Google nennt das Prinzip, aber keine exakte Formel; in der Realität wirken zusätzlich Reservepreise je Suche und Kontextfaktoren.',
          quiz: [{ q: 'Ihr Maximalgebot ist 2,00 €. Was zahlen Sie typischerweise?', a: ['Immer 2,00 €', 'Meist weniger – so viel, wie nötig ist, um den Nächsten zu schlagen', 'Mehr als 2,00 €, wenn die Konkurrenz stark ist'], c: 1, why: 'Der CPC liegt nie über dem Maximalgebot (außer durch Gebotsanpassungen, die das Gebot selbst erhöhen).' }],
        },
      ],
      mission: {
        title: 'Qualitätsfaktor verbessern',
        brief: 'Das Keyword „trailschuhe" hat einen schwachen Qualitätsfaktor, weil es in keinem Anzeigentitel vorkommt. Bringen Sie es auf <b>QF 7 oder mehr</b> – ohne das Gebot zu erhöhen.',
        hint: 'Anzeigen → Anzeige der Gruppe „Laufschuhe" bearbeiten → einen Anzeigentitel mit „Trailschuhe" ergänzen.',
        industry: 'fashion', setup: () => {},
        checks: [
          { label: 'Keyword „trailschuhe" hat QF ≥ 7', test: (S) => { const k = H.kw(S, 'trailschuhe'); return !!k && G.M.qualityScore(S, k).score >= 7; } },
          { label: 'Keine Anzeige wurde abgelehnt', test: (S) => H.rsa(S).every((a) => a.policy.status !== 'disapproved') },
        ],
      },
    },
    {
      id: 'c2', icon: '🔑', level: 'Einsteiger', title: 'Kontostruktur, Keywords & Suchbegriffe',
      desc: 'Kampagnen sauber aufbauen, die richtigen Keyword-Optionen wählen und Streuverluste stoppen.',
      lessons: [
        {
          id: 'l1', title: 'Kampagne, Anzeigengruppe, Keyword',
          body: `<p>Ein Google-Ads-Konto ist hierarchisch aufgebaut:</p><ul><li><b>Kampagne</b>: Budget, Gebotsstrategie, Standorte, Sprachen, Netzwerke, Zeitplan</li><li><b>Anzeigengruppe</b>: ein Thema mit passenden Keywords und Anzeigen</li><li><b>Keywords & Anzeigen</b>: was ausgelöst wird und was der Nutzer sieht</li></ul>
            <p>Faustregeln: Kampagnen nach Zielen, Budgets oder Produktbereichen trennen; Anzeigengruppen thematisch eng halten, damit Anzeigentext und Keyword zusammenpassen. Markenkampagnen getrennt von generischen Kampagnen führen – sonst vermischen sich sehr unterschiedliche Kennzahlen.</p>`,
          diff: 'Die Struktur entspricht Google Ads. Die Oberfläche des Simulators ist an Google Ads angelehnt, aber vereinfacht (z. B. keine Kontoebenen-Hierarchie mit Verwaltungskonten, keine gemeinsam genutzten Budgets, keine Portfolio-Gebotsstrategien).',
          quiz: [{ q: 'Wo legen Sie Budget und Gebotsstrategie fest?', a: ['Auf Anzeigengruppenebene', 'Auf Kampagnenebene', 'Pro Keyword'], c: 1, why: 'Budget und Gebotsstrategie gelten für die ganze Kampagne (Portfolio-Strategien kampagnenübergreifend).' }],
        },
        {
          id: 'l2', title: 'Keyword-Optionen',
          body: `<ul><li><b>Genau passend [keyword]</b>: Suchen mit derselben Bedeutung (inkl. ähnlicher Varianten wie Plural, Tippfehler, Umstellungen)</li><li><b>Passende Wortgruppe "keyword"</b>: Suchen, die die Bedeutung des Keywords enthalten</li><li><b>Weitgehend passend</b>: verwandte Suchen – größte Reichweite, am meisten Streuung</li></ul>
            <p>Weitgehend passende Keywords sind heute vor allem in Kombination mit <b>Smart Bidding</b> sinnvoll, das pro Suche unterschiedlich bietet. Mit manuellen Geboten zahlen Sie für jede verwandte Suche dasselbe.</p>
            <p>Gibt es ein Keyword, das mit der Suche <b>identisch</b> ist, wird es bevorzugt – auch gegenüber Performance Max.</p>`,
          diff: 'Der Simulator gleicht Keywords über Wortstämme und Themen ab, nicht über echtes Bedeutungsverständnis. „Weitgehend passend" findet daher nur Suchen im selben Themenbereich oder mit gemeinsamen Wörtern – Google versteht Synonyme und Absicht deutlich besser.',
          quiz: [
            { q: 'Welche Option erreicht die meisten Suchanfragen?', a: ['Genau passend', 'Passende Wortgruppe', 'Weitgehend passend'], c: 2, why: 'Broad Match erreicht auch verwandte Suchen ohne die Keyword-Wörter.' },
            { q: 'Womit sollte Broad Match idealerweise kombiniert werden?', a: ['Manuellem CPC', 'Smart Bidding', 'Einem sehr niedrigen Budget'], c: 1, why: 'Smart Bidding bewertet jede Suche einzeln und senkt Gebote für schwache Suchen.' },
          ],
        },
        {
          id: 'l3', title: 'Suchbegriffe & ausschließende Keywords',
          body: `<p>Der <b>Suchbegriffbericht</b> zeigt, bei welchen tatsächlichen Suchen Ihre Anzeigen erschienen sind. Hier finden Sie neue Keyword-Ideen – und Streuverluste.</p>
            <p><b>Ausschließende Keywords</b> verhindern Auslieferungen. Typische Kandidaten: „kostenlos", „jobs", „gebraucht", „was ist", „anleitung". Wichtig: Ausschließende Keywords berücksichtigen <b>keine ähnlichen Varianten</b> – Plural- oder Schreibweisen müssen Sie selbst ergänzen. Für mehrere Kampagnen bieten sich <b>Listen</b> an.</p>`,
          diff: 'Im Simulator werden ausschließende Keywords über Wortstämme abgeglichen und erfassen daher teilweise auch Pluralformen – in Google Ads müssen Sie Varianten einzeln hinzufügen. Die Spalte „Kaufabsicht (Sim)" gibt es in Google Ads nicht; dort müssen Sie die Absicht aus dem Begriff und den Kennzahlen ableiten.',
          quiz: [{ q: 'Erfassen ausschließende Keywords in Google Ads ähnliche Varianten (z. B. Plural)?', a: ['Ja, automatisch', 'Nein, Varianten müssen ergänzt werden', 'Nur bei genau passend'], c: 1, why: 'Ausschlüsse arbeiten wörtlich – ein häufiger Fehler in der Praxis.' }],
        },
      ],
      mission: {
        title: 'Streuverluste stoppen',
        brief: 'Die Starterkampagne läuft seit drei Wochen. Schließen Sie Suchen mit <b>„kostenlos"</b>, <b>„jobs"</b> und <b>„gebraucht"</b> aus und fügen Sie einen gut laufenden Suchbegriff als <b>genau passendes</b> Keyword hinzu.',
        hint: 'Suchbegriffe ansehen → Begriffe auswählen → „Als ausschließendes Keyword" bzw. „Als Keyword hinzufügen" (genau passend). Alternativ: Ausschließende Keywords → ＋.',
        industry: 'fashion', setup: (S) => H.sim(S, 21),
        checks: [
          { label: '„kostenlos"-Suchen werden ausgeschlossen', test: (S) => H.search(S).some((c) => H.blocks(S, c.id, 'kostenlos')) },
          { label: '„jobs"-Suchen werden ausgeschlossen', test: (S) => H.search(S).some((c) => H.blocks(S, c.id, 'jobs')) },
          { label: '„gebraucht"-Suchen werden ausgeschlossen', test: (S) => H.search(S).some((c) => H.blocks(S, c.id, 'gebraucht')) },
          { label: 'Mindestens ein genau passendes Keyword aktiv', test: (S) => S.keywords.some((k) => k.match === 'exact' && k.status === 'enabled') },
        ],
      },
    },
    {
      id: 'c3', icon: '✍️', level: 'Einsteiger', title: 'Anzeigen, Assets & Richtlinien',
      desc: 'Responsive Suchanzeigen schreiben, Assets nutzen und Ablehnungen vermeiden.',
      lessons: [
        {
          id: 'l1', title: 'Responsive Suchanzeigen (RSA)',
          body: `<p>Eine RSA besteht aus bis zu <b>15 Anzeigentiteln (je 30 Zeichen)</b> und <b>4 Beschreibungen (je 90 Zeichen)</b>. Google kombiniert sie automatisch und lernt, welche Kombinationen funktionieren.</p>
            <p>Gute Praxis: viele <b>unterschiedliche</b> Titel (Nutzen, Angebot, Marke, Call-to-Action, Keyword), Keyword in mindestens zwei Titeln, nur sparsam <b>fixieren</b> (Pinning schränkt die Kombinationen ein). Die <b>Anzeigenstärke</b> gibt Feedback zur Vielfalt und Relevanz.</p>`,
          diff: 'In Google Ads ist die Anzeigenstärke laut Google kein direkter Auktionsfaktor, sondern eine Orientierung. Im Simulator beeinflusst sie die Klickrate direkt (bis ca. ±18 %), damit der Zusammenhang sichtbar wird. Die Kombination einzelner Titel wird nicht simuliert – nur die Gesamtqualität.',
          quiz: [{ q: 'Wie viele Anzeigentitel kann eine RSA maximal haben?', a: ['3', '10', '15'], c: 2, why: '15 Titel à 30 Zeichen und 4 Beschreibungen à 90 Zeichen.' }],
        },
        {
          id: 'l2', title: 'Assets (früher Anzeigenerweiterungen)',
          body: `<p>Assets erweitern Ihre Anzeige um Sitelinks, Zusatzinformationen, Snippets, Anrufe, Bilder, Preise, Angebote, Lead-Formulare, Standorte sowie Unternehmensname & Logo. Sie machen die Anzeige größer und relevanter – das erhöht Klickrate und fließt in den Ad Rank ein.</p>
            <p>Google entscheidet pro Auktion, welche Assets erscheinen; in oberen Positionen deutlich häufiger. Kampagnen-Assets überschreiben Konto-Assets desselben Typs.</p>`,
          diff: 'Der Simulator rechnet mit festen Prozent-Effekten je Asset-Typ (z. B. Sitelinks +10 % CTR, ab 4 Sitelinks mehr). In Google Ads ist der Effekt variabel und wird pro Auktion vorhergesagt. Die genauen Werte im Simulator sind Schätzungen, keine Google-Angaben.',
          quiz: [{ q: 'Wo werden Assets am häufigsten ausgeliefert?', a: ['In den oberen Anzeigenpositionen', 'Unterhalb der Suchergebnisse', 'Nur auf Mobilgeräten'], c: 0, why: 'Für Assets ist ein ausreichender Ad Rank erforderlich; oben ist der Platz dafür.' }],
        },
        {
          id: 'l3', title: 'Anzeigenprüfung & Richtlinien',
          body: `<p>Neue und geänderte Anzeigen werden geprüft – meist innerhalb eines Werktages. Häufige Ablehnungsgründe: <b>Ausrufezeichen im Anzeigentitel</b>, übermäßige Großschreibung, Wiederholung von Satzzeichen, Telefonnummern im Anzeigentext (dafür gibt es Anruf-Assets), nicht belegte Behauptungen, fremde Marken, nicht erreichbare Ziel-URLs.</p>
            <p>In regulierten Branchen (Finanzen, Gesundheit, Glücksspiel) gelten zusätzliche Regeln und Verifizierungen.</p>`,
          diff: 'Der Simulator prüft Richtlinien mit einfachen Textregeln. Google prüft automatisiert und manuell mit deutlich mehr Kontext; einige Regeln (z. B. „nicht belegte Superlative") sind im echten Google Ads differenzierter („Unzuverlässige Behauptungen", „Irreführende Inhalte").',
          quiz: [{ q: 'Welcher Anzeigentitel wird abgelehnt?', a: ['Sneaker jetzt entdecken', 'Sneaker jetzt kaufen!', 'Sneaker – Gratis Versand'], c: 1, why: 'Ausrufezeichen sind in Anzeigentiteln nicht zulässig.' }],
        },
      ],
      mission: {
        title: 'Starke Anzeige mit Assets',
        brief: 'Verbessern Sie eine Anzeige auf die Anzeigenstärke <b>„Gut" oder „Sehr gut"</b> – ohne Richtlinienverstoß – und legen Sie mindestens <b>4 Sitelinks</b> an.',
        hint: 'Anzeigen → „Bearbeiten" (mehr unterschiedliche Titel, Keywords und Marke einbauen) oder „✨ Assets generieren". Assets → ＋ Asset → Sitelinks.',
        industry: 'fashion', setup: () => {},
        checks: [
          { label: 'Eine Anzeige mit Stärke „Gut" oder „Sehr gut"', test: (S) => H.rsa(S).some((a) => ['Gut', 'Sehr gut'].includes(G.M.adStrength(S, a).label)) },
          { label: 'Keine abgelehnte Anzeige', test: (S) => H.rsa(S).every((a) => a.policy.status !== 'disapproved') },
          { label: 'Mindestens 4 aktive Sitelinks', test: (S) => S.assets.filter((a) => a.type === 'sitelink' && a.status === 'enabled').length >= 4 },
        ],
      },
    },
    {
      id: 'c4', icon: '🎯', level: 'Fortgeschritten', title: 'Gebotsstrategien & Budget',
      desc: 'Manuelle Gebote, Smart Bidding, Lernphase und Budget-Pacing verstehen.',
      lessons: [
        {
          id: 'l1', title: 'Manuell oder Smart Bidding?',
          body: `<p><b>Manueller CPC</b>: Sie legen Gebote je Keyword fest und steuern über Gebotsanpassungen (Gerät, Ort, Zeit, Zielgruppe). Volle Kontrolle, aber Sie sehen nicht, wie kaufbereit der einzelne Nutzer ist.</p>
            <p><b>Smart Bidding</b> (Conversions maximieren, Ziel-CPA, Conversion-Wert maximieren, Ziel-ROAS) schätzt für <b>jede Auktion</b> die Conversion-Wahrscheinlichkeit aus vielen Signalen und bietet entsprechend. Voraussetzung: zuverlässiges Conversion-Tracking und genügend Daten (Faustregel ≥ 30 Conversions in 30 Tagen).</p>
            <p>Mit Smart Bidding werden die meisten Gebotsanpassungen ignoriert – Ausnahme: Geräte mit −100 % ausschließen.</p>`,
          diff: 'Im Simulator sieht Smart Bidding u. a. Kaufabsicht, Remarketing-Zugehörigkeit und Kontext und schätzt die Conversion-Rate mit einem Fehler, der mit mehr Daten kleiner wird. Googles Modelle nutzen weit mehr Signale. Der „Auto-optimierte CPC" (eCPC) fehlt im Simulator – Google hat ihn für Such- und Shopping-Kampagnen 2025 eingestellt.',
          quiz: [{ q: 'Was braucht Smart Bidding unbedingt?', a: ['Ein hohes Budget', 'Zuverlässige Conversion-Daten', 'Viele Anzeigengruppen'], c: 1, why: 'Ohne Conversions fehlt das Lernsignal – Smart Bidding bietet dann blind.' }],
        },
        {
          id: 'l2', title: 'Lernphase & Zielwerte',
          body: `<p>Nach dem Start oder größeren Änderungen (Strategiewechsel, deutlich geänderte Zielwerte oder Budgets, neue Conversion-Aktionen) durchläuft Smart Bidding eine <b>Lernphase</b> mit schwankender Leistung.</p>
            <p>Praxis: Zielwerte in Schritten von 10–15 % ändern, nach Änderungen 1–2 Wochen abwarten und einen realistischen Ziel-CPA wählen – meist nahe am bisherigen CPA. Ein zu strenger Ziel-CPA schränkt die Reichweite ein („Eingeschränkt durch Ziel").</p>`,
          diff: 'Der Simulator nutzt feste Lernphasen (7 Tage bei Strategiewechsel, 5 bei Zieländerung > 20 %, 3 bei Budgetänderung > 50 %). Bei Google hängt die Dauer von Conversion-Volumen und Conversion-Zyklus ab.',
          quiz: [{ q: 'Bisheriger CPA: 40 €. Welcher Ziel-CPA ist für den Umstieg sinnvoll?', a: ['15 €', 'Ca. 40–45 €', '120 €'], c: 1, why: 'Ein Zielwert nahe der Realität gibt dem Algorithmus Spielraum; danach schrittweise verschärfen.' }],
        },
        {
          id: 'l3', title: 'Budget & Pacing',
          body: `<p>Das Tagesbudget ist ein <b>Durchschnitt</b>: Google darf an einzelnen Tagen bis zu <b>2×</b> ausgeben, im Kalendermonat aber höchstens <b>30,4 × Tagesbudget</b>. Reicht das Budget nicht, verpassen Sie Auktionen – sichtbar als „Verl. Impr.-Anteil (Budget)".</p>
            <p>Ist eine budgetbeschränkte Kampagne profitabel, Budget erhöhen. Ist sie es nicht, Gebote senken: Dann bekommen Sie mehr, aber günstigere Klicks.</p>`,
          diff: 'Die 2×-Regel und die 30,4-Monatsgrenze sind wie in Google Ads umgesetzt. Die Verteilung über den Tag erfolgt im Simulator über eine Teilnahmewahrscheinlichkeit; Googles Pacing ist komplexer und berücksichtigt erwartete Leistung je Tageszeit.',
          quiz: [{ q: 'Tagesbudget 100 €. Wie viel darf Google maximal an einem einzelnen Tag ausgeben?', a: ['100 €', '200 €', '3.040 €'], c: 1, why: 'Bis zu 2× pro Tag – über den Monat gleicht es sich aus (max. 3.040 € bei 30,4 Tagen).' }],
        },
      ],
      mission: {
        title: 'Umstieg auf Ziel-CPA',
        brief: 'Die Suchkampagne hat genug Conversion-Daten gesammelt. Stellen Sie sie auf <b>Ziel-CPA</b> um – mit einem realistischen Zielwert zwischen dem 0,9- und 1,4-Fachen des aktuellen CPA der letzten 30 Tage. Das Budget darf höchstens verdoppelt werden.',
        hint: 'Kampagnen → Gebotsstrategie anklicken → Ziel-CPA. Den aktuellen Wert „Kosten/Conv." sehen Sie in der Kampagnentabelle (Zeitraum: letzte 30 Tage).',
        industry: 'fashion', setup: (S) => H.sim(S, 35),
        checks: [
          { label: 'Suchkampagne nutzt Ziel-CPA', test: (S) => H.search(S).some((c) => c.bidStrategy.type === 'tcpa') },
          { label: 'Ziel-CPA realistisch (0,9–1,4 × aktueller CPA)', test: (S) => H.search(S).some((c) => { if (c.bidStrategy.type !== 'tcpa') return false; const cpa = H.cpa30(S, c.id); return cpa > 0 && c.bidStrategy.targetCpa >= cpa * 0.9 && c.bidStrategy.targetCpa <= cpa * 1.4; }) },
          { label: 'Budget höchstens verdoppelt', test: (S) => H.search(S).every((c) => c.budget <= (G.M.STARTER_BUDGET[S.ind] || 100) * 2) },
        ],
      },
    },
    {
      id: 'c5', icon: '📏', level: 'Fortgeschritten', title: 'Messung, Conversions & Attribution',
      desc: 'Warum gemessene Conversions nie die ganze Wahrheit sind – und wie Sie die Lücke verkleinern.',
      lessons: [
        {
          id: 'l1', title: 'Conversion-Aktionen & Verzögerung',
          body: `<p><b>Primäre</b> Conversion-Aktionen erscheinen in der Spalte „Conversions" und steuern Smart Bidding; <b>sekundäre</b> werden nur beobachtet („Alle Conv."). Optimieren Sie auf das, was wirklich Wert schafft – etwa auf den Kauf, nicht auf „In den Einkaufswagen".</p>
            <p>Conversions werden dem <b>Klickdatum</b> zugeordnet, kommen aber oft Tage später. Die letzten Tage sehen deshalb immer schlechter aus, als sie sind.</p>`,
          diff: 'Wie in Google Ads werden Conversions dem Klicktag zugerechnet und nachgemeldet. Die Verzögerungsverteilung je Branche ist im Simulator eine Schätzung.',
          quiz: [{ q: 'Welche Aktionen steuern Smart Bidding?', a: ['Alle Conversion-Aktionen', 'Nur primäre Aktionen', 'Nur Anrufe'], c: 1, why: 'Sekundäre Aktionen dienen der Beobachtung.' }],
        },
        {
          id: 'l2', title: 'Consent Mode, erweiterte Conversions & Tracking-Fehler',
          body: `<p>Lehnt ein Nutzer Cookies ab, kann die Conversion nicht direkt gemessen werden. Der <b>Consent Mode (erweitert)</b> sendet cookielose Signale, aus denen Google fehlende Conversions <b>modelliert</b>. <b>Erweiterte Conversions</b> nutzen gehashte Erstanbieterdaten (z. B. E-Mail) für eine bessere Zuordnung.</p>
            <p>Größte Gefahr: ein unbemerkt kaputtes Tag nach einem Website-Update. Dann sieht Smart Bidding keine Conversions mehr und senkt die Gebote massiv – kontrollieren Sie das Tracking regelmäßig.</p>`,
          diff: 'Der Simulator rechnet mit einer festen Zustimmungsrate (ca. 74 %) und modelliert beim erweiterten Consent Mode 70 % der fehlenden Conversions. Echte Werte schwanken stark nach Website, Banner-Gestaltung und Zielgruppe. Die Kennzahlen „Echte Conv. (Sim)" und „Echter Umsatz (Sim)" gibt es in Google Ads nicht – dort müssen Sie Ihr CRM oder Shopsystem gegenrechnen.',
          quiz: [{ q: 'Was macht der erweiterte Consent Mode?', a: ['Er umgeht die Einwilligung', 'Er modelliert fehlende Conversions aus cookielosen Signalen', 'Er schaltet das Cookie-Banner ab'], c: 1, why: 'Die Einwilligung bleibt maßgeblich; Google schätzt nur die Lücke.' }],
        },
        {
          id: 'l3', title: 'Attribution & Offline-Conversions',
          body: `<p>Standardmodell in Google Ads ist die <b>datengetriebene Attribution</b>: Sie verteilt den Conversion-Wert auf mehrere Klicks einer Customer Journey. „Letzter Klick" ordnet alles dem letzten Klick zu.</p>
            <p>Bei Leads geschieht der eigentliche Abschluss oft später im Vertrieb. Mit <b>Offline-Conversion-Import</b> (z. B. per GCLID oder erweiterten Conversions für Leads) melden Sie Abschlüsse und Werte aus dem CRM zurück – so optimiert Google auf echte Kunden statt auf Formulare.</p>`,
          diff: 'Im Simulator vergibt die datengetriebene Attribution vereinfacht bis zu 25 % des Werts an Display/Video/Demand-Gen-Kampagnen mit Sichtkontakt. Googles Modell bewertet tatsächliche Pfade. Die Modelle „Erster Klick", „Linear" usw. hat Google 2023 entfernt – auch der Simulator bietet nur „Datengetrieben" und „Letzter Klick".',
          quiz: [{ q: 'Wozu dient der Offline-Conversion-Import?', a: ['Um Klicks zu importieren', 'Um echte Abschlüsse aus dem CRM an Google Ads zurückzumelden', 'Um Offline-Werbung zu schalten'], c: 1, why: 'So kann Smart Bidding auf echte Kunden statt auf Formulareingänge optimieren.' }],
        },
      ],
      mission: {
        title: 'Messung reparieren',
        brief: 'Nach einem Website-Update ist das Conversion-Tracking ausgefallen, und die Messung ist lückenhaft. Reparieren Sie das Tracking, stellen Sie den Consent Mode auf <b>erweitert</b> und aktivieren Sie <b>erweiterte Conversions</b>.',
        hint: 'Tools → Conversions. Tipp: „Tag testen" zeigt, ob das Tag funktioniert.',
        industry: 'fashion', setup: (S) => { H.sim(S, 10); S.account.trackingOk = false; },
        checks: [
          { label: 'Conversion-Tracking funktioniert', test: (S) => S.account.trackingOk },
          { label: 'Consent Mode erweitert', test: (S) => S.account.consentMode === 'advanced' },
          { label: 'Erweiterte Conversions aktiv', test: (S) => S.account.enhancedConv },
        ],
      },
    },
    {
      id: 'c6', icon: '👥', level: 'Fortgeschritten', title: 'Zielgruppen & Ausrichtung',
      desc: 'Zielgruppen, Demografie, Standorte, Werbezeitplan und Geräte gezielt einsetzen.',
      lessons: [
        {
          id: 'l1', title: 'Zielgruppen: Beobachtung vs. Ausrichtung',
          body: `<p>Segmente: <b>kaufbereite Zielgruppen</b> (In-Market), <b>gemeinsame Interessen</b>, <b>Lebensereignisse</b>, <b>Ihre Daten</b> (Website-Besucher, Kundenlisten/Customer Match) und <b>benutzerdefinierte Segmente</b> (z. B. Personen, die nach bestimmten Begriffen gesucht haben).</p>
            <p><b>Beobachtung</b> sammelt Daten und erlaubt Gebotsanpassungen, ohne die Reichweite zu begrenzen – Standard für Suchkampagnen. <b>Ausrichtung</b> beschränkt die Auslieferung auf das Segment – typisch für Display und Video.</p>`,
          diff: 'Im Simulator wirken Segmente über feste Faktoren auf Klick- und Conversion-Rate (z. B. Warenkorbabbrecher ×3,1). In Google Ads hängen die Effekte stark vom Angebot ab. „Ähnliche Zielgruppen" gibt es seit 2023 nicht mehr – auch nicht im Simulator.',
          quiz: [{ q: 'Welche Einstellung ist für Suchkampagnen meist richtig?', a: ['Ausrichtung', 'Beobachtung', 'Keine Zielgruppen'], c: 1, why: 'Beobachtung liefert Daten, ohne Reichweite zu verlieren.' }],
        },
        {
          id: 'l2', title: 'Standort, Zeitplan, Geräte & Demografie',
          body: `<p><b>Standortoptionen</b>: „Präsenz" (Personen, die sich an Ihren Zielorten befinden oder regelmäßig dort sind) ist meist besser als „Präsenz oder Interesse".</p>
            <p><b>Werbezeitplan</b> und <b>Geräte</b>: Gebotsanpassungen in Prozent; −100 % schließt aus. Werten Sie Leistung nach Stunde, Wochentag und Gerät aus, bevor Sie anpassen – und denken Sie an die Conversion-Verzögerung.</p>
            <p>Mit Smart Bidding sind die meisten dieser Anpassungen überflüssig – der Algorithmus berücksichtigt Ort, Zeit und Gerät automatisch.</p>`,
          diff: 'Der Simulator bildet 16 Bundesländer sowie Österreich und die Schweiz ab; Google erlaubt Ausrichtungen bis auf Städte, PLZ und Umkreise. Alters- und Geschlechtsgruppen entsprechen Google Ads; Haushaltseinkommen ist in Deutschland ohnehin nicht verfügbar.',
          quiz: [{ q: 'Wie schließen Sie Tablets aus?', a: ['Gebotsanpassung −100 %', 'Gebotsanpassung −50 %', 'Gar nicht möglich'], c: 0, why: '−100 % ist ein Ausschluss – das gilt auch mit Smart Bidding.' }],
        },
      ],
      mission: {
        title: 'Ausrichtung verfeinern',
        brief: 'Für den Schlüssel- und Sanitärnotdienst: Fügen Sie der Suchkampagne die Remarketing-Liste <b>„Website-Besucher (30 Tage)"</b> zur <b>Beobachtung</b> hinzu und senken Sie die Gebote <b>nachts (0–6 Uhr) um 50 %</b> per Werbezeitplan.',
        hint: 'Zielgruppen → Katalog → Hinzufügen. Werbezeitplaner → Kampagne wählen → Vorlage „Nachts −50 %".',
        industry: 'local', setup: (S) => H.sim(S, 14),
        checks: [
          { label: 'Website-Besucher als Beobachtung hinzugefügt', test: (S) => H.search(S).some((c) => c.audiences.some((a) => a.id === 'rmv' && a.mode === 'observation')) },
          { label: 'Werbezeitplan: nachts −50 %', test: (S) => H.search(S).some((c) => c.schedule && c.schedule.every((day) => [0, 1, 2, 3, 4, 5].every((h) => day[h] !== null && day[h] <= -40))) },
        ],
      },
    },
    {
      id: 'c7', icon: '⚡', level: 'Fortgeschritten', title: 'Shopping, Performance Max, Display & Video',
      desc: 'Die automatisierten und visuellen Kampagnentypen richtig einordnen.',
      lessons: [
        {
          id: 'l1', title: 'Shopping & Merchant Center',
          body: `<p>Shopping-Anzeigen basieren auf Ihrem <b>Produktfeed</b> im Merchant Center – nicht auf Keywords. Entscheidend sind Produkttitel, Bilder, vollständige Attribute (GTIN) und <b>Preis-Wettbewerbsfähigkeit</b>.</p>
            <p>Produkte ohne Lagerbestand werden nicht ausgeliefert, fehlende GTINs schränken die Sichtbarkeit ein.</p>`,
          diff: 'Der Simulator hat einen kleinen Feed mit wenigen Produkten je Thema und berechnet die Feed-Qualität aus GTIN, Bildqualität und Titel. Echte Feeds haben hunderte Attribute, Feed-Regeln, Produktgruppen-Unterteilungen und Diagnosen.',
          quiz: [{ q: 'Woraus entstehen Shopping-Anzeigen?', a: ['Aus Keywords', 'Aus dem Produktfeed im Merchant Center', 'Aus Bildanzeigen'], c: 1, why: 'Google gleicht Suchanfragen mit Ihren Produktdaten ab.' }],
        },
        {
          id: 'l2', title: 'Performance Max',
          body: `<p>Performance Max (PMax) liefert mit <b>einer Kampagne</b> auf allen Kanälen aus: Suche, Shopping, Display, YouTube, Discover, Gmail und Maps. Sie steuern über <b>Asset-Gruppen</b> (Texte, Bilder, Videos), <b>Zielgruppensignale</b>, <b>Suchthemen</b> und Ihr Ziel (Conversions oder Wert).</p>
            <p>Wichtig: PMax bedient oft auch Markensuchen. Mit dem <b>Markenausschluss</b> verhindern Sie, dass PMax sich günstige Markenconversions „gutschreibt". Identische genau passende Such-Keywords haben Vorrang vor PMax.</p>`,
          diff: 'Im Simulator nimmt PMax an Such- und Shopping-Auktionen teil und erhält Display-/YouTube-/Discover-Inventar über ein vereinfachtes Reichweitenmodell. Maps und Gmail werden nicht gesondert simuliert; der Kanalbericht ist eine Annäherung an Googles Kanalberichte.',
          quiz: [{ q: 'Wie verhindern Sie, dass PMax Ihre Markensuchen bedient?', a: ['Budget senken', 'Markenausschluss aktivieren', 'Weniger Bilder hochladen'], c: 1, why: 'Der Markenausschluss nimmt eigene Markensuchen aus der PMax-Auslieferung.' }],
        },
        {
          id: 'l3', title: 'Display, Demand Gen & Video',
          body: `<p>Visuelle Kampagnen erzeugen günstige Reichweite und Bekanntheit, aber meist weniger direkte Conversions. Typische Fallen: versehentliche Klicks in Mobile-Apps, Platzierungen auf minderwertigen Websites, Creative-Ermüdung.</p>
            <p>Maßnahmen: Inhaltsausschlüsse und Placement-Ausschlüsse, Frequency Capping, Creatives regelmäßig erneuern und Erfolg am echten Ergebnis messen – nicht an View-through-Conversions.</p>`,
          diff: 'Die Effekte (App-Inventar 35 % der Display-Reichweite, Creative-Ermüdung bis −42 %, Markenbekanntheit als einzelner Wert) sind Modellannahmen des Simulators. In Google Ads können Sie Placements einzeln ausschließen und sehen, wo Ihre Anzeigen liefen; der Simulator bietet nur pauschale Schalter.',
          quiz: [{ q: 'Woran sollten Sie Display-Kampagnen vor allem messen?', a: ['An View-through-Conversions', 'Am echten Geschäftsergebnis und an Conversions nach Klick', 'An Impressionen'], c: 1, why: 'View-through-Conversions überschätzen den Beitrag leicht.' }],
        },
      ],
      mission: {
        title: 'Performance Max mit Markenausschluss',
        brief: 'Erstellen Sie eine <b>Performance-Max-Kampagne</b> und aktivieren Sie den <b>Markenausschluss</b>. Legen Sie außerdem eine <b>Shopping-Kampagne</b> an.',
        hint: '＋ Neue Kampagne → Ziel Umsätze → Performance Max bzw. Shopping. Den Markenausschluss aktivieren Sie anschließend in den Kampagneneinstellungen (⚙).',
        industry: 'fashion', setup: () => {},
        checks: [
          { label: 'PMax-Kampagne vorhanden', test: (S) => S.campaigns.some((c) => c.type === 'pmax' && c.status !== 'removed') },
          { label: 'Markenausschluss in PMax aktiv', test: (S) => S.campaigns.some((c) => c.type === 'pmax' && c.status !== 'removed' && c.pmax.brandExclusion) },
          { label: 'Shopping-Kampagne vorhanden', test: (S) => S.campaigns.some((c) => c.type === 'shopping' && c.status !== 'removed') },
        ],
      },
    },
    {
      id: 'c8', icon: '📊', level: 'Profi', title: 'Analyse, Tests & Optimierung',
      desc: 'Daten richtig lesen, Hypothesen testen und Empfehlungen kritisch prüfen.',
      lessons: [
        {
          id: 'l1', title: 'Anteil an Impressionen & Auktionsdaten',
          body: `<p>Der <b>Anteil an möglichen Impressionen</b> zeigt, wie viel der möglichen Sichtbarkeit Sie erreichen. Die Verluste teilen sich in <b>Budget</b> und <b>Rang</b>. Die <b>Auktionsdaten</b> zeigen, mit wem Sie konkurrieren: Überschneidungsrate, Rate der höheren Position, Anteil oben auf der Seite.</p>
            <p>Steigt die Überschneidungsrate eines Mitbewerbers plötzlich, investiert er gerade – oft der Grund für steigende CPCs.</p>`,
          diff: 'Google zeigt in den Auktionsdaten nur Werbetreibende ab einer gewissen Relevanz; der Simulator blendet Mitbewerber unter 10 % Anteil aus und fasst kleinere Bieter zusammen. Die Mitbewerber im Simulator sind fiktiv und handeln nach einfachen Strategieprofilen.',
          quiz: [{ q: 'Hoher „Verl. Impr.-Anteil (Rang)" bedeutet …', a: ['Budget zu niedrig', 'Gebot oder Qualität zu niedrig', 'Zu viele Keywords'], c: 1, why: 'Rang-Verluste entstehen durch zu niedrigen Ad Rank.' }],
        },
        {
          id: 'l2', title: 'Tests (Experimente)',
          body: `<p>Mit einem <b>Test</b> teilen Sie den Traffic einer Kampagne zwischen Original und Testversion auf – etwa um eine neue Gebotsstrategie, Landingpage oder Keyword-Option zu prüfen. Planen Sie mindestens 2–4 Wochen (Lernphase plus Conversion-Verzögerung) und achten Sie auf <b>statistische Signifikanz</b>, bevor Sie einen Gewinner übernehmen.</p>`,
          diff: 'Der Simulator teilt die Auktionen zufällig und berechnet die Signifikanz mit einem einfachen z-Test auf Conversion-Rate und CTR. Google nutzt eigene statistische Verfahren und erlaubt weitere Testtypen (z. B. Anzeigenvarianten, Video-Tests).',
          quiz: [{ q: 'Nach einer Woche zeigt der Test-Arm 20 % mehr Conversions bei 60 % Konfidenz. Was tun?', a: ['Sofort übernehmen', 'Weiterlaufen lassen, bis genügend Daten und Signifikanz vorliegen', 'Test abbrechen'], c: 1, why: 'Ohne Signifikanz kann der Unterschied Zufall sein.' }],
        },
        {
          id: 'l3', title: 'Empfehlungen kritisch prüfen',
          body: `<p>Der <b>Optimierungsfaktor</b> und die Empfehlungen sind hilfreich – aber sie dienen nicht automatisch Ihrem Gewinn. Budgeterhöhungen, Broad Match oder automatisch erstellte Assets können sinnvoll sein oder Kosten treiben. Prüfen Sie jede Empfehlung gegen Ihre Marge und Ihre Ziele; automatisches Anwenden nur für unkritische Typen.</p>`,
          diff: 'Die Empfehlungen des Simulators sind regelbasiert und teils bewusst gewinnneutral formuliert (wie bei Google). Der echte Optimierungsfaktor bewertet deutlich mehr Empfehlungsarten und gewichtet sie dynamisch.',
          quiz: [{ q: 'Ein höherer Optimierungsfaktor bedeutet immer mehr Gewinn.', a: ['Richtig', 'Falsch'], c: 1, why: 'Er misst die Umsetzung von Google-Empfehlungen, nicht Ihre Profitabilität.' }],
        },
      ],
      mission: {
        title: 'Smart Bidding testen',
        brief: 'Starten Sie einen <b>Test</b> für die Suchkampagne, der eine <b>Smart-Bidding-Strategie</b> gegen die manuellen Gebote prüft.',
        hint: 'Tools → Tests → ＋ Benutzerdefinierter Test → „Gebotsstrategie" mit z. B. Ziel-CPA oder Conversions maximieren.',
        industry: 'fashion', setup: (S) => H.sim(S, 30),
        checks: [
          { label: 'Laufender Test vorhanden', test: (S) => S.experiments.some((x) => x.status === 'running') },
          { label: 'Test prüft eine Smart-Bidding-Strategie', test: (S) => S.experiments.some((x) => x.status === 'running' && x.kind === 'bid' && x.bid && G.D.BID_STRATEGIES[x.bid.type].smart) },
        ],
      },
    },
    {
      id: 'c9', icon: '🧠', level: 'Profi', title: 'Kaufverhalten, Psychologie & Conversion-Optimierung',
      desc: 'Was Klicks zu Kunden macht – und wo Manipulation teuer wird.',
      lessons: [
        {
          id: 'l1', title: 'Psychologische Trigger in Anzeigen',
          body: `<p>Bewährte Prinzipien: <b>Social Proof</b> (Bewertungen, Kundenzahlen), <b>Autorität</b> (Auszeichnungen, Siegel, Einlagensicherung), <b>Risikoumkehr</b> (Gratis-Rückversand, jederzeit kündbar), <b>Preisanker</b> (Streichpreise, Rabatte), <b>Verknappung</b> (befristete Aktionen) und ein klarer <b>Call-to-Action</b>.</p>
            <p>Die Wirkung hängt vom Kontext ab: Social Proof hilft unbekannten Marken am meisten; Verknappung wirkt bei hoher Kaufabsicht, im B2B- und Finanzumfeld aber unseriös. Zu viele Trigger in einer Anzeige wirken reißerisch.</p>`,
          diff: 'Die Effektgrößen im Simulator (z. B. Social Proof bis +8 % CTR) sind plausibel gewählte Modellwerte, keine Google- oder Studienwerte. Google selbst bewertet Anzeigentexte nicht nach psychologischen Triggern – die Analyse in „Conversion & Psychologie" ist ein Simulator-Werkzeug.',
          quiz: [{ q: 'Wo wirkt Verknappung („nur heute!") am ehesten kontraproduktiv?', a: ['Im Modeshop bei Sale-Suchen', 'Bei Festgeld für Geschäftskunden', 'Bei Reise-Last-Minute-Suchen'], c: 1, why: 'Im Finanz- und B2B-Umfeld wirkt künstlicher Druck unseriös.' }],
        },
        {
          id: 'l2', title: 'Shop- und Landingpage-Hebel',
          body: `<p>Nach dem Klick entscheidet die Seite: Vertrauen (Bewertungen, Siegel), Reibung (Gastbestellung, Express-Checkout), Zahlarten (in Deutschland beliebt: Kauf auf Rechnung), Versandschwellen und Beratung (Chat). Jeder Hebel hat Kosten und Nebenwirkungen – Gratis-Rücksendung steigert Retouren, Rabatt-Popups erziehen zum Warten auf Rabatte.</p>
            <p><b>Dark Patterns</b> wie unechte Countdowns oder erfundene Besucherzahlen wirken kurzfristig, zerstören Vertrauen und sind nach UWG abmahnfähig. Streichpreise müssen sich nach der Preisangabenverordnung auf den niedrigsten Preis der letzten 30 Tage beziehen.</p>
            <p><b>Verkäuferbewertungen</b> (Sterne in Anzeigen) erscheinen in der Regel erst ab 100 Rezensionen und einer Durchschnittsbewertung von 3,5.</p>`,
          diff: 'Effekte, Kosten und Abmahnwahrscheinlichkeiten sind vereinfachte Annahmen – keine Rechtsberatung. Shop-Optimierungen liegen in der Praxis außerhalb von Google Ads (Website, Shopsystem, Payment-Anbieter); der Simulator bündelt sie zur Veranschaulichung.',
          quiz: [{ q: 'Worauf müssen sich Streichpreise in Deutschland beziehen?', a: ['Auf die UVP', 'Auf den niedrigsten Preis der letzten 30 Tage', 'Auf den Preis der Konkurrenz'], c: 1, why: 'So verlangt es die Preisangabenverordnung (§ 11 PAngV) bei Preisermäßigungen.' }],
        },
        {
          id: 'l3', title: 'Kundenwert statt Erstkauf',
          body: `<p>Ein Kunde ist mehr wert als sein erster Kauf: Wiederkäufe, Verlängerungen und Weiterempfehlungen kommen ohne erneute Werbekosten. Wer den <b>Kundenwert</b> kennt, darf für die Neukundengewinnung mehr bezahlen als Wettbewerber, die nur auf den Erstkauf schauen. Gleichzeitig führen Rabatte und Gastbestellungen oft zu weniger Wiederkäufen.</p>`,
          diff: 'Wiederkaufraten und -zeitpunkte sind branchenbezogene Annahmen des Simulators. In Google Ads lässt sich der Kundenwert über Conversion-Werte, Neukunden-Akquisitionsziele und Value-based Bidding abbilden.',
          quiz: [{ q: 'Warum darf die Neukundengewinnung mehr kosten als der Gewinn aus dem Erstkauf?', a: ['Weil Google es empfiehlt', 'Weil Wiederkäufe den Kundenwert erhöhen', 'Das darf sie nie'], c: 1, why: 'Der Kundenwert über die gesamte Beziehung zählt.' }],
        },
      ],
      mission: {
        title: 'Seriöse Conversion-Optimierung',
        brief: 'Im Shop läuft ein unechter Countdown. Schalten Sie ihn ab, aktivieren Sie <b>mindestens zwei seriöse Shop-Hebel</b> und bauen Sie <b>Social Proof</b> (z. B. Bewertungen oder Kundenzahl) in eine Suchanzeige ein.',
        hint: 'Unternehmen → Conversion & Psychologie. Anzeigen → Bearbeiten, z. B. „Über 10.000 zufriedene Kunden".',
        industry: 'fashion', setup: (S) => { G.PSY.toggle(S, 'countdown'); },
        checks: [
          { label: 'Kein Dark Pattern aktiv', test: (S) => !G.PSY.CRO.some((c) => c.dark && G.PSY.state(S).cro[c.id]) },
          { label: 'Mind. 2 seriöse Hebel aktiv', test: (S) => G.PSY.CRO.filter((c) => !c.dark && !c.legal && G.PSY.state(S).cro[c.id]).length >= 2 },
          { label: 'Suchanzeige mit Social Proof', test: (S) => H.rsa(S).some((a) => G.PSY.analyze(a).includes('social') && a.policy.status !== 'disapproved') },
        ],
      },
    },
    {
      id: 'c10', icon: '🏦', level: 'Profi', title: 'SEA im Einlagengeschäft (Bank-Modus)',
      desc: 'Tagesgeld, Festgeld, Geschäftskonto & Visa für Firmenkunden bewerben – mit Zinsen, Compliance und echten Abschlüssen.',
      lessons: [
        {
          id: 'l1', title: 'Was zählt im Passivgeschäft?',
          body: `<p>Nicht Anträge, sondern <b>Einlagenvolumen</b> und dessen <b>Marge</b> gegenüber der Refinanzierungsalternative (z. B. EZB-Einlagesatz, Kapitalmarkt). Ein höherer Zins steigert die Abschlussquote, kostet aber Marge auf das gesamte Volumen. Kunden, die nur wegen eines Spitzenzinses kommen („heißes Geld"), ziehen bei der nächsten Aktion eines Wettbewerbers wieder ab.</p>
            <p>Kluge Anleger vergleichen den <b>effektiven 12-Monats-Zins</b>, nicht den Lockzins. Zinsänderungen erfordern in Banken meist eine Freigabe durch Treasury/ALCO.</p>`,
          diff: 'Refinanzierungswerte, Marktreaktionen, Einlagengrößen und Abflussraten sind Modellannahmen. Die Konditionen der VW Bank für Tages- und Festgeld beruhen auf öffentlich recherchierten Werten (Stand Oktober 2026), die für Geschäftskonto und Visa Business sind Annahmen. Alle Mitbewerber sind fiktiv. Der Simulator ist nicht mit der Volkswagen Bank verbunden.',
          quiz: [{ q: 'Woran messen Sie den Erfolg von SEA im Einlagengeschäft am besten?', a: ['An der Zahl der Anträge', 'An Neuvolumen, Marge und Kosten je 1.000 € Neuvolumen', 'An der Klickrate'], c: 1, why: 'Anträge enthalten Privatkunden und Abbrecher; erst Volumen und Marge zeigen den Wert.' }],
        },
        {
          id: 'l2', title: 'Privatkunden aussteuern & Funnel messen',
          body: `<p>Generische Suchen wie „tagesgeld" oder „girokonto" kommen fast ausschließlich von Privatkunden. Wer Geschäftskundenprodukte bewirbt, sollte die Zielgruppe im Anzeigentext nennen („für Geschäftskunden", „GmbH") – das kostet Klicks, filtert aber Fehlanträge heraus.</p>
            <p>Der Funnel ist lang: Antrag gestartet → abgeschickt → Legitimation → KYC-Prüfung → Konto eröffnet → Ersteinzahlung. Optimiert Smart Bidding nur auf „Antrag abgeschickt", jagt es billige Fehlanträge. Mit <b>Offline-Conversion-Import</b> optimieren Sie auf eröffnete Konten und deren Wert.</p>`,
          diff: 'Anteile von Geschäftskunden je Suchbegriff, Abschlussquoten und KYC-Dauer sind Schätzungen. In der Realität kommen Anforderungen wie Transparenzregister, wirtschaftlich Berechtigte und Geldwäscheprüfung hinzu, die der Simulator nur pauschal abbildet.',
          quiz: [{ q: 'Warum ist „Antrag abgeschickt" als primäre Conversion problematisch?', a: ['Weil es zu wenige sind', 'Weil abgelehnte Privatkunden-Anträge mitzählen und Smart Bidding falsch lernt', 'Weil Google es verbietet'], c: 1, why: 'Smart Bidding optimiert auf das gemessene Ziel – auch wenn es kein echter Kunde ist.' }],
        },
        {
          id: 'l3', title: 'Compliance bei Zinswerbung',
          body: `<p>Zinsangaben in Anzeigen müssen mit der Landingpage übereinstimmen und vollständig sein (z. B. „p. a."). Wer Konditionen ändert, muss Anzeigentexte sofort anpassen – sonst droht die Ablehnung wegen irreführender Angaben. „Kostenlos" ist bei einem Konto mit Kontoführungsentgelt unzulässig. Finanzwerbung erfordert in Deutschland die <b>Verifizierung als Finanzdienstleister</b> bei Google (Abgleich mit dem BaFin-Register).</p>`,
          diff: 'Die Ablehnung nach etwa zwei Tagen bei abweichenden Zinsangaben ist eine Vereinfachung – in der Praxis greifen Google-Prüfung, Wettbewerbsrecht und interne Compliance unabhängig voneinander. Die Verifizierungspflicht gilt in Deutschland laut Google seit dem 24.01.2023.',
          quiz: [{ q: 'Sie senken den Tagesgeldzins von 2,00 % auf 1,90 %. Was müssen Sie in Google Ads tun?', a: ['Nichts', 'Alle Anzeigen mit „2,00 %" anpassen', 'Nur das Budget senken'], c: 1, why: 'Veraltete Zinsangaben sind irreführend und führen zur Ablehnung.' }],
        },
      ],
      mission: {
        title: 'Bankkampagnen professionalisieren',
        brief: 'Beauftragen Sie den <b>Offline-Conversion-Import</b>, nennen Sie in <b>allen Suchanzeigen</b> die Zielgruppe Geschäftskunden und pausieren Sie die generischen weitgehend passenden Keywords <b>„tagesgeld"</b> und <b>„festgeld"</b>.',
        hint: 'Konditionen & Zinsen → CRM-Anbindung beauftragen. Anzeigen bearbeiten (z. B. Titel „Für Geschäftskunden"). Keywords → Status-Schalter.',
        industry: 'vwbank', setup: (S) => H.sim(S, 14),
        checks: [
          { label: 'Offline-Import beauftragt oder aktiv', test: (S) => S.bank && S.bank.offline.status !== 'off' },
          { label: 'Alle Suchanzeigen nennen Geschäftskunden', test: (S) => H.rsa(S).length > 0 && H.rsa(S).every((a) => G.BANK.isB2B(a)) },
          { label: '„tagesgeld" & „festgeld" (weitgehend) pausiert', test: (S) => ['tagesgeld', 'festgeld'].every((t) => !S.keywords.some((k) => k.text === t && k.match === 'broad' && k.status === 'enabled')) },
        ],
      },
    },
    {
      id: 'c11', icon: '🔍', level: 'Alle', title: 'Simulator vs. echtes Google Ads',
      desc: 'Was der Simulator vereinfacht, verändert oder zusätzlich zeigt – gesammelt an einem Ort.',
      lessons: [
        {
          id: 'l1', title: 'Was nur der Simulator zeigt',
          body: `<ul><li><b>Echte Conversions, echter Umsatz, echter ROAS (Sim)</b>: In Google Ads sehen Sie nur gemessene Werte; die Wahrheit müssen Sie aus CRM, Shop oder Buchhaltung gegenrechnen.</li>
            <li><b>Kaufabsicht (Sim)</b> im Suchbegriffbericht und die Anteile von Geschäftskunden im Bank-Modus.</li>
            <li><b>Markt- und Mitbewerberdaten</b>: Nachfrage-, CPC- und Kauflaune-Index, geschätzte Budgets, Bietintensität und „Marktgerüchte" sind Simulator-Einblicke. Google liefert nur Auktionsdaten und Keyword-Planer-Schätzungen.</li>
            <li><b>Unternehmens-GuV, Kasse, Kredite, Geschäftsleitung, Sanktionen</b>: Spielmechanik ohne Gegenstück in Google Ads.</li>
            <li><b>Psychologie-Analyse, Shop-Hebel, Verkäufer-Sterne-Entwicklung</b>: Modellwerte zur Veranschaulichung.</li>
            <li><b>Kostenpflichtige Tipps & Analysen</b>: Spielmechanik; Google bietet Empfehlungen kostenlos.</li></ul>`,
          diff: 'Diese Elemente gibt es so nicht in Google Ads. Sie helfen, Zusammenhänge sichtbar zu machen, die in der Praxis verborgen bleiben.',
          quiz: [{ q: 'Wo finden Sie in der Praxis den „echten" Umsatz Ihrer Anzeigen?', a: ['In der Spalte Conversions in Google Ads', 'Durch Abgleich mit CRM, Shop oder Buchhaltung', 'Im Keyword-Planer'], c: 1, why: 'Google Ads zeigt nur, was gemessen werden kann.' }],
        },
        {
          id: 'l2', title: 'Was der Simulator vereinfacht',
          body: `<ul><li><b>Auktion</b>: Ad Rank als einfache Formel, Suchen stündlich gebündelt, Qualitätsfaktor direkt im Ad Rank.</li>
            <li><b>Keyword-Abgleich</b> über Wortstämme und Themen statt Bedeutungsverständnis; ausschließende Keywords erfassen teils Pluralformen.</li>
            <li><b>Smart Bidding</b> mit vereinfachtem Lernmodell und festen Lernphasen; eCPC fehlt (von Google 2025 eingestellt).</li>
            <li><b>Assets, Anzeigenstärke, Zielgruppen</b> wirken mit festen Faktoren; Anzeigenstärke beeinflusst die CTR direkt.</li>
            <li><b>Richtlinien</b> über einfache Textregeln; Prüfzeit pauschal ein Tag.</li>
            <li><b>Standorte</b> nur Bundesländer, Österreich, Schweiz; keine Städte, PLZ oder Umkreise.</li>
            <li><b>Kampagnenfunktionen</b>: keine Portfolio-Strategien, gemeinsam genutzten Budgets, Verwaltungskonten, Skripte, Regeln, Labels-Filter oder Editor; Display-Placements nur pauschal ausschließbar.</li>
            <li><b>Zeit</b>: Ein Tag wird in Millisekunden simuliert; Daten erscheinen sofort (bis auf die Conversion-Verzögerung).</li></ul>`,
          diff: 'Die Oberfläche ist an Google Ads angelehnt, aber eigenständig gestaltet. Begriffe folgen weitgehend der deutschen Google-Ads-Oberfläche; einzelne Menüpunkte und Spaltennamen weichen ab.',
          quiz: [{ q: 'Welche Aussage stimmt für den Simulator, aber nicht für Google Ads?', a: ['Das Tagesbudget darf an einem Tag bis zu 2× überschritten werden', 'Die Anzeigenstärke beeinflusst die Klickrate direkt', 'Bis zu 4 Anzeigen erscheinen oben'], c: 1, why: 'Bei Google ist die Anzeigenstärke eine Orientierungshilfe; die 2×-Regel und 4 Top-Plätze gelten auch dort.' }],
        },
        {
          id: 'l3', title: 'Was der Simulator erfindet',
          body: `<ul><li><b>Branchen, Marken, Mitbewerber und Produkte</b> sind fiktiv (Ausnahme: Ihre Marke im Bank-Modus, mit recherchierten Eckdaten).</li>
            <li><b>Suchvolumina, CPCs, Conversion-Raten, Saisonkurven</b> sind plausible Schätzungen, keine Keyword-Planer-Daten.</li>
            <li><b>Ereignisse</b> (Bieterkriege, Serverausfälle, Konjunkturdellen, Abmahnungen …) werden zufällig erzeugt; Kalenderereignisse und EZB-Termine 2026 sind real, spätere EZB-Termine angenommen.</li>
            <li><b>Rechtliche Hinweise</b> (UWG, PAngV, Finanzwerbung) sind vereinfacht und keine Rechtsberatung.</li></ul>`,
          diff: 'Nutzen Sie den Simulator, um Zusammenhänge und Entscheidungen zu üben – nicht als Quelle für konkrete Marktzahlen.',
          quiz: [{ q: 'Sind die Suchvolumina im Simulator echte Keyword-Planer-Daten?', a: ['Ja', 'Nein, plausible Schätzungen'], c: 1, why: 'Für echte Werte nutzen Sie den Keyword-Planer in Ihrem Google-Ads-Konto.' }],
        },
      ],
    },
  ];

  // Ausführliche Erklärung je Antwortoption (warum richtig bzw. warum falsch)
  const EX = {
    'c1.l1.0': ['Falsch: Es gibt keine tägliche Sammelauktion. Ihre Position kann sich von Suche zu Suche ändern, weil jede Suche einzeln versteigert wird.', 'Richtig: Jede einzelne Suchanfrage löst eine eigene Auktion aus – mit den Werbetreibenden, die in genau diesem Moment teilnehmen dürfen. Darum schwanken Position und Klickpreis ständig.', 'Falsch: Das Budget bestimmt nur, wie oft Sie teilnehmen können – Auktionen finden trotzdem bei jeder Suche statt.'],
    'c1.l1.1': ['Falsch: Ein hohes Gebot allein reicht nicht. Eine Anzeige mit schlechter Qualität kann von einem niedrigeren Gebot mit hoher Qualität geschlagen werden.', 'Richtig: Der Ad Rank kombiniert Gebot, Anzeigenqualität (erwartete CTR, Relevanz, Landingpage), Mindestschwellen, den Kontext der Suche und die erwartete Wirkung von Assets.', 'Falsch: Das Tagesbudget entscheidet, ob Sie überhaupt teilnehmen (Pacing), nicht an welcher Position Sie stehen.'],
    'c1.l2.0': ['Falsch: Das Gebot verbessert die Position, aber nicht die Relevanz. Die Relevanz misst, wie gut Text und Keyword zusammenpassen.', 'Richtig: Steht das Keyword (oder eine nahe Variante) im Anzeigentitel und enthält die Anzeigengruppe nur eng verwandte Keywords, passt der Text zur Suche – genau das bewertet die Anzeigenrelevanz.', 'Falsch: Budget beeinflusst nur die Teilnahmehäufigkeit, nicht die Qualität der Anzeige.'],
    'c1.l2.1': ['Falsch: Das Gegenteil ist der Fall – schlechte Qualität muss durch höhere Gebote ausgeglichen werden.', 'Richtig: Weil der Ad Rank Gebot × Qualität ist, brauchen Sie bei niedrigem QF ein höheres Gebot für dieselbe Position. Auch der tatsächliche CPC steigt, da er durch Ihre Qualität geteilt wird.', 'Falsch: Der QF ist ein Kernbestandteil der Kostenlogik; ein niedriger Wert macht Klicks spürbar teurer.'],
    'c1.l3.0': ['Falsch: Das Maximalgebot ist eine Obergrenze. Sie zahlen nur, was nötig ist, um den Werbetreibenden unter Ihnen zu schlagen.', 'Richtig: Zweitpreis-Prinzip – Ihr CPC ergibt sich aus dem Ad Rank des Nächsten geteilt durch Ihre Qualität plus 1 Cent. Das ist meist weniger als Ihr Maximalgebot.', 'Falsch: Der CPC liegt nie über dem Maximalgebot. Starke Konkurrenz kann ihn bis an das Maximalgebot treiben, aber nicht darüber (nur Gebotsanpassungen erhöhen das Gebot selbst).'],
    'c2.l1.0': ['Falsch: In der Anzeigengruppe legen Sie Keywords, Anzeigen und Standardgebote fest – Budget und Gebotsstrategie gelten für die gesamte Kampagne.', 'Richtig: Budget, Gebotsstrategie, Standorte, Sprachen, Netzwerke und Zeitplan sind Kampagneneinstellungen. Wer unterschiedliche Budgets braucht, trennt deshalb Kampagnen.', 'Falsch: Pro Keyword können Sie bei manuellen Geboten nur das Max. CPC-Gebot setzen, nicht Budget oder Strategie.'],
    'c2.l2.0': ['Falsch: Genau passend ist die engste Option – nur Suchen mit derselben Bedeutung.', 'Falsch: Passende Wortgruppe liegt in der Mitte – die Suche muss die Bedeutung des Keywords enthalten.', 'Richtig: Weitgehend passend erreicht auch verwandte Suchen ohne die Keyword-Wörter – die größte Reichweite, aber auch die meiste Streuung.'],
    'c2.l2.1': ['Falsch: Mit manuellem CPC zahlen Sie für jede verwandte Suche dasselbe Gebot, auch für schwache – das erzeugt teure Streuverluste.', 'Richtig: Smart Bidding bewertet jede Suche einzeln und bietet für schwache Suchen weniger. Damit wird die große Reichweite von Broad Match beherrschbar.', 'Falsch: Ein sehr niedriges Budget löst das Problem nicht, sondern verteilt wenig Geld auf viele unpassende Suchen.'],
    'c2.l3.0': ['Falsch: Anders als normale Keywords berücksichtigen ausschließende Keywords keine ähnlichen Varianten. „Job" schließt „Jobs" nicht automatisch aus.', 'Richtig: Plural, Schreibvarianten und Tippfehler müssen Sie selbst ergänzen – ein häufiger Fehler in der Praxis. (Hinweis: Der Simulator ist hier großzügiger und erfasst über Wortstämme teils auch Pluralformen.)', 'Falsch: Das gilt für alle Optionen ausschließender Keywords – keine erfasst ähnliche Varianten.'],
    'c3.l1.0': ['Falsch: 3 Titel war die Zahl bei den alten erweiterten Textanzeigen; eine RSA zeigt bis zu 3 gleichzeitig an, kann aber viel mehr enthalten.', 'Falsch: 10 Titel sind ein guter Richtwert für eine ordentliche Anzeigenstärke, aber nicht das Maximum.', 'Richtig: Bis zu 15 Anzeigentitel (je 30 Zeichen) und 4 Beschreibungen (je 90 Zeichen). Google kombiniert daraus die passendste Anzeige.'],
    'c3.l2.0': ['Richtig: Assets brauchen Platz und einen ausreichenden Ad Rank – beides gibt es vor allem in den oberen Positionen. Weiter unten erscheinen sie seltener.', 'Falsch: Unten auf der Seite werden Assets nur eingeschränkt angezeigt, weil Rang und Platz fehlen.', 'Falsch: Assets erscheinen auf allen Geräten; auf Mobilgeräten oft sogar als besonders prominente Elemente (z. B. Anrufen).'],
    'c3.l3.0': ['Falsch: Dieser Titel ist zulässig – kein Ausrufezeichen, keine übermäßige Großschreibung.', 'Richtig: Ausrufezeichen sind in Anzeigentiteln nicht erlaubt (in Beschreibungen ist eines zulässig). Die Anzeige wird abgelehnt.', 'Falsch: Der Gedankenstrich und „Gratis" sind zulässig, sofern das Angebot stimmt.'],
    'c4.l1.0': ['Falsch: Smart Bidding funktioniert auch mit kleinen Budgets – sinnvoll sind etwa 3–5 × Ziel-CPA pro Tag, aber ein hohes Budget ist keine Voraussetzung.', 'Richtig: Smart Bidding lernt aus Conversions. Ohne zuverlässiges Tracking bietet es blind – etwa nach einem Tracking-Ausfall werden die Gebote massiv gesenkt.', 'Falsch: Viele Anzeigengruppen helfen nicht; eher verteilen sich die Daten auf zu viele kleine Einheiten.'],
    'c4.l2.0': ['Falsch: Mit 15 € (weit unter dem Ist-CPA) findet Smart Bidding kaum passende Auktionen – die Auslieferung bricht ein („Eingeschränkt durch Ziel").', 'Richtig: Ein Ziel nahe dem bisherigen CPA gibt dem Algorithmus Spielraum zum Lernen. Danach schrittweise um 10–15 % verschärfen.', 'Falsch: 120 € erlaubt sehr teure Conversions – mehr Volumen, aber wahrscheinlich unprofitabel.'],
    'c4.l3.0': ['Falsch: Das Tagesbudget ist ein Durchschnitt; an starken Tagen darf Google mehr ausgeben.', 'Richtig: Bis zu 2× an einem einzelnen Tag. Über den Kalendermonat gleicht Google das aus.', 'Falsch: 3.040 € (30,4 × 100 €) ist die Obergrenze für den ganzen Monat, nicht für einen Tag.'],
    'c5.l1.0': ['Falsch: Sekundäre Aktionen werden nur beobachtet und erscheinen in „Alle Conv.", sie steuern Smart Bidding nicht.', 'Richtig: Nur primäre Aktionen fließen in die Spalte „Conversions" und sind das Lernsignal für Smart Bidding. Darum sollten nur echte Wertaktionen primär sein.', 'Falsch: Anrufe sind eine mögliche Conversion-Aktion – ob sie bieten, hängt davon ab, ob sie als primär eingestellt sind.'],
    'c5.l2.0': ['Falsch: Die Einwilligung bleibt maßgeblich. Ohne Zustimmung werden keine Cookies gesetzt.', 'Richtig: Ohne Einwilligung sendet das Tag cookielose Signale; daraus schätzt Google die fehlenden Conversions (Modellierung). Die Messlücke wird kleiner, aber nicht null.', 'Falsch: Das Cookie-Banner bleibt rechtlich erforderlich; der Consent Mode reagiert nur auf die Auswahl der Nutzer.'],
    'c5.l3.0': ['Falsch: Klicks werden automatisch erfasst; importiert werden Ergebnisse, die nach dem Klick offline entstehen.', 'Richtig: Abschlüsse aus CRM oder Vertrieb (z. B. per GCLID) werden an Google Ads zurückgemeldet. So optimiert Smart Bidding auf echte Kunden statt auf Formulareingänge.', 'Falsch: Mit Offline-Werbung (Plakate, Radio) hat der Import nichts zu tun.'],
    'c6.l1.0': ['Falsch: „Ausrichtung" beschränkt die Auslieferung auf das Segment – bei Suchkampagnen verlieren Sie damit viel Reichweite.', 'Richtig: „Beobachtung" sammelt Daten zu Segmenten und erlaubt Gebotsanpassungen, ohne die Reichweite einzuschränken – der Standard für Suchkampagnen.', 'Falsch: Zielgruppen zur Beobachtung kosten nichts und liefern wertvolle Erkenntnisse (z. B. Remarketing-Nutzer konvertieren besser).'],
    'c6.l2.0': ['Richtig: −100 % ist ein Ausschluss. Das ist eine der wenigen Gebotsanpassungen, die auch Smart Bidding respektiert.', 'Falsch: −50 % senkt die Gebote nur; Tablets erhalten weiterhin Impressionen.', 'Falsch: Geräte lassen sich über eine Gebotsanpassung von −100 % ausschließen (Ausnahme: Computer und Mobilgeräte lassen sich nicht gleichzeitig ausschließen).'],
    'c7.l1.0': ['Falsch: Shopping nutzt keine Keywords. Google gleicht die Suche mit Ihren Produktdaten ab – steuern können Sie nur über ausschließende Keywords und Produkttitel.', 'Richtig: Produktfeed im Merchant Center (Titel, Bild, Preis, GTIN, Verfügbarkeit). Die Feed-Qualität ist der wichtigste Hebel.', 'Falsch: Bildanzeigen gehören zu Display; Shopping-Anzeigen werden automatisch aus Feed-Daten erzeugt.'],
    'c7.l2.0': ['Falsch: Weniger Budget verteilt sich weiterhin auch auf Markensuchen.', 'Richtig: Der Markenausschluss nimmt Ihre eigenen Markensuchen aus der PMax-Auslieferung. So „kauft" PMax nicht die günstigen Markenconversions ein und schönt seine Zahlen.', 'Falsch: Die Zahl der Bilder beeinflusst die Asset-Qualität, nicht, welche Suchen PMax bedient.'],
    'c7.l3.0': ['Falsch: View-through-Conversions überschätzen den Beitrag leicht – viele dieser Nutzer hätten ohnehin gekauft.', 'Richtig: Entscheidend sind Conversions nach Klick und das echte Geschäftsergebnis (inkrementeller Umsatz, Deckungsbeitrag) – idealerweise mit Tests überprüft.', 'Falsch: Impressionen zeigen Reichweite, aber nichts über Wirkung oder Profitabilität – Display-Impressionen sind sehr billig.'],
    'c8.l1.0': ['Falsch: Budgetprobleme zeigen sich in „Verl. Impr.-Anteil (Budget)", nicht im Rang.', 'Richtig: Rang-Verluste entstehen, wenn Ihr Ad Rank (Gebot × Qualität) nicht reicht oder unter der Mindestschwelle liegt. Mehr Budget hilft hier nicht.', 'Falsch: Die Zahl der Keywords beeinflusst die möglichen Impressionen, aber nicht den verlorenen Rang-Anteil.'],
    'c8.l2.0': ['Falsch: 60 % Konfidenz heißt, der Unterschied kann gut Zufall sein. Wer jetzt übernimmt, trifft häufig falsche Entscheidungen.', 'Richtig: Lernphase und Conversion-Verzögerung brauchen Zeit. Warten Sie, bis genügend Daten und mindestens ca. 95 % Konfidenz vorliegen.', 'Falsch: Der Trend ist positiv – Abbrechen verschenkt die Chance, eine echte Verbesserung nachzuweisen.'],
    'c8.l3.0': ['Falsch: Der Optimierungsfaktor misst, wie viele Google-Empfehlungen umgesetzt sind – nicht Ihre Profitabilität.', 'Richtig: Empfehlungen wie Budgeterhöhungen oder Broad Match können den Faktor erhöhen und trotzdem den Gewinn senken. Prüfen Sie jede Empfehlung gegen Ihre Ziele.'],
    'c9.l1.0': ['Falsch: Bei Sale-Suchen erwarten Nutzer befristete Angebote – Verknappung passt hier oft.', 'Richtig: Im Finanz- und B2B-Umfeld wirkt künstlicher Druck unseriös. Geschäftskunden wollen Sicherheit und Verlässlichkeit (Einlagensicherung, transparente Konditionen).', 'Falsch: Last-Minute-Reisen sind tatsächlich zeitlich begrenzt – echte Verknappung ist hier glaubwürdig.'],
    'c9.l2.0': ['Falsch: Die UVP ist kein zulässiger Bezugspunkt für eine Preisermäßigung nach § 11 PAngV (sie darf nur klar als UVP gekennzeichnet genannt werden).', 'Richtig: Bei einer Preisermäßigung muss der niedrigste Gesamtpreis der letzten 30 Tage angegeben werden. Sonst droht eine Abmahnung.', 'Falsch: Der Konkurrenzpreis darf nicht als „Streichpreis" für eine eigene Ermäßigung herhalten.'],
    'c9.l3.0': ['Falsch: Es geht nicht um Google-Empfehlungen, sondern um Ihre eigene Wirtschaftlichkeit.', 'Richtig: Ein Neukunde bringt über Wiederkäufe, Verlängerungen und Empfehlungen weiteren Umsatz ohne erneute Werbekosten. Darum darf der Erstkauf mehr kosten als sein Sofortertrag.', 'Falsch: Wer nur den Erstkauf betrachtet, unterschätzt den Kundenwert und verliert gegen Wettbewerber, die langfristig rechnen.'],
    'c10.l1.0': ['Falsch: Anträge enthalten Privatkunden, Abbrecher und abgelehnte KYC-Fälle – viele davon werden nie zu Einlagen.', 'Richtig: Einlagen sind das Ziel. Neuvolumen, die Marge gegenüber der Refinanzierung und die Kosten je 1.000 € Neuvolumen zeigen den echten Wert der Kampagnen.', 'Falsch: Eine hohe Klickrate kann sogar schädlich sein, wenn sie vor allem Privatkunden anzieht.'],
    'c10.l2.0': ['Falsch: Das Volumen ist nicht das Problem, sondern die Qualität des Signals.', 'Richtig: Smart Bidding optimiert auf das gemessene Ziel. Zählen abgelehnte Privatkunden-Anträge mit, lernt es, billige Fehlanträge zu jagen. Besser: eröffnete Konten per Offline-Import.', 'Falsch: Google verbietet das nicht – es ist nur eine schlechte Wahl des Optimierungsziels.'],
    'c10.l3.0': ['Falsch: Veraltete Zinsangaben sind irreführend – rechtlich riskant, und die Anzeigen werden abgelehnt.', 'Richtig: Jede Anzeige mit dem alten Zinssatz muss sofort angepasst werden; Anzeige und Landingpage müssen übereinstimmen.', 'Falsch: Das Budget hat mit der Richtigkeit der Werbeaussage nichts zu tun.'],
    'c11.l1.0': ['Falsch: Die Spalte zeigt nur gemessene Conversions – Cookie-Ablehnung, Tracking-Lücken und Retouren fehlen.', 'Richtig: Erst der Abgleich mit CRM, Shopsystem oder Buchhaltung zeigt den tatsächlichen Umsatz. Der Simulator zeigt ihn als „Echter Umsatz (Sim)" direkt an – das gibt es in Google Ads nicht.', 'Falsch: Der Keyword-Planer liefert Prognosen zu Suchvolumen und Geboten, keine Ergebnisse Ihrer Anzeigen.'],
    'c11.l2.0': ['Falsch: Die 2×-Regel gilt auch in Google Ads.', 'Richtig: Bei Google ist die Anzeigenstärke eine Orientierungshilfe; der Simulator koppelt sie direkt an die Klickrate, damit der Zusammenhang sichtbar wird.', 'Falsch: Auch in Google Ads erscheinen bis zu 4 Anzeigen oberhalb der organischen Ergebnisse.'],
    'c11.l3.0': ['Falsch: Die Zahlen sind plausibel geschätzt und fiktiv – für echte Werte brauchen Sie den Keyword-Planer im eigenen Konto.', 'Richtig: Suchvolumina, CPCs und Conversion-Raten sind Schätzungen, um realistische Größenordnungen zu üben – keine echten Marktdaten.'],
  };
  for (const c of COURSES) for (const l of c.lessons) l.quiz.forEach((q, i) => { q.ex = EX[`${c.id}.${l.id}.${i}`] || null; });

  G.ACADEMY_CONTENT = { COURSES };
})();
