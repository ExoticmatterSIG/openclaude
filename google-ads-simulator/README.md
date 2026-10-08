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
js/ui.js, views-*.js, forms.js, charts.js, app.js   Oberfläche
test/smoke.mjs   Engine-Test ohne Browser: node test/smoke.mjs
```

Alle Unternehmen, Marken und Daten sind fiktiv. Die Mechaniken sind modellhaft nachgebildet und keine exakte Kopie der Google-Algorithmen.
