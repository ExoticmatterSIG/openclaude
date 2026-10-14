/* Ads Simulator – Ansichten: Zielgruppen, Demografie, Standorte, Werbezeitplaner, Geräte */
(function () {
  const G = globalThis.GA;
  const U = G.U, D = G.D, M = G.M, E = G.E, C = G.C, UI = G.UI, V = G.V, ACT = G.ACT, APP = G.APP;
  const f = U.fmt, esc = U.esc, I = E.I;

  const adjInput = (act, data, v) => `<input class="inline" style="width:64px" data-chg="${act}" ${data} value="${v}"> %`;
  const needCamp = (txt) => `<div class="callout">Wählen Sie oben eine Kampagne aus, um ${txt} zu bearbeiten. Die Tabelle zeigt sonst die Summe aller Kampagnen.</div>`;
  const sumDim = (dim, camps, suffix) => { const v = E.zero(); for (const c of camps) E.add(v, UI.sum(dim, c.id + '~' + suffix)); return v; };

  // ---------- Zielgruppen ----------
  V.audiences = {
    render() {
      const S = APP.S;
      const auds = M.audiences(S);
      const byId = Object.fromEntries(auds.map((a) => [a.id, a]));
      const camps = UI.scopeCamps();
      const rows = [];
      for (const c of camps) for (const a of c.audiences) {
        const def = byId[a.id]; if (!def) continue;
        rows.push({ id: c.id + '~' + a.id, c, a, def, m: UI.m('aud', c.id + '~' + a.id) });
      }
      const monthly = U.sum(S.queries, (q) => q.vol) * 3;
      const sizeOf = (a) => (a.size !== undefined ? a.size : Math.round((a.share || 0) * monthly / 100) * 100);
      const table = UI.table('auds', [
        { k: 'name', l: 'Segment', f: (r) => `<b>${esc(r.def.name)}</b><div class="tiny muted">${esc(r.def.type)}</div>`, sort: (r) => r.def.name },
        { k: 'camp', l: 'Kampagne', f: (r) => UI.campLink(r.c), sort: (r) => r.c.name },
        { k: 'mode', l: 'Ausrichtung', f: (r) => `<select data-chg="audmode" data-c="${r.c.id}" data-a="${r.a.id}"><option value="observation" ${r.a.mode === 'observation' ? 'selected' : ''}>Beobachtung</option><option value="targeting" ${r.a.mode === 'targeting' ? 'selected' : ''}>Ausrichtung</option></select>`, sort: (r) => r.a.mode },
        { k: 'adj', l: 'Gebotsanpassung', num: true, f: (r) => adjInput('audadj', `data-c="${r.c.id}" data-a="${r.a.id}"`, r.a.adj || 0), sort: (r) => r.a.adj },
        { k: 'size', l: 'Größe (geschätzt)', num: true, f: (r) => f.compact(sizeOf(r.def)), sort: (r) => sizeOf(r.def) },
        ...UI.mcols(['imp', 'clk', 'ctr', 'cost', 'conv', 'cvr', 'cpa']),
        { k: 'act', l: '', nosort: true, f: (r) => `<button class="btn sm ghost danger" data-act="removeaud" data-c="${r.c.id}" data-a="${r.a.id}">🗑</button>` },
      ], rows, { empty: 'Keine Zielgruppen-Segmente zugewiesen. Fügen Sie Segmente aus dem Katalog unten hinzu.' });
      const catalog = UI.table('audcat', [
        { k: 'name', l: 'Segment', f: (r) => `<b>${esc(r.a.name)}</b>${r.a.terms ? `<div class="tiny muted">${esc(r.a.terms.join(', '))}</div>` : ''}`, sort: (r) => r.a.name },
        { k: 'type', l: 'Typ', f: (r) => esc(r.a.type), sort: (r) => r.a.type },
        { k: 'size', l: 'Größe', num: true, f: (r) => (r.a.type === 'Ihre Daten' ? f.int(sizeOf(r.a)) + ' Nutzer' : f.compact(sizeOf(r.a))), sort: (r) => sizeOf(r.a) },
        { k: 'cvr', l: 'Conv.-Potenzial (Sim)', f: (r) => `<span class="small">×${f.num2(r.a.cvr)}</span>`, sort: (r) => r.a.cvr },
        { k: 'act', l: '', nosort: true, f: (r) => `<button class="btn sm" data-act="addaud" data-a="${r.a.id}">Hinzufügen</button>` },
      ], auds.map((a) => ({ id: a.id, a })), {});
      return UI.head('Zielgruppen', '<button class="btn" data-act="newsegment">＋ Benutzerdefiniertes Segment</button>')
        + '<div class="callout"><b>Beobachtung</b> erfasst Daten und erlaubt Gebotsanpassungen, ohne die Reichweite einzuschränken (empfohlen für Suche). <b>Ausrichtung</b> beschränkt die Auslieferung auf das Segment (typisch für Display/Video). Remarketing-Listen wachsen mit Ihren Website-Besuchern.</div>'
        + UI.card('Zugewiesene Segmente', table, { flush: true }) + UI.card('Zielgruppen-Katalog', catalog, { flush: true });
    },
  };
  const campAud = (d) => { const c = M.camp(APP.S, d.c); return [c, c.audiences.find((a) => a.id === d.a)]; };
  ACT.chg_audmode = (el, d) => { const [c, a] = campAud(d); a.mode = el.value; if (el.value === 'targeting') c.audMode = 'targeting'; else if (!c.audiences.some((x) => x.mode === 'targeting')) c.audMode = 'observation'; M.log(APP.S, 'Zielgruppen', c.name, 'Ausrichtung geändert: ' + el.value); };
  ACT.chg_audadj = (el, d) => { const [c, a] = campAud(d); a.adj = U.clamp(parseFloat(el.value) || 0, -90, 900); M.log(APP.S, 'Zielgruppen', c.name, 'Gebotsanpassung ' + a.adj + ' %'); };
  ACT.removeaud = (el, d) => { const [c] = campAud(d); c.audiences = c.audiences.filter((a) => a.id !== d.a); M.log(APP.S, 'Zielgruppen', c.name, 'Segment entfernt'); UI.render(); };
  ACT.addaud = (el, d) => {
    const S = APP.S, a = M.audiences(S).find((x) => x.id === d.a);
    UI.modal('Segment hinzufügen: ' + esc(a.name), `<div class="field"><span>Kampagne</span><select name="c">${UI.campOpts(APP.scope.cid)}</select></div><div class="row"><div class="field"><span>Ausrichtung</span><select name="mode"><option value="observation">Beobachtung</option><option value="targeting">Ausrichtung</option></select></div><div class="field"><span>Gebotsanpassung (%)</span><input type="number" name="adj" value="0" min="-90" max="900"></div></div>`, {
      onSave: () => {
        const c = M.camp(S, UI.val('c'));
        if (!c) return false;
        if (c.audiences.some((x) => x.id === a.id)) { UI.toast('Segment ist bereits zugewiesen', 'bad'); return false; }
        c.audiences.push({ id: a.id, mode: UI.val('mode'), adj: UI.num('adj') || 0 });
        if (UI.val('mode') === 'targeting') c.audMode = 'targeting';
        M.log(S, 'Zielgruppen', c.name, 'Segment hinzugefügt: ' + a.name);
      },
    });
  };
  ACT.newsegment = () => {
    const S = APP.S;
    UI.modal('Benutzerdefiniertes Segment', `<div class="field"><span>Name</span><input type="text" name="n" value="Interessenten ${esc(M.ind(S).themes[0].name)}"></div><div class="field"><span>Personen, die nach diesen Begriffen gesucht haben (ein Begriff pro Zeile)</span><textarea name="t" rows="5">${esc(M.ind(S).themes[0].kws.map((k) => k[0]).join('\n'))}</textarea></div>`, {
      onSave: () => {
        const terms = UI.val('t').split('\n').map((x) => x.trim()).filter(Boolean);
        const themes = [...new Set(terms.map((t) => M.kwTheme(S, t)).filter((t) => t && t[0] !== '_'))];
        const tot = U.sum(S.queries, (q) => q.vol);
        const share = U.clamp(U.sum(S.queries.filter((q) => themes.includes(q.theme)), (q) => q.vol) / tot * 0.35, 0.005, 0.25);
        S.customAudiences.push({ id: M.nid(S, 'cs'), name: UI.val('n'), terms, themes, share });
        M.log(S, 'Zielgruppen', UI.val('n'), 'Benutzerdefiniertes Segment erstellt');
      },
    });
  };

  // ---------- Demografie ----------
  V.demographics = {
    render() {
      const S = APP.S, camps = UI.scopeCamps(), c = APP.scope.cid && M.camp(S, APP.scope.cid);
      const ageRows = D.AGES.map((name, i) => ({ id: 'a' + i, name, i, m: E.derive(sumDim('age', camps, i)) }));
      const genRows = D.GENDERS.map((g) => ({ id: g.id, name: g.name, g: g.id, m: E.derive(sumDim('gen', camps, g.id)) }));
      const edit = (kind, key) => {
        if (!c) return '<span class="muted small">–</span>';
        const v = kind === 'age' ? c.demo.age[key] : c.demo.gender[key];
        return v <= -100 ? `<button class="btn sm" data-act="demoex" data-k="${kind}" data-i="${key}">Ausschluss aufheben</button>` : `${adjInput('demoadj', `data-k="${kind}" data-i="${key}"`, v)} <button class="btn sm ghost" data-act="demoex" data-k="${kind}" data-i="${key}" title="Ausschließen">⊘</button>`;
      };
      const st = (kind, key) => (c && (kind === 'age' ? c.demo.age[key] : c.demo.gender[key]) <= -100 ? UI.pill(['Ausgeschlossen', 'bad']) : UI.pill(['Aktiviert', 'good']));
      const mc = UI.mcols(['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa']);
      const ageT = UI.table('age', [{ k: 'name', l: 'Alter', sort: (r) => r.i }, { k: 'st', l: 'Status', f: (r) => st('age', r.i), nosort: true }, { k: 'adj', l: 'Gebotsanpassung', f: (r) => edit('age', r.i), nosort: true }, ...mc], ageRows, {});
      const genT = UI.table('gen', [{ k: 'name', l: 'Geschlecht' }, { k: 'st', l: 'Status', f: (r) => st('gender', r.g), nosort: true }, { k: 'adj', l: 'Gebotsanpassung', f: (r) => edit('gender', r.g), nosort: true }, ...mc], genRows, {});
      const chart = C.bars({ items: ageRows.map((r, i) => ({ label: r.name, value: r.m.conv, color: C.SERIES[i % 6] })), fmt: f.num1, height: 180 });
      return UI.head('Demografie') + (c ? '' : needCamp('demografische Gebotsanpassungen und Ausschlüsse'))
        + `<div class="grid g21"><div>${UI.card('Alter', ageT, { flush: true })}${UI.card('Geschlecht', genT, { flush: true })}</div><div>${UI.card('Conversions nach Alter', chart)}</div></div>`;
    },
  };
  ACT.chg_demoadj = (el, d) => { const c = M.camp(APP.S, APP.scope.cid); const v = U.clamp(parseFloat(el.value) || 0, -90, 900); if (d.k === 'age') c.demo.age[+d.i] = v; else c.demo.gender[d.i] = v; M.log(APP.S, 'Demografie', c.name, `Gebotsanpassung ${d.k} ${d.i}: ${v} %`); };
  ACT.demoex = (el, d) => { const c = M.camp(APP.S, APP.scope.cid); const obj = d.k === 'age' ? c.demo.age : c.demo.gender; const key = d.k === 'age' ? +d.i : d.i; obj[key] = obj[key] <= -100 ? 0 : -100; M.log(APP.S, 'Demografie', c.name, (obj[key] <= -100 ? 'Ausgeschlossen: ' : 'Wieder aktiviert: ') + (d.k === 'age' ? D.AGES[key] : key)); UI.renderMain(true); };

  // ---------- Standorte ----------
  V.locations = {
    render() {
      const S = APP.S, camps = UI.scopeCamps(), c = APP.scope.cid && M.camp(S, APP.scope.cid);
      const rows = D.LOCATIONS.map((l) => {
        const tgt = c ? c.locations.find((x) => x.id === l.id) : null;
        const ex = c ? c.excludedLocs.includes(l.id) : false;
        return { id: l.id, l, tgt, ex, m: E.derive(sumDim('loc', camps, l.id)) };
      });
      const cols = [
        { k: 'name', l: 'Standort', f: (r) => `<b>${esc(r.l.name)}</b> <span class="tiny muted">${r.l.country}</span>`, sort: (r) => r.l.name },
        { k: 'st', l: 'Ausrichtung', f: (r) => (!c ? '' : r.ex ? `<button class="btn sm" data-act="locstate" data-id="${r.l.id}" data-s="none">Ausgeschlossen ✕</button>` : r.tgt ? `<button class="btn sm primary" data-act="locstate" data-id="${r.l.id}" data-s="ex">Ausgerichtet ✓</button>` : `<button class="btn sm" data-act="locstate" data-id="${r.l.id}" data-s="tgt">Hinzufügen</button>`), sort: (r) => (r.tgt ? 2 : r.ex ? 0 : 1) },
        { k: 'adj', l: 'Gebotsanpassung', f: (r) => (c && r.tgt ? adjInput('locadj', `data-id="${r.l.id}"`, r.tgt.adj) : '<span class="muted small">–</span>'), nosort: true },
        { k: 'pop', l: 'Anteil Suchvolumen', num: true, f: (r) => f.pct(r.l.w / 1.21, 1), sort: (r) => r.l.w },
        { k: 'cpcf', l: 'CPC-Niveau (Sim)', num: true, f: (r) => '×' + f.num2(r.l.cpc), sort: (r) => r.l.cpc },
        ...UI.mcols(['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'roas']),
      ];
      const opt = c ? `<div class="card"><div class="bd" style="padding:12px 16px;display:flex;gap:16px;flex-wrap:wrap;align-items:center"><b>Standortoptionen:</b><label class="chk"><input type="radio" name="lo" data-chg="locopt" value="presence" ${c.locOption === 'presence' ? 'checked' : ''}> Präsenz: Personen an oder regelmäßig an Ihren Zielorten (empfohlen)</label><label class="chk"><input type="radio" name="lo" data-chg="locopt" value="interest" ${c.locOption === 'interest' ? 'checked' : ''}> Präsenz oder Interesse</label><span style="margin-left:auto"><button class="btn sm" data-act="locall" data-v="DE">Ganz Deutschland</button> <button class="btn sm" data-act="locall" data-v="DACH">DACH</button></span></div></div>` : needCamp('Standorte und Gebotsanpassungen');
      const top = rows.filter((r) => r.m.cost > 0).sort((a, b) => b.m.cost - a.m.cost).slice(0, 10);
      return UI.head('Standorte') + opt + `<div class="grid g21"><div>${UI.card('Standorte', UI.table('locs', cols, rows, { defaultSort: { k: 'pop', dir: 'desc' } }), { flush: true })}</div><div>${UI.card('Kosten nach Region', top.length ? C.bars({ horizontal: true, items: top.map((r) => ({ label: r.l.name, value: r.m.cost })), fmt: f.eur0, height: 34 * top.length + 20 }) : '<div class="muted">Noch keine Daten.</div>')}</div></div>`;
    },
  };
  ACT.locstate = (el, d) => {
    const S = APP.S, c = M.camp(S, APP.scope.cid);
    c.locations = c.locations.filter((x) => x.id !== d.id); c.excludedLocs = c.excludedLocs.filter((x) => x !== d.id);
    if (d.s === 'tgt') c.locations.push({ id: d.id, adj: 0 });
    if (d.s === 'ex') c.excludedLocs.push(d.id);
    if (!c.locations.length) { c.locations.push({ id: d.id, adj: 0 }); c.excludedLocs = c.excludedLocs.filter((x) => x !== d.id); UI.toast('Mindestens ein Standort muss ausgerichtet sein', 'bad'); }
    M.log(S, 'Standorte', c.name, `${D.LOC_BY_ID[d.id].name}: ${d.s === 'tgt' ? 'hinzugefügt' : d.s === 'ex' ? 'ausgeschlossen' : 'entfernt'}`);
    UI.renderMain(true);
  };
  ACT.chg_locadj = (el, d) => { const c = M.camp(APP.S, APP.scope.cid); const l = c.locations.find((x) => x.id === d.id); l.adj = U.clamp(parseFloat(el.value) || 0, -90, 900); M.log(APP.S, 'Standorte', c.name, `Gebotsanpassung ${D.LOC_BY_ID[d.id].name}: ${l.adj} %`); };
  ACT.chg_locopt = (el) => { const c = M.camp(APP.S, APP.scope.cid); c.locOption = el.value; M.log(APP.S, 'Standorte', c.name, 'Standortoption: ' + el.value); };
  ACT.locall = (el, d) => { const c = M.camp(APP.S, APP.scope.cid); const ids = d.v === 'DE' ? D.DE_IDS : D.LOCATIONS.map((l) => l.id); c.locations = ids.map((id) => ({ id, adj: (c.locations.find((x) => x.id === id) || {}).adj || 0 })); c.excludedLocs = []; M.log(APP.S, 'Standorte', c.name, 'Ausrichtung: ' + d.v); UI.renderMain(true); };

  // ---------- Werbezeitplaner (wie Google Ads: Zeitplan-Einträge + interaktives Raster + Berichte) ----------
  const DAYSETS = [['all', 'Alle Tage', [0, 1, 2, 3, 4, 5, 6]], ['wd', 'Montag–Freitag', [0, 1, 2, 3, 4]], ['we', 'Samstag–Sonntag', [5, 6]]].concat(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((n, i) => ['d' + i, n, [i]]));
  const hh = (h) => String(h).padStart(2, '0') + ':00';
  // Raster (7×24) in Einträge zerlegen: zusammenhängende Stunden mit gleicher Anpassung, gleiche Tage zusammengefasst
  function schedEntries(sch) {
    if (!sch) return [];
    const runs = [];
    for (let d = 0; d < 7; d++) {
      let h = 0;
      while (h < 24) {
        if (sch[d][h] === null) { h++; continue; }
        const adj = sch[d][h]; let e = h;
        while (e < 24 && sch[d][e] === adj) e++;
        runs.push({ d, from: h, to: e, adj }); h = e;
      }
    }
    const groups = new Map();
    for (const r of runs) { const k = `${r.from}-${r.to}-${r.adj}`; if (!groups.has(k)) groups.set(k, { from: r.from, to: r.to, adj: r.adj, days: [] }); groups.get(k).days.push(r.d); }
    const out = [];
    for (const g of groups.values()) {
      let rest = g.days.slice();
      for (const [id, name, days] of DAYSETS.slice(0, 3)) if (days.every((x) => rest.includes(x))) { out.push({ ...g, set: id, name, days }); rest = rest.filter((x) => !days.includes(x)); }
      for (const d of rest) out.push({ ...g, set: 'd' + d, name: DAYSETS[3 + d][1], days: [d] });
    }
    return out.sort((a, b) => a.days[0] - b.days[0] || a.from - b.from);
  }
  function hourGrid(S, camps, a, b) {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => E.zero()));
    for (const cc of camps) for (let h = 0; h < 24; h++) {
      const e = S.stats.hour && S.stats.hour[cc.id + '~' + h];
      if (!e) continue;
      for (let d = Math.max(0, a); d <= b; d++) if (e[d]) E.add(grid[U.dowMon0(U.dayToDate(S.startDate, d))][h], e[d]);
    }
    return grid;
  }
  const sumCells = (grid, days, from, to) => { const v = E.zero(); for (const d of days) for (let h = from; h < to; h++) E.add(v, grid[d][h]); return UI.ext(E.derive(v)); };
  const setSchedule = (S, c, sch, what) => {
    const always = sch && sch.every((r) => r.every((x) => x === 0));
    c.schedule = !sch || always ? null : sch;
    M.log(S, 'Werbezeitplan', c.name, what);
  };
  const cloneSch = (c) => (c.schedule ? c.schedule.map((r) => r.slice()) : Array.from({ length: 7 }, () => Array(24).fill(0)));

  V.schedule = {
    render() {
      const S = APP.S, camps = UI.scopeCamps(), c = APP.scope.cid && M.camp(S, APP.scope.cid);
      const [a, b] = UI.rng();
      const grid = hourGrid(S, c ? [c] : camps, a, b);
      const metric = APP.q.heatm || 'clk';
      const tab = APP.tab.sched || 'entries';
      const tabs = `<div class="tabs">${[['entries', 'Werbezeitplan'], ['grid', 'Raster bearbeiten'], ['day', 'Tag'], ['hour', 'Stunde'], ['dayhour', 'Tag & Stunde']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-g="sched" data-v="${k}">${l}</button>`).join('')}</div>`;
      const msel = `<select data-chg="heatm">${['imp', 'clk', 'ctr', 'cost', 'conv', 'cvr', 'cpa', 'cpc', 'roas'].map((k) => `<option value="${k}" ${k === metric ? 'selected' : ''}>${UI.MET[k].l}</option>`).join('')}</select>`;
      const campPick = `<div class="callout">Wählen Sie eine Kampagne, um ihren Werbezeitplan zu bearbeiten: <select data-chg="scope"><option value="">–</option>${UI.campOpts(null, (x) => x.status !== 'removed' && !x.isTrial)}</select><div class="small muted" style="margin-top:6px">Die Berichte zeigen ohne Auswahl die Summe aller Kampagnen.</div></div>`;
      const note = '<div class="small muted" style="margin-top:10px">Ohne Einträge läuft die Kampagne rund um die Uhr. Sobald Einträge existieren, werden Anzeigen <b>nur</b> in diesen Zeiträumen ausgeliefert. Gebotsanpassungen wirken bei manuellen Geboten, Ziel-Impressionsanteil und Klicks maximieren; Smart Bidding berücksichtigt die Tageszeit selbst. <span title="Unterschied zu Google Ads">⚠ Im Simulator in ganzen Stunden – Google Ads erlaubt 15-Minuten-Schritte und bis zu 6 Einträge pro Tag.</span></div>';
      let body = '';
      if (tab === 'entries') {
        if (!c) body = campPick;
        else {
          const ents = schedEntries(c.schedule);
          const rows = ents.map((e, i) => {
            const m = sumCells(grid, e.days, e.from, e.to);
            return `<tr><td><b>${esc(e.name)}</b>, ${hh(e.from)} – ${hh(e.to)}</td><td class="num"><input type="number" class="adjin" value="${e.adj}" data-chg="schedadj" data-i="${i}" title="Gebotsanpassung in %"> %</td>${['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cpa'].map((k) => `<td class="num">${UI.MET[k].f(m[k])}</td>`).join('')}<td><button class="btn sm ghost danger" data-act="schedrm" data-i="${i}" title="Eintrag entfernen">🗑</button></td></tr>`;
          }).join('');
          const all = sumCells(grid, [0, 1, 2, 3, 4, 5, 6], 0, 24);
          body = `<div class="filterbar" style="padding:0 0 10px"><button class="btn primary sm" data-act="schededit">✎ Werbezeitplan bearbeiten</button> Vorlagen: <button class="btn sm" data-act="schedpreset" data-p="all">Rund um die Uhr</button><button class="btn sm" data-act="schedpreset" data-p="biz">Mo–Fr 7–20 Uhr</button><button class="btn sm" data-act="schedpreset" data-p="eve">Abends +20 %</button><button class="btn sm" data-act="schedpreset" data-p="night">Nachts −50 %</button><button class="btn sm" data-act="schedpreset" data-p="wkend">Wochenende −30 %</button></div>`
            + (ents.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Tag und Uhrzeit</th><th class="num">Gebotsanpassung</th>${['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cpa'].map((k) => `<th class="num">${UI.MET[k].l}</th>`).join('')}<th></th></tr></thead><tbody>${rows}</tbody></table></div>`
              : `<div class="empty">Kein Werbezeitplan – die Kampagne läuft rund um die Uhr (${f.int(all.clk)} Klicks, ${f.eur(all.cost)} im Zeitraum).<br><button class="btn sm primary" data-act="schededit" style="margin-top:8px">＋ Zeitplan anlegen</button></div>`) + note;
        }
      } else if (tab === 'grid') {
        if (!c) body = campPick;
        else {
          const sch = c.schedule, sel = APP.schedSel || new Set();
          const show = APP.q.gridShow || 'adj';
          const vals = grid.map((r) => r.map((v) => UI.ext(E.derive(v))[metric] || 0)), mx = Math.max(...vals.flat(), 1e-9);
          let g = '<div class="heatwrap"><div class="heat sgrid" id="sgrid"><div class="corner" data-sall="1" title="Alles auswählen">⊞</div>' + Array.from({ length: 24 }, (_, h) => `<div class="h" data-scol="${h}" title="Spalte ${h} Uhr auswählen">${h}</div>`).join('');
          for (let d = 0; d < 7; d++) {
            g += `<div class="r" data-srow="${d}" title="${U.DOW[d]} auswählen">${U.DOW[d]}</div>`;
            for (let h = 0; h < 24; h++) {
              const v = sch ? sch[d][h] : 0, off = v === null;
              const bg = off ? 'var(--border-soft)' : v > 0 ? `color-mix(in srgb, var(--good) ${Math.min(90, 20 + v)}%, var(--surface))` : v < 0 ? `color-mix(in srgb, var(--bad) ${Math.min(90, 20 - v)}%, var(--surface))` : 'var(--surface-2)';
              const perf = show === 'perf' ? `<i class="pf" style="height:${Math.round((vals[d][h] / mx) * 100)}%"></i>` : '';
              g += `<div class="c sc ${off ? 'off' : ''} ${sel.has(d * 24 + h) ? 'sel' : ''}" data-cell="${d * 24 + h}" style="background:${bg}" title="${U.DOW[d]} ${hh(h)}–${hh(h + 1)}: ${off ? 'keine Auslieferung' : (v > 0 ? '+' : '') + v + ' %'} · ${UI.MET[metric].l}: ${UI.MET[metric].f(vals[d][h])}">${perf}<span>${off ? '×' : v ? (v > 0 ? '+' : '') + v : ''}</span></div>`;
            }
          }
          g += '</div></div>';
          body = `<div class="small muted" style="margin-bottom:8px">Ziehen Sie mit Maus oder Finger über das Raster, um Zeitfenster zu markieren (Klick auf Wochentag oder Stunde wählt Zeile/Spalte). Dann Gebotsanpassung setzen oder Zeiten aus-/einschalten.</div>
            <div class="schedbar"><b id="schedcnt">${sel.size} Stunde(n) markiert</b>
              <span class="adjgrp"><input type="number" id="schedv" value="${APP.schedV ?? -30}" step="5" style="width:76px"> % <button class="btn sm primary" data-act="schedapply">Anpassung setzen</button></span>
              <button class="btn sm" data-act="schedquick" data-v="-50">−50 %</button><button class="btn sm" data-act="schedquick" data-v="-20">−20 %</button><button class="btn sm" data-act="schedquick" data-v="0">0 %</button><button class="btn sm" data-act="schedquick" data-v="20">+20 %</button>
              <button class="btn sm" data-act="schedoff">Keine Auslieferung</button><button class="btn sm ghost" data-act="schedclr">Markierung aufheben</button></div>
            ${g}
            <div class="filterbar" style="padding:8px 0 0"><span class="legend"><span><i style="background:color-mix(in srgb, var(--good) 50%, var(--surface))"></i>Erhöhung</span><span><i style="background:color-mix(in srgb, var(--bad) 50%, var(--surface))"></i>Senkung</span><span><i style="background:var(--border-soft)"></i>keine Auslieferung</span></span>
            <label class="chk small" style="margin-left:auto"><input type="checkbox" data-chg="gridshow" ${show === 'perf' ? 'checked' : ''}> Leistung einblenden (${UI.MET[metric].l})</label></div>` + note;
        }
      } else if (tab === 'day') {
        const items = U.DOW.map((n, d) => ({ label: n, value: sumCells(grid, [d], 0, 24)[metric] || 0, color: C.SERIES[0] }));
        const rows = U.DOW.map((n, d) => { const m = sumCells(grid, [d], 0, 24); return `<tr><td><b>${n}</b></td>${['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'roas'].map((k) => `<td class="num">${UI.MET[k].f(m[k])}</td>`).join('')}</tr>`; }).join('');
        body = C.bars({ items, fmt: UI.MET[metric].f, height: 200 }) + `<div class="tablewrap" style="margin-top:12px"><table class="t"><thead><tr><th>Tag</th>${['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'roas'].map((k) => `<th class="num">${UI.MET[k].l}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
      } else if (tab === 'hour') {
        const items = Array.from({ length: 24 }, (_, h) => ({ label: String(h), value: sumCells(grid, [0, 1, 2, 3, 4, 5, 6], h, h + 1)[metric] || 0, color: C.SERIES[0] }));
        const rows = Array.from({ length: 24 }, (_, h) => { const m = sumCells(grid, [0, 1, 2, 3, 4, 5, 6], h, h + 1); return `<tr><td><b>${hh(h)}</b></td>${['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa'].map((k) => `<td class="num">${UI.MET[k].f(m[k])}</td>`).join('')}</tr>`; }).join('');
        body = C.bars({ items, fmt: UI.MET[metric].f, height: 200 }) + `<div class="tablewrap" style="margin-top:12px;max-height:420px;overflow:auto"><table class="t"><thead><tr><th>Stunde</th>${['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa'].map((k) => `<th class="num">${UI.MET[k].l}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
      } else {
        const vals = grid.map((r) => r.map((v) => UI.ext(E.derive(v))[metric] || 0));
        const mx = Math.max(...vals.flat(), 1e-9), inv = ['cpa', 'cpc'].includes(metric);
        let heat = '<div class="heatwrap"><div class="heat"><div></div>' + Array.from({ length: 24 }, (_, h) => `<div class="h">${h}</div>`).join('');
        for (let d = 0; d < 7; d++) {
          heat += `<div class="r">${U.DOW[d]}</div>`;
          for (let h = 0; h < 24; h++) { const v = vals[d][h], t = v / mx, al = v ? (inv ? 1 - t * 0.85 : 0.08 + t * 0.92) : 0; heat += `<div class="c" style="background:color-mix(in srgb, ${inv ? 'var(--bad)' : 'var(--primary)'} ${Math.round(al * 100)}%, var(--surface-2))" title="${U.DOW[d]} ${h}:00 – ${UI.MET[metric].l}: ${UI.MET[metric].f(v)}"></div>`; }
        }
        body = heat + '</div></div>';
      }
      return UI.head('Werbezeitplaner') + UI.card(c ? 'Werbezeitplan: ' + esc(c.name) : 'Werbezeitplaner', tabs + `<div style="padding-top:12px">${body}</div>`, { tools: tab === 'entries' ? '' : msel });
    },
  };
  ACT.chg_heatm = (el) => { APP.q.heatm = el.value; UI.renderMain(true); };
  ACT.chg_gridshow = (el) => { APP.q.gridShow = el.checked ? 'perf' : 'adj'; UI.renderMain(true); };
  const curCamp = () => M.camp(APP.S, APP.scope.cid);
  ACT.chg_schedadj = (el, d) => {
    const c = curCamp(), e = schedEntries(c.schedule)[+d.i], v = U.clamp(Math.round(parseFloat(el.value) || 0), -90, 900);
    const sch = cloneSch(c);
    for (const dd of e.days) for (let h = e.from; h < e.to; h++) sch[dd][h] = v;
    setSchedule(APP.S, c, sch, `${e.name} ${hh(e.from)}–${hh(e.to)}: ${v} %`); UI.renderMain(true);
  };
  ACT.schedrm = (el, d) => {
    const c = curCamp(), ents = schedEntries(c.schedule), e = ents[+d.i];
    const sch = cloneSch(c);
    for (const dd of e.days) for (let h = e.from; h < e.to; h++) sch[dd][h] = null;
    const none = sch.every((r) => r.every((x) => x === null));
    if (none) UI.toast('Letzter Eintrag entfernt – die Kampagne läuft wieder rund um die Uhr');
    setSchedule(APP.S, c, none ? null : sch, `Eintrag entfernt: ${e.name} ${hh(e.from)}–${hh(e.to)}`); UI.renderMain(true);
  };
  // Google-ähnlicher Bearbeiten-Dialog: Zeilen mit Tag, Von, Bis, Gebotsanpassung
  ACT.schededit = () => {
    const c = curCamp();
    APP._schedRows = schedEntries(c.schedule).map((e) => ({ set: e.set, from: e.from, to: e.to, adj: e.adj }));
    if (!APP._schedRows.length) APP._schedRows = [{ set: 'all', from: 0, to: 24, adj: 0 }];
    drawSchedModal(c);
  };
  function drawSchedModal(c) {
    const R = APP._schedRows;
    const opt = (n, sel, max = 24, min = 0) => Array.from({ length: max - min + 1 }, (_, i) => i + min).map((h) => `<option value="${h}" ${h === sel ? 'selected' : ''}>${hh(h)}</option>`).join('');
    const rows = R.map((r, i) => `<div class="schedrow"><select name="s_set${i}">${DAYSETS.map(([id, n]) => `<option value="${id}" ${id === r.set ? 'selected' : ''}>${n}</option>`).join('')}</select><select name="s_f${i}">${opt(0, r.from, 23)}</select><span>bis</span><select name="s_t${i}">${opt(0, r.to, 24, 1)}</select><span class="adjgrp"><input type="number" name="s_a${i}" value="${r.adj}" step="5"> %</span><button class="iconbtn" data-act="schedrowdel" data-i="${i}" title="Zeile entfernen">✕</button></div>`).join('');
    UI.modal('Werbezeitplan bearbeiten: ' + esc(c.name), `<div class="small muted" style="margin-bottom:10px">Legen Sie fest, an welchen Tagen und zu welchen Uhrzeiten Anzeigen erscheinen. Zeiten außerhalb der Einträge: keine Auslieferung. Überschneiden sich Einträge, gilt der untere.</div>
      <div class="schedrow head"><span>Tag</span><span>Von</span><span></span><span>Bis</span><span>Gebotsanpassung</span><span></span></div>${rows || '<div class="muted small">Keine Einträge – die Kampagne läuft rund um die Uhr.</div>'}
      <button class="btn sm" data-act="schedrowadd" style="margin-top:8px">＋ Hinzufügen</button>`, {
      wide: true,
      onSave: () => {
        readSchedRows();
        if (!APP._schedRows.length) { setSchedule(APP.S, c, null, 'Rund um die Uhr'); return; }
        const sch = Array.from({ length: 7 }, () => Array(24).fill(null));
        for (const r of APP._schedRows) {
          const days = DAYSETS.find((x) => x[0] === r.set)[2];
          if (r.to <= r.from) continue;
          for (const d of days) for (let h = r.from; h < r.to; h++) sch[d][h] = r.adj;
        }
        if (sch.every((row) => row.every((x) => x === null))) { UI.toast('Bitte gültige Zeiträume angeben (Bis nach Von)', 'bad'); return false; }
        setSchedule(APP.S, c, sch, `${APP._schedRows.length} Zeitplan-Eintrag/-Einträge gespeichert`);
        UI.toast('Werbezeitplan gespeichert', 'good');
      },
    });
  }
  function readSchedRows() {
    APP._schedRows = APP._schedRows.map((r, i) => ({ set: UI.val('s_set' + i) || r.set, from: +UI.val('s_f' + i), to: +UI.val('s_t' + i), adj: U.clamp(Math.round(UI.num('s_a' + i) || 0), -90, 900) }));
  }
  ACT.schedrowadd = () => { readSchedRows(); APP._schedRows.push({ set: 'wd', from: 8, to: 18, adj: 0 }); drawSchedModal(curCamp()); };
  ACT.schedrowdel = (el, d) => { readSchedRows(); APP._schedRows.splice(+d.i, 1); drawSchedModal(curCamp()); };
  ACT.schedpreset = (el, d) => {
    const c = curCamp(), p = d.p;
    const sch = p === 'all' ? null : Array.from({ length: 7 }, (_, dd) => Array.from({ length: 24 }, (_, h) => {
      if (p === 'biz') return dd < 5 && h >= 7 && h < 20 ? 0 : null;
      if (p === 'eve') return h >= 18 && h < 23 ? 20 : 0;
      if (p === 'night') return h < 6 ? -50 : 0;
      if (p === 'wkend') return dd >= 5 ? -30 : 0;
      return 0;
    }));
    setSchedule(APP.S, c, sch, 'Vorlage: ' + el.textContent); UI.renderMain(true);
  };
  // Raster-Auswahl
  const selSet = () => APP.schedSel || (APP.schedSel = new Set());
  function applyToSel(fn, what) {
    const c = curCamp(), sel = selSet();
    if (!sel.size) { UI.toast('Zuerst Stunden im Raster markieren', 'bad'); return; }
    const sch = cloneSch(c);
    for (const k of sel) sch[Math.floor(k / 24)][k % 24] = fn(sch[Math.floor(k / 24)][k % 24]);
    if (sch.every((r) => r.every((x) => x === null))) { UI.toast('Mindestens eine Stunde muss aktiv bleiben', 'bad'); return; }
    setSchedule(APP.S, c, sch, `${sel.size} Stunde(n): ${what}`);
    APP.schedSel = new Set(); UI.renderMain(true);
  }
  ACT.schedapply = () => { const v = U.clamp(Math.round(parseFloat(document.getElementById('schedv').value) || 0), -90, 900); APP.schedV = v; applyToSel(() => v, `${v} %`); };
  ACT.schedquick = (el, d) => applyToSel(() => +d.v, `${d.v} %`);
  ACT.schedoff = () => applyToSel(() => null, 'keine Auslieferung');
  ACT.schedclr = () => { APP.schedSel = new Set(); UI.renderMain(true); };
  // Ziehen zum Markieren (Maus & Touch über Pointer-Events)
  let drag = null;
  const cellAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest && el.closest('#sgrid [data-cell]'); };
  function paintRect() {
    const sel = new Set(drag.base);
    const [d0, h0] = [Math.floor(drag.start / 24), drag.start % 24], [d1, h1] = [Math.floor(drag.cur / 24), drag.cur % 24];
    for (let d = Math.min(d0, d1); d <= Math.max(d0, d1); d++) for (let h = Math.min(h0, h1); h <= Math.max(h0, h1); h++) { const k = d * 24 + h; if (drag.add) sel.add(k); else sel.delete(k); }
    APP.schedSel = sel;
    document.querySelectorAll('#sgrid [data-cell]').forEach((el) => el.classList.toggle('sel', sel.has(+el.dataset.cell)));
    const cnt = document.getElementById('schedcnt'); if (cnt) cnt.textContent = sel.size + ' Stunde(n) markiert';
  }
  document.addEventListener('pointerdown', (ev) => {
    const g = ev.target.closest && ev.target.closest('#sgrid');
    if (!g) return;
    const sel = selSet();
    const t = ev.target.closest('[data-cell],[data-srow],[data-scol],[data-sall]');
    if (!t) return;
    ev.preventDefault();
    if (t.dataset.cell) { const k = +t.dataset.cell; drag = { start: k, cur: k, base: new Set(sel), add: !sel.has(k) }; paintRect(); return; }
    const keys = t.dataset.sall ? Array.from({ length: 168 }, (_, i) => i) : t.dataset.srow ? Array.from({ length: 24 }, (_, h) => +t.dataset.srow * 24 + h) : Array.from({ length: 7 }, (_, d) => d * 24 + +t.dataset.scol);
    const add = !keys.every((k) => sel.has(k));
    for (const k of keys) add ? sel.add(k) : sel.delete(k);
    document.querySelectorAll('#sgrid [data-cell]').forEach((el) => el.classList.toggle('sel', sel.has(+el.dataset.cell)));
    const cnt = document.getElementById('schedcnt'); if (cnt) cnt.textContent = sel.size + ' Stunde(n) markiert';
  });
  document.addEventListener('pointermove', (ev) => { if (!drag) return; const el = cellAt(ev.clientX, ev.clientY); if (el && +el.dataset.cell !== drag.cur) { drag.cur = +el.dataset.cell; paintRect(); } });
  document.addEventListener('pointerup', () => { drag = null; });
  document.addEventListener('pointercancel', () => { drag = null; });

  // ---------- Geräte ----------
  V.devices = {
    render() {
      const S = APP.S, camps = UI.scopeCamps();
      const rows = [];
      for (const c of camps) for (const dv of D.DEVICES) rows.push({ id: c.id + dv.id, c, dv, m: UI.m('dev', c.id + '~' + dv.id) });
      const cols = [
        { k: 'dev', l: 'Gerät', f: (r) => `<b>${esc(r.dv.name)}</b>`, sort: (r) => r.dv.id },
        { k: 'camp', l: 'Kampagne', f: (r) => UI.campLink(r.c), sort: (r) => r.c.name },
        { k: 'adj', l: 'Gebotsanpassung', f: (r) => (r.c.devices[r.dv.id] <= -100 ? `<button class="btn sm" data-act="devex" data-c="${r.c.id}" data-d="${r.dv.id}">Ausgeschlossen – aufheben</button>` : `${adjInput('devadj', `data-c="${r.c.id}" data-d="${r.dv.id}"`, r.c.devices[r.dv.id])} <button class="btn sm ghost" data-act="devex" data-c="${r.c.id}" data-d="${r.dv.id}" title="Ausschließen (−100 %)">⊘</button>`), sort: (r) => r.c.devices[r.dv.id] },
        ...UI.mcols(['imp', 'clk', 'ctr', 'cpc', 'cost', 'conv', 'cvr', 'cpa', 'val', 'roas']),
      ];
      const ind = M.ind(S);
      const totals = D.DEVICES.map((dv, i) => ({ label: dv.name, value: U.sum(rows.filter((r) => r.dv.id === dv.id), (r) => r.m.cost), color: C.SERIES[i] }));
      return UI.head('Geräte') + `<div class="callout">Geräteanteile in Ihrer Branche: ${D.DEVICES.map((dv) => `${dv.name} ${f.pct0(ind.devices[dv.id].share)}`).join(' · ')}. Conversion-Raten unterscheiden sich je Gerät deutlich – nutzen Sie Gebotsanpassungen bei manuellen Geboten.</div>`
        + `<div class="grid g21"><div>${UI.card('Leistung nach Gerät', UI.table('devs', cols, rows, { defaultSort: { k: 'cost', dir: 'desc' } }), { flush: true })}</div><div>${UI.card('Kosten nach Gerät', C.bars({ items: totals, fmt: f.eur0, height: 200 }))}</div></div>`;
    },
  };
  ACT.chg_devadj = (el, d) => { const c = M.camp(APP.S, d.c); c.devices[d.d] = U.clamp(parseFloat(el.value) || 0, -90, 900); M.log(APP.S, 'Geräte', c.name, `Gebotsanpassung ${d.d}: ${c.devices[d.d]} %`); };
  ACT.devex = (el, d) => { const c = M.camp(APP.S, d.c); c.devices[d.d] = c.devices[d.d] <= -100 ? 0 : -100; M.log(APP.S, 'Geräte', c.name, `${d.d}: ${c.devices[d.d] <= -100 ? 'ausgeschlossen' : 'wieder aktiviert'}`); UI.renderMain(true); };
})();
