import React, { useState, useEffect } from 'react';
import {
  X,
  Scan,
  Cpu,
  Monitor,
  Zap,
  Laptop,
  Smartphone,
  CheckCircle2,
  HardDrive,
  Layers,
  BatteryCharging,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Terminal,
  ShieldCheck,
  AlertCircle,
  Mic,
  Volume2,
  Camera,
  Check,
  Lock,
  Server
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import {
  scanClientDevice,
  parseSystemInfoText,
  DeviceScanResult,
  requestHardwareDevicePermissions
} from '../utils/hardwareDetector';
import confetti from 'canvas-confetti';

interface DeviceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAndNavigate: (targetTab: 'pc-diag' | 'smartphones') => void;
}

export const DeviceScannerModal: React.FC<DeviceScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyAndNavigate
}) => {
  const { cpus, gpus, motherboards, rams, storages, psus, socs, updateConfig } = useHardware();

  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [manualOs, setManualOs] = useState<'mac' | 'windows'>('mac');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState<DeviceScanResult | null>(null);
  const [requestingPerms, setRequestingPerms] = useState(false);

  // Manual / DxDiag / system_profiler paste tab
  const [pastedText, setPastedText] = useState('');
  const [manualParsed, setManualParsed] = useState<any>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const scanSteps = [
    'Inicializando sondas de aceleración gráfica WebGL y WebGPU...',
    'Inspeccionando adaptadores de video y arquitectura GPU...',
    'Verificando concurrencia de núcleos de CPU y memoria de sistema...',
    'Consultando dispositivos y periféricos de hardware del sistema...',
    'Evaluando cuota de almacenamiento SSD y resolución de pantalla...',
    'Emparejando CPU, GPU, Placa Base, RAM y SSD con la base de datos...'
  ];

  const handleRunScan = async (withPermissions = false) => {
    setIsScanning(true);
    setScanResult(null);
    setScanStep(0);

    for (let i = 0; i < scanSteps.length; i++) {
      setScanStep(i);
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      const res = await scanClientDevice(
        cpus,
        gpus,
        motherboards,
        rams,
        storages,
        psus,
        socs,
        withPermissions
      );
      setScanResult(res);
    } catch (err: any) {
      console.error('[DeviceScanner] Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanWithPermissions = async () => {
    setRequestingPerms(true);
    await handleRunScan(true);
    setRequestingPerms(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleRunScan(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyHardware = () => {
    if (!scanResult) return;

    if (scanResult.deviceType === 'smartphone') {
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch {}
      onApplyAndNavigate('smartphones');
      onClose();
      return;
    }

    // Apply Desktop or Laptop (including MacBook) complete configuration
    updateConfig({
      platform: scanResult.deviceType,
      cpu: scanResult.matchedCpu,
      gpu: scanResult.matchedGpu,
      motherboard: scanResult.matchedMotherboard,
      ram: scanResult.matchedRam,
      storage: scanResult.matchedStorage,
      psu: scanResult.matchedPsu,
      resolution: scanResult.detectedResolution,
      os: scanResult.os === 'macOS' ? 'macOS' : scanResult.os === 'Linux' ? 'Linux' : 'Windows 11'
    });

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    onApplyAndNavigate('pc-diag');
    onClose();
  };

  const handleManualParse = () => {
    if (!pastedText.trim()) return;
    const parsed = parseSystemInfoText(pastedText, cpus, gpus, motherboards, rams, storages);
    setManualParsed(parsed);
  };

  const handleApplyManual = () => {
    if (!manualParsed) return;
    const isLap = Boolean(manualParsed.detectedMacModel?.includes('MacBook'));
    const matchedG = manualParsed.matchedGpu || gpus[0];
    const targetWatts = matchedG?.recommendedPsu || 750;
    const matchedPsu = isLap
      ? psus.find(p => p.brand === 'Laptop Original') || psus[0]
      : psus.find(p => p.brand !== 'Laptop Original' && p.wattage >= targetWatts && p.efficiency.includes('Gold')) || psus[0];

    updateConfig({
      platform: isLap ? 'laptop' : 'desktop',
      deviceType: isLap ? 'laptop' : 'desktop',
      cpu: manualParsed.matchedCpu || cpus[0],
      gpu: matchedG,
      motherboard: manualParsed.matchedMotherboard || motherboards[0],
      ram: manualParsed.matchedRam || rams[0],
      storage: manualParsed.matchedStorage || storages[0],
      psu: matchedPsu,
      os: manualParsed.detectedMacModel ? 'macOS' : 'Windows 11'
    });
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}
    onApplyAndNavigate('pc-diag');
    onClose();
  };

  const macCommand = `system_profiler SPHardwareDataType SPDisplaysDataType SPStorageDataType | grep -E "Model Name|Chip|Total Number of Cores|Memory|Resolution|Media Name"`;
  const psCommand = `"CPU: " + (Get-CimInstance Win32_Processor).Name; "GPU: " + ((Get-CimInstance Win32_VideoController).Name -join ", "); "Placa: " + (Get-CimInstance Win32_BaseBoard).Product; "RAM: " + [math]::Round(((Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum / 1GB)) + " GB"; "Disco: " + ((Get-CimInstance Win32_DiskDrive | Select-Object -First 1).Model + " " + [math]::Round((Get-CimInstance Win32_DiskDrive | Select-Object -First 1).Size / 1GB) + " GB")`;

  const currentCmd = manualOs === 'mac' ? macCommand : psCommand;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(currentCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#121620] border border-slate-700/80 rounded-2xl shadow-2xl text-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800 bg-[#161B26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  AUTO-DETECCIÓN DE HARDWARE & COMPONENTES COMPLETOS
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                  CPU • GPU • RAM • PLACA • SSD
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Escanear Mi Dispositivo (MacBook, PC o Teléfono)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-5 sm:px-7 pt-4 border-b border-slate-800/80 bg-[#141822]">
          <button
            onClick={() => setActiveTab('auto')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'auto'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Escaneo Automático por Navegador</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'manual'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Terminal Mac / PowerShell (100% Preciso)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'auto' && (
            <div className="space-y-5">
              {/* Permission Banner */}
              {scanResult && !isScanning && !scanResult.permissionGranted && (
                <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-[#121620] border border-cyan-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>Escaneo Profundo de Hardware</span>
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30">RECOMENDADO</span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        Concede permiso al navegador para identificar micrófonos integrados (MacBook Pro / Air), altavoces y periféricos físicos de audio y video.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleScanWithPermissions}
                    disabled={requestingPerms}
                    className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-cyan-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{requestingPerms ? 'Solicitando...' : 'Permitir y Escanear Dispositivos'}</span>
                  </button>
                </div>
              )}

              {/* Scanning status banner */}
              {isScanning && (
                <div className="bg-[#181F2C] border border-cyan-500/40 rounded-2xl p-6 text-center space-y-4 shadow-inner">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <Scan className="w-7 h-7 text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Escaneando Hardware del Dispositivo...
                    </h3>
                    <p className="text-xs text-cyan-300 font-mono mt-1">
                      {scanSteps[scanStep]}
                    </p>
                  </div>
                  <div className="w-full max-w-md mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${Math.round(((scanStep + 1) / scanSteps.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Scan Results */}
              {scanResult && !isScanning && (
                <div className="space-y-5">
                  {/* Device Header Card */}
                  <div className="bg-gradient-to-r from-[#171F2E] to-[#121620] border border-cyan-500/40 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                        {scanResult.deviceType === 'smartphone' ? (
                          <Smartphone className="w-8 h-8" />
                        ) : scanResult.os === 'macOS' || scanResult.deviceType === 'laptop' ? (
                          <Laptop className="w-8 h-8" />
                        ) : (
                          <Monitor className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border font-mono flex items-center gap-1 ${
                            scanResult.deviceType === 'smartphone'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}>
                            {scanResult.deviceType === 'smartphone' && <Smartphone className="w-3 h-3 text-emerald-400" />}
                            {scanResult.deviceType === 'smartphone'
                              ? scanResult.matchedPhoneModel || scanResult.deviceTypeName
                              : scanResult.macModelName || scanResult.deviceTypeName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {scanResult.os}
                          </span>
                          {scanResult.displayHz && scanResult.displayHz >= 110 && (
                            <span className="text-[10px] font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60 font-mono">
                              120Hz ProMotion
                            </span>
                          )}
                          {scanResult.permissionGranted && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              Dispositivos Verificados
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                          {scanResult.deviceType === 'smartphone'
                            ? `${scanResult.matchedPhoneModel || 'Apple iPhone'} • ${scanResult.matchedSoc?.name || 'Apple A-Series Bionic'}`
                            : scanResult.macModelName
                            ? `${scanResult.macModelName} • ${scanResult.matchedCpu.name}`
                            : `${scanResult.matchedCpu.name} + ${scanResult.matchedGpu.name}`}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {scanResult.deviceType === 'smartphone'
                            ? `Smartphone detectado: ${scanResult.matchedSoc?.name} (${scanResult.matchedSoc?.processNodeNm}nm • ${scanResult.matchedSoc?.gpuName}) • ${scanResult.confidenceScore}% de precisión`
                            : `Precisión del escaneo: ${scanResult.confidenceScore}% (WebGPU / WebGL, Almacenamiento & Dispositivos)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunScan(scanResult.permissionGranted)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2230] hover:bg-[#232B3D] text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reescanear</span>
                      </button>
                    </div>
                  </div>

                  {/* Component Breakdown Grid (Smartphones vs PC/Mac) */}
                  {scanResult.deviceType === 'smartphone' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* 1. Mobile SoC Card */}
                      <div className="p-4 bg-gradient-to-br from-[#161B26] to-[#121E2C] border border-cyan-500/30 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Procesador (SoC Móvil)
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {scanResult.matchedSoc?.processNodeNm || 3}nm
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate" title={scanResult.matchedSoc?.name}>
                          {scanResult.matchedSoc?.name || 'Apple Silicon Bionic'}
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono truncate" title={scanResult.matchedSoc?.cpuConfiguration}>
                          {scanResult.matchedSoc?.cpuConfiguration || `${scanResult.logicalThreads} Núcleos de CPU`}
                        </div>
                      </div>

                      {/* 2. Mobile GPU Card */}
                      <div className="p-4 bg-gradient-to-br from-[#161B26] to-[#1E1428] border border-purple-500/30 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-purple-400" /> GPU Gráfica Móvil
                          </span>
                          <span className="text-[10px] font-mono text-purple-300">
                            Ray Tracing
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate" title={scanResult.matchedSoc?.gpuName}>
                          {scanResult.matchedSoc?.gpuName || 'Apple GPU Metal 3'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {scanResult.webGpuAdapterName || 'Aceleración por hardware Metal / Vulkan'}
                        </div>
                      </div>

                      {/* 3. Performance / Benchmarks Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Benchmarks AnTuTu & Geekbench
                          </span>
                          <span className="text-[10px] font-mono text-amber-300">
                            {scanResult.matchedSoc?.gamingScore120fps || 95}/100
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white">
                          AnTuTu ~{scanResult.matchedSoc?.anTuTuScore ? Math.round(scanResult.matchedSoc.anTuTuScore / 1000).toLocaleString() + 'K' : '2.1M'} pts
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Geekbench 6: {scanResult.matchedSoc?.geekbenchSingle || 2950} Single • {scanResult.matchedSoc?.geekbenchMulti || 7400} Multi
                        </div>
                      </div>

                      {/* 4. Mobile Unified RAM Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-pink-400" /> Memoria RAM Unificada
                          </span>
                          <span className="text-[10px] font-mono text-pink-300">
                            LPDDR5X
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          {scanResult.memoryEstimateGb || 8} GB Memoria Integrada
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Memoria unificada de ultra alta velocidad en encapsulado SoC
                        </div>
                      </div>

                      {/* 5. Mobile Storage & Battery Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Almacenamiento & Batería
                          </span>
                          <span className="text-[10px] font-mono text-amber-300">
                            {scanResult.batteryInfo ? `${scanResult.batteryInfo.level}% Batería` : 'NVMe Flash'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          ~{scanResult.storageEstimateGb || 128} GB Almacenamiento NVMe
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {scanResult.batteryInfo
                            ? `Batería: ${scanResult.batteryInfo.level}% (${scanResult.batteryInfo.charging ? 'Cargando' : 'En Batería'})`
                            : `Consumo medio: ~${scanResult.matchedSoc?.tdpAvgWatts || 6.5}W (${scanResult.matchedSoc?.thermalStabilityPct || 85}% estabilidad)`}
                        </div>
                      </div>

                      {/* 6. Mobile Display Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5 text-emerald-400" /> Pantalla & Tasa de Refresco
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300">
                            {scanResult.displayHz && scanResult.displayHz >= 110 ? '120Hz ProMotion' : '60Hz'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          {scanResult.resolutionLabel || 'Super Retina XDR OLED'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {scanResult.screenWidth} x {scanResult.screenHeight} px • {scanResult.pixelRatio}x DPR
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* 1. GPU Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Tarjeta Gráfica (GPU)
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {scanResult.matchedGpu.vram}GB {scanResult.matchedGpu.vramType}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate" title={scanResult.matchedGpu.name}>
                          {scanResult.matchedGpu.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate" title={scanResult.rawGpuRenderer}>
                          {scanResult.webGpuAdapterName || scanResult.rawGpuRenderer.split('Direct3D')[0].slice(0, 35)}
                        </div>
                      </div>

                      {/* 2. CPU Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-purple-400" /> Procesador (CPU)
                          </span>
                          <span className="text-[10px] font-mono text-purple-300">
                            {scanResult.logicalThreads} Núcleos
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate" title={scanResult.matchedCpu.name}>
                          {scanResult.matchedCpu.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {scanResult.matchedCpu.cores} Cores • Socket {scanResult.matchedCpu.socket}
                        </div>
                      </div>

                      {/* 3. Motherboard Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-indigo-400" /> Placa Base / Logic Board
                          </span>
                          <span className="text-[10px] font-mono text-indigo-300">
                            {scanResult.matchedMotherboard.socket}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate" title={scanResult.matchedMotherboard.name}>
                          {scanResult.matchedMotherboard.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {scanResult.matchedMotherboard.chipset} • {scanResult.matchedMotherboard.formFactor}
                        </div>
                      </div>

                      {/* 4. RAM Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-pink-400" /> Memoria RAM
                          </span>
                          <span className="text-[10px] font-mono text-pink-300">
                            {scanResult.matchedRam.capacityGb} GB
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate" title={scanResult.matchedRam.name}>
                          {scanResult.matchedRam.name || `${scanResult.matchedRam.capacityGb}GB ${scanResult.matchedRam.type}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {scanResult.os === 'macOS'
                            ? 'Arquitectura Unificada de alta velocidad'
                            : `${scanResult.matchedRam.speedMhz} MHz • Dual-Channel`}
                        </div>
                      </div>

                      {/* 5. Storage Card */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Almacenamiento (SSD)
                          </span>
                          <span className="text-[10px] font-mono text-amber-300">
                            ~{scanResult.matchedStorage.capacityGb} GB
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate" title={scanResult.matchedStorage.name}>
                          {scanResult.matchedStorage.name || `${scanResult.matchedStorage.type} ${scanResult.matchedStorage.capacityGb}GB`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {scanResult.matchedStorage.type} • ~{scanResult.matchedStorage.readSpeedMb} MB/s
                        </div>
                      </div>

                      {/* 6. Screen / Display */}
                      <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5 text-emerald-400" /> Pantalla & Resolución
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300">
                            {scanResult.pixelRatio}x Retina
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          {scanResult.resolutionLabel}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {scanResult.screenWidth} x {scanResult.screenHeight} px @ {scanResult.displayHz}Hz
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enumerated Peripherals List if permission granted */}
                  {scanResult.enumeratedDevices.length > 0 && (
                    <div className="p-4 bg-[#141822] border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Dispositivos Físicos Reconocidos ({scanResult.enumeratedDevices.length})
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                          Enumeración Activa
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {scanResult.enumeratedDevices.slice(0, 6).map((dev, idx) => (
                          <div key={idx} className="p-2 bg-[#191F2B] rounded-lg border border-slate-800/80 flex items-center gap-2">
                            {dev.kind === 'audioinput' ? (
                              <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            ) : dev.kind === 'audiooutput' ? (
                              <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            ) : (
                              <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate text-slate-200 text-[11px] font-medium" title={dev.label}>
                              {dev.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 text-center sm:text-left">
                      {scanResult.deviceType === 'smartphone'
                        ? `Se identificó tu ${scanResult.matchedPhoneModel || 'teléfono móvil'}. Puedes abrir el diagnóstico y comparativa móvil o ver el equivalente en PC.`
                        : 'Al aplicar, se cargarán todos estos componentes (CPU, GPU, Placa Base, RAM, SSD y Pantalla) directamente en el diagnóstico.'}
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {scanResult.deviceType === 'smartphone' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateConfig({
                              platform: 'laptop',
                              cpu: scanResult.matchedCpu,
                              gpu: scanResult.matchedGpu,
                              motherboard: scanResult.matchedMotherboard,
                              ram: scanResult.matchedRam,
                              storage: scanResult.matchedStorage,
                              psu: scanResult.matchedPsu,
                              resolution: scanResult.detectedResolution,
                              os: scanResult.os === 'macOS' ? 'macOS' : 'Windows 11'
                            });
                            try {
                              confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
                            } catch {}
                            onApplyAndNavigate('pc-diag');
                            onClose();
                          }}
                          className="px-4 py-2.5 bg-[#1C2230] hover:bg-[#252E40] text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer text-center"
                        >
                          Ver Equivalente en PC
                        </button>
                      )}

                      <button
                        onClick={handleApplyHardware}
                        className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                          scanResult.deviceType === 'smartphone'
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
                        }`}
                      >
                        {scanResult.deviceType === 'smartphone' ? (
                          <Smartphone className="w-4 h-4 text-emerald-200" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-cyan-200" />
                        )}
                        <span>
                          {scanResult.deviceType === 'smartphone'
                            ? `Ver Diagnóstico Móvil (${scanResult.matchedPhoneModel ? scanResult.matchedPhoneModel.replace('Apple ', '') : 'iPhone'})`
                            : 'Cargar Componentes y Ver Diagnóstico'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL / TERMINAL (macOS system_profiler or Windows PowerShell) */}
          {activeTab === 'manual' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setManualOs('mac')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    manualOs === 'mac'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-[#181F2C] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                   macOS (MacBook / Mac)
                </button>
                <button
                  onClick={() => setManualOs('windows')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    manualOs === 'windows'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-[#181F2C] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ⊞ Windows (PowerShell / DxDiag)
                </button>
              </div>

              <div className="p-4 bg-[#161B26] border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    {manualOs === 'mac'
                      ? 'Comando Rápido para Terminal de Mac'
                      : 'Comando Rápido para PowerShell de Windows'}
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400">100% Preciso</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {manualOs === 'mac' ? (
                    <>
                      Abre la <strong>Terminal</strong> en tu Mac (presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">Cmd + Espacio</kbd>, escribe <em>Terminal</em>) y pega este comando seguro de solo lectura:
                    </>
                  ) : (
                    <>
                      Abre <strong>PowerShell</strong> en tu PC (presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">Win + X</kbd> y elige Terminal/PowerShell) y pega este comando seguro:
                    </>
                  )}
                </p>

                <div className="relative">
                  <pre className="p-3 bg-[#0E1117] rounded-xl border border-slate-800 text-[11px] text-cyan-300 font-mono overflow-x-auto select-all">
                    {currentCmd}
                  </pre>
                  <button
                    onClick={handleCopyCmd}
                    className="absolute right-2 top-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCmd ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Paste box */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {manualOs === 'mac'
                    ? 'Pega el resultado de la Terminal de tu Mac aquí:'
                    : 'Pega el resultado del comando o DxDiag aquí:'}
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={
                    manualOs === 'mac'
                      ? `Ejemplo pegado desde Mac:
Model Name: MacBook Pro
Chip: Apple M2 Pro
Total Number of Cores: 12 (8 performance and 4 efficiency)
Memory: 16 GB`
                      : `Ejemplo pegado desde PC:
Name: AMD Ryzen 7 7800X3D 8-Core Processor
Name: NVIDIA GeForce RTX 4070 Ti SUPER
BaseBoard: ASUS TUF GAMING B650-PLUS
32`
                  }
                  className="w-full p-3 bg-[#161B26] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleManualParse}
                    disabled={!pastedText.trim()}
                    className="px-4 py-2 bg-[#1C2230] hover:bg-[#232B3D] disabled:opacity-50 text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition-colors"
                  >
                    Identificar Componentes
                  </button>
                </div>
              </div>

              {/* Parsed Result with 5 components */}
              {manualParsed && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Componentes Identificados con Éxito</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-[#121620] rounded-lg border border-slate-800">
                      <div className="text-[10px] uppercase text-slate-500 font-bold">
                        {manualParsed.detectedMacModel ? 'Modelo Mac / CPU' : 'Procesador'}
                      </div>
                      <div className="font-bold text-white mt-0.5 truncate">
                        {manualParsed.detectedMacModel || manualParsed.matchedCpu?.name || manualParsed.detectedCpuName || 'No detectado'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#121620] rounded-lg border border-slate-800">
                      <div className="text-[10px] uppercase text-slate-500 font-bold">Tarjeta Gráfica (GPU)</div>
                      <div className="font-bold text-white mt-0.5 truncate">
                        {manualParsed.matchedGpu?.name || manualParsed.detectedGpuName || 'No detectado'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#121620] rounded-lg border border-slate-800">
                      <div className="text-[10px] uppercase text-slate-500 font-bold">Placa Base</div>
                      <div className="font-bold text-white mt-0.5 truncate">
                        {manualParsed.matchedMotherboard?.name || manualParsed.detectedMotherboardName || 'Detectada'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#121620] rounded-lg border border-slate-800">
                      <div className="text-[10px] uppercase text-slate-500 font-bold">Memoria RAM</div>
                      <div className="font-bold text-white mt-0.5">
                        {manualParsed.matchedRam?.capacityGb || manualParsed.detectedRamGb || 16} GB
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#121620] rounded-lg border border-slate-800">
                      <div className="text-[10px] uppercase text-slate-500 font-bold">Almacenamiento (SSD)</div>
                      <div className="font-bold text-white mt-0.5 truncate">
                        {manualParsed.matchedStorage?.name || manualParsed.detectedStorageName || 'SSD NVMe'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleApplyManual}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Cargar Todos los Componentes en Diagnóstico</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
