import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { hashPassword } from "../src/lib/auth";

const db = new Database("dev.db");
db.pragma("journal_mode = WAL");

function cuid(): string {
  return randomBytes(16).toString("hex").slice(0, 25);
}

console.log("🌱 Seeding family tree database...");

// Clear existing data
db.exec("DELETE FROM ParentChild");
db.exec("DELETE FROM Partnership");
db.exec("DELETE FROM Person");
db.exec("DELETE FROM User");

interface PersonRow {
  id: string;
  firstName: string;
  lastName: string;
  nicknames: string | null;
  suffix: string | null;
  lineageCode: string | null;
  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
  occupation: string | null;
  education: string | null;
  bio: string | null;
  photoUrl: string | null;
  generation: number;
}

const insertPerson = db.prepare(`
  INSERT INTO Person (id, firstName, lastName, nicknames, suffix, lineageCode, gender, 
    birthDate, deathDate, birthPlace, deathPlace, occupation, education, bio, photoUrl, 
    generation, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertPartnership = db.prepare(`
  INSERT INTO Partnership (id, partner1Id, partner2Id, type, date, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertParentChild = db.prepare(`
  INSERT INTO ParentChild (id, parentId, childId)
  VALUES (?, ?, ?)
`);

const personMap = new Map<string, string>();

function addPerson(code: string, firstName: string, lastName: string, opts: Partial<PersonRow> = {}) {
  const id = cuid();
  insertPerson.run(
    id, firstName, lastName,
    opts.nicknames ?? null, opts.suffix ?? null, code,
    opts.gender ?? null, opts.birthDate ?? null, opts.deathDate ?? null,
    opts.birthPlace ?? null, opts.deathPlace ?? null,
    opts.occupation ?? null, opts.education ?? null, opts.bio ?? null,
    opts.photoUrl ?? null, opts.generation ?? 0
  );
  personMap.set(code, id);
  console.log(`  ✅ ${firstName} ${lastName} (${code})`);
  return id;
}

// ── GENERATION 0: Root Ancestors ──
addPerson("0.1", "Roberto", "Gundayao", { gender: "M", generation: 0 });
addPerson("0.2", "Anacleta", "Junio", { gender: "F", generation: 0 });

// ── GENERATION 1 ──
addPerson("1", "Florentina", "Gundayao", { nicknames: "Florin", gender: "F", generation: 1 });
addPerson("1.s", "Marcelino", "Cayabyab", { gender: "M", generation: 1 });
addPerson("2", "Genoveva", "Gundayao", { gender: "F", generation: 1 });
addPerson("3", "Leonila", "Gundayao", { gender: "F", generation: 1 });
addPerson("4", "Marcela", "Gundayao", { gender: "F", generation: 1 });
addPerson("5", "Mariano", "Gundayao", { gender: "M", generation: 1 });
addPerson("6", "Marcelino", "Gundayao", { gender: "M", generation: 1 });
addPerson("7", "Rufina", "Gundayao", { gender: "F", generation: 1 });
addPerson("8", "Placido", "Gundayao", { gender: "M", generation: 1 });
addPerson("9", "Victorina", "Gundayao", { gender: "F", generation: 1 });

// ── GENERATION 2: Children of Florentina & Marcelino ──
addPerson("1.1", "Pablo", "Cayabyab", { gender: "M", generation: 2 });
addPerson("1.1.s", "Camela", "de Vera", { nicknames: "Itang", gender: "F", generation: 2 });
addPerson("1.2", "Teresa", "Cayabyab", { nicknames: "Sisang", gender: "F", generation: 2 });
addPerson("1.2.s", "Gregorio", "Gundayao", { nicknames: "Gorio", gender: "M", generation: 2 });
addPerson("1.3", "Pastora", "Cayabyab", { gender: "F", generation: 2 });
addPerson("1.3.s", "Domingo", "Bautista", { gender: "M", generation: 2 });
addPerson("1.4", "Emeterio", "Cayabyab", { nicknames: "Iryong", gender: "M", generation: 2, occupation: "Traveling salesman" });
addPerson("1.4.s", "Teresita", "de Venecia", { nicknames: "Tessie", gender: "F", generation: 2 });
addPerson("1.5", "Pedro", "Cayabyab", { nicknames: "Pero,Pete", gender: "M", generation: 2, occupation: "Government employee in California" });
addPerson("1.6", "Teodorico", "Cayabyab", { nicknames: "Ikoy", gender: "M", generation: 2, occupation: "Government employee in Pangasinan" });
addPerson("1.7", "Esperita", "Cayabyab", { nicknames: "Itay", gender: "F", generation: 2 });
addPerson("1.7.s", "Enrique", "Reyes", { gender: "M", generation: 2 });
addPerson("1.8", "Crispino", "Cayabyab", { nicknames: "Pinoy", gender: "M", generation: 2, occupation: "Collector of bets of small town lottery" });
addPerson("1.9", "Siti", "Cayabyab", { gender: "M", generation: 2 });
addPerson("1.9.s", "Pacita", "Montemayor", { gender: "F", generation: 2 });

// ── GENERATION 3: Children of Pastora & Domingo ──
addPerson("1.3.1", "Perfecto", "Bautista", { nicknames: "Peling", gender: "M", generation: 3, occupation: "Medical Doctor, Governor", bio: "Governor of Sultan Kudarat province for 3 years, died in the 80s" });
addPerson("1.3.1.s", "Milagros", "de la Vega", { nicknames: "Mila", gender: "F", generation: 3 });
addPerson("1.3.2", "Petrocencia", "Bautista", { nicknames: "Patring", gender: "F", generation: 3 });
addPerson("1.3.2.s", "Perfecto", "Velasquez Jr.", { nicknames: "Peping", gender: "M", generation: 3 });
addPerson("1.3.3", "Rosario", "Bautista", { nicknames: "Chayong", gender: "F", generation: 3 });
addPerson("1.3.3.s", "Gonzalo", "del Fierro", { gender: "M", generation: 3 });
addPerson("1.3.4", "Roberto", "Bautista", { nicknames: "Bert", gender: "M", generation: 3, occupation: "Professor, United Nations Officer", bio: "10 years as Professor in the Philippines, 9 years in Malaysia, 10 years as UN Officer. UPLB named a building after him." });
addPerson("1.3.4.s", "Ofelia", "Karganilla", { nicknames: "Ofie", gender: "F", generation: 3, occupation: "Retired Professor in Horticulture", bio: "Director of a research center of UPLB for 6 years, recipient of many awards" });
addPerson("1.3.5", "Teofilo", "Bautista", { nicknames: "Turing", gender: "M", generation: 3, occupation: "Mechanical engineer" });
addPerson("1.3.5.s", "Emma", "Bongabong", { gender: "F", generation: 3 });
addPerson("1.3.6", "Salvador", "Bautista", { nicknames: "Ador,Buddy", gender: "M", generation: 3 });
addPerson("1.3.6.s", "Yolanda", "Vaño", { nicknames: "Yoly", gender: "F", generation: 3 });
addPerson("1.3.7", "Teodora", "Bautista", { nicknames: "Doray", gender: "F", generation: 3 });
addPerson("1.3.7.s", "Caruso", "Dequina", { gender: "M", generation: 3 });
addPerson("1.1.1", "Angel", "Cayabyab", { nicknames: "Gil", gender: "M", generation: 3 });
addPerson("1.1.2", "Caridad", "Cayabyab", { nicknames: "Caring", gender: "F", generation: 3 });
addPerson("1.9.1", "Susan", "Cayabyab", { gender: "F", generation: 3 });
addPerson("1.9.2", "Antonio", "Cayabyab", { gender: "M", generation: 3 });
addPerson("1.9.3", "Dolores", "Cayabyab", { gender: "F", generation: 3 });

// ── GENERATION 4: Grandchildren ──
addPerson("1.3.1.1", "Gwendolyn", "Bautista", { nicknames: "Gingging", gender: "F", generation: 4 });
addPerson("1.3.2.1", "Filomena", "Velasquez", { nicknames: "Mina", gender: "F", generation: 4, occupation: "School teacher and Principal" });
addPerson("1.3.2.1.s", "Cresencio", "Cruzada", { nicknames: "Cris", gender: "M", generation: 4, occupation: "Provincial Assessor" });
addPerson("1.3.2.3", "Lillie", "Velasquez", { gender: "F", generation: 4 });
addPerson("1.3.2.3.s", "Bienvenido", "Cruz", { nicknames: "Bien", gender: "M", generation: 4 });
addPerson("1.3.3.1", "Evelyn", "del Fierro", { gender: "F", generation: 4 });
addPerson("1.3.3.1.s", "Mariano", "Tamayo", { nicknames: "Mar", gender: "M", generation: 4, occupation: "US Navy" });
addPerson("1.3.3.2", "Alice", "del Fierro", { gender: "F", generation: 4 });
addPerson("1.3.3.2.s", "Melchor", "Taroy", { nicknames: "Boy", gender: "M", generation: 4 });
addPerson("1.3.4.1", "Laura Grace", "Bautista", { gender: "F", generation: 4, occupation: "Senior Manager for Food Safety, KraftHeinz" });
addPerson("1.3.4.2", "Roberto Jr.", "Bautista", { nicknames: "Bobby", gender: "M", generation: 4, occupation: "Economist, Entrepreneur", bio: "President of local chapter of Rotary International and Toastmaster's International" });
addPerson("1.3.4.3", "Marissa", "Bautista", { nicknames: "Riza,Maris", gender: "F", generation: 4, occupation: "Food scientist, instructor", bio: "Died at 29 years old of complications from Lupus" });
addPerson("1.3.4.4", "Belinda Lucille", "Bautista", { nicknames: "Lida,Belle", gender: "F", generation: 4, occupation: "Administrative officer" });
addPerson("1.3.4.5", "Kerry Phil", "Bautista", { nicknames: "Kerry", gender: "M", generation: 4, occupation: "Medical doctor", bio: "President of Makiling Medical Society and Laguna Medical Society" });
addPerson("1.3.5.1", "Evangeline", "Bautista", { nicknames: "Vangie", gender: "F", generation: 4, occupation: "Nurse" });
addPerson("1.3.5.2", "Perry", "Bautista", { gender: "M", generation: 4 });
addPerson("1.3.6.1", "Aida", "Bautista", { gender: "F", generation: 4 });
addPerson("1.3.6.2", "Giovanni", "Bautista", { gender: "M", generation: 4 });
addPerson("1.3.6.3", "Jonathan", "Bautista", { gender: "M", generation: 4 });
addPerson("1.3.6.4", "Andrew", "Bautista", { gender: "M", generation: 4 });
addPerson("1.3.7.1", "Teodycar", "Dequina", { gender: "F", generation: 4 });
addPerson("1.3.7.2", "Teresita", "Dequina", { nicknames: "Teng,Terry", gender: "F", generation: 4, occupation: "Nurse" });

// ── PARTNERSHIPS ──
const partnerPairs = [
  ["0.1", "0.2"], ["1", "1.s"], ["1.1", "1.1.s"], ["1.2", "1.2.s"],
  ["1.3", "1.3.s"], ["1.4", "1.4.s"], ["1.7", "1.7.s"],
  ["1.3.1", "1.3.1.s"], ["1.3.2", "1.3.2.s"], ["1.3.3", "1.3.3.s"],
  ["1.3.4", "1.3.4.s"], ["1.3.5", "1.3.5.s"], ["1.3.6", "1.3.6.s"],
  ["1.3.7", "1.3.7.s"], ["1.3.2.1", "1.3.2.1.s"], ["1.3.2.3", "1.3.2.3.s"],
  ["1.3.3.1", "1.3.3.1.s"], ["1.3.3.2", "1.3.3.2.s"], ["1.9", "1.9.s"],
];

for (const [c1, c2] of partnerPairs) {
  const id1 = personMap.get(c1), id2 = personMap.get(c2);
  if (id1 && id2) insertPartnership.run(cuid(), id1, id2, "married", null, null);
}
console.log(`\n  ✅ ${partnerPairs.length} partnerships created`);

// ── PARENT-CHILD RELATIONSHIPS ──
function addChildren(parentCodes: string[], childCodes: string[]) {
  for (const pc of parentCodes) {
    for (const cc of childCodes) {
      const pid = personMap.get(pc), cid = personMap.get(cc);
      if (pid && cid) insertParentChild.run(cuid(), pid, cid);
    }
  }
}

addChildren(["0.1", "0.2"], ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
addChildren(["1", "1.s"], ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9"]);
addChildren(["1.3", "1.3.s"], ["1.3.1", "1.3.2", "1.3.3", "1.3.4", "1.3.5", "1.3.6", "1.3.7"]);
addChildren(["1.3.1", "1.3.1.s"], ["1.3.1.1"]);
addChildren(["1.3.2", "1.3.2.s"], ["1.3.2.1", "1.3.2.3"]);
addChildren(["1.3.3", "1.3.3.s"], ["1.3.3.1", "1.3.3.2"]);
addChildren(["1.3.4", "1.3.4.s"], ["1.3.4.1", "1.3.4.2", "1.3.4.3", "1.3.4.4", "1.3.4.5"]);
addChildren(["1.3.5", "1.3.5.s"], ["1.3.5.1", "1.3.5.2"]);
addChildren(["1.3.6", "1.3.6.s"], ["1.3.6.1", "1.3.6.2", "1.3.6.3", "1.3.6.4"]);
addChildren(["1.3.7", "1.3.7.s"], ["1.3.7.1", "1.3.7.2"]);
addChildren(["1.1", "1.1.s"], ["1.1.1", "1.1.2"]);
addChildren(["1.9", "1.9.s"], ["1.9.1", "1.9.2", "1.9.3"]);

console.log("  ✅ Parent-child relationships created");

// ── SEED INITIAL USER ──
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "clanpassword123";
const hashedPassword = hashPassword(adminPassword);

const insertUser = db.prepare(`
  INSERT INTO User (id, username, password, role, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
`);
insertUser.run(cuid(), adminUsername, hashedPassword, "admin");
console.log(`  ✅ Editor user seeded: username='${adminUsername}', password='${adminPassword}'`);

console.log("\n🌳 Seeding complete!");

db.close();
