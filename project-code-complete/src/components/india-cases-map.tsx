import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin,
  ShieldAlert,
  Users,
  PhoneCall,
  Sparkles,
  Search,
  Activity,
  BarChart2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Radio,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Download,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ChevronRight,
  Info,
  Layers,
  Car,
} from "lucide-react";
import { toast } from "sonner";
import {
  allIndiaFeatures,
  regionViewBoxes,
  indiaHotspots,
  type MapStateFeature,
  type TimeframeMode,
  type MetricType,
  type HotspotIncidentPin,
} from "@/lib/india-map-data";
import { useLanguage } from "@/lib/i18n";

export function IndiaCasesMap({ className, initialStateId }: { className?: string; initialStateId?: string }) {
  const { t } = useLanguage();
  // Active state selection (defaults to Uttar Pradesh, then Maharashtra, etc.)
  const [selectedState, setSelectedState] = useState<MapStateFeature>(
    () => {
      if (initialStateId) {
        return allIndiaFeatures.find((s) => s.id === initialStateId) ?? allIndiaFeatures[0]!;
      }
      return allIndiaFeatures.find((s) => s.id === "up") ?? allIndiaFeatures[0]!;
    }
  );
  const [hoveredState, setHoveredState] = useState<MapStateFeature | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dynamic filters
  const [timeframe, setTimeframe] = useState<TimeframeMode>("annual");
  const [metricMode, setMetricMode] = useState<MetricType>("urgent");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotIncidentPin | null>(null);

  // Live Simulation state
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(false);
  const [livePulseId, setLivePulseId] = useState<string | null>(null);
  const [incidentLogs, setIncidentLogs] = useState<
    { id: string; time: string; state: string; district: string; message: string; severity: "urgent" | "high" }[]
  >([
    {
      id: "log-1",
      time: "Just now",
      state: "Uttar Pradesh",
      district: "Lucknow",
      message: "Priority domestic distress flag escalated to State Nodal Cell.",
      severity: "urgent",
    },
    {
      id: "log-2",
      time: "4m ago",
      state: "Maharashtra",
      district: "Mumbai Suburban",
      message: "Silent SOS signal logged & verified. Mobile Flying Squad #3 assigned.",
      severity: "urgent",
    },
    {
      id: "log-3",
      time: "9m ago",
      state: "Karnataka",
      district: "Bengaluru Urban",
      message: "Tele-MANAS inbound helpline handoff to counsellor completed.",
      severity: "high",
    },
  ]);

  // Zoom & Pan ViewBox management
  const [currentViewBox, setCurrentViewBox] = useState<string>(regionViewBoxes["All"]!.viewBox);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Region Viewbox transition
  useEffect(() => {
    if (regionViewBoxes[selectedRegion]) {
      setCurrentViewBox(regionViewBoxes[selectedRegion]!.viewBox);
      setZoomScale(1);
    }
  }, [selectedRegion]);

  // Live Simulation timer: periodically triggers a dynamic distress alert
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      const highRiskStates = allIndiaFeatures.filter(
        (s) => s.riskLevel === "Critical" || s.riskLevel === "High"
      );
      const randomState = highRiskStates[Math.floor(Math.random() * highRiskStates.length)] || allIndiaFeatures[0]!;
      const randomDistrict =
        randomState.districts[Math.floor(Math.random() * randomState.districts.length)]?.name || "Central District";

      setLivePulseId(randomState.id);
      setTimeout(() => setLivePulseId(null), 3000);

      const newLog = {
        id: `log-${Date.now()}`,
        time: "Just now",
        state: randomState.name,
        district: randomDistrict,
        message: `Inbound emergency signal logged in ${randomDistrict} (${randomState.code}). Triage queue updated.`,
        severity: (Math.random() > 0.4 ? "urgent" : "high") as "urgent" | "high",
      };

      setIncidentLogs((prev) => [newLog, ...prev.slice(0, 5)]);
    }, 4800);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  // Filter states by region & search query
  const filteredStates = useMemo(() => {
    return allIndiaFeatures.filter((s) => {
      const matchesRegion = selectedRegion === "All" || s.region === selectedRegion;
      const matchesSearch =
        (s.name + s.code + s.region + s.capital).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [selectedRegion, searchQuery]);

  // National Aggregates for current timeframe
  const nationalStats = useMemo(() => {
    return allIndiaFeatures.reduce(
      (acc, s) => {
        const periodData = s.periods[timeframe];
        acc.total += periodData.totalCases;
        acc.urgent += periodData.urgentCases;
        acc.saathi += periodData.saathiCases;
        acc.helpline += periodData.helplineCalls;
        return acc;
      },
      { total: 0, urgent: 0, saathi: 0, helpline: 0 }
    );
  }, [timeframe]);

  // Metric value helper for current timeframe
  const getMetricValue = (state: MapStateFeature) => {
    const p = state.periods[timeframe];
    switch (metricMode) {
      case "total":
        return p.totalCases;
      case "urgent":
        return p.urgentCases;
      case "saathi":
        return p.saathiCases;
      case "helpline":
        return p.helplineCalls;
      case "resolution":
        return p.resolutionRate;
    }
  };

  // Min and Max for current metric across all states for smooth heatmap scaling
  const metricExtent = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    allIndiaFeatures.forEach((s) => {
      const val = getMetricValue(s);
      if (val < min) min = val;
      if (val > max) max = val;
    });
    if (min === max) {
      min = 0;
      max = max || 100;
    }
    return { min, max };
  }, [metricMode, timeframe]);

  // Color generator for Choropleth heatmap
  const getHeatmapColor = (state: MapStateFeature, isFilteredOut: boolean) => {
    if (isFilteredOut) {
      return "oklch(0.4 0.02 260 / 0.15)";
    }

    const val = getMetricValue(state);
    const { min, max } = metricExtent;
    const ratio = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));

    if (metricMode === "urgent") {
      // Urgent mode: Slate-Blue -> Amber -> Deep Crimson/Red
      if (ratio > 0.65) return "oklch(0.62 0.24 25)";
      if (ratio > 0.35) return "oklch(0.72 0.20 45)";
      if (ratio > 0.15) return "oklch(0.78 0.14 75)";
      return "oklch(0.65 0.08 240)";
    }

    if (metricMode === "saathi") {
      // Saathi active interventions: Cyan -> Teal -> Vibrant Brand Emerald
      if (ratio > 0.65) return "oklch(0.65 0.20 160)";
      if (ratio > 0.35) return "oklch(0.70 0.16 185)";
      if (ratio > 0.15) return "oklch(0.65 0.12 210)";
      return "oklch(0.55 0.06 240)";
    }

    if (metricMode === "helpline") {
      // Helpline Calls: Indigo -> Amber -> Golden Orange
      if (ratio > 0.65) return "oklch(0.68 0.20 50)";
      if (ratio > 0.35) return "oklch(0.75 0.18 70)";
      if (ratio > 0.15) return "oklch(0.70 0.12 90)";
      return "oklch(0.60 0.06 250)";
    }

    if (metricMode === "resolution") {
      // Resolution rate (%): Red (low resolution) -> Amber -> Bright Green (high)
      if (val >= 95) return "oklch(0.72 0.20 145)";
      if (val >= 90) return "oklch(0.76 0.16 160)";
      if (val >= 85) return "oklch(0.78 0.16 85)";
      return "oklch(0.68 0.22 35)";
    }

    // Default Total NCRB Cases: Purple-Blue to Intense Crimson
    if (ratio > 0.65) return "oklch(0.60 0.24 350)";
    if (ratio > 0.35) return "oklch(0.65 0.18 300)";
    if (ratio > 0.15) return "oklch(0.68 0.14 270)";
    return "oklch(0.58 0.08 240)";
  };

  // Zoom controls
  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (direction === "reset") {
      setCurrentViewBox(regionViewBoxes["All"]!.viewBox);
      setZoomScale(1);
      setSelectedRegion("All");
      return;
    }

    const [bx, by, bw, bh] = currentViewBox.split(" ").map(Number);
    const factor = direction === "in" ? 0.75 : 1.33;
    const newWidth = Math.max(120, Math.min(612, bw! * factor));
    const newHeight = Math.max(140, Math.min(696, bh! * factor));
    const newX = Math.max(0, Math.min(612 - newWidth, bx! + (bw! - newWidth) / 2));
    const newY = Math.max(0, Math.min(696 - newHeight, by! + (bh! - newHeight) / 2));

    setCurrentViewBox(`${newX} ${newY} ${newWidth} ${newHeight}`);
    setZoomScale((prev) => (direction === "in" ? prev * 1.25 : prev * 0.8));
  };

  // Zoom to a specific state
  const focusOnState = (state: MapStateFeature) => {
    setSelectedState(state);
    const padding = 35;
    const b = state.bounds;
    const width = Math.max(160, b.width + padding * 2);
    const height = Math.max(180, b.height + padding * 2);
    const x = Math.max(0, Math.min(612 - width, state.center.x - width / 2));
    const y = Math.max(0, Math.min(696 - height, state.center.y - height / 2));
    setCurrentViewBox(`${x} ${y} ${width} ${height}`);
  };

  // Supervisor Actions
  const handleDispatchSquad = () => {
    toast.success(`🚨 Emergency Flying Squad Dispatched!`, {
      description: `Rapid Response Unit #4 dispatched to ${selectedState.name}. ETA ~14 minutes. State Nodal Cell alerted.`,
      duration: 4500,
    });
  };

  const handleBroadcastAlert = () => {
    toast.warning(`📢 Priority Nodal Directive Issued`, {
      description: `Broadcast alert transmitted to ${selectedState.nodalOfficer} (${selectedState.code} Hub).`,
      duration: 4000,
    });
  };

  const handleSimulateManualSOS = () => {
    const randomDistrict =
      selectedState.districts[Math.floor(Math.random() * selectedState.districts.length)]?.name || "Central District";

    setLivePulseId(selectedState.id);
    setTimeout(() => setLivePulseId(null), 3500);

    toast.error(`🚨 High-Priority SOS Beacon Logged!`, {
      description: `Inbound silent emergency alarm triggered in ${randomDistrict}, ${selectedState.name}.`,
      duration: 5000,
    });

    const newLog = {
      id: `manual-${Date.now()}`,
      time: "Just now",
      state: selectedState.name,
      district: randomDistrict,
      message: `Emergency SOS Beacon manually initiated in ${randomDistrict}. Flying Squad queued.`,
      severity: "urgent" as const,
    };
    setIncidentLogs((prev) => [newLog, ...prev.slice(0, 5)]);
  };

  const handleExportDossier = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            state: selectedState.name,
            code: selectedState.code,
            timeframe,
            metrics: selectedState.periods[timeframe],
            nodalOfficer: selectedState.nodalOfficer,
            districts: selectedState.districts,
            exportTimestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `saathi-dossier-${selectedState.id}-${timeframe}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.info(`Export Complete`, {
      description: `State incident dossier for ${selectedState.name} downloaded.`,
    });
  };

  // Cursor tracking for floating glassmorphism tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const activePeriod = selectedState.periods[timeframe];
  const activeHoverPeriod = hoveredState?.periods[timeframe];

  return (
    <div className={`saathi-panel p-4 sm:p-6 space-y-6 ${className ?? ''}`}>
      {/* Top Header & Toggles */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand shadow-xs">
                <MapPin className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                {t("nationalIncidentMap")}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-urgent/10 px-3 py-1 text-xs font-bold text-urgent border border-urgent/20 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-urgent animate-pulse" />
                36 States &amp; UTs Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-3xl">
              {t("nationalIncidentMapSub")}
            </p>
          </div>

          {/* Quick Simulation & Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveSimulating((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
                isLiveSimulating
                  ? "bg-urgent text-white border-urgent shadow-urgent/30 animate-pulse"
                  : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
              }`}
              title="Toggle periodic automated incident simulation"
            >
              <Radio className="h-3.5 w-3.5" />
              {isLiveSimulating ? t("liveStreamActive") : t("simulateLiveStream")}
            </button>

            <button
              onClick={handleSimulateManualSOS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-urgent/15 text-urgent border border-urgent/30 hover:bg-urgent hover:text-white transition-all shadow-xs cursor-pointer"
              title="Test emergency distress alert on currently selected state"
            >
              <Flame className="h-3.5 w-3.5" />
              {t("testSosBeacon")}
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar: Timeframe Horizon + Search + Hotspots Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Timeframe Horizon Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-muted/40 p-1 border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground px-2 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-brand" /> Horizon:
            </span>
            {(
              [
                { key: "live", label: "Live (24h)" },
                { key: "week", label: "7 Days" },
                { key: "month", label: "30 Days" },
                { key: "annual", label: "NCRB Annual Baseline" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeframe(t.key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  timeframe === t.key
                    ? "bg-brand text-brand-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search State / UT */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search state, UT, capital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 w-44 sm:w-56 rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Toggle Metro Hotspots Pins */}
            <button
              onClick={() => setShowHotspots((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                showHotspots
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border/60 bg-muted/30 text-muted-foreground"
              }`}
              title="Show / hide active metro radar pins"
            >
              <Layers className="h-3.5 w-3.5" />
              Hotspots {showHotspots ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>

      {/* National Metric Toggles (Click to switch map heatmap mode) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setMetricMode("urgent")}
          className={`rounded-xl p-3 text-left transition-all border cursor-pointer relative overflow-hidden ${
            metricMode === "urgent"
              ? "border-urgent bg-urgent/10 ring-2 ring-urgent/30 shadow-sm"
              : "border-border/60 bg-muted/20 hover:border-urgent/40 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-urgent flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> Crisis Flags
            </span>
            <span className="h-2 w-2 rounded-full bg-urgent animate-ping" />
          </div>
          <p className="font-display text-xl font-extrabold text-urgent mt-1">
            {nationalStats.urgent.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-urgent/80 mt-0.5">Urgent triage cases</p>
        </button>

        <button
          onClick={() => setMetricMode("total")}
          className={`rounded-xl p-3 text-left transition-all border cursor-pointer ${
            metricMode === "total"
              ? "border-brand bg-brand/10 ring-2 ring-brand/30 shadow-sm"
              : "border-border/60 bg-muted/20 hover:border-brand/40 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-brand" /> NCRB Caseload
            </span>
          </div>
          <p className="font-display text-xl font-extrabold text-foreground mt-1">
            {nationalStats.total.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">National crime aggregate</p>
        </button>

        <button
          onClick={() => setMetricMode("saathi")}
          className={`rounded-xl p-3 text-left transition-all border cursor-pointer ${
            metricMode === "saathi"
              ? "border-brand bg-brand/15 ring-2 ring-brand/40 shadow-sm"
              : "border-border/60 bg-muted/20 hover:border-brand/40 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand flex items-center gap-1.5">
              <Users className="h-4 w-4" /> SAATHI Active
            </span>
          </div>
          <p className="font-display text-xl font-extrabold text-brand mt-1">
            {nationalStats.saathi.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-brand/80 mt-0.5">Assigned counsellor caseload</p>
        </button>

        <button
          onClick={() => setMetricMode("helpline")}
          className={`rounded-xl p-3 text-left transition-all border cursor-pointer ${
            metricMode === "helpline"
              ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 shadow-sm"
              : "border-border/60 bg-muted/20 hover:border-amber-500/40 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4" /> Tele-MANAS
            </span>
          </div>
          <p className="font-display text-xl font-extrabold text-amber-500 mt-1">
            {nationalStats.helpline.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-amber-500/80 mt-0.5">24/7 Helpline inbound calls</p>
        </button>

        <button
          onClick={() => setMetricMode("resolution")}
          className={`col-span-2 lg:col-span-1 rounded-xl p-3 text-left transition-all border cursor-pointer ${
            metricMode === "resolution"
              ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-sm"
              : "border-border/60 bg-muted/20 hover:border-emerald-500/40 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Resolution Rate
            </span>
          </div>
          <p className="font-display text-xl font-extrabold text-emerald-500 mt-1">91.4%</p>
          <p className="text-[10px] text-emerald-500/80 mt-0.5">Counsellor safe handoffs</p>
        </button>
      </div>

      {/* Main Split Layout: Left Map (7 cols) + Right District Inspector (5 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* SVG Map Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-card relative">
          {/* Map Controls Header: Region Selector + Zoom Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 mb-3">
            {/* Regional Focus Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
              <span className="text-[11px] font-bold text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-brand" /> Zoom Region:
              </span>
              {Object.keys(regionViewBoxes).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all whitespace-nowrap ${
                    selectedRegion === r
                      ? "bg-brand text-brand-foreground shadow-xs font-bold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/60">
              <button
                onClick={() => handleZoom("in")}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleZoom("out")}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleZoom("reset")}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                title="Reset View"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div
            ref={mapContainerRef}
            className="relative w-full h-[470px] sm:h-[500px] bg-muted/15 rounded-xl border border-border/50 flex items-center justify-center p-2 overflow-hidden select-none"
          >
            <svg
              viewBox={currentViewBox}
              onMouseMove={handleMouseMove}
              className="w-full h-full drop-shadow-md select-none transition-all duration-500 ease-out"
            >
              {/* Subtle Grid Backdrop */}
              <defs>
                <pattern id="india-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="oklch(0.85 0.02 250 / 0.2)" strokeWidth="0.5" />
                </pattern>
                {/* Glow Filter for Active Shockwaves */}
                <filter id="glow-shockwave" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#india-grid)" />

              {/* Render Vector Paths for All 36 Indian States & UTs */}
              {allIndiaFeatures.map((state) => {
                const isSelected = selectedState.id === state.id;
                const isHovered = hoveredState?.id === state.id;
                const isFilteredOut = !filteredStates.some((f) => f.id === state.id);
                const isPulsing = livePulseId === state.id;
                const color = getHeatmapColor(state, isFilteredOut);

                return (
                  <g key={state.id} className="cursor-pointer transition-all duration-300">
                    <path
                      d={state.pathD}
                      fill={color}
                      fillOpacity={isFilteredOut ? 0.15 : isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
                      stroke={
                        isSelected
                          ? "#ffffff"
                          : isHovered
                          ? "oklch(0.98 0 0)"
                          : "oklch(0.3 0.05 250 / 0.5)"
                      }
                      strokeWidth={isSelected ? 3 : isHovered ? 2 : 0.8}
                      onClick={() => focusOnState(state)}
                      onMouseEnter={() => setHoveredState(state)}
                      onMouseLeave={() => setHoveredState(null)}
                      className={`transition-all duration-200 hover:filter hover:brightness-115 ${
                        isPulsing ? "animate-pulse" : ""
                      }`}
                    />

                    {/* Live Shockwave Ring when state receives an incident alert */}
                    {isPulsing && (
                      <circle
                        cx={state.center.x}
                        cy={state.center.y}
                        r="26"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        filter="url(#glow-shockwave)"
                        className="animate-ping"
                      />
                    )}

                    {/* State Centroid Code Badge (Visible on medium-large states) */}
                    {!isFilteredOut && state.bounds.width > 20 && (
                      <g
                        transform={`translate(${state.center.x}, ${state.center.y})`}
                        onClick={() => focusOnState(state)}
                        onMouseEnter={() => setHoveredState(state)}
                        onMouseLeave={() => setHoveredState(null)}
                        className="pointer-events-auto"
                      >
                        <circle
                          r={isSelected ? 11 : isHovered ? 9.5 : 8}
                          fill={isSelected ? "#ffffff" : color}
                          stroke={isSelected ? color : "#ffffff"}
                          strokeWidth={isSelected ? 2.5 : 1.2}
                          className="transition-all duration-200 shadow-sm"
                        />
                        <text
                          textAnchor="middle"
                          dy="3"
                          fill={isSelected ? color : "#ffffff"}
                          fontSize={isSelected ? "9" : "7.5"}
                          fontWeight="bold"
                          className="pointer-events-none select-none font-mono"
                        >
                          {state.code}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Render Metropolitan Hotspot Radar Pins with Pulsing Shockwave */}
              {showHotspots &&
                indiaHotspots.map((pin) => (
                  <g
                    key={pin.id}
                    transform={`translate(${pin.x}, ${pin.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredHotspot(pin)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                    onClick={() => {
                      const st = allIndiaFeatures.find((s) => s.id === pin.stateId);
                      if (st) focusOnState(st);
                    }}
                  >
                    {/* Animated Radar Pulse Rings */}
                    <circle r="12" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping opacity-75" />
                    <circle r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="shadow-lg" />
                  </g>
                ))}
            </svg>

            {/* Cursor Floating Tooltip */}
            {hoveredState && (
              <div
                className="absolute z-40 pointer-events-none bg-card/95 border border-border p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[210px] text-xs transition-opacity duration-150"
                style={{
                  left: Math.min(tooltipPos.x + 15, 340),
                  top: Math.min(tooltipPos.y + 15, 360),
                }}
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          hoveredState.riskLevel === "Critical"
                            ? "var(--urgent)"
                            : hoveredState.riskLevel === "High"
                            ? "var(--priority)"
                            : "var(--review)",
                      }}
                    />
                    <span className="font-bold text-foreground text-sm">{hoveredState.name}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                    {hoveredState.code}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NCRB Cases:</span>
                    <strong className="text-foreground">
                      {hoveredState.periods[timeframe].totalCases.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="flex justify-between text-urgent font-medium">
                    <span>Urgent SOS Flags:</span>
                    <strong>{hoveredState.periods[timeframe].urgentCases.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between text-brand font-medium">
                    <span>Active SAATHI:</span>
                    <strong>{hoveredState.periods[timeframe].saathiCases.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between text-amber-500 font-medium">
                    <span>Tele-MANAS Inbound:</span>
                    <strong>{hoveredState.periods[timeframe].helplineCalls.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-500 font-medium pt-0.5 border-t border-border/40">
                    <span>Resolution Rate:</span>
                    <strong>{hoveredState.periods[timeframe].resolutionRate}%</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Hotspot Floating Tooltip */}
            {hoveredHotspot && (
              <div
                className="absolute z-50 pointer-events-none bg-card/95 border border-urgent/40 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[220px] text-xs"
                style={{
                  left: Math.min(tooltipPos.x + 15, 340),
                  top: Math.min(tooltipPos.y + 15, 360),
                }}
              >
                <div className="flex items-center gap-1.5 text-urgent font-bold text-xs pb-1 border-b border-border/60">
                  <Flame className="h-3.5 w-3.5" /> {hoveredHotspot.name}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{hoveredHotspot.incidentType}</p>
                <div className="mt-2 flex justify-between text-[11px] font-semibold">
                  <span className="text-foreground">{hoveredHotspot.activeResponders} Responders on duty</span>
                  <span className="text-urgent">{hoveredHotspot.lastCallAgo}</span>
                </div>
              </div>
            )}
          </div>

          {/* Map Footer & Dynamic Heatmap Legend */}
          <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Color Ramp Legend */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground">
                {metricMode === "urgent"
                  ? "Crisis Intensity:"
                  : metricMode === "saathi"
                  ? "Counsellor Coverage:"
                  : metricMode === "helpline"
                  ? "Call Volume:"
                  : metricMode === "resolution"
                  ? "Resolution %:"
                  : "Reported Volume:"}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span className="text-muted-foreground">{metricExtent.min.toLocaleString("en-IN")}</span>
                <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-muted to-urgent shadow-inner" />
                <span className="font-bold text-foreground">{metricExtent.max.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Click any state or node to inspect district telemetry.</span>
            </div>
          </div>

          {/* Live Incident Stream Ticker */}
          <div className="mt-3 rounded-xl bg-muted/30 border border-border/60 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-urgent animate-pulse" />
                Supervisor Live Telemetry Feed
              </span>
              <span className="text-[10px] text-muted-foreground">Auto-synced</span>
            </div>
            <div className="space-y-1">
              {incidentLogs.slice(0, 2).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[85%] text-foreground">
                    <strong className="text-urgent font-semibold">[{log.time}]</strong> {log.message}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected State Detailed Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-5 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header with Risk Badge */}
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs"
                    style={{
                      backgroundColor:
                        selectedState.riskLevel === "Critical"
                          ? "var(--urgent)"
                          : selectedState.riskLevel === "High"
                          ? "var(--priority)"
                          : selectedState.riskLevel === "Moderate"
                          ? "var(--review)"
                          : "var(--routine)",
                    }}
                  >
                    <ShieldAlert className="h-3 w-3" />
                    {selectedState.riskLevel} Tier
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedState.region} Region</span>
                </div>
                <h3 className="font-display text-2xl font-extrabold text-foreground mt-1">
                  {selectedState.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Capital: <strong className="text-foreground font-semibold">{selectedState.capital}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground font-semibold">Official Code</span>
                <p className="font-mono text-xl font-black text-brand">{selectedState.code}</p>
              </div>
            </div>

            {/* Metric Breakdown Grid for Active Timeframe */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-muted-foreground block text-[11px]">NCRB Caseload:</span>
                <span className="font-display text-base font-bold text-foreground">
                  {activePeriod.totalCases.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-urgent/10 border border-urgent/30 text-urgent">
                <span className="block text-[11px] font-medium">Crisis Flags:</span>
                <span className="font-display text-base font-bold">
                  {activePeriod.urgentCases.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-brand/10 border border-brand/30 text-brand">
                <span className="block text-[11px] font-medium">Active SAATHI:</span>
                <span className="font-display text-base font-bold">
                  {activePeriod.saathiCases.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <span className="block text-[11px] font-medium">Tele-MANAS Calls:</span>
                <span className="font-display text-base font-bold">
                  {activePeriod.helplineCalls.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Resolution Rate & Response Time Indicators */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <span className="font-bold text-foreground">Resolution Rate: {activePeriod.resolutionRate}%</span>
                  <p className="text-[10px] text-muted-foreground">Successful safe handoffs</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-foreground">~{activePeriod.avgResponseMins} mins</span>
                <p className="text-[10px] text-muted-foreground">First responder speed</p>
              </div>
            </div>

            {/* State Nodal Officer & Flying Squads */}
            <div className="rounded-xl border border-border/70 p-3.5 bg-muted/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 text-brand" /> State Nodal Authority
                </span>
                <span className="text-[10px] font-semibold text-routine bg-routine/15 px-2 py-0.5 rounded">
                  181 Active 24x7
                </span>
              </div>
              <p className="text-[11px] text-foreground font-semibold">{selectedState.nodalOfficer}</p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <span>Direct Hotline: <strong className="text-foreground">{selectedState.nodalPhone}</strong></span>
                <span className="flex items-center gap-1 text-foreground font-medium">
                  <Car className="h-3 w-3 text-brand" /> {selectedState.activeFlyingSquads} Flying Squads
                </span>
              </div>
            </div>

            {/* High-Distress Districts Telemetry Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-brand" /> Key High-Distress Districts ({selectedState.districts.length})
                </p>
                <span className="text-[10px] text-muted-foreground">Triage Priority</span>
              </div>

              <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                {selectedState.districts.map((dist) => (
                  <div
                    key={dist.name}
                    className="flex items-center justify-between rounded-lg p-2.5 bg-muted/30 border border-border/50 text-xs hover:bg-muted/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{dist.name}</span>
                        {dist.trend === "up" ? (
                          <TrendingUp className="h-3 w-3 text-urgent" />
                        ) : dist.trend === "down" ? (
                          <TrendingDown className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Minus className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {dist.counsellors} counsellors assigned · {dist.resolutionRate}% resolution
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-urgent">{dist.urgentCases} Urgent</span>
                      <p className="text-[10px] text-muted-foreground">
                        of {dist.totalCases.toLocaleString("en-IN")} total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supervisor Emergency Actions Hub */}
          <div className="space-y-2 pt-3 border-t border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Supervisor Command Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDispatchSquad}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-urgent text-white hover:bg-urgent/90 transition-all shadow-xs"
              >
                <Car className="h-3.5 w-3.5" />
                Dispatch Flying Squad
              </button>

              <button
                onClick={handleBroadcastAlert}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand/10 text-brand border border-brand/30 hover:bg-brand hover:text-white transition-all shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Alert Nodal Cell
              </button>
            </div>

            <button
              onClick={handleExportDossier}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border/60"
            >
              <Download className="h-3 w-3" />
              Download State Dossier (.JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
