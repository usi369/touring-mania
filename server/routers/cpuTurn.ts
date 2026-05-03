import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { games, gameStates, bikes, playedCards } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { decideCPUAction, decideCPUDeclaration } from "../cpuAI";
import { getNextPlayer, canPlayCard } from "../gameLogic";

/**
 * CPU Turn Router - Handles automatic CPU player actions
 */
export const cpuTurnRouter = router({
  /**
   * Execute CPU turn (play card, pass, or draw)
   */
  executeTurn: protectedProcedure
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

        const game = gameRecord[0];

        // Get CPU player's hand
        const playerState = await db
          .select()
          .from(gameStates)
          .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)))
          .limit(1);

        if (!playerState.length) {
          throw new Error("Player state not found");
        }

        const hand = typeof playerState[0].hand === 'string'
          ? JSON.parse(playerState[0].hand)
          : playerState[0].hand || [];

        // Get all bikes
        const allBikes = await db.select().from(bikes);
        const playerBikes = hand.map((id: number) => allBikes.find((b: any) => b.id === id)).filter(Boolean);

        // Get played cards in this round
        const roundPlayedCards = await db
          .select()
          .from(playedCards)
          .where(eq(playedCards.gameId, input.gameId));

        const playedBikeIds: number[] = [];
        roundPlayedCards.forEach((pc: any) => {
          const bikeIds = typeof pc.bikeIds === 'string'
            ? JSON.parse(pc.bikeIds)
            : pc.bikeIds || [];
          playedBikeIds.push(...bikeIds);
        });

        const playedBikes = playedBikeIds
          .map((id: number) => allBikes.find((b: any) => b.id === id))
          .filter(Boolean);

        // Decide CPU action
        const decision = decideCPUAction(
          playerBikes.filter(Boolean) as any[],
          playedBikes.filter(Boolean) as any[],
          game.declaredSpec || 'cylinders',
          game.declaredDirection || 'up',
          game.currentBind || undefined,
          game.bindValue || undefined
        );

        // Execute decision
        let nextPlayer = input.playerId;
        let gameFinished = false;
        let winner = null;

        if (decision.action === 'play' && decision.bikeId) {
          // Get current played cards for this player
          const playerPlayedCards = roundPlayedCards.find((pc: any) => pc.playerId === input.playerId);
          const currentBikeIds = playerPlayedCards
            ? (typeof playerPlayedCards.bikeIds === 'string'
              ? JSON.parse(playerPlayedCards.bikeIds)
              : playerPlayedCards.bikeIds || [])
            : [];

          const updatedBikeIds = [...currentBikeIds, decision.bikeId];

          if (playerPlayedCards) {
            // Update existing played cards
            await db
              .update(playedCards)
              .set({ bikeIds: JSON.stringify(updatedBikeIds) as any })
              .where(eq(playedCards.id, playerPlayedCards.id));
          } else {
            // Insert new played cards
            await db.insert(playedCards).values({
              gameId: input.gameId,
              playerId: input.playerId,
              bikeIds: JSON.stringify(updatedBikeIds) as any,
            });
          }

          // Update hand
          const updatedHand = hand.filter((id: number) => id !== decision.bikeId);
          await db
            .update(gameStates)
            .set({ hand: JSON.stringify(updatedHand) as any })
            .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)));

          // Check if player won
          if (updatedHand.length === 0) {
            gameFinished = true;
            winner = input.playerId;
          } else {
            // Update bind if declared
            if (decision.bindDeclare) {
              await db
                .update(games)
                .set({
                  currentBind: decision.bindDeclare.type,
                  bindValue: decision.bindDeclare.value,
                })
                .where(eq(games.id, input.gameId));
            }

            // Move to next player
            const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
            nextPlayer = getNextPlayer(input.playerId, game.playerCount, turnOrder);
          }
        } else if (decision.action === 'pass') {
          // Pass - move to next player
          const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
          nextPlayer = getNextPlayer(input.playerId, game.playerCount, turnOrder);
        } else if (decision.action === 'draw') {
          // Draw card
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

          const availableBikes = allBikes.filter((b: any) => !dealtBikes.has(b.id));

          if (availableBikes.length > 0) {
            const randomBike = availableBikes[Math.floor(Math.random() * availableBikes.length)];
            const updatedHand = [...hand, randomBike.id];

            await db
              .update(gameStates)
              .set({ hand: JSON.stringify(updatedHand) as any })
              .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)));
          }

          // Move to next player
          const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
          nextPlayer = getNextPlayer(input.playerId, game.playerCount, turnOrder);
        }

        // Update game state
        if (!gameFinished) {
          await db
            .update(games)
            .set({ currentTurn: nextPlayer })
            .where(eq(games.id, input.gameId));
        } else {
          await db
            .update(games)
            .set({ status: 'finished' })
            .where(eq(games.id, input.gameId));
        }

        return {
          success: true,
          action: decision.action,
          gameFinished,
          winner,
          nextPlayer,
        };
      } catch (error) {
        console.error("Error executing CPU turn:", error);
        throw error;
      }
    }),

  /**
   * CPU declares spec
   */
  declareSpec: protectedProcedure
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

        const game = gameRecord[0];

        // Get CPU player's hand
        const playerState = await db
          .select()
          .from(gameStates)
          .where(and(eq(gameStates.gameId, input.gameId), eq(gameStates.playerId, input.playerId)))
          .limit(1);

        if (!playerState.length) {
          throw new Error("Player state not found");
        }

        const hand = typeof playerState[0].hand === 'string'
          ? JSON.parse(playerState[0].hand)
          : playerState[0].hand || [];

        // Get all bikes
        const allBikes = await db.select().from(bikes);
        const playerBikes = hand.map((id: number) => allBikes.find((b: any) => b.id === id)).filter(Boolean);

        // Decide CPU declaration
        const declaration = decideCPUDeclaration(playerBikes);

        // Store declaration and move to next player
        const turnOrder = [1, 2, 3, 4].slice(0, game.playerCount);
        const nextPlayer = getNextPlayer(input.playerId, game.playerCount, turnOrder);

        await db
          .update(games)
          .set({
            declaredSpec: declaration.spec,
            declaredDirection: declaration.direction,
            currentTurn: nextPlayer,
          })
          .where(eq(games.id, input.gameId));

        return {
          success: true,
          spec: declaration.spec,
          direction: declaration.direction,
          nextPlayer,
        };
      } catch (error) {
        console.error("Error declaring spec:", error);
        throw error;
      }
    }),
});
