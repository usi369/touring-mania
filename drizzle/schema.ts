import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: text("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: text("email", { length: 320 }),
  loginMethod: text("loginMethod", { length: 64 }),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Bikes table - Master data for all 78 bike cards
 */
export const bikes = sqliteTable("bikes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).notNull(),
  maker: text("maker", { length: 255 }).notNull(),
  category: text("category", { enum: ["large", "medium", "small"] }).notNull(),
  cylinders: text("cylinders", { length: 10 }).notNull(), // "単", "2", "3", "4"
  transmission: text("transmission", { enum: ["AT", "MT"] }).notNull(),
  horsepower: integer("horsepower").notNull(),
  fuelEfficiency: integer("fuelEfficiency").notNull(), // km/l
  weight: integer("weight").notNull(), // kg
  seatHeight: integer("seatHeight").notNull(), // mm
  totalLength: integer("totalLength").notNull(), // mm
  year: integer("year").notNull(),
  price: integer("price").notNull(), // 万円
  photoUrl: text("photoUrl", { length: 500 }), // R2上のバイク画像URL
  isTokyoRemake: integer("isTokyoRemake", { mode: "boolean" }).default(false).notNull(),
  isR6Complete: integer("isR6Complete", { mode: "boolean" }).default(false).notNull(),
  isR7Mega: integer("isR7Mega", { mode: "boolean" }).default(false).notNull(),
  isR7Starter: integer("isR7Starter", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type Bike = typeof bikes.$inferSelect;
export type InsertBike = typeof bikes.$inferInsert;

/**
 * Games table - Game session management
 */
export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(), // Game creator (Player 1)
  playerCount: integer("playerCount").notNull(), // 2-4 players
  edition: text("edition", { length: 50 }).default("r7_starter").notNull(), // Game Edition selected
  status: text("status", { enum: ["playing", "finished"] }).default("playing").notNull(),
  currentRound: integer("currentRound").default(1).notNull(),
  currentTurn: integer("currentTurn").default(1).notNull(), // Current player turn (1-4)
  declarationPlayer: integer("declarationPlayer"), // Current declaration player ID (1-4)
  declaredSpec: text("declaredSpec", { length: 50 }), // Declared spec: "cylinders", "seatHeight", "totalLength", "price"
  declaredDirection: text("declaredDirection", { length: 10 }), // "up" or "down"
  prevDeclaredSpec: text("prevDeclaredSpec", { length: 50 }), // Previous declared spec (cannot repeat same spec+direction)
  prevDeclaredDirection: text("prevDeclaredDirection", { length: 10 }), // Previous declared direction
  currentBind: text("currentBind", { length: 50 }), // Current bind: "cylinders", "transmission", "maker", or null
  bindValue: text("bindValue", { length: 255 }), // The value of the bind condition
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * GameStates table - Player state during game
 */
export const gameStates = sqliteTable("gameStates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("gameId").notNull(),
  playerId: integer("playerId").notNull(), // 1-4 (1 = human, 2-4 = CPU)
  hand: text("hand").notNull(), // JSON array of bike IDs
  passed: integer("passed").default(0).notNull(), // 0 = not passed, 1 = passed
  rank: integer("rank"), // 1, 2, 3, 4 (null = still playing)
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type GameState = typeof gameStates.$inferSelect;
export type InsertGameState = typeof gameStates.$inferInsert;

/**
 * PlayedCards table - Cards currently on the table
 */
export const playedCards = sqliteTable("playedCards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("gameId").notNull(),
  playerId: integer("playerId").notNull(),
  bikeIds: text("bikeIds").notNull(), // JSON array of bike IDs
  playedAt: integer("playedAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type PlayedCard = typeof playedCards.$inferSelect;
export type InsertPlayedCard = typeof playedCards.$inferInsert;

/**
 * RoundHistory table - Declaration and bind information for each round
 */
export const roundHistory = sqliteTable("roundHistory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("gameId").notNull(),
  round: integer("round").notNull(),
  declarationPlayer: integer("declarationPlayer").notNull(),
  condition: text("condition", { length: 50 }).notNull(), // "horsepowerHigh", "horsepowerLow", etc.
  direction: text("direction", { enum: ["up", "down"] }).notNull(),
  bindType: text("bindType", { length: 50 }), // "cylinders", "transmission", "maker", or null
  bindValue: text("bindValue", { length: 255 }), // The value of the bind
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type RoundHistory = typeof roundHistory.$inferSelect;
export type InsertRoundHistory = typeof roundHistory.$inferInsert;

/**
 * Decks table - Card deck management (small, medium, large)
 */
export const decks = sqliteTable("decks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("gameId").notNull(),
  category: text("category", { enum: ["small", "medium", "large"] }).notNull(),
  bikeIds: text("bikeIds").notNull(), // JSON array of bike IDs
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = typeof decks.$inferInsert;

/**
 * Likes table - Store global "Like" counts for Coming Soon page
 */
export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  count: integer("count").default(0).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

export const otps = sqliteTable("otps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email", { length: 320 }).notNull(),
  code: text("code", { length: 10 }).notNull(),
  status: text("status", { enum: ["pending", "verified", "expired"] }).default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type Otp = typeof otps.$inferSelect;
export type InsertOtp = typeof otps.$inferInsert;

/**
 * UserGarage table - Stores favorite bike (my bike) for each user
 */
export const userGarage = sqliteTable("userGarage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  bikeId: integer("bikeId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type UserGarage = typeof userGarage.$inferSelect;
export type InsertUserGarage = typeof userGarage.$inferInsert;
