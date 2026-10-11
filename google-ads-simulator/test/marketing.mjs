// Marketing & Team (ohne Browser): node test/marketing.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = vm.createContext({ console, Intl, Math, Date, JSON, Map, Set });
for (const f of ['util.js', 'data.js', 'model.js', 'engine.js', 'recs.js', 'bank.js', 'goals.js', 'psych.js', 'marketing.js']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
const GA = vm.runInContext('globalThis.GA', ctx);
const { M, E, MKT } = GA;
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.error('FAIL:', msg); } else console.log('ok  ', msg); };
const brandVol = (S) => S.queries.filter((q) => q.brand === 'player').reduce((a, q) => a + q.vol, 0);

for (const ind of ['fashion', 'vwbank', 'local']) {
  // Referenz ohne Marketing vs. mit Aktion (gleicher Seed)
  const run = (withAct) => {
    const S = M.newGame({ industry: ind, seed: 7, difficulty: 'normal' });
    S.company.cash += 300000; S.goals.trust = 80;
    for (let i = 0; i < 20; i++) E.simulateDay(S);
    MKT.state(S);
    const types = MKT.available(S);
    if (withAct) {
      const t = types.find((x) => x.id === ({ vwbank: 'verband', local: 'radio' }[ind] || 'tv')) || types[0];
      const r = MKT.launch(S, { type: t.id, size: 'M', exec: 'top', delay: 0 });
      check(r === true, `${ind}: Aktion ${t.id} gestartet (${r})`);
      for (const role of ['creative', 'copy', 'analyst', 'dev', 'social', 'sea', 'agency']) { const c = MKT.candidates(S, role, 'fix')[0]; check(MKT.hire(S, c) === true, `${ind}: ${role} eingestellt`); }
    }
    const cash0 = S.company.cash, b0 = brandVol(S);
    let peak = 0;
    for (let i = 0; i < 90; i++) { E.simulateDay(S); if (i < 30) peak += brandVol(S) / 30; }
    return { S, cash0, b0, peak };
  };
  const a = run(false), b = run(true);
  check(b.peak > a.peak * 1.1, `${ind}: Ø Markensuchvolumen (30 Tage) steigt durch Aktion (${Math.round(a.peak)} → ${Math.round(b.peak)})`);
  const st = b.S.mkt;
  check(st.actions[0].status === 'done' && st.actions[0].report, `${ind}: Auswertung erstellt – ${st.actions[0].report && st.actions[0].report.verdict}`);
  check(st.staff.every((p) => p.revealed), `${ind}: Qualität der Mitarbeitenden nach 30 Tagen sichtbar`);
  check(Number.isFinite(b.S.company.cash), `${ind}: Kasse plausibel (${Math.round(b.S.company.cash)})`);
  // Alle Aktionstypen einmal durchlaufen
  const S = M.newGame({ industry: ind, seed: 11, difficulty: 'normal' });
  S.company.cash += 2e6; S.goals.trust = 90;
  for (let i = 0; i < 5; i++) E.simulateDay(S);
  for (const t of MKT.available(S)) check(MKT.launch(S, { type: t.id, size: 'S', exec: 'inhouse', delay: 0 }) === true, `${ind}: ${t.id} startbar`);
  for (let i = 0; i < 100; i++) E.simulateDay(S);
  check(S.mkt.actions.every((x) => x.status === 'done'), `${ind}: alle Aktionen abgeschlossen`);
}
// Freigabe & Einstellungsstopp
const S = M.newGame({ industry: 'fashion', seed: 3, difficulty: 'normal' });
S.goals.trust = 30;
check(typeof MKT.launch(S, { type: 'tv', size: 'L', exec: 'top' }) === 'string', 'Große Aktion bei geringem Vertrauen abgelehnt');
check(typeof MKT.hire(S, MKT.candidates(S, 'dev', 'fix')[0]) === 'string', 'Einstellungsstopp bei geringem Vertrauen');
process.exit(failed ? 1 : 0);
