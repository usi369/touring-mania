import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Sparkles, Loader2, Warehouse, Image, Check, Star } from "lucide-react";

type SetupMode = "menu" | "select" | "register";

export default function SetupGarage() {
  const { isLoaded: isAuthLoaded, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<SetupMode>("menu");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "large" | "medium" | "small">("all");

  // Registration Form States
  const [name, setName] = useState("");
  const [maker, setMaker] = useState("");
  const [category, setCategory] = useState<"large" | "medium" | "small">("medium");
  const [cylinders, setCylinders] = useState("単");
  const [transmission, setTransmission] = useState<"AT" | "MT">("MT");
  const [horsepower, setHorsepower] = useState<number | "">("");
  const [fuelEfficiency, setFuelEfficiency] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [seatHeight, setSeatHeight] = useState<number | "">("");
  const [totalLength, setTotalLength] = useState<number | "">("");
  const [year, setYear] = useState<number | "">(new Date().getFullYear());
  const [price, setPrice] = useState<number | "">("");
  const [displacement, setDisplacement] = useState<number | "">("");
  const [engineType, setEngineType] = useState("4st");
  const [bikeStyle, setBikeStyle] = useState<"scooter" | "supersport" | "american">("supersport");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const bikesQuery = trpc.bike.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const setGarageBikeMutation = trpc.garage.setGarageBike.useMutation();
  const registerGarageBikeMutation = trpc.garage.registerGarageBike.useMutation();

  // Redirect to top if not logged in
  useEffect(() => {
    if (isAuthLoaded && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoaded, isAuthenticated]);

  if (!isAuthLoaded || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const handleChooseBike = async (bikeId: number) => {
    try {
      setIsSubmitting(true);
      const res = await setGarageBikeMutation.mutateAsync({ bikeId });
      if (res.success) {
        // Refetch garage query to sync state
        await utils.garage.getGarage.refetch();
        setLocation("/");
      }
    } catch (err) {
      console.error("Failed to select bike:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterBike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name || !maker || !horsepower || !fuelEfficiency || !weight ||
      !seatHeight || !totalLength || !year || !price || !displacement
    ) {
      setErrorMsg("すべての必須スペック項目を精緻に入力してください。");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // Setup pictogram fallback path
    const fallbackPhotoUrl = `/pictogram_${bikeStyle}.png`;

    try {
      const res = await registerGarageBikeMutation.mutateAsync({
        name,
        maker,
        category,
        cylinders,
        transmission,
        horsepower: Number(horsepower),
        fuelEfficiency: Number(fuelEfficiency),
        weight: Number(weight),
        seatHeight: Number(seatHeight),
        totalLength: Number(totalLength),
        year: Number(year),
        price: Number(price),
        photoUrl: fallbackPhotoUrl,
        displacement: String(displacement),
        displacementUnit: "cc",
        engineType,
      });

      if (res.success) {
        await utils.garage.getGarage.refetch();
        await utils.bike.list.refetch();
        setLocation("/");
      }
    } catch (err: any) {
      console.error("Failed to register bike:", err);
      setErrorMsg(err.message || "バイクの登録に失敗しました。入力値を確認してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBikes = bikesQuery.data?.filter((b: any) => {
    if (selectedCategory === "all") return true;
    return b.category === selectedCategory;
  }) || [];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Cyberpunk Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-40" />

      {/* Header */}
      <div className="z-30 bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode !== "menu" && (
            <Button
              onClick={() => {
                setMode("menu");
                setErrorMsg("");
              }}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-base font-black text-white italic tracking-wider uppercase">GARAGE SETUP</h1>
            <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">
              {mode === "menu" ? "愛車登録モードの選択" : mode === "select" ? "エントリーデータから選択" : "新規マシンスペック登録"}
            </p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          USER: {user?.name || "Member"}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ==================== 1. MODE SELECT MENU ==================== */}
          {mode === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm space-y-4 text-center"
            >
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full border border-cyan-500/30 bg-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                  <Warehouse className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-white italic uppercase tracking-wider">愛車を設定しましょう</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  ガレージに展示するあなたのバイクを設定します。<br />
                  新規登録されたバイクはゲームプレイのデッキにも加わります。
                </p>
              </div>

              {/* Option A: Select Existing */}
              <button
                onClick={() => setMode("select")}
                className="w-full bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 rounded-2xl p-5 text-left transition-all group flex items-start gap-4 shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.05)]"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-cyan-400">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wider uppercase italic">過去のエントリーから探す</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    すでにマスタデータに登録されている場合は、一覧から自分のバイクを検索して紐付けます。
                  </p>
                </div>
              </button>

              {/* Option B: Register Brand New */}
              <button
                onClick={() => setMode("register")}
                className="w-full bg-slate-900/90 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/80 rounded-2xl p-5 text-left transition-all group flex items-start gap-4 shadow-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.05)]"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-950 border border-pink-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-pink-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wider uppercase italic">新しく自分のバイクを登録する</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    マスタデータに自分の車種がない場合、すべてのスペック情報を入力して新規登録します。
                  </p>
                </div>
              </button>
            </motion.div>
          )}

          {/* ==================== 2. CHOOSE FROM LIST ==================== */}
          {mode === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col max-h-[80vh] border border-slate-800 bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Category Filter Tabs */}
              <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex gap-1.5 overflow-x-auto no-scrollbar">
                {(["all", "large", "medium", "small"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[9px] font-bold px-3 py-1.5 rounded-lg border transition-all uppercase whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat === "all" ? "すべて" : cat === "large" ? "大型" : cat === "medium" ? "中型" : "小型"}
                  </button>
                ))}
              </div>

              {/* Bike List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-950/20">
                {bikesQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest animate-pulse">LOADING BIKES...</p>
                  </div>
                ) : filteredBikes.length > 0 ? (
                  filteredBikes.map((bike: any) => (
                    <div
                      key={bike.id}
                      onClick={() => !isSubmitting && handleChooseBike(bike.id)}
                      className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/30 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {bike.photoUrl ? (
                          <img src={bike.photoUrl} alt={bike.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">🏍</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[7px] font-black px-1 py-0.5 rounded leading-none ${
                            bike.category === 'large' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                            bike.category === 'medium' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' :
                            'bg-pink-500/20 text-pink-400 border border-pink-500/20'
                          }`}>{bike.category === 'large' ? '大型' : bike.category === 'medium' ? '中型' : '小型'}</span>
                          <span className="text-[8px] font-bold text-slate-500">{bike.maker}</span>
                          {bike.ownerName && (
                            <span className="text-[7px] text-cyan-400/80 truncate max-w-[80px] font-semibold">{bike.ownerName}</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white truncate leading-tight">{bike.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                          {bike.displacement ? `${bike.displacement}cc` : ""}{bike.engineType ? ` ${bike.engineType}` : ""} │ {bike.horsepower}PS │ {bike.weight}kg │ {bike.price}万円
                        </p>
                      </div>

                      <Button
                        size="sm"
                        disabled={isSubmitting}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-8 text-[10px] px-3.5 rounded-lg flex-shrink-0"
                      >
                        選択
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    バイクが見つかりませんでした。
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== 3. REGISTER NEW BIKE ==================== */}
          {mode === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg flex flex-col max-h-[82vh] border border-slate-800 bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleRegisterBike} className="flex flex-col h-full overflow-hidden">
                {/* Form Container */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-950/20 text-xs">
                  
                  {errorMsg && (
                    <div className="p-3 bg-pink-950/30 border border-pink-500/20 text-pink-400 rounded-lg text-center font-medium">
                      {errorMsg}
                    </div>
                  )}

                  {/* Group: Core Identity */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">基本情報</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">メーカー名 <span className="text-pink-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="YAMAHA, HONDA など"
                          value={maker}
                          onChange={(e) => setMaker(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">バイク車種名 <span className="text-pink-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="YZF-R7 など"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-medium"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">年式 <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="2022"
                          value={year}
                          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">排気量区分 <span className="text-pink-500">*</span></label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-medium"
                        >
                          <option value="large">大型 (400cc超)</option>
                          <option value="medium">中型 (126cc〜400cc)</option>
                          <option value="small">小型 (125cc以下)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Group: Engine Specs */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">エンジン詳細</h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1">排気量数値(cc) <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="689"
                          value={displacement}
                          onChange={(e) => setDisplacement(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-2 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1">エンジンタイプ <span className="text-pink-500">*</span></label>
                        <select
                          value={engineType}
                          onChange={(e) => setEngineType(e.target.value)}
                          className="w-full h-10 px-2 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white"
                        >
                          <option value="4st">4ストローク (4st)</option>
                          <option value="2st">2ストローク (2st)</option>
                          <option value="EV">電気モーター (EV)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1">気筒数 <span className="text-pink-500">*</span></label>
                        <select
                          value={cylinders}
                          onChange={(e) => setCylinders(e.target.value)}
                          className="w-full h-10 px-2 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white"
                        >
                          <option value="単">単気筒 (1)</option>
                          <option value="2">2気筒 (2)</option>
                          <option value="3">3気筒 (3)</option>
                          <option value="4">4気筒 (4)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">変速機 (MT/AT) <span className="text-pink-500">*</span></label>
                        <select
                          value={transmission}
                          onChange={(e) => setTransmission(e.target.value as any)}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white"
                        >
                          <option value="MT">マニュアル (MT)</option>
                          <option value="AT">オートマチック (AT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">最高出力 (馬力 PS) <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="73"
                          value={horsepower}
                          onChange={(e) => setHorsepower(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group: Body Dimensions */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">車体サイズ・燃費・価格</h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1">車両重量 (kg) <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="188"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-2 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1">燃費 (km/l) <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="28"
                          value={fuelEfficiency}
                          onChange={(e) => setFuelEfficiency(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-2 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1">シート高 (mm) <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="835"
                          value={seatHeight}
                          onChange={(e) => setSeatHeight(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-2 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">全長 (mm) <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="2070"
                          value={totalLength}
                          onChange={(e) => setTotalLength(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">税込価格 (万円) <span className="text-pink-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="105"
                          value={price}
                          onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group: Style / Pictogram Selection */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">バイクデザイン（写真がない場合のピクトグラム）</h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-2">バイクのスタイル・形状を選択してください</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["scooter", "supersport", "american"] as const).map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setBikeStyle(style)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                              bikeStyle === style
                                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <img
                              src={`/pictogram_${style}.png`}
                              alt={style}
                              className="w-10 h-10 object-contain image-render-pixel"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className="text-[9px] font-bold uppercase tracking-wider">
                              {style === "scooter" ? "スクーター" : style === "supersport" ? "スポーツ" : "アメリカン"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Form Footer */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-between gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setMode("menu");
                      setErrorMsg("");
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    戻る
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 shadow-md shadow-pink-500/10 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        登録中...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        このスペックで愛車登録
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .image-render-pixel { image-rendering: pixelated; }
      `}} />
    </div>
  );
}
