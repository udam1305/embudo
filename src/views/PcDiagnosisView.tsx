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
  ChevronDown,
  Tv,
  Maximize2,
  LayoutGrid,
  Laptop,
  BatteryCharging,
  Thermometer
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { useAuth } from '../context/AuthContext';
import { CPU, GPU, RAM, Storage, ResolutionType, WorkloadType, UpscalingTechnology, UpscalingMode } from '../types';
import { ExportCardModal } from '../components/ExportCardModal';
import { groupCpusByGeneration, getCpuGenerationMeta, KNOWN_CPU_GENERATIONS } from '../utils/cpuGenerations';
import { groupGpusByGeneration, getGpuGenerationMeta, KNOWN_GPU_GENERATIONS } from '../utils/gpuGenerations';
import confetti from 'canvas-confetti';

export const PcDiagnosisView: React.FC = () => {
  const { cpus, gpus, rams, storages, psus, currentConfig, currentResult, updateConfig } = useHardware();
  const { saveDiagnosis, user } = useAuth();

  const [showExportModal, setShowExportModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Platform selection (Desktop PC vs Notebook/Laptop vs All)
  const isCurrentLaptop = Boolean(
    currentConfig.platform === 'laptop' ||
    currentConfig.cpu.platform === 'laptop' ||
    currentConfig.cpu.isLaptop
  );
  const [platformMode, setPlatformMode] = useState<'all' | 'desktop' | 'laptop'>(
    isCurrentLaptop ? 'laptop' : 'desktop'
  );

  const handleSwitchPlatform = (targetPlatform: 'desktop' | 'laptop') => {
    setPlatformMode(targetPlatform);
    if (targetPlatform === 'laptop') {
      const bestLaptopCpu = cpus.find(c => c.id === 'cpu-lap-r9-ai-hx370') || cpus.find(c => c.platform === 'laptop' || c.isLaptop) || cpus[0];
      const bestLaptopGpu = gpus.find(g => g.id === 'gpu-lap-4080') || gpus.find(g => g.platform === 'laptop' || g.isLaptop) || gpus[0];
      const laptopPsu = psus.find(p => p.id === 'psu-lap-280w-slim') || psus.find(p => p.brand === 'Laptop Original') || psus[0];
      updateConfig({
        platform: 'laptop',
        cpu: bestLaptopCpu,
        gpu: bestLaptopGpu,
        psu: laptopPsu
      });
    } else {
      const bestDesktopCpu = cpus.find(c => c.id === 'cpu-7800x3d') || cpus.find(c => c.platform !== 'laptop' && !c.isLaptop) || cpus[0];
      const bestDesktopGpu = gpus.find(g => g.id === 'gpu-5070ti') || gpus.find(g => g.platform !== 'laptop' && !g.isLaptop) || gpus[0];
      const desktopPsu = psus.find(p => p.id === 'psu-corsair-rm850x-shift') || psus[0];
      updateConfig({
        platform: 'desktop',
        cpu: bestDesktopCpu,
        gpu: bestDesktopGpu,
        psu: desktopPsu
      });
    }
  };

  // Search and dropdown filter states
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [cpuFilterBrand, setCpuFilterBrand] = useState<'All' | 'AMD' | 'Intel' | 'Apple'>('All');
  const [cpuFilterGen, setCpuFilterGen] = useState<string>('All');
  const [gpuFilterBrand, setGpuFilterBrand] = useState<'All' | 'NVIDIA' | 'AMD' | 'Apple'>('All');
  const [gpuFilterGen, setGpuFilterGen] = useState<string>('All');

  // Available CPU generations based on brand filter
  const availableGenerations = useMemo(() => {
    return KNOWN_CPU_GENERATIONS.filter(g => {
      if (cpuFilterBrand === 'All') return true;
      return g.brand === cpuFilterBrand;
    });
  }, [cpuFilterBrand]);

  // Filtered CPUs
  const filteredCpus = useMemo(() => {
    return cpus.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(cpuSearch.toLowerCase()) || 
                          c.socket.toLowerCase().includes(cpuSearch.toLowerCase());
      const matchBrand = cpuFilterBrand === 'All' || c.brand === cpuFilterBrand;
      const genMeta = getCpuGenerationMeta(c);
      const matchGen = cpuFilterGen === 'All' || genMeta.id === cpuFilterGen;
      
      const cIsLaptop = Boolean(
        c.platform === 'laptop' ||
        c.isLaptop ||
        genMeta.isLaptop ||
        c.socket.includes('BGA') ||
        c.socket.includes('FP') ||
        c.socket.includes('FL1') ||
        c.socket.includes('Apple')
      );
      const matchPlatform = platformMode === 'all' ? true : platformMode === 'laptop' ? cIsLaptop : !cIsLaptop;

      return matchSearch && matchBrand && matchGen && matchPlatform;
    });
  }, [cpus, cpuSearch, cpuFilterBrand, cpuFilterGen, platformMode]);

  // Grouped and sorted by generation
  const cpuGroups = useMemo(() => {
    return groupCpusByGeneration(filteredCpus);
  }, [filteredCpus]);

  const currentCpuMeta = useMemo(() => {
    return getCpuGenerationMeta(currentConfig.cpu);
  }, [currentConfig.cpu]);

  // Available GPU generations based on brand filter
  const availableGpuGenerations = useMemo(() => {
    return KNOWN_GPU_GENERATIONS.filter(g => {
      if (gpuFilterBrand === 'All') return true;
      return g.brand === gpuFilterBrand;
    });
  }, [gpuFilterBrand]);

  // Filtered GPUs
  const filteredGpus = useMemo(() => {
    return gpus.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(gpuSearch.toLowerCase());
      const matchBrand = gpuFilterBrand === 'All' || g.brand === gpuFilterBrand;
      const genMeta = getGpuGenerationMeta(g);
      const matchGen = gpuFilterGen === 'All' || genMeta.id === gpuFilterGen;

      const gIsLaptop = Boolean(
        g.platform === 'laptop' ||
        g.isLaptop ||
        genMeta.isLaptop ||
        g.name.toLowerCase().includes('laptop') ||
        g.name.toLowerCase().includes('mobile') ||
        g.id.startsWith('gpu-lap-') ||
        g.id.startsWith('gpu-apple-')
      );
      const matchPlatform = platformMode === 'all' ? true : platformMode === 'laptop' ? gIsLaptop : !gIsLaptop;

      return matchSearch && matchBrand && matchGen && matchPlatform;
    });
  }, [gpus, gpuSearch, gpuFilterBrand, gpuFilterGen, platformMode]);

  // Grouped and sorted GPUs by generation
  const gpuGroups = useMemo(() => {
    return groupGpusByGeneration(filteredGpus);
  }, [filteredGpus]);

  const currentGpuMeta = useMemo(() => {
    return getGpuGenerationMeta(currentConfig.gpu);
  }, [currentConfig.gpu]);

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

  const resolutions: { id: ResolutionType; label: string; sub: string; badge?: string }[] = [
    { id: '1080p', label: '1080p Full HD', sub: '1920x1080 • Carga alta CPU' },
    { id: '1440p', label: '1440p Quad HD', sub: '2560x1440 • Equilibrio Gaming' },
    { id: 'ultrawide', label: 'Ultrawide 21:9', sub: '3440x1440 • Inmersivo' },
    { id: '4k', label: '4K Ultra HD', sub: '3840x2160 • Carga Pesada GPU' },
    { id: '5k_ultrawide', label: '5K Dual QHD (32:9)', sub: '5120x1440 • Super Panorámico' },
    { id: '8k', label: '8K Ultra HD', sub: '7680x4320 • 33.2 Megapíxeles', badge: 'MÁXIMO 8K' }
  ];

  const workloads: { id: WorkloadType; label: string; icon: string }[] = [
    { id: 'gaming', label: 'Gaming AAA / eSports', icon: '🎮' },
    { id: 'streaming', label: 'Gaming + Streaming', icon: '📡' },
    { id: 'render3d', label: 'Renderizado 3D / Blender', icon: '🧊' },
    { id: 'video_edit', label: 'Edición de Video 4K', icon: '🎬' },
    { id: 'multitask', label: 'Programación & Multitarea', icon: '💻' }
  ];

  const selectedWorkloads: WorkloadType[] = (currentConfig.workloads && currentConfig.workloads.length > 0)
    ? currentConfig.workloads
    : [currentConfig.workload || 'gaming'];

  const handleToggleWorkload = (id: WorkloadType) => {
    let next: WorkloadType[];
    if (selectedWorkloads.includes(id)) {
      if (selectedWorkloads.length > 1) {
        next = selectedWorkloads.filter(w => w !== id);
      } else {
        return; // Conservar al menos una tarea seleccionada
      }
    } else {
      next = [...selectedWorkloads, id];
    }
    updateConfig({
      workloads: next,
      workload: next[0]
    });
  };

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
          
          {/* Platform / Form Factor Selector: Desktop PC vs Notebook/Laptop */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> TIPO DE SISTEMA / PLATAFORMA
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                platformMode === 'laptop'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : platformMode === 'desktop'
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {platformMode === 'laptop' ? '💻 Portátil / Notebook' : platformMode === 'desktop' ? '🖥️ Torre / Sobremesa' : '⚡ Todo el Catálogo'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                id="diag-platform-desktop"
                type="button"
                onClick={() => handleSwitchPlatform('desktop')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  platformMode === 'desktop'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold shadow-sm shadow-cyan-500/10'
                    : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-xs font-semibold">PC Torre</span>
                <span className="text-[9px] text-slate-400 font-normal">Sobremesa</span>
              </button>

              <button
                id="diag-platform-laptop"
                type="button"
                onClick={() => handleSwitchPlatform('laptop')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  platformMode === 'laptop'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-sm shadow-purple-500/10'
                    : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span className="text-xs font-semibold">Notebook</span>
                <span className="text-[9px] text-slate-400 font-normal">Laptop Portátil</span>
              </button>

              <button
                id="diag-platform-all"
                type="button"
                onClick={() => setPlatformMode('all')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  platformMode === 'all'
                    ? 'bg-slate-700/60 border-slate-500 text-white font-bold'
                    : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-xs font-semibold">Ambos</span>
                <span className="text-[9px] text-slate-400 font-normal">Ver Todos</span>
              </button>
            </div>
          </div>

          {/* CPU Selection Card */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> PROCESADOR (CPU)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                {(['All', 'AMD', 'Intel', 'Apple'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => {
                      setCpuFilterBrand(b);
                      setCpuFilterGen('All');
                    }}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      cpuFilterBrand === b ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={cpuSearch}
                  onChange={(e) => setCpuSearch(e.target.value)}
                  placeholder="Buscar modelo o socket..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <select
                value={cpuFilterGen}
                onChange={(e) => setCpuFilterGen(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="All">⚡ Todas las Generaciones</option>
                {availableGenerations.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.shortLabel}
                  </option>
                ))}
              </select>
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
              {cpuGroups.map(group => (
                <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                  {group.cpus.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.cores}C/{c.threads}T • {c.tdp}W ({c.socket})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="mt-3 p-2.5 bg-[#1C222D]/60 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20 text-[10px]">
                  {currentCpuMeta.shortLabel}
                </span>
                {(currentConfig.cpu.isLaptop || currentConfig.cpu.platform === 'laptop' || currentCpuMeta.isLaptop) && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30 text-[10px] flex items-center gap-1">
                    <Laptop className="w-2.5 h-2.5" /> Laptop
                  </span>
                )}
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300">{currentConfig.cpu.socket}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300">PCIe {currentConfig.cpu.pcieGen}.0</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300">{currentConfig.cpu.releaseYear}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>Gaming: <strong className="text-cyan-400">{currentConfig.cpu.gamingScore}/100</strong></span>
                <span>Boost: <strong className="text-slate-200">{currentConfig.cpu.boostClock} GHz</strong></span>
                <span>TDP: <strong className="text-orange-400">{currentConfig.cpu.tdp}W</strong></span>
              </div>
            </div>
          </div>

          {/* GPU Selection Card */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-400" /> TARJETA GRÁFICA (GPU)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                {(['All', 'NVIDIA', 'AMD', 'Apple'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => {
                      setGpuFilterBrand(b);
                      setGpuFilterGen('All');
                    }}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      gpuFilterBrand === b ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={gpuSearch}
                  onChange={(e) => setGpuSearch(e.target.value)}
                  placeholder="Buscar modelo (ej: RTX 4070, RX 6700)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <select
                value={gpuFilterGen}
                onChange={(e) => setGpuFilterGen(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="All">⚡ Todas las Familias ({filteredGpus.length})</option>
                {availableGpuGenerations.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.shortLabel}
                  </option>
                ))}
              </select>
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
              {gpuGroups.map(group => (
                <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                  {group.gpus.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} • {g.vram}GB {g.vramType} • {g.tdp}W
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="mt-3 p-2.5 bg-[#1C222D]/60 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20 text-[10px]">
                  {currentGpuMeta.shortLabel}
                </span>
                {(currentConfig.gpu.isLaptop || currentConfig.gpu.platform === 'laptop' || currentGpuMeta.isLaptop) && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30 text-[10px] flex items-center gap-1">
                    <Laptop className="w-2.5 h-2.5" /> Laptop TGP {currentConfig.gpu.tdp}W
                  </span>
                )}
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300">{currentConfig.gpu.vram}GB {currentConfig.gpu.vramType}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300">{currentConfig.gpu.releaseYear}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 text-[10px] truncate max-w-[150px] sm:max-w-none">{currentConfig.gpu.dlssFsrSupport}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>1080p: <strong className="text-emerald-400">{currentConfig.gpu.score1080p}/100</strong></span>
                <span>1440p: <strong className="text-cyan-400">{currentConfig.gpu.score1440p}/100</strong></span>
                <span>4K: <strong className="text-blue-400">{currentConfig.gpu.score4k}/100</strong></span>
                <span>PSU: <strong className="text-orange-400">{currentConfig.gpu.recommendedPsu}W</strong></span>
              </div>
            </div>
          </div>

          {/* RAM & Storage Selection */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> MEMORIA RAM
                </label>
                {currentConfig.ram.brand && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {currentConfig.ram.brand}
                  </span>
                )}
              </div>
              <select
                id="diag-select-ram"
                value={currentConfig.ram.id}
                onChange={(e) => {
                  const found = rams.find(r => r.id === e.target.value);
                  if (found) updateConfig({ ram: found });
                }}
                className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
              >
                <optgroup label="─── CORSAIR DOMINATOR & VENGEANCE HIGH-END ───">
                  {rams.filter(r => r.brand === 'Corsair').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name || `${r.capacityGb}GB ${r.type}`} • {r.speedMhz}MHz (CL{r.casLatency})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="─── G.SKILL & OTRAS MARCAS PREMIUM ───">
                  {rams.filter(r => r.brand && r.brand !== 'Corsair').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name || `${r.capacityGb}GB ${r.type}`} • {r.speedMhz}MHz (CL{r.casLatency})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="─── KITS ESTÁNDAR / REFERENCIA JEDEC ───">
                  {rams.filter(r => !r.brand).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name || `${r.capacityGb}GB ${r.type} @ ${r.speedMhz}MHz`}
                    </option>
                  ))}
                </optgroup>
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

            {/* Fuente de Poder (PSU) o Cargador de Laptop */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {isCurrentLaptop ? 'ALIMENTACIÓN / CARGADOR LAPTOP' : 'FUENTE DE PODER (PSU ACTUAL)'}
                </label>
                {currentConfig.psu && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentConfig.psu.brand === 'Corsair' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        CORSAIR
                      </span>
                    )}
                    {currentConfig.psu.brand === 'Laptop Original' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        LAPTOP ADAPTER
                      </span>
                    )}
                    {currentConfig.psu.atx3 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                        ATX 3.1
                      </span>
                    )}
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
                  </div>
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
                {/* Si es laptop, poner los cargadores de laptop arriba */}
                {psus.some(p => p.brand === 'Laptop Original') && (
                  <optgroup label="─── CARGADORES / ADAPTADORES DE NOTEBOOK ───">
                    {psus.filter(p => p.brand === 'Laptop Original').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="─── FUENTES CORSAIR (SHIFT, HX PLATINUM, AX TITANIUM & RM) ───">
                  {psus.filter(p => p.brand === 'Corsair').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="─── FUENTES PREMIUM (ASUS ROG, SEASONIC, BE QUIET!, MSI) ───">
                  {psus.filter(p => p.brand && p.brand !== 'Corsair' && p.brand !== 'Genérica' && p.brand !== 'Laptop Original').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="─── REFERENCIA ESTÁNDAR & FUENTES BÁSICAS ───">
                  {psus.filter(p => !p.brand || p.brand === 'Genérica').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>

              {currentConfig.psu && (
                <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-400 font-mono">
                  {currentConfig.psu.tier && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-sans font-semibold text-[10px]">
                      {currentConfig.psu.tier}
                    </span>
                  )}
                  {currentConfig.psu.modular && (
                    <span className="text-slate-400">
                      • {currentConfig.psu.modular}
                    </span>
                  )}
                  {currentConfig.psu.atx3 && (
                    <span className="text-cyan-400 font-semibold">
                      • Cable 12V-2x6 Nativo (RTX 40/50 Ready)
                    </span>
                  )}
                </div>
              )}
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

          {/* Multi-Monitor, 8K Resolution & Upscaling Config */}
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            {/* 1. Multi-Monitor Setup */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" /> CANTIDAD DE MONITORES
                </label>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                  {(currentConfig.monitorCount || 1) === 1 ? '1 Pantalla' : `${currentConfig.monitorCount} Pantallas Activas`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(count => (
                  <button
                    key={count}
                    id={`diag-monitor-btn-${count}`}
                    onClick={() => updateConfig({ monitorCount: count })}
                    className={`py-2 px-1 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                      (currentConfig.monitorCount || 1) === count
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/10'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Tv className="w-3 h-3" />
                      <span>{count}x</span>
                    </div>
                    <div className="text-[9px] font-normal text-slate-400 truncate">
                      {count === 1 ? 'Individual' : `${count} Monitores`}
                    </div>
                  </button>
                ))}
              </div>

              {/* Mode if > 1 monitor */}
              {(currentConfig.monitorCount || 1) > 1 && (
                <div className="mt-2.5 p-2.5 bg-[#1C222D]/90 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Modo de uso con {currentConfig.monitorCount} pantallas:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="diag-monitor-mode-primary"
                      onClick={() => updateConfig({ monitorMode: 'gaming_primary' })}
                      className={`p-2 rounded-lg text-left border text-xs cursor-pointer transition-all ${
                        (currentConfig.monitorMode || 'gaming_primary') === 'gaming_primary'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-[#151921] border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs">🎮 Juego + Multitarea</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">Juego en 1 + Discord/OBS en secundarias</div>
                    </button>

                    <button
                      id="diag-monitor-mode-surround"
                      onClick={() => updateConfig({ monitorMode: 'surround_span' })}
                      className={`p-2 rounded-lg text-left border text-xs cursor-pointer transition-all ${
                        currentConfig.monitorMode === 'surround_span'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-[#151921] border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs">🏎️ Surround Panorámico</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">Juego unificado a lo ancho (Simuladores)</div>
                    </button>
                  </div>
                </div>
              )}

              {isCurrentLaptop && (
                <div className="mt-2.5 text-[11px] text-purple-300 bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/40 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong>Configuración Notebook:</strong> 1 pantalla interna integrada + {(currentConfig.monitorCount || 1) - 1 > 0 ? `${(currentConfig.monitorCount || 1) - 1} monitor(es) externo(s)` : 'monitores externos'} conectados por HDMI 2.1 o USB-C DisplayPort (hasta 8K a 60Hz).
                  </span>
                </div>
              )}
            </div>

            {/* 2. Output Resolution (Up to 8K) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                  RESOLUCIÓN DE PANTALLA (HASTA 8K ULTRA HD)
                </label>
                {currentConfig.resolution === '8k' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-cyan-300 border border-cyan-500/50">
                    ✨ 33.2 Megapíxeles
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {resolutions.map(r => (
                  <button
                    key={r.id}
                    id={`diag-res-btn-${r.id}`}
                    onClick={() => updateConfig({ resolution: r.id })}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                      currentConfig.resolution === r.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/10'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {r.badge && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-cyan-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-bl">
                        {r.badge}
                      </div>
                    )}
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Upscaling Technologies & Modes (DLSS / FSR / XeSS) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> ESCALADO INTELIGENTE (DLSS / FSR / XeSS)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentConfig.upscalingMode === 'native' || !currentConfig.upscalingMode ? 'Nativo 100%' : 'Escalado Activo'}
                </span>
              </div>

              {/* Technology selector */}
              <div className="grid grid-cols-4 gap-2 mb-2.5">
                {(['dlss', 'fsr', 'xess', 'none'] as const).map(tech => (
                  <button
                    key={tech}
                    id={`diag-tech-btn-${tech}`}
                    onClick={() => {
                      if (tech === 'none') {
                        updateConfig({ upscalingMode: 'native' });
                      } else {
                        updateConfig({
                          upscalingTech: tech,
                          upscalingMode: currentConfig.upscalingMode === 'native' ? 'quality' : currentConfig.upscalingMode
                        });
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                      tech === 'none'
                        ? currentConfig.upscalingMode === 'native'
                          ? 'bg-slate-700 border-slate-500 text-white'
                          : 'bg-[#1C222D] border-slate-800 text-slate-400'
                        : currentConfig.upscalingTech === tech && currentConfig.upscalingMode !== 'native'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {tech === 'dlss' ? 'NVIDIA DLSS' : tech === 'fsr' ? 'AMD FSR' : tech === 'xess' ? 'Intel XeSS' : 'Off (Nativo)'}
                  </button>
                ))}
              </div>

              {/* Mode selector (Quality, Balanced, Performance, Ultra Perf) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'native' as UpscalingMode, label: 'Nativo', sub: '100% Render' },
                  { id: 'quality' as UpscalingMode, label: 'Calidad', sub: '67% Render' },
                  { id: 'balanced' as UpscalingMode, label: 'Equilibrado', sub: '58% Render' },
                  { id: 'performance' as UpscalingMode, label: 'Rendimiento', sub: '50% Render' },
                  { id: 'ultra_performance' as UpscalingMode, label: 'Ultra Rend.', sub: '33% (8K Ideal)', highlight: true }
                ].map(mode => (
                  <button
                    key={mode.id}
                    id={`diag-upscale-mode-${mode.id}`}
                    onClick={() => updateConfig({ upscalingMode: mode.id })}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      (currentConfig.upscalingMode || 'native') === mode.id
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                        : mode.highlight
                        ? 'bg-[#1C222D] border-purple-800/60 text-purple-300 hover:border-purple-600'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-[11px] font-bold leading-tight">{mode.label}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">{mode.sub}</div>
                  </button>
                ))}
              </div>

              {/* Live Render Scale Info Chip */}
              {currentResult.displayAnalysis && (
                <div className="mt-2.5 p-2.5 bg-[#1C222D]/70 rounded-xl border border-slate-700/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-slate-300">
                      Render interno: <strong className="text-white font-mono">{currentResult.displayAnalysis.internalRenderResolutionLabel}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-slate-400">➔ Salida:</span>
                    <strong className="text-cyan-300 font-semibold">{currentResult.displayAnalysis.outputResolutionLabel.split(' ')[0]}</strong>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                      {currentResult.displayAnalysis.renderScalePct}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Main Workloads */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                  USO PRINCIPAL (MULTIELECCIÓN)
                </label>
                <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {selectedWorkloads.length} seleccionada{selectedWorkloads.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {workloads.map(w => {
                  const isSelected = selectedWorkloads.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      id={`diag-workload-btn-${w.id}`}
                      onClick={() => handleToggleWorkload(w.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/10'
                          : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{w.icon}</span>
                        <span className="text-xs font-semibold">{w.label}</span>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ml-1 ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800/60'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
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

          {/* Dedicated Display, Multi-Monitor & VRAM Analysis Card */}
          {currentResult.displayAnalysis && (
            <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" /> ANÁLISIS DE PANTALLAS, ESCALADO & VRAM
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 font-bold">
                    {currentResult.displayAnalysis.totalMonitors > 1
                      ? `${currentResult.displayAnalysis.totalMonitors}x Pantallas (${currentResult.displayAnalysis.mode === 'surround_span' ? 'Surround' : 'Multitarea'})`
                      : 'Monitor Único'}
                  </span>
                  {currentConfig.resolution === '8k' && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-sm">
                      8K Ultra HD
                    </span>
                  )}
                </div>
              </div>

              {/* Metric indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Resolución Salida</div>
                  <div className="text-xs font-bold text-white mt-1 truncate">
                    {currentResult.displayAnalysis.outputResolutionLabel.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                    {currentResult.displayAnalysis.totalPixelsMegaPixels} Megapíxeles
                  </div>
                </div>

                <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Render Interno</div>
                  <div className="text-xs font-bold text-white mt-1 font-mono">
                    {currentResult.displayAnalysis.internalRenderResolutionLabel}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {currentResult.displayAnalysis.renderScalePct}% píxeles nativos
                  </div>
                </div>

                <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Demanda de VRAM</div>
                  <div className="text-sm font-black text-white mt-0.5 flex items-baseline gap-1">
                    <span>{currentResult.displayAnalysis.vramEstimatedUsageGb} GB</span>
                    <span className="text-[10px] text-slate-400 font-normal">/ {currentResult.displayAnalysis.vramCapacityGb} GB</span>
                  </div>
                  <div className={`text-[10px] font-bold font-mono mt-0.5 ${
                    currentResult.displayAnalysis.vramSaturationPct > 100 ? 'text-rose-400' :
                    currentResult.displayAnalysis.vramSaturationPct > 85 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {currentResult.displayAnalysis.vramSaturationPct}% de VRAM
                  </div>
                </div>

                <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Modo Escalado</div>
                  <div className="text-xs font-bold text-cyan-300 mt-1 truncate">
                    {currentResult.displayAnalysis.upscalingActive ? currentResult.displayAnalysis.upscalingName.split('(')[0] : 'Nativo (Sin Escalado)'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {currentResult.displayAnalysis.multiMonitorOverheadWatts > 0 ? `+${currentResult.displayAnalysis.multiMonitorOverheadWatts}W pantallas` : '0W adicional'}
                  </div>
                </div>
              </div>

              {/* VRAM Saturation Progress Bar */}
              <div className="p-3.5 bg-[#1C222D]/80 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <span>Uso de Memoria Gráfica ({currentConfig.gpu.name}):</span>
                  </span>
                  <span className={`font-mono font-bold ${
                    currentResult.displayAnalysis.vramSaturationPct > 100 ? 'text-rose-400' :
                    currentResult.displayAnalysis.vramSaturationPct > 85 ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {currentResult.displayAnalysis.vramEstimatedUsageGb} GB de {currentResult.displayAnalysis.vramCapacityGb} GB ({currentResult.displayAnalysis.vramSaturationPct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentResult.displayAnalysis.vramSaturationPct > 100
                        ? 'bg-gradient-to-r from-rose-500 to-red-600'
                        : currentResult.displayAnalysis.vramSaturationPct > 85
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, currentResult.displayAnalysis.vramSaturationPct)}%` }}
                  />
                </div>

                {/* VRAM Alert if any */}
                {currentResult.displayAnalysis.vramAlert && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{currentResult.displayAnalysis.vramAlert}</span>
                  </div>
                )}
              </div>

              {/* Cable & Bandwidth Recommendation Banner */}
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span><strong>Cable/Puerto de video aconsejado:</strong> {currentResult.displayAnalysis.cableRecommendation}</span>
                </div>
              </div>
            </div>
          )}

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

          {/* Notebook / Laptop Hardware & Thermal Analysis Card */}
          {isCurrentLaptop && (
            <div className="bg-[#151921] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-purple-300 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-purple-400" /> ANÁLISIS DE HARDWARE MÓVIL & TÉRMICA DE NOTEBOOK
                </h4>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/80 font-bold">
                  Chasis Portátil Optimizado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> TGP / Balance Móvil
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    {currentConfig.gpu.tdp}W TGP Máximo
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Dynamic Boost / SmartShift distribuye Watts dinámicamente entre CPU y GPU.
                  </div>
                </div>

                <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Gestión Térmica
                  </div>
                  <div className="text-xs font-bold text-cyan-300 mt-1">
                    {currentConfig.cpu.tdp + currentConfig.gpu.tdp > 160 ? 'Perfil Turbo / Ventiladores Altos' : 'Térmica Silenciosa / Equilibrada'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Disipación dual con heatpipes y cámara de vapor diseñada para chasis compacto.
                  </div>
                </div>

                <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Switch MUX / Optimus
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-1">
                    Advanced Optimus Ready
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Acceso directo de dGPU a pantalla y salida a múltiples monitores externos (hasta 8K).
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Recomendación para Notebook:</strong> Las CPUs y GPUs móviles operan de forma segura hasta 95°C bajo carga extrema. Para jugar a altas tasas de cuadros por segundo o conectar 1 a 4 monitores externos (incluyendo resoluciones 4K u 8K), mantén siempre el cargador conectado a la red eléctrica para desbloquear el 100% de potencia gráfica.
                </span>
              </div>
            </div>
          )}

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
