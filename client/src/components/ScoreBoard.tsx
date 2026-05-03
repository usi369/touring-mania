import { Card } from "@/components/ui/card";

interface ScoreBoardProps {
  scores: Record<number, number>; // playerId -> score
  playerCount: number;
  currentRound: number;
}

/**
 * Score Board - Display cumulative scores across rounds
 */
export default function ScoreBoard({
  scores,
  playerCount,
  currentRound,
}: ScoreBoardProps) {
  const getPlayerName = (playerId: number) => {
    return playerId === 1 ? "You" : `Player ${playerId}`;
  };

  const sortedPlayers = Array.from({ length: playerCount }, (_, i) => i + 1).sort(
    (a, b) => (scores[b] || 0) - (scores[a] || 0)
  );

  return (
    <Card className="w-full bg-slate-800/50 border-cyan-500/30 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-cyan-400">ラウンド {currentRound}</h3>
        <p className="text-xs text-slate-400">累積スコア</p>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((playerId, index) => (
          <div
            key={playerId}
            className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-700"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 w-6 text-center">
                {index + 1}位
              </span>
              <span className="text-sm font-semibold text-white">
                {getPlayerName(playerId)}
              </span>
            </div>
            <span className="text-lg font-bold text-pink-400">
              {scores[playerId] || 0}pt
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
