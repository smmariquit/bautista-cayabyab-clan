// Turns the seeded dev.db into prisma/seed.sql, the file loaded into Cloudflare D1.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const tables = ["Person", "ParentChild", "Partnership", "User"];
const dump = execFileSync("sqlite3", ["dev.db", `.dump ${tables.join(" ")}`], { encoding: "utf8" })
  .split("\n")
  .filter((line) => !/^(PRAGMA|BEGIN|COMMIT)/.test(line))
  .join("\n");
const drops = ["ParentChild", "Partnership", "User", "Person"].map((t) => `DROP TABLE IF EXISTS "${t}";`).join("\n");
writeFileSync("prisma/seed.sql", `PRAGMA defer_foreign_keys = TRUE;\n${drops}\n${dump}`);
console.log("Wrote prisma/seed.sql");
