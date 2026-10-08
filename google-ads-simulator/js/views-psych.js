/* Ads Simulator – Ansicht „Conversion & Psychologie" */
(function () {
  const G = globalThis.GA;
  const U = G.U, M = G.M, E = G.E, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP, P = G.PSY;
  const f = U.fmt, esc = U.esc;

  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  const pctChange = (x) => (Math.abs(x - 1) < 0.005 ? '±0 %' : (x > 1 ? '+' : '') + Math.round((x - 1) * 100) + ' %');

  V.cro = {
    render() {
      const S = APP.S, st = P.state(S);
      const ctxLike = { ind: M.ind(S), date: M.today(S) };
      const ps = P.prep(S, ctxLike);
      const [a, b] = UI.rng();
      let rep = 0;
      for (let d = a; d <= b; d++) { const p = S.pnl[d]; if (p && p.repeat) rep += p.repeat; }
      const org = UI.m('org', 'all');
      const tile = (l, v, s) => `<div class="card"><div class="stat"><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${s}</div></div></div>`;
      const tiles = `<div class="grid g4">
        ${tile('Verkäuferbewertung', `<span style="color:var(--s3)">${stars(st.rating)}</span> ${f.num1(st.rating)}`, `${f.int(st.reviews)} Rezensionen · ${ps.showStars ? 'Sterne werden in Anzeigen angezeigt' : 'ab 100 Rezensionen & 3,5★ in Anzeigen sichtbar'}`)}
        ${tile('Kundenvertrauen', f.pct0(st.trust / 0.85), st.trust < 0.65 ? '<span class="down">Dark Patterns schaden der Marke</span>' : 'beeinflusst die Conversion-Rate')}
        ${tile('Wiederkäufe (Kundenwert)', f.eur0(rep), 'Umsatz von Bestandskunden ohne Werbekosten im Zeitraum')}
        ${tile('Organische Marken-Conversions', f.int(org.rconv), `inkl. Rückkehrer: ca. ${f.int(st.halo || 0)} zusätzliche Markensuchen/Monat`)}</div>`;

      const list = P.available(S).map((c) => {
        const on = !!st.cro[c.id];
        const eff = [];
        if (c.cvr) eff.push('Conversion-Rate ' + pctChange(c.b2bCvr && (S.bank || ['saas', 'insurance', 'local'].includes(S.ind)) ? c.b2bCvr : c.cvr));
        if (c.aov) eff.push('Warenkorb ' + pctChange(c.aov));
        if (c.qual) eff.push('Kontoeröffnungen ' + pctChange(c.qual));
        if (c.repeat) eff.push('Wiederkäufe ' + pctChange(c.repeat));
        if (c.ret) eff.push('Retouren +' + Math.round(c.ret * 100) + ' Pp.');
        if (c.reviews) eff.push('3× mehr Bewertungen');
        const cost = [c.setup ? 'einmalig ' + f.eur0(c.setup) : '', c.month ? f.eur0(c.month) + '/Monat' : '', c.fee ? f.pct(c.fee, 1) + ' vom Umsatz' : ''].filter(Boolean).join(' · ') || 'kostenlos';
        const age = on ? S.day - st.cro[c.id].since : 0;
        return `<div class="rec"><div class="ic">${UI.toggle(on, 'crotoggle', `data-id="${c.id}"`)}</div><div class="body"><div class="ttl">${esc(c.name)} ${c.dark ? UI.pill(['Dark Pattern', 'bad']) : ''}${c.legal ? UI.pill(['Rechtsrisiko', 'warn']) : ''}</div><div class="small muted" style="margin:4px 0">${esc(c.tip)}</div><div class="small">${eff.join(' · ')}</div>${c.dark && on ? `<div class="small down" style="margin-top:4px">Aktiv seit ${age} Tagen – Wirkung ${age > 45 ? 'kehrt sich um' : 'lässt nach'}, Abmahnrisiko steigt.</div>` : ''}</div><div class="imp" style="color:var(--text-2)">${cost}</div></div>`;
      }).join('');

      const ads = S.ads.filter((ad) => ad.status === 'enabled' && ['rsa', 'rda', 'dg', 'assetgroup'].includes(ad.type) && M.camp(S, M.ag(S, ad.adGroupId).campaignId).status !== 'removed');
      const rows = ads.map((ad) => {
        const ag = M.ag(S, ad.adGroupId), prof = P.adProfile(S, ad, null);
        const warn = [];
        if (prof.cats.length >= 4) warn.push('überladen / reißerisch');
        if (prof.cats.includes('urgency') && S.day - (ad.created || 0) > 30) warn.push('Dauer-Verknappung (Abmahnrisiko)');
        if (prof.cats.includes('urgency') && (S.bank || ['saas', 'insurance'].includes(S.ind))) warn.push('Verknappung wirkt im Finanz-/B2B-Umfeld unseriös');
        if (!prof.cats.length) warn.push('keine psychologischen Elemente');
        return { id: ad.id, ad, ag, prof, warn };
      });
      const t = UI.table('psyads', [
        { k: 'ag', l: 'Anzeige', f: (r) => `<b>${esc(r.ag.name)}</b><div class="tiny muted">${esc((r.ad.headlines || [])[0] ? r.ad.headlines[0].t : '')}</div>`, sort: (r) => r.ag.name },
        { k: 'cats', l: 'Erkannte Trigger', wrap: true, f: (r) => r.prof.cats.map((c) => `<span class="tag" title="${esc(P.TRIGGERS[c].tip)}">${esc(P.TRIGGERS[c].name)}</span>`).join(' ') || '<span class="muted small">–</span>', sort: (r) => r.prof.cats.length },
        { k: 'ctr', l: 'Effekt CTR', num: true, f: (r) => `<span class="${r.prof.ctr >= 1 ? 'up' : 'down'}">${pctChange(r.prof.ctr)}</span>`, sort: (r) => r.prof.ctr },
        { k: 'cvr', l: 'Effekt Conv.-Rate', num: true, f: (r) => `<span class="${r.prof.cvr >= 1 ? 'up' : 'down'}">${pctChange(r.prof.cvr)}</span>`, sort: (r) => r.prof.cvr },
        { k: 'aov', l: 'Warenkorb', num: true, f: (r) => pctChange(r.prof.aov), sort: (r) => r.prof.aov },
        { k: 'warn', l: 'Hinweise', wrap: true, f: (r) => (r.warn.length ? `<span class="small down">${r.warn.map(esc).join(' · ')}</span>` : '<span class="small up">ausgewogen</span>'), nosort: true },
      ], rows, { empty: 'Keine aktiven Text- oder Bildanzeigen.' });
      const legend = Object.values(P.TRIGGERS).map((x) => `<div class="small" style="margin-bottom:6px"><b>${esc(x.name)}:</b> ${esc(x.tip)}</div>`).join('');

      return UI.head('Conversion & Psychologie', '', { noScope: true })
        + '<div class="callout">Kaufentscheidungen hängen nicht nur an Gebot und Keyword. Vertrauen, Bewertungen, Zahlarten, psychologische Trigger und Wiederkäufe bestimmen, was ein Klick wirklich wert ist. Manipulative Muster wirken kurzfristig, kosten aber Vertrauen und können abgemahnt werden.</div>'
        + tiles
        + `<div class="grid g21"><div>${UI.card('Shop & Landingpage optimieren', list || '<div class="empty">Für diese Branche nicht verfügbar.</div>', { flush: true })}</div><div>${UI.card('Psychologische Trigger – Wirkung', legend)}</div></div>`
        + UI.card('Analyse Ihrer Anzeigentexte', t, { flush: true, sub: 'Durchschnittlicher Kontext; die Wirkung hängt je Suchanfrage von Kaufabsicht und Preisinteresse ab' });
    },
  };
  ACT.crotoggle = (el, d) => { P.toggle(APP.S, d.id); UI.render(); };
})();
