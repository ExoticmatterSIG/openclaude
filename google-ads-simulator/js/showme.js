/* Ads Simulator – „Zeig mir wo": Bezüge in Hilfetexten werden klickbar, springen zur Stelle und heben sie kurz hervor */
(function () {
  const G = globalThis.GA;
  const U = G.U, UI = G.UI, ACT = G.ACT, APP = G.APP;
  const esc = U.esc;
  const GD = (G.GUIDE = G.GUIDE || {});

  // Begriff → Ziel. card:<Übersichtskarte> · view:<Ansicht> · el:<Ansicht>|<CSS-Selektor>[|tab:<Gruppe>=<Wert>]
  const LINKS = [
    ['„Messqualität"', 'card:measure'], ['Karte „Messqualität"', 'card:measure'],
    ['„Budget-Pacing"', 'card:pacing'], ['Karte „Budget-Pacing"', 'card:pacing'],
    ['„Monatsvergleich"', 'card:month'], ['„Suchbegriffe ohne Conversion"', 'card:waste'], ['„Top-Keywords"', 'card:topkw'],
    ['„Tag testen"', 'el:conversions|[data-act="testtag"]'], ['„Tracking reparieren"', 'el:conversions|[data-act="fixtracking"]'],
    ['Tools → Conversions', 'view:conversions'], ['Tools → Tests', 'view:experiments'], ['Tools → Conversions → „Tag testen"', 'el:conversions|[data-act="testtag"]'],
    ['Consent Mode (erweitert)', 'el:conversions|[data-chg="consent"]'], ['Consent Mode auf „erweitert"', 'el:conversions|[data-chg="consent"]'], ['Consent Mode', 'el:conversions|[data-chg="consent"]'],
    ['Erweiterte Conversions', 'el:conversions|[data-chg="ec"]'], ['erweiterte Conversions', 'el:conversions|[data-chg="ec"]'],
    ['„▦ Spalten"', 'el:campaigns|[data-act="colpick"]'], ['▦ Spalten', 'el:campaigns|[data-act="colpick"]'],
    ['Einstellungen → Lernhilfen', 'el:settings|[data-chg="pref"]'],
    ['Unternehmen → Conversion & Psychologie', 'view:cro'], ['Conversion & Psychologie', 'view:cro'],
    ['Konditionen & Zinsen', 'view:conditions'], ['Unternehmen & GuV', 'view:business'], ['Tipps & Beratung', 'view:tips'],
    ['Reiter „Raster bearbeiten"', 'el:schedule|#sgrid|tab:sched=grid'], ['„Raster bearbeiten"', 'el:schedule|#sgrid|tab:sched=grid'], ['Werbezeitplaner', 'view:schedule'],
    ['Auktionsdaten', 'view:auction'], ['Merchant Center', 'view:products'], ['Suchbegriffbericht', 'view:searchterms'],
    ['„＋ Asset"', 'el:assets|[data-act="newasset"]'], ['＋ Asset', 'el:assets|[data-act="newasset"]'],
    ['News & Ereignisse', 'view:events'], ['Änderungsverlauf', 'view:history'], ['Keyword-Planer', 'view:planner'],
    ['Übersicht anpassen', 'el:overview|[data-act="ovedit"]'],
  ].sort((a, b) => b[0].length - a[0].length);
  const RE = new RegExp(LINKS.map(([t]) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const RE1 = new RegExp(RE.source);
  const MAP = Object.fromEntries(LINKS);
  const SCOPES = '.gd-body, .tiphow, .tipwhen, .bidhelp, .gd-sec, .callout, .acad-diff';

  GD.linkify = function (root) {
    if (!root || !APP.S) return;
    const conts = [...root.querySelectorAll(SCOPES)];
    if (root.matches && root.matches(SCOPES)) conts.push(root);
    for (const c of conts) {
      if (c.closest('.ovbar')) continue;
      const walker = document.createTreeWalker(c, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('a, button, summary, select, option, input, textarea, .gdlink, h1, h2') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      const nodes = [];
      while (walker.nextNode()) if (RE1.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
      for (const n of nodes) {
        RE.lastIndex = 0;
        const txt = n.nodeValue, frag = document.createDocumentFragment();
        let last = 0, m;
        while ((m = RE.exec(txt))) {
          const t = MAP[m[0]];
          if (!t || !available(t)) continue;
          if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
          const a = document.createElement('a');
          a.className = 'gdlink'; a.dataset.act = 'showme'; a.dataset.t = t; a.title = 'Zeig mir, wo das ist'; a.textContent = m[0];
          frag.appendChild(a);
          last = m.index + m[0].length;
        }
        if (last === 0) continue;
        if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
        n.parentNode.replaceChild(frag, n);
      }
      RE.lastIndex = 0;
    }
  };
  function available(t) {
    const v = t.startsWith('view:') ? t.slice(5) : t.startsWith('el:') ? t.slice(3).split('|')[0] : 'overview';
    if (v === 'conditions' && !APP.S.bank) return false;
    if (v === 'products' && !G.M.ind(APP.S).hasShopping) return false;
    return !!G.V[v];
  }
  const origAnnotate = UI.annotate;
  UI.annotate = function (root) { origAnnotate(root); try { GD.linkify(root); } catch (e) { console.error(e); } };

  // Springen & Hervorheben
  let spotTimer = null;
  function spot(el, label) {
    if (!el) return false;
    document.querySelectorAll('.gd-spot').forEach((x) => x.classList.remove('gd-spot'));
    document.querySelectorAll('.gd-spotlabel').forEach((x) => x.remove());
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('gd-spot');
    const lb = document.createElement('div');
    lb.className = 'gd-spotlabel'; lb.textContent = '👉 ' + label;
    document.body.appendChild(lb);
    const place = () => { const r = el.getBoundingClientRect(); lb.style.top = Math.max(8, r.top - lb.offsetHeight - 8) + 'px'; lb.style.left = Math.max(8, Math.min(window.innerWidth - lb.offsetWidth - 8, r.left)) + 'px'; };
    place(); setTimeout(place, 350); setTimeout(place, 700);
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => { el.classList.remove('gd-spot'); lb.remove(); }, 3200);
    return true;
  }
  GD.showMe = function (t, label) {
    if (UI.closeSheet) UI.closeSheet();
    UI.closeModal(); if (UI.hideTip) UI.hideTip();
    const [kind, rest] = [t.split(':')[0], t.slice(t.indexOf(':') + 1)];
    if (kind === 'card') {
      const added = UI.ovEnsure && UI.ovEnsure(rest);
      APP.ovEdit = false; APP.scope = { cid: null, agid: null };
      UI.go('overview');
      if (added) UI.toast(`Karte „${UI.OV_NAME(rest)}" wurde zu Ihrer Übersicht hinzugefügt`);
      setTimeout(() => spot(document.querySelector(`[data-ovid="${rest}"]`), UI.OV_NAME(rest) + ' (Übersicht)'), 60);
      return;
    }
    if (kind === 'view') {
      UI.go(rest);
      setTimeout(() => {
        const nav = document.querySelector(`#sidenav [data-act="nav"][data-v="${rest}"]`);
        const vis = nav && nav.offsetParent !== null && getComputedStyle(document.getElementById('sidenav')).transform === 'none';
        if (vis) spot(nav, 'Hier im Menü'); else spot(document.querySelector('#main .pagehead h1'), 'Sie sind hier');
      }, 60);
      return;
    }
    const [view, sel, tab] = rest.split('|');
    if (tab && tab.startsWith('tab:')) { const [g, v] = tab.slice(4).split('='); APP.tab[g] = v; }
    if (view === 'schedule' && !APP.scope.cid) { const c = APP.S.campaigns.find((x) => x.status === 'enabled' && !x.isTrial); if (c) APP.scope = { cid: c.id, agid: null }; }
    UI.go(view);
    setTimeout(() => {
      const el = document.querySelector('#main ' + sel) || document.querySelector(sel);
      const target = el && (el.closest('label, .field, .card > .hd, td, .filterbar') || el);
      if (!spot(target === el ? el : target, label || 'Hier')) spot(document.querySelector('#main .pagehead h1'), 'Sie sind hier');
    }, 60);
  };
  ACT.showme = (el, d) => GD.showMe(d.t, el && el.textContent.replace(/[„"]/g, ''));
})();
