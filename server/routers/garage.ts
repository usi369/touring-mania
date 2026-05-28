import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserGarage, updateUserGarage, getBikeById } from "../db";

export const garageRouter = router({
  /**
   * Get the current user's favorite bike from garage
   */
  getGarage: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const garageRecord = await getUserGarage(userId);
      
      if (!garageRecord) {
        return { bike: null };
      }

      const bike = await getBikeById(garageRecord.bikeId);
      return { bike };
    } catch (error) {
      console.error("Error getting user garage:", error);
      throw error;
    }
  }),

  /**
   * Update the current user's favorite bike in garage
   */
  setGarageBike: protectedProcedure
    .input(z.object({ bikeId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        const updated = await updateUserGarage(userId, input.bikeId);
        
        if (!updated) {
          throw new Error("Failed to update garage");
        }

        const bike = await getBikeById(updated.bikeId);
        return { success: true, bike };
      } catch (error) {
        console.error("Error setting garage bike:", error);
        throw error;
      }
    }),

  /**
   * Register a brand new bike and set as favorite in garage
   */
  registerGarageBike: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      maker: z.string().min(1),
      category: z.enum(["large", "medium", "small"]),
      cylinders: z.string().min(1),
      transmission: z.enum(["AT", "MT"]),
      horsepower: z.number().min(1),
      fuelEfficiency: z.number().min(1),
      weight: z.number().min(1),
      seatHeight: z.number().min(1),
      totalLength: z.number().min(1),
      year: z.number().min(1900).max(2100),
      price: z.number().min(0),
      photoUrl: z.string().nullable().optional(),
      displacement: z.string().min(1),
      displacementUnit: z.string().default("cc"),
      engineType: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        const { getDb } = await import("../db");
        const { bikes } = await import("../../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(bikes).values({
          name: input.name,
          maker: input.maker,
          category: input.category,
          cylinders: input.cylinders,
          transmission: input.transmission,
          horsepower: input.horsepower,
          fuelEfficiency: input.fuelEfficiency,
          weight: input.weight,
          seatHeight: input.seatHeight,
          totalLength: input.totalLength,
          year: input.year,
          price: input.price,
          photoUrl: input.photoUrl || null,
          displacement: input.displacement,
          displacementUnit: input.displacementUnit,
          engineType: input.engineType,
          isR7Starter: true,
          isTokyoRemake: true,
          isR6Complete: true,
          isR7Mega: true,
        }).returning({ id: bikes.id });

        const newBikeId = result[0].id;

        const updated = await updateUserGarage(userId, newBikeId);
        if (!updated) {
          throw new Error("Failed to link new bike to user garage");
        }

        const bike = await getBikeById(newBikeId);
        return { success: true, bike };
      } catch (error) {
        console.error("Error registering garage bike:", error);
        throw error;
      }
    }),
});
