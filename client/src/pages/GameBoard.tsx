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
  const utils = trpc.useUtils();
  const [cpuProcessing, setCpuProcessing] = useState(false);
  
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
      
      if (isInitialLoad && !isNewGame && getStateQuery.data.game.status === 'playing') {
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
    if (gamePhase === 'playing' && gameState && !gameState.game.declaredSpec) {
      const declPlayer = gameState.game.declarationPlayer || 1;
      if (declPlayer !== 1) handleCPUDeclaration();
      else setGamePhase('declaration');
    }
  }, [gameState?.game.declaredSpec, gamePhase]);

  useEffect(() => {
    if (gamePhase !== 'playing' || !gameId || !gameState || cpuProcessing) return;
    const currentTurn = gameState.game.currentTurn;
    if (!currentTurn || currentTurn === 1) return;

    const executeCPUTurn = async () => {
      setCpuProcessing(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const result = await cpuPlayMutation.mutateAsync({ gameId });
        if (result.action === 'play') {
          const playedBikes = result.bikeIds
            ? result.bikeIds.map((id: number) => gameState.bikes?.find((b: any) => b.id === id)).filter(Boolean)
            : [];
          const bikeNames = playedBikes.map((b: any) => b.name).join(", ");
          addLog(`Player ${result.cpuPlayerId} が ${bikeNames || "カード"} を出しました`, 'info');
          
          if (result.bindDeclare) {
            const bindLabels: Record<string, string> = { maker: 'メーカー', cylinders: '気筒数', transmission: 'トランスミッション' };
            const label = bindLabels[result.bindDeclare.type] || result.bindDeclare.type;
            addLog(`Player ${result.cpuPlayerId} が ${label}縛り を発動しました！`, 'warning');
          }
        } else if (result.action === 'draw') {
          addLog(`Player ${result.cpuPlayerId} がカードを引きました`, 'info');
        } else if (result.action === 'pass') {
          addLog(`Player ${result.cpuPlayerId} がパスしました`, 'info');
        }
        if (result.trickCleared) addLog('場が流れました！', 'success');
        if (result.gameFinished) {
          setGameResult({ winnerId: result.winner, winnerName: `Player ${result.winner}` });
          setGamePhase('finished');
        }
        await getStateQuery.refetch();
      } catch (error) {
        console.error('CPU play error:', error);
      } finally {
        setCpuProcessing(false);
      }
    };
    executeCPUTurn();
  }, [gamePhase, gameState?.game?.currentTurn, gameId, cpuProcessing]);

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
    const declPlayer = gameState?.game?.declarationPlayer || 1;
    if (declPlayer !== 1) handleCPUDeclaration();
    else setGamePhase('declaration');
  };

  const handleCPUDeclaration = async () => {
    const specs = ['horsepower', 'fuelEfficiency', 'seatHeight', 'totalLength', 'weight', 'price', 'year'] as const;
    const directions = ['up', 'down'] as const;
    const latestGame = getStateQuery.data?.game;
    const prevSpec = latestGame?.prevDeclaredSpec;
    const prevDir = latestGame?.prevDeclaredDirection;
    
    const validCombinations = [];
    for (const spec of specs) {
      for (const dir of directions) {
        if (spec === prevSpec && dir === prevDir) continue;
        validCombinations.push({ spec, direction: dir });
      }
    }
    const chosen = validCombinations[Math.floor(Math.random() * validCombinations.length)];
    const dirLabel = chosen.direction === 'up' ? '大きい' : '小さい';
    addLog(`Player ${gameState?.game?.declarationPlayer || 2} 宣言：${specLabels[chosen.spec]}が${dirLabel}`, 'info');
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 relative overflow-hidden flex flex-col font-sans">
      {/* Background Cyberpunk Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(34,211,238,0.05)_0%,_transparent_70%)] pointer-events-none" />

      {loading || !gameState ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-cyan-400 font-black tracking-widest animate-pulse">LOADING SYSTEM...</p>
        </div>
      ) : gamePhase === 'finished' ? (
        <GameResultScreen
          rankings={gameState.players.map((p: any) => ({
            playerId: p.playerId,
            name: p.playerId === 1 ? "You" : `Player ${p.playerId}`,
            remainingCards: p.hand.length,
          })).sort((a: any, b: any) => a.remainingCards - b.remainingCards).map((r: any, i: number) => ({ ...r, rank: i + 1 }))}
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
            
            <button onClick={() => { clearToasts(); setLocation("/"); }} className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-all">
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
                    {gameState.game.currentBind && (
                      <div className="mt-4 inline-flex items-center gap-1.5 bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full border border-pink-500/30 w-fit">
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
                    onCardPlay={async (ids, bind) => {
                      const playedBikes = ids.map((id: number) => playerHand?.find((b: any) => b.id === id) || gameState.bikes?.find((b: any) => b.id === id)).filter(Boolean);
                      const bikeNames = playedBikes.map((b: any) => b.name).join(", ");
                      const res = await playCardMutation.mutateAsync({ gameId: gameId!, playerId: 1, bikeIds: ids, bindDeclare: bind });
                      if (res.gameFinished) {
                        setGameResult({ winnerId: res.winner, winnerName: res.winner === 1 ? 'You' : `Player ${res.winner}` });
                        setGamePhase('finished');
                      }
                      await getStateQuery.refetch();
                      addLog(`${bikeNames || "カード"} を出しました`, 'success');
                    }}
                    onPass={async () => {
                      const res = await passMutation.mutateAsync({ gameId: gameId!, playerId: 1 });
                      await getStateQuery.refetch();
                      addLog('パスしました', 'info');
                      if (res.trickCleared) addLog('場が流れました！', 'success');
                    }}
                    onDraw={async () => {
                      console.log('[onDraw] Starting draw mutation...');
                      const res = await drawCardMutation.mutateAsync({ gameId: gameId!, playerId: 1 });
                      console.log('[onDraw] Result:', res);
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
      {gamePhase === 'declaration' && (
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
              className="relative w-full max-w-[320px] aspect-[2/3] perspective-1000"
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
