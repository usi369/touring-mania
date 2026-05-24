import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface GarageMarqueeProps {
  bikes: any[];
}

export default function GarageMarquee({ bikes }: GarageMarqueeProps) {
  if (!bikes || bikes.length === 0) return null;

  // 画面上に同時に流すバイクアイテムのステート
  const [items, setItems] = useState<Array<{
    key: number;
    photoUrl: string;
    name: string;
    duration: number;
    delay: number;
    y: number;
  }>>([]);

  useEffect(() => {
    // 最初のアイテムを生成
    // 重なりを防ぐため、初期ディレイを適度にズラして設定します
    const initialItems = Array.from({ length: 4 }).map((_, idx) => {
      const randomBike = bikes[Math.floor(Math.random() * bikes.length)];
      return {
        key: idx,
        photoUrl: randomBike.photoUrl || "https://placehold.co/400x300/1e293b/64748b?text=No+Image",
        name: randomBike.name,
        duration: 6 + Math.random() * 5, // 6秒〜11秒の間でランダムな移動速度
        delay: idx * 2.0, // 各バイクの登場タイミングをずらす
        y: Math.random() * 16 - 8, // 上下位置に若干の揺らぎを与える
      };
    });
    setItems(initialItems);
  }, [bikes]);

  // バイクが左端に流れて消え去ったタイミングで、新しいバイク画像とランダム速度で再生成して右端に戻す
  const handleComplete = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const randomBike = bikes[Math.floor(Math.random() * bikes.length)];
          return {
            ...item,
            key: Date.now() + i, // キー値を更新してコンポーネントを再マウントさせ、アニメーションを再実行
            photoUrl: randomBike.photoUrl || "https://placehold.co/400x300/1e293b/64748b?text=No+Image",
            name: randomBike.name,
            duration: 6 + Math.random() * 5,
            delay: 0, // 既に待機が開始しているため、再登場時の追加ディレイは不要
            y: Math.random() * 16 - 8,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 border border-slate-800 rounded-xl h-24 relative overflow-hidden flex items-center shadow-inner mt-4">
      {/* ガレージ風のインダストリアル背景ライン */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_8px] pointer-events-none" />
      <div className="absolute left-2.5 top-2 text-[8px] font-mono text-slate-600 tracking-widest uppercase pointer-events-none">
        Garage Monitor
      </div>
      
      {/* 左右のフェードアウト用グラデーションマスク */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* バイクが流れるレール */}
      <div className="relative w-full h-full overflow-hidden">
        {items.map((item, idx) => (
          <motion.div
            key={item.key}
            initial={{ x: "115%", y: `calc(50% - 32px + ${item.y}px)` }}
            animate={{ x: "-115%" }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              ease: "linear",
            }}
            onAnimationComplete={() => handleComplete(idx)}
            className="absolute left-0 w-16 h-16 bg-slate-950/80 border border-cyan-500/20 rounded-lg p-1 shadow-[0_0_10px_rgba(34,211,238,0.1)] flex items-center justify-center"
          >
            <img
              src={item.photoUrl}
              alt={item.name}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/400x300/1e293b/64748b?text=No+Image";
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
