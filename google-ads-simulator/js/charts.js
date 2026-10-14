/* Ads Simulator – leichte SVG-Diagramme (Linie, Balken, Ring, Sparkline) */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});
  const U = G.U;
  const C = {};
  let specs = new Map(), nextId = 1;

  C.reset = () => { specs = new Map(); };

  // Platzhalter einfügen; gezeichnet wird in mount(), sobald die Breite bekannt ist
  C.line = function (spec) {
    const id = nextId++;
    specs.set(id, { kind: 'line', ...spec });
    return `<div class="chart-host" data-chart="${id}" style="height:${spec.height || 240}px"></div>` + legend(spec.series);
  };
  C.bars = function (spec) {
    const id = nextId++;
    specs.set(id, { kind: 'bars', ...spec });
    return `<div class="chart-host" data-chart="${id}" style="height:${spec.height || 220}px"></div>`;
  };
  function legend(series) {
    if (!series || series.length < 2) return '';
    return `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${U.esc(s.name)}</span>`).join('')}</div>`;
  }

  function niceMax(v) {
    if (!(v > 0)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function drawLine(host, sp) {
    const W = host.clientWidth || 600, H = host.clientHeight || 240;
    const padL = 54, padR = sp.series.some((s) => s.axis === 'right') ? 54 : 16, padT = 12, padB = 26;
    const n = sp.labels.length;
    const iw = W - padL - padR, ih = H - padT - padB;
    const axes = { left: 0, right: 0 };
    for (const s of sp.series) axes[s.axis || 'left'] = Math.max(axes[s.axis || 'left'], ...s.values.map((v) => (isFinite(v) ? v : 0)));
    const mx = { left: niceMax(axes.left), right: niceMax(axes.right) };
    const x = (i) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
    const y = (v, ax) => padT + ih - (Math.max(0, v) / mx[ax]) * ih;
    let g = '<g class="grid">';
    for (let k = 0; k <= 4; k++) {
      const yy = padT + (ih * k) / 4;
      g += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}"/>`;
      const lv = mx.left * (1 - k / 4);
      const lf = sp.series.find((s) => (s.axis || 'left') === 'left');
      if (lf) g += `<text x="${padL - 6}" y="${yy + 4}" text-anchor="end">${lf.axisFmt ? lf.axisFmt(lv) : U.fmt.compact(lv)}</text>`;
      const rf = sp.series.find((s) => s.axis === 'right');
      if (rf) g += `<text x="${W - padR + 6}" y="${yy + 4}">${rf.axisFmt ? rf.axisFmt(mx.right * (1 - k / 4)) : U.fmt.compact(mx.right * (1 - k / 4))}</text>`;
    }
    g += '</g>';
    const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))));
    let xl = '';
    for (let i = 0; i < n; i += step) xl += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${U.esc(sp.labels[i])}</text>`;
    let paths = '';
    for (const s of sp.series) {
      const ax = s.axis || 'left';
      const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(isFinite(v) ? v : 0, ax).toFixed(1)}`);
      if (s.area) paths += `<path d="M${x(0)},${padT + ih} L${pts.join(' L')} L${x(n - 1)},${padT + ih} Z" fill="${s.color}" opacity=".12"/>`;
      paths += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" ${s.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
      if (n <= 40) paths += s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(isFinite(v) ? v : 0, ax)}" r="2.5" fill="${s.color}"/>`).join('');
    }
    // Markierungen (z. B. Ereignisse)
    let marks = '';
    for (const m of sp.marks || []) {
      if (m.i < 0 || m.i >= n) continue;
      marks += `<line x1="${x(m.i)}" x2="${x(m.i)}" y1="${padT}" y2="${padT + ih}" stroke="${m.color || 'var(--s3)'}" stroke-dasharray="3 3"/><circle cx="${x(m.i)}" cy="${padT + 4}" r="4" fill="${m.color || 'var(--s3)'}"><title>${U.esc(m.label)}</title></circle>`;
    }
    host.innerHTML = `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}${xl}${paths}${marks}<line class="hoverline" x1="0" x2="0" y1="${padT}" y2="${padT + ih}" stroke="var(--text-3)" stroke-width="1" visibility="hidden"/></svg>`;
    host._geo = { x, n, padL, iw, sp };
  }

  function drawBars(host, sp) {
    const W = host.clientWidth || 600, H = host.clientHeight || 220;
    const items = sp.items;
    const padL = sp.horizontal ? Math.min(180, W * 0.35) : 44, padR = 16, padT = 10, padB = sp.horizontal ? 10 : 30;
    const mx = niceMax(Math.max(...items.map((i) => i.value), 0));
    let out = '';
    if (sp.horizontal) {
      const bh = (H - padT - padB) / Math.max(items.length, 1);
      items.forEach((it, i) => {
        const w = ((W - padL - padR - 70) * it.value) / mx;
        const yy = padT + i * bh;
        out += `<text x="${padL - 8}" y="${yy + bh / 2 + 4}" text-anchor="end">${U.esc(it.label)}</text>`;
        out += `<rect x="${padL}" y="${yy + bh * 0.18}" width="${Math.max(0, w)}" height="${bh * 0.64}" rx="3" fill="${it.color || 'var(--s1)'}"><title>${U.esc(it.label)}: ${sp.fmt ? sp.fmt(it.value) : it.value}</title></rect>`;
        out += `<text x="${padL + w + 6}" y="${yy + bh / 2 + 4}">${sp.fmt ? sp.fmt(it.value) : U.fmt.compact(it.value)}</text>`;
      });
    } else {
      const iw = W - padL - padR, ih = H - padT - padB;
      const bw = iw / Math.max(items.length, 1);
      for (let k = 0; k <= 4; k++) { const yy = padT + (ih * k) / 4; out += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}" stroke="var(--border-soft)"/><text x="${padL - 6}" y="${yy + 4}" text-anchor="end">${U.fmt.compact(mx * (1 - k / 4))}</text>`; }
      const step = Math.max(1, Math.ceil(items.length / Math.max(2, Math.floor(iw / 40))));
      items.forEach((it, i) => {
        const h = (ih * it.value) / mx;
        out += `<rect x="${padL + i * bw + bw * 0.15}" y="${padT + ih - h}" width="${bw * 0.7}" height="${Math.max(0, h)}" rx="2" fill="${it.color || 'var(--s1)'}"><title>${U.esc(it.label)}: ${sp.fmt ? sp.fmt(it.value) : it.value}</title></rect>`;
        if (i % step === 0) out += `<text x="${padL + i * bw + bw / 2}" y="${H - 10}" text-anchor="middle">${U.esc(it.label)}</text>`;
      });
    }
    host.innerHTML = `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out}</svg>`;
  }

  C.mount = function (root) {
    for (const host of root.querySelectorAll('.chart-host')) {
      const sp = specs.get(+host.dataset.chart);
      if (!sp) continue;
      host._spec = sp;
      if (sp.kind === 'line') drawLine(host, sp); else drawBars(host, sp);
    }
  };
  C.redrawAll = function () {
    for (const host of document.querySelectorAll('.chart-host')) {
      if (!host._spec) continue;
      if (host._spec.kind === 'line') drawLine(host, host._spec); else drawBars(host, host._spec);
    }
  };

  // Tooltip für Liniendiagramme
  let tip = null;
  document.addEventListener('mousemove', (ev) => {
    const host = ev.target.closest && ev.target.closest('.chart-host');
    if (!host || !host._geo) { if (tip) tip.remove(), (tip = null); document.querySelectorAll('.hoverline').forEach((l) => l.setAttribute('visibility', 'hidden')); return; }
    const g = host._geo, r = host.getBoundingClientRect();
    const rx = ev.clientX - r.left;
    const i = U.clamp(Math.round(((rx - g.padL) / g.iw) * (g.n - 1)), 0, g.n - 1);
    const sp = g.sp;
    if (!tip) { tip = document.createElement('div'); tip.className = 'charttip'; document.body.appendChild(tip); }
    tip.innerHTML = `<div style="font-weight:500;margin-bottom:4px">${U.esc(sp.tipLabels ? sp.tipLabels[i] : sp.labels[i])}</div>` + sp.series.map((s) => `<div><span class="dot" style="background:${s.color}"></span> ${U.esc(s.name)}: <b>${s.fmt ? s.fmt(s.values[i]) : U.fmt.num2(s.values[i])}</b></div>`).join('') + ((sp.marks || []).filter((m) => m.i === i).map((m) => `<div style="margin-top:4px;color:var(--warn)">⚑ ${U.esc(m.label)}</div>`).join(''));
    const tx = Math.min(ev.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = tx + 'px'; tip.style.top = ev.clientY + 14 + 'px';
    const hl = host.querySelector('.hoverline');
    if (hl) { hl.setAttribute('x1', g.x(i)); hl.setAttribute('x2', g.x(i)); hl.setAttribute('visibility', 'visible'); }
  });

  C.ring = function (v, size = 96) {
    const r = size / 2 - 8, c = 2 * Math.PI * r;
    const col = v === null ? 'var(--border)' : v >= 80 ? 'var(--good)' : v >= 60 ? 'var(--s3)' : 'var(--bad)';
    const off = v === null ? c : c * (1 - v / 100);
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--border-soft)" stroke-width="8" fill="none"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${col}" stroke-width="8" fill="none" stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round"/></svg><div class="v">${v === null ? '–' : Math.round(v) + ' %'}</div></div>`;
  };

  C.spark = function (vals, color = 'var(--s1)', w = 90, h = 24) {
    if (!vals.length) return '';
    const mx = Math.max(...vals, 1e-9), mn = Math.min(...vals, 0);
    const pts = vals.map((v, i) => `${((i / Math.max(vals.length - 1, 1)) * w).toFixed(1)},${(h - ((v - mn) / (mx - mn || 1)) * (h - 2) - 1).toFixed(1)}`).join(' ');
    return `<svg width="${w}" height="${h}" style="vertical-align:middle"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
  };

  C.SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)'];
  G.C = C;
})();
