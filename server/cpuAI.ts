import { Bike } from "../drizzle/schema";

/**
 * CPU AI for card selection
 */

export interface CPUDecision {
  action: 'play' | 'pass' | 'draw';
  bikeIds?: number[];
  bindDeclare?: {
    type: 'maker' | 'cylinders' | 'transmission';
    value: string;
  };
}

/**
 * Evaluate if a bike can win based on declared spec
 */
export function canWinWithBike(
  bike: Bike,
  declaredSpec: string,
  declaredDirection: string,
  playedBikes: Bike[]
): boolean {
  if (playedBikes.length === 0) return true;

  const lastBike = playedBikes[playedBikes.length - 1];
  
  // Get spec values
  const specKey = declaredSpec as keyof Bike;
  const bikeValue = specKey === 'cylinders' ? parseInt(bike[specKey] as string, 10) || 1 : (bike[specKey] as number) || 0;
  const lastValue = specKey === 'cylinders' ? parseInt(lastBike[specKey] as string, 10) || 1 : (lastBike[specKey] as number) || 0;

  if (declaredDirection === 'up') {
    return bikeValue >= lastValue;
  } else {
    return bikeValue <= lastValue;
  }
}

/**
 * CPU decides what action to take
 */
export function decideCPUAction(
  hand: Bike[],
  playedBikes: Bike[],
  declaredSpec: string,
  declaredDirection: string,
  currentBind?: string,
  bindValue?: string
): CPUDecision {
  // Filter valid cards based on current bind
  let validCards = hand;
  
  if (currentBind && bindValue && playedBikes.length > 0) {
    const lastBike = playedBikes[playedBikes.length - 1];
    
    validCards = hand.filter(bike => {
      if (currentBind === 'maker') {
        return bike.maker === bindValue;
      } else if (currentBind === 'cylinders') {
        return String(bike.cylinders) === bindValue;
      } else if (currentBind === 'transmission') {
        return bike.transmission === bindValue;
      }
      return true;
    });
  }

  // Find winning cards
  const winningCards = validCards.filter(bike =>
    canWinWithBike(bike, declaredSpec, declaredDirection, playedBikes)
  );

  // Strategy: Try to play a winning card if available
  if (winningCards.length > 0) {
    // Prefer cards that can also declare a bind
    const cardWithBind = winningCards.find(bike => {
      if (playedBikes.length === 0) return false;
      const lastBike = playedBikes[playedBikes.length - 1];
      return (
        bike.maker === lastBike.maker ||
        bike.cylinders === lastBike.cylinders ||
        bike.transmission === lastBike.transmission
      );
    });

    const selectedCard = cardWithBind || winningCards[0];
    
    // 複数枚出し: 選んだカードと同じスペック値のカードを探す
    const specKey = declaredSpec as keyof Bike;
    const targetValue = selectedCard[specKey];
    const cardsToPlay = winningCards.filter(bike => bike[specKey] === targetValue);
    const bikeIds = cardsToPlay.map(bike => bike.id);
    
    // Check if can declare bind (using the first card)
    if (playedBikes.length > 0) {
      const lastBike = playedBikes[playedBikes.length - 1];
      const bindOptions = [];

      if (selectedCard.maker === lastBike.maker) {
        bindOptions.push({ type: 'maker' as const, value: selectedCard.maker });
      }
      if (selectedCard.cylinders === lastBike.cylinders) {
        bindOptions.push({ type: 'cylinders' as const, value: String(selectedCard.cylinders) });
      }
      if (selectedCard.transmission === lastBike.transmission) {
        bindOptions.push({ type: 'transmission' as const, value: selectedCard.transmission });
      }

      // 50% chance to declare bind if available
      if (bindOptions.length > 0 && Math.random() > 0.5) {
        const bindDecision = bindOptions[Math.floor(Math.random() * bindOptions.length)];
        return {
          action: 'play',
          bikeIds,
          bindDeclare: bindDecision,
        };
      }
    }

    return {
      action: 'play',
      bikeIds,
    };
  }

  // If no winning cards, decide between pass and draw
  // 60% pass, 40% draw
  if (Math.random() > 0.4) {
    return { action: 'pass' };
  } else {
    return { action: 'draw' };
  }
}

/**
 * CPU decides what spec to declare
 */
export function decideCPUDeclaration(hand: Bike[]): {
  spec: string;
  direction: string;
} {
  const specs = ['horsepower', 'fuelEfficiency', 'seatHeight', 'totalLength', 'weight', 'price', 'year'];
  const directions = ['up', 'down'];

  // Find the spec where this player has the most advantage
  let bestSpec = specs[0];
  let bestDirection = directions[0];
  let bestScore = -Infinity;

  for (const spec of specs) {
    for (const direction of directions) {
      const specKey = spec as keyof Bike;
      const values = hand.map(bike => {
        const val = bike[specKey];
        if (specKey === 'cylinders') return parseInt(val as string, 10) || 1;
        return (val as number) || 0;
      }).sort((a, b) => a - b);
      
      let score = 0;
      if (direction === 'up') {
        // Prefer if we have high values
        score = values[values.length - 1] - values[0];
      } else {
        // Prefer if we have low values
        score = values[0] + (values.length - values[values.length - 1]);
      }

      if (score > bestScore) {
        bestScore = score;
        bestSpec = spec;
        bestDirection = direction;
      }
    }
  }

  return {
    spec: bestSpec,
    direction: bestDirection,
  };
}
