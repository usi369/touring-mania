import { useState, useEffect, useRef } from "react";

interface GarageMarqueeProps {
  bikes: any[];
}

interface BikeItem {
  id: number;
  photoUrl: string;
  name: string;
  x: number;      // コンテナに対するX座標パーセンテージ (-25% から 125%)
  y: number;      // 縦位置の微調整 (px)
  speed: number;  // 1フレームあたりの移動速度パーセンテージ
}

export default function GarageMarquee({ bikes }: GarageMarqueeProps) {
  if (!bikes || bikes.length === 0) return null;

  const [items, setItems] = useState<BikeItem[]>([]);
  const bikesRef = useRef(bikes);
  bikesRef.current = bikes;

  // 初期配置を設定（左から右へ流れるため、X座標を-25から125の間に綺麗に分散）
  useEffect(() => {
    const initialItems = Array.from({ length: 4 }).map((_, idx) => {
      const randomBike = bikes[Math.floor(Math.random() * bikes.length)];
      return {
        id: idx,
        photoUrl: randomBike.photoUrl || "https://placehold.co/400x300/1e293b/64748b?text=No+Image",
        name: randomBike.name,
        x: -25 + idx * 37.5, // -25%, 12.5%, 50%, 87.5% に均等分散して重なりを防止
        y: Math.random() * 16 - 8,
        speed: 0.08 + Math.random() * 0.08, // 毎フレームの移動パーセンテージ (速度のランダム化)
      };
    });
    setItems(initialItems);
  }, [bikes]);

  // アニメーションループ（requestAnimationFrameによる60FPS制御）
  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      setItems((prevItems) => {
        return prevItems.map((item) => {
          let nextX = item.x + item.speed;
          let nextPhotoUrl = item.photoUrl;
          let nextName = item.name;
          let nextSpeed = item.speed;
          let nextY = item.y;

          // 右端（125%）まで到達して画面外へ抜け切ったら、左端（-25%）へ戻す
          if (nextX >= 125) {
            nextX = -25;
            const currentBikes = bikesRef.current;
            if (currentBikes && currentBikes.length > 0) {
              // ワープしたタイミングで新しいランダムなバイク画像に切り替え
              const randomBike = currentBikes[Math.floor(Math.random() * currentBikes.length)];
              nextPhotoUrl = randomBike.photoUrl || "https://placehold.co/400x300/1e293b/64748b?text=No+Image";
              nextName = randomBike.name;
            }
            // 新しい移動速度とY座標（縦のブレ）をランダムに設定
            nextSpeed = 0.08 + Math.random() * 0.08;
            nextY = Math.random() * 16 - 8;
          }

          return {
            ...item,
            x: nextX,
            photoUrl: nextPhotoUrl,
            name: nextName,
            speed: nextSpeed,
            y: nextY,
          };
        });
      });

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              transform: `translate3d(${item.x}%, calc(50% - 32px + ${item.y}px), 0)`,
              willChange: "transform",
            }}
            className="absolute left-0 w-16 h-16 bg-slate-950/80 border border-cyan-500/20 rounded-lg p-1 shadow-[0_0_10px_rgba(34,211,238,0.1)] flex items-center justify-center transition-none"
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
          </div>
        ))}
      </div>
    </div>
  );
}
