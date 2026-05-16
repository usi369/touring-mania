import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

async function scanGameStates() {
  const stateDir = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1');
  const findDbFile = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        const found = findDbFile(fullPath);
        if (found) return found;
      } else if (fs.readFileSync(fullPath, {start: 0, end: 15}).toString().startsWith('SQLite format 3')) {
        return fullPath;
      }
    }
    return null;
  };

  const dbPath = findDbFile(stateDir);
  if (!dbPath) return;
  const db = new Database(dbPath);

  console.log("--- Scanning Game States for Duplicates ---");
  const states = db.prepare("SELECT * FROM gameStates").all();
  for (const s of states) {
    const hand = JSON.parse(s.hand);
    const dups = hand.filter((item, index) => hand.indexOf(item) !== index);
    if (dups.length > 0) {
      console.error(`Game ${s.gameId}, Player ${s.playerId} has DUPLICATES in hand:`, dups);
    }
  }

  console.log("--- Scanning Decks for Duplicates ---");
  const decks = db.prepare("SELECT * FROM decks").all();
  for (const d of decks) {
    const ids = JSON.parse(d.bikeIds);
    const dups = ids.filter((item, index) => ids.indexOf(item) !== index);
    if (dups.length > 0) {
      console.error(`Game ${d.gameId}, Category ${d.category} has DUPLICATES in deck:`, dups);
    }
  }

  console.log("--- Checking Cross-Player/Deck Duplicates ---");
  const gameIds = [...new Set(states.map(s => s.gameId))];
  for (const gid of gameIds) {
    const allIdsInGame = [];
    const gStates = states.filter(s => s.gameId === gid);
    const gDecks = decks.filter(d => d.gameId === gid);
    
    for (const s of gStates) {
      const hand = JSON.parse(s.hand);
      for (const id of hand) {
        if (allIdsInGame.includes(id)) {
          console.error(`Game ${gid}: ID ${id} is duplicated (found in Player ${s.playerId} hand)`);
        }
        allIdsInGame.push(id);
      }
    }
    for (const d of gDecks) {
      const ids = JSON.parse(d.bikeIds);
      for (const id of ids) {
        if (allIdsInGame.includes(id)) {
          console.error(`Game ${gid}: ID ${id} is duplicated (found in ${d.category} deck)`);
        }
        allIdsInGame.push(id);
      }
    }
  }
}

scanGameStates().catch(console.error);
