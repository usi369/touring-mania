import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { games, gameStates, bikes, decks, playedCards } from "../../drizzle/schema";
import { eq, inArray, and, desc, asc, sql, ne } from "drizzle-orm";
import { rollDice, determineTurnOrder, canPlayCard, getNextPlayer } from "../gameLogic";
import { decideCPUAction, decideCPUDeclaration } from "../cpuAI";

/** ゲーム整合性チェック: 全手札・デッキ・場札間でカードIDの重複がないか検証 */
async function checkGameIntegrity(db: any, gameId: number, caller: string) {
  try {
    const states = await db.select().from(gameStates).where(eq(gameStates.gameId, gameId));
    const gameDecks = await db.select().from(decks).where(eq(decks.gameId, gameId));
    const field = await db.select().from(playedCards).where(eq(playedCards.gameId, gameId));

    const allIds: { source: string; id: number }[] = [];

    states.forEach((s: any) => {
      const hand: number[] = typeof s.hand === 'string' ? JSON.parse(s.hand) : s.hand || [];
      // 手札内重複チェック
      const handSet = new Set(hand);
      if (handSet.size !== hand.length) {
        console.error(`[INTEGRITY:${caller}] ★★★ P${s.playerId} 手札内重複! hand=${JSON.stringify(hand)}`);
      }
      hand.forEach((id: number) => allIds.push({ source: `P${s.playerId}_hand`, id }));
    });

    gameDecks.forEach((d: any) => {
      const ids: number[] = typeof d.bikeIds === 'string' ? JSON.parse(d.bikeIds) : d.bikeIds || [];
      ids.forEach((id: number) => allIds.push({ source: `deck_${d.category}`, id }));
    });

    field.forEach((f: any) => {
      const ids: number[] = typeof f.bikeIds === 'string' ? JSON.parse(f.bikeIds) : f.bikeIds || [];
      ids.forEach((id: number) => allIds.push({ source: `field_P${f.playerId}`, id }));
    });

    // 全体の重複検出
    const idMap = new Map<number, string[]>();
    allIds.forEach(({ source, id }) => {
      if (!idMap.has(id)) idMap.set(id, []);
      idMap.get(id)!.push(source);
    });

    const duplicates = Array.from(idMap.entries()).filter(([_, sources]) => sources.length > 1);
    if (duplicates.length > 0) {
      console.error(`[INTEGRITY:${caller}] ★★★ DUPLICATE DETECTED! gameId=${gameId}`);
      duplicates.forEach(([id, sources]) => {
        console.error(`  ID ${id} -> ${sources.join(', ')}`);
      });
    } else {
      console.log(`[INTEGRITY:${caller}] OK gameId=${gameId} total=${allIds.length}cards`);
    }
    return duplicates;
  } catch (e) {
    console.error(`[INTEGRITY:${caller}] Check failed:`, e);
    return [];
  }
}

export const gameRouter = router({
  /**
   * Create a new game
   */
  create: publicProcedure
    .input(z.object({ 
      playerCount: z.number().min(2).max(4),
      edition: z.enum(["r7_starter", "tokyo_remake", "r6_complete", "r7_mega"]).default("r7_starter")
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const userId = ctx.user?.id || 0;

        const { initializeGame } = await import('../db');
        const gameId = await initializeGame(userId, input.playerCount, input.edition);

        console.log(`[CREATE] Game ${gameId} created. Running integrity check...`);
        await checkGameIntegrity(db, gameId, 'CREATE');

        return { gameId };
      } catch (error) {
        console.error("Error creating game:", error);
        throw error;
      }
    }),

  /**
   * Roll dice and set declaration player / turn order
   */
  rollDice: publicProcedure
    .input(z.object({
      gameId: z.number(),
      declarationPlayer: z.number(),
      turnOrder: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        console.log(`[DICE] gameId=${input.gameId} declarationPlayer=${input.declarationPlayer} turnOrder=${JSON.stringify(input.turnOrder)}`);

        await db.update(games).set({
          declarationPlayer: input.declarationPlayer,
          currentTurn: input.declarationPlayer,
        }).where(eq(games.id, input.gameId));

        return { success: true };
      } catch (error) {
        console.error("Error rolling dice:", error);
        throw error;
      }
    }),

  /**
   * Get game state
   */
  getState: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 毎回の状態取得時に整合性チェック
        await checkGameIntegrity(db, input.gameId, 'getState');

        const gameRecord = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
        if (!gameRecord.length) throw new Error("Game not found");
        const game = gameRecord[0];

        const playerStates = await db.select().from(gameStates).where(eq(gameStates.gameId, input.gameId));
        const players = playerStates.map((state: any) => ({
          playerId: state.playerId,
          hand: typeof state.hand === 'string' ? JSON.parse(state.hand) : state.hand || [],
          passed: state.passed,
          rank: state.rank,
        }));

        const allBikeIds = new Set<number>();
        players.forEach((p: any) => (p.hand as number[]).forEach((id) => allBikeIds.add(id)));

        const fieldCards = await db
          .select()
          .from(playedCards)
          .where(eq(playedCards.gameId, input.gameId))
          .orderBy(desc(playedCards.playedAt), desc(playedCards.id));

        fieldCards.forEach((pc: any) => {
          const ids: number[] = JSON.parse(pc.bikeIds);
          ids.forEach((id) => allBikeIds.add(id));
        });

        let bikeRecords: any[] = [];
        if (allBikeIds.size > 0) {
          bikeRecords = await db.select().from(bikes).where(inArray(bikes.id, Array.from(allBikeIds)));
        }

        const bikesMap = new Map(bikeRecords.map((b: any) => [b.id, b]));
        const formattedFieldCards = fieldCards.map((pc: any) => {
          const ids: number[] = JSON.parse(pc.bikeIds);
          return {
            playerId: pc.playerId,
            bikeIds: ids,
            bikes: ids.map((id) => bikesMap.get(id)).filter(Boolean),
          };
        });

        return { game, players, bikes: bikeRecords, fieldCards: formattedFieldCards };
      } catch (error) {
        console.error("Error getting game state:", error);
        throw error;
      }
    }),

  /**
   * Get bikes by IDs
   */
  getBikes: publicProcedure
    .input(z.object({ bikeIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (input.bikeIds.length === 0) return [];
        const bikeRecords = await db.select().from(bikes).where(inArray(bikes.id, input.bikeIds));
        return bikeRecords;
      } catch (error) {
        console.error("Error getting bikes:", error);
        throw error;
      }
    }),

  /**
   * Declare a spec for the round
   */
  declareSpec: publicProcedure
    .input(z.object({
      gameId: z.number(),
      spec: z.enum(['horsepower', 'fuelEfficiency', 'seatHeight', 'totalLength', 'weight', 'price', 'year']),
      direction: z.enum(['up', 'down']).default('up'),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const gameRecord = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
        if (!gameRecord.length) throw new Error("Game not found");
        const game = gameRecord[0];

        if (game.prevDeclaredSpec === input.spec && game.prevDeclaredDirection === input.direction) {
          throw new Error(`前回と同じ宣言（${input.spec} ${input.direction}）はできません`);
        }

        const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
        const nextPlayer = getNextPlayer(game.declarationPlayer || 1, game.playerCount, turnOrder);

        await db.update(games).set({
          declaredSpec: input.spec,
          declaredDirection: input.direction,
          currentTurn: nextPlayer,
        }).where(eq(games.id, input.gameId));



        return { success: true, spec: input.spec, direction: input.direction, nextPlayer };
      } catch (error) {
        console.error("Error declaring spec:", error);
        throw error;
      }
    }),

  /**
   * Play a card
   */
  playCard: publicProcedure
    .input(z.object({
      gameId: z.number(),
      playerId: z.number(),
      bikeIds: z.array(z.number()).min(1),
      bindDeclare: z.object({
        type: z.enum(['maker', 'cylinders', 'transmission']),
        value: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        console.log(`[PLAY] P${input.playerId} playing bikeIds=${JSON.stringify(input.bikeIds)}, gameId=${input.gameId}`);
        await checkGameIntegrity(db, input.gameId, 'PLAY_BEFORE');

        const gameRecord = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
        const playerState = await db.select().from(gameStates).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId))).limit(1);
        
        if (!gameRecord.length || !playerState.length) throw new Error("Game or Player state not found");
        const game = gameRecord[0];
        const hand = typeof playerState[0].hand === 'string' ? JSON.parse(playerState[0].hand) : playerState[0].hand || [];
        console.log(`[PLAY] P${input.playerId} hand BEFORE: ${JSON.stringify(hand)}`);

        // Update player hand
        const updatedHand = hand.filter((id: number) => !input.bikeIds.includes(id));
        console.log(`[PLAY] P${input.playerId} hand AFTER: ${JSON.stringify(updatedHand)}`);
        await db.update(gameStates).set({ hand: JSON.stringify(updatedHand) as any, passed: 0 }).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)));

        // Record played card
        await db.insert(playedCards).values({
          gameId: input.gameId,
          playerId: input.playerId,
          bikeIds: JSON.stringify(input.bikeIds),
        });

        // Handle bind
        if (input.bindDeclare) {
          await db.update(games).set({ currentBind: input.bindDeclare.type, bindValue: input.bindDeclare.value }).where(eq(games.id, input.gameId));
        }

        // Check win
        if (updatedHand.length === 0) {
          await db.update(games).set({ status: 'finished' }).where(eq(games.id, input.gameId));
          await checkGameIntegrity(db, input.gameId, 'PLAY_AFTER_WIN');
          return { success: true, gameFinished: true, winner: input.playerId };
        }

        // Next player
        const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
        const nextPlayer = getNextPlayer(input.playerId, game.playerCount, turnOrder);
        await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));

        await checkGameIntegrity(db, input.gameId, 'PLAY_AFTER');
        return { success: true, gameFinished: false, nextPlayer };
      } catch (error) {
        console.error("Error playing card:", error);
        throw error;
      }
    }),

  /**
   * Pass turn
   */
  pass: publicProcedure
    .input(z.object({ gameId: z.number(), playerId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const gameRecord = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
        if (!gameRecord.length) throw new Error("Game not found");
        const game = gameRecord[0];

        await db.update(gameStates).set({ passed: 1 }).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)));

        const allStates = await db.select().from(gameStates).where(eq(gameStates.gameId, input.gameId));
        const activePlayers = allStates.filter((s: any) => s.passed === 0);
        
        let nextPlayer = input.playerId;
        let trickCleared = false;

        if (activePlayers.length <= 1) {
          trickCleared = true;
          nextPlayer = activePlayers.length === 1 ? activePlayers[0].playerId : 1;

          await db.update(gameStates).set({ passed: 0 }).where(eq(gameStates.gameId, input.gameId));

          // 場の履歴は削除せず全て残す（プレイヤーが過去に何が出たか確認できるようにする）

          await db.update(games).set({ 
            currentBind: null, 
            bindValue: null, 
            prevDeclaredSpec: game.declaredSpec,
            prevDeclaredDirection: game.declaredDirection,
            declaredSpec: null,
            declaredDirection: null,
            declarationPlayer: nextPlayer,
            currentTurn: nextPlayer 
          }).where(eq(games.id, input.gameId));
        } else {
          const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
          nextPlayer = getNextPlayer(input.playerId, game.playerCount, turnOrder);
          // Skip passed players
          while (allStates.find((s: any) => s.playerId === nextPlayer)?.passed === 1) {
            nextPlayer = getNextPlayer(nextPlayer, game.playerCount, turnOrder);
          }
          await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));
        }

        return { success: true, nextPlayer, trickCleared };
      } catch (error) {
        console.error("Error passing:", error);
        throw error;
      }
    }),

  /**
   * Draw card
   */
  drawCard: publicProcedure
    .input(z.object({ gameId: z.number(), playerId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        console.log(`[DRAW] P${input.playerId} drawing card, gameId=${input.gameId}`);
        await checkGameIntegrity(db, input.gameId, 'DRAW_BEFORE');

        const gameDecks = await db.select().from(decks).where(eq(decks.gameId, input.gameId));
        const nonEmptyDecks = gameDecks.filter((d: any) => JSON.parse(d.bikeIds).length > 0);
        if (nonEmptyDecks.length === 0) throw new Error("No cards in deck");

        const selectedDeck = nonEmptyDecks[Math.floor(Math.random() * nonEmptyDecks.length)];
        const deckIds = JSON.parse(selectedDeck.bikeIds);
        const drawnId = deckIds[0];
        const remaining = deckIds.slice(1);
        console.log(`[DRAW] Drew ID=${drawnId} from ${selectedDeck.category} deck. Remaining=${remaining.length}`);

        await db.update(decks).set({ bikeIds: JSON.stringify(remaining) }).where(eq(decks.id, selectedDeck.id));

        const playerState = await db.select().from(gameStates).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId))).limit(1);
        const hand = JSON.parse(playerState[0].hand);
        console.log(`[DRAW] P${input.playerId} hand BEFORE: ${JSON.stringify(hand)}`);
        if (hand.includes(drawnId)) {
          console.error(`[DRAW] ★★★ DUPLICATE! drawnId=${drawnId} already in P${input.playerId} hand!`);
        }
        const updatedHand = [...hand, drawnId];
        console.log(`[DRAW] P${input.playerId} hand AFTER: ${JSON.stringify(updatedHand)}`);
        await db.update(gameStates).set({ hand: JSON.stringify(updatedHand) as any }).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)));

        const game = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
        const nextPlayer = getNextPlayer(input.playerId, game[0].playerCount, [1, 2, 3, 4].slice(0, game[0].playerCount));
        await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));

        await checkGameIntegrity(db, input.gameId, 'DRAW_AFTER');

        const bike = await db.select().from(bikes).where(eq(bikes.id, drawnId)).limit(1);
        return { success: true, drawnBike: bike[0], nextPlayer };
      } catch (error) {
        console.error("Error drawing card:", error);
        throw error;
      }
    }),

  /**
   * CPU Play logic
   */
  cpuPlay: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        console.log(`[CPU] cpuPlay called, gameId=${input.gameId}`);
        await checkGameIntegrity(db, input.gameId, 'CPU_BEFORE');

        const gameRecord = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
        if (!gameRecord.length) throw new Error("Game not found");
        const game = gameRecord[0];

        const cpuPlayerId = game.currentTurn;
        if (!cpuPlayerId || cpuPlayerId === 1) return { action: 'skip' };

        const cpuState = await db.select().from(gameStates).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, cpuPlayerId))).limit(1);
        const handIds = JSON.parse(cpuState[0].hand);
        console.log(`[CPU] P${cpuPlayerId} hand: ${JSON.stringify(handIds)}`);

        if (handIds.length === 0) {
           const nextPlayer = getNextPlayer(cpuPlayerId, game.playerCount, [1, 2, 3, 4].slice(0, game.playerCount));
           await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));
           return { action: 'pass', nextPlayer };
        }

        const handBikes = await db.select().from(bikes).where(inArray(bikes.id, handIds));
        const lastPlayed = await db.select().from(playedCards).where(eq(playedCards.gameId, input.gameId)).orderBy(desc(playedCards.playedAt), desc(playedCards.id)).limit(1);
        let lastBikes: any[] = [];
        if (lastPlayed.length > 0) {
          const lastIds = JSON.parse(lastPlayed[0].bikeIds);
          lastBikes = await db.select().from(bikes).where(inArray(bikes.id, lastIds));
        }

        const decision = decideCPUAction(handBikes as any, lastBikes, game.declaredSpec as any, game.declaredDirection as any, game.currentBind as any, game.bindValue as any);
        console.log(`[CPU] P${cpuPlayerId} decision: ${decision.action}`);
        const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
        
        const allStates = await db.select().from(gameStates).where(eq(gameStates.gameId, input.gameId));
        const getNextTurnPlayer = (currentPlayer: number, states: any[]) => {
          let np = getNextPlayer(currentPlayer, game.playerCount, turnOrder);
          let safety = 0;
          while (states.find(s => s.playerId === np)?.passed === 1 && safety < game.playerCount) {
            np = getNextPlayer(np, game.playerCount, turnOrder);
            safety++;
          }
          return np;
        };

        if (decision.action === 'play' && decision.bikeIds) {
          console.log(`[CPU] P${cpuPlayerId} plays: ${JSON.stringify(decision.bikeIds)}`);
          const updatedHand = handIds.filter((id: number) => !decision.bikeIds!.includes(id));
          console.log(`[CPU] P${cpuPlayerId} hand AFTER play: ${JSON.stringify(updatedHand)}`);
          await db.update(gameStates).set({ hand: JSON.stringify(updatedHand) as any }).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, cpuPlayerId)));
          
          await db.insert(playedCards).values({ 
            gameId: input.gameId, 
            playerId: cpuPlayerId, 
            bikeIds: JSON.stringify(decision.bikeIds) 
          });
          
          if (decision.bindDeclare) await db.update(games).set({ currentBind: decision.bindDeclare.type, bindValue: decision.bindDeclare.value }).where(eq(games.id, input.gameId));
          if (updatedHand.length === 0) {
            await db.update(games).set({ status: 'finished' }).where(eq(games.id, input.gameId));
            await checkGameIntegrity(db, input.gameId, 'CPU_PLAY_WIN');
            return { action: 'play', gameFinished: true, winner: cpuPlayerId, cpuPlayerId, bindDeclare: decision.bindDeclare };
          }
          const nextPlayer = getNextTurnPlayer(cpuPlayerId, allStates);
          await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));
          await checkGameIntegrity(db, input.gameId, 'CPU_PLAY_AFTER');
          return { action: 'play', nextPlayer, bikeIds: decision.bikeIds, cpuPlayerId, bindDeclare: decision.bindDeclare };
        } else if (decision.action === 'draw') {
           const gameDecks = await db.select().from(decks).where(eq(decks.gameId, input.gameId));
           const nonEmptyDecks = gameDecks.filter((d: any) => JSON.parse(d.bikeIds).length > 0);
           if (nonEmptyDecks.length > 0) {
             const selectedDeck = nonEmptyDecks[0];
             const deckIds = JSON.parse(selectedDeck.bikeIds);
             const drawnId = deckIds[0];
             console.log(`[CPU] P${cpuPlayerId} draws ID=${drawnId} from ${selectedDeck.category}`);
             if (handIds.includes(drawnId)) {
               console.error(`[CPU] ★★★ DUPLICATE! drawnId=${drawnId} already in P${cpuPlayerId} hand!`);
             }
             await db.update(decks).set({ bikeIds: JSON.stringify(deckIds.slice(1)) }).where(eq(decks.id, selectedDeck.id));
             const newHand = [...handIds, drawnId];
             console.log(`[CPU] P${cpuPlayerId} hand AFTER draw: ${JSON.stringify(newHand)}`);
             await db.update(gameStates).set({ hand: JSON.stringify(newHand) as any }).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, cpuPlayerId)));
           }
           const nextPlayer = getNextTurnPlayer(cpuPlayerId, allStates);
           await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));
           await checkGameIntegrity(db, input.gameId, 'CPU_DRAW_AFTER');
           return { action: 'draw', nextPlayer, cpuPlayerId };
        } else {
           console.log(`[CPU] P${cpuPlayerId} passes`);
           await db.update(gameStates).set({ passed: 1 }).where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, cpuPlayerId)));
           
           const cpuStateIndex = allStates.findIndex((s: any) => s.playerId === cpuPlayerId);
           if (cpuStateIndex !== -1) allStates[cpuStateIndex].passed = 1;
           const passedCount = allStates.filter((s: any) => s.passed === 1).length;
           
           let nextPlayer;
           let trickCleared = false;
           
           if (passedCount >= game.playerCount - 1) {
             trickCleared = true;
             const winnerState = allStates.find((s: any) => s.passed === 0);
             nextPlayer = winnerState ? winnerState.playerId : cpuPlayerId;

             await db.update(gameStates).set({ passed: 0 }).where(eq(gameStates.gameId, input.gameId));

             // 場の履歴は削除せず全て残す（プレイヤーが過去に何が出たか確認できるようにする）

             await db.update(games).set({ 
               currentBind: null,
               bindValue: null,
               prevDeclaredSpec: game.declaredSpec,
               prevDeclaredDirection: game.declaredDirection,
               declaredSpec: null,
               declaredDirection: null,
               declarationPlayer: nextPlayer,
               currentTurn: nextPlayer 
             }).where(eq(games.id, input.gameId));
           } else {
             nextPlayer = getNextTurnPlayer(cpuPlayerId, allStates);
             await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));
           }
           
           return { action: 'pass', nextPlayer, trickCleared, cpuPlayerId };
        }
      } catch (error) {
        console.error("CPU Play error:", error);
        throw error;
      }
    }),

  /**
   * DEBUG: Check for card duplication
   */
  debug_checkCardDuplication: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { error: "DB not available" };

        const bikeCount = await db.select({ count: sql<number>`count(*)` }).from(bikes).where(eq(bikes.id, 28));
        const duplicatesResult = await db.execute(sql`SELECT id, count(*) as c FROM bikes GROUP BY id HAVING c > 1`);
        const duplicates = (duplicatesResult as any).results || (duplicatesResult as any).rows || [];
        const hayabusaByName = await db.select({ count: sql<number>`count(*)` }).from(bikes).where(sql`name LIKE '%Hayabusa%'`);

        const playerStates = await db.select().from(gameStates).where(eq(gameStates.gameId, input.gameId));
        const handCounts = playerStates.map((ps: any) => {
          const hand = typeof ps.hand === 'string' ? JSON.parse(ps.hand) : ps.hand || [];
          return { playerId: ps.playerId, count28: hand.filter((id: number) => id === 28).length, handLength: hand.length };
        });

        const gameDecks = await db.select().from(decks).where(eq(decks.gameId, input.gameId));
        const deckCounts = gameDecks.map((d: any) => {
          const ids = typeof d.bikeIds === 'string' ? JSON.parse(d.bikeIds) : d.bikeIds || [];
          return { category: d.category, count28: ids.filter((id: number) => id === 28).length, deckLength: ids.length };
        });

        const fieldCards = await db.select().from(playedCards).where(eq(playedCards.gameId, input.gameId));
        const fieldCounts = fieldCards.map((fc: any) => {
          const ids = typeof fc.bikeIds === 'string' ? JSON.parse(fc.bikeIds) : fc.bikeIds || [];
          return { playerId: fc.playerId, count28: ids.filter((id: number) => id === 28).length };
        });

        return { bikesTableCount28: bikeCount[0]?.count || 0, duplicateIdsInDb: duplicates, hayabusaByNameCount: hayabusaByName[0]?.count || 0, handCounts, deckCounts, fieldCounts };
      } catch (err: any) {
        return { error: err.message || "Internal error" };
      }
    }),
});
