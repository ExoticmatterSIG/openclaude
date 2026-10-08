/* Google Ads Simulator – Hilfsfunktionen (RNG, Formatierung, Datum) */
(function () {
  const G = (globalThis.GA = globalThis.GA || {});

  // ---------- Seeded RNG (mulberry32) ----------
  function makeRng(seed) {
    let s = seed >>> 0;
    const r = function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.getState = () => s;
    r.setState = (v) => { s = v >>> 0; };
    let spare = null;
    r.normal = function () {
      if (spare !== null) { const v = spare; spare = null; return v; }
      let u = 0, v = 0;
      while (u === 0) u = r();
      v = r();
      const mag = Math.sqrt(-2 * Math.log(u));
      spare = mag * Math.sin(2 * Math.PI * v);
      return mag * Math.cos(2 * Math.PI * v);
    };
    // Lognormal mit Erwartungswert 1
    r.logn = (sigma) => Math.exp(r.normal() * sigma - (sigma * sigma) / 2);
    r.chance = (p) => r() < p;
    r.range = (a, b) => a + r() * (b - a);
    r.int = (a, b) => Math.floor(a + r() * (b - a + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.weighted = (arr, weightFn) => {
      let tot = 0;
      for (const x of arr) tot += weightFn(x);
      let x = r() * tot;
      for (const it of arr) { x -= weightFn(it); if (x <= 0) return it; }
      return arr[arr.length - 1];
    };
    r.poisson = (lambda) => {
      if (lambda <= 0) return 0;
      if (lambda > 40) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * r.normal()));
      const L = Math.exp(-lambda);
      let k = 0, p = 1;
      do { k++; p *= r(); } while (p > L);
      return k - 1;
    };
    r.binomial = (n, p) => {
      if (n <= 0 || p <= 0) return 0;
      if (p >= 1) return n;
      if (n < 30) { let k = 0; for (let i = 0; i < n; i++) if (r() < p) k++; return k; }
      const m = n * p, sd = Math.sqrt(n * p * (1 - p));
      return Math.min(n, Math.max(0, Math.round(m + sd * r.normal())));
    };
    r.sround = (x) => { const f = Math.floor(x); return f + (r() < x - f ? 1 : 0); };
    return r;
  }

  // ---------- Mathe ----------
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);
  const avg = (arr, f) => (arr.length ? sum(arr, f) / arr.length : 0);
  const div = (a, b) => (b ? a / b : 0);
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  // ---------- Formatierung (de-DE) ----------
  const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const eur0 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmt = {
    int: (x) => (isFinite(x) ? nf0.format(Math.round(x)) : '–'),
    num1: (x) => (isFinite(x) ? nf1.format(x) : '–'),
    num2: (x) => (isFinite(x) ? nf2.format(x) : '–'),
    eur: (x) => (isFinite(x) ? eur.format(x) : '–'),
    eur0: (x) => (isFinite(x) ? eur0.format(x) : '–'),
    pct: (x, d = 2) => (isFinite(x) ? (x * 100).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' %' : '–'),
    pct0: (x) => (isFinite(x) ? Math.round(x * 100) + ' %' : '–'),
    signedPct: (x) => (isFinite(x) ? (x >= 0 ? '+' : '') + (x * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' %' : '–'),
    compact: (x) => {
      if (!isFinite(x)) return '–';
      const a = Math.abs(x);
      if (a >= 1e6) return nf1.format(x / 1e6) + ' Mio.';
      if (a >= 1e4) return nf1.format(x / 1e3) + ' Tsd.';
      return nf0.format(x);
    },
  };

  // ---------- Datum ----------
  const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
  function addDays(date, n) { return new Date(date.getTime() + n * 86400000); }
  function dayToDate(startISO, day) { return addDays(parseISO(startISO), day); }
  function dowMon0(date) { return (date.getUTCDay() + 6) % 7; } // 0 = Montag
  function fmtDate(date, withDow = true) {
    const d = String(date.getUTCDate()).padStart(2, '0');
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    return (withDow ? DOW[dowMon0(date)] + '., ' : '') + d + '.' + m + '.' + date.getUTCFullYear();
  }
  function fmtShort(date) { return String(date.getUTCDate()).padStart(2, '0') + '.' + String(date.getUTCMonth() + 1).padStart(2, '0') + '.'; }
  function toISO(date) { return date.toISOString().slice(0, 10); }
  function daysInMonth(date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); }
  function dayOfYear(date) { return Math.floor((date - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000); }
  // Ostersonntag (Gauß/Anonymous Gregorian)
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, month - 1, day));
  }
  // n-ter Wochentag (dow: 0=So … 6=Sa) eines Monats
  function nthWeekday(y, month0, dow, n) {
    const first = new Date(Date.UTC(y, month0, 1));
    const offset = (dow - first.getUTCDay() + 7) % 7;
    return new Date(Date.UTC(y, month0, 1 + offset + (n - 1) * 7));
  }
  function blackFriday(y) { return addDays(nthWeekday(y, 10, 4, 4), 1); }

  // Saisonwert für ein Datum (lineare Interpolation zwischen Monatsmitten)
  function seasonAt(arr, date) {
    const m = date.getUTCMonth();
    const d = date.getUTCDate() / daysInMonth(date);
    if (d < 0.5) { const prev = arr[(m + 11) % 12]; return lerp(prev, arr[m], d + 0.5); }
    const next = arr[(m + 1) % 12];
    return lerp(arr[m], next, d - 0.5);
  }

  // ---------- Text ----------
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9äöüß\s+-]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stem(t) {
    if (t.length > 5 && /(en|er|es)$/.test(t)) return t.slice(0, -2);
    if (t.length > 4 && /[ens]$/.test(t)) return t.slice(0, -1);
    return t;
  }
  const STOP = new Set(['in', 'der', 'die', 'das', 'für', 'und', 'mit', 'von', 'am', 'im', 'den', 'ein', 'eine', 'zu', 'auf']);
  function tokens(s) { return norm(s).split(' ').filter((t) => t && !STOP.has(t)).map(stem); }

  G.U = {
    makeRng, clamp, lerp, sum, avg, div, sigmoid, fmt, DOW, MONTHS, parseISO, addDays, dayToDate, dowMon0,
    fmtDate, fmtShort, toISO, daysInMonth, dayOfYear, easter, nthWeekday, blackFriday, seasonAt, esc, norm, stem, tokens,
  };
})();
