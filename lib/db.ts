import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Creature } from "./types";

const globalForDb = globalThis as unknown as { galacticDb: Database.Database | undefined };

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS creatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      danger_level INTEGER NOT NULL,
      home_planet TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      clearance_level TEXT NOT NULL
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM creatures").get() as { c: number };
  if (count.c > 0) return;

  const insertCreature = db.prepare(
    `INSERT INTO creatures (id, name, species, danger_level, home_planet, description)
     VALUES (@id, @name, @species, @danger_level, @home_planet, @description)`
  );

  const creatures: Creature[] = [
    {
      id: 1,
      name: "Vorash the Hollow",
      species: "Void-siphon leviathan",
      danger_level: 9,
      home_planet: "Xylos Prime",
      description:
        "CLASSIFIED: feeds on jump-field bleed. Do not engage without Q-beacon containment.",
    },
    {
      id: 2,
      name: "Glimmer-mites",
      species: "Crystalline swarm entity",
      danger_level: 4,
      home_planet: "Nebula-7 Outpost",
      description:
        "TOP SECRET: hive-linked; corrosive to hull alloys. Breach logs reference Project Umbra.",
    },
    {
      id: 3,
      name: "Kethari Brood-mother",
      species: "Chitinous apex xenofauna",
      danger_level: 10,
      home_planet: "Kethara Rift",
      description:
        "EYES ONLY: coordinates subspace beacons; linked to missing convoy XR-19.",
    },
    {
      id: 4,
      name: "Solar wraith",
      species: "Plasma-phase predator",
      danger_level: 8,
      home_planet: "Helios Trench",
      description:
        "CLASSIFIED: hunts thermal signatures; suspected cause of Proxima relay blackouts.",
    },
    {
      id: 5,
      name: "Echo-lurker",
      species: "Psionic mimic",
      danger_level: 7,
      home_planet: "Orion Drift Station",
      description:
        "TOP SECRET: imprints crew voices; psych evals sealed under Directive 12.",
    },
    {
      id: 6,
      name: "Rustfang burrower",
      species: "Subterranean acid arthropod",
      danger_level: 5,
      home_planet: "Vantara IX",
      description:
        "LAB ONLY: degrades life-support scrubbers; sample tag RED-OMEGA.",
    },
    {
      id: 7,
      name: "Nyx-tide medusa",
      species: "Bioluminescent cnidarian megafauna",
      danger_level: 6,
      home_planet: "Erebus Depths",
      description:
        "CLASSIFIED: neurotoxin aerosol; evacuation order falsified in public records.",
    },
    {
      id: 8,
      name: "Titan spineback",
      species: "Armored megapede",
      danger_level: 7,
      home_planet: "Lunara Expanse",
      description:
        "EYES ONLY: kinetic armor piercing; field manual appendix removed from uplink.",
    },
    {
      id: 9,
      name: "Relay phantoms",
      species: "Electromagnetic symbiote pair",
      danger_level: 3,
      home_planet: "Sol-Proxima Gate",
      description:
        "TOP SECRET: benign unless provoked; carries encrypted burst fragments from unknown origin.",
    },
  ];

  const insertMany = db.transaction(() => {
    for (const row of creatures) {
      insertCreature.run(row);
    }
    db.exec(`
      INSERT INTO users (username, password, clearance_level) VALUES
        ('agent_kane', '9999d3f3a0d39a3d80ca3fe21c455678', 'Omega-Black'),
        ('dr_vex', 'de4b2dfe7295596b4f6dca84d781418a', 'Deep Vault'),
        ('cmd_tess', 'd17e5f43b86e142a4c4ecd80903a9cf7', 'Solar Crown'),
        ('analyst_rio', 'd2832fa0e6986721e038d8e2dfb4f421', 'Signal Gray'),
        ('xenon_7', '17ea4c9547edb80f4d2b63b686aa991d', 'Specter'),
        ('archivist', 'd0ebde9330af602cbaaf3ca6c9b5d34f', 'Admin');
    `);
  });

  insertMany();
}

function seedAdminIfMissing(db: Database.Database) {
  const row = db.prepare("SELECT id FROM users WHERE username = 'archivist'").get();
  if (row) return;
  db.prepare(
    `INSERT INTO users (username, password, clearance_level) VALUES ('archivist', 'd0ebde9330af602cbaaf3ca6c9b5d34f', 'Admin')`
  ).run();
}

export function getDb(): Database.Database {
  if (globalForDb.galacticDb) return globalForDb.galacticDb;

  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, "galactic.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  seedIfEmpty(db);
  seedAdminIfMissing(db);

  globalForDb.galacticDb = db;
  return db;
}
