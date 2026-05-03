import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoundResult {
  round: number;
  winner: number;
  winnerName: string;
  declaredSpec: string;
  declaredDirection: string;
  bindType?: string;
  bindValue?: string;
}

interface RoundHistoryProps {
  history: RoundResult[];
}

/**
 * Round History - Display past round results
 */
export default function RoundHistory({ history }: RoundHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="w-full bg-slate-800/50 border-cyan-500/30 p-4">
        <p className="text-sm text-slate-400">ラウンド履歴はまだありません</p>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-slate-800/50 border-cyan-500/30 p-4">
      <h3 className="text-sm font-semibold text-cyan-400 mb-3">ラウンド履歴</h3>
      <ScrollArea className="h-48">
        <div className="space-y-2 pr-4">
          {history.map((result) => (
            <div
              key={result.round}
              className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-400">
                  ラウンド {result.round}
                </span>
                <span className="text-sm font-bold text-pink-400">
                  {result.winnerName} 勝利
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  宣言: {result.declaredSpec} ({result.declaredDirection})
                </p>
                {result.bindType && (
                  <p>
                    縛り: {result.bindType} = {result.bindValue}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
