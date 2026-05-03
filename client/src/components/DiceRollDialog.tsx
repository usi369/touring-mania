import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DiceRollDialogProps {
  playerCount: number;
  onRollComplete: (diceRolls: Record<number, number>, turnOrder: number[], declarationPlayer: number) => void;
  isOpen: boolean;
}

interface PlayerDice {
  playerId: number;
  playerName: string;
  diceValue: number;
  isRolling: boolean;
  isTied: boolean;
  isEliminated: boolean;
}

export default function DiceRollDialog({
  playerCount,
  onRollComplete,
  isOpen,
}: DiceRollDialogProps) {
  const [playerDices, setPlayerDices] = useState<PlayerDice[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [rerollMessage, setRerollMessage] = useState<string | null>(null);
  const [rerollCount, setRerollCount] = useState(0);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const players: PlayerDice[] = [];
      for (let i = 1; i <= playerCount; i++) {
        players.push({
          playerId: i,
          playerName: i === 1 ? "You" : `Player ${i}`,
          diceValue: 0,
          isRolling: false,
          isTied: false,
          isEliminated: false,
        });
      }
      setPlayerDices(players);
      setShowResults(false);
      setRerollMessage(null);
      setRerollCount(0);
      setResolved(false);
    }
  }, [isOpen, playerCount]);

  const rollForPlayers = useCallback((playersToRoll: PlayerDice[], allPlayers: PlayerDice[]) => {
    setIsRolling(true);
    setShowResults(false);
    setRerollMessage(null);

    // Mark rolling players
    setPlayerDices(
      allPlayers.map((p) => ({
        ...p,
        isRolling: playersToRoll.some((r) => r.playerId === p.playerId),
        isTied: false,
      }))
    );

    const animationDuration = 1500;
    const rollInterval = setInterval(() => {
      setPlayerDices((prev) =>
        prev.map((p) => {
          if (!playersToRoll.some((r) => r.playerId === p.playerId)) return p;
          return {
            ...p,
            diceValue: Math.floor(Math.random() * 6) + 1,
          };
        })
      );
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);

      // Generate final dice values for rolling players
      const finalValues: Record<number, number> = {};
      playersToRoll.forEach((p) => {
        finalValues[p.playerId] = Math.floor(Math.random() * 6) + 1;
      });

      setPlayerDices((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          isRolling: false,
          diceValue: finalValues[p.playerId] !== undefined ? finalValues[p.playerId] : p.diceValue,
        }));

        // Check for ties among the highest value
        const activePlayers = updated.filter((p) => !p.isEliminated);
        const maxValue = Math.max(...activePlayers.map((p) => p.diceValue));
        const tiedPlayers = activePlayers.filter((p) => p.diceValue === maxValue);

        if (tiedPlayers.length > 1) {
          // Mark tied players
          const withTies = updated.map((p) => ({
            ...p,
            isTied: tiedPlayers.some((t) => t.playerId === p.playerId),
          }));

          setPlayerDices(withTies);
          setShowResults(true);
          setIsRolling(false);
          setRerollMessage(
            `${tiedPlayers.map((p) => p.playerName).join(" と ")} が同点（${maxValue}）です！再度振ります…`
          );

          // Auto re-roll after a delay
          setTimeout(() => {
            setRerollCount((c) => c + 1);

            // Eliminate non-tied active players (they lost)
            const nextAll = withTies.map((p) => ({
              ...p,
              isEliminated: p.isEliminated || (!tiedPlayers.some((t) => t.playerId === p.playerId) && !p.isEliminated && activePlayers.some((a) => a.playerId === p.playerId)),
              isTied: false,
            }));

            const nextRollers = nextAll.filter(
              (p) => tiedPlayers.some((t) => t.playerId === p.playerId)
            );

            rollForPlayers(nextRollers, nextAll);
          }, 2000);
        } else {
          // No tie - we have a winner
          setShowResults(true);
          setIsRolling(false);
          setResolved(true);
        }

        return updated;
      });
    }, animationDuration);
  }, []);

  const handleRollDice = () => {
    if (resolved) {
      // Already resolved - finalize
      const activePlayers = playerDices.filter((p) => !p.isEliminated);
      const maxValue = Math.max(...activePlayers.map((p) => p.diceValue));

      const diceRolls: Record<number, number> = {};
      playerDices.forEach((p) => {
        diceRolls[p.playerId] = p.diceValue;
      });

      // Build turn order: winner first, then others sorted by dice value desc
      const winner = activePlayers.find((p) => p.diceValue === maxValue)!;
      const others = playerDices
        .filter((p) => p.playerId !== winner.playerId)
        .sort((a, b) => b.diceValue - a.diceValue);

      const turnOrder = [winner.playerId, ...others.map((p) => p.playerId)];
      const declarationPlayer = turnOrder[0];

      onRollComplete(diceRolls, turnOrder, declarationPlayer);
      return;
    }

    // First roll - roll for all players
    rollForPlayers(playerDices, playerDices);
  };

  if (!isOpen) return null;

  // Sort players for display: active first, then eliminated
  const activePlayers = playerDices.filter((p) => !p.isEliminated);
  const eliminatedPlayers = playerDices.filter((p) => p.isEliminated);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          サイコロを振る
        </h2>
        {rerollCount > 0 && (
          <p className="text-xs text-slate-400 text-center mb-4">
            再ロール: {rerollCount}回目
          </p>
        )}

        {/* Re-roll Message */}
        {rerollMessage && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300 text-center font-semibold">
              {rerollMessage}
            </p>
          </div>
        )}

        {/* Dice Display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {activePlayers.map((player) => (
            <div
              key={player.playerId}
              className={`bg-slate-800/50 border rounded-lg p-4 flex flex-col items-center justify-center aspect-square transition-all ${
                player.isTied
                  ? "border-yellow-500 bg-yellow-500/10"
                  : resolved && player.diceValue === Math.max(...activePlayers.map((p) => p.diceValue))
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-slate-700"
              }`}
            >
              <p className="text-sm text-slate-400 mb-2">{player.playerName}</p>
              <div className="text-4xl font-bold text-cyan-400 mb-2 h-12 flex items-center justify-center">
                {player.isRolling ? (
                  <span className="animate-bounce">{player.diceValue || "?"}</span>
                ) : (
                  player.diceValue || "?"
                )}
              </div>
              {player.isRolling && (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              )}
              {player.isTied && !player.isRolling && (
                <span className="text-xs text-yellow-400 font-semibold">同点！</span>
              )}
            </div>
          ))}
        </div>

        {/* Eliminated Players */}
        {eliminatedPlayers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">確定済み:</p>
            <div className="flex gap-2 flex-wrap">
              {eliminatedPlayers.map((player) => (
                <div
                  key={player.playerId}
                  className="bg-slate-800/30 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-xs text-slate-500">{player.playerName}</span>
                  <span className="text-sm font-bold text-slate-500">{player.diceValue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && resolved && (
          <div className="mb-6 p-4 bg-slate-800/30 border border-cyan-500/30 rounded-lg">
            <p className="text-sm text-slate-400 mb-2">ターン順序:</p>
            <div className="space-y-1">
              {[...playerDices]
                .sort((a, b) => {
                  // Winner (active with max) first, then by dice desc
                  const aActive = !a.isEliminated;
                  const bActive = !b.isEliminated;
                  if (aActive && !bActive) return -1;
                  if (!aActive && bActive) return 1;
                  return b.diceValue - a.diceValue;
                })
                .map((player, index) => (
                  <div
                    key={player.playerId}
                    className="text-sm text-white flex justify-between"
                  >
                    <span>
                      {index + 1}. {player.playerName}
                      {index === 0 && " 👑"}
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {player.diceValue}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Button */}
        <Button
          onClick={handleRollDice}
          disabled={isRolling}
          className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg"
        >
          {isRolling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              振っています...
            </>
          ) : resolved ? (
            "次へ進む"
          ) : (
            "サイコロを振る"
          )}
        </Button>
      </div>
    </div>
  );
}
