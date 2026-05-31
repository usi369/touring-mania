import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Loader2, Home } from "lucide-react";
import { useToast } from "@/components/Toast";
import DiceRollDialog from "@/components/DiceRollDialog";
import DeclarationPhase from "@/components/DeclarationPhase";
import CardDealingPhase from "@/components/CardDealingPhase";
import CardPlayPhase from "@/components/CardPlayPhase";
import GameResultScreen from "@/components/GameResultScreen";
import BikeCard from "@/components/BikeCard";
import HandReview from "@/components/HandReview";
import ScoreBoard from "@/components/ScoreBoard";
import RoundHistory from "@/components/RoundHistory";
import GameLog, { LogEntry } from "@/components/GameLog";
import { nanoid } from 'nanoid';

interface GameBoardProps {
  playerCount?: number;
}

type GamePhase = 'dice' | 'dealing' | 'handReview' | 'declaration' | 'playing' | 'finished';

const specLabels: Record<string, string> = {
  horsepower: "馬力",
  fuelEfficiency: "燃費",
  seatHeight: "シート高",
  totalLength: "全長",
  weight: "重量",
  price: "価格",
  year: "発売年月日",
  cylinders: "気筒数",
};

const editionLabels: Record<string, string> = {
  'tokyo_remake': 'ツーリングマニア東京リメイク',
  'r6_complete': 'ツーリングマニア バイカーズ R6 コンプリートBOX',
  'r7_mega': 'ツーリングマニア バイカーズ R7 メガBOX',
  'r7_starter': 'ツーリングマニア バイカーズ R7 スターターBOX (最新版)',
};

export default function GameBoard() {
  const [, setLocation] = useLocation();
  const { addToast, clearToasts } = useToast();
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('dice');
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [diceRolls, setDiceRolls] = useState<Record<number, number> | null>(null);
  const [turnOrder, setTurnOrder] = useState<number[] | null>(null);
  const [bikeDetails, setBikeDetails] = useState<any>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [playerHand, setPlayerHand] = useState<any[] | null>(null);
  const [currentPlayerNumber, setCurrentPlayerNumber] = useState<number>(1);
  const [roundScores, setRoundScores] = useState<Record<number, number>>({});
  const [roundHistory, setRoundHistory] = useState<any[]>([]);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  
  // Game Log States
  const [gameLogs, setGameLogs] = useState<LogEntry[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawnBikeForAnimation, setDrawnBikeForAnimation] = useState<any>(null);
  const [showDrawAnimation, setShowDrawAnimation] = useState(false);
  const [cpuDeclarationAnim, setCpuDeclarationAnim] = useState<null | {
    phase: 'thinking' | 'announcing';
    playerId: number;
    spec?: string;
    direction?: string;
  }>(null);
  const [cpuBindAnim, setCpuBindAnim] = useState<null | {
    playerId: number;
    bindType: string;
    bindValue: string;
  }>(null);
  const [cpuActionNotify, setCpuActionNotify] = useState<null | {
    id: string;
    playerId: number;
    actionType: 'draw' | 'pass';
  }>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const newLog: LogEntry = {
      id: nanoid(),
      message,
      type,
      time: new Date()
    };
    setGameLogs(prev => [...prev, newLog]);
    if (!isLogOpen) setUnreadCount(prev => prev + 1);
    addToast(type === 'warning' ? 'error' : type, message);
  };

  const toggleLog = () => {
    const newOpenState = !isLogOpen;
    setIsLogOpen(newOpenState);
    if (newOpenState) setUnreadCount(0);
  };
  
  const getStateQuery = trpc.game.getState.useQuery(
    { gameId: gameId! },
    { enabled: !!gameId }
  );

  const rollDiceMutation = trpc.game.rollDice.useMutation();
  const declareSpecMutation = trpc.game.declareSpec.useMutation();
  const playCardMutation = trpc.game.playCard.useMutation();
  const passMutation = trpc.game.pass.useMutation();
  const drawCardMutation = trpc.game.drawCard.useMutation();
  const cpuPlayMutation = trpc.game.cpuPlay.useMutation();
  const terminateMutation = trpc.game.terminate.useMutation();
  const saveRanksMutation = trpc.game.saveRanks.useMutation();
  const utils = trpc.useUtils();
  const [cpuProcessing, setCpuProcessing] = useState(false);
  const cpuProcessingRef = useRef(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const fetchBikes = async (bikeIds: number[]) => {
    if (bikeIds.length === 0) return [];
    try {
      return await utils.game.getBikes.fetch({ bikeIds });
    } catch (error) {
      console.error('Error fetching bikes:', error);
      return [];
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("gameId") || "");
    if (!id) {
      setLocation("/game/setup");
      return;
    }
    setGameId(id);

    return () => clearToasts();
  }, [setLocation, clearToasts]);

  useEffect(() => {
    if (getStateQuery.data) {
      const isInitialLoad = !gameState;
      setGameState(getStateQuery.data);
      setLoading(false);
      
      const params = new URLSearchParams(window.location.search);
      const isNewGame = params.get("new") === "true";
      
      if (isInitialLoad && !isNewGame) {
        if (getStateQuery.data.game.status === 'finished') {
          // すでに終了しているゲームなら、結果画面を表示する
          setGamePhase('finished');
        } else if (getStateQuery.data.game.status === 'playing') {
          const hasHand = getStateQuery.data.players && getStateQuery.data.players[0]?.hand?.length > 0;
          const hasDeclared = !!getStateQuery.data.game.declaredSpec;
          
          if (hasHand) {
            const handIds = getStateQuery.data.players[0].hand || [];
            const allBikes = getStateQuery.data.bikes || [];
            const bikesData = handIds.map((id: number) => allBikes.find((b: any) => b.id === id)).filter(Boolean);
            
            if (bikesData.length !== handIds.length) {
              console.error(`[CRITICAL] Missing bikes in state payload! handIds: ${handIds.length}, bikesData: ${bikesData.length}`);
              console.log('handIds:', handIds);
              console.log('allBikes IDs:', allBikes.map((b: any) => b.id));
            }

            setPlayerHand(bikesData);
            if (hasDeclared) setGamePhase('playing');
            else setGamePhase('declaration');
          }
        }
      } else if (isInitialLoad && isNewGame) {
        // 新規ゲームの初期ロード完了後に、URLから new=true を安全に削除する
        const cleanParams = new URLSearchParams(window.location.search);
        if (cleanParams.get("new") === "true") {
          cleanParams.delete("new");
          const newSearch = cleanParams.toString();
          const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
          window.history.replaceState(null, "", newUrl);
        }
      }
    }
    if (getStateQuery.error) {
      console.warn('Game not found, redirecting to home');
      setLocation("/");
    }
  }, [getStateQuery.data, getStateQuery.error, setLocation]);

  // Keep playerHand in sync with gameState players and bikes
  useEffect(() => {
    if (gameState?.players?.[0] && gameState?.bikes) {
      const handIds = gameState.players[0].hand || [];
      const allBikes = gameState.bikes || [];
      const bikesData = handIds.map((id: number) => allBikes.find((b: any) => b.id === id)).filter(Boolean);
      setPlayerHand(bikesData);
    }
  }, [gameState?.players, gameState?.bikes]);

  useEffect(() => {
    if (gamePhase === 'playing' && gameState && gameState.game.status === 'playing' && !gameState.game.declaredSpec) {
      const declPlayer = gameState.game.declarationPlayer || 1;
      if (declPlayer !== 1) handleCPUDeclaration();
      else setGamePhase('declaration');
    }
  }, [gameState?.game.declaredSpec, gameState?.game.status, gamePhase]);

  useEffect(() => {
    if (gamePhase !== 'playing' || !gameId || !gameState || cpuProcessingRef.current) return;
    if (!gameState.game.declaredSpec) return; // スペック宣言が行われていない場合はCPUのターンを実行しない
    const currentTurn = gameState.game.currentTurn;
    if (!currentTurn || currentTurn === 1) return;

    let active = true;

    const executeCPUTurn = async () => {
      cpuProcessingRef.current = true;
      setCpuProcessing(true);
      try {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            if (active) resolve(null);
            else reject(new Error("Cancelled"));
          }, 1500);
        });
        
        if (!active) return;
        
        const result = await cpuPlayMutation.mutateAsync({ gameId });
        
        if (!active) return;

        if (result.drewCard) {
          const drawActionId = nanoid();
          setCpuActionNotify({
            id: drawActionId,
            playerId: result.cpuPlayerId,
            actionType: 'draw',
          });
          addLog(`Player ${result.cpuPlayerId} がカードを引きました`, 'info');
          
          await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              if (active) resolve(null);
              else reject(new Error("Cancelled"));
            }, 1200);
          });
          if (!active) return;
          setCpuActionNotify(prev => (prev?.id === drawActionId ? null : prev));
        }

        if (result.action === 'play') {
          const playedBikes = result.bikeIds
            ? result.bikeIds.map((id: number) => gameState.bikes?.find((b: any) => b.id === id)).filter(Boolean)
            : [];
          const bikeNames = playedBikes.map((b: any) => b.name).join(", ");
          
          // 先に最新状態を取得してカードを場に出す（着地アニメーション開始）
          await getStateQuery.refetch();
          addLog(`Player ${result.cpuPlayerId} が ${bikeNames || "カード"} を出しました`, 'info');
          
          // カードが場に着地するのを待つ（1秒）
          await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              if (active) resolve(null);
              else reject(new Error("Cancelled"));
            }, 1000);
          });
          if (!active) return;

          if (result.bindDeclare) {
            const bindLabels: Record<string, string> = { maker: 'メーカー', cylinders: '気筒数', transmission: 'トランスミッション' };
            const label = bindLabels[result.bindDeclare.type] || result.bindDeclare.type;
            
            // 縛りポップアップを表示
            setCpuBindAnim({ playerId: result.cpuPlayerId, bindType: label, bindValue: result.bindDeclare.value });
            await new Promise((resolve, reject) => {
              const timer = setTimeout(() => {
                if (active) resolve(null);
                else reject(new Error("Cancelled"));
              }, 2500);
            });
            if (!active) return;
            setCpuBindAnim(null);
            addLog(`Player ${result.cpuPlayerId} が ${label}縛り を発動しました！`, 'warning');
          }
        } else {
          // すでに引いていて出せなかった場合は、ここでさらにパス通知を表示する
          if (result.action === 'pass') {
            const passActionId = nanoid();
            setCpuActionNotify({
              id: passActionId,
              playerId: result.cpuPlayerId,
              actionType: 'pass',
            });
            addLog(`Player ${result.cpuPlayerId} がパスしました`, 'info');
            
            setTimeout(() => {
              setCpuActionNotify(prev => (prev?.id === passActionId ? null : prev));
            }, 1200);
          } else if (result.action === 'draw') {
            // もし drewCard を経由せず draw のみ返ってきた場合（通常は無いはずですが念のため）
            const actionId = nanoid();
            setCpuActionNotify({
              id: actionId,
              playerId: result.cpuPlayerId,
              actionType: 'draw',
            });
            addLog(`Player ${result.cpuPlayerId} がカードを引きました`, 'info');
            setTimeout(() => {
              setCpuActionNotify(prev => (prev?.id === actionId ? null : prev));
            }, 1200);
          }
          // play以外の時は通常通り最新状態を取得
          await getStateQuery.refetch();
        }

        if (result.trickCleared) addLog('場が流れました！', 'success');
        if (result.gameFinished) {
          try { await saveRanksMutation.mutateAsync({ gameId }); } catch (e) { console.error('[RANK] saveRanks failed:', e); }
          setGameResult({ 
            winnerId: result.winner, 
            winnerName: result.winner ? `Player ${result.winner}` : "膠着状態" 
          });
          setGamePhase('finished');
        }
      } catch (error: any) {
        if (error?.message !== "Cancelled") {
          console.error('CPU play error:', error);
        }
      } finally {
        if (active) {
          cpuProcessingRef.current = false;
          setCpuProcessing(false);
        }
      }
    };
    executeCPUTurn();

    return () => {
      active = false;
      cpuProcessingRef.current = false;
      setCpuProcessing(false);
    };
  }, [gamePhase, gameState?.game?.currentTurn, gameId]);

  const handleDiceRollComplete = async (rolls: Record<number, number>, order: number[], declarationPlayer: number) => {
    setDiceRolls(rolls);
    setTurnOrder(order);
    if (gameId) {
      try {
        await rollDiceMutation.mutateAsync({ gameId, declarationPlayer, turnOrder: order });
        await getStateQuery.refetch();
        setGamePhase('dealing');
      } catch (error) {
        addLog('サイコロ失敗', 'error');
      }
    }
  };

  const handleDealingComplete = async () => {
    if (gameState?.players?.[0]) {
      const handIds = gameState.players[0].hand || [];
      const bikesData = await fetchBikes(handIds);
      
      if (bikesData && bikesData.length !== handIds.length) {
        console.error(`[CRITICAL] fetchBikes returned fewer bikes than handIds! handIds: ${handIds.length}, returned: ${bikesData?.length}`);
        console.log('handIds:', handIds);
        console.log('bikesData IDs:', bikesData?.map((b: any) => b.id));
      }

      setPlayerHand(bikesData);
      setGamePhase('handReview');
    } else {
      setGamePhase('declaration');
    }
  };

  const handleHandReviewComplete = () => {
    setGamePhase('declaration');
  };

  // 宣言フェーズのモーダル・CPU思考開始のタイミングを遅延させるエフェクト
  useEffect(() => {
    if (gamePhase === 'declaration') {
      setShowDeclarationModal(false);
      const declPlayer = gameState?.game?.declarationPlayer || 1;
      
      const timer = setTimeout(() => {
        if (declPlayer === 1) {
          setShowDeclarationModal(true);
        } else {
          handleCPUDeclaration();
        }
      }, 1200); // 1.2秒のディレイ（カードの着地演出完了後）
      
      return () => clearTimeout(timer);
    } else {
      setShowDeclarationModal(false);
    }
  }, [gamePhase, gameState?.game?.declarationPlayer]);

  const handleCPUDeclaration = async () => {
    if (cpuDeclarationAnim) return; // 二重実行防止
    if (getStateQuery.data?.game?.status === 'finished' || gameState?.game?.status === 'finished') return;

    const specs = ['horsepower', 'fuelEfficiency', 'seatHeight', 'totalLength', 'weight', 'price', 'year'] as const;
    const directions = ['up', 'down'] as const;
    const latestGame = getStateQuery.data?.game;
    const prevSpec = latestGame?.prevDeclaredSpec;
    const prevDir = latestGame?.prevDeclaredDirection;
    const cpuPlayerId = gameState?.game?.declarationPlayer || 2;

    const validCombinations = [];
    for (const spec of specs) {
      for (const dir of directions) {
        if (spec === prevSpec && dir === prevDir) continue;
        validCombinations.push({ spec, direction: dir });
      }
    }
    const chosen = validCombinations[Math.floor(Math.random() * validCombinations.length)];
    const dirLabel = chosen.direction === 'up' ? '大きい' : '小さい';

    // 「考え中」フェーズ
    setCpuDeclarationAnim({ phase: 'thinking', playerId: cpuPlayerId });
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (gameState?.game?.status === 'finished' || getStateQuery.data?.game?.status === 'finished') {
      setCpuDeclarationAnim(null);
      return;
    }

    // 「宣言！」フェーズ
    setCpuDeclarationAnim({ phase: 'announcing', playerId: cpuPlayerId, spec: chosen.spec, direction: chosen.direction });
    await new Promise(resolve => setTimeout(resolve, 2200));
    setCpuDeclarationAnim(null);
    if (gameState?.game?.status === 'finished' || getStateQuery.data?.game?.status === 'finished') return;

    addLog(`Player ${cpuPlayerId} 宣言：${specLabels[chosen.spec]}が${dirLabel}`, 'info');
    await handleDeclaration(chosen.spec, chosen.direction);
  };

  const handleDeclaration = async (spec: string, direction: string) => {
    if (gameId) {
      try {
        await declareSpecMutation.mutateAsync({ gameId, spec: spec as any, direction: direction as any });
        const res = await getStateQuery.refetch();
        if (res.data) setGameState(res.data);
        setGamePhase('playing');
      } catch (error) {
        addLog('宣言失敗', 'error');
      }
    }
  };

  // Main Render Logic
  return (
    <div className="h-full w-full bg-[#020617] text-slate-200 relative overflow-hidden flex flex-col font-sans">
      {/* Background Cyberpunk Effect */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(34,211,238,0.05)_0%,_transparent_70%)] pointer-events-none" />

      {loading || !gameState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-cyan-400 font-black tracking-widest animate-pulse">LOADING SYSTEM...</p>
        </div>
      ) : gamePhase === 'finished' ? (
        <GameResultScreen
          rankings={(() => {
            const sorted = gameState.players.map((p: any) => ({
              playerId: p.playerId,
              name: p.playerId === 1 ? "You" : `Player ${p.playerId}`,
              remainingCards: p.hand.length,
            })).sort((a: any, b: any) => a.remainingCards - b.remainingCards);

            let currentRank = 1;
            return sorted.map((player: any, index: number) => {
              if (index > 0 && player.remainingCards > sorted[index - 1].remainingCards) {
                currentRank = index + 1;
              }
              return { ...player, rank: currentRank };
            });
          })()}
          playerCount={gameState.game.playerCount}
          onReplay={() => { clearToasts(); setLocation("/game/setup"); }}
          onHome={() => { clearToasts(); setLocation("/"); }}
        />
      ) : (
        <>
          {/* Top Bar */}
          <div className="z-30 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-cyan-500/40 flex items-center justify-center bg-slate-800 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-cyan-400">
                  <circle cx="18" cy="15" r="4" stroke="currentColor" strokeWidth="2" />
                  <circle cx="6" cy="15" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M3,15 Q3,9 12,9 Q21,9 21,15 L21,16 L3,16 Z" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none">Touring Mania</h1>
                <div className="h-3 w-px bg-slate-800 mx-1" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Round <span className="text-cyan-400">{gameState.game.currentRound}</span>
                  <span className="text-slate-700 ml-1">/ {totalRounds}</span>
                </p>
              </div>
            </div>
            
            <button onClick={() => setShowExitConfirm(true)} className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-all">
              <Home className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Phase Switching Logic */}
            {gamePhase === 'dice' ? (
              <div className="flex-1 flex items-center justify-center">
                <DiceRollDialog playerCount={gameState.game.playerCount} onRollComplete={handleDiceRollComplete} isOpen={true} />
              </div>
            ) : gamePhase === 'dealing' ? (
              <div className="flex-1 flex items-center justify-center">
                <CardDealingPhase playerCount={gameState.game.playerCount} onDealingComplete={handleDealingComplete} isOpen={true} />
              </div>
            ) : gamePhase === 'handReview' && playerHand ? (
              <HandReview hand={playerHand} playerNumber={currentPlayerNumber} onConfirm={handleHandReviewComplete} />
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Refined Stats & Info Area (Horizontal Layout) */}
                <div className="px-4 py-3 flex gap-3 min-h-[170px]">
                  {/* Left: Declaration & Turn */}
                  <div className="flex-[1.2] bg-slate-900/40 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-center shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2">
                      {gameState.game.currentTurn === 1 ? 'あなたのターン' : `Player ${gameState.game.currentTurn} のターン`}
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                        {gameState.game.declaredSpec ? specLabels[gameState.game.declaredSpec] : 'スペック'}
                      </span>
                      <span className="text-slate-500 text-xl font-bold">-</span>
                      <span className={`text-3xl font-black italic ${gameState.game.declaredDirection === 'up' ? 'text-pink-500' : 'text-cyan-400'}`}>
                        {gameState.game.declaredDirection === 'up' ? '高い順' : '低い順'}
                      </span>
                    </div>

                    {/* 山札残り枚数の表示 */}
                    <div className="mt-3 pt-3 border-t border-cyan-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* 重なったカードビジュアル */}
                        <div className="relative w-10 h-10 flex items-center justify-center mr-2">
                          {[0, 1, 2].map((idx) => (
                            <div
                              key={idx}
                              className="absolute w-6 h-8 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded shadow-md"
                              style={{
                                left: `${idx * 4}px`,
                                top: `${idx * 2}px`,
                                zIndex: 3 - idx,
                                opacity: 1 - idx * 0.15,
                              }}
                            />
                          ))}
                          <div 
                            className="absolute w-6 h-8 flex items-center justify-center z-10 text-[10px] font-black text-cyan-300"
                            style={{ left: "8px", top: "4px" }}
                          >
                            {(gameState.deckCounts?.large || 0) + (gameState.deckCounts?.medium || 0) + (gameState.deckCounts?.small || 0)}
                          </div>
                        </div>
                        
                        {/* カテゴリ別の残り枚数 */}
                        <div className="flex gap-1.5 text-[10px] font-bold">
                          <span className="flex items-center bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                            大: {gameState.deckCounts?.large || 0}
                          </span>
                          <span className="flex items-center bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                            中: {gameState.deckCounts?.medium || 0}
                          </span>
                          <span className="flex items-center bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded border border-pink-500/20">
                            小: {gameState.deckCounts?.small || 0}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">山札の残り</span>
                    </div>

                    {gameState.game.currentBind && (
                      <div className="mt-3 inline-flex items-center gap-1.5 bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full border border-pink-500/30 w-fit">
                        <span className="text-[9px] font-black uppercase tracking-wider">BIND</span>
                        <span className="text-xs font-bold">{specLabels[gameState.game.currentBind]}: {gameState.game.bindValue}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Opponent Intel (Screenshot Replication) */}
                  <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-inner">
                    <p className="text-xs text-slate-400 font-bold text-center mb-3 tracking-widest">対戦相手の手札</p>
                    <div className="flex-1 flex gap-3">
                      {gameState.players.slice(1).map((player: any) => {
                        const cpuBikes = player.hand.map((id: number) => gameState.bikes?.find((b: any) => b.id === id)).filter(Boolean);
                        const counts = {
                          large: cpuBikes.filter((b: any) => b.category === 'large').length,
                          medium: cpuBikes.filter((b: any) => b.category === 'medium').length,
                          small: cpuBikes.filter((b: any) => b.category === 'small').length
                        };
                        return (
                          <div key={player.playerId} className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-between shadow-lg">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">PLAYER {player.playerId}</p>
                            
                            <div className="flex items-baseline gap-1 my-1">
                              <span className="text-3xl font-black text-white">{player.hand.length}</span>
                              <span className="text-[10px] text-slate-500 font-bold">枚</span>
                            </div>

                            <div className="w-full flex gap-1 mt-auto">
                              {/* Large (Amber/Grey) */}
                              <div className={`flex-1 h-5 rounded-full border border-white/5 flex items-center justify-center transition-all ${counts.large > 0 ? 'bg-slate-800/80' : 'bg-slate-900/40'}`}>
                                <span className={`text-[10px] font-black ${counts.large > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{counts.large}</span>
                              </div>
                              {/* Medium (Cyan/Grey) */}
                              <div className={`flex-1 h-5 rounded-full border border-white/5 flex items-center justify-center transition-all ${counts.medium > 0 ? 'bg-slate-800/80' : 'bg-slate-900/40'}`}>
                                <span className={`text-[10px] font-black ${counts.medium > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{counts.medium}</span>
                              </div>
                              {/* Small (Pink/Grey) */}
                              <div className={`flex-1 h-5 rounded-full border border-white/5 flex items-center justify-center transition-all ${counts.small > 0 ? 'bg-slate-800/80' : 'bg-slate-900/40'}`}>
                                <span className={`text-[10px] font-black ${counts.small > 0 ? 'text-pink-500' : 'text-slate-600'}`}>{counts.small}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Main Game Board */}
                <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4 no-scrollbar">
                  <CardPlayPhase
                    currentPlayer={gameState.game.currentTurn || 1}
                    currentPlayerName={gameState.game.currentTurn === 1 ? "You" : `Player ${gameState.game.currentTurn}`}
                    playerHand={gameState.players.find((p: any) => p.playerId === 1)?.hand.map((id: number) => gameState.bikes?.find((b: any) => b.id === id)).filter(Boolean) || []}
                    declaredSpec={gameState.game.declaredSpec || ""}
                    declaredDirection={gameState.game.declaredDirection || "up"}
                    currentBind={gameState.game.currentBind}
                    bindValue={gameState.game.bindValue}
                    isYourTurn={gameState.game.currentTurn === 1 && gamePhase === 'playing'}
                    fieldCards={gameState.fieldCards || []}
                    isDeckEmpty={((gameState.deckCounts?.large || 0) + (gameState.deckCounts?.medium || 0) + (gameState.deckCounts?.small || 0)) === 0}
                    onCardPlay={async (ids, bind) => {
                      const playedBikes = ids.map((id: number) => playerHand?.find((b: any) => b.id === id) || gameState.bikes?.find((b: any) => b.id === id)).filter(Boolean);
                      const bikeNames = playedBikes.map((b: any) => b.name).join(", ");
                      const res = await playCardMutation.mutateAsync({ gameId: gameId!, playerId: 1, bikeIds: ids, bindDeclare: bind });
                      if (res.gameFinished) {
                        try { await saveRanksMutation.mutateAsync({ gameId: gameId! }); } catch (e) { console.error('[RANK] saveRanks failed:', e); }
                        setGameResult({ 
                          winnerId: res.winner, 
                          winnerName: res.winner === 1 ? 'You' : res.winner ? `Player ${res.winner}` : '膠着状態' 
                        });
                        setGamePhase('finished');
                      }
                      await getStateQuery.refetch();
                      addLog(`${bikeNames || "カード"} を出しました`, 'success');
                    }}
                    onPass={async () => {
                      const res = await passMutation.mutateAsync({ gameId: gameId!, playerId: 1 });
                      if (res.gameFinished) {
                        try { await saveRanksMutation.mutateAsync({ gameId: gameId! }); } catch (e) { console.error('[RANK] saveRanks failed:', e); }
                        setGameResult({ winnerId: null, winnerName: "膠着状態" });
                        setGamePhase('finished');
                      }
                      await getStateQuery.refetch();
                      addLog('パスしました', 'info');
                      if (res.trickCleared) addLog('場が流れました！', 'success');
                    }}
                    onDraw={async () => {
                      console.log('[onDraw] Starting draw mutation...');
                      const res = await drawCardMutation.mutateAsync({ gameId: gameId!, playerId: 1 });
                      console.log('[onDraw] Result:', res);
                      if (res.gameFinished) {
                        try { await saveRanksMutation.mutateAsync({ gameId: gameId! }); } catch (e) { console.error('[RANK] saveRanks failed:', e); }
                        setGameResult({ winnerId: null, winnerName: "膠着状態" });
                        setGamePhase('finished');
                      }
                      if (res.drawnBike) {
                        setDrawnBikeForAnimation(res.drawnBike);
                        setShowDrawAnimation(true);
                      }
                      await getStateQuery.refetch();
                      addLog('カードを引きました', 'success');
                    }}
                    onLog={addLog}
                    isLoading={cpuProcessing || playCardMutation.isPending || drawCardMutation.isPending}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Declaration Overlay */}
      {gamePhase === 'declaration' && showDeclarationModal && (
        <DeclarationPhase
          playerName={gameState.game.declarationPlayer === 1 ? "You" : `Player ${gameState.game.declarationPlayer}`}
          hand={playerHand || []}
          fieldCards={gameState.fieldCards || []}
          prevDeclaredSpec={gameState.game.prevDeclaredSpec}
          prevDeclaredDirection={gameState.game.prevDeclaredDirection}
          onDeclare={handleDeclaration}
          isLoading={declareSpecMutation.isPending}
        />
      )}

      {/* Draw Animation Overlay */}
      <AnimatePresence>
        {showDrawAnimation && drawnBikeForAnimation && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotateY: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative w-52 h-[490px] perspective-1000"
            >
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 180 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Back */}
                <div className="absolute inset-0 backface-hidden rounded-2xl border-4 border-cyan-500/50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 to-slate-950" />
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full border-4 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                      <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14 text-cyan-400 animate-pulse">
                        <circle cx="18" cy="15" r="4" stroke="currentColor" strokeWidth="2" />
                        <circle cx="6" cy="15" r="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M3,15 Q3,9 12,9 Q21,9 21,15 L21,16 L3,16 Z" fill="currentColor" opacity="0.3" />
                      </svg>
                    </div>
                    <p className="text-cyan-400 font-black tracking-[0.3em] text-xl italic uppercase">TOURING MANIA</p>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 blur-sm animate-scan" />
                </div>
                {/* Front */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.4)]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <BikeCard bike={drawnBikeForAnimation} size="large" showDetails={true} />
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }} className="mt-12 flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-cyan-400 text-sm font-black tracking-widest uppercase mb-1">New Data Sync Complete</p>
                <h3 className="text-white text-3xl font-black italic">{drawnBikeForAnimation.name}</h3>
              </div>
              <Button
                onClick={() => { setShowDrawAnimation(false); setTimeout(() => setDrawnBikeForAnimation(null), 500); }}
                className="bg-white text-slate-950 font-black px-12 py-7 rounded-xl text-lg hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                手札に加える
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Log Overlay/Dialog */}
      {['declaration', 'playing', 'finished'].includes(gamePhase) && (
        <GameLog logs={gameLogs} isOpen={isLogOpen} unreadCount={unreadCount} onClose={() => setIsLogOpen(false)} onToggle={toggleLog} />
      )}

      {/* CPU Declaration Animation Overlay */}
      <AnimatePresence>
        {cpuDeclarationAnim && (
          <motion.div
            key={cpuDeclarationAnim.phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[90] flex items-center justify-center"
            style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(3px)' }}
          >
            {cpuDeclarationAnim.phase === 'thinking' ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-5"
              >
                {/* CPU アイコン */}
                <div className="relative w-20 h-20 rounded-full border-2 border-cyan-500/60 flex items-center justify-center"
                  style={{ boxShadow: '0 0 30px rgba(34,211,238,0.3)' }}>
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" />
                  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-cyan-400">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                    <path d="M8 14s1 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 2v2M16 2v2M8 20v2M16 20v2M2 8h2M2 16h2M20 8h2M20 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs text-cyan-400/70 font-bold tracking-widest uppercase mb-1">PLAYER {cpuDeclarationAnim.playerId}</p>
                  <p className="text-white font-black text-xl tracking-wide">思考中
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >...</motion.span>
                  </p>
                </div>
                {/* スキャンライン */}
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-6 rounded-full bg-cyan-500/60"
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="flex flex-col items-center gap-4 px-8 py-8 rounded-3xl border border-cyan-500/40"
                style={{
                  background: 'linear-gradient(160deg, rgba(15,23,42,0.97) 0%, rgba(8,30,63,0.97) 100%)',
                  boxShadow: '0 0 60px rgba(34,211,238,0.25), 0 0 120px rgba(34,211,238,0.1)'
                }}
              >
                <p className="text-[10px] font-black text-cyan-400 tracking-[0.4em] uppercase">PLAYER {cpuDeclarationAnim.playerId} DECLARES</p>
                <div className="text-center">
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-4xl sm:text-5xl font-black text-white leading-tight"
                    style={{ textShadow: '0 0 40px rgba(34,211,238,0.6)' }}
                  >
                    {specLabels[cpuDeclarationAnim.spec!]}
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-2xl font-black mt-1 ${
                      cpuDeclarationAnim.direction === 'up' ? 'text-cyan-400' : 'text-pink-400'
                    }`}
                  >
                    {cpuDeclarationAnim.direction === 'up' ? '↑ 大きい順' : '↓ 小さい順'}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.4, duration: 1.5 }}
                  className="h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.8), transparent)' }}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CPU Bind Declaration Animation Overlay */}
      <AnimatePresence>
        {cpuBindAnim && (
          <motion.div
            key="cpu-bind"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[85] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="flex flex-col items-center gap-3 px-10 py-7 rounded-2xl"
              style={{
                background: 'linear-gradient(160deg, rgba(120,20,60,0.92) 0%, rgba(60,10,40,0.95) 100%)',
                border: '1px solid rgba(236,72,153,0.5)',
                boxShadow: '0 0 80px rgba(236,72,153,0.3), 0 0 160px rgba(236,72,153,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* 上部ライン */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-px rounded-full"
                style={{ background: 'linear-gradient(to right, transparent, rgba(236,72,153,0.8), transparent)' }}
              />
              <p
                className="text-[10px] font-black tracking-[0.5em] uppercase"
                style={{ color: 'rgba(251,146,180,0.8)' }}
              >
                PLAYER {cpuBindAnim.playerId} — BIND
              </p>
              <div className="text-center">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl sm:text-4xl font-black text-white"
                  style={{
                    textShadow: '0 0 30px rgba(236,72,153,0.7), 0 2px 4px rgba(0,0,0,0.5)',
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '0.05em',
                  }}
                >
                  {cpuBindAnim.bindType}縛り
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg font-bold mt-1"
                  style={{
                    color: 'rgba(251,191,210,0.9)',
                    textShadow: '0 0 12px rgba(236,72,153,0.5)',
                  }}
                >
                  「{cpuBindAnim.bindValue}」
                </motion.p>
              </div>
              {/* 下部ライン */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="h-px rounded-full"
                style={{ background: 'linear-gradient(to right, transparent, rgba(236,72,153,0.8), transparent)' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CPU Quick Action Notification Overlay (Non-blocking) */}
      <AnimatePresence>
        {cpuActionNotify && (
          <motion.div
            key={cpuActionNotify.id}
            initial={{ opacity: 0, y: -30, scale: 0.9, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] pointer-events-none flex flex-col items-center perspective-1000"
          >
            <div
              className="flex items-center gap-4 px-6 py-3 rounded-xl border backdrop-blur-md relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(8,15,30,0.92) 0%, rgba(2,6,15,0.95) 100%)',
                borderColor: cpuActionNotify.actionType === 'pass' ? 'rgba(236,72,153,0.5)' : 'rgba(34,211,238,0.5)',
                boxShadow: cpuActionNotify.actionType === 'pass' 
                  ? '0 0 30px rgba(236,72,153,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 0 30px rgba(34,211,238,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                transform: 'skewX(-6deg)'
              }}
            >
              {/* 装飾用サイバーグリフ */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400/20" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

              {/* アイコン */}
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: cpuActionNotify.actionType === 'pass' ? 'rgba(236,72,153,0.15)' : 'rgba(34,211,238,0.15)',
                  border: cpuActionNotify.actionType === 'pass' ? '1px solid rgba(236,72,153,0.3)' : '1px solid rgba(34,211,238,0.3)',
                  transform: 'skewX(6deg)'
                }}
              >
                {cpuActionNotify.actionType === 'pass' ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-pink-500" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-cyan-400" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                )}
              </div>

              {/* テキスト */}
              <div className="flex flex-col select-none" style={{ transform: 'skewX(6deg)' }}>
                <span className="text-[9px] uppercase tracking-[0.25em] font-black text-slate-500">
                  Player {cpuActionNotify.playerId}
                </span>
                <span 
                  className="text-lg font-black italic tracking-wider leading-none"
                  style={{
                    color: cpuActionNotify.actionType === 'pass' ? '#ec4899' : '#22d3ee',
                    textShadow: cpuActionNotify.actionType === 'pass' 
                      ? '0 0 10px rgba(236,72,153,0.5)'
                      : '0 0 10px rgba(34,211,238,0.5)',
                    fontFamily: "'Outfit', 'Inter', sans-serif"
                  }}
                >
                  {cpuActionNotify.actionType === 'pass' ? 'PASS / SKIP' : 'DRAW CARD'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bike Details Modal */}
      {bikeDetails && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm">
            <button onClick={() => setBikeDetails(null)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-slate-800 border border-slate-600 text-white flex items-center justify-center z-10 shadow-lg">✕</button>
            <div className="transform scale-105">
              <BikeCard bike={bikeDetails} size="large" showDetails={true} />
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirm Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in scale-in duration-200">
            <h2 className="text-xl font-bold text-white mb-4 text-center">ゲームを終了しますか？</h2>
            <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
              ゲームを終了すると、現在プレイ中のデータは失われます。よろしいですか？
            </p>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  setShowExitConfirm(false);
                  if (gameId) {
                    try {
                      await terminateMutation.mutateAsync({ gameId });
                    } catch (error) {
                      console.error("Failed to terminate game:", error);
                    }
                  }
                  clearToasts();
                  setLocation("/");
                }}
                disabled={terminateMutation.isPending}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg"
              >
                {terminateMutation.isPending ? "終了中..." : "終了する"}
              </Button>
              <Button
                onClick={() => setShowExitConfirm(false)}
                variant="outline"
                className="flex-1 h-12 text-base font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
              >
                続ける
              </Button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .preserve-3d { transform-style: preserve-3d; }
        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-scan { animation: scan 2.5s linear infinite; }
        .vertical-text { writing-mode: vertical-lr; text-orientation: mixed; }
      `}} />
    </div>
  );
}
