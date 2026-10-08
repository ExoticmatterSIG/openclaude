/* Google Ads Simulator – Simulations-Engine
 * Tagesweise Simulation mit stündlichen Auktionen: Suchanfragen → Teilauktionen (Standort, Gerät, Alter,
 * Geschlecht, Zielgruppen) → Ad Rank (Gebot × Qualität × Assets × Kontext) → GSP-Preisbildung → Klicks,
 * Conversions mit Verzögerung, Budget-Pacing, Smart Bidding, Wettbewerber-KI, Markt & Ereignisse.
 */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U, D = G.D, M = G.M;
  const E = {};

  // ---------- Kennzahlen-Vektor ----------
  const I = { imp: 0, clk: 1, cost: 2, conv: 3, val: 4, aconv: 5, rconv: 6, rval: 7, elig: 8, impw: 9, lostB: 10, lostR: 11, top: 12, abs: 13, views: 14, vconv: 15, inv: 16, calls: 17 };
  const NM = 18;
  E.I = I; E.NM = NM;
  const FINE_DIMS = new Set(['kw', 'ad', 'st', 'dev', 'loc', 'hour', 'age', 'gen', 'aud', 'net', 'prod', 'ai']);
  const KEEP_DAYS = 120;

  function newVec() { return new Array(NM).fill(0); }
  function bufVec(buf, key) { let a = buf.get(key); if (!a) { a = newVec(); buf.set(key, a); } return a; }
  function addKeys(buf, keys, idx, v, f = 1) { if (!v) return; for (const k of keys) bufVec(buf, k)[idx] += v * f; }

  function statVec(S, dim, id, day, create) {
    let d = S.stats[dim]; if (!d) { if (!create) return null; d = S.stats[dim] = {}; }
    let e = d[id]; if (!e) { if (!create) return null; e = d[id] = {}; }
    let v = e[day]; if (!v) { if (!create) return null; v = e[day] = newVec(); }
    return v;
  }
  function creditPast(S, keys, day, idx, v, f = 1) {
    if (!v) return;
    for (const key of keys) {
      const p = key.indexOf('|');
      statVec(S, key.slice(0, p), key.slice(p + 1), day < S.day - KEEP_DAYS && FINE_DIMS.has(key.slice(0, p)) ? 'old' : day, true)[idx] += v * f;
    }
  }

  // ---------- Abfragen ----------
  E.sumRange = function (S, dim, id, from, to) {
    const out = newVec();
    const e = S.stats[dim] && S.stats[dim][id];
    if (!e) return out;
    for (const k in e) {
      const d = k === 'old' ? -1 : +k;
      if (k === 'old' ? from <= 0 : d >= from && d <= to) { const v = e[k]; for (let i = 0; i < NM; i++) out[i] += v[i]; }
    }
    return out;
  };
  E.series = function (S, dim, id, from, to) {
    const e = (S.stats[dim] && S.stats[dim][id]) || {};
    const out = [];
    for (let d = from; d <= to; d++) out.push(e[d] || newVec());
    return out;
  };
  E.keys = function (S, dim, prefix) { return Object.keys(S.stats[dim] || {}).filter((k) => !prefix || k.startsWith(prefix)); };
  E.add = function (a, b) { for (let i = 0; i < NM; i++) a[i] += b[i]; return a; };
  E.zero = newVec;
  E.derive = function (v) {
    const d = U.div;
    return {
      imp: v[I.imp], clk: v[I.clk], cost: v[I.cost], conv: v[I.conv], val: v[I.val], aconv: v[I.aconv], rconv: v[I.rconv], rval: v[I.rval],
      ctr: d(v[I.clk], v[I.imp]), cpc: d(v[I.cost], v[I.clk]), cvr: d(v[I.conv], v[I.clk]), cpa: d(v[I.cost], v[I.conv]), roas: d(v[I.val], v[I.cost]),
      cpm: d(v[I.cost], v[I.imp]) * 1000, is: d(v[I.impw], v[I.elig]), lostB: d(v[I.lostB], v[I.elig]), lostR: d(v[I.lostR], v[I.elig]),
      top: d(v[I.top], v[I.impw]), abs: d(v[I.abs], v[I.impw]), topIS: d(v[I.top], v[I.elig]), absIS: d(v[I.abs], v[I.elig]),
      views: v[I.views], viewRate: d(v[I.views], v[I.imp]), cpv: d(v[I.cost], v[I.views]), vconv: v[I.vconv], inv: v[I.inv], calls: v[I.calls],
      valPerConv: d(v[I.val], v[I.conv]), rroas: d(v[I.rval], v[I.cost]),
    };
  };

  // Creative-Ermüdung: Anzeigen verlieren mit zunehmender Auslieferung an Wirkung (bis zur Auffrischung)
  E.fatigue = function (ad) {
    const visual = ad.type !== 'rsa';
    const k = visual ? 900000 : 120000, maxLoss = ad.type === 'video' ? 0.38 : visual ? 0.42 : 0.14;
    return 1 - maxLoss * (1 - Math.exp(-(ad.fat || 0) / k));
  };

  // ---------- Markt & Ereignisse ----------
  function activeCal(S, date) {
    const ind = S.ind, y = date.getUTCFullYear(), out = [];
    for (const ev of D.CAL_EVENTS) {
      const [a, b] = ev.range(y, date);
      if (date >= a && date <= b) {
        const fx = ev.fx[ind] || ev.fx._all;
        if (fx) out.push({ ev, fx, start: a, end: b });
      }
    }
    return out;
  }
  E.activeCal = activeCal;
  E.upcomingCal = function (S, n = 6) {
    const date = M.today(S), y = date.getUTCFullYear(), out = [];
    for (const yy of [y, y + 1]) for (const ev of D.CAL_EVENTS) {
      if (ev.id === 'quartalsende') continue;
      const [a, b] = ev.range(yy, new Date(Date.UTC(yy, 0, 1)));
      const fx = ev.fx[S.ind];
      if (fx && b >= date) out.push({ ev, start: a, end: b, fx });
    }
    return out.sort((p, q) => p.start - q.start).slice(0, n);
  };

  function spawnEvent(S, rng, def, diff) {
    const ind = M.ind(S), day = S.day;
    const active = S.competitors.filter((c) => c.active);
    const ev = { id: M.nid(S, 'ev'), def: def.id, sev: def.sev, start: day, end: day + rng.int(def.dur[0], def.dur[1]) - 1, fixable: def.fixable || null };
    let comp = null, theme = null;
    if (def.name.includes('{comp}') || def.desc.includes('{comp}')) {
      if (def.id === 'comp_enter') {
        const used = new Set(S.competitors.map((c) => c.name));
        const name = ind.entrants.find((n) => !used.has(n)) || 'Newcomer ' + S.nextId;
        const tpl = { name, style: 'aggressive', budget: Math.round(U.avg(ind.competitors, (c) => c.budget) * rng.range(0.8, 1.6)), qs: rng.int(5, 8), aggr: rng.range(1.2, 1.5), shopping: ind.hasShopping && rng.chance(0.6) };
        comp = M.makeCompetitor(S, tpl, rng, diff);
        comp.cash = tpl.budget * 200; comp.entered = day; comp.isNew = true;
        S.competitors.push(comp);
      } else {
        const pool = def.compFilter === 'rates' ? active.filter((c) => c.rates) : active;
        if (!pool.length) return null;
        comp = rng.pick(pool);
      }
      ev.comp = comp.id;
    }
    if (def.name.includes('{theme}') || def.desc.includes('{theme}')) { theme = rng.pick(ind.themes); ev.theme = theme.id; }
    const fill = (s) => s.replace(/\{comp\}/g, comp ? comp.name : '').replace(/\{theme\}/g, theme ? theme.name : '');
    ev.name = fill(def.name); ev.desc = fill(def.desc);
    // Einmalige Effekte
    switch (def.id) {
      case 'comp_pause': comp.pausedUntil = ev.end; break;
      case 'consent': S.account.consentRate = Math.max(0.5, S.account.consentRate - 0.06); break;
      case 'ai_overview': S.market.ctrInfo = Math.max(0.4, S.market.ctrInfo * 0.72); break;
      case 'tracking': if (!S.account.trackingOk) return null; S.account.trackingOk = false; break;
      case 'core_update': for (const c of S.competitors) c.qs = U.clamp(c.qs + rng.int(-1, 1), 3, 10); break;
      case 'brand_safety':
        S.company.awareness = Math.max(0.01, S.company.awareness - 0.03);
        if (S.goals) S.goals.penalty = (S.goals.penalty || 0) + 10;
        break;
      case 'policy_update':
        for (const ad of S.ads) if (ad.status !== 'removed' && rng.chance(0.35)) { M.reviewAd(S, ad, true); if (ad.policy.status === 'limited' && rng.chance(0.4)) { ad.policy.status = 'disapproved'; ad.policy.reasons.push('Neue Richtlinie: Werbeaussagen nicht belegt'); } }
        break;
    }
    S.market.events.push(ev);
    if (G.BANK && S.bank) G.BANK.onEvent(S, ev, 'start');
    S.market.log.unshift({ day, name: ev.name, desc: ev.desc, sev: ev.sev, id: ev.id });
    if (S.market.log.length > 300) S.market.log.length = 300;
    S.alerts.unshift({ day, level: ev.sev === 'crit' ? 'bad' : ev.sev === 'warn' ? 'warn' : 'info', text: '📰 ' + ev.name, event: ev.id });
    if (ev.sev === 'crit' || ev.def === 'comp_enter') S._pauseRequest = ev.name;
    return ev;
  }

  function computeFx(S, date) {
    const fx = {
      demand: 1, cvr: 1, ctr: 1, cpc: 1, aov: 1, compAggr: 1, compBudget: 1, themeDemand: {}, themeCvr: {}, compAggrById: {}, compAggrTheme: {},
      playerCvr: 1, playerDown: false, invalidRate: S.account.invalidRate, brandVol: 1, stockOut: {}, capacity: 1, cal: [],
    };
    const mul = (obj, k, v) => { obj[k] = (obj[k] || 1) * v; };
    for (const c of activeCal(S, date)) {
      fx.cal.push(c.ev.name);
      for (const [k, v] of Object.entries(c.fx)) {
        if (k === 'themeDemand') for (const [t, m] of Object.entries(v)) mul(fx.themeDemand, t, m);
        else if (k === 'themeCvr') for (const [t, m] of Object.entries(v)) mul(fx.themeCvr, t, m);
        else fx[k] *= v;
      }
    }
    for (const e of S.market.events) {
      if (e.start > S.day || e.end < S.day) continue;
      switch (e.def) {
        case 'comp_sale': mul(fx.compAggrById, e.comp, 1.5); fx.playerCvr *= 0.88; break;
        case 'bid_war': mul(fx.compAggrTheme, e.theme, 1.55); break;
        case 'core_update': fx.demand *= 1.06; break;
        case 'recession': fx.cvr *= 0.86; fx.demand *= 0.93; fx.aov *= 0.94; fx.compBudget *= 0.85; break;
        case 'boom': fx.cvr *= 1.07; fx.demand *= 1.05; fx.aov *= 1.03; break;
        case 'viral': mul(fx.themeDemand, e.theme, 2.6); mul(fx.themeCvr, e.theme, 0.8); break;
        case 'media_negative': fx.demand *= 0.88; fx.cvr *= 0.86; break;
        case 'supply': fx.stockOut[e.theme] = 0.7; mul(fx.themeCvr, e.theme, 0.45); break;
        case 'capacity': fx.capacity *= 0.7; break;
        case 'lp_down': fx.playerDown = true; break;
        case 'click_fraud': fx.invalidRate = 0.16; break;
        case 'heat': fx.demand *= 0.93; ['jacken', 'heizung', 'hoodies'].forEach((t) => mul(fx.themeDemand, t, 0.55)); ['ostsee'].forEach((t) => mul(fx.themeDemand, t, 1.4)); mul(fx.themeDemand, 'home', 0.8); break;
        case 'cold': [['jacken', 1.5], ['heizung', 2.2], ['sanitaer', 1.35], ['ski', 1.35], ['wellness', 1.2], ['hoodies', 1.2]].forEach(([t, m]) => mul(fx.themeDemand, t, m)); break;
        case 'price_hike': mul(fx.compAggrById, e.comp, 0.85); fx.playerCvr *= 1.08; break;
        case 'influencer': fx.brandVol *= 4; break;
        default: if (G.BANK && S.bank) G.BANK.fx(S, e, fx, mul);
      }
    }
    return fx;
  }

  function updateMarket(S, rng, date, diff) {
    const m = S.market, ind = M.ind(S);
    m.cpcTrend = (m.cpcTrend || 1) * 1.00019;
    m.demand = U.clamp(m.demand * Math.exp(0.012 * rng.normal()) + (1 - m.demand) * 0.02, 0.7, 1.4);
    m.cpcIdx = U.clamp(m.cpcIdx * Math.exp(0.006 * rng.normal()) + (m.cpcTrend - m.cpcIdx) * 0.03, 0.6, 2.5);
    m.cvrIdx = U.clamp(m.cvrIdx * Math.exp(0.008 * rng.normal()) + (1 - m.cvrIdx) * 0.03, 0.75, 1.3);
    for (const t of ind.themes) m.themeTrend[t.id] = U.clamp(m.themeTrend[t.id] * Math.exp(0.018 * rng.normal()) + (1 - m.themeTrend[t.id]) * 0.012, 0.6, 1.6);
    // abgelaufene Ereignisse
    for (const e of m.events) if (e.end < S.day && !e.done) {
      e.done = true;
      if (G.BANK && S.bank) G.BANK.onEvent(S, e, 'end');
      if (e.def === 'lp_down') S.alerts.unshift({ day: S.day, level: 'good', text: 'Website wieder erreichbar.' });
    }
    m.events = m.events.filter((e) => e.end >= S.day - 60);
    S.account.reportingDelay = m.events.some((e) => e.def === 'reporting_delay' && e.end >= S.day) ? 2 : 0;
    // Kalender-News am ersten Tag
    for (const c of activeCal(S, date)) if (U.toISO(c.start) === U.toISO(date) && c.ev.id !== 'quartalsende') {
      m.log.unshift({ day: S.day, name: 'Saison: ' + c.ev.name, desc: 'Saisonales Ereignis beginnt (bis ' + U.fmtDate(c.end, false) + ').', sev: 'info' });
    }
    // Zufallsereignisse
    if (S.day > 2) {
      for (const def of D.RANDOM_EVENTS) {
        if (def.industries && !def.industries.includes(S.ind)) continue;
        if (def.notIndustries && def.notIndustries.includes(S.ind)) continue;
        if (def.requires === 'unsafeDisplay' && !S.campaigns.some((c) => c.status === 'enabled' && ['display', 'video', 'demandgen', 'pmax'].includes(c.type) && !c.display.excludeSensitive)) continue;
        if (def.months && !def.months.includes(date.getUTCMonth())) continue;
        if (m.events.some((e) => e.def === def.id && e.end >= S.day && !e.done)) continue;
        if (rng() < def.p * diff.events) spawnEvent(S, rng, def, diff);
      }
      if (rng() < 0.05) m.news.unshift({ day: S.day, text: rng.pick(D.NEWS_FLAVOR) });
      if (m.news.length > 60) m.news.length = 60;
    }
    m.fx = computeFx(S, date);
  }

  // ---------- Tagesvorbereitung ----------
  function conv30(S, cid) {
    const v = E.sumRange(S, 'camp', cid, S.day - 30, S.day - 1);
    return { conv: v[I.conv], val: v[I.val], cost: v[I.cost], clk: v[I.clk], imp: v[I.imp] };
  }

  function prepareDay(S, rng, date) {
    const ind = M.ind(S), fx = S.market.fx, day = S.day;
    const ctx = { date, dow: U.dowMon0(date), month: date.getUTCMonth(), fx, ind, camps: [], cands: {}, shopCands: {}, inv: [], comps: [], compsByQ: {}, revenue: 0, realConv: 0, other: 0, assist: [], visitors: 0, carts: 0, buyers: 0, awareImps: 0, mktClicks: 0, mktCost: 0, playerClicks: 0 };
    S.account.paymentOk = S.company.cash > 0;
    ctx.bank = !!ind.bank;
    ctx.prodCvr = ind.bank ? G.BANK.cvrMults(S) : {};
    const finBlocked = ind.bank && S.bank.verify.status === 'suspended';
    // Summe der Raten aller primären Conversion-Aktionen (Smart Bidding optimiert darauf)
    const prim = S.convActions.filter((c) => c.status === 'enabled' && c.primary);
    ctx.primRate = (biz, b2b) => {
      if (!prim.length) return 1;
      let r = 0;
      for (const c of prim) r += c.rate * (!ind.bank ? 1 : c.qualified ? G.BANK.bizEff(biz, b2b) * (c.qRate || 1) : G.BANK.appMix(biz, b2b).factor);
      return r || 0.01;
    };
    const priceAdj = S.company.priceAdj;
    ctx.priceCvr = Math.pow(1 + priceAdj, -2.2);
    ctx.aov = ind.aov * (1 + priceAdj) * fx.aov;
    ctx.margin = 1 - (1 - ind.margin) / (1 + priceAdj);
    ctx.consent = S.account.trackingOk ? U.clamp(S.account.consentRate + (S.account.consentMode === 'advanced' ? (1 - S.account.consentRate) * 0.7 : 0) + (S.account.enhancedConv ? 0.05 : 0), 0, 0.98) * (S.account.autoTagging ? 1 : 0.55) : 0;
    const audAll = M.audiences(S);
    ctx.audById = Object.fromEntries(audAll.map((a) => [a.id, a]));
    // intrinsische Nutzersegmente (beeinflussen CVR immer – Smart Bidding sieht sie)
    ctx.intrinsic = audAll.filter((a) => a.type === 'Kaufbereite Zielgruppe' || a.id === 'rmv' || a.id === 'rmc' || a.id === 'rmb');
    const expMap = {};
    for (const x of S.experiments) if (x.status === 'running') { expMap[x.baseId] = { x, role: 'base' }; expMap[x.trialId] = { x, role: 'trial' }; }

    for (const c of S.campaigns) {
      const rt = c.rt;
      rt.active = false; rt.d = { elig: 0, lostB: 0, lostR: 0, impw: 0, top: 0, abs: 0, spend: 0, conv: 0, clk: 0 };
      if (c.status !== 'enabled' || !S.account.paymentOk || finBlocked) continue;
      if (c.startDay > day || (c.endDay !== null && c.endDay < day)) continue;
      const ags = M.agsOf(S, c.id).filter((a) => a.status === 'enabled');
      for (const ag of ags) {
        const ads = M.adsOf(S, ag.id).filter((a) => M.adServable(S, a));
        ag.rt = { ads, str: ads.length ? Math.max(...ads.map((a) => M.adStrength(S, a).score)) : 0, lp: M.lpScore(S, ag), b2b: ind.bank && ads.some((a) => G.BANK.isB2B(a)), rate: ind.bank && ads.some((a) => /\d[,.]\d{1,2}\s?%/.test(JSON.stringify(a.headlines || []))) };
      }
      const servableAgs = c.type === 'shopping' ? ags : ags.filter((ag) => ag.rt.ads.length);
      if (!servableAgs.length) continue;
      if (c.type === 'shopping' && !S.products.some((p) => p.status === 'enabled')) continue;
      rt.ags = servableAgs;
      rt.active = true;
      const st = c.bidStrategy.type;
      const smart = D.BID_STRATEGIES[st]?.smart || c.type === 'pmax';
      const h = conv30(S, c.id);
      rt.conv30 = h.conv;
      rt.estValue = h.conv > 3 ? h.val / h.conv : ctx.aov;
      rt.learning = c.learnUntil !== null && c.learnUntil > day;
      rt.smart = smart;
      rt.sigma = rt.learning ? 0.5 : 0.12 + 0.45 * Math.exp(-h.conv / 30);
      rt.bias = smart ? (rt.learning ? rng.logn(0.35) * 0.9 : rng.logn(0.05 + 0.25 * Math.exp(-h.conv / 30))) : 1;
      if (!S.account.trackingOk && smart && h.conv < 2) rt.bias *= 0.6; // Smart Bidding ohne Signal
      const avgCpc = U.avg(ind.themes.flatMap((t) => t.kws), (k) => k[2]) * S.market.cpcIdx;
      if (rt.lambda === null || rt.lambda === undefined) {
        if (st === 'maxconv' || (c.type === 'pmax' && st !== 'maxvalue') || st === 'tcpi') rt.lambda = ind.aov * ind.margin * 0.55;
        else if (st === 'maxclicks' || st === 'tis') rt.lambda = avgCpc * 0.8;
        else rt.lambda = 1;
      }
      if (st === 'maxvalue' && !rt.lambdaV) rt.lambdaV = ind.margin * 0.6;
      const elastic = ['maxconv', 'maxvalue', 'maxclicks'].includes(st) || c.type === 'pmax';
      rt.p = U.clamp((elastic ? 1.25 : 1) * c.budget / Math.max(rt.pot || c.budget, 1), elastic ? 0.05 : 0.03, 1);
      rt.cap = c.budget * 2;
      // Monatsgrenze: max. 30,4 × Tagesbudget
      const mStart = day - (date.getUTCDate() - 1);
      const monthSpend = E.sumRange(S, 'camp', c.id, mStart, day - 1)[I.cost];
      rt.cap = Math.max(0, Math.min(rt.cap, c.budget * 30.4 - monthSpend));
      rt.spend = 0;
      rt.ass = M.assetFactors(S, c.id);
      rt.negs = M.campaignNegatives(S, c.id);
      rt.locAdj = {}; for (const l of c.locations) rt.locAdj[l.id] = l.adj;
      for (const id of c.excludedLocs) delete rt.locAdj[id];
      rt.aud = c.audiences.map((a) => ({ ...a, def: ctx.audById[a.id] })).filter((a) => a.def);
      rt.exp = expMap[c.id] || null;
      rt.stamp = -1; rt.thr = false;
      ctx.camps.push(c);
    }

    // Keyword-Laufzeitdaten
    for (const kw of S.keywords) {
      kw.rt = kw.rt || {};
      kw.rt.d = { clk: 0, clkExp: 0, w: 0 };
      if (kw.status !== 'enabled') continue;
      const ag = M.ag(S, kw.adGroupId);
      if (!ag || ag.status !== 'enabled') continue;
      kw.rt.qs = M.qualityScore(S, kw);
      kw.rt.qf = M.qf(kw.rt.qs.cont);
    }

    // Suchkandidaten je Suchanfrage
    const searchCamps = ctx.camps.filter((c) => c.type === 'search');
    const pmaxCamps = ctx.camps.filter((c) => c.type === 'pmax');
    const shopCamps = ctx.camps.filter((c) => c.type === 'shopping');
    const brandQ = (q) => q.brand === 'player';
    let covVol = 0, totVol = 0;
    const agKws = new Map();
    for (const c of searchCamps) for (const ag of c.rt.ags) agKws.set(ag.id, M.kwsOf(S, ag.id).filter((k) => k.status === 'enabled' && k.rt.qs));
    for (const q of S.queries) {
      if (q.brand !== 'player') totVol += q.vol;
      const list = [];
      for (const c of searchCamps) {
        if (c.rt.negs.some((n) => M.negBlocks(n, q))) continue;
        for (const ag of c.rt.ags) {
          for (const kw of agKws.get(ag.id)) {
            const rel = M.matchRel(kw, q);
            if (rel > 0) list.push({ c, ag, kw, rel, ident: kw.match === 'exact' || (rel === 1 && kw.match !== 'broad') });
          }
        }
      }
      for (const c of pmaxCamps) {
        if (c.rt.negs.some((n) => M.negBlocks(n, q))) continue;
        if (q.brand === 'player' && c.pmax.brandExclusion) continue;
        if (q.brand && q.brand !== 'player') continue;
        let best = null;
        for (const ag of c.rt.ags) {
          const inTheme = (ag.themes || []).includes(q.theme);
          if (!inTheme && !c.pmax.urlExpansion) continue;
          const rel = inTheme ? 0.75 : brandQ(q) ? 0.78 : 0.55;
          if (!best || rel > best.rel) best = { c, ag, kw: null, rel, ident: false, pmax: true };
        }
        if (best) list.push(best);
      }
      if (list.length) { ctx.cands[q.id] = list; if (q.brand !== 'player') covVol += q.vol; }
      // Shopping
      if (ind.hasShopping && q.intent >= 0.8 && !q.brand && q.theme[0] !== '_') {
        const prods = S.products.filter((p) => p.theme === q.theme && p.status === 'enabled');
        if (prods.length) {
          const sl = [];
          for (const c of shopCamps.concat(pmaxCamps)) {
            if (c.rt.negs.some((n) => M.negBlocks(n, q))) continue;
            const ag = c.type === 'shopping' ? c.rt.ags.find((a) => !a.productThemes || a.productThemes.includes(q.theme)) : c.rt.ags[0];
            if (ag) sl.push({ c, ag, prods });
          }
          if (sl.length) { ctx.shopCands[q.id] = sl; if (!ctx.cands[q.id]) covVol += q.vol * 0.5; }
        }
      }
    }
    ctx.coverage = U.clamp(covVol / Math.max(totVol, 1), 0.02, 1);

    // Inventar-Kampagnen
    for (const c of ctx.camps) {
      if (['display', 'video', 'demandgen', 'app', 'pmax'].includes(c.type) || (c.type === 'search' && c.networks.display)) ctx.inv.push(c);
    }

    // Wettbewerber
    const qMonthSeason = ind.season[ctx.month];
    for (const comp of S.competitors) {
      comp.today = false;
      comp.d = { spend: 0, clicks: 0, conv: 0, value: 0, imps: 0, elig: 0, lostB: 0, both: 0, pAbove: 0 };
      if (!comp.active || (comp.pausedUntil !== null && comp.pausedUntil >= day)) continue;
      comp.today = true;
      comp.geoSet = comp.geoSet && comp.geoSet.size === comp.geo.length ? comp.geoSet : new Set(comp.geo);
      const bEff = comp.budget * fx.compBudget * Math.pow(qMonthSeason, 0.6) * ctx.coverage;
      comp.bEff = bEff;
      comp.p = U.clamp(bEff / Math.max(comp.pot * ctx.coverage, 1), 0.05, 1);
      comp.cap = bEff * 1.6;
      comp.aggrToday = comp.aggr * fx.compAggr * (fx.compAggrById[comp.id] || 1) * (fx.cpc || 1);
      ctx.comps.push(comp);
    }
    for (const q of S.queries) {
      if (!ctx.cands[q.id] && !ctx.shopCands[q.id] && q.brand !== 'player') continue;
      ctx.compsByQ[q.id] = ctx.comps.filter((c) => (q.brand ? q.brand === c.id || q.brand === 'player' && c.style === 'aggressive' || (q.brand !== 'player' && c.style === 'aggressive') : c.themes.includes(q.theme)));
    }
    // Assist-Kampagnen (für datengetriebene Attribution)
    const upper = S.campaigns.filter((c) => ['display', 'video', 'demandgen'].includes(c.type) && c.rt.active);
    for (const c of upper) {
      const imps = E.sumRange(S, 'camp', c.id, day - 7, day - 1)[I.imp];
      if (imps > 0) ctx.assist.push({ c, w: imps });
    }
    const totAssist = U.sum(ctx.assist, (a) => a.w);
    ctx.assistP = S.account.attribution === 'dda' ? U.clamp(totAssist / 400000, 0, 0.3) : 0;
    return ctx;
  }

  // ---------- Hilfsfunktionen Auktion ----------
  function schedAdj(c, dow, h) {
    if (!c.schedule) return 0;
    const v = c.schedule[dow][h];
    return v === null ? null : v;
  }
  function audMember(ctx, rng, memo, a, q) {
    if (memo[a.id] !== undefined) return memo[a.id];
    let sh = a.share || 0;
    if (a.themes && q) sh = a.themes.includes(q.theme) ? Math.min(0.6, sh * 2.5) : sh * 0.4;
    const r = rng() < sh;
    memo[a.id] = r;
    return r;
  }
  function drawLoc(rng, cum) { const x = rng() * cum.tot; for (const [id, c] of cum.arr) if (x <= c) return id; return cum.arr[cum.arr.length - 1][0]; }
  function drawIdx(rng, arr) { let x = rng(); for (let i = 0; i < arr.length; i++) { x -= arr[i]; if (x <= 0) return i; } return arr.length - 1; }

  const LOC_CUM = (() => { let t = 0; const arr = D.LOCATIONS.map((l) => { t += l.w; return [l.id, t]; }); return { arr, tot: t }; })();
  const POS_TOP = [1, 0.58, 0.4, 0.3], POS_BOT = [0.13, 0.1, 0.08];
  const GENDER_IDS = ['m', 'f', 'u'], GENDER_SHARE = [0.47, 0.45, 0.08];

  function drawLag(rng, lag) { return drawIdx(rng, lag); }

  // Conversions für Klicks erzeugen und verbuchen
  function convert(S, rng, ctx, buf, keys, clicks, cvr, opts) {
    if (clicks <= 0) return;
    const ind = ctx.ind, fx = ctx.fx;
    if (ctx.bank) return convertBank(S, rng, ctx, buf, keys, clicks, cvr, opts);
    for (const ca of S.convActions) {
      if (ca.status !== 'enabled') continue;
      let rate = cvr * ca.rate;
      if (ca.category === 'Anruf') { rate *= opts.ass && opts.ass.call ? (opts.device === 'mobile' ? 1.25 : 0.5) : 0.35; }
      if (ca.category === 'Lead-Formular' && opts.ass && opts.ass.lead && opts.device === 'mobile') rate *= 1.12;
      if (ca.category === 'App-Installation' && opts.app) rate *= 3;
      const n = rng.binomial(clicks, U.clamp(rate, 0, 0.95));
      for (let i = 0; i < n; i++) {
        const value = ca.value === 'dynamic' ? ctx.aov * rng.logn(ind.aovSigma) : +ca.value || 0;
        const recorded = rng() < ctx.consent;
        const real = ca.primary;
        let lag = drawLag(rng, ind.lag) + S.account.reportingDelay;
        const assist = recorded && ca.primary && ctx.assistP > 0 && opts.network !== 'display' && rng() < ctx.assistP ? rng.weighted(ctx.assist, (a) => a.w).c : null;
        const entry = { due: S.day + lag, day: S.day, keys, prim: ca.primary ? 1 : 0, value, recorded, real, rv: real ? value * fx.capacity * (1 - (ind.returns || 0)) : 0, assist: assist ? ['camp|' + assist.id] : null };
        if (ca.category === 'Anruf') bufVec(buf, keys[1])[I.calls] += 1;
        if (lag === 0) applyConv(S, buf, entry, true); else S.pending.push(entry);
        if (ca.primary && opts.campRt) opts.campRt.d.conv += recorded ? 1 : 0;
      }
      if (!ca.primary && ca.category === 'In den Einkaufswagen') ctx.carts += n;
    }
  }
  // Bank: Antragsstrecke mit Privatkunden-Streuverlusten, KYC und Kontoeröffnung (Offline-Import)
  function convertBank(S, rng, ctx, buf, keys, clicks, cvr, opts) {
    const ind = ctx.ind, fx = ctx.fx, B = G.BANK;
    const q = opts.q;
    const biz = q ? (q.biz ?? 1) : ind.dispBiz;
    const mix = B.appMix(biz, opts.b2b), bizEff = mix.bizEff;
    const prod = q ? B.prodOf(q.theme) : null;
    for (const ca of S.convActions) {
      const enabled = ca.status === 'enabled';
      if (!enabled && !ca.qualified) continue;
      const rate = cvr * ca.rate * (ca.qualified ? bizEff * (ca.qRate || 1) * (fx.kyc || 1) : mix.factor);
      const n = rng.binomial(clicks, U.clamp(rate, 0, 0.95));
      if (!n) continue;
      if (ca.appSubmit) B.onApplications(S, n, rng.binomial(n, mix.privShare));
      for (let i = 0; i < n; i++) {
        const recorded = enabled && rng() < ctx.consent;
        const opening = ca.opening ? B.drawOpening(S, rng, prod, q) : null;
        if (!recorded && !opening) continue;
        const value = opening ? opening.value : ca.value === 'dynamic' ? ctx.aov : +ca.value || 0;
        let lag = drawLag(rng, ind.lag) + S.account.reportingDelay;
        if (ca.lagExtra) lag += rng.int(ca.lagExtra[0], ca.lagExtra[1]) + (ca.opening ? fx.kycLag || 0 : 0);
        const entry = { due: S.day + lag, day: S.day, keys, prim: ca.primary ? 1 : 0, value, recorded, real: !!opening, rv: opening ? opening.value : 0, assist: null, bank: opening };
        if (lag === 0) applyConv(S, buf, entry, true); else S.pending.push(entry);
        if (ca.primary && recorded && opts.campRt) opts.campRt.d.conv += 1;
      }
    }
  }
  function applyConv(S, buf, e, today) {
    if (e.bank && e.real && G.BANK) G.BANK.onOpen(S, e.bank);
    const f = e.assist ? 0.75 : 1;
    const add = today ? (keys, idx, v, ff) => addKeys(buf, keys, idx, v, ff) : (keys, idx, v, ff) => creditPast(S, keys, e.day, idx, v, ff);
    if (e.recorded) {
      add(e.keys, I.aconv, 1, 1);
      if (e.prim) {
        add(e.keys.slice(0, 1), I.conv, 1, 1); add(e.keys.slice(0, 1), I.val, e.value, 1); // Kontoebene ungeteilt
        add(e.keys.slice(1), I.conv, 1, f); add(e.keys.slice(1), I.val, e.value, f);
        if (e.assist) { add(e.assist, I.conv, 1, 0.25); add(e.assist, I.val, e.value, 0.25); }
      }
    }
    if (e.real) { add(e.keys, I.rconv, 1, 1); add(e.keys, I.rval, e.rv, 1); }
  }

  // ---------- Suche: eine Teilauktion ----------
  function subAuction(S, rng, ctx, buf, q, h, w, auctionId) {
    const ind = ctx.ind, fx = ctx.fx, cands = ctx.cands[q.id], shop = ctx.shopCands[q.id];
    const loc = drawLoc(rng, LOC_CUM);
    const locDef = D.LOC_BY_ID[loc];
    const devIdx = drawIdx(rng, [ind.devices.mobile.share, ind.devices.desktop.share, ind.devices.tablet.share]);
    const device = ['mobile', 'desktop', 'tablet'][devIdx];
    const devDef = ind.devices[device];
    const age = drawIdx(rng, D.AGE_SHARE);
    const gi = drawIdx(rng, GENDER_SHARE), gender = GENDER_IDS[gi];
    const armRoll = rng();
    const memo = {};
    // intrinsische Kaufabsicht des Nutzers
    let userLift = 1, userCtr = 1;
    for (const a of ctx.intrinsic) if (audMember(ctx, rng, memo, a, q)) { userLift *= a.cvr; userCtr *= a.ctr; }
    userLift = Math.min(userLift, 3);
    const compLift = Math.pow(userLift, 0.65); // Mitbewerber mit Smart Bidding bieten auf wertvolle Nutzer ebenfalls höher
    const hourCvr = D.HOUR_CVR[ind.hours][h];
    const baseCvrCtx = ind.baseCvr * locDef.cvr * devDef.cvr * ind.age[age] * ind.gender[gender] * hourCvr * userLift * S.market.cvrIdx * fx.cvr * (fx.themeCvr[q.theme] || 1) * ctx.priceCvr * fx.playerCvr * (fx.playerDown ? 0 : 1) * (ctx.prodCvr[q.theme] || 1);
    const brandCvr = q.brand === 'player' ? (ind.bank ? 1 : 2.6) : q.brand ? 0.22 : 1;

    const eligCamps = [];
    function campEligible(c) {
      const rt = c.rt;
      if (!rt.active) return false;
      if (rt.stamp === auctionId) return rt.ok;
      rt.stamp = auctionId; rt.ok = false; rt.thr = false;
      const sa = schedAdj(c, ctx.dow, h);
      if (sa === null) return false;
      if (!(loc in rt.locAdj) && !(c.locOption === 'interest' && !c.excludedLocs.includes(loc) && rng() < 0.08)) return false;
      if (c.devices[device] <= -100) return false;
      if (c.demo.age[age] <= -100 || c.demo.gender[gender] <= -100) return false;
      if (rt.exp) { const inTrial = armRoll < rt.exp.x.split; if ((rt.exp.role === 'trial') !== inTrial) return false; }
      rt.d.elig += w; eligCamps.push(c);
      if (rt.spend >= rt.cap || rng() > rt.p) { rt.thr = true; rt.d.lostB += w; return false; }
      rt.ok = true; rt.sa = sa;
      return true;
    }
    function bidAdjMult(c, sa) {
      let m = (1 + c.devices[device] / 100) * (1 + (c.rt.locAdj[loc] || 0) / 100) * (1 + (sa || 0) / 100) * (1 + c.demo.age[age] / 100) * (1 + c.demo.gender[gender] / 100);
      for (const a of c.rt.aud) if (a.adj && audMember(ctx, rng, memo, a.def, q)) m *= 1 + a.adj / 100;
      return m;
    }
    function candCvr(cand) {
      const lp = 0.6 + 0.8 * (cand.ag.rt ? cand.ag.rt.lp : 0.5);
      let cvr = baseCvrCtx * q.intent * Math.pow(cand.rel, 0.7) * lp * brandCvr;
      return U.clamp(cvr, 0, 0.7);
    }
    function smartBid(c, pc, value) {
      const b = c.bidStrategy, rt = c.rt;
      switch (b.type) {
        case 'tcpa': return pc * b.targetCpa;
        case 'maxconv': return pc * (b.targetCpa || rt.lambda);
        case 'troas': return (pc * value) / b.targetRoas;
        case 'maxvalue': return pc * value * (b.targetRoas ? 1 / b.targetRoas : rt.lambdaV);
        default: return pc * rt.lambda;
      }
    }
    function candBid(cand, cvr) {
      const c = cand.c, b = c.bidStrategy, rt = c.rt;
      let bid;
      if (rt.smart) {
        const pc = cvr * rt.bias * rng.logn(rt.sigma) * ctx.primRate(q.biz ?? 1, cand.ag.rt.b2b);
        bid = smartBid(c, pc, rt.estValue);
      } else if (b.type === 'maxclicks' || b.type === 'tis') {
        bid = rt.lambda;
      } else {
        bid = ((cand.kw && cand.kw.maxCpc) || cand.ag.defaultBid) * bidAdjMult(c, rt.sa);
      }
      if (b.maxCpc) bid = Math.min(bid, b.maxCpc);
      return U.clamp(bid, 0.01, 250);
    }

    // --- Spieler-Kandidat (ein Eintrag pro Konto) ---
    let best = null;
    if (cands) {
      let identBest = null;
      for (const cand of cands) {
        if (!campEligible(cand.c)) continue;
        const cvr = candCvr(cand);
        const bid = candBid(cand, cvr);
        const qf = cand.kw ? cand.kw.rt.qf : M.qf(3 + (cand.ag.rt.str / 100) * 5 * (0.5 + cand.ag.rt.lp * 0.6));
        const rank = bid * qf * cand.c.rt.ass.rank * Math.pow(cand.rel, 0.3) * rng.logn(0.16);
        const e = { cand, bid, qf, rank, cvr, player: true };
        if (cand.ident && !cand.pmax && (!identBest || rank > identBest.rank)) identBest = e;
        if (!best || rank > best.rank) best = e;
      }
      if (identBest) best = identBest; // identisches Keyword hat Vorrang (auch vor PMax)
    }

    // --- Wettbewerber ---
    const comps = ctx.compsByQ[q.id] || [];
    const cpcBase = q.cpc * S.market.cpcIdx * locDef.cpc;
    const entries = best ? [best] : [];
    const compIn = [];
    for (const comp of comps) {
      if (!comp.today || !comp.geoSet.has(loc)) continue;
      if (comp.hoursB2B && (h < 7 || h > 19 || ctx.dow >= 5) && rng() < 0.8) continue;
      comp.d.elig += w;
      if (comp.d.spend >= comp.cap || rng() > comp.p) { comp.d.lostB += w; continue; }
      let bid = cpcBase * comp.aggrToday * (comp.themeAggr[q.theme] || 1) * (fx.compAggrTheme[q.theme] || 1) * rng.logn(0.22) * (comp.smart ? compLift : 1);
      let qs = U.clamp(comp.qs + rng.normal() * 0.8, 1, 10);
      if (q.brand === comp.id) { bid *= 0.7; qs = 10; }
      else if (q.brand) { bid *= 0.6; qs = Math.min(qs, 4); }
      const qf = M.qf(qs);
      const e = { comp, bid, qf, rank: bid * qf * 1.06 * rng.logn(0.14) };
      entries.push(e); compIn.push(e);
    }
    // Long-Tail-Werbetreibende (nicht einzeln modelliert): sorgen für realistische Auktionsdichte
    const nBg = q.brand === 'player' ? rng.poisson(0.4) : rng.poisson(ind.bgDensity || 3);
    for (let i = 0; i < nBg; i++) {
      const bid = cpcBase * 0.8 * rng.logn(0.5) * fx.compAggr * Math.pow(userLift, 0.4);
      const e = { bg: true, bid, qf: M.qf(3 + rng() * 5), rank: 0 };
      e.rank = e.bid * e.qf * rng.logn(0.15);
      entries.push(e); compIn.push(e);
    }
    entries.sort((a, b) => b.rank - a.rank);
    const reserve = cpcBase * 0.14, topThr = cpcBase * 0.42;
    let nTop = 0, nBot = 0;
    const shown = [];
    for (const e of entries) {
      if (e.rank < reserve) break;
      if (nTop < 4 && e.rank >= topThr) { e.top = true; e.slot = nTop++; shown.push(e); }
      else if (nBot < 3) { e.top = false; e.slot = nBot++; shown.push(e); }
    }
    for (let i = 0; i < shown.length; i++) {
      const e = shown[i], next = shown[i + 1];
      e.pos = i;
      e.cpc = Math.min(e.bid, e.bid * ((next ? next.rank : reserve) / e.rank) + 0.01);
    }
    // Markt-CPC-Statistik
    const intentCtr = Math.pow(q.intent, 0.35) * (q.intent < 0.5 ? S.market.ctrInfo : 1);
    for (const e of compIn) {
      if (e.pos === undefined) continue;
      if (e.bg) { const clk = w * ind.baseCtr * (e.top ? POS_TOP[e.slot] : POS_BOT[e.slot]) * intentCtr; ctx.mktClicks += clk; ctx.mktCost += clk * e.cpc; continue; }
      const pf = e.top ? POS_TOP[e.slot] : POS_BOT[e.slot];
      const clk = w * ind.baseCtr * pf * intentCtr * (q.brand === e.comp.id ? 4.5 : 1) * 1.1;
      e.comp.d.imps += w; e.comp.d.clicks += clk; e.comp.d.spend += clk * e.cpc;
      const cv = clk * ind.baseCvr * q.intent * e.comp.lp * S.market.cvrIdx * fx.cvr * (q.brand === e.comp.id ? 2.6 : 1);
      e.comp.d.conv += cv; e.comp.d.value += cv * ind.aov * fx.aov;
      ctx.mktClicks += clk; ctx.mktCost += clk * e.cpc;
    }

    // --- Auswertung Spieler ---
    if (eligCamps.length) {
      const winC = best ? best.cand.c : eligCamps[0];
      for (const c of eligCamps) if (c !== winC && !c.rt.thr) c.rt.d.lostR += w;
      const you = best && best.pos !== undefined;
      // Auktionsdaten
      const aiKeys = ['ai|all~', 'ai|' + winC.id + '~'];
      for (const pre of aiKeys) {
        const yv = bufVec(buf, pre + '_you');
        yv[0] += w; if (you) { yv[1] += w; if (best.top) yv[4] += w; if (best.pos === 0 && best.top) yv[5] += w; }
        for (const comp of comps) {
          if (!comp.active) continue;
          const ce = compIn.find((x) => x.comp === comp);
          const cs = ce && ce.pos !== undefined;
          const v = bufVec(buf, pre + comp.id);
          v[0] += w;
          if (cs) { v[1] += w; if (ce.top) v[4] += w; if (ce.top && ce.pos === 0) v[5] += w; }
          if (cs && you) { v[2] += w; if (ce.pos < best.pos) v[3] += w; else if (pre === 'ai|all~') { comp.d.pAbove += w; } if (pre === 'ai|all~') comp.d.both += w; }
          if (you && (!cs || best.pos < ce.pos)) v[6] += w;
        }
      }
      if (best && !you) best.cand.c.rt.d.lostR += w;
      if (best && !best.cand.c.rt.thr && best.pos === undefined) { /* bereits als Rang-Verlust gezählt */ }
      if (you) recordSearchWin(S, rng, ctx, buf, q, h, w, best, { loc, device, devDef, age, gender, memo, intentCtr, userCtr });
    }

    // --- Organische Treffer bei Markensuchen (Inkrementalität von Brand-Kampagnen) ---
    if (q.brand === 'player') {
      const you = best && best.pos !== undefined && best.top;
      const compsTop = compIn.filter((e) => e.comp && e.top).length;
      const orgCtr = 0.5 * (you ? 0.35 : 1) * Math.max(0.3, 1 - 0.16 * compsTop);
      const oclk = rng.poisson(w * orgCtr);
      if (oclk) organicConv(S, rng, ctx, buf, q, oclk, baseCvrCtx * q.intent * brandCvr * 0.4);
    }

    // --- Shopping-Auktion (separat, gleiche Suchanfrage) ---
    if (shop) shoppingAuction(S, rng, ctx, buf, q, h, w, { loc, locDef, device, devDef, age, gender, memo, baseCvrCtx, campEligible, auctionId, comps, cpcBase });
  }

  function organicConv(S, rng, ctx, buf, q, clicks, cvr) {
    const ind = ctx.ind, fx = ctx.fx;
    const v = bufVec(buf, 'org|all');
    v[I.clk] += clicks;
    ctx.visitors += clicks;
    if (ctx.bank) {
      const B = G.BANK, mix = B.appMix(q.biz ?? 1, false);
      const n = rng.binomial(clicks, U.clamp(cvr * 0.58 * mix.bizEff * (fx.kyc || 1), 0, 0.9));
      for (let i = 0; i < n; i++) { const o = B.drawOpening(S, rng, null, q); B.onOpen(S, o); v[I.rconv] += 1; v[I.rval] += o.value; }
      return;
    }
    const n = rng.binomial(clicks, U.clamp(cvr, 0, 0.9));
    for (let i = 0; i < n; i++) {
      const val = ctx.aov * rng.logn(ind.aovSigma) * fx.capacity * (1 - (ind.returns || 0));
      v[I.rconv] += 1; v[I.rval] += val; ctx.revenue += val; ctx.realConv += 1; ctx.buyers += 1;
    }
  }

  function recordSearchWin(S, rng, ctx, buf, q, h, w, best, u) {
    const ind = ctx.ind, fx = ctx.fx, cand = best.cand, c = cand.c, rt = c.rt;
    const pf = best.top ? POS_TOP[best.slot] : POS_BOT[best.slot];
    const brandCtr = q.brand === 'player' ? 4.5 : q.brand ? 0.35 : 1;
    const baseline = ind.baseCtr * pf * u.intentCtr * brandCtr;
    const str = cand.ag.rt.str;
    const assCtr = best.top ? rt.ass.ctr : 1 + (rt.ass.ctr - 1) * 0.25;
    const aware = 1 + S.company.awareness * 0.6;
    let audCtr = 1;
    for (const a of rt.aud) if (audMember(ctx, rng, u.memo, a.def, q)) audCtr *= a.def.ctr;
    let bankCtr = 1;
    if (ctx.bank) {
      bankCtr = G.BANK.ctrQual(q.biz ?? 1, cand.ag.rt.b2b);
      if (cand.ag.rt.rate && (q.theme === 'tagesgeld' || q.theme === 'festgeld')) bankCtr *= U.clamp(1.08 + 0.25 * (q.theme === 'tagesgeld' ? ctx.prodCvr._tgSpread : ctx.prodCvr._fgSpread), 0.75, 1.4);
    }
    const ad = cand.ag.rt.ads.length ? rng.pick(cand.ag.rt.ads) : null;
    const fatigue = ad ? E.fatigue(ad) : 1;
    const ctr = U.clamp(baseline * Math.pow(cand.rel, 0.5) * M.strengthCtr(str) * assCtr * u.devDef.ctr * fx.ctr * aware * Math.min(u.userCtr, 1.6) * (cand.pmax ? 0.95 : 1) * bankCtr * fatigue, 0, 0.6);
    if (ad) ad.fat = (ad.fat || 0) + w;
    rt.d.impw += w; if (best.top) rt.d.top += w; if (best.top && best.pos === 0) rt.d.abs += w;
    const imps = rng.sround(w);
    const raw = rng.poisson(w * ctr);
    const inv = rng.binomial(raw, ctx.fx.invalidRate);
    let clicks = raw - inv;
    let cpc = best.cpc * rng.logn(0.05);
    if (rt.spend + clicks * cpc > rt.cap) clicks = Math.max(0, Math.floor((rt.cap - rt.spend) / cpc));
    const cost = clicks * cpc;
    rt.spend += cost; rt.d.spend += cost; rt.d.clk += clicks;
    ctx.mktClicks += clicks; ctx.mktCost += cost; ctx.playerClicks += clicks;
    // Keyword-CTR-Historie für Qualitätsfaktor
    if (cand.kw) { cand.kw.rt.d.clkExp += w * baseline; cand.kw.rt.d.clk += w * ctr; cand.kw.rt.d.w += w; }
    const net = 'search';
    const keys = ['acct|all', 'camp|' + c.id, 'ag|' + cand.ag.id, 'st|' + c.id + '~' + q.id, 'dev|' + c.id + '~' + u.device, 'loc|' + c.id + '~' + u.loc, 'hour|' + c.id + '~' + h, 'age|' + c.id + '~' + u.age, 'gen|' + c.id + '~' + u.gender, 'net|' + c.id + '~' + net];
    if (cand.kw) keys.push('kw|' + cand.kw.id);
    if (ad) keys.push('ad|' + ad.id);
    for (const a of rt.aud) if (audMember(ctx, rng, u.memo, a.def, q)) keys.push('aud|' + c.id + '~' + a.id);
    if (rt.exp) keys.push('exp|' + rt.exp.x.id + '~' + rt.exp.role);
    for (const k of keys) {
      const v = bufVec(buf, k);
      v[I.imp] += imps; v[I.clk] += clicks; v[I.cost] += cost; v[I.impw] += w; v[I.inv] += inv;
      if (best.top) v[I.top] += w; if (best.top && best.pos === 0) v[I.abs] += w;
    }
    ctx.visitors += clicks;
    convert(S, rng, ctx, buf, keys, clicks, best.cvr, { ass: rt.ass, device: u.device, campRt: rt, network: 'search', q, b2b: cand.ag.rt.b2b });
    // Suchnetzwerk-Partner
    if (c.networks.partners && c.type === 'search') {
      const pw = w * 0.18;
      const pimps = rng.sround(pw);
      const pclk = rng.poisson(pw * ctr * 0.55);
      const pcost = pclk * cpc * 0.65;
      if (rt.spend + pcost <= rt.cap) {
        rt.spend += pcost; rt.d.spend += pcost;
        const pk = keys.filter((k) => !k.startsWith('net|')).concat(['net|' + c.id + '~partners']);
        for (const k of pk) { const v = bufVec(buf, k); v[I.imp] += pimps; v[I.clk] += pclk; v[I.cost] += pcost; }
        ctx.visitors += pclk;
        convert(S, rng, ctx, buf, pk, pclk, best.cvr * 0.7, { ass: rt.ass, device: u.device, campRt: rt, network: 'partners', q, b2b: cand.ag.rt.b2b });
      }
    }
  }

  function shoppingAuction(S, rng, ctx, buf, q, h, w, u) {
    const ind = ctx.ind, fx = ctx.fx;
    const stockOut = fx.stockOut[q.theme] || 0;
    let best = null;
    for (const sc of ctx.shopCands[q.id]) {
      if (!u.campEligible(sc.c)) continue;
      const avail = sc.prods.filter((p) => p.stock && rng() >= stockOut);
      if (!avail.length) continue;
      // bestes Produkt nach Qualität × Preiswettbewerb
      let bp = null, bq = 0;
      for (const p of avail) {
        const pc = p.marketPrice / p.price;
        const qual = M.productQuality(S, p) * Math.pow(U.clamp(pc, 0.5, 1.5), 1.5);
        if (qual > bq) { bq = qual; bp = p; }
      }
      const pc = U.clamp(bp.marketPrice / bp.price, 0.5, 1.6);
      const cvr = U.clamp(u.baseCvrCtx * q.intent * 0.85 * (0.6 + 0.8 * sc.ag.rt.lp) * Math.pow(pc, 2) * 1.05, 0, 0.7);
      const c = sc.c, rt = c.rt;
      let bid;
      if (rt.smart) {
        const pcv = cvr * rt.bias * rng.logn(rt.sigma);
        const b = c.bidStrategy;
        bid = b.type === 'troas' ? (pcv * bp.price) / b.targetRoas : b.type === 'maxvalue' ? pcv * bp.price * (b.targetRoas ? 1 / b.targetRoas : rt.lambdaV) : b.type === 'tcpa' ? pcv * b.targetCpa : pcv * (b.targetCpa || rt.lambda);
      } else if (c.bidStrategy.type === 'maxclicks') bid = rt.lambda * 0.6;
      else bid = sc.ag.defaultBid * (1 + c.devices[u.device] / 100) * (1 + (rt.locAdj[u.loc] || 0) / 100);
      if (c.bidStrategy.maxCpc) bid = Math.min(bid, c.bidStrategy.maxCpc);
      bid = U.clamp(bid, 0.01, 100);
      const rank = bid * (0.5 + 0.5 * bq) * rng.logn(0.2);
      if (!best || rank > best.rank) best = { sc, p: bp, bid, rank, cvr, pc, player: true };
    }
    if (!best) return;
    const entries = [best];
    for (const comp of u.comps) {
      if (!comp.today || !comp.shopping || !comp.geoSet.has(u.loc) || !comp.themes.includes(q.theme)) continue;
      if (comp.d.spend >= comp.cap || rng() > comp.p) continue;
      const bid = u.cpcBase * 0.55 * comp.aggrToday * (fx.compAggrTheme[q.theme] || 1) * rng.logn(0.25);
      entries.push({ comp, bid, rank: bid * (0.5 + 0.5 * U.clamp(comp.lp * 0.8, 0.3, 1)) * rng.logn(0.2) });
    }
    entries.sort((a, b) => b.rank - a.rank);
    const reserve = u.cpcBase * 0.035;
    const shown = entries.filter((e) => e.rank >= reserve).slice(0, 5);
    const idx = shown.indexOf(best);
    const c = best.sc.c, rt = c.rt;
    rt.d.elig += 0; // Eligibility bereits in Suchauktion gezählt
    if (idx < 0) { rt.d.lostR += w * 0.5; return; }
    const next = shown[idx + 1];
    const cpc = Math.min(best.bid, best.bid * ((next ? next.rank : reserve) / best.rank) + 0.01) * rng.logn(0.05);
    const pos = [1, 0.75, 0.6, 0.5, 0.42][idx];
    const ctr = U.clamp(0.013 * pos * Math.pow(q.intent, 0.4) * Math.pow(best.pc, 1.2) * (0.7 + 0.5 * best.p.imgQ) * u.devDef.ctr * fx.ctr * (1 + S.company.awareness * 0.4), 0, 0.3);
    for (const e of shown) if (e.comp) {
      const ep = [1, 0.75, 0.6, 0.5, 0.42][shown.indexOf(e)];
      const ec = w * 0.013 * ep * Math.pow(q.intent, 0.4);
      const ecpc = Math.min(e.bid, e.bid * 0.8);
      e.comp.d.clicks += ec; e.comp.d.spend += ec * ecpc; e.comp.d.conv += ec * ind.baseCvr * q.intent; e.comp.d.value += ec * ind.baseCvr * q.intent * ind.aov;
    }
    const imps = rng.sround(w);
    const raw = rng.poisson(w * ctr);
    const inv = rng.binomial(raw, fx.invalidRate);
    let clicks = raw - inv;
    if (rt.spend + clicks * cpc > rt.cap) clicks = Math.max(0, Math.floor((rt.cap - rt.spend) / cpc));
    const cost = clicks * cpc;
    rt.spend += cost; rt.d.spend += cost; rt.d.clk += clicks; rt.d.impw += w * (c.type === 'shopping' ? 1 : 0);
    ctx.playerClicks += clicks;
    const keys = ['acct|all', 'camp|' + c.id, 'ag|' + best.sc.ag.id, 'prod|' + best.p.id, 'st|' + c.id + '~' + q.id, 'dev|' + c.id + '~' + u.device, 'loc|' + c.id + '~' + u.loc, 'hour|' + c.id + '~' + h, 'age|' + c.id + '~' + u.age, 'gen|' + c.id + '~' + u.gender, 'net|' + c.id + '~shopping'];
    if (rt.exp) keys.push('exp|' + rt.exp.x.id + '~' + rt.exp.role);
    for (const k of keys) {
      const v = bufVec(buf, k);
      v[I.imp] += imps; v[I.clk] += clicks; v[I.cost] += cost; v[I.inv] += inv;
      if (c.type === 'shopping') { v[I.impw] += w; v[I.elig] += 0; }
    }
    ctx.visitors += clicks;
    // Shopping-Werte orientieren sich am Produktpreis
    const savedAov = ctx.aov;
    ctx.aov = best.p.price * (1 + 0.25);
    convert(S, rng, ctx, buf, keys, clicks, best.cvr, { ass: rt.ass, device: u.device, campRt: rt, network: 'shopping' });
    ctx.aov = savedAov;
  }

  // ---------- Inventar: Display, YouTube, Demand Gen, App, PMax ----------
  function inventoryHour(S, rng, ctx, buf, c, h) {
    const ind = ctx.ind, fx = ctx.fx, rt = c.rt;
    if (!rt.active) return;
    if (rt.spend >= rt.cap) return;
    const sa = schedAdj(c, ctx.dow, h);
    if (sa === null) return;
    if (!rt.invPrep) {
      // einmal pro Tag vorbereiten
      const locShare = U.sum(Object.keys(rt.locAdj), (id) => D.LOC_BY_ID[id].w) / LOC_CUM.tot;
      let reach = 0, lift = 0, ctrL = 0;
      const targeted = c.audMode === 'targeting' ? rt.aud : [];
      for (const a of targeted) { reach += a.def.share || 0.002; lift += (a.def.share || 0.002) * a.def.cvr; ctrL += (a.def.share || 0.002) * a.def.ctr; }
      const learn = 0.75 + 0.55 * (1 - Math.exp(-(rt.conv30 || 0) / 40));
      if (c.display.optimizedTargeting || !targeted.length) {
        const extra = targeted.length ? 0.45 : 0.75;
        reach += extra; lift += extra * learn * (c.type === 'pmax' ? 1.1 : 0.95); ctrL += extra;
      }
      reach = Math.min(reach, 1.2);
      const ageEx = U.sum(c.demo.age.map((a, i) => (a <= -100 ? D.AGE_SHARE[i] : 0)));
      const typeF = { display: 1, video: 0.8, demandgen: 0.5, app: 0.6, pmax: 0.6, search: 0.25 }[c.type];
      const season = Math.pow(ind.season[ctx.month], 0.6);
      rt.invPrep = {
        avail: ind.displayInventory * locShare * reach * (1 - ageEx) * typeF * ind.dow[ctx.dow] * season * S.market.demand,
        lift: reach ? lift / reach : 1, ctrL: reach ? ctrL / reach : 1,
        cpm: ind.displayCpm * Math.pow(S.market.cpcIdx, 0.7) * Math.pow(fx.cpc, 0.5) * Math.pow(ind.season[ctx.month], 0.8) * (c.type === 'video' ? 1.9 : c.type === 'demandgen' ? 1.6 : c.type === 'pmax' ? 1.4 : 1.15),
        str: Math.max(...rt.ags.map((ag) => ag.rt.str)) / 100,
        lp: U.avg(rt.ags, (ag) => ag.rt.lp),
        fat: U.avg(rt.ags.flatMap((ag) => ag.rt.ads), (a) => E.fatigue(a)) || 1,
        apps: c.display.excludeApps ? 0 : 0.35,
      };
    }
    const P = rt.invPrep;
    const nets = c.type === 'pmax' ? [['display', 0.45, 0.006], ['youtube', 0.35, 0.004], ['discover', 0.2, 0.009]]
      : c.type === 'video' ? [['youtube', 1, 0.004]] : c.type === 'demandgen' ? [['youtube', 0.5, 0.007], ['discover', 0.5, 0.011]]
      : c.type === 'app' ? [['display', 0.5, 0.008], ['youtube', 0.3, 0.006], ['search', 0.2, 0.03]] : [['display', 1, 0.0045]];
    const hs = D.HOURS[ind.hours][h];
    const viewRate = c.type === 'video' ? 0.1 + 0.3 * P.str : c.type === 'demandgen' || c.type === 'pmax' ? 0.08 + 0.12 * P.str : 0;
    const qC = 0.6 + 0.8 * P.str;
    for (const [net, share, baseCtr] of nets) {
      const appShare = net === 'display' ? P.apps : 0; // Mobile-App-Inventar: viele versehentliche Klicks
      const appCtr = 1 + appShare * 0.8, appCvr = (1 - appShare + appShare * 1.8 * 0.07) / appCtr;
      const avail = P.avail * share * hs * (net === 'display' && c.display.excludeApps ? 0.65 : 1);
      if (avail < 1) continue;
      const ctrE = baseCtr * qC * P.ctrL * fx.ctr * (net === 'youtube' && c.type !== 'video' ? 0.8 : 1) * P.fat * appCtr;
      const cvrE = ind.baseCvr * (net === 'search' ? 1.3 : net === 'discover' ? 0.22 : net === 'youtube' ? 0.12 : 0.15) * (ind.dispCvr || 1) * appCvr * P.lift * (0.6 + 0.8 * P.lp) * S.market.cvrIdx * fx.cvr * ctx.priceCvr * fx.playerCvr * (fx.playerDown ? 0 : 1);
      const b = c.bidStrategy, st = b.type;
      let bidCpm;
      const pc = cvrE * rt.bias;
      if (st === 'cpm') bidCpm = b.cpm || rt.ags[0].cpm || P.cpm;
      else if (st === 'cpv') bidCpm = (b.cpv || rt.ags[0].cpv || ind.cpv) * Math.max(viewRate, 0.05) * 1000;
      else if (st === 'manual') bidCpm = rt.ags[0].defaultBid * ctrE * 1000 * (1 + (sa || 0) / 100);
      else if (st === 'maxclicks') bidCpm = rt.lambda * 0.5 * ctrE * 1000;
      else if (st === 'tcpi') bidCpm = ctrE * 0.35 * (b.tcpi || 2) * 1000;
      else if (st === 'tcpa') bidCpm = ctrE * pc * b.targetCpa * 1000 * 1.3;
      else if (st === 'troas') bidCpm = (ctrE * pc * rt.estValue * 1000 * 1.3) / b.targetRoas;
      else if (st === 'maxvalue') bidCpm = ctrE * pc * rt.estValue * (b.targetRoas ? 1 / b.targetRoas : rt.lambdaV) * 1000 * 1.3;
      else bidCpm = ctrE * pc * (b.targetCpa || rt.lambda) * 1000 * 1.3;
      const win = U.sigmoid(3 * Math.log(Math.max(bidCpm, 0.01) / P.cpm));
      const part = rt.p;
      const freq = c.display.freqCap ? U.clamp(c.display.freqCap / 4, 0.4, 1) : 1;
      let impsE = avail * win * part * freq;
      const clearing = Math.min(bidCpm, P.cpm * (0.55 + 0.35 * Math.min(1, win * 1.2)));
      let costPerImp = clearing / 1000;
      if (costPerImp * impsE + rt.spend > rt.cap) impsE = Math.max(0, (rt.cap - rt.spend) / costPerImp);
      const elig = avail * freq;
      for (const dev of ['mobile', 'desktop', 'tablet']) {
        if (c.devices[dev] <= -100) continue;
        const ds = ind.devices[dev].share;
        const imps = rng.poisson(impsE * ds);
        if (!imps && rng() > 0.3) continue;
        const views = viewRate ? rng.binomial(imps, viewRate) : 0;
        const raw = rng.poisson(imps * ctrE * ind.devices[dev].ctr * (c.type === 'video' ? 0.6 : 1));
        const inv = rng.binomial(raw, U.clamp(fx.invalidRate * 1.5 * (1 + 3 * appShare), 0, 0.6));
        const clicks = raw - inv;
        let cost;
        if (st === 'manual' || st === 'maxclicks') cost = clicks * Math.min(rt.ags[0].defaultBid || 1, clearing / Math.max(ctrE * 1000, 0.0001));
        else if (st === 'cpv') cost = views * (clearing / 1000 / Math.max(viewRate, 0.05));
        else cost = imps * costPerImp;
        rt.spend += cost; rt.d.spend += cost; rt.d.clk += clicks;
        const ownIS = c.type !== 'search';
        if (ownIS) { rt.d.elig += elig * ds; rt.d.impw += impsE * ds; rt.d.lostB += avail * win * (1 - part) * ds; rt.d.lostR += avail * (1 - win) * ds; }
        const ag = rng.pick(rt.ags), ad = ag.rt.ads.length ? rng.pick(ag.rt.ads) : null;
        if (ad) ad.fat = (ad.fat || 0) + imps;
        const loc = rng.weighted(Object.keys(rt.locAdj), (id) => D.LOC_BY_ID[id].w);
        const age = drawIdx(rng, D.AGE_SHARE), gender = GENDER_IDS[drawIdx(rng, GENDER_SHARE)];
        const netName = c.type === 'search' ? 'display' : net;
        const keys = ['acct|all', 'camp|' + c.id, 'ag|' + ag.id, 'dev|' + c.id + '~' + dev, 'loc|' + c.id + '~' + loc, 'hour|' + c.id + '~' + h, 'age|' + c.id + '~' + age, 'gen|' + c.id + '~' + gender, 'net|' + c.id + '~' + netName];
        if (ad) keys.push('ad|' + ad.id);
        for (const a of rt.aud) if (c.audMode === 'targeting' && rng() < 0.6) { keys.push('aud|' + c.id + '~' + a.id); break; }
        for (const k of keys) {
          const v = bufVec(buf, k);
          v[I.imp] += imps; v[I.clk] += clicks; v[I.cost] += cost; v[I.views] += views; v[I.inv] += inv;
          if (k !== 'acct|all' && (ownIS || !k.startsWith('camp|'))) { v[I.elig] += elig * ds; v[I.impw] += impsE * ds; v[I.lostB] += avail * win * (1 - part) * ds; v[I.lostR] += avail * (1 - win) * ds; }
        }
        // View-through-Conversions
        const vt = rng.poisson(imps * 0.000025 * P.lift * (c.type === 'video' ? 1.6 : 1));
        if (vt) addKeys(buf, keys, I.vconv, vt);
        ctx.visitors += clicks;
        ctx.awareImps += imps * (net === 'youtube' ? 2.5 : 1);
        convert(S, rng, ctx, buf, keys, clicks, cvrE * ind.devices[dev].cvr, { ass: rt.ass, device: dev, campRt: rt, network: 'display', app: c.type === 'app' });
        if (rt.spend >= rt.cap) return;
      }
    }
  }

  // ---------- Ausstehende Conversions ----------
  function processPending(S, buf, ctx) {
    const day = S.day;
    const keep = [];
    for (const e of S.pending) {
      if (e.due > day) { keep.push(e); continue; }
      applyConv(S, buf, e, e.day === day);
      if (e.real) { if (!ctx.bank) ctx.revenue += e.rv; ctx.realConv += 1; }
      if (e.real) ctx.buyers += 1;
    }
    S.pending = keep;
  }
  // Echte Umsätze von heute (Lag 0) wurden in convert direkt verbucht
  function realizeToday(S, buf, ctx) {
    const v = buf.get('acct|all');
    if (v) { if (!ctx.bank) ctx.revenue += v[I.rval]; ctx.buyers += v[I.rconv]; ctx.realConv += v[I.rconv]; }
  }

  function commit(S, buf, day) {
    for (const [key, arr] of buf) {
      const p = key.indexOf('|');
      const dim = key.slice(0, p), id = key.slice(p + 1);
      const tgt = statVec(S, dim, id, day, true);
      for (let i = 0; i < NM; i++) tgt[i] += arr[i];
    }
  }

  function prune(S) {
    const cut = S.day - KEEP_DAYS;
    for (const dim of FINE_DIMS) {
      const d = S.stats[dim]; if (!d) continue;
      for (const id in d) {
        const e = d[id];
        for (const k in e) {
          if (k !== 'old' && +k < cut) { const o = e.old || (e.old = newVec()); for (let i = 0; i < NM; i++) o[i] += e[k][i]; delete e[k]; }
        }
      }
    }
  }

  // ---------- Tagesabschluss ----------
  function endOfDay(S, rng, ctx) {
    const ind = ctx.ind, day = S.day;
    // Kampagnen: Pacing, Smart Bidding, Lernphase
    for (const c of S.campaigns) {
      const rt = c.rt;
      rt.invPrep = null;
      if (!rt.active) { rt.limited = false; continue; }
      const d = rt.d;
      const part = d.elig > 0 ? 1 - d.lostB / d.elig : 1;
      if (d.elig > 0) {
        const unc = d.spend / Math.max(part, 0.05);
        rt.pot = (rt.pot || c.budget) * 0.6 + unc * 0.4;
      }
      rt.elig7 = (rt.elig7 || []).concat([[d.elig, d.lostB]]).slice(-7);
      const e7 = U.sum(rt.elig7, (x) => x[0]), l7 = U.sum(rt.elig7, (x) => x[1]);
      rt.limited = e7 > 0 && l7 / e7 > 0.1 && ['manual', 'tcpa', 'troas', 'tis', 'cpm', 'cpv', 'maxclicks', 'tcpi'].includes(c.bidStrategy.type);
      const st = c.bidStrategy.type;
      const elastic = ['maxconv', 'maxvalue', 'maxclicks'].includes(st) || c.type === 'pmax';
      if (elastic && !(st === 'maxconv' && c.bidStrategy.targetCpa) && !(st === 'maxvalue' && c.bidStrategy.targetRoas)) {
        const lostShare = d.elig > 0 ? d.lostB / d.elig : 0;
        if (lostShare > 0.12 || d.spend > c.budget * 1.15) { rt.lambda *= 0.93; rt.lambdaV *= 0.93; }
        else if (d.spend < c.budget * 0.85) { rt.lambda *= 1.1; rt.lambdaV *= 1.1; }
        rt.lambda = U.clamp(rt.lambda, 0.02, ind.aov * 3);
        rt.lambdaV = U.clamp(rt.lambdaV, 0.02, 5);
        rt.limited = lostShare > 0.25 && d.spend >= c.budget * 0.9;
      }
      if (st === 'tis') {
        const b = c.bidStrategy;
        const got = d.elig > 0 ? (b.isLoc === 'abs' ? d.abs : b.isLoc === 'top' ? d.top : d.impw) / d.elig : 0;
        rt.lambda *= got < b.targetIs ? 1.1 : 0.96;
        if (b.maxCpc) rt.lambda = Math.min(rt.lambda, b.maxCpc);
        rt.is = got;
      }
      rt.limitedTarget = ['tcpa', 'troas'].includes(st) && d.spend < c.budget * 0.4 && d.elig > 0 && d.impw / d.elig < 0.35 && !rt.learning;
      if (c.learnUntil !== null && c.learnUntil === day + 1) {
        S.alerts.unshift({ day, level: 'info', text: `Lernphase abgeschlossen: ${c.name}` });
      }
      if (c.endDay !== null && c.endDay === day) S.alerts.unshift({ day, level: 'info', text: `Kampagne beendet (Enddatum erreicht): ${c.name}` });
    }
    // Keywords: CTR-Verhältnis (erwartete CTR) & Status
    const firstPage = {};
    for (const kw of S.keywords) {
      if (!kw.rt || !kw.rt.d) continue;
      const d = kw.rt.d;
      if (d.clkExp > 0) {
        const obs = d.clk / d.clkExp;
        const wgt = U.clamp(d.clkExp / 40, 0.02, 0.5);
        const prior = kw.ctrRatio ?? M.predictedCtrRatio(S, kw, M.ag(S, kw.adGroupId));
        kw.ctrRatio = prior * (1 - wgt) + obs * wgt;
      }
      kw.rt.vol30 = (kw.rt.vol30 || 0) * 0.97 + d.w;
      kw.rt.lowVol = kw.status === 'enabled' && day > 10 && kw.rt.vol30 < 0.6;
      if (kw.rt.qs) {
        const ag = M.ag(S, kw.adGroupId), c = M.camp(S, ag.campaignId);
        const th = kw.theme && M.theme(S, kw.theme);
        const ref = th ? U.avg(th.kws, (k) => k[2]) : 1;
        const fp = (ref * S.market.cpcIdx * 0.14) / kw.rt.qf;
        kw.rt.firstPage = fp; kw.rt.topPage = fp * 3.6;
        kw.rt.belowFirst = c.bidStrategy.type === 'manual' && (kw.maxCpc || ag.defaultBid) < fp;
        firstPage[kw.id] = fp;
      }
    }
    // Duplikate erkennen
    const seen = {};
    for (const kw of S.keywords) if (kw.status === 'enabled') { const k = kw.text + '|' + kw.match; (seen[k] = seen[k] || []).push(kw); }
    for (const kw of S.keywords) if (kw.rt) kw.rt.dupe = kw.status === 'enabled' && (seen[kw.text + '|' + kw.match] || []).length > 1;

    // Anzeigen: Website-Ausfall → Ablehnung „Ziel nicht erreichbar"
    const down = S.market.events.find((e) => e.def === 'lp_down' && e.start <= day && e.end >= day);
    for (const ad of S.ads) {
      if (down && day > down.start && ad.policy.status !== 'disapproved' && rng.chance(0.5)) {
        ad.policy = { status: 'disapproved', reasons: ['Ziel nicht erreichbar (HTTP 503)'], destDown: true };
      } else if (!down && ad.policy.destDown) { M.reviewAd(S, ad, true); }
    }

    // Wettbewerber-KI
    for (const comp of S.competitors) competitorAI(S, rng, ctx, comp);
    // Wiedereinstieg ausgeschiedener Wettbewerber
    for (const comp of S.competitors) if (!comp.active && comp.exitDay !== undefined && day - comp.exitDay > 45 && rng.chance(0.004)) {
      comp.active = true; comp.cash = comp.baseBudget * 120; comp.aggr = comp.baseAggr; comp.budget = comp.baseBudget * 0.8;
      S.market.log.unshift({ day, name: comp.name + ' ist zurück', desc: 'Nach einer Pause schaltet ' + comp.name + ' wieder Google Ads.', sev: 'warn' });
    }

    // Remarketing-Listen & Bekanntheit
    const L = S.lists;
    L.visitors.push(Math.round(ctx.visitors)); L.carts.push(Math.round(ctx.carts + ctx.visitors * 0.06)); L.buyers.push(Math.round(ctx.buyers));
    for (const k of ['visitors', 'carts', 'buyers']) if (L[k].length > 200) L[k] = L[k].slice(-200);
    const dailySearch = U.sum(S.queries, (q) => q.vol) / 30.4;
    S.market.rm = {
      visitors: U.clamp(M.listSize(S, 'visitors') / (dailySearch * 40), 0, 0.12),
      carts: U.clamp(M.listSize(S, 'carts') / (dailySearch * 40), 0, 0.04),
      buyers: U.clamp(M.listSize(S, 'buyers') / (dailySearch * 40), 0, 0.05),
      cm: U.clamp((M.listSize(S, 'buyers') * 0.55) / (dailySearch * 25), 0, 0.1),
    };
    const aw = S.company.awareness;
    S.company.awareness = U.clamp(aw * 0.9965 + (ctx.awareImps / 1e6) * 0.012 * (1 - aw) + (ctx.playerClicks / 1e5) * 0.01, 0.01, 0.6);
    // Markenvolumen folgt der Bekanntheit
    for (const q of S.queries) if (q.brand === 'player') q.vol = Math.round(q.baseVol * (ctx.bank ? 1 : 0.4 + S.company.awareness * 10) * (S.market.fx.brandVol || 1));
    if (ctx.bank) G.BANK.daily(S, ctx, rng);

    // GuV & Kasse
    const cost = (S.stats.acct && S.stats.acct.all && S.stats.acct.all[day]) ? S.stats.acct.all[day][I.cost] : 0;
    const gross = ctx.revenue * ctx.margin;
    const fixed = S.company.fixedPerDay || 0;
    const other = (S._otherCosts || 0) + fixed;
    S._otherCosts = 0;
    S.pnl[day] = { rev: ctx.revenue, gross, ads: cost, other, profit: gross - cost - other, conv: ctx.realConv };
    const wasOk = S.company.cash > 0;
    S.company.cash += gross - cost - other;
    if (wasOk && S.company.cash <= 0) {
      S.alerts.unshift({ day, level: 'bad', text: 'Zahlung abgelehnt: Ihr Unternehmenskonto ist leer. Alle Anzeigen sind gestoppt, bis Sie Kapital einzahlen.' });
      S._pauseRequest = 'Zahlungsproblem';
    }
    // Markthistorie
    S.market.hist.push({
      day, demand: S.market.demand * S.market.fx.demand, cpcIdx: S.market.cpcIdx, cvrIdx: S.market.cvrIdx * S.market.fx.cvr,
      mktCpc: U.div(ctx.mktCost, ctx.mktClicks), share: U.div(ctx.playerClicks, ctx.mktClicks), comps: S.competitors.filter((c) => c.today).length,
    });
    if (S.market.hist.length > 800) S.market.hist.shift();
    if (day % 30 === 29) prune(S);
    if (S.alerts.length > 200) S.alerts.length = 200;
  }

  function competitorAI(S, rng, ctx, comp) {
    const ind = ctx.ind, day = S.day;
    if (!comp.active) return;
    const d = comp.d;
    if (comp.today) {
      const part = d.elig > 0 ? 1 - d.lostB / d.elig : 1;
      const cov = Math.max(ctx.coverage, 0.02);
      if (d.elig > 0) comp.pot = comp.pot * 0.6 + (d.spend / cov / Math.max(part, 0.05)) * 0.4;
      comp.h7.push({ spend: d.spend / cov, conv: d.conv / cov, value: d.value / cov, imps: d.imps, lost: d.elig ? d.lostB / d.elig : 0, above: d.both ? d.pAbove / d.both : 0 });
      if (comp.h7.length > 14) comp.h7.shift();
      const margin = ind.margin * (comp.style === 'marketplace' ? 0.7 : 1);
      comp.cash += (d.value / cov) * margin - d.spend / cov;
    }
    const h = comp.h7.slice(-7);
    if (h.length >= 3) {
      const sp = U.sum(h, (x) => x.spend), val = U.sum(h, (x) => x.value), lost = U.avg(h, (x) => x.lost), above = U.avg(h, (x) => x.above);
      const roas = U.div(val, sp), be = 1 / (ind.margin * (comp.style === 'marketplace' ? 0.7 : 1));
      let a = comp.aggr;
      switch (comp.style) {
        case 'profit': a *= roas < be * 1.15 ? 0.965 : roas > be * 1.7 && lost < 0.1 ? 1.03 : 1; if (above > 0.55 && roas > be * 1.3) a *= 1.012; break;
        case 'aggressive': a *= above > 0.45 ? 1.02 : 1.0; if (roas < be * 0.75) a *= 0.97; if (comp.cash > comp.budget * 150) comp.budget *= 1.003; break;
        case 'budget': a *= lost > 0.15 ? 0.975 : 1.015; break;
        case 'brand': a += (comp.baseAggr * (above > 0.6 ? 1.15 : 1) - a) * 0.05; break;
        case 'erratic': a *= rng.logn(0.07); break;
        case 'marketplace': a += (comp.baseAggr * (ctx.month >= 9 ? 1.15 : 1) - a) * 0.04; break;
      }
      comp.aggr = U.clamp(a, 0.35, 2.6);
    }
    // Neuer Wettbewerber verliert Anfangseuphorie
    if (comp.isNew && day - comp.entered > 60) { comp.aggr *= 0.995; if (day - comp.entered > 150) comp.isNew = false; }
    // Monatliche Budgetplanung
    if (ctx.date.getUTCDate() === 1) {
      const health = comp.cash > comp.baseBudget * 60 ? 1.08 : comp.cash < comp.baseBudget * 15 ? 0.75 : 1;
      comp.budget = U.clamp(comp.budget * health * rng.logn(0.06), comp.baseBudget * 0.3, comp.baseBudget * 3);
    }
    // Ausstieg bei leerer Kasse
    if (comp.cash < 0) {
      comp.active = false; comp.exitDay = day;
      const reason = comp.isNew ? 'Das Start-up hat sein Funding verbrannt' : 'Die Werbung war dauerhaft unprofitabel';
      S.market.log.unshift({ day, name: comp.name + ' steigt aus Google Ads aus', desc: reason + ' – alle Kampagnen gestoppt. Die Auktionen werden entspannter.', sev: 'info' });
      S.alerts.unshift({ day, level: 'good', text: '📰 ' + comp.name + ' hat seine Kampagnen eingestellt.' });
    }
  }

  // ---------- Öffentliche Simulation ----------
  E.simulateDay = function (S) {
    const rng = U.makeRng(S.rngState);
    const date = M.today(S);
    const diff = M.DIFFICULTY[S.settings.difficulty] || M.DIFFICULTY.normal;
    S._pauseRequest = null;
    // Anzeigenprüfung abschließen
    updateMarket(S, rng, date, diff);
    const ctx = prepareDay(S, rng, date);
    const buf = new Map();
    const ind = ctx.ind, fx = ctx.fx;
    // aktive Suchanfragen
    const qs = S.queries.filter((q) => ctx.cands[q.id] || ctx.shopCands[q.id] || q.brand === 'player');
    const qDaily = qs.map((q) => {
      const th = M.theme(S, q.theme);
      const season = th && th.season ? U.seasonAt(th.season, date) : 1;
      const base = (q.vol / 30.4) * U.seasonAt(ind.season, date) * season * ind.dow[ctx.dow] * S.market.demand * fx.demand * (S.market.themeTrend[q.theme] || 1) * (fx.themeDemand[q.theme] || 1) * rng.logn(0.12);
      return [q, base * LOC_CUM.tot];
    });
    const hours = D.HOURS[ind.hours];
    let aid = 0;
    for (let h = 0; h < 24; h++) {
      for (const [q, daily] of qDaily) {
        const s = daily * hours[h];
        if (s < 0.004) continue;
        const K = U.clamp(Math.ceil(s / 5), 1, 4);
        const w = s / K;
        for (let k = 0; k < K; k++) subAuction(S, rng, ctx, buf, q, h, w, ++aid);
      }
      for (const c of ctx.inv) inventoryHour(S, rng, ctx, buf, c, h);
    }
    // Eligibility/IS je Kampagne in die Statistik schreiben
    for (const c of ctx.camps) {
      if (!['search', 'shopping'].includes(c.type)) continue;
      const d = c.rt.d;
      const v = bufVec(buf, 'camp|' + c.id);
      v[I.elig] += d.elig; v[I.lostB] += d.lostB; v[I.lostR] += Math.max(0, d.elig - d.lostB - d.impw);
      if (c.rt.exp) { const ve = bufVec(buf, 'exp|' + c.rt.exp.x.id + '~' + c.rt.exp.role); ve[I.elig] += d.elig; ve[I.lostB] += d.lostB; }
    }
    // Konto: Eligibility nur aus Suche
    const acct = bufVec(buf, 'acct|all');
    for (const c of ctx.camps) if (c.type === 'search') { acct[I.elig] += c.rt.d.elig; acct[I.lostB] += c.rt.d.lostB; acct[I.lostR] += Math.max(0, c.rt.d.elig - c.rt.d.lostB - c.rt.d.impw); }
    // Keyword-Eligibility (Näherung über Kampagnenquote)
    realizeToday(S, buf, ctx);
    processPending(S, buf, ctx);
    commit(S, buf, S.day);
    endOfDay(S, rng, ctx);
    S.rngState = rng.getState();
    S.day++;
    if (G.GOALS) G.GOALS.daily(S);
    // Anzeigen, deren Prüfung abgeschlossen ist
    for (const ad of S.ads) if (ad.reviewUntil !== null && ad.reviewUntil <= S.day) {
      ad.reviewUntil = null;
      if (ad.policy.status === 'disapproved' && !ad.policy.notified) {
        ad.policy.notified = true;
        S.alerts.unshift({ day: S.day, level: 'bad', text: 'Anzeige abgelehnt: ' + ad.policy.reasons.join(', ') });
      }
    }
    return ctx;
  };

  // ---------- Keyword-Planer ----------
  E.keywordIdeas = function (S, seed) {
    const ind = M.ind(S), date = M.today(S);
    const st = M.toks(seed || '');
    const out = [];
    for (const q of S.queries) {
      if (q.brand && q.brand !== 'player') continue;
      const qt = M.toks(q.text);
      const th = M.theme(S, q.theme);
      let score = st.length ? st.filter((t) => qt.includes(t) || (th && M.toks(th.name).includes(t))).length : 1;
      if (!score && st.length) {
        const th2 = M.kwTheme(S, seed);
        if (th2 === q.theme) score = 0.5;
      }
      if (!score) continue;
      const season = th && th.season ? U.seasonAt(th.season, date) : 1;
      const vol = q.vol * U.seasonAt(ind.season, date) * season * S.market.demand * (S.market.themeTrend[q.theme] || 1);
      const comps = S.competitors.filter((c) => c.active && (q.brand ? q.brand === c.id : c.themes.includes(q.theme)));
      const compIdx = U.clamp(U.sum(comps, (c) => c.aggr * c.budget) / 2500, 0, 1);
      const cpc = q.cpc * S.market.cpcIdx;
      const m3 = th && th.season ? U.seasonAt(th.season, U.addDays(date, 90)) / season : 1;
      out.push({
        q, text: q.text, vol: Math.round(vol / 10) * 10 || 10, comp: compIdx > 0.66 ? 'Hoch' : compIdx > 0.33 ? 'Mittel' : 'Niedrig', compIdx,
        low: cpc * 0.55, high: cpc * 1.9, trend3: m3 - 1, score, theme: th ? th.name : q.brand === 'player' ? 'Marke' : '–',
      });
    }
    return out.sort((a, b) => b.score - a.score || b.vol - a.vol);
  };

  // Prognose: einfache Monte-Carlo-Schätzung für eine Liste von Suchanfragen
  E.forecast = function (S, queries, maxCpc, qs = 6) {
    const ind = M.ind(S), date = M.today(S);
    const rng = U.makeRng(12345 + S.day);
    let imp = 0, clk = 0, cost = 0, conv = 0;
    for (const q of queries) {
      const th = M.theme(S, q.theme);
      const season = th && th.season ? U.seasonAt(th.season, date) : 1;
      const daily = (q.vol / 30.4) * U.seasonAt(ind.season, date) * season * S.market.demand;
      const comps = S.competitors.filter((c) => c.active && (q.brand ? q.brand === c.id : c.themes.includes(q.theme)));
      const N = 60;
      for (let i = 0; i < N; i++) {
        const cpcBase = q.cpc * S.market.cpcIdx;
        const my = { rank: maxCpc * M.qf(qs) * rng.logn(0.16), me: true };
        const arr = [my];
        for (const c of comps) if (rng() < 0.75) { const b = cpcBase * c.aggr * rng.logn(0.22); arr.push({ rank: b * M.qf(c.qs) * 1.06 }); }
        arr.sort((a, b) => b.rank - a.rank);
        for (let b = rng.poisson(ind.bgDensity || 3); b > 0; b--) arr.push({ rank: cpcBase * 0.8 * rng.logn(0.5) * M.qf(3 + rng() * 5) });
        arr.sort((a, b) => b.rank - a.rank);
        const reserve = cpcBase * 0.14, topThr = cpcBase * 0.42;
        const shown = arr.filter((e) => e.rank >= reserve).slice(0, 7);
        const idx = shown.indexOf(my);
        if (idx < 0) continue;
        const top = idx < 4 && my.rank >= topThr;
        const pf = top ? POS_TOP[idx] : POS_BOT[Math.min(idx - 4, 2)] || 0.08;
        const ctr = ind.baseCtr * pf * Math.pow(q.intent, 0.35);
        const next = shown[idx + 1];
        const cpc = Math.min(maxCpc, maxCpc * ((next ? next.rank : reserve) / my.rank) + 0.01);
        const w = daily / N;
        imp += w; clk += w * ctr; cost += w * ctr * cpc; conv += w * ctr * ind.baseCvr * q.intent;
      }
    }
    return { imp: imp * 30, clk: clk * 30, cost: cost * 30, conv: conv * 30, cpc: U.div(cost, clk) };
  };

  G.E = E;
})();
