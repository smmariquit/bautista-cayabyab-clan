// Checks the transcribed clan record against the scanned document.
import assert from "node:assert/strict";
import { test } from "node:test";
import { families, partnerships, people } from "../prisma/data";

const byCode = new Map(people.map((p) => [p.code, p]));
const get = (code: string) => {
  const p = byCode.get(code);
  assert.ok(p, `missing ${code}`);
  return p;
};

test("lineage codes are unique and every reference resolves", () => {
  assert.equal(byCode.size, people.length);
  for (const [a, b] of partnerships) {
    get(a);
    get(b);
  }
  for (const [parents, children] of families) {
    parents.forEach(get);
    children.forEach(get);
    assert.ok(children.length > 0, `family of ${parents.join("+")} has no children`);
  }
});

test("everyone is placed: a child, a partner, or a founding ancestor", () => {
  const placed = new Set<string>();
  families.forEach(([parents, children]) => [...parents, ...children].forEach((c) => placed.add(c)));
  partnerships.forEach(([a, b]) => (placed.add(a), placed.add(b)));
  const loose = people.filter((p) => !placed.has(p.code)).map((p) => p.code);
  assert.deepEqual(loose, []);
});

test("children carry a generation one deeper than their parents", () => {
  for (const [parents, children] of families) {
    const gen = Math.min(...parents.map((c) => get(c).generation));
    for (const c of children) assert.equal(get(c).generation, gen + 1, `${c} generation`);
  }
});

test("counts match the December 2024 record", () => {
  assert.equal(people.length, 250);
  const founding = families.find(([p]) => p[0] === "1.3")!;
  assert.equal(founding[1].length, 7, "Domingo and Pastora had seven children");
  assert.equal(people.filter((p) => p.deathDate).length, 12, "twelve + marks in the source");
});

test("footnotes land on the right people (they restart per family in the source)", () => {
  // Page 3, Cayabyab line
  assert.equal(get("1.2.s").occupation, "Traveling salesman");
  assert.match(get("1.4").occupation!, /grape pickers in Stockton/);
  assert.match(get("1.5").occupation!, /Emeterio/);
  assert.equal(get("1.6").occupation, "Government employee in California");
  assert.equal(get("1.7.s").occupation, "Government employee in Pangasinan");
  assert.match(get("1.8").occupation!, /lottery/);
  // Page 4, Petrocencia's family
  assert.equal(get("1.3.2").occupation, "School teacher and principal");
  assert.equal(get("1.3.2.s").occupation, "Provincial assessor");
  assert.equal(get("1.3.2.1").occupation, "Physical education teacher");
  assert.equal(get("1.3.2.1.s").occupation, "Music teacher");
  assert.equal(get("1.3.2.1.2").occupation, "Nurse");
  // Page 6, Salvador's family
  assert.equal(get("1.3.6.s").occupation, "Nurse");
});

test("the unnamed Alhambra child is kept", () => {
  const alhambras = families.find(([p]) => p.includes("1.3.7.1.s2"))![1];
  assert.equal(alhambras.length, 3);
  assert.equal(get(alhambras[0]).firstName, "");
});
