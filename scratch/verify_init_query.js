import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

async function verifyQueryDirectly() {
  // Find local DB file
  const stateDir = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1');
  if (!fs.existsSync(stateDir)) {
    console.error("Wrangler state dir not found");
    return;
  }

  // Find the SQLite file (it has a random name in a subdirectory)
  const findDbFile = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        const found = findDbFile(fullPath);
        if (found) return found;
      } else if (file.endsWith('.sqlite') || file === 'db.sqlite' || file.includes('miniflare-D1Database')) {
        // Miniflare 3 uses files with hex names and no extension often, or .sqlite
        if (fs.readFileSync(fullPath, {start: 0, end: 15}).toString().startsWith('SQLite format 3')) {
          return fullPath;
        }
      }
    }
    return null;
  };

  const dbPath = findDbFile(stateDir);
  if (!dbPath) {
    console.error("SQLite database file not found in .wrangler dir");
    return;
  }

  console.log(`Using database: ${dbPath}`);
  const db = new Database(dbPath);

  const editions = [
    { name: 'r7_starter', col: 'isR7Starter' },
    { name: 'tokyo_remake', col: 'isTokyoRemake' },
    { name: 'r6_complete', col: 'isR6Complete' },
    { name: 'r7_mega', col: 'isR7Mega' }
  ];
  
  for (const edition of editions) {
    console.log(`--- Checking edition: ${edition.name} ---`);
    const rows = db.prepare(`SELECT id, name FROM bikes WHERE ${edition.col} = 1`).all();
    console.log(`Total selected: ${rows.length}`);

    const idCounts = new Map();
    for (const b of rows) {
      idCounts.set(b.id, (idCounts.get(b.id) || 0) + 1);
    }

    const duplicates = Array.from(idCounts.entries()).filter(([id, count]) => count > 1);
    if (duplicates.length > 0) {
      console.error(`DUPLICATES FOUND for ${edition.name}:`, duplicates);
    } else {
      console.log(`No duplicates for ${edition.name}.`);
    }
  }
}

verifyQueryDirectly().catch(console.error);
