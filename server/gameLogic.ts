/**
 * Game Logic Utilities for Touring Mania
 */

export interface BikeCard {
  id: number;
  name: string;
  maker: string;
  cylinders: number;
  transmission: string;
  seatHeight: number;
  totalLength: number;
  price: number;
  category: string;
}

export type SpecType = 'cylinders' | 'seatHeight' | 'totalLength' | 'price';
export type BindType = 'maker' | 'cylinders' | 'transmission' | null;

/**
 * Compare two bikes based on a spec type
 * Returns 1 if bike1 wins, -1 if bike2 wins, 0 if tie
 */
export function compareBikes(
  bike1: BikeCard,
  bike2: BikeCard,
  spec: SpecType,
  direction: 'up' | 'down' = 'up'
): number {
  const value1 = bike1[spec as keyof BikeCard] as number;
  const value2 = bike2[spec as keyof BikeCard] as number;

  if (direction === 'up') {
    if (value1 > value2) return 1;
    if (value1 < value2) return -1;
  } else {
    if (value1 < value2) return 1;
    if (value1 > value2) return -1;
  }
  return 0;
}

/**
 * Check if a card can be played based on bind rules
 */
export function canPlayCard(
  card: BikeCard,
  tableCard: BikeCard | null,
  currentBind: BindType,
  bindValue: string | null
): boolean {
  if (!tableCard && !currentBind) {
    // First card, no restrictions
    return true;
  }

  if (currentBind && bindValue) {
    // Check bind restriction
    switch (currentBind) {
      case 'maker':
        return card.maker === bindValue;
      case 'cylinders':
        return card.cylinders.toString() === bindValue;
      case 'transmission':
        return card.transmission === bindValue;
    }
  }

  return true;
}

/**
 * Get possible bind options when playing a card
 * Returns array of bind types that match between table card and play card
 */
export function getPossibleBinds(
  tableCard: BikeCard,
  playCard: BikeCard
): BindType[] {
  const possibleBinds: BindType[] = [];

  if (tableCard.maker === playCard.maker) {
    possibleBinds.push('maker');
  }
  if (tableCard.cylinders === playCard.cylinders) {
    possibleBinds.push('cylinders');
  }
  if (tableCard.transmission === playCard.transmission) {
    possibleBinds.push('transmission');
  }

  return possibleBinds;
}

/**
 * Determine winner between two bikes
 */
export function determineWinner(
  bike1: BikeCard,
  bike2: BikeCard,
  spec: SpecType,
  direction: 'up' | 'down' = 'up'
): 1 | 2 | 0 {
  const result = compareBikes(bike1, bike2, spec, direction);
  if (result > 0) return 1;
  if (result < 0) return 2;
  return 0; // Tie
}

/**
 * Roll dice for turn order
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Determine turn order based on dice rolls
 * Returns array of player IDs in order (highest to lowest)
 */
export function determineTurnOrder(diceRolls: Map<number, number>): number[] {
  const players = Array.from(diceRolls.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by dice value descending
    .map(([playerId]) => playerId);

  return players;
}

/**
 * Get next player in turn order
 */
export function getNextPlayer(
  currentPlayer: number,
  playerCount: number,
  turnOrder: number[]
): number {
  const currentIndex = turnOrder.indexOf(currentPlayer);
  const nextIndex = (currentIndex + 1) % turnOrder.length;
  return turnOrder[nextIndex];
}

/**
 * Check if a player has won (hand is empty)
 */
export function hasPlayerWon(hand: number[]): boolean {
  return hand.length === 0;
}
