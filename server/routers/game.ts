import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { games, gameStates, bikes } from "../../drizzle/schema";
import { eq, inArray, and, desc } from "drizzle-orm";
import { rollDice, determineTurnOrder, canPlayCard, getNextPlayer } from "../gameLogic";
import { playedCards } from "../../drizzle/schema";
import { decideCPUAction, decideCPUDeclaration } from "../cpuAI";

export const gameRouter = router({
  /**
   * Create a new game (supports both authenticated and guest users)
   */
  create: publicProcedure
    .input(z.object({ playerCount: z.number().min(2).max(4) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Use authenticated user ID or a placeholder for guests
        const userId = ctx.user?.id || 0; // 0 for guest users

        // Create game using initializeGame
        const { initializeGame } = await import('../db');
        const gameId = await initializeGame(userId, input.playerCount);

        return { gameId };
      } catch (error) {
        console.error("Error creating game:", error);
        throw error;
      }
    }),

  /**
   * Get game state (supports both authenticated and guest users)
   */
   getState: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const gameRecord = await db
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);

        if (!gameRecord.length) {
          throw new Error("Game not found");
        }

        const game = gameRecord[0];

        // Get all player states
        const playerStates = await db
          .select()
          .from(gameStates)
          .where(eq(gameStates.gameId, input.gameId));

        // Format players array
        const players = playerStates.map((state) => ({
          playerId: state.playerId,
          hand: typeof state.hand === 'string' ? JSON.parse(state.hand) : state.hand || [],
        }));

        // Collect all bike IDs from all player hands
        const allBikeIds = new Set<number>();
        players.forEach((p) => {
          (p.hand as number[]).forEach((id) => allBikeIds.add(id));
        });

        // Get played cards (field cards)
        const fieldCards = await db
          .select()
          .from(playedCards)
          .where(eq(playedCards.gameId, input.gameId))
          .orderBy(desc(playedCards.playedAt), desc(playedCards.id));

        // Add played card bike IDs to the set
        fieldCards.forEach((pc) => {
          const ids: number[] = JSON.parse(pc.bikeIds);
          ids.forEach((id) => allBikeIds.add(id));
        });

        // Fetch bike details
        let bikeRecords: any[] = [];
        if (allBikeIds.size > 0) {
          bikeRecords = await db
            .select()
            .from(bikes)
            .where(inArray(bikes.id, [...allBikeIds]));
        }

        // Format field cards with bike details
        const bikesMap = new Map(bikeRecords.map((b: any) => [b.id, b]));
        const formattedFieldCards = fieldCards.map((pc) => {
          const ids: number[] = JSON.parse(pc.bikeIds);
          return {
            playerId: pc.playerId,
            bikeIds: ids,
            bikes: ids.map((id) => bikesMap.get(id)).filter(Boolean),
          };
        });

        return {
          game,
          players,
          bikes: bikeRecords,
          fieldCards: formattedFieldCards,
        };
      } catch (error) {
        console.error("Error getting game state:", error);
        throw error;
      }
    }),

  /**
   * Get bikes by IDs (supports both authenticated and guest users)
   */
  getBikes: publicProcedure
    .input(z.object({ bikeIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        if (input.bikeIds.length === 0) {
          return [];
        }

        const bikeRecords = await db
          .select()
          .from(bikes)
          .where(inArray(bikes.id, input.bikeIds));

        return bikeRecords;
      } catch (error) {
        console.error("Error getting bikes:", error);
        throw error;
      }
    }),

  /**
   * Roll dice to determine turn order
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

        // Update game with turn order and declaration player from client
        await db
          .update(games)
          .set({
            declarationPlayer: input.declarationPlayer,
            currentTurn: input.declarationPlayer,
          })
          .where(eq(games.id, input.gameId));

        return {
          declarationPlayer: input.declarationPlayer,
          turnOrder: input.turnOrder,
        };
      } catch (error) {
        console.error("Error rolling dice:", error);
        throw error;
      }
    }),

  /**
   * Declare a spec for the round
   */
  declareSpec: publicProcedure
    .input(
      z.object({
        gameId: z.number(),
        spec: z.enum(['horsepower', 'fuelEfficiency', 'seatHeight', 'totalLength', 'weight', 'price', 'year']),
        direction: z.enum(['up', 'down']).default('up'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get game to get declaration player
        const gameRecord = await db
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);

        if (!gameRecord.length) {
          throw new Error("Game not found");
        }

        const game = gameRecord[0];
        const declarationPlayer = game.declarationPlayer || 1;
        const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
        const nextPlayer = getNextPlayer(declarationPlayer, game.playerCount, turnOrder);

        const allBikes = await db.select().from(bikes);
        const allPlayerStates = await db
          .select()
          .from(gameStates)
          .where(eq(gameStates.gameId, input.gameId));

        // Collect all bike IDs already in player hands
        const dealtBikes = new Set<number>();
        allPlayerStates.forEach((state: any) => {
          const stateHand = typeof state.hand === 'string'
            ? JSON.parse(state.hand)
            : state.hand || [];
          stateHand.forEach((bikeId: number) => dealtBikes.add(bikeId));
        });

        // Also exclude already played cards
        const alreadyPlayed = await db
          .select()
          .from(playedCards)
          .where(eq(playedCards.gameId, input.gameId));
        alreadyPlayed.forEach((pc: any) => {
          const ids: number[] = JSON.parse(pc.bikeIds);
          ids.forEach((id) => dealtBikes.add(id));
        });

        // Validate: cannot repeat the same spec+direction as previous declaration
        if (game.prevDeclaredSpec === input.spec && game.prevDeclaredDirection === input.direction) {
          throw new Error(`前回と同じ宣言（${input.spec} ${input.direction}）はできません`);
        }

        // Store declaration (clear prev once a new valid declaration is made)
        await db
          .update(games)
          .set({
            declaredSpec: input.spec,
            declaredDirection: input.direction,
            currentTurn: nextPlayer,
          })
          .where(eq(games.id, input.gameId));

        let firstCard = null;
        if (alreadyPlayed.length === 0) {
          const availableBikes = allBikes.filter((b: any) => !dealtBikes.has(b.id));
          if (availableBikes.length > 0) {
            const randomBike = availableBikes[Math.floor(Math.random() * availableBikes.length)];
            // Place on table as played by "dealer" (player 0)
            await db.insert(playedCards).values({
              gameId: input.gameId,
              playerId: 0, // 0 = dealer / field card
              bikeIds: JSON.stringify([randomBike.id]),
            });
            firstCard = randomBike;
          }
        }

        return { 
          success: true, 
          spec: input.spec, 
          direction: input.direction,
          nextPlayer,
          firstCard,
        };
      } catch (error) {
        console.error("Error declaring spec:", error);
        throw error;
      }
    }),

  /**
   * Play a card
   */
  playCard: publicProcedure
    .input(
      z.object({
        gameId: z.number(),
        playerId: z.number(),
        bikeIds: z.array(z.number()).min(1),
        bindDeclare: z.object({
          type: z.enum(['maker', 'cylinders', 'transmission']),
          value: z.string(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get game state
        const gameRecord = await db
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);

        if (!gameRecord.length) {
          throw new Error("Game not found");
        }

        const game = gameRecord[0];

        // Get player state
        const playerState = await db
          .select()
          .from(gameStates)
          .where(eq(gameStates.gameId, input.gameId))
          .limit(1);

        if (!playerState.length) {
          throw new Error("Player state not found");
        }

        // Get bikes being played
        const bikeRecords = await db
          .select()
          .from(bikes)
          .where(inArray(bikes.id, input.bikeIds));

        if (bikeRecords.length !== input.bikeIds.length) {
          throw new Error("One or more bikes not found");
        }

        // Validate multiple cards have same spec value
        const declaredSpec = game.declaredSpec as keyof typeof bikeRecords[0];
        if (declaredSpec && bikeRecords.length > 1) {
          const firstValue = bikeRecords[0][declaredSpec];
          const allSame = bikeRecords.every(b => b[declaredSpec] === firstValue);
          if (!allSame) {
            throw new Error("Multiple cards must have the same declared spec value");
          }
        }

        // Validate card beats the previous card (>= or <=)
        const lastPlayedCard = await db
          .select()
          .from(playedCards)
          .where(eq(playedCards.gameId, input.gameId))
          .orderBy(desc(playedCards.playedAt), desc(playedCards.id))
          .limit(1);

        if (lastPlayedCard.length > 0 && game.declaredSpec && game.declaredDirection) {
          const lastBikeIds = JSON.parse(lastPlayedCard[0].bikeIds);
          const lastBikeRecords = await db.select().from(bikes).where(inArray(bikes.id, lastBikeIds));
          if (lastBikeRecords.length > 0) {
            const lastBike = lastBikeRecords[lastBikeRecords.length - 1]; // Use last selected
            const currentBike = bikeRecords[0]; // All have same spec value
            
            const currentValue = currentBike[game.declaredSpec as keyof typeof currentBike] as number;
            const previousValue = lastBike[game.declaredSpec as keyof typeof lastBike] as number;
            
            if (game.declaredDirection === 'up' && currentValue < previousValue) {
              throw new Error("Card value must be >= previous card");
            } else if (game.declaredDirection === 'down' && currentValue > previousValue) {
              throw new Error("Card value must be <= previous card");
            }
          }
        }

        // Validate card can be played (bind check) - use the first card for bind check against the top card of last play
        if (game.currentBind && game.bindValue) {
          const canPlay = canPlayCard(bikeRecords[0] as any, null, game.currentBind as any, game.bindValue);
          if (!canPlay) {
            throw new Error("Card does not meet bind requirements");
          }
        }

        // Remove cards from player hand
        const hand = typeof playerState[0].hand === 'string' ? JSON.parse(playerState[0].hand) : playerState[0].hand || [];
        const updatedHand = hand.filter((id: number) => !input.bikeIds.includes(id));

        // Update player state
        await db
          .update(gameStates)
          .set({ hand: JSON.stringify(updatedHand) as any })
          .where(eq(gameStates.gameId, input.gameId));

        // Store played card (bikeIds is a JSON array)
        await db.insert(playedCards).values({
          gameId: input.gameId,
          playerId: input.playerId,
          bikeIds: JSON.stringify(input.bikeIds),
        });

        // Handle bind declaration if provided
        if (input.bindDeclare) {
          await db
            .update(games)
            .set({
              currentBind: input.bindDeclare.type,
              bindValue: input.bindDeclare.value,
            })
            .where(eq(games.id, input.gameId));
        }

        // Check if player won (hand is empty)
        if (updatedHand.length === 0) {
          await db
            .update(games)
            .set({
              status: 'finished',
            })
            .where(eq(games.id, input.gameId));

          return {
            success: true,
            gameFinished: true,
            winner: input.playerId,
          };
        }

        // Move to next player
        const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
        const nextPlayer = getNextPlayer(input.playerId, game.playerCount, turnOrder);
        await db
          .update(games)
          .set({ currentTurn: nextPlayer })
          .where(eq(games.id, input.gameId));

        return {
          success: true,
          gameFinished: false,
          nextPlayer,
        };
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

        const gameRecord = await db
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);

        if (!gameRecord.length) {
          throw new Error("Game not found");
        }

        const game = gameRecord[0];
        // Mark player as passed
        await db.update(gameStates)
          .set({ passed: 1 })
          .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)));

        const allStates = await db.select().from(gameStates).where(eq(gameStates.gameId, input.gameId));
        const activePlayers = allStates.filter(s => s.passed === 0);
        
        let nextPlayer = input.playerId;
        let trickCleared = false;

        if (activePlayers.length <= 1) {
          // Trick clears!
          trickCleared = true;
          nextPlayer = activePlayers.length === 1 ? activePlayers[0].playerId : 1;
          // 場が流れてもplayedCardsは削除せず残す
          await db.update(gameStates).set({ passed: 0 }).where(eq(gameStates.gameId, input.gameId));
          await db.update(games)
            .set({ 
              currentBind: null, 
              bindValue: null, 
              prevDeclaredSpec: game.declaredSpec,
              prevDeclaredDirection: game.declaredDirection,
              declaredSpec: null,
              declaredDirection: null,
              declarationPlayer: nextPlayer, // 勝者が次の宣言を行う
              currentTurn: nextPlayer 
            })
            .where(eq(games.id, input.gameId));
        } else {
          const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
          let curr = input.playerId;
          for (let i = 0; i < game.playerCount; i++) {
             curr = getNextPlayer(curr, game.playerCount, turnOrder);
             if (activePlayers.some(p => p.playerId === curr)) {
               nextPlayer = curr;
               break;
             }
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
   * Next Round - Reset game state for the next round
   */
  nextRound: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const gameRecord = await db
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);

        if (!gameRecord.length) {
          throw new Error("Game not found");
        }

        const game = gameRecord[0];

        // Get last played card to determine next declaration player
        const lastPlayed = await db
          .select()
          .from(playedCards)
          .where(eq(playedCards.gameId, input.gameId))
          .orderBy(desc(playedCards.playedAt), desc(playedCards.id))
          .limit(1);

        const nextDeclarationPlayer = lastPlayed.length > 0 ? lastPlayed[0].playerId : 1;

        // Clear played cards
        await db.delete(playedCards).where(eq(playedCards.gameId, input.gameId));

        // Reset passed flags and hands
        const allBikes = await db.select().from(bikes);
        const shuffledBikes = allBikes.sort(() => Math.random() - 0.5);
        
        const playerStates = await db
          .select()
          .from(gameStates)
          .where(eq(gameStates.gameId, input.gameId));

        let bikeIndex = 0;
        for (const playerState of playerStates) {
          const hand = [];
          for (let i = 0; i < 4; i++) {
            if (bikeIndex < shuffledBikes.length) {
              hand.push(shuffledBikes[bikeIndex].id);
              bikeIndex++;
            }
          }
          await db
            .update(gameStates)
            .set({ 
              hand: JSON.stringify(hand) as any,
              passed: 0,
            })
            .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, playerState.playerId)));
        }

        // Increment round and reset game state
        await db
          .update(games)
          .set({
            currentRound: game.currentRound + 1,
            declarationPlayer: nextDeclarationPlayer,
            currentTurn: nextDeclarationPlayer,
            currentBind: null,
            bindValue: null,
            declaredSpec: null,
            declaredDirection: null,
          })
          .where(eq(games.id, input.gameId));

        return { 
          success: true, 
          nextRound: game.currentRound + 1,
        };
      } catch (error) {
        console.error("Error advancing to next round:", error);
        throw error;
      }
    }),

  /**
   * Draw from deck
   */
  drawCard: publicProcedure
    .input(z.object({ gameId: z.number(), playerId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get game state
        const gameRecord = await db
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);

        if (!gameRecord.length) {
          throw new Error("Game not found");
        }

        // Get all bikes
        const allBikes = await db.select().from(bikes);
        
        // Get player state by gameId and playerId
        const playerState = await db
          .select()
          .from(gameStates)
          .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)))
          .limit(1);

        if (!playerState.length) {
          throw new Error("Player state not found");
        }

        // Get current hand
        const hand = typeof playerState[0].hand === 'string' 
          ? JSON.parse(playerState[0].hand) 
          : playerState[0].hand || [];

        // Get all player hands to exclude already dealt cards
        const allPlayerStates = await db
          .select()
          .from(gameStates)
          .where(eq(gameStates.gameId, input.gameId));

        const dealtBikes = new Set<number>();
        allPlayerStates.forEach((state: any) => {
          const stateHand = typeof state.hand === 'string' 
            ? JSON.parse(state.hand) 
            : state.hand || [];
          stateHand.forEach((bikeId: number) => dealtBikes.add(bikeId));
        });
        
        // Find available bikes not yet dealt
        const availableBikes = allBikes.filter((b: any) => !dealtBikes.has(b.id));
        
        if (availableBikes.length === 0) {
          throw new Error("No cards available to draw");
        }

        // Draw random bike
        const randomBike = availableBikes[Math.floor(Math.random() * availableBikes.length)];
        const updatedHand = [...hand, randomBike.id];

        // Update player hand
        await db
          .update(gameStates)
          .set({ hand: JSON.stringify(updatedHand) as any })
          .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)));

        // Move to next player
        const turnOrder = [1, 2, 3, 4].slice(0, gameRecord[0].playerCount);
        const nextPlayer = getNextPlayer(input.playerId, gameRecord[0].playerCount, turnOrder);
        
        await db
          .update(games)
          .set({ currentTurn: nextPlayer })
          .where(eq(games.id, input.gameId));

        return { 
          success: true, 
          drawnBike: randomBike.id,
          nextPlayer,
        };
      } catch (error) {
        console.error("Error drawing card:", error);
        throw error;
      }
    }),

  /**
   * CPU auto-play: AI decides and executes the CPU's turn
   */
  cpuPlay: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const gameRecord = await db
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);

        if (!gameRecord.length) throw new Error("Game not found");
        const game = gameRecord[0];

        const cpuPlayerId = game.currentTurn;
        if (!cpuPlayerId || cpuPlayerId === 1) {
          return { action: 'skip' as const, message: 'Not CPU turn' };
        }

        // Get CPU's hand
        const cpuState = await db
          .select()
          .from(gameStates)
          .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, cpuPlayerId)))
          .limit(1);

        if (!cpuState.length) throw new Error("CPU state not found");

        const handIds: number[] = typeof cpuState[0].hand === 'string'
          ? JSON.parse(cpuState[0].hand)
          : cpuState[0].hand || [];

        if (handIds.length === 0) {
          // CPU has no cards, pass
          const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
          const nextPlayer = getNextPlayer(cpuPlayerId, game.playerCount, turnOrder);
          await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));
          return { action: 'pass' as const, cpuPlayerId, nextPlayer, gameFinished: false };
        }

        // Get bike details for hand
        const handBikes = await db.select().from(bikes).where(inArray(bikes.id, handIds));

        // Get last played card for comparison
        const lastPlayedRecords = await db
          .select()
          .from(playedCards)
          .where(eq(playedCards.gameId, input.gameId))
          .orderBy(desc(playedCards.playedAt), desc(playedCards.id))
          .limit(1);

        let playedBikesList: any[] = [];
        if (lastPlayedRecords.length > 0) {
          const lastBikeIds: number[] = JSON.parse(lastPlayedRecords[0].bikeIds);
          if (lastBikeIds.length > 0) {
            const lastBikes = await db.select().from(bikes).where(inArray(bikes.id, lastBikeIds));
            playedBikesList = lastBikes;
          }
        }

        // Use CPU AI to decide action
        const decision = decideCPUAction(
          handBikes as any,
          playedBikesList as any,
          game.declaredSpec || 'cylinders',
          game.declaredDirection || 'up',
          game.currentBind || undefined,
          game.bindValue || undefined
        );

        const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
        const nextPlayer = getNextPlayer(cpuPlayerId, game.playerCount, turnOrder);

        if (decision.action === 'play' && decision.bikeIds && decision.bikeIds.length > 0) {
          // Remove cards from CPU hand
          const updatedHand = handIds.filter((id) => !decision.bikeIds!.includes(id));
          await db
            .update(gameStates)
            .set({ hand: JSON.stringify(updatedHand) as any })
            .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, cpuPlayerId)));

          // Record played card
          await db.insert(playedCards).values({
            gameId: input.gameId,
            playerId: cpuPlayerId,
            bikeIds: JSON.stringify(decision.bikeIds),
          });

          // Handle bind
          if (decision.bindDeclare) {
            await db
              .update(games)
              .set({ currentBind: decision.bindDeclare.type, bindValue: decision.bindDeclare.value })
              .where(eq(games.id, input.gameId));
          }

          // Check win
          if (updatedHand.length === 0) {
            await db.update(games).set({ status: 'finished' }).where(eq(games.id, input.gameId));
            return {
              action: 'play' as const,
              cpuPlayerId,
              bikeIds: decision.bikeIds,
              bindDeclare: decision.bindDeclare,
              gameFinished: true,
              winner: cpuPlayerId,
            };
          }

          // Move to next player
          await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));

          return {
            action: 'play' as const,
            cpuPlayerId,
            bikeIds: decision.bikeIds,
            bindDeclare: decision.bindDeclare,
            gameFinished: false,
            nextPlayer,
          };
        } else {
          // Pass
          await db.update(gameStates)
            .set({ passed: 1 })
            .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, cpuPlayerId)));

          const allStates = await db.select().from(gameStates).where(eq(gameStates.gameId, input.gameId));
          const activePlayers = allStates.filter(s => s.passed === 0);
          
          let nextPlayer = cpuPlayerId;
          let trickCleared = false;

          if (activePlayers.length <= 1) {
            trickCleared = true;
            nextPlayer = activePlayers.length === 1 ? activePlayers[0].playerId : 1;
            // 場が流れてもplayedCardsは削除せず残す
            await db.update(gameStates).set({ passed: 0 }).where(eq(gameStates.gameId, input.gameId));
            await db.update(games)
              .set({ 
                currentBind: null, 
                bindValue: null, 
                declaredSpec: null,
                declaredDirection: null,
                declarationPlayer: nextPlayer, // 勝者が次の宣言を行う
                currentTurn: nextPlayer 
              })
              .where(eq(games.id, input.gameId));
          } else {
            const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
            let curr = cpuPlayerId;
            for (let i = 0; i < game.playerCount; i++) {
               curr = getNextPlayer(curr, game.playerCount, turnOrder);
               if (activePlayers.some(p => p.playerId === curr)) {
                 nextPlayer = curr;
                 break;
               }
            }
            await db.update(games).set({ currentTurn: nextPlayer }).where(eq(games.id, input.gameId));
          }

          return { action: 'pass' as const, cpuPlayerId, nextPlayer, trickCleared, gameFinished: false };
        }
      } catch (error) {
        console.error("Error in CPU play:", error);
        throw error;
      }
    }),
});
