# Ads Simulator – Google-Ads-Simulation

Ein browserbasierter Lern- und Trainingssimulator für Google Ads: Sie führen ein Werbekonto in einem
lebendigen Markt mit Auktionen, Wettbewerbern, Saisonalität und Ereignissen. Ziel ist profitables Wachstum.

**Start:** `index.html` im Browser öffnen (keine Installation, kein Build, keine Abhängigkeiten).
Alternativ: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

## Features

**Kampagnen & Struktur**
- 7 Kampagnentypen: Suche, Shopping, Performance Max, Display, Video (YouTube), Demand Gen, App
- Kampagnen-Assistent (Ziel → Typ → Einstellungen → Anzeigen → Prüfung), Kopieren, Pausieren, Labels
- Anzeigengruppen, Asset-Gruppen (PMax mit Suchthemen & Zielgruppensignalen), Produktgruppen
- Responsive Suchanzeigen (15 Titel / 4 Beschreibungen, Pinning, Anzeigenstärke), Display-, Video-, App-Anzeigen
- Anzeigenprüfung (~1 Tag) und Richtlinien: Ausrufezeichen, Großschreibung, Telefonnummern, Superlative, fremde Marken
- 10 Asset-Typen (Sitelinks, Zusatzinformationen, Snippets, Anrufe, Bilder, Preise, Angebote, Lead-Formulare, Standorte, Unternehmensname)

**Auktion & Gebote**
- Stündliche Auktionen je Suchanfrage mit Teilauktionen nach Standort, Gerät, Alter, Geschlecht, Zielgruppe
- Ad Rank = Gebot × Qualität × Assets × Kontext, Zweitpreis-CPC, 4 obere + 3 untere Plätze, Reserve-/Top-Schwellen
- Qualitätsfaktor (erwartete CTR aus echter Leistung, Anzeigenrelevanz, Landingpage-Erfahrung)
- Gebotsstrategien: Manueller CPC, Klicks maximieren, Conversions maximieren, Ziel-CPA, Conversion-Wert maximieren,
  Ziel-ROAS, Anteil an möglichen Impressionen, vCPM, CPV, Ziel-Kosten pro Installation
- Smart Bidding mit Conversion-Prognose, Lernphase, Datenabhängigkeit; Budget-Pacing (2×/Tag, 30,4×/Monat)
- Keyword-Optionen (genau / Wortgruppe / weitgehend), Suchbegriffe, ausschließende Keywords und Listen
- Gebotsanpassungen: Gerät, Standort, Werbezeitplan, Zielgruppe, Demografie; Ausschlüsse

**Markt & Wettbewerb**
- 6 Branchen mit eigenen Suchanfragen, CPCs, Saisonkurven, Geräteprofilen und Conversion-Verzögerungen
- Wettbewerber-KI (aggressiv, profitorientiert, budgetgetrieben, Markenfokus, sprunghaft, Marktplatz):
  passt Gebote/Budgets an, nutzt Smart Bidding, steigt ein, pausiert, geht pleite, kommt zurück
- Long-Tail-Werbetreibende, CPC-Inflation, Nachfrage- und Themen-Trends, Kauflaune
- Saisonkalender (Neujahr, Ostern, Prime Day, Black Week, Weihnachten, Kfz-Wechselsaison, Quartalsende …)
- 20+ Zufallsereignisse: Rabattaktionen, Bieterkriege, Neueinsteiger, Core Updates, Konjunktur, virale Trends,
  Lieferengpässe, Serverausfall, Tracking-Ausfall, Klickbetrug, Wetter, Consent-Änderungen, KI-Übersichten …

**Messung, Analyse & Tools**
- Conversion-Aktionen (primär/sekundär), Verzögerung, Consent Mode, erweiterte Conversions, Attribution (datengetrieben/letzter Klick)
- Auktionsdaten, Kanalbericht (PMax), Demografie, Standorte, Geräte, Heatmap Wochentag × Stunde
- Empfehlungen mit Optimierungsfaktor (inkl. automatisch anwenden), Keyword-Planer mit Prognose
- Tests (A/B-Experimente) mit Signifikanz, Berichte mit CSV-Export, Änderungsverlauf, Abrechnung (inkl. ungültige Klicks)
- Merchant Center (Preis-Benchmarks, GTIN, Bildqualität, Verfügbarkeit)
- Unternehmens-GuV: tatsächlicher Umsatz vs. gemessene Conversions, Retouren, Fixkosten, Preispositionierung,
  Landingpage-Investitionen, Markenbekanntheit
- Speichern (automatisch), Export/Import als JSON, Hell/Dunkel-Modus, mobil nutzbar

## Schwierigkeit & Realismus-Faktoren

- **Schwierigkeitsgrade:** Leicht, Normal, Schwer und **Experte (realistisch)** mit wenig Kapital, aggressiveren Mitbewerbern, mehr Ereignissen und höheren Zielen
- **Zielvorgaben der Geschäftsleitung:** Monatsbudget vom Controlling (Überschreitungen werden vom Folgemonat abgezogen) und Quartalsziele
  mit Noten A–D. A erhöht das Budget um 15 %, zwei verfehlte Quartale in Folge kürzen es um 25 %; Erfolg hebt die Messlatte.
- **Creative-Ermüdung:** Die CTR sinkt mit der Auslieferung (Suche bis −14 %, Display/Video bis −42 %); Überarbeiten frischt auf.
- **Organische Markensuchen & Inkrementalität:** Markensuchen konvertieren auch ohne Anzeige; Brand-Kampagnen kannibalisieren
  organische Klicks, schützen aber vor Mitbewerbern, die auf die Marke bieten.
- **Junk-Inventar & Brand Safety:** Mobile-App-Placements mit versehentlichen Klicks; Inhaltsausschlüsse verhindern Brand-Safety-Vorfälle.
- **Gegenreaktionen:** Mitbewerber erhöhen ihre Gebote, wenn sie dauerhaft unter Ihnen stehen.
- **Bank-Modus zusätzlich:** Konditionsänderungen brauchen eine ALCO-/Treasury-Freigabe (2–6 Tage, kann abgelehnt werden),
  „heißes Geld" aus Spitzenzinsen fließt schneller ab, Mitbewerber ziehen nach 14 Tagen Zinsführerschaft nach,
  Geschäftskonten aus „kostenlos"/„ohne Schufa"-Suchen bergen Finanzagenten-Risiken (Geldwäsche-Verdachtsfälle).

## Geschäftsleitung, Sanktionen & Game Over

- **Vertrauen der Geschäftsleitung (0–100):** Monatsreview (zeitanteilige Zielerreichung), Quartalsnote, Budgetdisziplin,
  Verschuldung, Abmahnungen, Brand-Safety-Vorfälle und Revisionen verändern den Wert.
- **Sanktionsstufen:** Verwarnung (< 50) → Abmahnung mit Budgetkürzung (< 35) → Bewährungsplan über 45 Tage (< 20) →
  **Kündigung** bei 0 oder gescheitertem Bewährungsplan. Ab 55 Punkten werden Sanktionen aufgehoben.
- **Dynamische Ziele:** Mengenziele passen sich monatlich der Marktlage an; nach jedem Quartal wird auf Basis des Ist-Werts plus 8 % geplant.
  Ad-hoc-Vorgaben: Sparrunde, Wachstumsoffensive, Revision des Reportings, neue Geschäftsführung.
- **Kredite:** aufnehmen und jederzeit aus der Kasse tilgen, Zinsen werden täglich verbucht.
  Kasse negativ und Kreditrahmen ausgeschöpft für 30 Tage = **Insolvenz**.

## Kaufverhalten & Marketingpsychologie

- **Trigger im Anzeigentext:** Social Proof, Autorität, Verknappung, Preisanker, Risikoumkehr, Gratis, Call-to-Action – wirken abhängig
  von Kaufabsicht, Branche (B2B/Finanzen reagieren negativ auf Verknappung) und Markenbekanntheit; überladene Texte wirken reißerisch,
  Dauer-Verknappung verliert Glaubwürdigkeit und ist abmahnfähig. Analyse in „Conversion & Psychologie".
- **Shop & Landingpage:** Bewertungen, Gütesiegel, Kauf auf Rechnung, Express-Checkout, Gastbestellung, Gratisversand-Schwelle,
  Countdown, erfundener Social Proof, Exit-Gutschein, Streichpreise (PAngV 30-Tage-Regel), Live-Chat, Rechner, eID, Autofill –
  mit Kosten, Nebenwirkungen (Retouren, weniger Wiederkäufe) und Abmahnrisiko.
- **Verkäuferbewertungen:** Sterne entstehen aus Kundenzufriedenheit (Retouren, Lieferprobleme, Dark Patterns) und erscheinen ab 100 Rezensionen in Anzeigen.
- **Kundenwert:** Wiederkäufe bzw. Verlängerungen bringen später Umsatz ohne Werbekosten.
- **Zahltag-Effekt** im Konsumbereich, **Rückkehrer** (Anzeigenklicks führen später zu Markensuchen) und organische Markenconversions.

## Lernhilfen

- **Erklärungen beim Überfahren:** Alle Kennzahlen und Fachbegriffe (Tabellenköpfe, Kacheln, Kennzahl-Listen) zeigen beim
  Überfahren – auf Touch-Geräten beim Antippen – eine kurze Erklärung (Glossar in `js/glossary.js`).
- **„ⓘ Mehr erfahren":** Im Tooltip öffnet ein Button eine ausführliche Erklärung (Definition, Formel, Beispiel,
  Einordnung, Hebel, Ihre aktuellen Zahlen inkl. Break-even, Unterschied zu Google Ads) – z. B. zu ROAS/Ziel-ROAS, CPA,
  Anteil an Impressionen, Qualitätsfaktor (`js/glossary-detail.js`).
- **Mehr Kennzahlen & Spaltenauswahl:** „▦ Spalten" in Kampagnen, Anzeigengruppen, Keywords und Suchbegriffen; zusätzlich
  ROAS in %, Wert/Conv., Wert/Klick, Anteil Impr. oben/ganz oben, Deckungsbeitrag, echte Kosten/Conv., Messlücke.
- **Kennzahlen & Vergleich wie in Google Ads:** Bis zu 8 frei wählbare KPI-Kacheln (alle Kennzahlen, gruppiert),
  Vergleichszeitraum „Vorheriger Zeitraum", „Vormonat" oder „Vorjahr" mit gestrichelter Vergleichslinie im Diagramm,
  Veränderung in den Kacheln und (abschaltbar) unter jedem Tabellenwert sowie ein **Monatsvergleich** mit Hochrechnung
  angebrochener Monate und frei wählbaren Kennzahlen.
- **Werbezeitplaner:** Zeitplan-Einträge wie im Original (Tag/Tagesgruppe, Von–Bis, Gebotsanpassung, Leistung je Eintrag,
  Inline-Bearbeitung), Bearbeiten-Dialog mit „＋ Hinzufügen", Vorlagen, interaktives Raster (Ziehen zum Markieren mit Maus
  oder Finger, Zeile/Spalte per Klick, Anpassung setzen, Zeiten ausschalten, Leistung einblenden) und Berichte nach Tag,
  Stunde sowie Tag & Stunde. Abweichung: ganze Stunden statt 15-Minuten-Schritten.
- **Tipps mit Umsetzung:** Jeder Tipp zeigt vorab „Worum geht's?", nach dem Kauf eine Schritt-für-Schritt-Umsetzung und
  „Springe zu"-Buttons in die passenden Bereiche.
- **Übersicht als Baukasten:** „✎ Übersicht anpassen" – 16 Karten (u. a. Kennzahlen & Diagramm, Geführte Hilfe,
  Monatsvergleich, Budget-Pacing, Top-Keywords, Suchbegriffe ohne Conversion, Geräte, Tageszeiten, Mitbewerber, Messqualität)
  ein-/ausblenden, per Ziehen oder Pfeilen anordnen, halbe/volle Breite; Layout und KPI-Auswahl bleiben gespeichert.
- **Geführte Hilfe nach Unternehmensvorgaben:** Budget-Tipps berücksichtigen Monatsbudget-Hochrechnung, Sparrunden,
  Sanktionen und Ziele (Kurs „Budget sparen / halten / Wachstum"), schlagen Umschichtungen statt Erhöhungen vor und
  markieren Google-Empfehlungen, die den Vorgaben widersprechen.
- **🚨 Notfall-Assistent:** Für alle Ereignisse (Serverausfall, Tracking-Ausfall, Bieterkrieg, Rabattaktion, neuer
  Wettbewerber, Lieferengpass, Personalengpass, Konjunkturdelle, Klickbetrug, Brand-Safety-Vorfall, Richtlinien-Update,
  Bank: Zinsoffensive, KYC-Rückstau, VideoIdent-Störung, Verifizierung, EZB-Entscheid) sowie Geschäftsleitungs-Notlagen
  (Sanktionen, Sparrunde, Revision, Abmahnung) gibt es Leitfäden mit Auswirkung, Sofortmaßnahmen, „Nicht tun"-Hinweisen und
  Schnellaktionen (Kampagnen pausieren/reaktivieren, Budgets temporär senken/wiederherstellen, Thema pausieren, Brand Safety
  aktivieren, Budgets an Monatsvorgabe anpassen). Hält die Simulation wegen eines Ereignisses an, öffnet sich der
  Notfall-Assistent automatisch; Chancen (z. B. Mitbewerber pausiert) werden ebenfalls erklärt (`js/emergency.js`).
- **🧭 Geführte Hilfe für Zielwerte:** Im Gebotsstrategie-Formular Szenarien für Ziel-ROAS/Ziel-CPA mit Kosten, Conversions,
  Umsatz, echtem Deckungsbeitrag, Monatsbudget-Auswirkung und Prüfung gegen Budget, ROAS-Ziel und Break-even – inkl.
  Empfehlung und „Übernehmen".
- **Ziel-ROAS-/Ziel-CPA-Rechner** im Gebotsstrategie-Formular: Ist-Wert in %, Break-even, Bedeutung des eingegebenen Werts
  und Einordnung (zu streng, unter Break-even, realistisch).
- **Geführte Hilfe:** Bei Problemen (abgelehnte Anzeigen mit konkreter Textstelle, schwache Anzeigenstärke, fehlende Assets,
  Budget-/Zielbeschränkung, Tracking, niedriger QF, Merchant Center, leere Kasse) erscheinen Ursache, Schritt-für-Schritt-
  Lösung und ein Direkt-Button. Unter Einstellungen → Lernhilfen lassen sich geführte Hilfe, Tooltips und „Mehr erfahren"
  einzeln ausschalten (`js/guide.js`).
- **Tipps & Beratung (kostenpflichtig):** Praxistipps zu Grundlagen, Konto-Analysen mit Ihren aktuellen Daten
  (Streuverluste in €, echter Deckungsbeitrag je Kampagne, Budget- vs. Rang-Engpass, QF-Diagnose, beste Zeiten, Geräte,
  Mitbewerber-Insiderinfos, Marktausblick, Psychologie-Check, im Bank-Modus Zinsberatung) und ein Premium-Strategie-Audit.
  Bezahlt wird sofort aus der Kasse; Analysen lassen sich gegen erneute Zahlung aktualisieren.
- **📚 Akademie (Lernkurse):** 11 Kurse vom Einsteiger bis zum Profi – Auktion & Qualitätsfaktor, Kontostruktur & Keywords,
  Anzeigen & Richtlinien, Gebotsstrategien & Budget, Messung & Attribution, Zielgruppen & Ausrichtung, Shopping/PMax/Display,
  Analyse & Tests, Psychologie & CRO, Bank-Modus sowie „Simulator vs. echtes Google Ads". Jede Lektion hat ein Quiz mit Erklärung zu
  jeder Antwortoption (warum richtig bzw. falsch) und einen Hinweis **„Unterschied zum echten Google Ads"**, wo der Simulator vereinfacht, abweicht oder Zusatzinfos zeigt.
  Jeder Kurs (außer dem letzten) endet mit einer **Praxisaufgabe** in einem eigenen Übungskonto (Sandbox), die automatisch
  geprüft wird. Die Akademie ist vom Startbildschirm und aus dem Spiel erreichbar, läuft unabhängig vom Spielstand
  (dieser wird pausiert und danach unverändert fortgesetzt; das Übungskonto wird nie gespeichert). Der Lernfortschritt liegt
  separat im Browser (`localStorage`, Schlüssel `gads-sim-academy`). Inhalte: `js/academy-content.js`, UI: `js/academy.js`,
  Test: `node test/academy.mjs`.

## Bank-Modus: Passivgeschäft Geschäftskunden (VW Bank)

Eigene Branche mit realistischen Mechaniken für SEA im Einlagengeschäft:

- **Produkte:** Tagesgeld Business, Festgeld Business (3/6/12/24 Monate), Geschäftskonto, Visa Business
- **Konditionen & Zinsen:** eigene Zinsen und Aktionszinsen festlegen; der Abstand zum Markt (oberes Quartil der effektiven
  12-Monats-Zinsen) steuert die Abschlussquote. Die Marge ergibt sich gegenüber der Refinanzierungsalternative.
- **EZB-Zinspfad:** Einlagesatz 2,50 % (Stand Oktober 2026); Entscheide an den Sitzungsterminen; Mitbewerber ziehen mit Verzögerung nach
- **Mitbewerber (fiktiv, typisiert):** Vergleichsportale, Direktbank mit Aktionszins, Neobanks ohne gesetzliche
  Einlagensicherung, Großbank, Autobank, Regionalbanken
- **Streuverluste:** generische Suchen („tagesgeld", „girokonto", „volkswagen bank login") kommen überwiegend von Privatkunden.
  Anzeigentexte mit „für Geschäftskunden" filtern Klicks; Privatkunden-Anträge werden abgelehnt und kosten Bearbeitung.
- **Funnel:** Antrag gestartet → abgeschickt → VideoIdent → Konto eröffnet (KYC, 5–14 Tage Verzögerung).
  Standardmäßig misst Google Ads nur Anträge; der Offline-Conversion-Import (CRM, 2.500 €) liefert echte Eröffnungen mit Kundenwert.
- **Einlagenbuch:** Zinsüberschuss je Tag, Abflüsse bei unattraktivem Zins, „Zinshopper" nach Aktionsende, Festgeld-Fälligkeiten und Wiederanlage
- **Compliance:** Anzeigen mit veralteten Zinsangaben werden als irreführend abgelehnt, „p. a." ist Pflicht, „kostenlos" ist trotz Kontoführungsentgelt unzulässig;
  Google-Verifizierung für Finanzdienstleister (Re-Verifizierung mit 30-Tage-Frist)
- **Ereignisse:** Zinsoffensiven, Vergleichsportal-Testsieger, Debatte um Einlagensicherung, KYC-Rückstau, VideoIdent-Störung,
  Jahresend-Liquidität, Gründungssaison, Steuertermine

Recherchierte Eckdaten (Stand Oktober 2026): EZB-Einlagesatz 2,50 % seit 16.09.2026; VW Bank Geschäftskunden-Tagesgeld 2,00 % p. a.,
Festgeld Business ab 5.000 € mit 90–720 Tagen; Aktionszinsen am Markt 3,75–5,00 % für 4–5 Monate; Finanz-CPCs im Schnitt 4–7 €.
**Annahmen:** Suchvolumina, Einlagengrößen, Konditionen für Geschäftskonto und Visa Business, alle Mitbewerber-Daten.
Der Simulator ist ein inoffizielles Trainingswerkzeug und nicht mit der Volkswagen Bank verbunden.

## Struktur

```
js/util.js       RNG, Formatierung, Datum
js/data.js       Branchen, Standorte, Zielgruppen, Kalender- & Zufallsereignisse
js/model.js      Datenmodell, Qualitätsfaktor, Anzeigenstärke, Richtlinien
js/engine.js     Simulation (Auktionen, Pacing, Smart Bidding, Wettbewerber, Markt)
js/recs.js       Empfehlungen & Unternehmensaktionen
js/bank.js       Bank-Modus (Zinsen, EZB, Einlagenbuch, Funnel, Compliance)
js/goals.js, psych.js, glossary.js, tips.js   Geschäftsleitung, Kaufverhalten, Erklärungen, Tipps
js/glossary-detail.js, guide.js   Ausführliche Erklärungen, Ziel-ROAS-Rechner, geführte Problemhilfe
js/overview.js   Übersicht als Baukasten (Karten, Layout, zusätzliche Karten)
js/emergency.js  Notfall-Assistent: Leitfäden und Schnellaktionen für Ereignisse
js/academy-content.js, academy.js   Akademie: Kursinhalte und Lern-UI mit Sandbox
js/ui.js, views-*.js, forms.js, charts.js, app.js   Oberfläche
test/smoke.mjs   Engine-Test ohne Browser: node test/smoke.mjs
test/academy.mjs Akademie-Inhalte & Praxisaufgaben prüfen: node test/academy.mjs
```

Alle Unternehmen, Marken und Daten sind fiktiv. Die Mechaniken sind modellhaft nachgebildet und keine exakte Kopie der Google-Algorithmen.
