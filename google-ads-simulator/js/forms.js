/* Ads Simulator – Formulare: Kampagnen-Assistent, Bearbeiten, Anzeigen-Editor, Assets, Keywords, Tests, Hilfe */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, R = G.R, UI = G.UI, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc;
  const FORMS = (G.FORMS = {});
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

  // ---------- Gebotsstrategie-Felder ----------
  function bidFields(type, b, ctype) {
    const opts = M.validBidStrategies(ctype).map((k) => `<option value="${k}" ${k === b.type ? 'selected' : ''}>${D.BID_STRATEGIES[k].name}${D.BID_STRATEGIES[k].smart ? ' (Smart Bidding)' : ''}</option>`).join('');
    const n = (name, label, val, hint, step = '0.01') => `<div class="field"><span>${label}</span><input type="number" step="${step}" name="${name}" value="${val ?? ''}">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    let extra = '';
    switch (b.type) {
      case 'manual': extra = '<div class="hint">Gebote legen Sie je Anzeigengruppe/Keyword fest. Gebotsanpassungen (Gerät, Standort, Zeit, Zielgruppe) wirken nur hier.</div>'; break;
      case 'maxclicks': extra = n('maxCpc', 'Max. CPC-Gebotslimit (optional, €)', b.maxCpc, 'Ohne Limit kann Google einzelne teure Klicks kaufen.'); break;
      case 'maxconv': extra = n('targetCpa', 'Ziel-CPA (optional, €)', b.targetCpa, 'Leer lassen: das Budget wird für möglichst viele Conversions ausgeschöpft.'); break;
      case 'tcpa': extra = n('targetCpa', 'Ziel-CPA (€)', b.targetCpa ?? 30, 'Durchschnittliche Kosten pro Conversion, die Smart Bidding anstrebt.'); break;
      case 'maxvalue': extra = n('targetRoas', 'Ziel-ROAS (optional, %)', b.targetRoas ? Math.round(b.targetRoas * 100) : '', 'z. B. 400 % = 4 € Umsatz je 1 € Kosten', '1'); break;
      case 'troas': extra = n('targetRoas', 'Ziel-ROAS (%)', b.targetRoas ? Math.round(b.targetRoas * 100) : 400, 'Break-even-ROAS bei Ihrer Marge: ' + f.pct0(1 / M.ind(APP.S).margin), '1'); break;
      case 'tis': extra = `<div class="row"><div class="field"><span>Ort</span><select name="isLoc"><option value="any" ${b.isLoc === 'any' ? 'selected' : ''}>Beliebige Position</option><option value="top" ${b.isLoc === 'top' ? 'selected' : ''}>Oben auf der Seite</option><option value="abs" ${b.isLoc === 'abs' ? 'selected' : ''}>Ganz oben</option></select></div>${n('targetIs', 'Angestrebter Anteil (%)', Math.round((b.targetIs || 0.8) * 100), '', '1')}${n('maxCpc', 'Max. CPC-Limit (€)', b.maxCpc ?? 3)}</div>`; break;
      case 'cpm': extra = n('cpm', 'Max. vCPM (€ je 1.000 sichtbare Impr.)', b.cpm ?? 4); break;
      case 'cpv': extra = n('cpv', 'Max. CPV (€ pro Aufruf)', b.cpv ?? 0.05); break;
      case 'tcpi': extra = n('tcpi', 'Ziel-Kosten pro Installation (€)', b.tcpi ?? 2.5); break;
    }
    return `<div class="field"><span>Gebotsstrategie</span><select name="bidType" data-chg="bidtype">${opts}</select></div>${extra}`;
  }
  function readBid(root, type) {
    const b = { type, targetCpa: null, targetRoas: null, maxCpc: null, targetIs: 0.8, isLoc: 'top', cpm: null, cpv: null, tcpi: null };
    const num = (n) => UI.num(n, root);
    if (num('targetCpa') !== null) b.targetCpa = num('targetCpa');
    if (num('targetRoas') !== null) b.targetRoas = num('targetRoas') / 100;
    if (num('maxCpc') !== null) b.maxCpc = num('maxCpc');
    if (num('targetIs') !== null) b.targetIs = U.clamp(num('targetIs') / 100, 0.05, 1);
    if (UI.val('isLoc', root)) b.isLoc = UI.val('isLoc', root);
    if (num('cpm') !== null) b.cpm = num('cpm');
    if (num('cpv') !== null) b.cpv = num('cpv');
    if (num('tcpi') !== null) b.tcpi = num('tcpi');
    if (type === 'tcpa' && !(b.targetCpa > 0)) return 'Bitte einen Ziel-CPA angeben.';
    if (type === 'troas' && !(b.targetRoas > 0)) return 'Bitte einen Ziel-ROAS angeben.';
    return b;
  }

  // Textfelder mit Zeichenzähler
  function textRows(prefix, items, max, n, withPin, pinMax) {
    let h = '<div class="hlgrid">';
    for (let i = 0; i < n; i++) {
      const it = items[i] || { t: '', pin: 0 };
      h += `<input type="text" name="${prefix}${i}" value="${esc(it.t)}" maxlength="${max + 10}" data-inp="cc" data-max="${max}" placeholder="${prefix === 'h' ? 'Anzeigentitel' : prefix === 'lh' ? 'Langer Anzeigentitel' : 'Beschreibung'} ${i + 1}"><span class="cc ${it.t.length > max ? 'over' : ''}">${it.t.length}/${max}</span>`;
      h += withPin ? `<select name="${prefix}p${i}"><option value="0">nicht fixiert</option>${Array.from({ length: pinMax }, (_, k) => `<option value="${k + 1}" ${it.pin === k + 1 ? 'selected' : ''}>Position ${k + 1}</option>`).join('')}</select>` : '<span></span>';
    }
    return h + '</div>';
  }
  ACT.inp_cc = (el) => { const cc = el.nextElementSibling; if (cc) { cc.textContent = el.value.length + '/' + el.dataset.max; cc.classList.toggle('over', el.value.length > +el.dataset.max); } };
  function readRows(prefix, n, max, root, withPin) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = (UI.val(prefix + i, root) || '').trim();
      if (!t) continue;
      if (t.length > max) return `„${t}" ist zu lang (max. ${max} Zeichen).`;
      out.push({ t, pin: withPin ? +(UI.val(prefix + 'p' + i, root) || 0) : 0 });
    }
    return out;
  }
  function parseKeywords(text, def) {
    return lines(text).map((l) => {
      if (/^\[.*\]$/.test(l)) return { text: l.slice(1, -1), match: 'exact' };
      if (/^".*"$/.test(l)) return { text: l.slice(1, -1), match: 'phrase' };
      return { text: l.replace(/^\+/, ''), match: def };
    }).filter((k) => U.norm(k.text));
  }

  // ---------- Kampagnen-Assistent ----------
  const GOALS = [['sales', 'Umsätze', '🛍️'], ['leads', 'Leads', '📇'], ['traffic', 'Zugriffe auf die Website', '🖱️'], ['awareness', 'Markenbekanntheit & Reichweite', '📢'], ['app', 'App-Werbung', '📱']];
  const TYPES_FOR_GOAL = { sales: ['search', 'pmax', 'shopping', 'demandgen', 'display', 'video'], leads: ['search', 'pmax', 'demandgen', 'display', 'video'], traffic: ['search', 'pmax', 'demandgen', 'display'], awareness: ['video', 'display', 'demandgen'], app: ['app'] };
  const DEFAULT_BID = { search: 'manual', shopping: 'manual', pmax: 'maxconv', display: 'maxconv', video: 'cpv', demandgen: 'maxconv', app: 'tcpi' };

  ACT.newcampaign = () => {
    const S = APP.S, ind = M.ind(S);
    const th = ind.themes[0];
    APP.draft = {
      step: 1, goal: ind.goal, type: 'search', name: '', budget: M.STARTER_BUDGET[ind.id] || 50,
      bid: { type: 'manual', targetIs: 0.8, isLoc: 'top' }, locs: 'DE', custom: [], partners: true, displayExp: false, endDays: '',
      agName: th.name, kws: th.kws.map((k) => '"' + k[0] + '"').join('\n'), defBid: +(U.avg(th.kws, (k) => k[2]) * S.market.cpcIdx).toFixed(2),
      headlines: [cap(th.kws[0][0]), S.company.brand + ' – Offizielle Seite', cap(th.name) + ' entdecken', 'Jetzt vergleichen', 'Schnell & unkompliziert', 'Top Kundenbewertungen', 'Faire Preise', cap(th.kws[1] ? th.kws[1][0] : th.name)].map((t) => ({ t: t.slice(0, 30), pin: 0 })),
      descriptions: [{ t: `${cap(th.name)} bei ${S.company.brand}: Qualität & Service, die überzeugen.`.slice(0, 90), pin: 0 }, { t: 'Jetzt informieren und von unseren Angeboten profitieren.', pin: 0 }],
      longHeadlines: [{ t: `${cap(th.name)} von ${S.company.brand} – jetzt entdecken`, pin: 0 }], path1: th.id, path2: '',
      themes: [th.id], audiences: [], optTargeting: true, images: 6, logos: true, videos: 1,
      vFormat: 'instream', vQuality: 'ugc', vLen: 20, cta: 'Mehr erfahren', agThemes: ind.themes.map((t) => t.id),
    };
    renderWizard();
  };
  function renderWizard() {
    const S = APP.S, d = APP.draft, ind = M.ind(S);
    const steps = ['Ziel & Typ', 'Einstellungen', d.type === 'search' ? 'Keywords & Anzeigen' : d.type === 'shopping' ? 'Produkte' : d.type === 'pmax' ? 'Asset-Gruppe' : 'Anzeigengruppe & Anzeige', 'Überprüfen'];
    let body = `<div class="steps">${steps.map((s, i) => `<span class="${i + 1 === d.step ? 'on' : ''}">${i + 1}. ${s}</span>`).join('')}</div>`;
    if (d.step === 1) {
      body += `<div class="field"><span>Welches Ziel möchten Sie mit dieser Kampagne erreichen?</span></div><div class="choice">${GOALS.map(([k, n, ic]) => `<button class="opt ${d.goal === k ? 'on' : ''} ${k === 'app' && !ind.hasApp ? 'dis' : ''}" data-act="wzgoal" data-v="${k}"><span class="t">${ic} ${n}</span></button>`).join('')}</div>
        <div class="field" style="margin-top:16px"><span>Kampagnentyp</span></div><div class="choice">${Object.entries(D.CAMPAIGN_TYPES).map(([k, t]) => { const ok = (TYPES_FOR_GOAL[d.goal] || []).includes(k) && (k !== 'shopping' || ind.hasShopping) && (k !== 'app' || ind.hasApp); return `<button class="opt ${d.type === k ? 'on' : ''} ${ok ? '' : 'dis'}" data-act="wztype" data-v="${k}" ${ok ? '' : 'disabled'}><span class="t">${t.icon} ${t.name}</span><span class="d">${t.desc}</span></button>`; }).join('')}</div>`;
    } else if (d.step === 2) {
      body += `<div class="row"><div class="field"><span>Kampagnenname</span><input type="text" name="name" value="${esc(d.name || D.CAMPAIGN_TYPES[d.type].name + ' | ' + (ind.themes.find((t) => t.id === d.themes[0]) || ind.themes[0]).name)}"></div><div class="field"><span>Durchschnittliches Tagesbudget (€)</span><input type="number" name="budget" min="1" step="1" value="${d.budget}"><span class="hint">Google kann an einzelnen Tagen bis zu 2× ausgeben, max. 30,4× pro Monat.</span></div></div>
        <div id="bidbox">${bidFields(d.type, d.bid, d.type)}</div>
        ${d.type === 'search' ? `<div class="field"><span>Werbenetzwerke</span><label class="chk"><input type="checkbox" name="partners" ${d.partners ? 'checked' : ''}> Google-Suchnetzwerk-Partner einschließen</label><label class="chk"><input type="checkbox" name="displayExp" ${d.displayExp ? 'checked' : ''}> Google Displaynetzwerk einschließen (Display-Expansion)</label></div>` : ''}
        <div class="field"><span>Standorte</span><div style="display:flex;gap:14px;flex-wrap:wrap"><label class="chk"><input type="radio" name="locs" value="DE" ${d.locs === 'DE' ? 'checked' : ''}> Deutschland</label><label class="chk"><input type="radio" name="locs" value="DACH" ${d.locs === 'DACH' ? 'checked' : ''}> Deutschland, Österreich, Schweiz</label><label class="chk"><input type="radio" name="locs" value="custom" ${d.locs === 'custom' ? 'checked' : ''}> Eigene Auswahl:</label></div><div class="loclist">${D.LOCATIONS.map((l) => `<label class="chk small"><input type="checkbox" name="loc_${l.id}" ${d.custom.includes(l.id) ? 'checked' : ''}> ${esc(l.name)}</label>`).join('')}</div></div>
        <div class="row"><div class="field"><span>Sprachen</span><select name="lang"><option>Deutsch</option><option>Deutsch, Englisch</option><option>Alle Sprachen</option></select></div><div class="field"><span>Laufzeit (Tage, leer = unbegrenzt)</span><input type="number" name="endDays" min="1" value="${d.endDays}"></div></div>`;
    } else if (d.step === 3) {
      const ths = ind.themes;
      if (d.type === 'search') {
        body += `<div class="row"><div class="field"><span>Name der Anzeigengruppe</span><input type="text" name="agName" value="${esc(d.agName)}"></div>${d.bid.type === 'manual' ? `<div class="field"><span>Standard-Max.-CPC (€)</span><input type="number" step="0.01" name="defBid" value="${d.defBid}"></div>` : ''}</div>
          <div class="field"><span>Keywords (eins pro Zeile) – [genau], "Wortgruppe", weitgehend</span><textarea name="kws" rows="5">${esc(d.kws)}</textarea><span class="hint">Tipp: Thematisch enge Anzeigengruppen (ein Thema) verbessern die Anzeigenrelevanz.</span></div>
          <div class="field"><span>Anzeigentitel (3–15, max. 30 Zeichen)</span>${textRows('h', d.headlines, 30, 15, true, 3)}</div>
          <div class="field"><span>Beschreibungen (2–4, max. 90 Zeichen)</span>${textRows('d', d.descriptions, 90, 4, true, 2)}</div>
          <div class="row"><div class="field"><span>Anzeigenpfad 1</span><input type="text" name="path1" maxlength="15" value="${esc(d.path1)}"></div><div class="field"><span>Anzeigenpfad 2</span><input type="text" name="path2" maxlength="15" value="${esc(d.path2)}"></div></div>`;
      } else if (d.type === 'shopping') {
        body += `<div class="callout">Shopping-Kampagnen nutzen Ihren Merchant-Center-Feed (${S.products.length} Produkte). Keywords sind nicht nötig – Google gleicht Suchanfragen mit Produkttiteln ab.</div><div class="row"><div class="field"><span>Produktgruppe</span><input type="text" name="agName" value="Alle Produkte"></div>${d.bid.type === 'manual' ? `<div class="field"><span>Max. CPC je Produktgruppe (€)</span><input type="number" step="0.01" name="defBid" value="${(d.defBid * 0.6).toFixed(2)}"></div>` : ''}</div>`;
      } else {
        const audList = M.audiences(S);
        const isPmax = d.type === 'pmax', isVideo = d.type === 'video', isApp = d.type === 'app';
        body += `<div class="row"><div class="field"><span>${isPmax ? 'Name der Asset-Gruppe' : 'Name der Anzeigengruppe'}</span><input type="text" name="agName" value="${esc(d.agName)}"></div>${d.bid.type === 'manual' ? `<div class="field"><span>Standard-Max.-CPC (€)</span><input type="number" step="0.01" name="defBid" value="${(d.defBid * 0.5).toFixed(2)}"></div>` : ''}</div>`;
        if (isPmax) body += `<div class="field"><span>Suchthemen (Signale für die Suche)</span><div style="display:flex;gap:12px;flex-wrap:wrap">${ths.map((t) => `<label class="chk"><input type="checkbox" name="th_${t.id}" ${d.agThemes.includes(t.id) ? 'checked' : ''}> ${esc(t.name)}</label>`).join('')}</div></div>`;
        if (!isApp) body += `<div class="field"><span>${isPmax ? 'Zielgruppensignale' : 'Zielgruppen-Segmente'}</span><div class="loclist" style="max-height:160px">${audList.map((a) => `<label class="chk small"><input type="checkbox" name="aud_${a.id}" ${d.audiences.includes(a.id) ? 'checked' : ''}> ${esc(a.name)} <span class="tiny muted">${esc(a.type)}</span></label>`).join('')}</div>${isPmax ? '' : `<label class="chk small" style="margin-top:6px"><input type="checkbox" name="optT" ${d.optTargeting ? 'checked' : ''}> Optimierte Ausrichtung (Google findet weitere passende Nutzer)</label>`}</div>`;
        if (isVideo) {
          body += `<div class="row"><div class="field"><span>Videoformat</span><select name="vFormat"><option value="instream" ${d.vFormat === 'instream' ? 'selected' : ''}>In-Stream (überspringbar)</option><option value="infeed" ${d.vFormat === 'infeed' ? 'selected' : ''}>In-Feed</option><option value="shorts" ${d.vFormat === 'shorts' ? 'selected' : ''}>Shorts</option></select></div><div class="field"><span>Produktion</span><select name="vQuality"><option value="smartphone" ${d.vQuality === 'smartphone' ? 'selected' : ''}>Smartphone-Video (0 €)</option><option value="ugc" ${d.vQuality === 'ugc' ? 'selected' : ''}>Creator/UGC (800 €)</option><option value="pro" ${d.vQuality === 'pro' ? 'selected' : ''}>Professionelle Produktion (4.500 €)</option></select></div><div class="field"><span>Länge (Sek.)</span><input type="number" name="vLen" value="${d.vLen}" min="6" max="180"></div><div class="field"><span>Call-to-Action</span><input type="text" name="cta" maxlength="10" value="${esc(d.cta)}"></div></div>`;
        } else {
          body += `<div class="field"><span>Anzeigentitel (max. 30 Zeichen)</span>${textRows('h', d.headlines, 30, isPmax ? 15 : 5, false)}</div>`;
          if (!isApp) body += `<div class="field"><span>Lange Anzeigentitel (max. 90 Zeichen)</span>${textRows('lh', d.longHeadlines, 90, isPmax ? 3 : 1, false)}</div>`;
          body += `<div class="field"><span>Beschreibungen (max. 90 Zeichen)</span>${textRows('d', d.descriptions, 90, isPmax ? 5 : 4, false)}</div>
            <div class="row"><div class="field"><span>Bilder</span><input type="number" name="images" min="0" max="20" value="${d.images}"><span class="hint">Je mehr Formate, desto mehr Inventar</span></div><div class="field"><span>Videos</span><input type="number" name="videos" min="0" max="5" value="${d.videos}"></div><div class="field"><span>Logo</span><label class="chk"><input type="checkbox" name="logos" ${d.logos ? 'checked' : ''}> vorhanden</label></div></div>`;
        }
      }
    } else {
      const locTxt = d.locs === 'DE' ? 'Deutschland' : d.locs === 'DACH' ? 'DACH' : d.custom.map((id) => D.LOC_BY_ID[id].name).join(', ');
      const bc = { name: d.name, bidStrategy: d.bid };
      body += `<div class="callout good">Fast geschafft! Prüfen Sie Ihre Kampagne. Neue Anzeigen werden ca. 1 Tag geprüft${D.BID_STRATEGIES[d.bid.type]?.smart || d.type === 'pmax' ? '; Smart Bidding startet mit einer Lernphase von ca. 7 Tagen' : ''}.</div>
        <dl class="kv"><dt>Typ</dt><dd>${D.CAMPAIGN_TYPES[d.type].icon} ${D.CAMPAIGN_TYPES[d.type].name}</dd><dt>Name</dt><dd>${esc(d.name)}</dd><dt>Budget</dt><dd>${f.eur(d.budget)}/Tag (≈ ${f.eur0(d.budget * 30.4)}/Monat)</dd><dt>Gebotsstrategie</dt><dd>${esc(M.bidLabel(bc))}</dd><dt>Standorte</dt><dd>${esc(locTxt)}</dd>
        ${d.type === 'search' ? `<dt>Keywords</dt><dd>${parseKeywords(d.kws, 'broad').length}</dd><dt>Anzeigentitel</dt><dd>${d.headlines.length}</dd>` : ''}${d.type === 'video' ? `<dt>Produktionskosten</dt><dd>${f.eur0({ smartphone: 0, ugc: 800, pro: 4500 }[d.vQuality])}</dd>` : ''}</dl>`;
      if (d.type === 'search') { const ad = { type: 'rsa', headlines: d.headlines, descriptions: d.descriptions }; const pol = M.policyCheck(S, ad); if (pol.status !== 'approved') body += `<div class="callout bad" style="margin-top:12px">Richtlinienhinweis: ${pol.reasons.map(esc).join(', ')} → ${pol.status === 'disapproved' ? 'Die Anzeige wird voraussichtlich abgelehnt.' : 'Die Auslieferung wird eingeschränkt.'}</div>`; }
    }
    const footer = `${d.step > 1 ? '<button class="btn" data-act="wzback">Zurück</button>' : '<button class="btn" data-act="mclose">Abbrechen</button>'}<button class="btn primary" data-act="wznext">${d.step === 4 ? 'Kampagne veröffentlichen' : 'Weiter'}</button>`;
    UI.modal('Neue Kampagne erstellen', body, { wide: true, footer, noFocus: d.step === 1 });
  }
  function readWizard() {
    const d = APP.draft, root = document.getElementById('modal-root');
    if (d.step === 2) {
      d.name = (UI.val('name') || '').trim();
      d.budget = UI.num('budget');
      if (!d.name) return 'Bitte einen Kampagnennamen eingeben.';
      if (APP.S.campaigns.some((c) => c.name === d.name && c.status !== 'removed')) return 'Eine Kampagne mit diesem Namen existiert bereits.';
      if (!(d.budget >= 1)) return 'Das Budget muss mindestens 1 € betragen.';
      const b = readBid(root, UI.val('bidType'));
      if (typeof b === 'string') return b;
      d.bid = b;
      d.partners = !!UI.val('partners'); d.displayExp = !!UI.val('displayExp');
      d.locs = root.querySelector('input[name=locs]:checked').value;
      d.custom = D.LOCATIONS.filter((l) => UI.val('loc_' + l.id)).map((l) => l.id);
      if (d.locs === 'custom' && !d.custom.length) return 'Bitte mindestens einen Standort auswählen.';
      d.endDays = UI.val('endDays');
    }
    if (d.step === 3) {
      d.agName = (UI.val('agName') || '').trim() || 'Anzeigengruppe 1';
      if (UI.num('defBid') !== null) d.defBid = UI.num('defBid');
      if (d.type === 'search') {
        d.kws = UI.val('kws');
        if (!parseKeywords(d.kws, 'broad').length) return 'Bitte mindestens ein Keyword eingeben.';
        const h = readRows('h', 15, 30, root, true); if (typeof h === 'string') return h;
        const ds = readRows('d', 4, 90, root, true); if (typeof ds === 'string') return ds;
        if (h.length < 3) return 'Mindestens 3 Anzeigentitel erforderlich.';
        if (ds.length < 2) return 'Mindestens 2 Beschreibungen erforderlich.';
        d.headlines = h; d.descriptions = ds; d.path1 = UI.val('path1') || ''; d.path2 = UI.val('path2') || '';
      } else if (d.type !== 'shopping') {
        const ind = M.ind(APP.S);
        d.audiences = M.audiences(APP.S).filter((a) => UI.val('aud_' + a.id)).map((a) => a.id);
        d.optTargeting = UI.val('optT') !== undefined ? !!UI.val('optT') : true;
        if (d.type === 'pmax') d.agThemes = ind.themes.filter((t) => UI.val('th_' + t.id)).map((t) => t.id);
        if (d.type === 'video') { d.vFormat = UI.val('vFormat'); d.vQuality = UI.val('vQuality'); d.vLen = UI.num('vLen') || 20; d.cta = UI.val('cta') || ''; }
        else {
          const n = d.type === 'pmax' ? 15 : 5;
          const h = readRows('h', n, 30, root, false); if (typeof h === 'string') return h;
          const ds = readRows('d', d.type === 'pmax' ? 5 : 4, 90, root, false); if (typeof ds === 'string') return ds;
          const lh = d.type === 'app' ? [] : readRows('lh', d.type === 'pmax' ? 3 : 1, 90, root, false); if (typeof lh === 'string') return lh;
          if (h.length < 3) return 'Mindestens 3 Anzeigentitel erforderlich.';
          if (ds.length < 1) return 'Mindestens 1 Beschreibung erforderlich.';
          d.headlines = h; d.descriptions = ds; d.longHeadlines = lh;
          d.images = UI.num('images') || 0; d.videos = UI.num('videos') || 0; d.logos = !!UI.val('logos');
          if (d.type !== 'app' && d.images < 1) return 'Bitte mindestens ein Bild hinzufügen.';
        }
      }
    }
    return null;
  }
  ACT.wzgoal = (el, dd) => { const d = APP.draft; if (dd.v === 'app' && !M.ind(APP.S).hasApp) return; d.goal = dd.v; if (!TYPES_FOR_GOAL[d.goal].includes(d.type)) d.type = TYPES_FOR_GOAL[d.goal][0]; d.bid = { type: DEFAULT_BID[d.type], targetIs: 0.8, isLoc: 'top' }; renderWizard(); };
  ACT.wztype = (el, dd) => { const d = APP.draft; d.type = dd.v; d.bid = { type: DEFAULT_BID[d.type], targetIs: 0.8, isLoc: 'top' }; if (d.type === 'pmax') d.agName = 'Asset-Gruppe 1'; renderWizard(); };
  ACT.wzback = () => { readWizard(); APP.draft.step--; renderWizard(); };
  ACT.wznext = () => {
    const err = readWizard();
    if (err) { UI.toast(err, 'bad'); return; }
    const d = APP.draft;
    if (d.step < 4) { d.step++; renderWizard(); return; }
    const c = FORMS.createCampaign(APP.S, d);
    UI.closeModal();
    UI.toast('Kampagne „' + c.name + '" veröffentlicht', 'good');
    APP.scope = { cid: c.id, agid: null };
    UI.go('campaigns');
  };
  ACT.chg_bidtype = (el) => {
    const root = document.getElementById('modal-root');
    const ctype = APP.draft && document.querySelector('.steps') ? APP.draft.type : APP._editType;
    const box = root.querySelector('#bidbox');
    if (box) box.innerHTML = bidFields(ctype, { type: el.value, targetIs: 0.8, isLoc: 'top' }, ctype);
  };

  FORMS.createCampaign = function (S, d) {
    const ind = M.ind(S);
    const locs = d.locs === 'DE' ? D.DE_IDS.slice() : d.locs === 'DACH' ? D.LOCATIONS.map((l) => l.id) : d.custom.slice();
    const c = M.makeCampaign(S, d.type, { name: d.name, budget: d.budget, bidStrategy: d.bid, locations: locs, goal: GOALS.find((g) => g[0] === d.goal)[1] });
    c.networks.partners = d.type === 'search' && d.partners;
    c.networks.display = d.type === 'search' && d.displayExp;
    if (d.endDays) c.endDay = S.day + (+d.endDays) - 1;
    c.display.optimizedTargeting = d.optTargeting !== false;
    S.campaigns.push(c);
    const ag = M.makeAdGroup(S, c, { name: d.agName, defaultBid: d.defBid, slug: d.path1 || '' });
    S.adGroups.push(ag);
    if (d.type === 'search') {
      const seen = new Set();
      for (const k of parseKeywords(d.kws, 'broad')) { const key = U.norm(k.text) + k.match; if (seen.has(key)) continue; seen.add(key); S.keywords.push(M.makeKeyword(S, ag, k.text, k.match)); }
      S.ads.push(M.makeAd(S, ag, { type: 'rsa', headlines: d.headlines, descriptions: d.descriptions, path1: d.path1, path2: d.path2 }));
    } else if (d.type === 'shopping') {
      ag.defaultBid = d.defBid;
    } else {
      const auds = d.audiences.map((id) => ({ id, mode: d.type === 'pmax' ? 'observation' : 'targeting', adj: 0 }));
      c.audiences = auds;
      if (d.type !== 'pmax') c.audMode = auds.length ? 'targeting' : 'observation';
      if (d.type === 'pmax') { ag.themes = d.agThemes; ag.audiences = d.audiences; }
      if (d.type === 'video') {
        S.ads.push(M.makeAd(S, ag, { type: 'video', name: d.agName + ' – Video', format: d.vFormat, quality: d.vQuality, lengthSec: d.vLen, cta: d.cta, headlines: [], descriptions: [] }));
        const cost = { smartphone: 0, ugc: 800, pro: 4500 }[d.vQuality];
        if (cost) R.spend(S, cost, 'Videoproduktion: ' + c.name);
      } else {
        const type = d.type === 'pmax' ? 'assetgroup' : d.type === 'app' ? 'app' : d.type === 'demandgen' ? 'dg' : 'rda';
        S.ads.push(M.makeAd(S, ag, { type, headlines: d.headlines, longHeadlines: d.longHeadlines || [], descriptions: d.descriptions, images: d.images, logos: d.logos ? 1 : 0, videos: d.videos }));
      }
    }
    M.log(S, 'Kampagne', c.name, `Erstellt (${D.CAMPAIGN_TYPES[c.type].name}, ${f.eur(c.budget)}/Tag, ${M.bidLabel(c)})`);
    void ind;
    return c;
  };

  // ---------- Kampagne bearbeiten ----------
  ACT.editcampaign = (el, dd) => {
    const S = APP.S, c = M.camp(S, dd.id);
    APP._editType = c.type;
    APP.draft = null;
    const body = `<div class="row"><div class="field"><span>Kampagnenname</span><input type="text" name="name" value="${esc(c.name)}"></div><div class="field"><span>Tagesbudget (€)</span><input type="number" name="budget" step="1" value="${c.budget}"></div></div>
      <div id="bidbox">${bidFields(c.type, c.bidStrategy, c.type)}</div>
      ${c.type === 'search' ? `<div class="field"><span>Netzwerke</span><label class="chk"><input type="checkbox" name="partners" ${c.networks.partners ? 'checked' : ''}> Suchnetzwerk-Partner</label><label class="chk"><input type="checkbox" name="displayExp" ${c.networks.display ? 'checked' : ''}> Displaynetzwerk (Display-Expansion)</label></div>` : ''}
      ${['display', 'video', 'demandgen', 'pmax'].includes(c.type) ? `<div class="field"><span>Inventar & Brand Safety</span><label class="chk"><input type="checkbox" name="exApps" ${c.display.excludeApps ? 'checked' : ''}> Mobile-App-Inventar ausschließen (weniger Fehlklicks, ca. 35 % weniger Reichweite)</label><label class="chk"><input type="checkbox" name="exSens" ${c.display.excludeSensitive ? 'checked' : ''}> Inhaltsausschlüsse: sensible Inhalte & Ramsch-Websites ausschließen</label></div>` : ''}
      ${['display', 'video', 'demandgen'].includes(c.type) ? `<div class="row"><div class="field"><span>Frequency Capping (Impr. pro Nutzer/Woche)</span><input type="number" name="freq" value="${c.display.freqCap || ''}" placeholder="kein Limit"></div><div class="field"><span>Optimierte Ausrichtung</span><label class="chk"><input type="checkbox" name="optT" ${c.display.optimizedTargeting ? 'checked' : ''}> aktiviert</label></div></div>` : ''}
      ${c.type === 'pmax' ? `<div class="field"><span>Performance Max</span><label class="chk"><input type="checkbox" name="urlExp" ${c.pmax.urlExpansion ? 'checked' : ''}> Final URL-Erweiterung (alle Themen bedienen)</label><label class="chk"><input type="checkbox" name="brandEx" ${c.pmax.brandExclusion ? 'checked' : ''}> Markenausschluss (eigene Markensuchen ausschließen)</label></div>` : ''}
      <div class="row"><div class="field"><span>Enddatum (Tage ab heute, leer = keins)</span><input type="number" name="endDays" value="${c.endDay !== null ? Math.max(1, c.endDay - S.day + 1) : ''}"></div><div class="field"><span>Anzeigenrotation</span><select name="rot"><option value="optimize" ${c.adRotation === 'optimize' ? 'selected' : ''}>Optimieren</option><option value="even" ${c.adRotation === 'even' ? 'selected' : ''}>Nicht optimieren (gleichmäßig)</option></select></div><div class="field"><span>Labels (kommagetrennt)</span><input type="text" name="labels" value="${esc(c.labels.join(', '))}"></div></div>
      <div class="small muted">Wichtige Änderungen (Gebotsstrategie, Zielwerte > 20 %, Budget > 50 %) lösen bei Smart Bidding eine neue Lernphase aus.</div>`;
    UI.modal('Kampagne bearbeiten', body, {
      wide: true,
      onSave: () => {
        const root = document.getElementById('modal-root');
        const b = readBid(root, UI.val('bidType'));
        if (typeof b === 'string') { UI.toast(b, 'bad'); return false; }
        const budget = UI.num('budget');
        if (!(budget >= 1)) { UI.toast('Budget ungültig', 'bad'); return false; }
        const patch = { name: UI.val('name').trim() || c.name, budget, bidStrategy: b, adRotation: UI.val('rot'), labels: UI.val('labels').split(',').map((x) => x.trim()).filter(Boolean) };
        const ed = UI.num('endDays');
        patch.endDay = ed ? S.day + ed - 1 : null;
        if (c.type === 'search') { c.networks.partners = !!UI.val('partners'); c.networks.display = !!UI.val('displayExp'); }
        if (['display', 'video', 'demandgen'].includes(c.type)) { c.display.freqCap = UI.num('freq'); c.display.optimizedTargeting = !!UI.val('optT'); }
        if (c.type === 'pmax') { c.pmax.urlExpansion = !!UI.val('urlExp'); c.pmax.brandExclusion = !!UI.val('brandEx'); }
        if (['display', 'video', 'demandgen', 'pmax'].includes(c.type)) { c.display.excludeApps = !!UI.val('exApps'); c.display.excludeSensitive = !!UI.val('exSens'); }
        const changes = [];
        if (budget !== c.budget) changes.push(`Budget ${f.eur(c.budget)} → ${f.eur(budget)}`);
        if (JSON.stringify(b) !== JSON.stringify(c.bidStrategy)) changes.push('Gebotsstrategie → ' + M.bidLabel({ bidStrategy: b }));
        M.updateCampaign(S, c, patch, changes.join('; ') || 'Einstellungen geändert');
        UI.toast('Gespeichert');
      },
    });
  };
  FORMS.cloneCampaign = function (S, c, name, isTrial) {
    const n = JSON.parse(JSON.stringify(c));
    n.id = M.nid(S, 'cmp'); n.name = name; n.isTrial = !!isTrial; n.created = S.day; n.startDay = S.day;
    n.rt = { pot: c.budget, lambda: c.rt.lambda, lambdaV: c.rt.lambdaV, bias: 1, elig7: [] };
    S.campaigns.push(n);
    const agMap = {};
    for (const ag of M.agsOf(S, c.id)) {
      const na = JSON.parse(JSON.stringify(ag)); delete na.rt;
      na.id = M.nid(S, 'ag'); na.campaignId = n.id; agMap[ag.id] = na.id; S.adGroups.push(na);
      for (const k of M.kwsOf(S, ag.id)) { const nk = { ...k, id: M.nid(S, 'kw'), adGroupId: na.id, rt: undefined }; S.keywords.push(nk); }
      for (const a of M.adsOf(S, ag.id)) { const nad = JSON.parse(JSON.stringify(a)); nad.id = M.nid(S, 'ad'); nad.adGroupId = na.id; S.ads.push(nad); }
    }
    for (const a of S.assets.filter((x) => x.campaignId === c.id && x.status !== 'removed')) S.assets.push({ ...JSON.parse(JSON.stringify(a)), id: M.nid(S, 'as'), campaignId: n.id });
    for (const ng of S.negatives.filter((x) => x.campaignId === c.id)) S.negatives.push({ ...ng, id: M.nid(S, 'ng'), campaignId: n.id });
    for (const l of S.negLists) if (l.campaigns.includes(c.id)) l.campaigns.push(n.id);
    return { camp: n, agMap };
  };
  ACT.copycampaign = (el, dd) => {
    const S = APP.S, c = M.camp(S, dd.id);
    const { camp } = FORMS.cloneCampaign(S, c, c.name + ' (Kopie)', false);
    camp.status = 'paused';
    for (const ad of S.ads) if (M.ag(S, ad.adGroupId).campaignId === camp.id) M.reviewAd(S, ad, true);
    M.log(S, 'Kampagne', camp.name, 'Kopiert von ' + c.name + ' (pausiert)');
    UI.toast('Kampagne kopiert (pausiert)'); UI.render();
  };

  // ---------- Anzeigengruppen ----------
  ACT.newag = () => {
    const S = APP.S;
    const camps = S.campaigns.filter((c) => c.status !== 'removed' && !c.isTrial && c.type !== 'shopping');
    if (!camps.length) { UI.toast('Erstellen Sie zuerst eine Kampagne', 'bad'); return; }
    const ind = M.ind(S);
    UI.modal('Neue Anzeigengruppe', `<div class="field"><span>Kampagne</span><select name="c">${camps.map((c) => `<option value="${c.id}" ${c.id === APP.scope.cid ? 'selected' : ''}>${esc(c.name)} (${D.CAMPAIGN_TYPES[c.type].name})</option>`).join('')}</select></div>
      <div class="row"><div class="field"><span>Name</span><input type="text" name="n" value="${esc(ind.themes[1] ? ind.themes[1].name : 'Neue Gruppe')}"></div><div class="field"><span>Standard-Max.-CPC (€)</span><input type="number" step="0.01" name="b" value="1.00"></div></div>
      <div class="field"><span>Keywords (nur Suche; [genau], "Wortgruppe", weitgehend)</span><textarea name="k" rows="4">${esc((ind.themes[1] || ind.themes[0]).kws.map((k) => '"' + k[0] + '"').join('\n'))}</textarea></div>
      <div class="small muted">Für Such-Anzeigengruppen wird automatisch eine Anzeige mit generierten Assets erstellt, die Sie anschließend anpassen können.</div>`, {
      onSave: () => {
        const c = M.camp(S, UI.val('c'));
        const ag = M.makeAdGroup(S, c, { name: UI.val('n') || 'Anzeigengruppe', defaultBid: UI.num('b') || 1 });
        if (c.type === 'pmax') { ag.themes = ind.themes.map((t) => t.id); }
        S.adGroups.push(ag);
        if (c.type === 'search') {
          for (const k of parseKeywords(UI.val('k'), 'broad')) S.keywords.push(M.makeKeyword(S, ag, k.text, k.match));
          const ad = M.makeAd(S, ag, { type: 'rsa', headlines: [{ t: cap(ag.name).slice(0, 30), pin: 0 }, { t: S.company.brand.slice(0, 30), pin: 0 }, { t: 'Jetzt entdecken', pin: 0 }], descriptions: [{ t: `${cap(ag.name)} bei ${S.company.brand}.`.slice(0, 90), pin: 0 }, { t: 'Jetzt informieren und profitieren.', pin: 0 }] });
          S.ads.push(ad); R.autoHeadlines(S, ad);
        } else {
          const type = c.type === 'pmax' ? 'assetgroup' : c.type === 'video' ? 'video' : c.type === 'app' ? 'app' : c.type === 'demandgen' ? 'dg' : 'rda';
          S.ads.push(M.makeAd(S, ag, type === 'video' ? { type, name: ag.name, format: 'instream', quality: 'smartphone', lengthSec: 20, cta: 'Mehr', headlines: [], descriptions: [] } : { type, headlines: [{ t: cap(ag.name).slice(0, 30), pin: 0 }, { t: S.company.brand, pin: 0 }, { t: 'Jetzt entdecken', pin: 0 }], longHeadlines: [{ t: cap(ag.name) + ' von ' + S.company.brand, pin: 0 }], descriptions: [{ t: 'Entdecken Sie unser Angebot.', pin: 0 }], images: 3, logos: 1, videos: 0 }));
        }
        M.log(S, 'Anzeigengruppe', ag.name, 'Erstellt in ' + c.name);
      },
    });
  };
  ACT.editag = (el, dd) => {
    const S = APP.S, ag = M.ag(S, dd.id), c = M.camp(S, ag.campaignId), ind = M.ind(S);
    UI.modal('Anzeigengruppe bearbeiten', `<div class="row"><div class="field"><span>Name</span><input type="text" name="n" value="${esc(ag.name)}"></div><div class="field"><span>Standard-Max.-CPC (€)</span><input type="number" step="0.01" name="b" value="${ag.defaultBid}"></div></div>
      <div class="field"><span>Finale URL</span><input type="text" name="u" value="${esc(ag.lp.url)}"></div>
      ${c.type === 'pmax' ? `<div class="field"><span>Suchthemen</span><div style="display:flex;gap:12px;flex-wrap:wrap">${ind.themes.map((t) => `<label class="chk"><input type="checkbox" name="th_${t.id}" ${(ag.themes || []).includes(t.id) ? 'checked' : ''}> ${esc(t.name)}</label>`).join('')}</div></div>` : ''}
      ${c.type === 'shopping' ? `<div class="field"><span>Produktgruppe: Themen</span><div style="display:flex;gap:12px;flex-wrap:wrap">${ind.themes.filter((t) => t.products).map((t) => `<label class="chk"><input type="checkbox" name="pt_${t.id}" ${!ag.productThemes || ag.productThemes.includes(t.id) ? 'checked' : ''}> ${esc(t.name)}</label>`).join('')}</div></div>` : ''}
      <div class="small muted">Landingpage: PageSpeed ${ag.lp.speed}/100 · Relevanz ${f.pct0(ag.lp.relevance)} – verbessern unter „Unternehmen & GuV".</div>`, {
      onSave: () => {
        ag.name = UI.val('n') || ag.name; ag.defaultBid = UI.num('b') || ag.defaultBid; ag.lp.url = UI.val('u');
        if (c.type === 'pmax') ag.themes = ind.themes.filter((t) => UI.val('th_' + t.id)).map((t) => t.id);
        if (c.type === 'shopping') { const pt = ind.themes.filter((t) => t.products && UI.val('pt_' + t.id)).map((t) => t.id); ag.productThemes = pt.length === ind.themes.filter((t) => t.products).length ? null : pt; }
        M.log(S, 'Anzeigengruppe', ag.name, 'Bearbeitet');
      },
    });
  };

  // ---------- Anzeigen-Editor ----------
  function adEditorBody(S, ad) {
    if (ad.type === 'rsa') return `<div class="field"><span>Finale URL</span><input type="text" name="url" value="${esc(ad.finalUrl)}"></div><div class="row"><div class="field"><span>Pfad 1</span><input type="text" name="path1" maxlength="15" value="${esc(ad.path1)}"></div><div class="field"><span>Pfad 2</span><input type="text" name="path2" maxlength="15" value="${esc(ad.path2)}"></div></div>
      <div class="field"><span>Anzeigentitel (max. 30 Zeichen, 3–15)</span>${textRows('h', ad.headlines, 30, 15, true, 3)}</div><div class="field"><span>Beschreibungen (max. 90 Zeichen, 2–4)</span>${textRows('d', ad.descriptions, 90, 4, true, 2)}</div>
      <div class="small muted">Richtlinien: keine Ausrufezeichen in Titeln, keine Großbuchstaben-Wörter, keine Telefonnummern, keine unbelegten Superlative („Nr. 1", „bester"), keine fremden Marken.</div>`;
    if (ad.type === 'video') return `<div class="field"><span>Name</span><input type="text" name="name" value="${esc(ad.name)}"></div><div class="row"><div class="field"><span>Format</span><select name="format">${[['instream', 'In-Stream'], ['infeed', 'In-Feed'], ['shorts', 'Shorts']].map(([k, v]) => `<option value="${k}" ${ad.format === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="field"><span>Produktion</span><select name="quality">${[['smartphone', 'Smartphone'], ['ugc', 'Creator/UGC (+800 €)'], ['pro', 'Professionell (+4.500 €)']].map(([k, v]) => `<option value="${k}" ${ad.quality === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="field"><span>Länge (s)</span><input type="number" name="len" value="${ad.lengthSec}"></div><div class="field"><span>CTA</span><input type="text" name="cta" maxlength="10" value="${esc(ad.cta || '')}"></div></div>`;
    const big = ad.type === 'assetgroup';
    return `<div class="field"><span>Anzeigentitel</span>${textRows('h', ad.headlines || [], 30, big ? 15 : 5, false)}</div>${ad.type !== 'app' ? `<div class="field"><span>Lange Anzeigentitel</span>${textRows('lh', ad.longHeadlines || [], 90, big ? 5 : 1, false)}</div>` : ''}<div class="field"><span>Beschreibungen</span>${textRows('d', ad.descriptions || [], 90, big ? 5 : 4, false)}</div>
      <div class="row"><div class="field"><span>Bilder</span><input type="number" name="images" min="0" max="20" value="${ad.images || 0}"></div><div class="field"><span>Videos</span><input type="number" name="videos" min="0" max="5" value="${ad.videos || 0}"></div><div class="field"><span>Logo</span><label class="chk"><input type="checkbox" name="logos" ${ad.logos ? 'checked' : ''}> vorhanden</label></div></div><div class="small muted">Zusätzliche Bilder/Videos verursachen Produktionskosten (Bild 40 €, Video 600 €).</div>`;
  }
  function saveAd(S, ad, isNew) {
    const root = document.getElementById('modal-root');
    if (ad.type === 'rsa') {
      const h = readRows('h', 15, 30, root, true); if (typeof h === 'string') return h;
      const ds = readRows('d', 4, 90, root, true); if (typeof ds === 'string') return ds;
      if (h.length < 3 || ds.length < 2) return 'Mindestens 3 Anzeigentitel und 2 Beschreibungen erforderlich.';
      Object.assign(ad, { headlines: h, descriptions: ds, finalUrl: UI.val('url'), path1: UI.val('path1'), path2: UI.val('path2') });
    } else if (ad.type === 'video') {
      const q = UI.val('quality');
      if (q !== ad.quality) { const cost = { smartphone: 0, ugc: 800, pro: 4500 }[q]; if (cost) R.spend(S, cost, 'Videoproduktion'); }
      Object.assign(ad, { name: UI.val('name'), format: UI.val('format'), quality: q, lengthSec: UI.num('len') || 20, cta: UI.val('cta') });
    } else {
      const big = ad.type === 'assetgroup';
      const h = readRows('h', big ? 15 : 5, 30, root, false); if (typeof h === 'string') return h;
      const ds = readRows('d', big ? 5 : 4, 90, root, false); if (typeof ds === 'string') return ds;
      const lh = ad.type === 'app' ? [] : readRows('lh', big ? 5 : 1, 90, root, false); if (typeof lh === 'string') return lh;
      if (h.length < 3) return 'Mindestens 3 Anzeigentitel erforderlich.';
      const imgs = UI.num('images') || 0, vids = UI.num('videos') || 0;
      const extra = Math.max(0, imgs - (ad.images || 0)) * 40 + Math.max(0, vids - (ad.videos || 0)) * 600;
      if (extra && !isNew) R.spend(S, extra, 'Creatives produziert');
      Object.assign(ad, { headlines: h, descriptions: ds, longHeadlines: lh, images: imgs, videos: vids, logos: UI.val('logos') ? 1 : 0 });
    }
    ad.fat = 0; // aufgefrischtes Creative
    M.reviewAd(S, ad, true);
    return null;
  }
  ACT.editad = (el, dd) => {
    const S = APP.S, ad = M.byId(S.ads, dd.id);
    UI.modal('Anzeige bearbeiten', adEditorBody(S, ad) + '<div class="callout warn" style="margin-top:10px">Nach dem Speichern wird die Anzeige erneut geprüft (ca. 1 Tag) und in dieser Zeit nicht ausgeliefert.</div>', {
      wide: true, onSave: () => { const err = saveAd(S, ad, false); if (err) { UI.toast(err, 'bad'); return false; } M.log(S, 'Anzeige', M.ag(S, ad.adGroupId).name, 'Bearbeitet'); UI.toast('Anzeige gespeichert – wird geprüft'); },
    });
  };
  ACT.newad = () => {
    const S = APP.S;
    const ags = S.adGroups.filter((a) => a.status !== 'removed' && a.kind !== 'productgroup' && !M.camp(S, a.campaignId).isTrial && M.camp(S, a.campaignId).status !== 'removed');
    if (!ags.length) { UI.toast('Keine passende Anzeigengruppe vorhanden', 'bad'); return; }
    const pickAg = APP.scope.agid ? M.ag(S, APP.scope.agid) : null;
    const choose = (ag) => {
      const c = M.camp(S, ag.campaignId);
      const type = { search: 'rsa', pmax: 'assetgroup', video: 'video', app: 'app', demandgen: 'dg', display: 'rda' }[c.type];
      const ad = { id: null, adGroupId: ag.id, type, headlines: [], descriptions: [], longHeadlines: [], finalUrl: ag.lp.url, path1: '', path2: '', images: 3, logos: 1, videos: 0, name: ag.name + ' – Video', format: 'instream', quality: 'smartphone', lengthSec: 20, cta: 'Mehr' };
      UI.modal('Neue Anzeige: ' + esc(ag.name), adEditorBody(S, ad), {
        wide: true, onSave: () => {
          const err = saveAd(S, ad, true); if (err) { UI.toast(err, 'bad'); return false; }
          const real = M.makeAd(S, ag, ad); real.id = M.nid(S, 'ad'); S.ads.push(real);
          M.log(S, 'Anzeige', ag.name, 'Erstellt'); UI.toast('Anzeige erstellt – wird geprüft');
        },
      });
    };
    if (pickAg) return choose(pickAg);
    UI.modal('Anzeigengruppe wählen', `<div class="field"><span>Anzeigengruppe</span><select name="ag">${ags.map((a) => `<option value="${a.id}">${esc(M.camp(S, a.campaignId).name)} › ${esc(a.name)}</option>`).join('')}</select></div>`, { saveLabel: 'Weiter', onSave: () => { const ag = M.ag(S, UI.val('ag')); setTimeout(() => choose(ag), 0); } });
  };

  // ---------- Assets ----------
  const ASSET_FIELDS = {
    sitelink: [['text', 'Linktext (max. 25)', 25], ['d1', 'Beschreibung 1 (optional, 35)', 35], ['d2', 'Beschreibung 2 (optional, 35)', 35]],
    callout: [['text', 'Text (max. 25)', 25]],
    snippet: [['header', 'Header (z. B. Marken, Leistungen, Typen)', 25], ['values', 'Werte (kommagetrennt)', 200]],
    call: [['phone', 'Telefonnummer', 25]],
    image: [['name', 'Bildbeschreibung', 60]],
    price: [['text', 'Preis-Überschrift (z. B. „Ab 49 €")', 25]],
    promotion: [['text', 'Angebot (z. B. „Winter-Sale")', 20], ['pct', 'Rabatt in %', 3]],
    leadform: [['name', 'Formularname', 30]],
    location: [['name', 'Unternehmensprofil', 60]],
    businessname: [['text', 'Unternehmensname', 25]],
  };
  ACT.newasset = () => {
    const S = APP.S;
    const t = APP._assetType || 'sitelink';
    const fields = ASSET_FIELDS[t].map(([k, l, max]) => `<div class="field"><span>${l}</span><input type="text" name="f_${k}" maxlength="${max}"></div>`).join('');
    UI.modal('Asset hinzufügen', `<div class="row"><div class="field"><span>Asset-Typ</span><select name="type" data-chg="assettype">${Object.entries(D.ASSET_TYPES).map(([k, v]) => `<option value="${k}" ${k === t ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div><div class="field"><span>Ebene</span><select name="lvl"><option value="">Konto (alle Kampagnen)</option>${UI.campOpts(APP.scope.cid, (c) => ['search', 'pmax'].includes(c.type))}</select></div></div>${fields}`, {
      onSave: () => {
        const data = {};
        for (const [k] of ASSET_FIELDS[t]) data[k] = (UI.val('f_' + k) || '').trim();
        const main = data.text || data.phone || data.name || data.header;
        if (!main) { UI.toast('Bitte Inhalt eingeben', 'bad'); return false; }
        if (data.pct) data.pct = +data.pct || 10;
        const cid = UI.val('lvl') || null;
        S.assets.push({ id: M.nid(S, 'as'), type: t, level: cid ? 'campaign' : 'account', campaignId: cid, status: 'enabled', data });
        M.log(S, 'Assets', D.ASSET_TYPES[t].name, 'Hinzugefügt: ' + main);
      },
    });
  };
  ACT.chg_assettype = (el) => { APP._assetType = el.value; ACT.newasset(); };

  // ---------- Keywords ----------
  ACT.newkw = () => {
    const S = APP.S;
    const ags = S.adGroups.filter((a) => a.kind === 'standard' && a.status !== 'removed' && !M.camp(S, a.campaignId).isTrial && M.camp(S, a.campaignId).status !== 'removed');
    if (!ags.length) { UI.toast('Erstellen Sie zuerst eine Suchkampagne', 'bad'); return; }
    UI.modal('Keywords hinzufügen', `<div class="field"><span>Anzeigengruppe</span><select name="ag">${ags.map((a) => `<option value="${a.id}" ${a.id === APP.scope.agid ? 'selected' : ''}>${esc(M.camp(S, a.campaignId).name)} › ${esc(a.name)}</option>`).join('')}</select></div>
      <div class="field"><span>Keywords (eins pro Zeile): [genau passend], "passende Wortgruppe", weitgehend passend</span><textarea name="k" rows="7" placeholder="[${esc(M.ind(S).themes[0].kws[0][0])}]"></textarea></div>
      <div class="row"><div class="field"><span>Standard-Option (ohne Klammern)</span><select name="m"><option value="broad">Weitgehend passend</option><option value="phrase">Passende Wortgruppe</option><option value="exact">Genau passend</option></select></div><div class="field"><span>Max. CPC (optional, €)</span><input type="number" step="0.01" name="cpc"></div></div>
      <div class="small muted">Ideen finden Sie im <a data-act="nav" data-v="planner">Keyword-Planer</a>.</div>`, {
      onSave: () => {
        const ag = M.ag(S, UI.val('ag'));
        const list = parseKeywords(UI.val('k'), UI.val('m'));
        if (!list.length) { UI.toast('Bitte Keywords eingeben', 'bad'); return false; }
        const existing = new Set(M.kwsOf(S, ag.id).map((k) => k.text + '|' + k.match));
        let n = 0;
        for (const k of list) { const t = U.norm(k.text); if (existing.has(t + '|' + k.match)) continue; S.keywords.push(M.makeKeyword(S, ag, t, k.match, UI.num('cpc'))); existing.add(t + '|' + k.match); n++; }
        M.log(S, 'Keywords', ag.name, n + ' Keyword(s) hinzugefügt');
        UI.toast(n + ' Keyword(s) hinzugefügt');
      },
    });
  };

  // ---------- Ausschließende Keywords ----------
  ACT.newneg = () => {
    const S = APP.S;
    UI.modal('Ausschließende Keywords hinzufügen', `<div class="field"><span>Hinzufügen zu</span><select name="lvl"><option value="">Konto (alle Kampagnen)</option>${UI.campOpts(APP.scope.cid)}</select></div><div class="field"><span>Begriffe (eins pro Zeile): [genau], "Wortgruppe", weitgehend</span><textarea name="t" rows="6" placeholder="kostenlos&#10;jobs&#10;&quot;was ist&quot;"></textarea></div><div class="small muted">Weitgehend passende ausschließende Keywords blockieren Suchanfragen, die alle Begriffe enthalten (keine Synonyme).</div>`, {
      onSave: () => {
        const cid = UI.val('lvl') || null;
        const list = parseKeywords(UI.val('t'), 'broad');
        for (const k of list) S.negatives.push({ id: M.nid(S, 'ng'), text: U.norm(k.text), match: k.match, campaignId: cid });
        M.log(S, 'Ausschließende Keywords', cid ? M.camp(S, cid).name : 'Konto', list.length + ' hinzugefügt');
      },
    });
  };
  ACT.editneglist = (el, dd) => {
    const S = APP.S;
    const l = dd.id ? M.byId(S.negLists, dd.id) : { id: null, name: 'Irrelevante Begriffe', terms: [], campaigns: [] };
    const camps = S.campaigns.filter((c) => c.status !== 'removed' && !c.isTrial);
    UI.modal(dd.id ? 'Liste bearbeiten' : 'Neue Liste', `<div class="field"><span>Name</span><input type="text" name="n" value="${esc(l.name)}"></div><div class="field"><span>Begriffe</span><textarea name="t" rows="6">${esc(l.terms.map((t) => (t.match === 'exact' ? '[' + t.text + ']' : t.match === 'phrase' ? '"' + t.text + '"' : t.text)).join('\n') || 'jobs\nkostenlos\ngebraucht')}</textarea></div><div class="field"><span>Anwenden auf</span>${camps.map((c) => `<label class="chk"><input type="checkbox" name="c_${c.id}" ${l.campaigns.includes(c.id) ? 'checked' : ''}> ${esc(c.name)}</label>`).join('<br>')}</div>`, {
      onSave: () => {
        l.name = UI.val('n'); l.terms = parseKeywords(UI.val('t'), 'broad').map((k) => ({ text: U.norm(k.text), match: k.match }));
        l.campaigns = camps.filter((c) => UI.val('c_' + c.id)).map((c) => c.id);
        if (!l.id) { l.id = M.nid(S, 'nl'); S.negLists.push(l); }
        M.log(S, 'Ausschließende Keywords', 'Liste ' + l.name, 'Gespeichert (' + l.terms.length + ' Begriffe)');
      },
    });
  };

  // ---------- Tests ----------
  ACT.newexp = () => {
    const S = APP.S;
    const running = new Set(S.experiments.filter((x) => x.status === 'running').map((x) => x.baseId));
    const camps = S.campaigns.filter((c) => c.type === 'search' && c.status === 'enabled' && !c.isTrial && !running.has(c.id));
    if (!camps.length) { UI.toast('Keine aktive Suchkampagne ohne laufenden Test vorhanden', 'bad'); return; }
    APP.draft = null; APP._editType = 'search';
    UI.modal('Benutzerdefinierten Test erstellen', `<div class="field"><span>Basiskampagne</span><select name="c">${camps.map((c) => `<option value="${c.id}">${esc(c.name)} – ${esc(M.bidLabel(c))}</option>`).join('')}</select></div>
      <div class="row"><div class="field"><span>Testname</span><input type="text" name="n" value="Test: Smart Bidding"></div><div class="field"><span>Traffic-Aufteilung Test (%)</span><input type="number" name="s" min="10" max="90" value="50"></div></div>
      <div class="field"><span>Was soll getestet werden?</span><select name="kind" data-chg="expkind"><option value="bid">Gebotsstrategie</option><option value="lp">Neue Landingpage (schneller & relevanter)</option><option value="ads">Anzeigentexte (automatisch generierte Assets)</option><option value="broad">Weitgehend passende Keywords</option></select></div>
      <div id="expbid">${bidFields('search', { type: 'tcpa', targetCpa: 30 }, 'search')}</div>`, {
      wide: true,
      onSave: () => {
        const base = M.camp(S, UI.val('c'));
        const kind = UI.val('kind');
        const split = U.clamp((UI.num('s') || 50) / 100, 0.1, 0.9);
        let bid = null;
        if (kind === 'bid') { bid = readBid(document.getElementById('modal-root'), UI.val('bidType')); if (typeof bid === 'string') { UI.toast(bid, 'bad'); return false; } }
        const { camp: trial, agMap } = FORMS.cloneCampaign(S, base, base.name + ' [Test]', true);
        const x = { id: M.nid(S, 'x'), name: UI.val('n') || 'Test', baseId: base.id, trialId: trial.id, split, startDay: S.day, endDay: null, status: 'running', kind, origBudget: base.budget, bid, agMap };
        trial.budget = +(x.origBudget * split).toFixed(2);
        base.budget = +(x.origBudget * (1 - split)).toFixed(2);
        base.rt.pot = base.budget; trial.rt.pot = trial.budget;
        if (kind === 'bid') { trial.bidStrategy = bid; trial.rt.lambda = null; M.startLearning(S, trial, 'Test gestartet', 7); x.desc = 'Gebotsstrategie: ' + M.bidLabel(trial); }
        if (kind === 'lp') { for (const ag of M.agsOf(S, trial.id)) { ag.lp.speed = Math.min(98, ag.lp.speed + 22); ag.lp.relevance = Math.min(0.97, ag.lp.relevance + 0.15); } R.spend(S, 800, 'Landingpage-Variante für Test'); x.desc = 'Neue Landingpage-Variante (PageSpeed +22, Relevanz +15 %)'; }
        if (kind === 'ads') { for (const ag of M.agsOf(S, trial.id)) for (const ad of M.adsOf(S, ag.id)) if (ad.type === 'rsa') R.autoHeadlines(S, ad); x.desc = 'Anzeigentexte mit automatisch generierten Assets'; }
        if (kind === 'broad') { for (const ag of M.agsOf(S, trial.id)) for (const k of M.kwsOf(S, ag.id)) k.match = 'broad'; x.desc = 'Alle Keywords weitgehend passend'; }
        S.experiments.push(x);
        M.log(S, 'Test', x.name, 'Gestartet: ' + x.desc);
        UI.toast('Test gestartet', 'good');
      },
    });
  };
  ACT.chg_expkind = (el) => { const b = document.getElementById('expbid'); if (b) b.style.display = el.value === 'bid' ? '' : 'none'; };
  FORMS.endExperiment = function (S, id, apply) {
    const x = M.byId(S.experiments, id);
    const base = M.camp(S, x.baseId), trial = M.camp(S, x.trialId);
    const go = () => {
      if (apply) {
        if (x.kind === 'bid') { M.updateCampaign(S, base, { bidStrategy: { ...trial.bidStrategy } }, 'Test übernommen: ' + M.bidLabel(trial)); base.rt.lambda = trial.rt.lambda; }
        const bAgs = M.agsOf(S, base.id), tAgs = M.agsOf(S, trial.id);
        bAgs.forEach((ag, i) => {
          const ta = tAgs[i]; if (!ta) return;
          if (x.kind === 'lp') ag.lp = { ...ta.lp };
          if (x.kind === 'ads') { const tads = M.adsOf(S, ta.id); M.adsOf(S, ag.id).forEach((ad, j) => { if (tads[j]) { ad.headlines = JSON.parse(JSON.stringify(tads[j].headlines)); ad.descriptions = JSON.parse(JSON.stringify(tads[j].descriptions)); M.reviewAd(S, ad, true); } }); }
          if (x.kind === 'broad') for (const k of M.kwsOf(S, ag.id)) k.match = 'broad';
        });
      }
      base.budget = x.origBudget; base.rt.pot = x.origBudget;
      trial.status = 'removed';
      x.status = apply ? 'applied' : 'ended'; x.endDay = S.day - 1;
      M.log(S, 'Test', x.name, apply ? 'Übernommen' : 'Beendet');
    };
    UI.confirm(apply ? 'Test übernehmen?' : 'Test beenden?', apply ? 'Die Änderungen des Test-Arms werden in die Basiskampagne übernommen und der Test beendet.' : 'Der Test wird beendet; die Basiskampagne erhält wieder das volle Budget.', go, apply ? 'Übernehmen' : 'Beenden');
  };

  // ---------- Benachrichtigungen & Hilfe ----------
  ACT.alerts = (el) => {
    const S = APP.S;
    const list = S.alerts.slice(0, 40).map((a) => `<li><span class="sev ${a.level}"></span><span class="when">${U.fmtShort(U.dayToDate(S.startDate, a.day))}</span><span class="what small">${esc(a.text)}</span></li>`).join('');
    UI.popover(el, `<div class="ph">Benachrichtigungen <a data-act="alertsread">Alle als gelesen markieren</a></div><ul class="feed">${list || '<li class="muted">Keine Benachrichtigungen</li>'}</ul>`);
  };
  ACT.alertsread = () => { APP.alertsSeen = APP.S.day + 1; UI.closePopover(); UI.renderTop(); };
  ACT.help = () => {
    UI.modal('So funktioniert der Simulator', `
      <h3>Steuerung</h3><p class="small">▶ startet/pausiert die Zeit (Leertaste). Geschwindigkeit 1×–Max. „+1T/+7T/+30T" simulieren gezielt Tage. Jeder Tag wird stündlich mit tausenden Auktionen berechnet.</p>
      <h3>Auktion & Ad Rank</h3><p class="small">Für jede Suchanfrage findet eine Auktion statt: <b>Ad Rank = Gebot × Qualität × Assets × Kontext</b> (Gerät, Standort, Uhrzeit, Nutzersignale). Bis zu 4 Anzeigen oben, 3 unten. Sie zahlen nur so viel, wie nötig ist, um den Ad Rank des Nächsten zu schlagen (Zweitpreis). Ein hoher Qualitätsfaktor senkt Ihre Klickpreise deutlich.</p>
      <h3>Qualitätsfaktor</h3><p class="small">Erwartete CTR (aus Ihrer echten Klickrate), Anzeigenrelevanz (Keyword im Anzeigentitel, enge Themen) und Landingpage-Erfahrung (Geschwindigkeit, Relevanz, Mobil).</p>
      <h3>Smart Bidding</h3><p class="small">Ziel-CPA/ROAS & Co. schätzen die Conversion-Wahrscheinlichkeit jeder Auktion – inkl. Signalen, die manuelle Gebote nicht sehen (z. B. Kaufabsicht, Remarketing). Nach Änderungen gibt es eine Lernphase mit schwankender Leistung. Ohne Conversion-Daten (z. B. Tracking-Ausfall) bietet Smart Bidding schlecht.</p>
      <h3>Budget</h3><p class="small">Google verteilt das Tagesbudget über den Tag (Pacing) und darf an einzelnen Tagen bis zu 2× ausgeben, im Monat max. 30,4×. „Eingeschränkt durch Budget" = Sie verpassen Auktionen.</p>
      <h3>Markt & Wettbewerb</h3><p class="small">Mitbewerber mit eigener KI passen Gebote und Budgets an (profitorientiert, aggressiv, sprunghaft …), steigen ein oder gehen pleite. Saisonalität, Trends, CPC-Inflation, Kalenderereignisse (Black Week, Weihnachten …) und Zufallsereignisse (Rabattschlachten, Lieferengpässe, Serverausfälle, Tracking-Fehler, Core Updates, Konjunktur) verändern den Markt.</p>
      <h3>Zusätzliche Realismus-Faktoren</h3><p class="small"><b>Creative-Ermüdung:</b> Anzeigen verlieren mit der Zeit an Wirkung – regelmäßig auffrischen. <b>Inkrementalität:</b> Markensuchen landen auch organisch bei Ihnen; Brand-Anzeigen lohnen sich vor allem, wenn Mitbewerber auf Ihre Marke bieten. <b>Junk-Inventar:</b> Display/PMax erzeugen viele Fehlklicks in Mobile-Apps; Inhaltsausschlüsse verhindern Brand-Safety-Vorfälle. <b>Gegenreaktionen:</b> Wer dauerhaft oben steht, provoziert höhere Gebote der Konkurrenz. <b>Zielvorgaben:</b> Die Geschäftsleitung gibt ein Monatsbudget und Quartalsziele vor – Überschreitungen werden abgezogen, verfehlte Quartale kosten Budget.</p>
      <h3>Messung</h3><p class="small">Conversions kommen verzögert und werden wegen Cookie-Einwilligung nur teilweise erfasst. Im Bereich „Unternehmen & GuV" sehen Sie den <b>tatsächlichen</b> Erfolg. Ziel: Gewinn maximieren, nicht nur Klicks.</p>`, { wide: true, footer: '<button class="btn primary" data-act="mclose">Los geht\'s</button>' });
  };
})();
