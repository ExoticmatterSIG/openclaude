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

  // ---------- Werbezeitplaner ----------
  V.schedule = {
    render() {
      const S = APP.S, camps = UI.scopeCamps(), c = APP.scope.cid && M.camp(S, APP.scope.cid);
      const metric = APP.q.heatm || 'clk';
      const [a, b] = UI.rng();
      const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => E.zero()));
      for (const cc of camps) for (let h = 0; h < 24; h++) {
        const e = S.stats.hour && S.stats.hour[cc.id + '~' + h];
        if (!e) continue;
        for (let d = a; d <= b; d++) if (e[d]) E.add(grid[U.dowMon0(U.dayToDate(S.startDate, d))][h], e[d]);
      }
      const vals = grid.map((r) => r.map((v) => E.derive(v)[metric] || 0));
      const mx = Math.max(...vals.flat(), 1e-9);
      const inv = ['cpa', 'cpc'].includes(metric);
      let heat = '<div class="heatwrap"><div class="heat"><div></div>' + Array.from({ length: 24 }, (_, h) => `<div class="h">${h}</div>`).join('');
      for (let d = 0; d < 7; d++) {
        heat += `<div class="r">${U.DOW[d]}</div>`;
        for (let h = 0; h < 24; h++) {
          const v = vals[d][h], t = v / mx;
          const alpha = v ? (inv ? 1 - t * 0.85 : 0.08 + t * 0.92) : 0;
          heat += `<div class="c" style="background:color-mix(in srgb, ${inv ? 'var(--bad)' : 'var(--primary)'} ${Math.round(alpha * 100)}%, var(--surface-2))" title="${U.DOW[d]} ${h}:00 – ${UI.MET[metric].l}: ${UI.MET[metric].f(v)}"></div>`;
        }
      }
      heat += '</div></div>';
      const msel = `<select data-chg="heatm">${['imp', 'clk', 'ctr', 'cost', 'conv', 'cvr', 'cpa', 'cpc'].map((k) => `<option value="${k}" ${k === metric ? 'selected' : ''}>${UI.MET[k].l}</option>`).join('')}</select>`;
      let editor = needCamp('den Werbezeitplan');
      if (c) {
        const sch = c.schedule;
        const rows = U.DOW.map((dn, d) => {
          const row = sch ? sch[d] : Array(24).fill(0);
          const on = row.map((x) => x !== null);
          const from = on.indexOf(true), to = on.lastIndexOf(true);
          const adj = row.find((x) => x !== null) || 0;
          return `<tr><td><b>${dn}</b></td><td><label class="chk"><input type="checkbox" name="on${d}" ${from >= 0 ? 'checked' : ''}> aktiv</label></td><td><input type="number" name="f${d}" min="0" max="23" value="${Math.max(from, 0)}" style="width:64px"> – <input type="number" name="t${d}" min="1" max="24" value="${to >= 0 ? to + 1 : 24}" style="width:64px"> Uhr</td><td><input type="number" name="a${d}" value="${adj}" style="width:72px"> %</td></tr>`;
        }).join('');
        editor = UI.card('Werbezeitplan: ' + esc(c.name), `<div class="filterbar" style="padding:0 0 10px">Vorlagen: <button class="btn sm" data-act="schedpreset" data-p="all">Immer</button><button class="btn sm" data-act="schedpreset" data-p="biz">Werktags 7–20 Uhr</button><button class="btn sm" data-act="schedpreset" data-p="eve">Abends +20 %</button><button class="btn sm" data-act="schedpreset" data-p="night">Nachts −50 %</button></div><div class="tablewrap" id="schedform"><table class="t"><thead><tr><th>Tag</th><th>Status</th><th>Zeitraum</th><th>Gebotsanpassung</th></tr></thead><tbody>${rows}</tbody></table></div><div style="margin-top:12px"><button class="btn primary" data-act="schedsave">Werbezeitplan speichern</button> <span class="small muted">Gebotsanpassungen wirken bei manuellen Geboten; Smart Bidding berücksichtigt die Tageszeit automatisch.</span></div>`);
      }
      return UI.head('Werbezeitplaner') + UI.card('Leistung nach Wochentag & Stunde', heat, { tools: msel }) + editor;
    },
  };
  ACT.chg_heatm = (el) => { APP.q.heatm = el.value; UI.renderMain(true); };
  ACT.schedsave = () => {
    const c = M.camp(APP.S, APP.scope.cid), root = document.getElementById('schedform');
    const sch = [];
    let always = true;
    for (let d = 0; d < 7; d++) {
      const on = UI.val('on' + d, root), from = U.clamp(UI.num('f' + d, root) || 0, 0, 23), to = U.clamp(UI.num('t' + d, root) || 24, from + 1, 24), adj = U.clamp(UI.num('a' + d, root) || 0, -90, 900);
      sch.push(Array.from({ length: 24 }, (_, h) => (on && h >= from && h < to ? adj : null)));
      if (!on || from > 0 || to < 24 || adj) always = false;
    }
    c.schedule = always ? null : sch;
    M.log(APP.S, 'Werbezeitplan', c.name, always ? 'Ganztägig' : 'Angepasst');
    UI.toast('Werbezeitplan gespeichert'); UI.renderMain(true);
  };
  ACT.schedpreset = (el, d) => {
    const c = M.camp(APP.S, APP.scope.cid);
    const p = d.p;
    c.schedule = p === 'all' ? null : Array.from({ length: 7 }, (_, dd) => Array.from({ length: 24 }, (_, h) => {
      if (p === 'biz') return dd < 5 && h >= 7 && h < 20 ? 0 : null;
      if (p === 'eve') return h >= 18 && h < 23 ? 20 : 0;
      if (p === 'night') return h < 6 ? -50 : 0;
      return 0;
    }));
    M.log(APP.S, 'Werbezeitplan', c.name, 'Vorlage: ' + el.textContent);
    UI.renderMain(true);
  };

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
