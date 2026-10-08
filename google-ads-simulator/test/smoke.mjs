// Smoke-Test der Simulations-Engine (ohne Browser): node test/smoke.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = vm.createContext({ console, Intl, Math, Date, JSON, Map, Set });
for (const f of ['util.js', 'data.js', 'model.js', 'engine.js', 'recs.js', 'bank.js', 'goals.js', 'psych.js']) {
  if (fs.existsSync(path.join(dir, f))) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
}
const GA = vm.runInContext('globalThis.GA', ctx);
const { M, E, D, U } = GA;
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.error('FAIL:', msg); } else console.log('ok  ', msg); };

for (const ind of D.INDUSTRIES) {
  const S = M.newGame({ industry: ind.id, seed: 42, difficulty: 'normal' });
  const t0 = Date.now();
  for (let i = 0; i < 120; i++) E.simulateDay(S);
  const ms = Date.now() - t0;
  const tot = E.derive(E.sumRange(S, 'acct', 'all', 0, S.day));
  const c = S.campaigns[0];
  const last30 = E.derive(E.sumRange(S, 'camp', c.id, S.day - 30, S.day - 1));
  console.log(`\n[${ind.id}] ${ms} ms / 120 Tage | Impr ${Math.round(tot.imp)} Klicks ${Math.round(tot.clk)} CTR ${(tot.ctr*100).toFixed(2)}% CPC ${tot.cpc.toFixed(2)} Kosten ${tot.cost.toFixed(0)} Conv ${tot.conv.toFixed(1)} CPA ${tot.cpa.toFixed(2)} IS ${(last30.is*100).toFixed(1)}% lostB ${(last30.lostB*100).toFixed(1)}% Kasse ${S.company.cash.toFixed(0)} Events ${S.market.log.length}`);
  check(Number.isFinite(tot.cost) && tot.cost > 0, `${ind.id}: Kosten > 0`);
  check(tot.clk > 50, `${ind.id}: Klicks vorhanden`);
  check(last30.cost / 30 <= c.budget * 1.35, `${ind.id}: Ø Tageskosten (${(last30.cost/30).toFixed(1)}) nahe Budget ${c.budget}`);
  check(tot.ctr > 0.005 && tot.ctr < 0.25, `${ind.id}: CTR plausibel`);
  check(last30.is >= 0 && last30.is <= 1.0001, `${ind.id}: IS in [0,1]`);
  check(ms < 15000, `${ind.id}: Performance`);
  const json = JSON.stringify(S);
  check(json.length < 4.5e6, `${ind.id}: Spielstand ${(json.length/1e6).toFixed(2)} MB`);
}
process.exit(failed ? 1 : 0);
