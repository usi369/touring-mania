import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RulesScreenProps {
  onClose: () => void;
}

/**
 * Rules Screen - Game rules and instructions
 */
export default function RulesScreen({ onClose }: RulesScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden relative flex flex-col max-h-[95dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">ゲームルール</h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* Overview */}
          <div>
            <h2 className="text-lg font-bold text-cyan-400 mb-2">ゲーム概要</h2>
            <p className="text-slate-300">
              Touring Mania は、78種類のバイクを使ったカードゲームです。宣言したスペックで最も高い（または低い）バイクを出したプレイヤーが勝ちます。最初に手札がなくなったプレイヤーがゲーム全体の勝者です。
            </p>
          </div>

          {/* Game Flow */}
          <div>
            <h2 className="text-lg font-bold text-cyan-400 mb-2">ゲームの流れ</h2>
            <ol className="space-y-3 text-slate-300">
              <li>
                <span className="font-semibold text-white">1. サイコロを振る</span>
                <p className="text-sm">全プレイヤーが一斉にサイコロを振ります。一番大きい目が出たプレイヤーが宣言者になります。</p>
              </li>
              <li>
                <span className="font-semibold text-white">2. 手札を配る</span>
                <p className="text-sm">各プレイヤーに4枚のバイクカードが配られます。</p>
              </li>
              <li>
                <span className="font-semibold text-white">3. スペック宣言</span>
                <p className="text-sm">宣言者が勝負するスペック（馬力、燃費など）と方向（高い順/低い順）を宣言します。</p>
              </li>
              <li>
                <span className="font-semibold text-white">4. カードを出す</span>
                <p className="text-sm">時計回りに各プレイヤーが、場に出ている最新のカード（一番左）よりも強いカードを出します。同じ数字でも出せます。</p>
              </li>
              <li>
                <span className="font-semibold text-white">5. 同時出し</span>
                <p className="text-sm">手札に同じ数字のカードが複数ある場合、まとめて場に出すことができます。最後に出したカードが次の判定の基準になります。</p>
              </li>
              <li>
                <span className="font-semibold text-white">6. 場が流れる・新宣言</span>
                <p className="text-sm">自分以外の全員がパスすると場が流れます。最後にカードを出した人が「新宣言者」となり、次の勝負のスペックを宣言します。宣言者は宣言のみを行い、カードを出すのは次のプレイヤーからです。</p>
              </li>
            </ol>
          </div>

          {/* Specs */}
          <div>
            <h2 className="text-lg font-bold text-cyan-400 mb-2">宣言できるスペック</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
              <li>
                <span className="font-semibold text-white">馬力 (PS)</span>
                <p className="text-sm text-slate-400">エンジンの出力を比較します。</p>
              </li>
              <li>
                <span className="font-semibold text-white">燃費 (km/L)</span>
                <p className="text-sm text-slate-400">1リットルあたりの走行距離を比較します。</p>
              </li>
              <li>
                <span className="font-semibold text-white">シート高 (mm)</span>
                <p className="text-sm text-slate-400">地面からシートまでの高さを比較します。</p>
              </li>
              <li>
                <span className="font-semibold text-white">全長 (mm)</span>
                <p className="text-sm text-slate-400">バイクの車体の長さを比較します。</p>
              </li>
              <li>
                <span className="font-semibold text-white">重量 (kg)</span>
                <p className="text-sm text-slate-400">車両の重さを比較します。</p>
              </li>
              <li>
                <span className="font-semibold text-white">価格 (万円)</span>
                <p className="text-sm text-slate-400">メーカー希望小売価格を比較します。</p>
              </li>
              <li>
                <span className="font-semibold text-white">発売年月日 (年)</span>
                <p className="text-sm text-slate-400">モデルの発売時期を比較します。</p>
              </li>
            </ul>
          </div>

          {/* Bind System */}
          <div>
            <h2 className="text-lg font-bold text-cyan-400 mb-2">縛りシステム</h2>
            <p className="text-slate-300 mb-3">
              場に出ているカードと出そうとしているカードで、以下のいずれかが合致している場合、追加の縛りを宣言できます：
            </p>
            <ul className="space-y-2 text-slate-300">
              <li>
                <span className="font-semibold text-white">メーカー</span>
                <p className="text-sm">同じメーカーのバイクのみ出せるようになります。</p>
              </li>
              <li>
                <span className="font-semibold text-white">気筒数</span>
                <p className="text-sm">同じ気筒数のバイクのみ出せるようになります。</p>
              </li>
              <li>
                <span className="font-semibold text-white">AT/MT</span>
                <p className="text-sm">同じトランスミッションのバイクのみ出せるようになります。</p>
              </li>
            </ul>
          </div>

          {/* Winning */}
          <div>
            <h2 className="text-lg font-bold text-cyan-400 mb-2">勝利条件</h2>
            <p className="text-slate-300">
              最初に手札がなくなったプレイヤーが1位となります。ゲーム終了時に手札の残り枚数が少ない順に順位が決定します。
            </p>
          </div>

          {/* Bottom Button */}
          <div className="pt-8">
            <Button
              onClick={onClose}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-xl shadow-lg transition-all active:scale-95"
            >
              閉じる
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
