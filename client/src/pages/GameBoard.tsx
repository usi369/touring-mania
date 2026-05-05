import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
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

interface GameBoardProps {
  playerCount?: number;
}

/**
 * Game Board - Main Game Screen
 * Vertical mobile layout for card game
 */
type GamePhase = 'dice' | 'dealing' | 'handReview' | 'declaration' | 'playing' | 'finished';

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
  
  const getStateQuery = trpc.game.getState.useQuery(
    { gameId: gameId! },
    { enabled: !!gameId }
  );
  const gameSetupMutation = trpc.game.create.useMutation();
  const rollDiceMutation = trpc.game.rollDice.useMutation();
  const declareSpecMutation = trpc.game.declareSpec.useMutation();
  const playCardMutation = trpc.game.playCard.useMutation();
  const passMutation = trpc.game.pass.useMutation();
  const drawCardMutation = trpc.game.drawCard.useMutation();
  const nextRoundMutation = trpc.game.nextRound.useMutation();
  const cpuPlayMutation = trpc.game.cpuPlay.useMutation();
  const utils = trpc.useUtils();
  const [cpuProcessing, setCpuProcessing] = useState(false);
  
  // Helper function to fetch bikes
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
    // Get game ID from URL params
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("gameId") || "");
    const isNewGame = params.get("new") === "true";
    
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
      
      // Resume game state if page was reloaded (and not a brand new game)
      const params = new URLSearchParams(window.location.search);
      const isNewGame = params.get("new") === "true";
      
      if (isInitialLoad && !isNewGame && getStateQuery.data.game.status === 'playing') {
        const hasHand = getStateQuery.data.players && getStateQuery.data.players[0]?.hand?.length > 0;
        const hasDeclared = !!getStateQuery.data.game.declaredSpec;
        
        if (hasHand) {
          // Restore hand data
          const handIds = getStateQuery.data.players[0].hand || [];
          const allBikes = getStateQuery.data.bikes || [];
          const bikesData = handIds.map((id: number) => allBikes.find((b: any) => b.id === id)).filter(Boolean);
          setPlayerHand(bikesData);
          
          if (hasDeclared) {
            setGamePhase('playing');
          } else {
            setGamePhase('declaration');
          }
        }
      }
    }
    if (getStateQuery.error) {
      // Game not found or DB was reset - go back to home
      console.warn('Game not found, redirecting to home');
      setLocation("/");
    }
  }, [getStateQuery.data, getStateQuery.error, setLocation]);

  // Check for trick cleared (declaredSpec becomes null during playing phase)
  useEffect(() => {
    if (gamePhase === 'playing' && gameState && !gameState.game.declaredSpec) {
      const declPlayer = gameState.game.declarationPlayer || 1;
      if (declPlayer !== 1) {
        // Automatically let CPU declare
        handleCPUDeclaration();
      } else {
        setGamePhase('declaration');
      }
    }
  }, [gameState?.game.declaredSpec, gamePhase]);

  // Auto CPU play when it's CPU's turn during playing phase
  useEffect(() => {
    if (gamePhase !== 'playing' || !gameId || !gameState || cpuProcessing) return;
    
    const currentTurn = gameState.game.currentTurn;
    if (!currentTurn || currentTurn === 1) return; // Player 1 = human

    const executeCPUTurn = async () => {
      setCpuProcessing(true);
      try {
        // Small delay to make CPU "think"
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await cpuPlayMutation.mutateAsync({ gameId });
        
        if (result.action === 'play') {
          const bikeName = result.bikeId ? `(ID:${result.bikeId})` : '';
          addToast('info', `Player ${result.cpuPlayerId} がカードを出しました ${bikeName}`);
        } else if (result.action === 'pass') {
          addToast('info', `Player ${result.cpuPlayerId} がパスしました`);
        }
        
        if ('trickCleared' in result && result.trickCleared) {
          addToast('success', '他のプレイヤーが全員パスしました。場が流れます！好きなカードを出してください。');
        }

        if ('gameFinished' in result && result.gameFinished && 'winner' in result) {
          setGameResult({
            winnerId: result.winner as number,
            winnerName: `Player ${result.winner}`,
          });
          setGamePhase('finished');
        }
        
        // Refresh game state
        await getStateQuery.refetch();
      } catch (error) {
        console.error('CPU play error:', error);
        addToast('error', 'CPUのプレイに失敗しました');
      } finally {
        setCpuProcessing(false);
      }
    };

    executeCPUTurn();
  }, [gamePhase, gameState?.game?.currentTurn, gameId, cpuProcessing]);

  const handleDiceRollComplete = async (
    rolls: Record<number, number>,
    order: number[],
    declarationPlayer: number
  ) => {
    setDiceRolls(rolls);
    setTurnOrder(order);
    
    if (gameId) {
      try {
        await rollDiceMutation.mutateAsync({
          gameId,
          declarationPlayer,
          turnOrder: order,
        });
        // Refresh game state to pick up the updated declarationPlayer
        await getStateQuery.refetch();
        setGamePhase('dealing');
      } catch (error) {
        console.error('Error rolling dice:', error);
        addToast('error', 'サイコロを振るのに失敗しました', 'もう一度お試しください');
      }
    }
  };

  const handleDealingComplete = async () => {
    // Show hand review for player 1 (human player)
    if (gameState && gameState.players && gameState.players[0]) {
      const handIds = gameState.players[0].hand || [];
      console.log('handleDealingComplete: handIds =', handIds);
      
      // Fetch bike details for the hand
      const bikesData = await fetchBikes(handIds);
      console.log('handleDealingComplete: bikesData =', bikesData);
      setPlayerHand(bikesData);
      
      setCurrentPlayerNumber(1);
      setGamePhase('handReview');
    } else {
      console.log('handleDealingComplete: gameState or players not available');
      setGamePhase('declaration');
    }
  };

  const handleHandReviewComplete = () => {
    // Check if CPU has declaration rights
    const declPlayer = gameState?.game?.declarationPlayer || 1;
    if (declPlayer !== 1) {
      // CPU auto-declares
      handleCPUDeclaration();
    } else {
      setGamePhase('declaration');
    }
  };

  const handleCPUDeclaration = async () => {
    // CPU picks a random spec and direction
    const specs = ['horsepower', 'fuelEfficiency', 'seatHeight', 'totalLength', 'weight', 'price', 'year'] as const;
    const directions = ['up', 'down'] as const;
    const randomSpec = specs[Math.floor(Math.random() * specs.length)];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];

    const specLabels: Record<string, string> = {
      horsepower: '馬力',
      fuelEfficiency: '燃費',
      seatHeight: 'シート高',
      totalLength: '全長',
      weight: '重量',
      price: '価格',
      year: '発売年月日',
    };
    const dirLabel = randomDirection === 'up' ? '大きい' : '小さい';
    const declPlayer = gameState?.game?.declarationPlayer || 2;
    
    addToast('info', `Player ${declPlayer} が宣言：${specLabels[randomSpec]}が${dirLabel}ほうが勝ち`);
    
    await handleDeclaration(randomSpec, randomDirection);
  };

  const handleDeclaration = async (spec: string, direction: string) => {
    if (gameId) {
      try {
        await declareSpecMutation.mutateAsync({
          gameId,
          spec: spec as any,
          direction: direction as any,
        });
        // Refresh game state to get bike data before entering play phase
        await getStateQuery.refetch();
        setGamePhase('playing');
      } catch (error) {
        console.error('Error declaring spec:', error);
        addToast('error', 'スペック宣言に失敗しました', 'もう一度お試しください');
      }
    }
  };

  if (loading || !gameState) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-white">ゲームを初期化中...</p>
        </div>
      </div>
    );
  }

  // Show game result screen
  if (gamePhase === 'finished' && gameState) {
    // 順位の計算：手札の残り枚数が少ない順
    const rankings = gameState.players.map((p: any) => ({
      playerId: p.playerId,
      name: p.playerId === 1 ? "You" : `Player ${p.playerId}`,
      remainingCards: p.hand.length,
    })).sort((a, b) => a.remainingCards - b.remainingCards);

    // 同率順位の考慮
    let currentRank = 0;
    let prevCards = -1;
    const finalRankings = rankings.map((r, i) => {
      if (r.remainingCards !== prevCards) {
        currentRank = i + 1;
        prevCards = r.remainingCards;
      }
      return { ...r, rank: currentRank };
    });

    return (
      <GameResultScreen
        rankings={finalRankings}
        playerCount={gameState.game.playerCount}
        onReplay={async () => {
          try {
            clearToasts();
            const result = await gameSetupMutation.mutateAsync({
              playerCount: gameState.game.playerCount,
            });
            setLocation(`/game/play?gameId=${result.gameId}&new=true`);
          } catch (error) {
            console.error("Error creating new game:", error);
          }
        }}
        onHome={() => {
          clearToasts();
          setLocation("/");
        }}
      />
    );
  }

  // Show dice roll dialog
  if (gamePhase === 'dice') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <DiceRollDialog
          playerCount={gameState.game.playerCount}
          onRollComplete={handleDiceRollComplete}
          isOpen={true}
        />
      </div>
    );
  }

  // Show card dealing phase
  if (gamePhase === 'dealing') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <CardDealingPhase
          playerCount={gameState.game.playerCount}
          onDealingComplete={handleDealingComplete}
          isOpen={true}
        />
      </div>
    );
  }

  // Show hand review phase
  if (gamePhase === 'handReview' && playerHand) {
    return (
      <HandReview
        hand={playerHand}
        playerNumber={currentPlayerNumber}
        onConfirm={handleHandReviewComplete}
      />
    );
  }

  // Show card play phase
  if (gamePhase === 'playing') {
    const currentPlayerNum = gameState.game.currentTurn || 1;
    const isYourTurn = currentPlayerNum === 1;
    const playerName = currentPlayerNum === 1 ? "You" : `Player ${currentPlayerNum}`;
    const playerHand = gameState.players.find((p: any) => p.playerId === 1)?.hand || [];
    const bikes = gameState.bikes || [];
    const playerBikes = playerHand.map((bikeId: number) => bikes.find((b: any) => b.id === bikeId)).filter(Boolean);

    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">ラウンド {gameState.game.currentRound}</h1>
          <button
            onClick={() => {
              clearToasts();
              setLocation("/");
            }}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Opponent Cards Display Area */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center mb-1">
          <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3">対戦相手の手札</p>
          <div className={`grid gap-2 sm:gap-4 w-full ${
            gameState.players.length === 2 ? 'grid-cols-1 max-w-[240px]' : 
            gameState.players.length === 3 ? 'grid-cols-2' : 
            'grid-cols-3'
          }`}>
            {gameState.players.slice(1).map((player: any) => {
              const cpuBikes = player.hand.map((id: number) => gameState.bikes?.find((b: any) => b.id === id)).filter(Boolean);
              const largeCount = cpuBikes.filter((b: any) => b.category === 'large').length;
              const mediumCount = cpuBikes.filter((b: any) => b.category === 'medium').length;
              const smallCount = cpuBikes.filter((b: any) => b.category === 'small').length;
              
              return (
                <div
                  key={player.playerId}
                  className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-lg flex flex-col items-center justify-center p-2 sm:p-3 w-full h-full shadow-sm"
                >
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5 font-bold">Player {player.playerId}</p>
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <p className="text-lg sm:text-xl font-bold text-slate-200">{player.hand.length}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">枚</p>
                  </div>
                  
                  {player.hand.length > 0 ? (
                    <div className="flex gap-1 w-full justify-center">
                      <div className="flex flex-col items-center bg-slate-900/50 rounded px-1.5 py-0.5 flex-1 max-w-[36px] sm:max-w-[42px] border border-slate-700/50">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium mb-0.5">大型</span>
                        <span className={`text-[10px] sm:text-xs font-bold ${largeCount > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{largeCount}</span>
                      </div>
                      <div className="flex flex-col items-center bg-slate-900/50 rounded px-1.5 py-0.5 flex-1 max-w-[36px] sm:max-w-[42px] border border-slate-700/50">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium mb-0.5">中型</span>
                        <span className={`text-[10px] sm:text-xs font-bold ${mediumCount > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{mediumCount}</span>
                      </div>
                      <div className="flex flex-col items-center bg-slate-900/50 rounded px-1.5 py-0.5 flex-1 max-w-[36px] sm:max-w-[42px] border border-slate-700/50">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium mb-0.5">小型</span>
                        <span className={`text-[10px] sm:text-xs font-bold ${smallCount > 0 ? 'text-pink-400' : 'text-slate-600'}`}>{smallCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] sm:text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      上がり
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <CardPlayPhase
          currentPlayer={currentPlayerNum}
          currentPlayerName={playerName}
          playerHand={playerBikes}
          declaredSpec={gameState.game.declaredSpec || ""}
          declaredDirection={gameState.game.declaredDirection || "up"}
          currentBind={gameState.game.currentBind}
          bindValue={gameState.game.bindValue}
          isYourTurn={isYourTurn}
          fieldCards={gameState.fieldCards || []}
          onCardPlay={async (bikeIds: number[], bindDeclare?: any) => {
            try {
              const result = await playCardMutation.mutateAsync({
                gameId: gameId!,
                playerId: 1,
                bikeIds,
                bindDeclare,
              });
              if (result.gameFinished) {
                setGameResult({
                  winnerId: result.winner || 1,
                  winnerName: result.winner === 1 ? 'You' : `Player ${result.winner}`,
                });
                setGamePhase('finished');
              }
              // Refresh game state
              await getStateQuery.refetch();
              addToast('success', 'カードを出しました');
            } catch (error) {
              console.error("Error playing card:", error);
              addToast('error', 'カードを出すのに失敗しました', 'もう一度お試しください');
            }
          }}
          onPass={async () => {
            try {
              const result = await passMutation.mutateAsync({
                gameId: gameId!,
                playerId: 1,
              });
              // Refresh game state
              await getStateQuery.refetch();
              addToast('info', 'パスしました');
              if ('trickCleared' in result && result.trickCleared) {
                addToast('success', '全員がパスしました。場が流れます！');
              }
            } catch (error) {
              console.error("Error passing:", error);
              addToast('error', 'パスに失敗しました', 'もう一度お試しください');
            }
          }}
          onDraw={async () => {
            try {
              await drawCardMutation.mutateAsync({
                gameId: gameId!,
                playerId: 1,
              });
              // Refresh game state
              await getStateQuery.refetch();
              addToast('success', 'カードを引きました');
            } catch (error) {
              console.error("Error drawing card:", error);
              addToast('error', 'カードを引くのに失敗しました', 'もう一度お試しください');
            }
          }}
          isLoading={playCardMutation.isPending || passMutation.isPending || drawCardMutation.isPending}
        />
      </div>
    );
  }

  // Show declaration phase
  if (gamePhase === 'declaration') {
    const declarationPlayer = gameState.game.declarationPlayer || 1;
    const playerName = declarationPlayer === 1 ? "You" : `Player ${declarationPlayer}`;
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <DeclarationPhase
          playerName={playerName}
          onDeclare={handleDeclaration}
          isLoading={declareSpecMutation.isPending}
          hand={playerHand || []}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col px-4 py-4">
      {/* Header - Round Info */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
        <div>
          <p className="text-xs text-slate-400">ラウンド</p>
          <p className="text-2xl font-bold text-cyan-400">{gameState.game.currentRound}</p>
          <p className="text-xs text-slate-500 mt-1">
            宣言: {gameState.game.currentBind || '-'}
            {gameState.game.bindValue ? ` (${gameState.game.bindValue})` : ''}
          </p>
        </div>
        <Button
          onClick={() => {
            clearToasts();
            setLocation("/");
          }}
          variant="ghost"
          className="text-slate-400 hover:text-white"
        >
          ×
        </Button>
      </div>

      {/* ScoreBoard */}
      {Object.keys(roundScores).length > 0 && (
        <ScoreBoard
          scores={roundScores}
          playerCount={gameState?.game?.playerCount || 2}
          currentRound={gameState?.game?.currentRound || 1}
        />
      )}

      {/* RoundHistory */}
      {roundHistory.length > 0 && (
        <RoundHistory history={roundHistory} />
      )}

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Opponent Cards Display Area */}
        <div className="flex-1 bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm mb-4">対戦相手のカード</p>
          <div className="grid grid-cols-2 gap-2 w-full">
            {gameState.players.slice(1).map((player: any) => (
              <div
                key={player.playerId}
                className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-lg flex flex-col items-center justify-center"
              >
                <p className="text-xs text-slate-400 mb-1">Player {player.playerId}</p>
                <p className="text-2xl font-bold text-slate-300">?</p>
                <p className="text-xs text-slate-500 mt-1">{player.hand.length} 枚</p>
              </div>
            ))}
          </div>
        </div>

        {/* Table Area - Played Cards */}
        <div className="bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg p-4 min-h-24 flex items-center justify-center">
          <p className="text-slate-400 text-sm">テーブル（カードはここに表示されます）</p>
        </div>

        {/* Your Hand Area */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-3">あなたの手札 ({gameState.players[0]?.hand.length || 0} 枚)</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {gameState.players[0]?.hand.map((bikeId: number, i: number) => {
              const bike = gameState.bikes?.find((b: any) => b.id === bikeId);
              return bike ? (
                <BikeCard
                  key={i}
                  bike={bike}
                  size="small"
                  showDetails={true}
                  onClick={() => setBikeDetails(bike)}
                />
              ) : (
                <div
                  key={i}
                  className="flex-shrink-0 w-14 h-20 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center"
                >
                  <p className="text-xs text-slate-500">#{bikeId}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            disabled
          >
            カードを出す
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            disabled
          >
            パス
          </Button>
        </div>
      </div>
    </div>
  );
}
