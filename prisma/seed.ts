import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { hashPassword } from "../src/lib/auth";
import { people, partnerships, families } from "./data";

const knownCodes = new Set(people.map(({ code }) => code));
if (knownCodes.size !== people.length) throw new Error("Duplicate family lineage code in seed data");
for (const codes of [...partnerships.map(([a, b]) => [a, b]), ...families.flat()]) {
  for (const code of codes) if (!knownCodes.has(code)) throw new Error(`Missing person for ${code}`);
}

const db = new Database("dev.db");
db.pragma("journal_mode = DELETE");
db.exec("DELETE FROM ParentChild; DELETE FROM Partnership; DELETE FROM Person; DELETE FROM User;");

const cuid = () => randomBytes(16).toString("hex").slice(0, 25);
const personIds = new Map<string, string>();
const insertPerson = db.prepare(`
  INSERT INTO Person (id, firstName, lastName, nicknames, suffix, lineageCode, gender,
    birthDate, deathDate, birthPlace, deathPlace, occupation, education, bio, photoUrl,
    generation, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL, ?, datetime('now'), datetime('now'))
`);

for (const person of people) {
  const id = cuid();
  personIds.set(person.code, id);
  insertPerson.run(
    id,
    person.firstName,
    person.lastName,
    person.nicknames ?? null,
    person.suffix ?? null,
    person.code,
    person.gender ?? null,
    person.birthDate ?? null,
    person.deathDate ?? null,
    person.occupation ?? null,
    person.education ?? null,
    person.bio ?? null,
    person.generation,
  );
}

const insertPartnership = db.prepare(`
  INSERT INTO Partnership (id, partner1Id, partner2Id, type, date, notes)
  VALUES (?, ?, ?, ?, NULL, NULL)
`);
for (const [first, second, type] of partnerships) {
  insertPartnership.run(cuid(), personIds.get(first), personIds.get(second), type);
}

const insertParentChild = db.prepare("INSERT INTO ParentChild (id, parentId, childId) VALUES (?, ?, ?)");
for (const [parents, children] of families) {
  for (const parent of parents) {
    for (const child of children) insertParentChild.run(cuid(), personIds.get(parent), personIds.get(child));
  }
}

const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "clanpassword123";
db.prepare(
  `
  INSERT INTO User (id, username, password, role, createdAt, updatedAt)
  VALUES (?, ?, ?, 'admin', datetime('now'), datetime('now'))
`,
).run(cuid(), adminUsername, hashPassword(adminPassword));

console.log(
  `Seeded ${people.length} people, ${partnerships.length} partnerships, and ${families.length} family groups.`,
);
db.close();
