import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Scan,
  Cpu,
  Monitor,
  Zap,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Radio,
  Check,
  Flame,
  Info
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { INITIAL_MOTHERBOARDS } from '../data/initialData';
import { CPU, GPU, RAM, ResolutionType, DiagnosisConfig } from '../types';
import { scanClientDevice, getCandidateCpusForThreads, DeviceScanResult } from '../utils/hardwareDetector';
import confetti from 'canvas-confetti';

interface LiveAutoScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanCompleted: (targetStep?: number) => void;
}

export const LiveAutoScannerModal: React.FC<LiveAutoScannerModalProps> = ({
  isOpen,
  onClose,
  onScanCompleted
}) => {
  const { cpus, gpus, rams, storages, psus, socs, updateConfig } = useHardware();

  // Scanning phases: 'scanning' (2.8s) | 'confirm_cpu' | 'ready'
  const [phase, setPhase] = useState<'scanning' | 'confirm_cpu'>('scanning');
  const [progress, setProgress] = useState(0);
  const [activeStepText, setActiveStepText] = useState('Iniciando sondas nativas de hardware...');
  const [scanResult, setScanResult] = useState<DeviceScanResult | null>(null);

  // Selected CPU for confirmation
  const [selectedCpu, setSelectedCpu] = useState<CPU | null>(null);
  const [candidateCpus, setCandidateCpus] = useState<CPU[]>([]);
  const [cpuSearchQuery, setCpuSearchQuery] = useState('');

  const scanTimerRef = useRef<NodeJS.Timeout[]>([]);

  const startScan = async () => {
    setPhase('scanning');
    setProgress(5);
    setScanResult(null);
    setSelectedCpu(null);

    // Clear previous timers
    scanTimerRef.current.forEach(clearTimeout);
    scanTimerRef.current = [];

    // Step 1: WebGL and WebGPU Context
    const t1 = setTimeout(() => {
      setProgress(25);
      setActiveStepText('Extrayendo WebGL UNMASKED_RENDERER_WEBGL y adaptadores WebGPU...');
    }, 450);

    // Step 2: CPU Threads & Concurrency
    const t2 = setTimeout(() => {
      setProgress(50);
      setActiveStepText('Leyendo concurrencia de hilos de CPU (navigator.hardwareConcurrency)...');
    }, 1100);

    // Step 3: Device Memory and Native Screen Resolution
    const t3 = setTimeout(() => {
      setProgress(75);
      setActiveStepText('Mapeando memoria RAM (navigator.deviceMemory) y resolución nativa...');
    }, 1750);

    // Step 4: Component Matching & Analysis
    const t4 = setTimeout(() => {
      setProgress(95);
      setActiveStepText('Emparejando componentes con la base de datos de EMBUDO.tech...');
    }, 2350);

    scanTimerRef.current = [t1, t2, t3, t4];

    try {
      // Execute genuine in-browser WebGL, WebGPU, and Navigator scan
      const result = await scanClientDevice(
        cpus,
        gpus,
        INITIAL_MOTHERBOARDS,
        rams,
        storages,
        psus,
        socs,
        false
      );

      // Finish scan at ~2.8 seconds for smooth UI feedback
      const finishTimer = setTimeout(() => {
        setProgress(100);
        setScanResult(result);

        // Fetch candidate CPUs matching detected thread count
        const candidates = getCandidateCpusForThreads(
          result.logicalThreads,
          cpus,
          result.deviceType === 'laptop'
        );
        setCandidateCpus(candidates);

        // Default pick: matched CPU from detector or first candidate
        const defaultPick = result.matchedCpu || candidates[0] || cpus[0];
        setSelectedCpu(defaultPick);

        setPhase('confirm_cpu');
      }, 2800);

      scanTimerRef.current.push(finishTimer);
    } catch (err) {
      console.error('[LiveAutoScanner] Error scanning device:', err);
      // Fallback
      setPhase('confirm_cpu');
    }
  };

  useEffect(() => {
    if (isOpen) {
      startScan();
    } else {
      scanTimerRef.current.forEach(clearTimeout);
      scanTimerRef.current = [];
    }
    return () => {
      scanTimerRef.current.forEach(clearTimeout);
      scanTimerRef.current = [];
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered CPUs if user searches
  const filteredSearchCpus = cpuSearchQuery.trim()
    ? cpus.filter((c) =>
        c.name.toLowerCase().includes(cpuSearchQuery.toLowerCase()) ||
        c.socket.toLowerCase().includes(cpuSearchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleApplyAndDeployResults = () => {
    if (!scanResult || !selectedCpu) return;

    // Apply entire detected and verified setup to hardware context
    updateConfig({
      platform: scanResult.deviceType === 'laptop' ? 'laptop' : 'desktop',
      cpu: selectedCpu,
      gpu: scanResult.matchedGpu,
      ram: scanResult.matchedRam,
      storage: scanResult.matchedStorage,
      psu: scanResult.matchedPsu,
      motherboard: scanResult.matchedMotherboard,
      resolution: scanResult.detectedResolution,
      os: scanResult.os === 'macOS' ? 'macOS' : scanResult.os === 'Linux' ? 'Linux' : 'Windows 11'
    });

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    onScanCompleted(4); // Immediately open Step 4 (Resultados del Análisis)
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0D1117] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/10 text-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121722]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono">
                  AUTO-ESCÁNER EN VIVO (ZERO-INSTALL)
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                  WEBGL • WEBGPU • NATIVO
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Detección Automática de Hardware
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ================================================================= */}
          {/* PHASE 1: SCANNING IN PROGRESS (2.8s)                             */}
          {/* ================================================================= */}
          {phase === 'scanning' && (
            <div className="py-8 px-4 text-center space-y-6">
              {/* Radar / Scanner Visual Animation */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping duration-1000" />
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" style={{ animationDuration: '1.2s' }} />
                
                <div className="w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Scan className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-white tracking-wide uppercase">
                  Escaneo de Hardware en Progreso...
                </h3>
                <p className="text-xs sm:text-sm text-cyan-300 font-mono mt-1 min-h-[20px] transition-all">
                  {activeStepText}
                </p>
              </div>

              {/* Glowing Progress Bar */}
              <div className="w-full max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 font-bold">
                  <span>Sondas WebGL / WebGPU</span>
                  <span className="text-cyan-400">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/60"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Zero install note */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                100% Seguro en tu Navegador • Sin descargas • Sin comandos PowerShell
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PHASE 2: RESULTS & SIMPLIFIED CPU CONFIRMATION                   */}
          {/* ================================================================= */}
          {phase === 'confirm_cpu' && scanResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Banner of Auto-Detected Components */}
              <div className="bg-[#141A25] border border-cyan-500/30 rounded-xl p-4 sm:p-5 shadow-lg">
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Componentes Auto-Detectados en tu Navegador:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* GPU Card */}
                  <div className="bg-[#1A2230] border border-cyan-500/20 rounded-xl p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tarjeta Gráfica (GPU)</div>
                      <div className="text-xs font-black text-white truncate" title={scanResult.matchedGpu.name}>
                        {scanResult.matchedGpu.name}
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                        {scanResult.matchedGpu.vram}GB {scanResult.matchedGpu.vramType} • WebGL
                      </div>
                    </div>
                  </div>

                  {/* RAM Card */}
                  <div className="bg-[#1A2230] border border-cyan-500/20 rounded-xl p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Memoria RAM</div>
                      <div className="text-xs font-black text-white truncate">
                        {scanResult.matchedRam.capacityGb} GB {scanResult.matchedRam.type}
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                        {scanResult.matchedRam.channels === 'dual' ? 'Dual Channel' : 'Sistema'}
                      </div>
                    </div>
                  </div>

                  {/* Resolution Card */}
                  <div className="bg-[#1A2230] border border-cyan-500/20 rounded-xl p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Pantalla & Monitor</div>
                      <div className="text-xs font-black text-white truncate">
                        {scanResult.detectedResolution.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                        {scanResult.screenWidth}x{scanResult.screenHeight}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simplified CPU Confirmation Step */}
              <div className="bg-[#141A25] border border-slate-700/80 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                        Confirma tu Modelo de Procesador (CPU)
                      </h4>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold border border-cyan-500/30">
                        {scanResult.logicalThreads} Núcleos / Hilos Lógicos
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Por políticas de privacidad de los navegadores, no es posible leer el nombre comercial de la CPU sin instalar software. Selecciona tu modelo exacto con 1 clic entre los más compatibles con {scanResult.logicalThreads} hilos:
                    </p>
                  </div>
                </div>

                {/* Candidate CPU Chips (1-Click Selection) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Opciones sugeridas para {scanResult.logicalThreads} hilos:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {candidateCpus.slice(0, 6).map((cpu) => {
                      const isSelected = selectedCpu?.id === cpu.id;
                      return (
                        <button
                          key={cpu.id}
                          type="button"
                          onClick={() => setSelectedCpu(cpu)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                              : 'bg-[#1A2230] border-slate-700 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-black truncate">{cpu.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-cyan-400 font-mono font-bold">{cpu.brand}</span>
                              <span>•</span>
                              <span>{cpu.cores}C/{cpu.threads}T</span>
                              <span>•</span>
                              <span>Socket {cpu.socket}</span>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-cyan-400 border-cyan-300 text-slate-950 font-black'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional CPU Search if model not in quick-picks */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={cpuSearchQuery}
                      onChange={(e) => setCpuSearchQuery(e.target.value)}
                      placeholder="¿Tienes otro modelo? Busca aquí (ej: 5600X, 13700K, 7800X3D)..."
                      className="w-full pl-9 pr-4 py-2 text-xs bg-[#1A2230] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Search dropdown results */}
                  {filteredSearchCpus.length > 0 && (
                    <div className="mt-2 bg-[#1A2230] border border-slate-700 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-800">
                      {filteredSearchCpus.map((cpu) => (
                        <button
                          key={cpu.id}
                          type="button"
                          onClick={() => {
                            setSelectedCpu(cpu);
                            setCpuSearchQuery('');
                          }}
                          className="w-full p-2.5 text-left text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold">{cpu.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {cpu.cores}C/{cpu.threads}T • {cpu.socket}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Cancel or Apply & Show Results */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  id="live-scanner-apply-btn"
                  onClick={handleApplyAndDeployResults}
                  disabled={!selectedCpu}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Aplicar y Ver Cuello de Botella en Vivo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
