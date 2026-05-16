import { getDb } from "../server/db";
import { bikes } from "../drizzle/schema";

async function checkDuplicates() {
  const db = await getDb();
  if (!db) {
    console.error("Database not found");
    return;
  }

  const allBikes = await db.select().from(bikes);
  console.log(`Total bikes in DB: ${allBikes.length}`);

  const idMap = new Map();
  const duplicateIds = [];

  for (const bike of allBikes) {
    if (idMap.has(bike.id)) {
      duplicateIds.push(bike.id);
    }
    idMap.set(bike.id, true);
  }

  if (duplicateIds.length > 0) {
    console.error("DUPLICATE IDs FOUND IN DB:", duplicateIds);
  } else {
    console.log("No duplicate IDs found in DB.");
  }

  const nameMap = new Map();
  const duplicateNames = [];
  for (const bike of allBikes) {
    const key = `${bike.name}_${bike.maker}`;
    if (nameMap.has(key)) {
      duplicateNames.push(key);
    }
    nameMap.set(key, true);
  }
  
  if (duplicateNames.length > 0) {
    console.warn("Potential duplicate entries (same name/maker):", duplicateNames.slice(0, 5));
  }
}

checkDuplicates().catch(console.error);
