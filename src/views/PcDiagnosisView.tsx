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
  Search,
  Check,
  TrendingUp,
  Info,
  Sliders,
  Tv,
  Maximize2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Gamepad2,
  CheckCircle,
  Scan
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { useAuth } from '../context/AuthContext';
import { CPU, GPU, RAM, Storage, ResolutionType, WorkloadType, UpscalingTechnology, UpscalingMode } from '../types';
import { ExportCardModal } from '../components/ExportCardModal';
import { LiveAutoScannerModal } from '../components/LiveAutoScannerModal';
import { groupCpusByGeneration, getCpuGenerationMeta, KNOWN_CPU_GENERATIONS } from '../utils/cpuGenerations';
import { groupGpusByGeneration, getGpuGenerationMeta, KNOWN_GPU_GENERATIONS } from '../utils/gpuGenerations';
import confetti from 'canvas-confetti';

type WizardStep = 1 | 2 | 3 | 4;

export const PcDiagnosisView: React.FC = () => {
  const { cpus, gpus, rams, storages, psus, currentConfig, currentResult, updateConfig } = useHardware();
  const { saveDiagnosis, user } = useAuth();

  // Wizard Step State (1: CPU, 2: GPU, 3: Entorno & RAM, 4: Resultados)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showLiveScanner, setShowLiveScanner] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Search and filter states
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [cpuFilterBrand, setCpuFilterBrand] = useState<'All' | 'AMD' | 'Intel'>('All');
  const [cpuFilterGen, setCpuFilterGen] = useState<string>('All');
  const [gpuFilterBrand, setGpuFilterBrand] = useState<'All' | 'NVIDIA' | 'AMD' | 'Intel'>('All');
  const [gpuFilterGen, setGpuFilterGen] = useState<string>('All');

  // --- Step 1: Available CPU generations based on brand filter ---
  const availableCpuGenerations = useMemo(() => {
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
      return matchSearch && matchBrand && matchGen;
    });
  }, [cpus, cpuSearch, cpuFilterBrand, cpuFilterGen]);

  const cpuGroups = useMemo(() => {
    return groupCpusByGeneration(filteredCpus);
  }, [filteredCpus]);

  const currentCpuMeta = useMemo(() => {
    return getCpuGenerationMeta(currentConfig.cpu);
  }, [currentConfig.cpu]);

  // Popular CPU quick picks
  const popularCpus = useMemo(() => {
    const popularIds = ['cpu-7800x3d', 'cpu-i7-14700k', 'cpu-r5-7600x', 'cpu-i5-13600k', 'cpu-r9-9950x', 'cpu-cu9-285k'];
    return cpus.filter(c => popularIds.includes(c.id));
  }, [cpus]);

  // --- Step 2: Available GPU generations based on brand filter ---
  const availableGpuGenerations = useMemo(() => {
    return KNOWN_GPU_GENERATIONS.filter(g => {
      if (gpuFilterBrand === 'All') return true;
      return g.brand === gpuFilterBrand;
    });
  }, [gpuFilterBrand]);

  const filteredGpus = useMemo(() => {
    return gpus.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(gpuSearch.toLowerCase());
      const matchBrand = gpuFilterBrand === 'All' || g.brand === gpuFilterBrand;
      const genMeta = getGpuGenerationMeta(g);
      const matchGen = gpuFilterGen === 'All' || genMeta.id === gpuFilterGen;
      return matchSearch && matchBrand && matchGen;
    });
  }, [gpus, gpuSearch, gpuFilterBrand, gpuFilterGen]);

  const gpuGroups = useMemo(() => {
    return groupGpusByGeneration(filteredGpus);
  }, [filteredGpus]);

  const currentGpuMeta = useMemo(() => {
    return getGpuGenerationMeta(currentConfig.gpu);
  }, [currentConfig.gpu]);

  // Popular GPU quick picks
  const popularGpus = useMemo(() => {
    const popularIds = ['gpu-5090', 'gpu-4070-super', 'gpu-7800xt', 'gpu-4060', 'gpu-arc-b580', 'gpu-5080'];
    return gpus.filter(g => popularIds.includes(g.id));
  }, [gpus]);

  // --- Step 3: Resolutions & Workloads ---
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
        return;
      }
    } else {
      next = [...selectedWorkloads, id];
    }
    updateConfig({
      workloads: next,
      workload: next[0]
    });
  };

  const handleSaveDiagnosis = () => {
    saveDiagnosis({
      title: `${currentConfig.cpu.name} + ${currentConfig.gpu.name} (${currentConfig.resolution.toUpperCase()})`,
      config: currentConfig,
      result: currentResult
    });
    setSavedSuccess(true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Step metadata
  const stepsConfig = [
    { step: 1 as WizardStep, title: 'Procesador (CPU)', desc: 'Marca, generación y modelo', icon: Cpu },
    { step: 2 as WizardStep, title: 'Tarjeta Gráfica (GPU)', desc: 'Ensamblador, serie y modelo', icon: Monitor },
    { step: 3 as WizardStep, title: 'Entorno & Memoria', desc: 'Resolución, RAM y fuente', icon: Sliders },
    { step: 4 as WizardStep, title: 'Resultados del Análisis', desc: 'Cuello de botella, Watts y FPS', icon: Gauge }
  ];

  // Validation per step
  const isStepValid = (step: WizardStep): boolean => {
    switch (step) {
      case 1:
        return !!currentConfig.cpu && !!currentConfig.cpu.id;
      case 2:
        return !!currentConfig.gpu && !!currentConfig.gpu.id;
      case 3:
        return !!currentConfig.resolution && !!currentConfig.ram && !!currentConfig.ram.id;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleResetWizard = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Activity className="w-4 h-4" /> Diagnóstico Integral de Hardware
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Medición de Cuello de Botella & Rendimiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Formulario paso a paso para evaluar el balance de tu PC, cálculo de FPS, consumo en Watts y cuello de botella.
          </p>
        </div>

        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            id="diag-live-scan-btn"
            onClick={() => setShowLiveScanner(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-blue-500/20 hover:from-teal-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/10 group"
          >
            <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
            <span>Escanear mi PC actual</span>
          </button>

          <button
            id="diag-save-btn"
            onClick={handleSaveDiagnosis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkPlus className="w-4 h-4 text-cyan-400" />}
            {savedSuccess ? '¡Guardado!' : (user ? 'Guardar en Cuenta' : 'Guardar Historial')}
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

      {/* --- VISUAL WIZARD PROGRESS BAR & STEP INDICATOR --- */}
      <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-extrabold text-xs border border-cyan-500/30 uppercase tracking-wider font-mono">
              Paso {currentStep} de 4
            </span>
            <span className="text-sm font-bold text-white">
              {stepsConfig[currentStep - 1].title}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            {stepsConfig[currentStep - 1].desc}
          </span>
        </div>

        {/* Continuous progress bar line */}
        <div className="relative h-2 w-full bg-slate-800/90 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-400 transition-all duration-500 ease-out rounded-full shadow-sm shadow-cyan-500/50"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Step Nodes Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {stepsConfig.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            const isAllowedToJump = s.step <= currentStep || isStepValid(1);

            return (
              <button
                key={s.step}
                id={`wizard-step-pill-${s.step}`}
                disabled={!isAllowedToJump}
                onClick={() => {
                  if (s.step < currentStep || isStepValid(currentStep)) {
                    setCurrentStep(s.step);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                    : isCompleted
                    ? 'bg-[#1C222D] border-slate-700/80 text-slate-200 hover:border-slate-600'
                    : 'bg-[#151921]/60 border-slate-800/80 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/40'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Paso {s.step}
                  </div>
                  <div className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {s.title.split(' ')[0]} {s.title.includes('(') ? s.title.substring(s.title.indexOf('(')) : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- WIZARD CONTENT: CONDITIONAL STEP RENDERING --- */}
      <div className="transition-all duration-300 ease-in-out">
        
        {/* ========================================================================= */}
        {/* PASO 1: SELECCIÓN DEL PROCESADOR (CPU)                                   */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> Paso 1 de 4: Procesador
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  Elige la Marca, Generación y Modelo del Procesador (CPU)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  El procesador determinará la capacidad mononúcleo, frecuencias turbo y cálculo de cuello de botella frente a la gráfica.
                </p>
              </div>

              {/* Status pill */}
              <div className="self-start sm:self-auto px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
                CPU Seleccionada: {currentConfig.cpu.name}
              </div>
            </div>

            {/* Quick Auto-Scanner Banner for Step 1 (Zero-Install / In-Browser) */}
            <div className="bg-gradient-to-r from-[#141E2E] via-[#101926] to-[#0E1520] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-cyan-500/5">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5 shadow-sm">
                  <Scan className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Auto-Escáner en Vivo</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                        ZERO-INSTALL
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    ¿No recuerdas tus componentes? El navegador detectará tu tarjeta gráfica vía WebGL, hilos de CPU, RAM y pantalla automáticamente en 2 segundos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="step1-live-scan-btn"
                onClick={() => setShowLiveScanner(true)}
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Escanear mi PC actual</span>
              </button>
            </div>

            {/* 1.1 Brand Selection (AMD / Intel / All) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                1. Fabricante del Procesador:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  id="cpu-brand-btn-all"
                  onClick={() => {
                    setCpuFilterBrand('All');
                    setCpuFilterGen('All');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    cpuFilterBrand === 'All'
                      ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-md shadow-cyan-500/10'
                      : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-extrabold">Todas las Marcas</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">AMD Ryzen & Intel Core</div>
                </button>

                <button
                  type="button"
                  id="cpu-brand-btn-amd"
                  onClick={() => {
                    setCpuFilterBrand('AMD');
                    setCpuFilterGen('All');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    cpuFilterBrand === 'AMD'
                      ? 'bg-gradient-to-br from-red-600/25 to-orange-600/20 border-red-500 text-red-200 font-bold shadow-md shadow-red-500/10'
                      : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-extrabold flex items-center justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    AMD
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Ryzen 9000 / 7000 / 5000 / X3D</div>
                </button>

                <button
                  type="button"
                  id="cpu-brand-btn-intel"
                  onClick={() => {
                    setCpuFilterBrand('Intel');
                    setCpuFilterGen('All');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    cpuFilterBrand === 'Intel'
                      ? 'bg-gradient-to-br from-blue-600/25 to-cyan-600/20 border-blue-500 text-blue-200 font-bold shadow-md shadow-blue-500/10'
                      : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-extrabold flex items-center justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Intel
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Core Ultra 200S / 14va / 13va / 12va</div>
                </button>
              </div>
            </div>

            {/* 1.2 Generation & Search Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-5 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Búsqueda directa:
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={cpuSearch}
                    onChange={(e) => setCpuSearch(e.target.value)}
                    placeholder="Buscar por nombre o socket (ej: 7800X3D, AM5, 14700K)..."
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                  {cpuSearch && (
                    <button
                      onClick={() => setCpuSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-7">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Filtrar por Generación / Arquitectura ({availableCpuGenerations.length} disponibles):
                </label>
                <select
                  value={cpuFilterGen}
                  onChange={(e) => setCpuFilterGen(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="All">⚡ Todas las Generaciones de {cpuFilterBrand === 'All' ? 'CPUs' : cpuFilterBrand}</option>
                  {availableCpuGenerations.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1.3 Main CPU Selector Dropdown */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                Selecciona el Modelo Específico de CPU ({filteredCpus.length} resultados):
              </label>
              <select
                id="diag-select-cpu"
                value={currentConfig.cpu.id}
                onChange={(e) => {
                  const found = cpus.find(c => c.id === e.target.value);
                  if (found) updateConfig({ cpu: found });
                }}
                className="w-full px-4 py-3.5 bg-[#1C222D] border-2 border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-bold text-white cursor-pointer transition-all shadow-inner"
              >
                {cpuGroups.map(group => (
                  <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                    {group.cpus.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} • {c.cores}C/{c.threads}T • Boost {c.boostClock} GHz • {c.tdp}W ({c.socket})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* 1.4 Popular CPU Quick Pick Chips */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Opciones Populares / Recomendadas:
              </span>
              <div className="flex flex-wrap gap-2">
                {popularCpus.map(c => (
                  <button
                    key={c.id}
                    onClick={() => updateConfig({ cpu: c })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentConfig.cpu.id === c.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                        : 'bg-[#1C222D] text-slate-300 border-slate-700/80 hover:border-slate-500'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 1.5 Selected CPU Telemetry Card */}
            <div className="bg-[#1C222D] border border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {currentConfig.cpu.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                        {currentCpuMeta.shortLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Generación {currentCpuMeta.name} • Socket {currentConfig.cpu.socket} • Año {currentConfig.cpu.releaseYear}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                    Gaming Score: <strong className="text-cyan-400">{currentConfig.cpu.gamingScore}/100</strong>
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Núcleos / Hilos</span>
                  <span className="font-extrabold text-slate-200 mt-0.5 block font-mono">
                    {currentConfig.cpu.cores}C / {currentConfig.cpu.threads}T
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Frecuencias</span>
                  <span className="font-extrabold text-slate-200 mt-0.5 block font-mono">
                    {currentConfig.cpu.baseClock} - {currentConfig.cpu.boostClock} GHz
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Consumo Térmico</span>
                  <span className="font-extrabold text-orange-400 mt-0.5 block font-mono">
                    {currentConfig.cpu.tdp} Watts TDP
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Interfaz Bus</span>
                  <span className="font-extrabold text-cyan-400 mt-0.5 block font-mono">
                    PCIe Gen {currentConfig.cpu.pcieGen}.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: SELECCIÓN DE TARJETA GRÁFICA (GPU)                                */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" /> Paso 2 de 4: Tarjeta Gráfica
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  Elige el Ensamblador, Serie y Modelo de Tarjeta Gráfica (GPU)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Selecciona tu gráfica para calcular la potencia gráfica, ancho de banda de VRAM y balance de energía.
                </p>
              </div>

              {/* Status pill */}
              <div className="self-start sm:self-auto px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold">
                GPU Seleccionada: {currentConfig.gpu.name}
              </div>
            </div>

            {/* 2.1 Brand Selection (NVIDIA / AMD / Intel / All) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                1. Ensamblador / Fabricante de la Gráfica:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  id="gpu-brand-btn-all"
                  onClick={() => {
                    setGpuFilterBrand('All');
                    setGpuFilterGen('All');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gpuFilterBrand === 'All'
                      ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-md shadow-cyan-500/10'
                      : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-extrabold">Todos</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">NVIDIA, AMD & Intel</div>
                </button>

                <button
                  type="button"
                  id="gpu-brand-btn-nvidia"
                  onClick={() => {
                    setGpuFilterBrand('NVIDIA');
                    setGpuFilterGen('All');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gpuFilterBrand === 'NVIDIA'
                      ? 'bg-gradient-to-br from-emerald-600/25 to-teal-600/20 border-emerald-500 text-emerald-200 font-bold shadow-md shadow-emerald-500/10'
                      : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-extrabold flex items-center justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    NVIDIA GeForce
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">RTX 50 / 40 / 30 / GTX</div>
                </button>

                <button
                  type="button"
                  id="gpu-brand-btn-amd"
                  onClick={() => {
                    setGpuFilterBrand('AMD');
                    setGpuFilterGen('All');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gpuFilterBrand === 'AMD'
                      ? 'bg-gradient-to-br from-red-600/25 to-orange-600/20 border-red-500 text-red-200 font-bold shadow-md shadow-red-500/10'
                      : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-extrabold flex items-center justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    AMD Radeon
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">RX 7000 / 6000 / 5000</div>
                </button>

                <button
                  type="button"
                  id="gpu-brand-btn-intel"
                  onClick={() => {
                    setGpuFilterBrand('Intel');
                    setGpuFilterGen('All');
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gpuFilterBrand === 'Intel'
                      ? 'bg-gradient-to-br from-blue-600/25 to-indigo-600/20 border-blue-500 text-blue-200 font-bold shadow-md shadow-blue-500/10'
                      : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-extrabold flex items-center justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Intel Arc
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Battlemage & Alchemist</div>
                </button>
              </div>
            </div>

            {/* 2.2 Generation / Family & Search Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-5 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Búsqueda directa:
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={gpuSearch}
                    onChange={(e) => setGpuSearch(e.target.value)}
                    placeholder="Buscar modelo (ej: RTX 4070 SUPER, RX 7800 XT, B580)..."
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {gpuSearch && (
                    <button
                      onClick={() => setGpuSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-7">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Filtrar por Serie / Familia ({availableGpuGenerations.length} disponibles):
                </label>
                <select
                  value={gpuFilterGen}
                  onChange={(e) => setGpuFilterGen(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All">⚡ Todas las Familias de {gpuFilterBrand === 'All' ? 'Tarjetas Gráficas' : gpuFilterBrand}</option>
                  {availableGpuGenerations.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2.3 Main GPU Selector Dropdown */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                Selecciona el Modelo Específico de GPU ({filteredGpus.length} resultados):
              </label>
              <select
                id="diag-select-gpu"
                value={currentConfig.gpu.id}
                onChange={(e) => {
                  const found = gpus.find(g => g.id === e.target.value);
                  if (found) updateConfig({ gpu: found });
                }}
                className="w-full px-4 py-3.5 bg-[#1C222D] border-2 border-slate-700 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-bold text-white cursor-pointer transition-all shadow-inner"
              >
                {gpuGroups.map(group => (
                  <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                    {group.gpus.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} • {g.vram}GB {g.vramType} • {g.tdp}W TDP (Fuente recomendada: {g.recommendedPsu}W)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* 2.4 Popular GPU Quick Pick Chips */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Opciones Populares / Recomendadas:
              </span>
              <div className="flex flex-wrap gap-2">
                {popularGpus.map(g => (
                  <button
                    key={g.id}
                    onClick={() => updateConfig({ gpu: g })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentConfig.gpu.id === g.id
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500 font-bold shadow-sm'
                        : 'bg-[#1C222D] text-slate-300 border-slate-700/80 hover:border-slate-500'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2.5 Selected GPU Telemetry Card */}
            <div className="bg-[#1C222D] border border-blue-500/40 rounded-xl p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {currentConfig.gpu.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/30">
                        {currentGpuMeta.shortLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Arquitectura {currentGpuMeta.architecture} • Memoria {currentConfig.gpu.vram}GB {currentConfig.gpu.vramType} • Soporte: {currentConfig.gpu.dlssFsrSupport}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                    PSU Mínima: <strong className="text-orange-400">{currentConfig.gpu.recommendedPsu}W</strong>
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">VRAM Dedicada</span>
                  <span className="font-extrabold text-cyan-400 mt-0.5 block font-mono">
                    {currentConfig.gpu.vram} GB {currentConfig.gpu.vramType}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Consumo Gráfico</span>
                  <span className="font-extrabold text-orange-400 mt-0.5 block font-mono">
                    {currentConfig.gpu.tdp} Watts TDP
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Puntaje 1440p</span>
                  <span className="font-extrabold text-emerald-400 mt-0.5 block font-mono">
                    {currentConfig.gpu.score1440p} / 100
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151921] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Puntaje 4K</span>
                  <span className="font-extrabold text-indigo-400 mt-0.5 block font-mono">
                    {currentConfig.gpu.score4k} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: CONFIGURACIÓN DE ENTORNO (RESOLUCIÓN, MEMORIA RAM & PSU)          */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> Paso 3 de 4: Entorno & Memoria
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  Configura la Resolución, Memoria RAM y Entorno del Sistema
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Ajusta la resolución de pantalla, tipo de RAM y fuente de poder para obtener el diagnóstico exacto.
                </p>
              </div>

              {/* Status pill */}
              <div className="self-start sm:self-auto px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-bold font-mono">
                {currentConfig.resolution.toUpperCase()} • {currentConfig.ram.capacityGb}GB {currentConfig.ram.type}
              </div>
            </div>

            {/* 3.1 Display Output Resolution */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  1. Resolución de Pantalla (Impacto directo en carga CPU vs GPU):
                </label>
                {currentConfig.resolution === '8k' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-cyan-300 border border-cyan-500/50">
                    ✨ 33.2 Megapíxeles
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {resolutions.map(r => (
                  <button
                    key={r.id}
                    id={`diag-res-btn-${r.id}`}
                    onClick={() => updateConfig({ resolution: r.id })}
                    className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                      currentConfig.resolution === r.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {r.badge && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-cyan-600 text-[8px] font-black text-white px-2 py-0.5 rounded-bl">
                        {r.badge}
                      </div>
                    )}
                    <div className="text-sm font-bold">{r.label}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-1">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3.2 RAM Memory Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" /> 2. Memoria RAM:
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

                <div className="p-2.5 bg-[#1C222D]/80 rounded-xl border border-slate-700/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Capacidad: <strong className="text-white">{currentConfig.ram.capacityGb} GB</strong></span>
                  <span>Tipo: <strong className="text-cyan-400">{currentConfig.ram.type}</strong></span>
                  <span>Frecuencia: <strong className="text-white">{currentConfig.ram.speedMhz} MHz</strong></span>
                  <span>Latencia: <strong className="text-emerald-400">CL{currentConfig.ram.casLatency}</strong></span>
                </div>
              </div>

              {/* 3.3 Power Supply (PSU) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> 3. Fuente de Poder (PSU):
                  </label>
                  {currentConfig.psu && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
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
                  className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer transition-all"
                >
                  <optgroup label="─── FUENTES CORSAIR (RMx, SHIFT, HX PLATINUM) ───">
                    {psus.filter(p => p.brand === 'Corsair').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="─── FUENTES PREMIUM (ASUS ROG, SEASONIC, BE QUIET!) ───">
                    {psus.filter(p => p.brand && p.brand !== 'Corsair' && p.brand !== 'Genérica').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="─── REFERENCIA ESTÁNDAR ───">
                    {psus.filter(p => !p.brand || p.brand === 'Genérica').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <div className="p-2.5 bg-[#1C222D]/80 rounded-xl border border-slate-700/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Marca: <strong className="text-white">{currentConfig.psu?.brand || 'Genérica'}</strong></span>
                  <span>ATX 3.1: <strong className="text-cyan-400">{currentConfig.psu?.atx3 ? 'Sí (12V-2x6)' : 'No'}</strong></span>
                  <span>Modular: <strong className="text-slate-300">{currentConfig.psu?.modular || 'Estándar'}</strong></span>
                </div>
              </div>
            </div>

            {/* 3.4 Monitors & Upscaling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Monitors count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-cyan-400" /> Cantidad de Monitores:
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                    {(currentConfig.monitorCount || 1) === 1 ? '1 Pantalla' : `${currentConfig.monitorCount} Pantallas`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(count => (
                    <button
                      key={count}
                      onClick={() => updateConfig({ monitorCount: count })}
                      className={`py-2 px-1 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                        (currentConfig.monitorCount || 1) === count
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {count}x Pantallas
                    </button>
                  ))}
                </div>
              </div>

              {/* Upscaling */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Escalado Inteligente (DLSS / FSR):
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentConfig.upscalingMode === 'native' || !currentConfig.upscalingMode ? 'Nativo 100%' : 'Escalado'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['dlss', 'fsr', 'xess', 'none'] as const).map(tech => (
                    <button
                      key={tech}
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
                      className={`py-2 px-1 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                        tech === 'none'
                          ? currentConfig.upscalingMode === 'native'
                            ? 'bg-slate-700 border-slate-500 text-white'
                            : 'bg-[#1C222D] border-slate-700 text-slate-400'
                          : currentConfig.upscalingTech === tech && currentConfig.upscalingMode !== 'native'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {tech === 'dlss' ? 'DLSS' : tech === 'fsr' ? 'FSR' : tech === 'xess' ? 'XeSS' : 'Nativo'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3.5 Workloads / Uso Principal */}
            <div className="pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                Uso Principal de la PC:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {workloads.map(w => {
                  const isSelected = selectedWorkloads.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleToggleWorkload(w.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                          : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{w.icon}</span>
                        <span className="text-xs truncate">{w.label.split(' ')[0]}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary preview box before calculating */}
            <div className="p-4 bg-gradient-to-r from-[#1C222D] to-slate-900 border border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">Configuración lista para analizar:</span>
                <div className="text-slate-400 mt-0.5">
                  {currentConfig.cpu.name} + {currentConfig.gpu.name} • {currentConfig.ram.capacityGb}GB RAM • {currentConfig.resolution.toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                id="wizard-jump-calculate-btn"
                onClick={goToNextStep}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <span>Generar Resultados</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: RESULTADOS DEL ANÁLISIS (DASHBOARD COMPLETO)                       */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Top configuration recap banner with quick jump buttons */}
            <div className="bg-[#151921] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Diagnóstico Calculado</span>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  <strong>{currentConfig.cpu.name}</strong> + <strong>{currentConfig.gpu.name}</strong> • <strong>{currentConfig.resolution.toUpperCase()}</strong> • <strong>{currentConfig.ram.capacityGb}GB</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cambiar CPU
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cambiar GPU
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cambiar Entorno
                </button>
              </div>
            </div>

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
                <div className="h-3.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
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
                        ? `${currentResult.displayAnalysis.totalMonitors}x Pantallas`
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
                      {currentResult.displayAnalysis.renderScalePct}% nativo
                    </div>
                  </div>

                  <div className="bg-[#1C222D] p-3.5 rounded-xl border border-slate-700/80">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Demanda VRAM</div>
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
                      {currentResult.displayAnalysis.upscalingActive ? currentResult.displayAnalysis.upscalingName.split('(')[0] : 'Nativo'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {currentResult.displayAnalysis.multiMonitorOverheadWatts > 0 ? `+${currentResult.displayAnalysis.multiMonitorOverheadWatts}W pantallas` : '0W extra'}
                    </div>
                  </div>
                </div>

                {/* VRAM Saturation Progress Bar */}
                <div className="p-3.5 bg-[#1C222D]/80 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      Uso de Memoria Gráfica ({currentConfig.gpu.name}):
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

                  {currentResult.displayAnalysis.vramAlert && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{currentResult.displayAnalysis.vramAlert}</span>
                    </div>
                  )}
                </div>

                {/* Cable Recommendation */}
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>Cable de video aconsejado:</strong> {currentResult.displayAnalysis.cableRecommendation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Consumo Estimado & Fuente Sugerida (Power Stats) */}
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
                  <div className="text-[10px] text-slate-500">Protección contra micro-picos</div>
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

              {/* Evaluación de la Fuente del Usuario */}
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
                        Tu Fuente ({currentResult.powerStats.userPsuEvaluation.wattage}W {currentResult.powerStats.userPsuEvaluation.efficiency})
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
                  <Gamepad2 className="w-4 h-4 text-cyan-400" /> RENDIMIENTO ESTIMADO EN JUEGOS ({currentConfig.resolution.toUpperCase()})
                </h4>
                <span className="text-[10px] text-slate-400 uppercase font-mono">1% Lows Calibrados</span>
              </div>

              <div className="space-y-4">
                {currentResult.fpsEstimates.map((f, i) => {
                  const percentage = Math.min(100, Math.max(15, (f.ultraFps / 240) * 100));
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#1C222D] border border-slate-700/60 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 text-slate-300 font-mono">
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
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> UPGRADE INTELIGENTE SUGERIDO
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
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                              {upg.componentType}
                            </span>
                            <span className="text-sm font-bold text-white">Siguiente nivel: {upg.suggestedItem}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{upg.reason}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-sm font-black text-emerald-400">+{upg.gainPercentage}%</span>
                        <div className="text-[10px] text-slate-500 uppercase">ganancia</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Actions in Step 4 */}
            <div className="p-5 bg-[#151921] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetWizard}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C222D] hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Wizard (Paso 1)</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDiagnosis}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkPlus className="w-4 h-4 text-cyan-400" />}
                  <span>{savedSuccess ? '¡Guardado en Cuenta!' : 'Guardar Diagnóstico'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-cyan-600/20 uppercase tracking-wider"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Exportar Ficha / Compartir</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* --- PERSISTENT WIZARD BOTTOM NAVIGATION BAR --- */}
      <div className="sticky bottom-4 z-40 bg-[#0F1218]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
        {/* Previous Button */}
        <div>
          {currentStep > 1 ? (
            <button
              type="button"
              id="wizard-prev-btn"
              onClick={goToPrevStep}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-[#1C222D] hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Anterior</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
              Paso 1: Configuración de CPU
            </div>
          )}
        </div>

        {/* Center Live Config Pill */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-cyan-400 font-bold">{currentConfig.cpu.name.split(' ')[0]} {currentConfig.cpu.name.split(' ').slice(-1)[0]}</span>
          <span>•</span>
          <span className="text-blue-400 font-bold">{currentConfig.gpu.name.split(' ').slice(-2).join(' ')}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{currentConfig.resolution.toUpperCase()}</span>
          <span>•</span>
          <span className="text-purple-400 font-bold">{currentConfig.ram.capacityGb}GB RAM</span>
        </div>

        {/* Next / Action Button */}
        <div>
          {currentStep < 4 ? (
            <button
              type="button"
              id="wizard-next-btn"
              disabled={!isStepValid(currentStep)}
              onClick={goToNextStep}
              className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg ${
                isStepValid(currentStep)
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 cursor-pointer shadow-cyan-500/25 ring-1 ring-cyan-400/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{currentStep === 3 ? 'Analizar PC' : 'Siguiente'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              type="button"
              id="wizard-edit-btn"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Modificar Setup</span>
            </button>
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

      {/* Live In-Browser Auto-Scanner Modal */}
      <LiveAutoScannerModal
        isOpen={showLiveScanner}
        onClose={() => setShowLiveScanner(false)}
        onScanCompleted={(targetStep = 4) => {
          setCurrentStep(targetStep as WizardStep);
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
