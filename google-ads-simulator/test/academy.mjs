// Akademie-Test (ohne Browser): Praxisaufgaben aufsetzen, Checks dürfen anfangs nicht erfüllt sein: node test/academy.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = vm.createContext({ console, Intl, Math, Date, JSON, Map, Set });
for (const f of ['util.js', 'data.js', 'model.js', 'engine.js', 'recs.js', 'bank.js', 'goals.js', 'psych.js', 'academy-content.js']) {
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
}
const GA = vm.runInContext('globalThis.GA', ctx);
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.error('FAIL:', msg); } else console.log('ok  ', msg); };
const COURSES = GA.ACADEMY_CONTENT.COURSES;
for (const c of COURSES) {
  check(c.lessons.length >= 2 && c.lessons.every((l) => l.body && l.diff && l.quiz && l.quiz.length), `${c.id}: Lektionen vollständig`);
  for (const l of c.lessons) for (const q of l.quiz) { check(q.c >= 0 && q.c < q.a.length, `${c.id}.${l.id}: Quiz-Lösung gültig`); check(Array.isArray(q.ex) && q.ex.length === q.a.length && q.ex.every(Boolean), `${c.id}.${l.id}: Erklärung je Antwort`); }
  if (!c.mission) continue;
  const S = GA.M.newGame({ industry: c.mission.industry, seed: 4242 + COURSES.indexOf(c), difficulty: 'normal', starter: true });
  c.mission.setup(S);
  const res = c.mission.checks.map((k) => { try { return !!k.test(S); } catch (e) { console.error(e); return 'ERR'; } });
  console.log(`   ${c.id} Ausgangslage: ${res.join(', ')}`);
  check(!res.includes('ERR'), `${c.id}: Checks laufen fehlerfrei`);
  check(res.some((r) => r === false), `${c.id}: Aufgabe ist nicht schon gelöst`);
}
process.exit(failed ? 1 : 0);
