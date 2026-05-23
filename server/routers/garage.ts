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
});
