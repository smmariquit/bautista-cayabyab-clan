// The fan layout must give every label its own angle and number every footnote once.
import assert from "node:assert/strict";
import { test } from "node:test";
import { families, partnerships, people } from "../prisma/data";
import { indexPeople } from "../src/lib/family";
import { layoutFan } from "../src/lib/fan";
import type { TreePerson } from "../src/lib/types";

// Build the same shape the tree API returns, straight from the seed data.
const byCode = new Map(people.map((p) => [p.code, p]));
const tree: TreePerson[] = people.map((p) => ({
  id: p.code,
  firstName: p.firstName,
  lastName: p.lastName,
  nicknames: p.nicknames ?? null,
  suffix: p.suffix ?? null,
  gender: p.gender ?? null,
  generation: p.generation,
  lineageCode: p.code,
  occupation: p.occupation ?? null,
  education: p.education ?? null,
  bio: p.bio ?? null,
  photoUrl: null,
  birthDate: p.birthDate ?? null,
  deathDate: p.deathDate ?? null,
  partners: partnerships
    .filter(([a, b]) => a === p.code || b === p.code)
    .map(([a, b, type]) => ({ id: a === p.code ? b : a, type })),
  children: families.filter(([parents]) => parents.includes(p.code)).flatMap(([, kids]) => kids),
  parents: families.filter(([, kids]) => kids.includes(p.code)).flatMap(([parents]) => parents),
}));
const index = indexPeople(tree);
const branches = index.childrenOfCouple(byCode.get("B.1.3") && index.byId.get("B.1.3"), index.byId.get("1.3"));

test("seven wedges fill the half circle without overlapping", () => {
  const layout = layoutFan(index, branches);
  assert.equal(new Set(layout.top.map((n) => n.branch)).size, 7);
  const sum = layout.top.reduce((s, n) => s + (n.x1 - n.x0), 0);
  assert.ok(Math.abs(sum - Math.PI) < 1e-9);
  for (let depth = 1; depth <= layout.rings; depth++) {
    const ring = layout.nodes.filter((n) => n.depth === depth).sort((a, b) => a.x0 - b.x0);
    for (let i = 1; i < ring.length; i++) assert.ok(ring[i].x0 >= ring[i - 1].x1 - 1e-9, `overlap at depth ${depth}`);
    for (const n of ring) assert.ok(n.x1 - n.x0 >= n.need * 0.999, `${n.person.firstName} squeezed at depth ${depth}`);
  }
});

test("labels grew as far as the fan allows, and every descendant is on it", () => {
  const layout = layoutFan(index, branches);
  assert.ok(layout.scale > 1, `scale ${layout.scale}`);
  assert.ok(layout.fontAt(4) >= 3.9, "outer ring at least 11pt");
  const onFan = new Set(layout.nodes.flatMap((n) => [n.person.id, n.partner?.id]));
  const expected = tree.filter((p) => p.lineageCode?.startsWith("1.3") || p.lineageCode === "B.1.3").length;
  assert.equal(onFan.size - 1, expected - 2, "everyone under Domingo and Pastora except the couple themselves");
});

test("footnotes are numbered once per person in reading order", () => {
  const { notes, noteOf } = layoutFan(index, branches);
  assert.deepEqual(
    notes.map((n) => n.n),
    notes.map((_, i) => i + 1),
  );
  assert.equal(new Set(notes.map((n) => n.person.id)).size, notes.length);
  assert.equal(noteOf.size, notes.length);
  assert.ok(notes.every((n, i) => i === 0 || n.branch >= notes[i - 1].branch));
});
