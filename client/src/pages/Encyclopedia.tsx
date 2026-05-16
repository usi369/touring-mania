import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, ChevronUp, ChevronDown, SortAsc } from "lucide-react";
import BikeCard from "@/components/BikeCard";
import { useState, useEffect, useMemo } from "react";

export default function Encyclopedia() {
  const [, setLocation] = useLocation();
  
  // キャッシュデータの初期化
  const [cachedData, setCachedData] = useState<any[] | null>(() => {
    const saved = localStorage.getItem('bike_encyclopedia_cache');
    return saved ? JSON.parse(saved) : null;
  });

  const bikesQuery = trpc.bike.list.useQuery(undefined, {
    // 古いデータでも表示を維持するための設定
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // 取得成功時にキャッシュを更新
  useEffect(() => {
    if (bikesQuery.data && bikesQuery.data.length > 0) {
      localStorage.setItem('bike_encyclopedia_cache', JSON.stringify(bikesQuery.data));
      setCachedData(bikesQuery.data);
    }
  }, [bikesQuery.data]);

  const [sortKey, setSortKey] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterEdition, setFilterEdition] = useState<string>("all");

  const displayData = useMemo(() => {
    const data = bikesQuery.data || cachedData;
    if (!data) return null;

    // First filter by edition
    let filtered = [...data];
    if (filterEdition !== "all") {
      filtered = filtered.filter(bike => !!bike[filterEdition as keyof typeof bike]);
    }

    // Then sort
    return filtered.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      const factor = sortOrder === "asc" ? 1 : -1;
      return valA > valB ? factor : -factor;
    });
  }, [bikesQuery.data, cachedData, sortKey, sortOrder, filterEdition]);

  const isLoading = bikesQuery.isLoading && !cachedData;
  const isOffline = bikesQuery.isError && cachedData;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc"); // Default to desc for specs as usually better values are higher
    }
  };

  const sortOptions = [
    { key: "id", label: "ID" },
    { key: "horsepower", label: "馬力" },
    { key: "fuelEfficiency", label: "燃費" },
    { key: "price", label: "価格" },
    { key: "weight", label: "重量" },
    { key: "seatHeight", label: "シート高" },
    { key: "year", label: "年式" },
  ];

  const editionOptions = [
    { key: "all", label: "すべて" },
    { key: "isTokyoRemake", label: "東京リメイク" },
    { key: "isR6Complete", label: "R6コンプリート" },
    { key: "isR7Mega", label: "R7メガ" },
    { key: "isR7Starter", label: "R7スターター" },
  ];


  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col px-4 py-8 items-center">
      <div className="w-full max-w-5xl flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-white text-center flex-1">バイク図鑑</h1>
        <div className="w-10" />
      </div>

      {/* Edition Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {editionOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterEdition(opt.key)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-black transition-all duration-300 border-2
                ${filterEdition === opt.key 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105" 
                  : "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="mb-1">
        <div className="flex items-center justify-center gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex-shrink-0 text-xs text-slate-500 font-bold flex items-center gap-1 ml-1">
            <SortAsc className="w-3 h-3" />
            並び替え:
          </div>
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => toggleSort(opt.key)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border
                ${sortKey === opt.key 
                  ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30" 
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
                }
                flex items-center gap-1
              `}
            >
              {opt.label}
              {sortKey === opt.key && (
                sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Display Count */}
      {displayData && (
        <div className="mb-4 flex justify-center">
          <div className="bg-slate-800/20 border border-slate-800 rounded-full px-3 py-0.5 backdrop-blur-md flex items-center gap-2">
            <span className="text-[7px] text-slate-500 font-black uppercase tracking-tight opacity-70">DISPLAY</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[11px] font-black text-cyan-500/80 leading-none">
                {displayData.length}
              </span>
              <span className="text-[9px] text-slate-600 font-bold">/ {(bikesQuery.data || cachedData)?.length || 0}</span>
            </div>
            {filterEdition !== "all" && (
              <div className="h-2 w-[1px] bg-slate-800 mx-0.5" />
            )}
            {filterEdition !== "all" && (
              <span className="text-[7px] text-cyan-600 font-black uppercase tracking-tighter">Filtered</span>
            )}
          </div>
        </div>
      )}

      {/* Loading State - Only show if no cache exists */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400">図鑑を読み込み中...</p>
        </div>
      )}

      {/* Offline/Cache indicator */}
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-4 text-center">
          <p className="text-[10px] text-amber-400">オフライン表示中（保存済みのデータを表示しています）</p>
        </div>
      )}

      {/* Encyclopedia Grid */}
      {displayData && displayData.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 pb-12 place-items-center">
            {displayData.map((bike) => (
              <div key={bike.id} className="flex flex-col items-center">
                <BikeCard 
                  bike={bike as any} 
                  showDetails={true} 
                  isPokerRatio={true}
                />
              </div>
            ))}
          </div>
        </div>
      ) : !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <p className="text-slate-500 mb-4">データが見つかりませんでした。</p>
          <Button 
            variant="outline" 
            onClick={() => bikesQuery.refetch()}
            className="border-slate-700 text-slate-400"
          >
            再読み込み
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-4 text-center">
        <p className="text-xs text-slate-500">全 {displayData?.length || 0} 車種収録</p>
      </div>
      </div>
    </div>
  );
}
