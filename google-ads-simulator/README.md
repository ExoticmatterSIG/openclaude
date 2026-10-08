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

## Struktur

```
js/util.js       RNG, Formatierung, Datum
js/data.js       Branchen, Standorte, Zielgruppen, Kalender- & Zufallsereignisse
js/model.js      Datenmodell, Qualitätsfaktor, Anzeigenstärke, Richtlinien
js/engine.js     Simulation (Auktionen, Pacing, Smart Bidding, Wettbewerber, Markt)
js/recs.js       Empfehlungen & Unternehmensaktionen
js/ui.js, views-*.js, forms.js, charts.js, app.js   Oberfläche
test/smoke.mjs   Engine-Test ohne Browser: node test/smoke.mjs
```

Alle Unternehmen, Marken und Daten sind fiktiv. Die Mechaniken sind modellhaft nachgebildet und keine exakte Kopie der Google-Algorithmen.
