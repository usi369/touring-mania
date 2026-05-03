import { describe, it, expect } from "vitest";
import {
  compareBikes,
  canPlayCard,
  getPossibleBinds,
  determineWinner,
  rollDice,
  determineTurnOrder,
  getNextPlayer,
  hasPlayerWon,
} from "./gameLogic";

const mockBike1 = {
  id: 1,
  name: "Bike A",
  maker: "Honda",
  cylinders: 4,
  transmission: "MT",
  seatHeight: 800,
  totalLength: 2000,
  price: 500000,
  category: "Sport",
};

const mockBike2 = {
  id: 2,
  name: "Bike B",
  maker: "Yamaha",
  cylinders: 2,
  transmission: "AT",
  seatHeight: 750,
  totalLength: 1900,
  price: 400000,
  category: "Cruiser",
};

describe("Game Logic", () => {
  describe("compareBikes", () => {
    it("should compare bikes by cylinders (up)", () => {
      const result = compareBikes(mockBike1, mockBike2, "cylinders", "up");
      expect(result).toBe(1); // bike1 has 4 cylinders, bike2 has 2
    });

    it("should compare bikes by cylinders (down)", () => {
      const result = compareBikes(mockBike1, mockBike2, "cylinders", "down");
      expect(result).toBe(-1); // bike2 has fewer cylinders
    });

    it("should compare bikes by price (up)", () => {
      const result = compareBikes(mockBike1, mockBike2, "price", "up");
      expect(result).toBe(1); // bike1 is more expensive
    });

    it("should return 0 for equal values", () => {
      const result = compareBikes(mockBike1, mockBike1, "cylinders", "up");
      expect(result).toBe(0);
    });
  });

  describe("canPlayCard", () => {
    it("should allow first card without restrictions", () => {
      const result = canPlayCard(mockBike1, null, null, null);
      expect(result).toBe(true);
    });

    it("should allow card matching maker bind", () => {
      const result = canPlayCard(mockBike1, mockBike1, "maker", "Honda");
      expect(result).toBe(true);
    });

    it("should reject card not matching maker bind", () => {
      const result = canPlayCard(mockBike2, mockBike1, "maker", "Honda");
      expect(result).toBe(false);
    });

    it("should allow card matching cylinders bind", () => {
      const result = canPlayCard(mockBike1, mockBike1, "cylinders", "4");
      expect(result).toBe(true);
    });
  });

  describe("getPossibleBinds", () => {
    it("should return empty array for different bikes", () => {
      const result = getPossibleBinds(mockBike1, mockBike2);
      expect(result).toEqual([]);
    });

    it("should return matching bind types", () => {
      const result = getPossibleBinds(mockBike1, mockBike1);
      expect(result).toContain("maker");
      expect(result).toContain("cylinders");
      expect(result).toContain("transmission");
    });

    it("should return partial matches", () => {
      const bike3 = { ...mockBike2, maker: "Honda" };
      const result = getPossibleBinds(mockBike1, bike3);
      expect(result).toContain("maker");
    });
  });

  describe("determineWinner", () => {
    it("should determine winner by cylinders (up)", () => {
      const result = determineWinner(mockBike1, mockBike2, "cylinders", "up");
      expect(result).toBe(1); // bike1 wins
    });

    it("should determine winner by cylinders (down)", () => {
      const result = determineWinner(mockBike1, mockBike2, "cylinders", "down");
      expect(result).toBe(2); // bike2 wins
    });

    it("should return 0 for tie", () => {
      const result = determineWinner(mockBike1, mockBike1, "cylinders", "up");
      expect(result).toBe(0);
    });
  });

  describe("rollDice", () => {
    it("should return a value between 1 and 6", () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDice();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });
  });

  describe("determineTurnOrder", () => {
    it("should sort players by dice value descending", () => {
      const diceRolls = new Map([
        [1, 3],
        [2, 6],
        [3, 2],
        [4, 5],
      ]);
      const result = determineTurnOrder(diceRolls);
      expect(result).toEqual([2, 4, 1, 3]); // 6, 5, 3, 2
    });

    it("should handle 2 players", () => {
      const diceRolls = new Map([
        [1, 4],
        [2, 5],
      ]);
      const result = determineTurnOrder(diceRolls);
      expect(result).toEqual([2, 1]);
    });
  });

  describe("getNextPlayer", () => {
    it("should return next player in turn order", () => {
      const turnOrder = [2, 4, 1, 3];
      const result = getNextPlayer(2, 4, turnOrder);
      expect(result).toBe(4);
    });

    it("should wrap around to first player", () => {
      const turnOrder = [2, 4, 1, 3];
      const result = getNextPlayer(3, 4, turnOrder);
      expect(result).toBe(2);
    });
  });

  describe("hasPlayerWon", () => {
    it("should return true when hand is empty", () => {
      const result = hasPlayerWon([]);
      expect(result).toBe(true);
    });

    it("should return false when hand has cards", () => {
      const result = hasPlayerWon([1, 2, 3]);
      expect(result).toBe(false);
    });
  });
});
