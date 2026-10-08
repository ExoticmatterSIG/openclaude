/* Google Ads Simulator – Datenmodell, Spielstart, Qualitätsfaktor, Anzeigenstärke, Richtlinien, Aktionen */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U, D = G.D;

  const M = {}; // Model-Namespace

  // ---------- IDs & Lookup ----------
  M.nid = (S, p) => p + S.nextId++;
  M.byId = (arr, id) => arr.find((x) => x.id === id);
  M.ind = (S) => D.IND_BY_ID[S.ind];
  M.camp = (S, id) => M.byId(S.campaigns, id);
  M.ag = (S, id) => M.byId(S.adGroups, id);
  M.agsOf = (S, cid) => S.adGroups.filter((a) => a.campaignId === cid && a.status !== 'removed');
  M.kwsOf = (S, agid) => S.keywords.filter((k) => k.adGroupId === agid && k.status !== 'removed');
  M.adsOf = (S, agid) => S.ads.filter((a) => a.adGroupId === agid && a.status !== 'removed');
  M.theme = (S, id) => M.ind(S).themes.find((t) => t.id === id);
  M.today = (S) => U.dayToDate(S.startDate, S.day);

  const tokCache = new Map();
  M.toks = (text) => {
    let t = tokCache.get(text);
    if (!t) { t = U.tokens(text); tokCache.set(text, t); }
    return t;
  };

  // ---------- Neues Spiel ----------
  M.DIFFICULTY = {
    easy: { name: 'Leicht', cash: 60000, comp: 0.85, events: 0.6, fixed: 0.2, goal: 0.75 },
    normal: { name: 'Normal', cash: 30000, comp: 1.0, events: 1.0, fixed: 0.45, goal: 1 },
    hard: { name: 'Schwer', cash: 15000, comp: 1.2, events: 1.5, fixed: 0.75, goal: 1.1 },
    expert: { name: 'Experte (realistisch)', cash: 20000, comp: 1.3, events: 1.7, fixed: 0.9, goal: 1.25 },
  };

  M.newGame = function (opts) {
    const ind = D.IND_BY_ID[opts.industry || 'fashion'];
    const diff = M.DIFFICULTY[opts.difficulty || 'normal'];
    const seed = (opts.seed >>> 0) || ((Math.random() * 2 ** 31) >>> 0);
    const rng = U.makeRng(seed);
    const brandName = (opts.brand || ind.brand.name).trim();
    const S = {
      version: 1, seed, rngState: seed ^ 0x9e3779b9, day: 0,
      startDate: opts.startDate || ind.startDate || '2026-01-05', ind: ind.id,
      company: {
        name: opts.company || brandName, brand: brandName,
        domain: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.de',
        priceAdj: 0, awareness: ind.bank ? 0.25 : 0.06, cash: diff.cash * (ind.cashMult || 1), startCash: diff.cash * (ind.cashMult || 1), fixedPerDay: ind.bank ? 0 : Math.round((M.STARTER_BUDGET[ind.id] || 100) * diff.fixed),
      },
      settings: { difficulty: opts.difficulty || 'normal', autoPause: true },
      account: {
        attribution: 'dda', autoTagging: true, consentMode: 'basic', consentRate: 0.74, trackingOk: true,
        enhancedConv: false, invalidRate: 0.025, paymentOk: true, autoApply: false, reportingDelay: 0,
      },
      convActions: ind.conv.map((c, i) => ({ id: 'ca' + (i + 1), ...c, countType: c.category === 'Kauf' ? 'every' : 'one', window: c.requiresImport ? 90 : 30, status: c.requiresImport ? 'paused' : 'enabled' })),
      campaigns: [], adGroups: [], keywords: [], ads: [], assets: [], negatives: [], negLists: [],
      customAudiences: [], products: [], experiments: [],
      market: { demand: 1, cpcIdx: 1, cvrIdx: 1, ctrInfo: 1, themeTrend: {}, events: [], log: [], news: [], fx: null, hist: [] },
      queries: [], competitors: [],
      stats: {}, pending: [], history: [], alerts: [], dismissed: {}, pnl: {},
      lists: { visitors: [], carts: [], buyers: [] },
      nextId: 1,
    };
    for (const t of ind.themes) S.market.themeTrend[t.id] = 1;

    // Suchanfragen-Universum erzeugen
    let qn = 1;
    for (const th of ind.themes) {
      for (const [kw, vol, cpc, biz] of th.kws) {
        for (const mid of th.mods || ind.mods) {
          const mod = { ...D.MODS[mid], ...((ind.modOverrides || {})[mid] || {}) };
          S.queries.push({
            id: 'q' + qn++, text: mod.t.replace('{k}', kw), theme: th.id, kw, mod: mid,
            vol: Math.round(vol * mod.vol * rng.range(0.85, 1.15)), intent: mod.intent * (mod.quality || 1), cpc: +(cpc * mod.cpc).toFixed(2), brand: null,
            biz: U.clamp((biz ?? 1) * (mod.biz ?? 1), 0, 1),
          });
        }
      }
    }
    const brandQ = brandName.toLowerCase();
    if (ind.brandQueries) {
      for (const [text, vol, intent, biz] of ind.brandQueries) S.queries.push({ id: 'q' + qn++, text, theme: '_brand', kw: text, mod: 'brand', vol, baseVol: vol, intent, cpc: 0.55, brand: 'player', biz });
    } else {
      [[brandQ, 1, 2.2], [brandQ + ' erfahrungen', 0.12, 1.2], [brandQ + ' gutschein', 0.1, 2.0]].forEach(([text, f, intent]) => {
        S.queries.push({ id: 'q' + qn++, text, theme: '_brand', kw: brandQ, mod: 'brand', vol: Math.round(ind.brand.vol * f), baseVol: Math.round(ind.brand.vol * f), intent, cpc: 0.45, brand: 'player' });
      });
    }

    // Mitbewerber
    ind.competitors.forEach((c, i) => S.competitors.push(M.makeCompetitor(S, c, rng, diff, 'c' + (i + 1))));
    for (const c of S.competitors.slice(0, 4)) {
      S.queries.push({ id: 'q' + qn++, text: c.name.toLowerCase(), theme: '_comp', kw: c.name.toLowerCase(), mod: 'brand', vol: Math.round(600 + c.budget * 4), intent: 0.3, cpc: 0.9, brand: c.id });
    }

    // Produkte (Merchant Center)
    if (ind.hasShopping) {
      for (const th of ind.themes) {
        for (const [title, price] of th.products || []) {
          const p = {
            id: M.nid(S, 'p'), title, theme: th.id, price: +(price * rng.range(0.97, 1.06)).toFixed(2), marketPrice: price,
            gtin: rng.chance(0.85), imgQ: +rng.range(0.55, 0.9).toFixed(2), stock: true, status: 'enabled',
          };
          S.products.push(p);
        }
      }
    }

    if (ind.bank) G.BANK.init(S, rng);
    if (opts.starter !== false) (ind.bank ? G.BANK.createStarter(S, rng) : M.createStarter(S, rng));
    if (G.GOALS) G.GOALS.init(S);
    M.log(S, 'Konto', S.company.name, 'Konto eröffnet – Branche: ' + ind.name);
    S.alerts.push({ day: 0, level: 'info', text: 'Willkommen! Ihr Konto ist eingerichtet. Starten Sie die Simulation über ▶ oben rechts.' });
    return S;
  };

  M.makeCompetitor = function (S, c, rng, diff, id) {
    const ind = M.ind(S);
    let geo = c.geo || D.DE_IDS;
    if (c.geo && c.geo[0] === 'DACH') geo = D.LOCATIONS.map((l) => l.id);
    const themeAggr = {};
    for (const t of ind.themes) themeAggr[t.id] = +rng.range(0.85, 1.15).toFixed(2);
    return {
      id: id || M.nid(S, 'c'), name: c.name, domain: c.domain || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.de',
      style: c.style, budget: c.budget, baseBudget: c.budget, qs: c.qs, aggr: c.aggr * (diff ? diff.comp : 1), baseAggr: c.aggr,
      themes: c.themes || ind.themes.map((t) => t.id), shopping: !!c.shopping, geo,
      kind: c.kind || null, portal: !!c.portal,
      active: true, pausedUntil: null, cash: c.budget * 160, themeAggr, lp: +rng.range(0.75, 1.15).toFixed(2),
      hoursB2B: ind.hours === 'b2b' && rng.chance(0.5), pot: c.budget, smart: !['budget', 'erratic'].includes(c.style), entered: S.day || 0,
      d: { spend: 0, clicks: 0, conv: 0, imps: 0, elig: 0, lostB: 0 }, h7: [],
    };
  };

  M.STARTER_BUDGET = { vwbank: 240, fashion: 90, saas: 160, local: 130, travel: 120, insurance: 220, fitness: 70 };

  M.createStarter = function (S, rng) {
    const ind = M.ind(S);
    const c = M.makeCampaign(S, 'search', {
      name: 'Suche | Generisch | DE',
      budget: M.STARTER_BUDGET[ind.id] || 100,
      bidStrategy: { type: 'manual' },
      locations: ind.id === 'local' ? ['NW', 'HE'] : D.DE_IDS.slice(),
    });
    S.campaigns.push(c);
    ind.themes.slice(0, 2).forEach((th) => {
      const avgCpc = U.avg(th.kws, (k) => k[2]);
      const ag = M.makeAdGroup(S, c, { name: th.name, defaultBid: +(avgCpc * 0.9).toFixed(2) });
      S.adGroups.push(ag);
      for (const [kw] of th.kws) S.keywords.push(M.makeKeyword(S, ag, kw, 'phrase'));
      const first = th.kws[0][0];
      const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
      const heads = [cap(first), S.company.brand + ' Onlineshop', 'Jetzt entdecken', 'Schnelle Lieferung', cap(th.name) + ' im Angebot', 'Top Qualität'];
      if (ind.goal === 'leads') heads.splice(1, 5, S.company.brand + ' – Ihr Partner', 'Jetzt anfragen', 'Kostenlose Beratung', cap(th.name) + ' vom Profi', 'Schnell & zuverlässig');
      S.ads.push(M.makeAd(S, ag, {
        type: 'rsa', headlines: heads.map((t) => ({ t: t.slice(0, 30), pin: 0 })),
        descriptions: [{ t: `${cap(th.name)} bei ${S.company.brand}. Jetzt informieren und profitieren.`.slice(0, 90), pin: 0 }, { t: 'Faire Preise, persönlicher Service und zufriedene Kunden seit vielen Jahren.', pin: 0 }],
        noReview: true,
      }));
    });
    // Starter: Konto-Sitelinks fehlen absichtlich (Optimierungspotenzial)
    S.assets.push({ id: M.nid(S, 'as'), type: 'callout', level: 'account', campaignId: null, status: 'enabled', data: { text: 'Kostenloser Versand' } });
  };

  // ---------- Fabriken ----------
  M.makeCampaign = function (S, type, o = {}) {
    const ind = M.ind(S);
    const locs = o.locations || D.DE_IDS.slice();
    const bs = Object.assign({ type: 'manual', targetCpa: null, targetRoas: null, maxCpc: null, targetIs: 0.8, isLoc: 'top', cpm: null, cpv: null, tcpi: null }, o.bidStrategy || {});
    const smart = D.BID_STRATEGIES[bs.type] && D.BID_STRATEGIES[bs.type].smart;
    return {
      id: M.nid(S, 'cmp'), name: o.name || D.CAMPAIGN_TYPES[type].name + ' #' + S.nextId, type, status: 'enabled',
      goal: o.goal || (ind.goal === 'sales' ? 'Umsätze' : 'Leads'), budget: o.budget || 50, sharedBudget: null,
      bidStrategy: bs,
      networks: { partners: type === 'search', display: false },
      locations: locs.map((id) => ({ id, adj: 0 })), excludedLocs: [], locOption: 'presence',
      languages: ['de'], devices: { mobile: 0, desktop: 0, tablet: 0 },
      schedule: null, audiences: [], audMode: type === 'display' || type === 'demandgen' ? 'targeting' : 'observation',
      demo: { age: [0, 0, 0, 0, 0, 0, 0], gender: { m: 0, f: 0, u: 0 } },
      startDay: S.day, endDay: null, created: S.day, learnUntil: smart ? S.day + 7 : null, learnReason: smart ? 'Neue Gebotsstrategie' : null,
      convGoals: 'account', adRotation: 'optimize',
      display: { optimizedTargeting: type !== 'video', freqCap: null, contentExclusions: [], excludeApps: false, excludeSensitive: false },
      pmax: { urlExpansion: true, brandExclusion: false },
      app: { platform: 'android' },
      labels: [], isTrial: false,
      rt: { pot: o.budget || 50, lambda: null, lambdaV: 1, bias: 1, elig7: [], is: null },
    };
  };

  M.makeAdGroup = function (S, c, o = {}) {
    const ind = M.ind(S);
    const kind = { search: 'standard', shopping: 'productgroup', pmax: 'assetgroup', display: 'display', demandgen: 'display', video: 'video', app: 'app' }[c.type];
    return {
      id: M.nid(S, 'ag'), campaignId: c.id, name: o.name || 'Anzeigengruppe ' + S.nextId, status: 'enabled', kind,
      defaultBid: o.defaultBid || 1.0, cpm: o.cpm || null, cpv: o.cpv || null,
      lp: { speed: ind.lp.speed, relevance: ind.lp.relevance, mobile: true, url: 'https://www.' + S.company.domain + '/' + (o.slug || '') },
      themes: o.themes || [], audiences: o.audiences || [], productThemes: o.productThemes || null,
    };
  };

  M.makeKeyword = function (S, ag, text, match, maxCpc) {
    return { id: M.nid(S, 'kw'), adGroupId: ag.id, text: U.norm(text), match: match || 'broad', status: 'enabled', maxCpc: maxCpc || null, theme: M.kwTheme(S, text), ctrRatio: null, created: S.day };
  };

  M.makeAd = function (S, ag, o) {
    const ad = Object.assign({ id: M.nid(S, 'ad'), adGroupId: ag.id, status: 'enabled', finalUrl: ag.lp.url, path1: '', path2: '', created: S.day }, o);
    delete ad.noReview;
    M.reviewAd(S, ad, !o.noReview);
    return ad;
  };

  // ---------- Matching ----------
  M.kwTheme = function (S, text) {
    const ind = M.ind(S);
    const kt = M.toks(text);
    if (S.company && kt.join(' ').includes(U.stem(S.company.brand.toLowerCase().split(' ')[0]))) return '_brand';
    let best = null, bs = 0;
    for (const th of ind.themes) {
      const tt = new Set(th.kws.flatMap((k) => M.toks(k[0])).concat(M.toks(th.name)));
      const sc = kt.filter((t) => tt.has(t)).length;
      if (sc > bs) { bs = sc; best = th.id; }
    }
    return best;
  };

  // Liefert Relevanz (0 = kein Match)
  M.matchRel = function (kw, q) {
    const kt = M.toks(kw.text), qt = M.toks(q.text);
    if (!kt.length) return 0;
    const qs = new Set(qt);
    const allIn = kt.every((t) => qs.has(t));
    if (kw.match === 'exact') {
      return allIn && kt.length === qt.length ? 1 : 0;
    }
    if (kw.match === 'phrase') {
      if (!allIn) return 0;
      // Reihenfolge prüfen
      let i = 0;
      for (const t of qt) if (t === kt[i]) i++;
      return i === kt.length ? (kt.length === qt.length ? 1 : 0.9) : 0.8;
    }
    // broad
    if (allIn) return kt.length === qt.length ? 1 : 0.85;
    if (kw.theme && kw.theme === q.theme) return 0.7;
    const shared = kt.filter((t) => qs.has(t) && t.length > 3).length;
    if (shared) return 0.45;
    return 0;
  };

  M.negBlocks = function (neg, q) {
    const nt = M.toks(neg.text), qt = M.toks(q.text);
    if (!nt.length) return false;
    if (neg.match === 'exact') return nt.length === qt.length && nt.every((t, i) => t === qt[i]);
    if (neg.match === 'phrase') {
      for (let i = 0; i + nt.length <= qt.length; i++) if (nt.every((t, j) => qt[i + j] === t)) return true;
      return false;
    }
    const qs = new Set(qt);
    return nt.every((t) => qs.has(t));
  };

  M.campaignNegatives = function (S, cid) {
    const out = S.negatives.filter((n) => n.campaignId === cid || n.campaignId === null);
    for (const l of S.negLists) if (l.campaigns.includes(cid)) out.push(...l.terms);
    return out;
  };

  // ---------- Assets ----------
  M.assetsFor = function (S, cid) {
    const camp = S.assets.filter((a) => a.status === 'enabled' && a.campaignId === cid);
    const types = new Set(camp.map((a) => a.type));
    // Kampagnen-Assets überschreiben Konto-Assets desselben Typs
    const acct = S.assets.filter((a) => a.status === 'enabled' && a.level === 'account' && !types.has(a.type));
    return camp.concat(acct);
  };
  M.assetFactors = function (S, cid) {
    const list = M.assetsFor(S, cid);
    const cnt = {};
    for (const a of list) cnt[a.type] = (cnt[a.type] || 0) + 1;
    let ctr = 1, rank = 1;
    for (const [t, def] of Object.entries(D.ASSET_TYPES)) {
      if ((cnt[t] || 0) >= def.min) {
        const full = t === 'sitelink' && cnt[t] >= 4 ? 1.3 : 1;
        ctr += def.ctr * full; rank += def.rank * full;
      }
    }
    return { ctr: Math.min(ctr, 1.45), rank: Math.min(rank, 1.15), cnt, call: (cnt.call || 0) > 0, lead: (cnt.leadform || 0) > 0, promo: (cnt.promotion || 0) > 0, loc: (cnt.location || 0) > 0 };
  };

  // ---------- Anzeigenstärke ----------
  M.adStrength = function (S, ad) {
    const kws = M.kwsOf(S, ad.adGroupId);
    const brand = S.company.brand.toLowerCase();
    if (ad.type === 'rsa') {
      const hs = ad.headlines.filter((h) => h.t.trim()), ds = ad.descriptions.filter((d) => d.t.trim());
      if (hs.length < 3 || ds.length < 2) return { score: 10, label: 'Unvollständig', tips: ['Mindestens 3 Anzeigentitel und 2 Beschreibungen erforderlich'] };
      let sc = (Math.min(hs.length, 15) / 15) * 35 + (Math.min(ds.length, 4) / 4) * 20;
      const uniq = new Set(hs.map((h) => U.norm(h.t).split(' ').slice(0, 2).join(' '))).size / hs.length;
      sc += uniq * 10;
      const htoks = new Set(hs.flatMap((h) => M.toks(h.t)));
      const top = kws.slice(0, 6);
      const incl = top.length ? top.filter((k) => M.toks(k.text).every((t) => htoks.has(t))).length / top.length : 0.5;
      sc += incl * 20;
      if (U.avg(hs, (h) => h.t.length) >= 20) sc += 5;
      if (hs.some((h) => h.t.toLowerCase().includes(brand))) sc += 10;
      const pins = hs.filter((h) => h.pin).length;
      if (pins > 2) sc -= 12;
      sc = U.clamp(sc, 0, 100);
      const tips = [];
      if (hs.length < 10) tips.push('Weitere Anzeigentitel hinzufügen (' + hs.length + '/15)');
      if (ds.length < 4) tips.push('Weitere Beschreibungen hinzufügen (' + ds.length + '/4)');
      if (incl < 0.6) tips.push('Beliebte Keywords in Anzeigentitel aufnehmen');
      if (uniq < 0.8) tips.push('Anzeigentitel einzigartiger gestalten');
      if (pins > 2) tips.push('Weniger Assets fixieren');
      return { score: sc, label: M.strengthLabel(sc), tips };
    }
    if (ad.type === 'rda' || ad.type === 'assetgroup' || ad.type === 'app' || ad.type === 'dg') {
      const h = (ad.headlines || []).filter((x) => x.t.trim()).length, d = (ad.descriptions || []).filter((x) => x.t.trim()).length;
      let sc = (Math.min(h, ad.type === 'assetgroup' ? 15 : 5) / (ad.type === 'assetgroup' ? 15 : 5)) * 25 + (Math.min(d, 5) / 5) * 15;
      sc += (Math.min(ad.images || 0, 15) / 15) * 30 + (ad.logos ? 10 : 0) + (Math.min(ad.videos || 0, 3) / 3) * 15 + ((ad.longHeadlines || []).length ? 5 : 0);
      sc = U.clamp(sc, 0, 100);
      const tips = [];
      if ((ad.images || 0) < 5) tips.push('Mehr Bilder hinzufügen (mind. 5, ideal 15+)');
      if (!ad.logos) tips.push('Logo hinzufügen');
      if (!(ad.videos || 0)) tips.push('Video hinzufügen – sonst erzeugt Google ein automatisches Video');
      if (h < 5) tips.push('Mehr Anzeigentitel hinzufügen');
      return { score: sc, label: M.strengthLabel(sc), tips };
    }
    if (ad.type === 'video') {
      const q = { smartphone: 45, ugc: 65, pro: 82 }[ad.quality] || 50;
      const len = ad.lengthSec <= 20 ? 10 : ad.lengthSec <= 45 ? 5 : -5;
      const sc = U.clamp(q + len + (ad.cta ? 8 : 0), 0, 100);
      return { score: sc, label: M.strengthLabel(sc), tips: ad.cta ? [] : ['Call-to-Action hinzufügen'] };
    }
    return { score: 60, label: 'Gut', tips: [] };
  };
  M.strengthLabel = (sc) => (sc < 30 ? 'Schlecht' : sc < 55 ? 'Ausreichend' : sc < 78 ? 'Gut' : 'Sehr gut');
  M.strengthCtr = (sc) => 0.82 + 0.36 * (sc / 100);

  // ---------- Richtlinien ----------
  M.policyCheck = function (S, ad) {
    const texts = [].concat((ad.headlines || []).map((h) => h.t), (ad.descriptions || []).map((d) => d.t), (ad.longHeadlines || []).map((h) => h.t));
    const reasons = [];
    let status = 'approved';
    const heads = (ad.headlines || []).map((h) => h.t);
    if (heads.some((t) => t.includes('!'))) { status = 'disapproved'; reasons.push('Zeichensetzung: Ausrufezeichen im Anzeigentitel'); }
    if (texts.some((t) => /!!|\?\?|€€|\*\*/.test(t))) { status = 'disapproved'; reasons.push('Unzulässige Wiederholung von Satzzeichen/Symbolen'); }
    if (texts.some((t) => /\b[A-ZÄÖÜ]{5,}\b/.test(t))) { status = 'disapproved'; reasons.push('Unzulässige Großschreibung'); }
    if (texts.some((t) => /(\+49|\b0\d{3,4}[ /-]?\d{4,})/.test(t))) { status = 'disapproved'; reasons.push('Telefonnummer im Anzeigentext (Anruf-Asset verwenden)'); }
    if (status !== 'disapproved') {
      if (texts.some((t) => /(nr\.?\s?1|#1|\bbeste[rsn]?\b|weltweit führend|marktführer)/i.test(t))) { status = 'limited'; reasons.push('Nicht belegte Superlative'); }
      if (texts.some((t) => /(garantiert|100\s?%|kostenlos\b.*sofort|risikofrei)/i.test(t)) && ['insurance', 'saas'].includes(S.ind)) { status = 'limited'; reasons.push('Irreführende Versprechen (Finanz-/Geschäftsangaben)'); }
      const comps = S.competitors.map((c) => c.name.toLowerCase());
      if (texts.some((t) => comps.some((c) => t.toLowerCase().includes(c)))) { status = 'limited'; reasons.push('Marken: Verwendung fremder Markennamen'); }
    }
    if (M.ind(S).bank && S.bank) {
      const bp = G.BANK.policy(S, ad);
      reasons.push(...bp.reasons);
      if (bp.status === 'disapproved') status = 'disapproved';
      else if (bp.status === 'limited' && status === 'approved') status = 'limited';
    }
    return { status, reasons };
  };
  M.reviewAd = function (S, ad, withReview = true) {
    ad.policy = M.policyCheck(S, ad);
    ad.reviewUntil = withReview ? S.day + 1 : null;
  };
  M.adServable = (S, ad) => ad.status === 'enabled' && ad.policy.status !== 'disapproved' && !(ad.reviewUntil !== null && ad.reviewUntil > S.day);
  M.policyLabel = function (S, ad) {
    if (ad.status === 'paused') return ['Pausiert', 'muted'];
    if (ad.reviewUntil !== null && ad.reviewUntil > S.day) return ['Wird geprüft', 'warn'];
    if (ad.policy.status === 'disapproved') return ['Abgelehnt', 'bad'];
    if (ad.policy.status === 'limited') return ['Zulässig (eingeschränkt)', 'warn'];
    return ['Zulässig', 'good'];
  };

  // ---------- Qualitätsfaktor ----------
  M.lpScore = function (S, ag) {
    const fx = S.market.fx || {};
    if (fx.playerDown) return 0.05;
    return U.clamp(ag.lp.relevance * 0.55 + (ag.lp.speed / 100) * 0.3 + (ag.lp.mobile ? 0.15 : 0), 0, 1);
  };
  M.adRelevance = function (S, kw, ag) {
    const ads = M.adsOf(S, ag.id).filter((a) => a.status === 'enabled');
    const kt = M.toks(kw.text);
    let frac = 0;
    for (const ad of ads) {
      const htoks = new Set((ad.headlines || []).flatMap((h) => M.toks(h.t)));
      frac = Math.max(frac, kt.filter((t) => htoks.has(t)).length / kt.length);
    }
    const themes = new Set(M.kwsOf(S, ag.id).map((k) => k.theme)).size;
    return U.clamp(frac * 0.8 + (themes <= 1 ? 0.2 : themes === 2 ? 0.1 : 0), 0, 1);
  };
  M.predictedCtrRatio = function (S, kw, ag) {
    const ads = M.adsOf(S, ag.id).filter((a) => M.adServable(S, a));
    const str = ads.length ? Math.max(...ads.map((a) => M.adStrength(S, a).score)) : 20;
    const camp = M.camp(S, ag.campaignId);
    return M.strengthCtr(str) * M.assetFactors(S, camp.id).ctr * (kw.match === 'exact' ? 1.08 : kw.match === 'phrase' ? 1.0 : 0.93);
  };
  M.qualityScore = function (S, kw) {
    const ag = M.ag(S, kw.adGroupId);
    const ratio = kw.ctrRatio !== null && kw.ctrRatio !== undefined ? kw.ctrRatio : M.predictedCtrRatio(S, kw, ag);
    const rel = M.adRelevance(S, kw, ag);
    const lp = M.lpScore(S, ag);
    const lvl = (x, a, b) => (x >= a ? 2 : x >= b ? 1 : 0);
    const cL = lvl(ratio, 1.12, 0.9), rL = lvl(rel, 0.75, 0.45), lL = lvl(lp, 0.7, 0.48);
    const score = 1 + [0, 1.75, 3.5][cL] + [0, 1, 2][rL] + [0, 1.75, 3.5][lL];
    const cont = 1 + U.clamp((ratio - 0.75) / 0.5, 0, 1) * 3.5 + rel * 2 + U.clamp((lp - 0.3) / 0.5, 0, 1) * 3.5;
    const names = ['Unterdurchschnittlich', 'Durchschnittlich', 'Überdurchschnittlich'];
    return { score: Math.round(score), cont, ctr: names[cL], rel: names[rL], lp: names[lL], cL, rL, lL };
  };
  M.qf = (qs) => (qs + 2) / 12;

  // ---------- Zielgruppen ----------
  M.audiences = function (S) {
    const ind = M.ind(S);
    const out = [];
    ind.audiences.inmarket.forEach((a, i) => out.push({ id: 'im' + i, type: 'Kaufbereite Zielgruppe', name: a.name, share: a.share, themes: a.themes, cvr: 1.45, ctr: 1.12 }));
    ind.audiences.affinity.forEach((a, i) => out.push({ id: 'af' + i, type: 'Gemeinsame Interessen', name: a.name, share: a.share, themes: null, cvr: 1.08, ctr: 1.05 }));
    ind.audiences.life.forEach((a, i) => out.push({ id: 'le' + i, type: 'Lebensereignisse', name: a.name, share: a.share, themes: null, cvr: 1.18, ctr: 1.05 }));
    const rm = S.market.rm || { visitors: 0, carts: 0, buyers: 0, cm: 0 };
    out.push({ id: 'rmv', type: 'Ihre Daten', name: 'Website-Besucher (30 Tage)', share: rm.visitors, size: M.listSize(S, 'visitors'), themes: null, cvr: 2.0, ctr: 1.35 });
    out.push({ id: 'rmc', type: 'Ihre Daten', name: 'Warenkorb-/Formularabbrecher (14 Tage)', share: rm.carts, size: M.listSize(S, 'carts'), themes: null, cvr: 3.1, ctr: 1.5 });
    out.push({ id: 'rmb', type: 'Ihre Daten', name: 'Käufer/Kunden (180 Tage)', share: rm.buyers, size: M.listSize(S, 'buyers'), themes: null, cvr: 1.5, ctr: 1.2 });
    out.push({ id: 'cm', type: 'Ihre Daten', name: 'Customer Match: Kundenliste', share: rm.cm, size: Math.round(M.listSize(S, 'buyers') * 0.55), themes: null, cvr: 1.7, ctr: 1.25 });
    for (const c of S.customAudiences) out.push({ id: c.id, type: 'Benutzerdefiniertes Segment', name: c.name, share: c.share, themes: c.themes, cvr: 1.3, ctr: 1.1, custom: true, terms: c.terms });
    return out;
  };
  M.listSize = function (S, list) {
    const arr = S.lists[list] || [];
    const days = list === 'visitors' ? 30 : list === 'carts' ? 14 : 180;
    return Math.round(U.sum(arr.slice(-days)));
  };

  // ---------- Änderungsprotokoll & Learning ----------
  M.log = function (S, type, name, change) {
    S.history.unshift({ day: S.day, type, name, change });
    if (S.history.length > 800) S.history.length = 800;
  };
  M.startLearning = function (S, c, reason, days = 7) {
    if (!D.BID_STRATEGIES[c.bidStrategy.type]?.smart && c.type !== 'pmax') return;
    c.learnUntil = S.day + days;
    c.learnReason = reason;
  };

  M.updateCampaign = function (S, c, patch, note) {
    const old = JSON.parse(JSON.stringify(c));
    Object.assign(c, patch);
    if (patch.bidStrategy) {
      const ob = old.bidStrategy, nb = c.bidStrategy;
      if (ob.type !== nb.type) { M.startLearning(S, c, 'Gebotsstrategie geändert', 7); c.rt.lambda = null; }
      else if ((ob.targetCpa && nb.targetCpa && Math.abs(nb.targetCpa / ob.targetCpa - 1) > 0.2) || (ob.targetRoas && nb.targetRoas && Math.abs(nb.targetRoas / ob.targetRoas - 1) > 0.2)) M.startLearning(S, c, 'Zielwert stark geändert', 5);
    }
    if (patch.budget !== undefined && old.budget && Math.abs(patch.budget / old.budget - 1) > 0.5) M.startLearning(S, c, 'Budget stark geändert', 3);
    if (patch.budget !== undefined && patch.budget !== old.budget) c.rt.pot = Math.max(c.rt.pot, old.budget * 0.8);
    M.log(S, 'Kampagne', c.name, note || 'Einstellungen geändert');
  };

  M.setStatus = function (S, kind, ent, status) {
    const names = { enabled: 'aktiviert', paused: 'pausiert', removed: 'entfernt' };
    const old = ent.status;
    ent.status = status;
    const label = ent.name || ent.text || ent.title || (ent.headlines && ent.headlines[0] && ent.headlines[0].t) || ent.id;
    M.log(S, kind, label, `Status: ${names[old] || old} → ${names[status] || status}`);
    if (kind === 'Kampagne' && status === 'enabled' && old === 'paused') { ent.rt.pot = ent.budget; }
  };

  // Gültige Kampagnen-Ziele
  M.validBidStrategies = (type) => Object.entries(D.BID_STRATEGIES).filter(([, v]) => v.types.includes(type)).map(([k]) => k);

  M.bidLabel = function (c) {
    const b = c.bidStrategy, f = U.fmt;
    const n = D.BID_STRATEGIES[b.type]?.name || b.type;
    if (b.type === 'tcpa') return `${n} (${f.eur(b.targetCpa)})`;
    if (b.type === 'troas') return `${n} (${Math.round(b.targetRoas * 100)} %)`;
    if (b.type === 'maxconv' && b.targetCpa) return `${n} (Ziel-CPA ${f.eur(b.targetCpa)})`;
    if (b.type === 'maxvalue' && b.targetRoas) return `${n} (Ziel-ROAS ${Math.round(b.targetRoas * 100)} %)`;
    if (b.type === 'tis') return `${n} (${Math.round(b.targetIs * 100)} %)`;
    if (b.type === 'cpm' && b.cpm) return `${n} (${f.eur(b.cpm)})`;
    if (b.type === 'cpv' && b.cpv) return `${n} (${f.eur(b.cpv)})`;
    if (b.type === 'tcpi') return `${n} (${f.eur(b.tcpi)})`;
    return n;
  };

  // Kampagnenstatus-Text wie in Google Ads
  M.campaignStatus = function (S, c) {
    if (c.status === 'paused') return ['Pausiert', 'muted'];
    if (c.status === 'removed') return ['Entfernt', 'muted'];
    if (c.endDay !== null && c.endDay < S.day) return ['Beendet', 'muted'];
    if (!S.account.paymentOk) return ['Zahlungsproblem', 'bad'];
    const ags = M.agsOf(S, c.id).filter((a) => a.status === 'enabled');
    if (!ags.length && c.type !== 'shopping') return ['Keine aktiven Anzeigengruppen', 'bad'];
    if (['search', 'display', 'video', 'demandgen', 'app', 'pmax'].includes(c.type)) {
      const servable = ags.some((ag) => M.adsOf(S, ag.id).some((a) => M.adServable(S, a)));
      if (!servable) {
        const reviewing = ags.some((ag) => M.adsOf(S, ag.id).some((a) => a.status === 'enabled' && a.reviewUntil > S.day));
        return reviewing ? ['Anzeigen werden geprüft', 'warn'] : ['Keine schaltbaren Anzeigen', 'bad'];
      }
    }
    if (c.type === 'search' && !ags.some((ag) => M.kwsOf(S, ag.id).some((k) => k.status === 'enabled'))) return ['Keine aktiven Keywords', 'bad'];
    if ((c.type === 'shopping' || c.type === 'pmax') && c.type === 'shopping' && !S.products.some((p) => p.status === 'enabled')) return ['Keine Produkte', 'bad'];
    if (c.learnUntil !== null && c.learnUntil > S.day) return ['Lernphase', 'learn'];
    if (c.rt.limited) return ['Eingeschränkt durch Budget', 'warn'];
    if (c.rt.limitedTarget) return ['Eingeschränkt durch Ziel', 'warn'];
    return ['Berechtigt', 'good'];
  };

  M.keywordStatus = function (S, kw) {
    const ag = M.ag(S, kw.adGroupId), c = M.camp(S, ag.campaignId);
    if (kw.status === 'paused') return ['Pausiert', 'muted'];
    if (c.status !== 'enabled') return ['Kampagne pausiert', 'muted'];
    if (ag.status !== 'enabled') return ['Anzeigengruppe pausiert', 'muted'];
    if (kw.rt && kw.rt.lowVol) return ['Geringes Suchvolumen', 'warn'];
    if (kw.rt && kw.rt.belowFirst) return ['Unter Gebot für erste Seite', 'warn'];
    if (kw.rt && kw.rt.dupe) return ['Doppelt / konkurriert', 'warn'];
    return ['Berechtigt', 'good'];
  };

  M.productQuality = function (S, p) {
    const th = M.theme(S, p.theme);
    const tt = new Set(th ? th.kws.flatMap((k) => M.toks(k[0])) : []);
    const titleQ = M.toks(p.title).some((t) => tt.has(t)) ? 1 : 0.85;
    return (p.gtin ? 1 : 0.75) * (0.6 + 0.4 * p.imgQ) * titleQ;
  };
  M.productStatus = function (S, p) {
    if (p.status !== 'enabled') return ['Ausgeschlossen', 'muted'];
    if (!p.stock) return ['Nicht auf Lager', 'bad'];
    if (!p.gtin) return ['Eingeschränkt: GTIN fehlt', 'warn'];
    if (p.price > p.marketPrice * 1.25) return ['Preis nicht wettbewerbsfähig', 'warn'];
    return ['Aktiv', 'good'];
  };

  G.M = M;
})();
