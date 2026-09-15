import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Monitor,
  Zap,
  Gauge,
  Activity,
  HardDrive,
  Layers,
  Sparkles,
  Share2,
  BookmarkPlus,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gamepad2,
  Search,
  Check,
  TrendingUp,
  Info,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { useAuth } from '../context/AuthContext';
import { CPU, GPU, RAM, Storage, ResolutionType, WorkloadType } from '../types';
import { ExportCardModal } from '../components/ExportCardModal';
import confetti from 'canvas-confetti';

export const PcDiagnosisView: React.FC = () => {
  const { cpus, gpus, rams, storages, psus, currentConfig, currentResult, updateConfig } = useHardware();
  const { saveDiagnosis, user } = useAuth();

  const [showExportModal, setShowExportModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Search and dropdown filter states
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [cpuFilterBrand, setCpuFilterBrand] = useState<'All' | 'AMD' | 'Intel'>('All');
  const [gpuFilterBrand, setGpuFilterBrand] = useState<'All' | 'NVIDIA' | 'AMD'>('All');

  // Filtered CPUs
  const filteredCpus = useMemo(() => {
    return cpus.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(cpuSearch.toLowerCase()) || c.socket.toLowerCase().includes(cpuSearch.toLowerCase());
      const matchBrand = cpuFilterBrand === 'All' || c.brand === cpuFilterBrand;
      return matchSearch && matchBrand;
    });
  }, [cpus, cpuSearch, cpuFilterBrand]);

  // Filtered GPUs
  const filteredGpus = useMemo(() => {
    return gpus.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(gpuSearch.toLowerCase());
      const matchBrand = gpuFilterBrand === 'All' || g.brand === gpuFilterBrand;
      return matchSearch && matchBrand;
    });
  }, [gpus, gpuSearch, gpuFilterBrand]);

  const handleSaveDiagnosis = () => {
    saveDiagnosis({
      title: `${currentConfig.cpu.name} + ${currentConfig.gpu.name} (${currentConfig.resolution.toUpperCase()})`,
      config: currentConfig,
      result: currentResult
    });
    setSavedSuccess(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const resolutions: { id: ResolutionType; label: string; sub: string }[] = [
    { id: '1080p', label: '1080p Full HD', sub: 'Carga alta en CPU / eSports' },
    { id: '1440p', label: '1440p Quad HD', sub: 'Equilibrio estándar Gaming' },
    { id: '4k', label: '4K Ultra HD', sub: 'Carga pesada en GPU' },
    { id: 'ultrawide', label: 'Ultrawide (21:9)', sub: '3440 x 1440p' }
  ];

  const workloads: { id: WorkloadType; label: string; icon: string }[] = [
    { id: 'gaming', label: 'Gaming AAA / eSports', icon: '🎮' },
    { id: 'streaming', label: 'Gaming + Streaming', icon: '📡' },
    { id: 'render3d', label: 'Renderizado 3D / Blender', icon: '🧊' },
    { id: 'video_edit', label: 'Edición de Video 4K', icon: '🎬' },
    { id: 'multitask', label: 'Programación & Multitarea', icon: '💻' }
  ];

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Activity className="w-4 h-4" /> Diagnóstico Integral de Hardware
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Medición de Cuello de Botella & Rendimiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Elige los componentes de tu setup y calcula el balance de FPS, Watts y recomendaciones.
          </p>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3">
          <button
            id="diag-save-btn"
            onClick={handleSaveDiagnosis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkPlus className="w-4 h-4 text-cyan-400" />}
            {savedSuccess ? '¡Guardado en Historial!' : (user ? 'Guardar en Cuenta' : 'Guardar Historial Local')}
          </button>

          <button
            id="diag-export-btn"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/20"
          >
            <Share2 className="w-4 h-4" />
            Exportar / Compartir
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Configuration, Right is Result Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT COLUMN: COMPONENT PICKERS (5 cols) --- */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* CPU Selection Card */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> PROCESADOR (CPU)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                {(['All', 'AMD', 'Intel'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setCpuFilterBrand(b)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      cpuFilterBrand === b ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={cpuSearch}
                onChange={(e) => setCpuSearch(e.target.value)}
                placeholder="Filtrar CPU (ej: 7800X3D, 14700K)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <select
              id="diag-select-cpu"
              value={currentConfig.cpu.id}
              onChange={(e) => {
                const found = cpus.find(c => c.id === e.target.value);
                if (found) updateConfig({ cpu: found });
              }}
              className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
            >
              {filteredCpus.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} • {c.cores} Cores / {c.threads} Threads • {c.tdp}W ({c.socket})
                </option>
              ))}
            </select>

            <div className="mt-3 p-2.5 bg-[#1C222D]/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Gaming: <strong className="text-cyan-400">{currentConfig.cpu.gamingScore}/100</strong></span>
              <span>Boost: <strong className="text-slate-200">{currentConfig.cpu.boostClock} GHz</strong></span>
              <span>TDP: <strong className="text-orange-400">{currentConfig.cpu.tdp}W</strong></span>
            </div>
          </div>

          {/* GPU Selection Card */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-400" /> TARJETA GRÁFICA (GPU)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                {(['All', 'NVIDIA', 'AMD'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setGpuFilterBrand(b)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      gpuFilterBrand === b ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={gpuSearch}
                onChange={(e) => setGpuSearch(e.target.value)}
                placeholder="Filtrar GPU (ej: RTX 5070 Ti, 4070 Super)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <select
              id="diag-select-gpu"
              value={currentConfig.gpu.id}
              onChange={(e) => {
                const found = gpus.find(g => g.id === e.target.value);
                if (found) updateConfig({ gpu: found });
              }}
              className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
            >
              {filteredGpus.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} • {g.vram}GB {g.vramType} • {g.tdp}W
                </option>
              ))}
            </select>

            <div className="mt-3 p-2.5 bg-[#1C222D]/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>1440p: <strong className="text-cyan-400">{currentConfig.gpu.score1440p}/100</strong></span>
              <span>4K: <strong className="text-blue-400">{currentConfig.gpu.score4k}/100</strong></span>
              <span>PSU Base: <strong className="text-orange-400">{currentConfig.gpu.recommendedPsu}W</strong></span>
            </div>
          </div>

          {/* RAM & Storage Selection */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-cyan-400" /> MEMORIA RAM
              </label>
              <select
                id="diag-select-ram"
                value={currentConfig.ram.id}
                onChange={(e) => {
                  const found = rams.find(r => r.id === e.target.value);
                  if (found) updateConfig({ ram: found });
                }}
                className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
              >
                {rams.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.capacityGb}GB {r.type} @ {r.speedMhz}MHz ({r.channels === 'dual' ? 'Dual Channel' : 'Single Channel'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-cyan-400" /> ALMACENAMIENTO (SSD)
              </label>
              <select
                id="diag-select-storage"
                value={currentConfig.storage.id}
                onChange={(e) => {
                  const found = storages.find(s => s.id === e.target.value);
                  if (found) updateConfig({ storage: found });
                }}
                className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
              >
                {storages.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.type} {s.capacityGb >= 1000 ? `${s.capacityGb / 1000}TB` : `${s.capacityGb}GB`} • ~{s.readSpeedMb} MB/s
                  </option>
                ))}
              </select>
            </div>

            {/* Fuente de Poder (PSU) que tiene el usuario */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> FUENTE DE PODER (TU FUENTE ACTUAL)
                </label>
                {currentConfig.psu && (
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    currentResult.powerStats.userPsuEvaluation?.status === 'optimal'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : currentResult.powerStats.userPsuEvaluation?.status === 'sufficient'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : currentResult.powerStats.userPsuEvaluation?.status === 'tight'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {currentConfig.psu.wattage}W • {currentConfig.psu.efficiency}
                  </span>
                )}
              </div>
              <select
                id="diag-select-psu"
                value={currentConfig.psu?.id || ''}
                onChange={(e) => {
                  const found = psus.find(p => p.id === e.target.value);
                  if (found) updateConfig({ psu: found });
                }}
                className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
              >
                {psus.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {currentResult.powerStats.userPsuEvaluation && (
                <p className={`mt-2 text-[11px] leading-relaxed ${
                  currentResult.powerStats.userPsuEvaluation.status === 'optimal'
                    ? 'text-emerald-400'
                    : currentResult.powerStats.userPsuEvaluation.status === 'sufficient'
                    ? 'text-cyan-400'
                    : currentResult.powerStats.userPsuEvaluation.status === 'tight'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {currentResult.powerStats.userPsuEvaluation.message}
                </p>
              )}
            </div>
          </div>

          {/* Resolution & Workload Config */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                RESOLUCIÓN DE PANTALLA
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {resolutions.map(r => (
                  <button
                    key={r.id}
                    id={`diag-res-btn-${r.id}`}
                    onClick={() => updateConfig({ resolution: r.id })}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      currentConfig.resolution === r.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/10'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                USO PRINCIPAL
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {workloads.map(w => (
                  <button
                    key={w.id}
                    id={`diag-workload-btn-${w.id}`}
                    onClick={() => updateConfig({ workload: w.id })}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      currentConfig.workload === w.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/10'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-sm">{w.icon}</span>
                    <span className="text-xs font-semibold">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: CALCULATION RESULTS & METRICS (7 cols) --- */}
        <div className="lg:col-span-7 space-y-5">

          {/* Main Bottleneck Gauge Card */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Cpu className="w-36 h-36 text-cyan-500" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  ESTADO DEL CUELLO DE BOTELLA
                </span>
                <h3 className="text-4xl font-black text-white mt-1.5 flex items-baseline gap-3">
                  {currentResult.bottleneckPct}%
                  <span className={`text-lg font-semibold ${
                    currentResult.severity === 'perfect' ? 'text-emerald-400' :
                    currentResult.severity === 'minor' ? 'text-cyan-400' :
                    currentResult.severity === 'moderate' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {currentResult.limitingFactor === 'Equilibrado' ? 'Equilibrado' : `Limitado por ${currentResult.limitingFactor}`}
                  </span>
                </h3>
              </div>
              
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border self-start sm:self-auto ${
                currentResult.severity === 'perfect'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : currentResult.severity === 'minor'
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  : currentResult.severity === 'moderate'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                {currentResult.severity === 'perfect' ? 'Óptimo' : 'Diagnóstico Activo'}
              </div>
            </div>

            {/* Gauge dual progress bar */}
            <div className="py-6">
              <div className="flex justify-between text-xs mb-2 text-slate-400 font-medium">
                <span>CPU Bound ({currentResult.technicalDetails.cpuLoadEst}%)</span>
                <span>GPU Bound ({currentResult.technicalDetails.gpuLoadEst}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full flex overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, currentResult.technicalDetails.cpuLoadEst))}%` }}
                />
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, currentResult.technicalDetails.gpuLoadEst))}%` }}
                />
              </div>
              <p className="text-xs mt-3 text-slate-400 leading-relaxed">
                {currentResult.summary}
              </p>
            </div>

            {/* Technical Balance Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-center">
              <div className="p-3 rounded-xl bg-[#1C222D]/70 border border-slate-700/50">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Carga CPU</div>
                <div className="text-sm font-black text-cyan-400 mt-0.5">{currentResult.technicalDetails.cpuLoadEst}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#1C222D]/70 border border-slate-700/50">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Carga GPU</div>
                <div className="text-sm font-black text-indigo-400 mt-0.5">{currentResult.technicalDetails.gpuLoadEst}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#1C222D]/70 border border-slate-700/50">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Impacto RAM</div>
                <div className="text-sm font-black text-slate-300 mt-0.5">{currentResult.technicalDetails.ramSpeedPenaltyPct}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#1C222D]/70 border border-slate-700/50">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Res. Óptima</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">{currentResult.technicalDetails.recommendedResolution}</div>
              </div>
            </div>
          </div>

          {/* Watts & Power Recommendation Card with Sleek Circular Gauge */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" /> CONSUMO ESTIMADO & FUENTE SUGERIDA
              </h3>
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Tolerancia +35%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1C222D] p-4 rounded-xl border border-slate-700/80 flex flex-col justify-between">
                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Consumo Nominal</div>
                <div className="my-2">
                  <div className="text-3xl font-black text-white">
                    {currentResult.powerStats.systemEstimatedWatts} <span className="text-xs font-normal text-slate-400">WATTS</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">CPU ({currentConfig.cpu.tdp}W) + GPU ({currentConfig.gpu.tdp}W)</div>
              </div>

              <div className="bg-[#1C222D] p-4 rounded-xl border border-slate-700/80 flex flex-col justify-between">
                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Picos Transitorios</div>
                <div className="my-2">
                  <div className="text-3xl font-black text-orange-400">
                    {currentResult.powerStats.peakSurgeWatts} <span className="text-xs font-normal text-slate-400">WATTS</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">Picos de carga (Spike protection)</div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-[#1C222D] p-4 rounded-xl border border-cyan-500/30 flex flex-col justify-between">
                <div className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider">Fuente Sugerida</div>
                <div className="my-2">
                  <div className="text-2xl font-black text-white">
                    {currentResult.powerStats.recommendedPsuWatts}W <span className="text-xs font-bold text-cyan-400">80+ Gold</span>
                  </div>
                </div>
                <div className="text-[10px] text-cyan-300 font-mono">{currentResult.powerStats.psuEfficiencyRating}</div>
              </div>
            </div>

            {/* Diagnóstico de la Fuente de Poder del Usuario */}
            {currentResult.powerStats.userPsuEvaluation && (
              <div className={`mt-4 p-4 rounded-xl border transition-all ${
                currentResult.powerStats.userPsuEvaluation.status === 'optimal'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : currentResult.powerStats.userPsuEvaluation.status === 'sufficient'
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : currentResult.powerStats.userPsuEvaluation.status === 'tight'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 shrink-0 ${
                      currentResult.powerStats.userPsuEvaluation.status === 'optimal'
                        ? 'text-emerald-400'
                        : currentResult.powerStats.userPsuEvaluation.status === 'sufficient'
                        ? 'text-cyan-400'
                        : currentResult.powerStats.userPsuEvaluation.status === 'tight'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Tu Fuente Seleccionada: {currentResult.powerStats.userPsuEvaluation.wattage}W ({currentResult.powerStats.userPsuEvaluation.efficiency})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      currentResult.powerStats.userPsuEvaluation.status === 'optimal'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : currentResult.powerStats.userPsuEvaluation.status === 'sufficient'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : currentResult.powerStats.userPsuEvaluation.status === 'tight'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {currentResult.powerStats.userPsuEvaluation.status === 'optimal' ? 'Óptima (Eficiente)'
                        : currentResult.powerStats.userPsuEvaluation.status === 'sufficient' ? 'Suficiente'
                        : currentResult.powerStats.userPsuEvaluation.status === 'tight' ? 'Al Límite en Picos'
                        : 'Insuficiente (Riesgo)'}
                    </span>
                    <span className="text-slate-400">
                      {currentResult.powerStats.userPsuEvaluation.loadPercentage}% Carga
                    </span>
                  </div>
                </div>

                {/* Barra de progreso de carga de la fuente */}
                <div className="w-full bg-[#1C222D] rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentResult.powerStats.userPsuEvaluation.status === 'optimal'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : currentResult.powerStats.userPsuEvaluation.status === 'sufficient'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : currentResult.powerStats.userPsuEvaluation.status === 'tight'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-rose-500 to-red-600'
                    }`}
                    style={{ width: `${Math.min(100, currentResult.powerStats.userPsuEvaluation.loadPercentage)}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-300 gap-1">
                  <span>{currentResult.powerStats.userPsuEvaluation.message}</span>
                  <span className="shrink-0 font-mono text-slate-400">
                    {currentResult.powerStats.userPsuEvaluation.headroomWatts >= 0
                      ? `Margen libre: +${currentResult.powerStats.userPsuEvaluation.headroomWatts}W`
                      : `Déficit continuo: ${currentResult.powerStats.userPsuEvaluation.headroomWatts}W`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FPS & Graphics Estimator Table */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" /> RENDIMIENTO ESTIMADO ({currentConfig.resolution.toUpperCase()})
              </h4>
              <span className="text-[10px] text-slate-400 uppercase font-mono">1% Lows Calibrados</span>
            </div>

            <div className="space-y-4">
              {currentResult.fpsEstimates.map((f, i) => {
                const percentage = Math.min(100, Math.max(15, (f.ultraFps / 240) * 100));
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1C222D] border border-slate-700/60 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 text-slate-300">
                      {f.game.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-200">{f.game}</span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-cyan-400 font-bold">{f.ultraFps} FPS</span>
                          <span className="text-[11px] text-emerald-400">1% Low: {f.onePercentLow}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#1C222D] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drivers & OS Recommendations */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-cyan-400" /> DIAGNÓSTICO DE DRIVERS & SISTEMA OPERATIVO
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              {currentResult.driverAdvice.map((adv, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#1C222D]/80 p-3 rounded-xl border border-slate-700/60">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Upgrade Path */}
          {currentResult.upgradeRecommendations.length > 0 && (
            <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> UPGRADE INTELIGENTE
              </h4>
              <div className="space-y-3">
                {currentResult.upgradeRecommendations.map((upg, i) => (
                  <div key={i} className="bg-gradient-to-br from-[#1C222D] to-transparent rounded-xl p-4 border border-slate-700/60 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0 mt-0.5">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase">
                            {upg.componentType}
                          </span>
                          <span className="text-sm font-bold text-white">Siguiente nivel: {upg.suggestedItem}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{upg.reason}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-emerald-400">+{upg.gainPercentage}%</span>
                      <div className="text-[10px] text-slate-500 uppercase">ganancia</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Export & Share Modal */}
      {showExportModal && (
        <ExportCardModal
          config={currentConfig}
          result={currentResult}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
