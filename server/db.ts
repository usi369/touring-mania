import { eq, and, desc, inArray } from "drizzle-orm";
import { InsertUser, users, bikes, games, gameStates, playedCards, roundHistory, decks, likes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;

/**
 * Initialize the database connection.
 * Called with a D1Database (for Workers).
 */
export async function initDb(d1: any) {
  if (d1 && !_db) {
    const { drizzle: drizzleD1 } = await import("drizzle-orm/d1");
    _db = drizzleD1(d1);
  }
  return _db;
}

/**
 * Get the database instance.
 * Automatically initializes with local SQLite if not already initialized.
 */
export async function getDb() {
  if (!_db) {
    initDb();
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Game Logic Functions
 */

export type ComparisonCondition = 
  | "horsepowerHigh" | "horsepowerLow"
  | "fuelEfficiencyHigh" | "fuelEfficiencyLow"
  | "weightHigh" | "weightLow"
  | "seatHeightHigh" | "seatHeightLow"
  | "totalLengthHigh" | "totalLengthLow"
  | "yearHigh" | "yearLow"
  | "priceHigh" | "priceLow";

export type DeclarationDirection = "up" | "down";

/**
 * Get bike by ID
 */
export async function getBikeById(bikeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(bikes).where(eq(bikes.id, bikeId)).limit(1);
  return result[0] || null;
}

/**
 * Get comparison value from bike
 */
export function getComparisonValue(bike: typeof bikes.$inferSelect, condition: ComparisonCondition): number {
  switch (condition) {
    case "horsepowerHigh":
    case "horsepowerLow":
      return bike.horsepower;
    case "fuelEfficiencyHigh":
    case "fuelEfficiencyLow":
      return bike.fuelEfficiency;
    case "weightHigh":
    case "weightLow":
      return bike.weight;
    case "seatHeightHigh":
    case "seatHeightLow":
      return bike.seatHeight;
    case "totalLengthHigh":
    case "totalLengthLow":
      return bike.totalLength;
    case "yearHigh":
    case "yearLow":
      return bike.year;
    case "priceHigh":
    case "priceLow":
      return bike.price;
    default:
      return 0;
  }
}

/**
 * Initialize game
 */
export async function initializeGame(userId: number, playerCount: number, edition: string = 'r7_starter') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get bikes for the selected edition
  let editionCondition = eq(bikes.isR7Starter, true);
  if (edition === 'tokyo_remake') editionCondition = eq(bikes.isTokyoRemake, true);
  else if (edition === 'r6_complete') editionCondition = eq(bikes.isR6Complete, true);
  else if (edition === 'r7_mega') editionCondition = eq(bikes.isR7Mega, true);

  const selectedBikesRaw = await db.select().from(bikes).where(editionCondition);
  console.log(`[INIT] Edition: ${edition}, Fetched bikes from DB: ${selectedBikesRaw.length}`);
  
  if (selectedBikesRaw.length === 0) {
    throw new Error(`No cards found for the selected edition: ${edition}`);
  }

  // 1. Strict deduplication using Set and Map
  const uniqueIdSet = new Set(selectedBikesRaw.map(b => b.id));
  const bikeMap = new Map();
  selectedBikesRaw.forEach(bike => {
    if (!bikeMap.has(bike.id)) {
      bikeMap.set(bike.id, bike);
    }
  });
  
  const selectedBikes = Array.from(bikeMap.values());
  let bikeIds = Array.from(uniqueIdSet);
  
  console.log(`[INIT] Deduplication result: Raw=${selectedBikesRaw.length}, UniqueSet=${uniqueIdSet.size}, BikeMap=${bikeMap.size}`);

  if (bikeIds.length !== uniqueIdSet.size) {
    console.error(`[CRITICAL] ID mismatch detected! Set size ${uniqueIdSet.size} vs Array size ${bikeIds.length}`);
    bikeIds = Array.from(uniqueIdSet);
  }

  // 2. Shuffle selected bikes (using a more robust shuffle)
  const shuffled = [...bikeIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 3. Final Integrity Check before distribution
  const finalUniqueCheck = new Set(shuffled);
  if (finalUniqueCheck.size !== shuffled.length) {
    console.error(`[CRITICAL] Duplicates appeared in shuffled list! Shuffled=${shuffled.length}, Unique=${finalUniqueCheck.size}`);
    throw new Error("Critical duplication error during game initialization");
  }

  // Create game
  const gameResult = await db.insert(games).values({
    userId,
    playerCount,
    edition,
    status: "playing",
    currentRound: 1,
  }).returning({ id: games.id });

  const gameId = gameResult[0].id;
  console.log(`[INIT] Game created: ID ${gameId}`);

  // Distribute initial hand (4 cards per player)
  const handSize = 4;
  for (let i = 1; i <= playerCount; i++) {
    const startIdx = (i - 1) * handSize;
    const hand = shuffled.slice(startIdx, startIdx + handSize);
    console.log(`[INIT] Player ${i} initial hand: ${JSON.stringify(hand)}`);
    
    await db.insert(gameStates).values({
      gameId,
      playerId: i,
      hand: JSON.stringify(hand),
      passed: 0,
    });
  }

  // Create decks (remaining cards)
  const remainingStart = playerCount * handSize;
  const remaining = shuffled.slice(remainingStart);

  // Categorize remaining cards
  const smallCards = remaining.filter(id => {
    const bike = selectedBikes.find(b => b.id === id);
    return bike?.category === "small";
  });

  const mediumCards = remaining.filter(id => {
    const bike = selectedBikes.find(b => b.id === id);
    return bike?.category === "medium";
  });

  const largeCards = remaining.filter(id => {
    const bike = selectedBikes.find(b => b.id === id);
    return bike?.category === "large";
  });

  console.log(`[INIT] Decks created - Small: ${smallCards.length}, Medium: ${mediumCards.length}, Large: ${largeCards.length}`);

  await db.insert(decks).values([
    { gameId, category: "small", bikeIds: JSON.stringify(smallCards) },
    { gameId, category: "medium", bikeIds: JSON.stringify(mediumCards) },
    { gameId, category: "large", bikeIds: JSON.stringify(largeCards) },
  ]);

  return gameId;
}

/**
 * Roll dice (1-6)
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Get game by ID
 */
export async function getGameById(gameId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  return result[0] || null;
}

/**
 * Get game states
 */
export async function getGameStates(gameId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(gameStates).where(eq(gameStates.gameId, gameId));
}

/**
 * Get game decks
 */
export async function getGameDecks(gameId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(decks).where(eq(decks.gameId, gameId));
}

/**
 * Declare condition
 */
export async function declareCondition(gameId: number, playerId: number, condition: ComparisonCondition, direction: DeclarationDirection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const game = await getGameById(gameId);
  if (!game) throw new Error("Game not found");

  await db.insert(roundHistory).values({
    gameId,
    round: game.currentRound,
    declarationPlayer: playerId,
    condition,
    direction,
  });

  // Update game with declaration player
  await db.update(games).set({ declarationPlayer: playerId }).where(eq(games.id, gameId));
}

/**
 * Get current round declaration
 */
export async function getCurrentRoundDeclaration(gameId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const game = await getGameById(gameId);
  if (!game) throw new Error("Game not found");

  const result = await db
    .select()
    .from(roundHistory)
    .where(and(eq(roundHistory.gameId, gameId), eq(roundHistory.round, game.currentRound)))
    .limit(1);

  return result[0] || null;
}

/**
 * Calculate optimal declaration for CPU
 */
export async function calculateOptimalDeclaration(gameId: number, playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const gameState = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)))
    .limit(1);

  if (gameState.length === 0) throw new Error("Game state not found");

  const hand: number[] = JSON.parse(gameState[0].hand);
  const allBikes = await db.select().from(bikes);
  const bikesMap = new Map(allBikes.map(b => [b.id, b]));

  // Get all bikes in hand
  const handBikes = hand.map(id => bikesMap.get(id)!).filter(Boolean);

  const conditions: ComparisonCondition[] = [
    "horsepowerHigh", "horsepowerLow",
    "fuelEfficiencyHigh", "fuelEfficiencyLow",
    "weightHigh", "weightLow",
    "seatHeightHigh", "seatHeightLow",
    "totalLengthHigh", "totalLengthLow",
    "yearHigh", "yearLow",
    "priceHigh", "priceLow",
  ];

  let bestCondition = conditions[0];
  let maxPlayable = 0;

  for (const condition of conditions) {
    const playable = handBikes.filter(bike => {
      const value = getComparisonValue(bike, condition);
      return value > 0;
    }).length;

    if (playable > maxPlayable) {
      maxPlayable = playable;
      bestCondition = condition;
    }
  }

  const direction: DeclarationDirection = bestCondition.includes("High") ? "up" : "down";

  return { condition: bestCondition, direction };
}

/**
 * Get playable cards
 */
export async function getPlayableCards(gameId: number, playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const gameState = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)))
    .limit(1);

  if (gameState.length === 0) return [];

  const hand: number[] = JSON.parse(gameState[0].hand);
  const declaration = await getCurrentRoundDeclaration(gameId);

  if (!declaration) return hand;

  const lastPlayed = await db
    .select()
    .from(playedCards)
    .where(eq(playedCards.gameId, gameId))
    .orderBy(desc(playedCards.playedAt))
    .limit(1);

  if (lastPlayed.length === 0) return hand;

  const lastBikeIds: number[] = JSON.parse(lastPlayed[0].bikeIds);
  const lastBike = await getBikeById(lastBikeIds[0]);

  if (!lastBike) return [];

  const allBikes = await db.select().from(bikes);
  const bikesMap = new Map(allBikes.map(b => [b.id, b]));

  const playable: number[] = [];
  const lastValue = getComparisonValue(lastBike, declaration.condition as ComparisonCondition);

  for (const bikeId of hand) {
    const bike = bikesMap.get(bikeId);
    if (!bike) continue;

    const cardValue = getComparisonValue(bike, declaration.condition as ComparisonCondition);

    if (declaration.direction === "up") {
      if (cardValue > lastValue) playable.push(bikeId);
    } else {
      if (cardValue < lastValue) playable.push(bikeId);
    }
  }

  return playable;
}

/**
 * Validate card play
 */
export async function validateCardPlay(gameId: number, playerId: number, bikeIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const gameState = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)))
    .limit(1);

  if (gameState.length === 0) throw new Error("Game state not found");

  const hand: number[] = JSON.parse(gameState[0].hand);

  // Check if all cards are in hand
  for (const bikeId of bikeIds) {
    if (!hand.includes(bikeId)) {
      throw new Error("Card not in hand");
    }
  }

  // Check if all cards have same comparison value
  const allBikes = await db.select().from(bikes);
  const bikesMap = new Map(allBikes.map(b => [b.id, b]));

  const declaration = await getCurrentRoundDeclaration(gameId);
  if (!declaration) throw new Error("No declaration");

  const values = bikeIds.map(id => {
    const bike = bikesMap.get(id);
    if (!bike) throw new Error("Bike not found");
    return getComparisonValue(bike, declaration.condition as ComparisonCondition);
  });

  if (new Set(values).size !== 1) {
    throw new Error("Cards must have same comparison value");
  }

  return true;
}

/**
 * Play cards
 */
export async function playCards(gameId: number, playerId: number, bikeIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await validateCardPlay(gameId, playerId, bikeIds);

  // Remove cards from hand
  const gameState = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)))
    .limit(1);

  if (gameState.length === 0) throw new Error("Game state not found");

  const hand: number[] = JSON.parse(gameState[0].hand);
  const newHand = hand.filter(id => !bikeIds.includes(id));

  await db
    .update(gameStates)
    .set({ hand: JSON.stringify(newHand), passed: 0 })
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)));

  // Add cards to played
  await db.insert(playedCards).values({
    gameId,
    playerId,
    bikeIds: JSON.stringify(bikeIds),
  });
}

/**
 * Pass player
 */
export async function passPlayer(gameId: number, playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(gameStates)
    .set({ passed: 1 })
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)));
}

/**
 * Check if all passed
 */
export async function checkAllPassed(gameId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const game = await getGameById(gameId);
  if (!game) throw new Error("Game not found");

  const states = await db.select().from(gameStates).where(eq(gameStates.gameId, gameId));
  const allPassed = states.every(s => s.passed === 1);

  return allPassed;
}

/**
 * End round
 */
export async function endRound(gameId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const game = await getGameById(gameId);
  if (!game) throw new Error("Game not found");

  // Get last played card
  const lastPlayed = await db
    .select()
    .from(playedCards)
    .where(eq(playedCards.gameId, gameId))
    .orderBy(desc(playedCards.playedAt))
    .limit(1);

  const nextDeclarationPlayer = lastPlayed.length > 0 ? lastPlayed[0].playerId : 1;

  // Clear played cards
  await db.delete(playedCards).where(eq(playedCards.gameId, gameId));

  // Reset passed flags
  await db
    .update(gameStates)
    .set({ passed: 0 })
    .where(eq(gameStates.gameId, gameId));

  // Clear bind
  await db
    .update(games)
    .set({
      currentRound: game.currentRound + 1,
      declarationPlayer: nextDeclarationPlayer,
      currentBind: null,
      bindValue: null,
    })
    .where(eq(games.id, gameId));
}

/**
 * Check game finished
 */
export async function checkGameFinished(gameId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const states = await db.select().from(gameStates).where(eq(gameStates.gameId, gameId));
  const finished = states.some(s => s.rank === 1);

  return finished;
}

/**
 * Assign rank
 */
export async function assignRank(gameId: number, playerId: number, rank: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(gameStates)
    .set({ rank })
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)));
}

/**
 * Get available bind types
 */
export async function getAvailableBindTypes(gameId: number, playerId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const game = await getGameById(gameId);
  if (!game || game.currentBind) return [];

  const lastPlayed = await db
    .select()
    .from(playedCards)
    .where(eq(playedCards.gameId, gameId))
    .orderBy(desc(playedCards.playedAt))
    .limit(1);

  if (lastPlayed.length === 0) return [];

  const lastBikeIds: number[] = JSON.parse(lastPlayed[0].bikeIds);
  const lastBike = await getBikeById(lastBikeIds[0]);

  if (!lastBike) return [];

  const gameState = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)))
    .limit(1);

  if (gameState.length === 0) return [];

  const hand: number[] = JSON.parse(gameState[0].hand);
  const allBikes = await db.select().from(bikes);
  const bikesMap = new Map(allBikes.map(b => [b.id, b]));

  const available: string[] = [];

  // Check cylinders bind
  const cylindersMatch = hand.some(id => {
    const bike = bikesMap.get(id);
    return bike && bike.cylinders === lastBike.cylinders;
  });
  if (cylindersMatch) available.push("cylinders");

  // Check transmission bind
  const transmissionMatch = hand.some(id => {
    const bike = bikesMap.get(id);
    return bike && bike.transmission === lastBike.transmission;
  });
  if (transmissionMatch) available.push("transmission");

  // Check maker bind
  const makerMatch = hand.some(id => {
    const bike = bikesMap.get(id);
    return bike && bike.maker === lastBike.maker;
  });
  if (makerMatch) available.push("maker");

  return available;
}

/**
 * Activate bind
 */
export async function activateBind(gameId: number, bindType: string, bindValue: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(games)
    .set({ currentBind: bindType, bindValue })
    .where(eq(games.id, gameId));
}

/**
 * Get playable cards with bind
 */
export async function getPlayableCardsWithBind(gameId: number, playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const playable = await getPlayableCards(gameId, playerId);
  const game = await getGameById(gameId);

  if (!game || !game.currentBind) return playable;

  const allBikes = await db.select().from(bikes);
  const bikesMap = new Map(allBikes.map(b => [b.id, b]));

  return playable.filter(bikeId => {
    const bike = bikesMap.get(bikeId);
    if (!bike) return false;

    if (game.currentBind === "cylinders") {
      return bike.cylinders === game.bindValue;
    } else if (game.currentBind === "transmission") {
      return bike.transmission === game.bindValue;
    } else if (game.currentBind === "maker") {
      return bike.maker === game.bindValue;
    }

    return false;
  });
}

/**
 * Draw card from deck
 */
export async function drawCardFromDeck(gameId: number, category: "small" | "medium" | "large") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deck = await db
    .select()
    .from(decks)
    .where(and(eq(decks.gameId, gameId), eq(decks.category, category)))
    .limit(1);

  if (deck.length === 0) return null;

  const bikeIds: number[] = JSON.parse(deck[0].bikeIds);
  if (bikeIds.length === 0) return null;

  const drawnId = bikeIds[0];
  const remaining = bikeIds.slice(1);

  await db
    .update(decks)
    .set({ bikeIds: JSON.stringify(remaining) })
    .where(and(eq(decks.gameId, gameId), eq(decks.category, category)));

  return drawnId;
}

/**
 * CPU AI Logic
 */

/**
 * Get CPU best move
 */
export async function getCPUBestMove(gameId: number, playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const gameState = await db
    .select()
    .from(gameStates)
    .where(and(eq(gameStates.gameId, gameId), eq(gameStates.playerId, playerId)))
    .limit(1);

  if (gameState.length === 0) return null;

  const hand: number[] = JSON.parse(gameState[0].hand);
  if (hand.length === 0) return null;

  const playableWithBind = await getPlayableCardsWithBind(gameId, playerId);
  if (playableWithBind.length === 0) return null;

  const declaration = await getCurrentRoundDeclaration(gameId);
  if (!declaration) return null;

  const allBikes = await db.select().from(bikes);
  const bikesMap = new Map(allBikes.map(b => [b.id, b]));

  // Group by comparison value
  const grouped = new Map<number, number[]>();
  for (const bikeId of playableWithBind) {
    const bike = bikesMap.get(bikeId);
    if (!bike) continue;

    const value = getComparisonValue(bike, declaration.condition as ComparisonCondition);
    if (!grouped.has(value)) {
      grouped.set(value, []);
    }
    grouped.get(value)!.push(bikeId);
  }

  // Find group with most cards
  let bestGroup: number[] = [];
  grouped.forEach((group) => {
    if (group.length > bestGroup.length) {
      bestGroup = group;
    }
  })

  return bestGroup.length > 0 ? bestGroup : null;
}

/**
 * Get CPU decision
 */
export async function getCPUDecision(gameId: number, playerId: number) {
  const bestMove = await getCPUBestMove(gameId, playerId);

  if (bestMove && bestMove.length > 0) {
    return { action: "play" as const, bikeIds: bestMove };
  }

  const playable = await getPlayableCardsWithBind(gameId, playerId);
  if (playable.length === 0) {
    return { action: "pass" as const };
  }

  return { action: "pass" as const };
}

/**
 * Get all bikes with automatic seeding if table is empty
 */
export async function listBikesWithAutoSeed() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let result = await db.select().from(bikes);
  
  if (result.length === 0) {
    console.log("[API] Bikes table empty, triggering auto-seed...");
    await seedBikesInternal();
    result = await db.select().from(bikes);
  }

  return result;
}

/**
 * Seed bikes internally from JSON file
 */
export async function seedBikesInternal() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataPath = path.join(process.cwd(), 'bikes_data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error(`[Seed] Data file not found at ${dataPath}`);
      return;
    }

    const bikesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`[Seed] Found ${bikesData.length} bikes in JSON. Inserting...`);

    // Use a transaction for efficiency
    await db.transaction(async (tx) => {
      // Clear existing just in case
      await tx.delete(bikes).execute();
      
      for (const bike of bikesData) {
        await tx.insert(bikes).values({
          id: bike.id,
          name: bike.name,
          maker: bike.maker,
          category: bike.category,
          cylinders: bike.cylinders.toString(),
          transmission: bike.transmission,
          horsepower: bike.horsepower,
          fuelEfficiency: bike.fuelEfficiency,
          weight: bike.weight,
          seatHeight: bike.seatHeight,
          totalLength: bike.totalLength,
          year: bike.year,
          price: bike.price,
          photoUrl: bike.photoUrl || null,
          isTokyoRemake: !!bike.isTokyoRemake,
          isR6Complete: !!bike.isR6Complete,
          isR7Mega: !!bike.isR7Mega,
          isR7Starter: !!bike.isR7Starter,
        }).execute();
      }
    });

    console.log(`[Seed] Successfully seeded ${bikesData.length} bikes internally`);
  } catch (error) {
    console.error("[Seed] Internal seeding failed:", error);
    throw error;
  }
}

