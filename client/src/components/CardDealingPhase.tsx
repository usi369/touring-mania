import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CardDealingPhaseProps {
  playerCount: number;
  onDealingComplete: () => void;
  isOpen: boolean;
}

interface PlayerDealing {
  playerId: number;
  playerName: string;
  cardsDealt: number;
  isDealing: boolean;
}

export default function CardDealingPhase({
  playerCount,
  onDealingComplete,
  isOpen,
}: CardDealingPhaseProps) {
  const [players, setPlayers] = useState<PlayerDealing[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [dealingComplete, setDealingComplete] = useState(false);

  useEffect(() => {
    if (isOpen && !isDealing) {
      startDealing();
    }
  }, [isOpen]);

  const startDealing = () => {
    setIsDealing(true);
    setDealingComplete(false);

    // Initialize players
    const initialPlayers: PlayerDealing[] = [];
    for (let i = 1; i <= playerCount; i++) {
      initialPlayers.push({
        playerId: i,
        playerName: i === 1 ? "You" : `Player ${i}`,
        cardsDealt: 0,
        isDealing: true,
      });
    }
    setPlayers(initialPlayers);

    // Simulate dealing cards (4 cards per player)
    let currentCard = 0;
    const totalCards = playerCount * 4;
    const dealInterval = setInterval(() => {
      currentCard++;

      // Calculate which player and how many cards they have
      setPlayers((prev) =>
        prev.map((p) => {
          const playerStartCard = (p.playerId - 1) * 4;
          const playerEndCard = playerStartCard + 4;
          const cardsDealt = Math.min(
            currentCard - playerStartCard,
            4
          );

          return {
            ...p,
            cardsDealt: Math.max(0, cardsDealt),
            isDealing: currentCard <= playerEndCard,
          };
        })
      );

      // Finish dealing
      if (currentCard >= totalCards) {
        clearInterval(dealInterval);
        setIsDealing(false);
        setDealingComplete(true);

        // Auto-close after showing completion
        setTimeout(() => {
          onDealingComplete();
        }, 1500);
      }
    }, 300); // Deal one card every 300ms
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-8 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          手札を配っています...
        </h2>

        {/* Players Dealing Display */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {players.map((player) => (
            <div
              key={player.playerId}
              className="flex flex-col items-center"
            >
              {/* Player Name */}
              <p className="text-sm text-slate-400 mb-3">{player.playerName}</p>

              {/* Cards Display */}
              <div className="relative w-32 h-24 mb-3">
                {/* Card Stack Animation */}
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`
                      absolute w-12 h-16 bg-gradient-to-br from-cyan-500/20 to-pink-500/20
                      border-2 border-cyan-500/50 rounded-lg
                      transition-all duration-300
                      ${
                        index < player.cardsDealt
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-75"
                      }
                    `}
                    style={{
                      left: `${index * 8}px`,
                      top: `${index * 4}px`,
                      transform: `translateY(${index < player.cardsDealt ? 0 : 20}px)`,
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs font-bold text-cyan-300">
                        {index < player.cardsDealt ? "🃏" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cards Count */}
              <div className="text-center">
                <p className="text-lg font-bold text-cyan-400">
                  {player.cardsDealt}
                </p>
                <p className="text-xs text-slate-400">/ 4 枚</p>
              </div>

              {/* Dealing Indicator */}
              {player.isDealing && (
                <div className="mt-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status Message */}
        {dealingComplete && (
          <div className="text-center p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-white font-semibold">
              全員に手札が配られました！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
