/* Google Ads Simulator – Empfehlungen, Optimierungsfaktor & Unternehmensaktionen */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U, D = G.D, M = G.M, E = G.E;
  const I = E.I;
  const R = {};

  const LOW_INTENT = ['jobs', 'kostenlos', 'wasist', 'gebraucht', 'kuendigen', 'test', 'erfahrungen', 'bewertungen'];
  const MOD_WORD = { jobs: 'jobs', kostenlos: 'kostenlos', wasist: 'was ist', gebraucht: 'gebraucht', kuendigen: 'kündigen', test: 'test', erfahrungen: 'erfahrungen', bewertungen: 'bewertungen' };

  R.compute = function (S) {
    const out = [];
    const from = Math.max(0, S.day - 14), to = S.day - 1;
    const ind = M.ind(S);
    const live = S.campaigns.filter((c) => c.status === 'enabled' && !c.isTrial);
    const push = (r) => { const dis = S.dismissed[r.id]; if (dis === undefined || S.day - dis > 30) out.push(r); };

    for (const c of live) {
      const v = E.derive(E.sumRange(S, 'camp', c.id, from, to));
      const v30 = E.derive(E.sumRange(S, 'camp', c.id, S.day - 30, to));
      // Budget
      if (c.rt.limited && v.lostB > 0.08) {
        const nb = Math.ceil(c.budget * Math.min(2.2, 1 / Math.max(1 - v.lostB, 0.35)));
        const extra = (v.conv / 2) * (nb / c.budget - 1) * 0.75;
        push({ id: 'budget_' + c.id, cat: 'Gebote & Budgets', icon: '💰', impact: 6 + Math.round(v.lostB * 10), cid: c.id,
          title: `Budget erhöhen: ${c.name}`, desc: `Ihre Kampagne ist durch das Budget eingeschränkt (${U.fmt.pct0(v.lostB)} Anteil an möglichen Impressionen verloren). Empfohlenes Tagesbudget: ${U.fmt.eur0(nb)} – geschätzt ≈ +${U.fmt.num1(Math.max(extra, 0))} Conversions/Woche.`,
          apply: (S) => M.updateCampaign(S, c, { budget: nb }, `Budget ${U.fmt.eur(c.budget)} → ${U.fmt.eur(nb)} (Empfehlung)`) });
      }
      // Smart Bidding
      if (['manual', 'maxclicks'].includes(c.bidStrategy.type) && ['search', 'shopping'].includes(c.type) && v30.conv >= 15) {
        const t = Math.round(v30.cpa * 1.1 * 100) / 100;
        push({ id: 'smart_' + c.id, cat: 'Gebote & Budgets', icon: '🎯', impact: 8, cid: c.id,
          title: `Ziel-CPA-Gebote nutzen: ${c.name}`, desc: `Mit ${U.fmt.int(v30.conv)} Conversions in 30 Tagen hat Smart Bidding genug Daten. Empfohlener Ziel-CPA: ${U.fmt.eur(t)}. Achtung: Lernphase von ca. 7 Tagen.`,
          apply: (S) => M.updateCampaign(S, c, { bidStrategy: { ...c.bidStrategy, type: 'tcpa', targetCpa: t } }, 'Gebotsstrategie → Ziel-CPA ' + U.fmt.eur(t) + ' (Empfehlung)') });
      }
      if (c.rt.limitedTarget) {
        const b = c.bidStrategy;
        push({ id: 'target_' + c.id, cat: 'Gebote & Budgets', icon: '📉', impact: 5, cid: c.id,
          title: `Zielvorhaben anpassen: ${c.name}`, desc: `Ihr ${b.type === 'tcpa' ? 'Ziel-CPA' : 'Ziel-ROAS'} schränkt die Reichweite stark ein – das Budget wird nur zu ${U.fmt.pct0(U.div(v.cost / 14, c.budget))} ausgeschöpft.`,
          apply: (S) => M.updateCampaign(S, c, { bidStrategy: b.type === 'tcpa' ? { ...b, targetCpa: +(b.targetCpa * 1.15).toFixed(2) } : { ...b, targetRoas: +(b.targetRoas * 0.87).toFixed(2) } }, 'Zielwert gelockert (Empfehlung)') });
      }
      if (c.type === 'search') {
        // Negative Keywords
        const bad = {};
        for (const k of E.keys(S, 'st', c.id + '~')) {
          const q = M.byId(S.queries, k.split('~')[1]);
          if (!q || !LOW_INTENT.includes(q.mod)) continue;
          const sv = E.sumRange(S, 'st', k, S.day - 30, to);
          if (sv[I.clk] >= 3 && sv[I.conv] < 0.5) { const b = (bad[q.mod] = bad[q.mod] || { clk: 0, cost: 0 }); b.clk += sv[I.clk]; b.cost += sv[I.cost]; }
        }
        const negs = M.campaignNegatives(S, c.id).map((n) => n.text);
        const mods = Object.entries(bad).filter(([m]) => !negs.includes(MOD_WORD[m])).sort((a, b) => b[1].cost - a[1].cost);
        if (mods.length) {
          const words = mods.map(([m]) => MOD_WORD[m]);
          const cost = U.sum(mods, ([, b]) => b.cost);
          push({ id: 'neg_' + c.id + '_' + words.join(','), cat: 'Keywords & Anzeigen', icon: '🚫', impact: 4 + Math.min(6, Math.round(cost / 50)), cid: c.id,
            title: `Ausschließende Keywords hinzufügen: ${c.name}`, desc: `Irrelevante Suchbegriffe mit ${words.map((w) => '„' + w + '"').join(', ')} haben in 30 Tagen ${U.fmt.eur(cost)} ohne Conversions gekostet.`,
            apply: (S) => { for (const w of words) S.negatives.push({ id: M.nid(S, 'ng'), text: w, match: 'phrase', campaignId: c.id }); M.log(S, 'Ausschließende Keywords', c.name, 'Hinzugefügt: ' + words.join(', ')); } });
        }
        // Neue Keywords aus konvertierenden Suchbegriffen
        const existing = new Set(S.keywords.filter((k) => k.status !== 'removed').map((k) => k.text + '|' + k.match));
        const good = [];
        for (const k of E.keys(S, 'st', c.id + '~')) {
          const q = M.byId(S.queries, k.split('~')[1]);
          if (!q || q.brand) continue;
          const sv = E.sumRange(S, 'st', k, S.day - 30, to);
          if (sv[I.conv] >= 2 && !existing.has(U.norm(q.text) + '|exact')) good.push({ q, conv: sv[I.conv] });
        }
        if (good.length) {
          good.sort((a, b) => b.conv - a.conv);
          const top = good.slice(0, 5);
          push({ id: 'kwadd_' + c.id + '_' + top.map((g) => g.q.id).join(','), cat: 'Keywords & Anzeigen', icon: '➕', impact: 3 + top.length, cid: c.id,
            title: `Konvertierende Suchbegriffe als Keywords: ${c.name}`, desc: `${top.map((g) => '[' + g.q.text + ']').join(', ')} haben konvertiert, sind aber noch keine eigenen Keywords.`,
            apply: (S) => { for (const g of top) { const ag = M.agsOf(S, c.id).find((a) => M.kwsOf(S, a.id).some((k) => k.theme === g.q.theme)) || M.agsOf(S, c.id)[0]; if (ag) S.keywords.push(M.makeKeyword(S, ag, g.q.text, 'exact')); } M.log(S, 'Keywords', c.name, 'Hinzugefügt (exakt): ' + top.map((g) => g.q.text).join(', ')); } });
        }
        // Broad Match + Smart Bidding
        const kws = M.agsOf(S, c.id).flatMap((ag) => M.kwsOf(S, ag.id));
        if (D.BID_STRATEGIES[c.bidStrategy.type]?.smart && kws.length && !kws.some((k) => k.match === 'broad')) {
          push({ id: 'broad_' + c.id, cat: 'Keywords & Anzeigen', icon: '🌐', impact: 4, cid: c.id,
            title: `Weitgehend passende Keywords hinzufügen: ${c.name}`, desc: 'In Kombination mit Smart Bidding erreichen weitgehend passende Keywords zusätzliche relevante Suchanfragen.',
            apply: (S) => { for (const k of kws.slice(0, 6)) S.keywords.push(M.makeKeyword(S, M.ag(S, k.adGroupId), k.text, 'broad')); M.log(S, 'Keywords', c.name, 'Broad-Match-Varianten hinzugefügt'); } });
        }
        // Gebote unter erster Seite
        const below = kws.filter((k) => k.status === 'enabled' && k.rt && k.rt.belowFirst);
        if (below.length) {
          push({ id: 'firstpage_' + c.id + '_' + below.length, cat: 'Gebote & Budgets', icon: '⬆️', impact: 3, cid: c.id,
            title: `Gebote für erste Seite erhöhen: ${c.name}`, desc: `${below.length} Keyword(s) liegen unter dem geschätzten Gebot für die erste Seite.`,
            apply: (S) => { for (const k of below) k.maxCpc = +(k.rt.firstPage * 1.15).toFixed(2); M.log(S, 'Keywords', c.name, 'Gebote auf Erste-Seite-Niveau angehoben'); } });
        }
        // Duplikate
        const dupes = kws.filter((k) => k.rt && k.rt.dupe);
        if (dupes.length > 1) {
          push({ id: 'dupe_' + c.id, cat: 'Keywords & Anzeigen', icon: '♻️', impact: 1, cid: c.id, title: 'Redundante Keywords entfernen', desc: `${dupes.length} Keywords sind mehrfach vorhanden und konkurrieren miteinander.`,
            apply: (S) => { const seen = new Set(); for (const k of dupes) { const key = k.text + '|' + k.match; if (seen.has(key)) k.status = 'paused'; seen.add(key); } M.log(S, 'Keywords', c.name, 'Doppelte Keywords pausiert'); } });
        }
        // Wenig Suchvolumen
        const lv = kws.filter((k) => k.rt && k.rt.lowVol);
        if (lv.length) push({ id: 'lowvol_' + c.id + lv.length, cat: 'Keywords & Anzeigen', icon: '💤', impact: 1, cid: c.id, title: 'Keywords mit geringem Suchvolumen pausieren', desc: lv.map((k) => k.text).slice(0, 5).join(', '), apply: (S) => { lv.forEach((k) => (k.status = 'paused')); M.log(S, 'Keywords', c.name, 'Keywords mit geringem Suchvolumen pausiert'); } });
        // Niedriger Qualitätsfaktor
        const lowQs = kws.filter((k) => k.rt && k.rt.qs && k.rt.qs.score <= 4);
        if (lowQs.length) push({ id: 'qs_' + c.id + lowQs.length, cat: 'Keywords & Anzeigen', icon: '⭐', impact: 4, cid: c.id, title: 'Qualitätsfaktor verbessern', desc: `${lowQs.length} Keyword(s) mit Qualitätsfaktor ≤ 4. Prüfen Sie Anzeigenrelevanz (Keyword im Titel), Landingpage und thematisch enge Anzeigengruppen.`, view: 'keywords' });
        // Zielgruppen-Beobachtung
        if (!c.audiences.length) {
          push({ id: 'aud_' + c.id, cat: 'Zielgruppen', icon: '👥', impact: 3, cid: c.id, title: `Zielgruppen zur Beobachtung hinzufügen: ${c.name}`, desc: 'Fügen Sie kaufbereite Zielgruppen und Remarketing-Listen im Modus „Beobachtung" hinzu, um Leistungsdaten zu sammeln und Gebote anzupassen.',
            apply: (S) => { c.audiences.push({ id: 'im0', mode: 'observation', adj: 0 }, { id: 'rmv', mode: 'observation', adj: 0 }, { id: 'rmc', mode: 'observation', adj: 0 }); M.log(S, 'Zielgruppen', c.name, 'Beobachtungs-Zielgruppen hinzugefügt'); } });
        }
      }
    }
    // Anzeigenstärke
    for (const ad of S.ads) {
      if (ad.type !== 'rsa' || ad.status !== 'enabled') continue;
      const ag = M.ag(S, ad.adGroupId); if (!ag || ag.status === 'removed') continue;
      const c = M.camp(S, ag.campaignId); if (!c || c.status === 'removed' || c.isTrial) continue;
      const st = M.adStrength(S, ad);
      if (st.score < 55) push({ id: 'adstr_' + ad.id + '_' + ad.headlines.length, cat: 'Keywords & Anzeigen', icon: '✍️', impact: 3, cid: c.id, title: `Anzeigenstärke verbessern (${st.label}): ${ag.name}`, desc: st.tips.join(' · ') + '. Sie können automatisch erstellte Assets übernehmen.',
        apply: (S) => R.autoHeadlines(S, ad) });
      if (ad.policy.status === 'disapproved') push({ id: 'pol_' + ad.id, cat: 'Keywords & Anzeigen', icon: '⛔', impact: 6, cid: c.id, title: 'Abgelehnte Anzeige korrigieren', desc: ag.name + ': ' + ad.policy.reasons.join(', '), view: 'ads' });
    }
    // Creative-Ermüdung & Junk-Inventar
    for (const ad of S.ads) {
      if (ad.status !== 'enabled') continue;
      const ag = M.ag(S, ad.adGroupId); const c = ag && M.camp(S, ag.campaignId);
      if (!c || c.status !== 'enabled' || c.isTrial) continue;
      const fat = E.fatigue(ad);
      if (fat < 0.8) push({ id: 'fatigue_' + ad.id + '_' + Math.round(fat * 10), cat: 'Keywords & Anzeigen', icon: '🥱', impact: 3, cid: c.id, title: `Creative auffrischen: ${ag.name}`, desc: `Die Anzeige hat ${U.fmt.pct(1 - fat, 0)} ihrer ursprünglichen Wirkung verloren (Ermüdung durch häufige Auslieferung). Überarbeiten Sie Texte, Bilder oder Videos.`, view: 'ads' });
    }
    for (const c of live) if (['display', 'demandgen', 'pmax'].includes(c.type) && !c.display.excludeApps && M.ind(S).goal === 'leads') push({ id: 'apps_' + c.id, cat: 'Gebote & Budgets', icon: '📵', impact: 2, cid: c.id, title: `Mobile-App-Inventar prüfen: ${c.name}`, desc: 'Ein großer Teil der Klicks stammt aus Mobile-Apps (oft versehentlich). Prüfen Sie die Placements und schließen Sie App-Inventar ggf. aus.', apply: (S) => { c.display.excludeApps = true; M.log(S, 'Kampagne', c.name, 'Mobile-App-Inventar ausgeschlossen'); } });
    // Assets
    const anySearch = live.some((c) => ['search', 'pmax'].includes(c.type));
    if (anySearch) {
      const cnt = {};
      for (const a of S.assets) if (a.status === 'enabled') cnt[a.type] = (cnt[a.type] || 0) + 1;
      const brand = S.company.brand;
      const add = (type, items) => (S) => { for (const data of items) S.assets.push({ id: M.nid(S, 'as'), type, level: 'account', campaignId: null, status: 'enabled', data }); M.log(S, 'Assets', D.ASSET_TYPES[type].name, items.length + ' Konto-Asset(s) hinzugefügt'); };
      if ((cnt.sitelink || 0) < 4) push({ id: 'as_sitelink', cat: 'Assets', icon: '🔗', impact: 5, title: 'Sitelinks hinzufügen', desc: 'Anzeigen mit mindestens 4 Sitelinks erzielen eine deutlich höhere CTR und einen besseren Ad Rank.', apply: add('sitelink', [{ text: 'Über uns', d1: 'Lernen Sie ' + brand + ' kennen' }, { text: 'Kontakt', d1: 'Wir sind für Sie da' }, { text: ind.goal === 'sales' ? 'Angebote' : 'Preise', d1: 'Jetzt vergleichen' }, { text: 'Kundenstimmen', d1: 'Was Kunden sagen' }]) });
      if ((cnt.callout || 0) < 2) push({ id: 'as_callout', cat: 'Assets', icon: '💬', impact: 3, title: 'Zusatzinformationen hinzufügen', desc: 'Heben Sie Vorteile wie Versand, Service oder Garantie hervor.', apply: add('callout', [{ text: 'Persönlicher Service' }, { text: 'Seit über 10 Jahren' }, { text: 'Top bewertet' }]) });
      if (!cnt.snippet) push({ id: 'as_snippet', cat: 'Assets', icon: '📋', impact: 2, title: 'Snippets hinzufügen', desc: 'Strukturierte Snippets zeigen Sortiment oder Leistungen.', apply: add('snippet', [{ header: ind.goal === 'sales' ? 'Sortiment' : 'Leistungen', values: ind.themes.map((t) => t.name).join(', ') }]) });
      if (!cnt.image) push({ id: 'as_image', cat: 'Assets', icon: '🖼️', impact: 3, title: 'Bild-Assets hinzufügen', desc: 'Bilder machen Suchanzeigen auf Mobilgeräten auffälliger.', apply: add('image', [{ name: 'Produktbild quadratisch' }, { name: 'Querformat Banner' }]) });
      if (!cnt.businessname) push({ id: 'as_bn', cat: 'Assets', icon: '🏷️', impact: 2, title: 'Unternehmensname & Logo hinzufügen', desc: 'Stärkt das Markenvertrauen in Suchanzeigen.', apply: add('businessname', [{ text: brand }]) });
      if (!cnt.call && ['local', 'insurance', 'saas'].includes(S.ind)) push({ id: 'as_call', cat: 'Assets', icon: '📞', impact: S.ind === 'local' ? 8 : 3, title: 'Anruf-Asset hinzufügen', desc: 'Ermöglichen Sie Anrufe direkt aus der Anzeige – besonders wichtig auf Mobilgeräten.', apply: add('call', [{ phone: '+49 30 1234567' }]) });
      if (!cnt.location && S.ind === 'local') push({ id: 'as_loc', cat: 'Assets', icon: '📍', impact: 3, title: 'Standort-Asset verknüpfen', desc: 'Verknüpfen Sie Ihr Unternehmensprofil, um Adresse und Entfernung anzuzeigen.', apply: add('location', [{ name: 'Unternehmensprofil' }]) });
      if (!cnt.leadform && ind.goal === 'leads') push({ id: 'as_lead', cat: 'Assets', icon: '📝', impact: 2, title: 'Lead-Formular-Asset hinzufügen', desc: 'Nutzer können direkt in der Anzeige eine Anfrage senden.', apply: add('leadform', [{ name: 'Anfrage-Formular' }]) });
      if (!cnt.promotion && (S.market.fx?.cal || []).some((n) => /Black|Weihnacht|Prime|Singles|Ostern/.test(n))) push({ id: 'as_promo_' + S.day, cat: 'Assets', icon: '🏷️', impact: 3, title: 'Angebots-Asset für die Saison', desc: 'Aktuell läuft ein saisonales Shopping-Event. Bewerben Sie Ihr Angebot mit einem Angebots-Asset.', apply: add('promotion', [{ text: 'Saison-Rabatt', pct: 15 }]) });
    }
    // Messung
    if (!S.account.trackingOk) push({ id: 'trk', cat: 'Messung', icon: '🔴', impact: 20, title: 'Conversion-Tracking reparieren', desc: 'Seit dem letzten Website-Update werden keine Conversions erfasst. Smart Bidding arbeitet ohne Signal. Kosten der Reparatur: 150 €.', apply: (S) => R.fixTracking(S) });
    if (S.account.consentMode !== 'advanced') push({ id: 'consent', cat: 'Messung', icon: '🍪', impact: 4, title: 'Consent Mode (erweitert) aktivieren', desc: `Aktuell erfassen Sie nur ca. ${U.fmt.pct0(S.account.consentRate)} der Conversions. Mit erweitertem Consent Mode werden fehlende Conversions modelliert.`, apply: (S) => { S.account.consentMode = 'advanced'; M.log(S, 'Messung', 'Consent Mode', 'Auf „erweitert" umgestellt'); } });
    if (!S.account.enhancedConv) push({ id: 'ec', cat: 'Messung', icon: '🔐', impact: 3, title: 'Erweiterte Conversions aktivieren', desc: 'Gehashte Erstanbieterdaten verbessern die Messgenauigkeit um einige Prozent.', apply: (S) => { S.account.enhancedConv = true; M.log(S, 'Messung', 'Erweiterte Conversions', 'Aktiviert'); } });
    // Landingpage
    const slow = S.adGroups.filter((ag) => ag.status === 'enabled' && ag.lp.speed < 55 && M.camp(S, ag.campaignId)?.status === 'enabled');
    if (slow.length) push({ id: 'lpspeed_' + slow.length, cat: 'Website', icon: '🚀', impact: 4, title: 'Mobile Ladezeit verbessern', desc: `${slow.length} Anzeigengruppe(n) verweisen auf langsame Seiten (PageSpeed < 55). Beauftragen Sie eine Optimierung (einmalig 1.200 €).`, apply: (S) => R.optimizeLP(S, slow, 'speed') });
    // Performance Max
    const conv30 = E.sumRange(S, 'acct', 'all', S.day - 30, to)[I.conv];
    if (conv30 >= 30 && !live.some((c) => c.type === 'pmax')) push({ id: 'pmax', cat: 'Neue Kampagnen', icon: '⚡', impact: 3, title: 'Performance Max testen', desc: 'Erreichen Sie zusätzliche Kunden auf allen Google-Kanälen mit einer KI-gestützten Kampagne.', view: 'wizard' });
    // Merchant Center
    const noGtin = S.products.filter((p) => p.status === 'enabled' && !p.gtin);
    if (noGtin.length) push({ id: 'gtin_' + noGtin.length, cat: 'Merchant Center', icon: '🏷️', impact: 2, title: 'Fehlende GTINs ergänzen', desc: `${noGtin.length} Produkt(e) ohne GTIN haben eingeschränkte Sichtbarkeit.`, apply: (S) => { noGtin.forEach((p) => (p.gtin = true)); M.log(S, 'Merchant Center', 'Produkte', 'GTINs ergänzt'); } });
    return out.sort((a, b) => b.impact - a.impact);
  };

  R.score = function (S, recs) {
    const live = S.campaigns.filter((c) => c.status === 'enabled');
    if (!live.length) return null;
    return U.clamp(100 - U.sum(recs || R.compute(S), (r) => r.impact), 12, 100);
  };

  R.apply = function (S, rec) {
    if (rec.apply) { rec.apply(S); M.log(S, 'Empfehlung', rec.title, 'Übernommen'); }
    S.dismissed[rec.id] = S.day + 9999; // nicht erneut anzeigen bis Lage sich ändert (andere ID)
  };
  R.dismiss = function (S, rec) { S.dismissed[rec.id] = S.day; M.log(S, 'Empfehlung', rec.title, 'Abgelehnt'); };

  // Automatisch generierte Anzeigentitel („KI-Assets")
  R.autoHeadlines = function (S, ad) {
    const ag = M.ag(S, ad.adGroupId);
    const kws = M.kwsOf(S, ag.id);
    const cap = (s) => s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const brand = S.company.brand;
    const ideas = kws.map((k) => cap(k.text)).concat(kws.map((k) => cap(k.text) + ' bei ' + brand), [brand + ' – Offizielle Seite', 'Jetzt informieren', 'Bewertet mit 4,8/5', 'Schnell & unkompliziert', 'Faire Preise', 'Persönliche Beratung', cap(ag.name) + ' entdecken', 'Heute noch starten']);
    const have = new Set(ad.headlines.map((h) => U.norm(h.t)));
    for (const t of ideas) {
      if (ad.headlines.length >= 15) break;
      if (t.length <= 30 && !have.has(U.norm(t))) { ad.headlines.push({ t, pin: 0 }); have.add(U.norm(t)); }
    }
    const dIdeas = [`${cap(ag.name)} von ${brand}: Qualität, die überzeugt. Jetzt mehr erfahren.`, 'Tausende zufriedene Kunden vertrauen uns. Überzeugen Sie sich selbst.', 'Einfach online anfragen oder bestellen – wir kümmern uns um den Rest.'];
    for (const t of dIdeas) { if (ad.descriptions.length >= 4) break; if (!ad.descriptions.some((d) => d.t === t)) ad.descriptions.push({ t: t.slice(0, 90), pin: 0 }); }
    ad.fat = Math.round((ad.fat || 0) * 0.5);
    M.reviewAd(S, ad, true);
    M.log(S, 'Anzeige', ag.name, 'Automatisch erstellte Assets hinzugefügt');
  };

  // ---------- Unternehmensaktionen (kosten Geld) ----------
  R.spend = function (S, amount, what) {
    S._otherCosts = (S._otherCosts || 0) + amount;
    M.log(S, 'Unternehmen', what, 'Investition: ' + U.fmt.eur(amount));
  };
  R.fixTracking = function (S) {
    if (S.account.trackingOk) return;
    S.account.trackingOk = true;
    for (const e of S.market.events) if (e.def === 'tracking' && e.end > S.day) e.end = S.day;
    R.spend(S, 150, 'Google-Tag repariert');
    S.alerts.unshift({ day: S.day, level: 'good', text: 'Conversion-Tracking repariert – Conversions werden wieder erfasst.' });
  };
  R.fixEvent = function (S, ev) {
    if (!ev.fixable) return;
    if (ev.def === 'tracking') return R.fixTracking(S);
    ev.end = S.day - 1; ev.done = true;
    R.spend(S, ev.fixable.cost, ev.fixable.label);
    if (ev.def === 'lp_down') for (const ad of S.ads) if (ad.policy.destDown) M.reviewAd(S, ad, true);
    S.alerts.unshift({ day: S.day, level: 'good', text: 'Behoben: ' + ev.name });
  };
  R.LP_INVEST = {
    speed: { label: 'PageSpeed-Optimierung (Bilder, Caching, Core Web Vitals)', cost: 1200, fx: (ag) => { ag.lp.speed = Math.min(98, ag.lp.speed + 25); } },
    relevance: { label: 'Themenspezifische Landingpages erstellen', cost: 900, fx: (ag) => { ag.lp.relevance = Math.min(0.97, ag.lp.relevance + 0.18); } },
    mobile: { label: 'Mobile-First-Redesign', cost: 2500, fx: (ag) => { ag.lp.mobile = true; ag.lp.speed = Math.min(98, ag.lp.speed + 10); ag.lp.relevance = Math.min(0.97, ag.lp.relevance + 0.05); } },
  };
  R.optimizeLP = function (S, ags, kind) {
    const inv = R.LP_INVEST[kind];
    const cost = kind === 'relevance' ? inv.cost * ags.length : inv.cost;
    ags.forEach(inv.fx);
    R.spend(S, cost, inv.label + ' (' + ags.length + ' Anzeigengruppe(n))');
  };
  R.injectCapital = function (S, amount) {
    S.company.cash += amount;
    S.company.injected = (S.company.injected || 0) + amount;
    M.log(S, 'Unternehmen', 'Kapital', 'Einzahlung ' + U.fmt.eur(amount));
    if (S.company.cash > 0) S.account.paymentOk = true;
  };

  G.R = R;
})();
