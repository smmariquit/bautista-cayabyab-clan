// Exercises the graph helpers the poster is built from.
import assert from "node:assert/strict";
import { test } from "node:test";
import { fullName, indexPeople, reachableFrom, unionsOf } from "../src/lib/family";
import type { TreePerson } from "../src/lib/types";

const person = (id: string, over: Partial<TreePerson> = {}): TreePerson => ({
  id,
  firstName: id,
  lastName: "Test",
  nicknames: null,
  suffix: null,
  gender: null,
  generation: 0,
  lineageCode: id,
  occupation: null,
  bio: null,
  photoUrl: null,
  birthDate: null,
  deathDate: null,
  partners: [],
  children: [],
  parents: [],
  ...over,
});

// Perfecto-shaped fixture: one wife, one live-in partner, one child whose other parent is unknown.
const fixture = [
  person("p", {
    partners: [
      { id: "w", type: "married" },
      { id: "l", type: "livein" },
    ],
    children: ["c1", "c2", "c3"],
  }),
  person("w", { partners: [{ id: "p", type: "married" }], children: ["c1"] }),
  person("l", { partners: [{ id: "p", type: "livein" }], children: ["c2"] }),
  person("c1", { parents: ["p", "w"], generation: 1 }),
  person("c2", { parents: ["p", "l"], generation: 1 }),
  person("c3", { parents: ["p"], generation: 1 }),
  person("stranger"),
];

test("unionsOf groups children under the right partner and keeps the rest", () => {
  const index = indexPeople(fixture);
  const unions = unionsOf(index, index.byId.get("p")!);
  assert.deepEqual(
    unions.map((u) => [u.partner?.id, u.type, u.children.map((c) => c.id)]),
    [
      ["w", "married", ["c1"]],
      ["l", "livein", ["c2"]],
      [undefined, "unrecorded", ["c3"]],
    ],
  );
});

test("reachableFrom follows children and partners, not strangers", () => {
  const index = indexPeople(fixture);
  const seen = reachableFrom(index, [index.byId.get("p")!]);
  assert.deepEqual([...seen].sort(), ["c1", "c2", "c3", "l", "p", "w"]);
});

test("fullName never prints an empty line for an unnamed child", () => {
  assert.equal(fullName(person("x", { firstName: "", lastName: "Alhambra" })), "Alhambra");
  assert.equal(fullName(person("x", { firstName: "", lastName: "" })), "(name not recorded)");
  assert.equal(
    fullName(person("x", { firstName: "Perfecto", lastName: "Bautista", suffix: "Jr." })),
    "Perfecto Bautista Jr.",
  );
});
