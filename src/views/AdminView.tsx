import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Lock,
  BarChart3,
  Cpu,
  Monitor,
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Database,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHardware } from '../context/HardwareContext';
import { CPU, GPU, MobileSoC, PSU, AdminStats } from '../types';
import { INITIAL_ADMIN_STATS } from '../data/initialData';
import { groupCpusByGeneration, getCpuGenerationMeta, KNOWN_CPU_GENERATIONS } from '../utils/cpuGenerations';
import { groupGpusByGeneration, getGpuGenerationMeta, KNOWN_GPU_GENERATIONS } from '../utils/gpuGenerations';

interface AdminViewProps {
  embedded?: boolean;
}

export const AdminView: React.FC<AdminViewProps> = ({ embedded = false }) => {
  const { user, isAdmin, loginAsAdmin, logoutAdmin } = useAuth();
  const {
    cpus,
    gpus,
    socs,
    psus,
    addOrUpdateCpu,
    deleteCpu,
    addOrUpdateGpu,
    deleteGpu,
    addOrUpdateSoc,
    deleteSoc,
    addOrUpdatePsu,
    deletePsu
  } = useHardware();

  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [stats, setStats] = useState<AdminStats>(INITIAL_ADMIN_STATS);
  const [activeTab, setActiveTab] = useState<'stats' | 'cpus' | 'gpus' | 'socs' | 'psus'>('stats');

  // Filter states for CPU admin list
  const [adminCpuFilterBrand, setAdminCpuFilterBrand] = useState<'All' | 'AMD' | 'Intel'>('All');
  const [adminCpuFilterGen, setAdminCpuFilterGen] = useState<string>('All');

  const availableAdminCpuGens = useMemo(() => {
    return KNOWN_CPU_GENERATIONS.filter(g => {
      if (adminCpuFilterBrand === 'All') return true;
      return g.brand === adminCpuFilterBrand;
    });
  }, [adminCpuFilterBrand]);

  const filteredAdminCpus = useMemo(() => {
    return cpus.filter(c => {
      const matchBrand = adminCpuFilterBrand === 'All' || c.brand === adminCpuFilterBrand;
      const genMeta = getCpuGenerationMeta(c);
      const matchGen = adminCpuFilterGen === 'All' || genMeta.id === adminCpuFilterGen;
      return matchBrand && matchGen;
    });
  }, [cpus, adminCpuFilterBrand, adminCpuFilterGen]);

  const adminCpuGroups = useMemo(() => {
    return groupCpusByGeneration(filteredAdminCpus);
  }, [filteredAdminCpus]);

  // Filter states for GPU admin list
  const [adminGpuFilterBrand, setAdminGpuFilterBrand] = useState<'All' | 'NVIDIA' | 'AMD'>('All');
  const [adminGpuFilterGen, setAdminGpuFilterGen] = useState<string>('All');

  const availableAdminGpuGens = useMemo(() => {
    return KNOWN_GPU_GENERATIONS.filter(g => {
      if (adminGpuFilterBrand === 'All') return true;
      return g.brand === adminGpuFilterBrand;
    });
  }, [adminGpuFilterBrand]);

  const filteredAdminGpus = useMemo(() => {
    return gpus.filter(g => {
      const matchBrand = adminGpuFilterBrand === 'All' || g.brand === adminGpuFilterBrand;
      const genMeta = getGpuGenerationMeta(g);
      const matchGen = adminGpuFilterGen === 'All' || genMeta.id === adminGpuFilterGen;
      return matchBrand && matchGen;
    });
  }, [gpus, adminGpuFilterBrand, adminGpuFilterGen]);

  const adminGpuGroups = useMemo(() => {
    return groupGpusByGeneration(filteredAdminGpus);
  }, [filteredAdminGpus]);

  // Form states for adding/editing CPU
  const [showCpuModal, setShowCpuModal] = useState(false);
  const [editingCpu, setEditingCpu] = useState<Partial<CPU>>({
    name: '',
    brand: 'AMD',
    socket: 'AM5',
    cores: 8,
    threads: 16,
    baseClock: 4.0,
    boostClock: 5.0,
    tdp: 120,
    gamingScore: 90,
    multicoreScore: 85,
    singlecoreScore: 90,
    releaseYear: 2026,
    pcieGen: 5
  });

  // Form states for adding/editing GPU
  const [showGpuModal, setShowGpuModal] = useState(false);
  const [editingGpu, setEditingGpu] = useState<Partial<GPU>>({
    name: '',
    brand: 'NVIDIA',
    vram: 16,
    vramType: 'GDDR7',
    tdp: 285,
    recommendedPsu: 750,
    score1080p: 95,
    score1440p: 95,
    score4k: 90,
    rayTracingScore: 92,
    releaseYear: 2026,
    dlssFsrSupport: 'DLSS 4.0'
  });

  // Form states for adding/editing SoC
  const [showSocModal, setShowSocModal] = useState(false);
  const [editingSoc, setEditingSoc] = useState<Partial<MobileSoC>>({
    name: '',
    manufacturer: 'Qualcomm',
    processNodeNm: 3,
    cpuConfiguration: 'Oryon Prime',
    gpuName: 'Adreno GPU',
    anTuTuScore: 3000000,
    geekbenchSingle: 3100,
    geekbenchMulti: 9900,
    gamingScore120fps: 98,
    thermalStabilityPct: 88,
    tdpAvgWatts: 7.0,
    typicalDevices: ['Flagship 2026']
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch live stats from backend
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.warn('Using local stats:', e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    const success = await loginAsAdmin(passwordInput);
    if (!success) {
      setLoginError(true);
    }
  };

  const handleSaveCpu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCpu.name) return;
    const cpu: CPU = {
      id: editingCpu.id || `cpu-${Date.now()}`,
      name: editingCpu.name!,
      brand: editingCpu.brand as any || 'AMD',
      socket: editingCpu.socket || 'AM5',
      cores: Number(editingCpu.cores) || 8,
      threads: Number(editingCpu.threads) || 16,
      baseClock: Number(editingCpu.baseClock) || 4.0,
      boostClock: Number(editingCpu.boostClock) || 5.0,
      tdp: Number(editingCpu.tdp) || 120,
      gamingScore: Number(editingCpu.gamingScore) || 90,
      multicoreScore: Number(editingCpu.multicoreScore) || 85,
      singlecoreScore: Number(editingCpu.singlecoreScore) || 90,
      releaseYear: Number(editingCpu.releaseYear) || 2026,
      pcieGen: Number(editingCpu.pcieGen) || 5
    };
    await addOrUpdateCpu(cpu);
    setShowCpuModal(false);
    setActionSuccess('Procesador guardado sin interrupciones');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleSaveGpu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGpu.name) return;
    const gpu: GPU = {
      id: editingGpu.id || `gpu-${Date.now()}`,
      name: editingGpu.name!,
      brand: editingGpu.brand as any || 'NVIDIA',
      vram: Number(editingGpu.vram) || 16,
      vramType: editingGpu.vramType || 'GDDR7',
      tdp: Number(editingGpu.tdp) || 250,
      recommendedPsu: Number(editingGpu.recommendedPsu) || 750,
      score1080p: Number(editingGpu.score1080p) || 90,
      score1440p: Number(editingGpu.score1440p) || 90,
      score4k: Number(editingGpu.score4k) || 85,
      rayTracingScore: Number(editingGpu.rayTracingScore) || 90,
      releaseYear: Number(editingGpu.releaseYear) || 2026,
      dlssFsrSupport: editingGpu.dlssFsrSupport || 'DLSS 4.0'
    };
    await addOrUpdateGpu(gpu);
    setShowGpuModal(false);
    setActionSuccess('Tarjeta Gráfica guardada sin interrupciones');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleSaveSoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSoc.name) return;
    const soc: MobileSoC = {
      id: editingSoc.id || `soc-${Date.now()}`,
      name: editingSoc.name!,
      manufacturer: editingSoc.manufacturer as any || 'Qualcomm',
      processNodeNm: Number(editingSoc.processNodeNm) || 3,
      cpuConfiguration: editingSoc.cpuConfiguration || 'Oryon',
      gpuName: editingSoc.gpuName || 'Adreno',
      anTuTuScore: Number(editingSoc.anTuTuScore) || 3000000,
      geekbenchSingle: Number(editingSoc.geekbenchSingle) || 3000,
      geekbenchMulti: Number(editingSoc.geekbenchMulti) || 9000,
      gamingScore120fps: Number(editingSoc.gamingScore120fps) || 95,
      thermalStabilityPct: Number(editingSoc.thermalStabilityPct) || 85,
      tdpAvgWatts: Number(editingSoc.tdpAvgWatts) || 7.0,
      typicalDevices: typeof editingSoc.typicalDevices === 'string' ? (editingSoc.typicalDevices as string).split(',') : editingSoc.typicalDevices || []
    };
    await addOrUpdateSoc(soc);
    setShowSocModal(false);
    setActionSuccess('SoC Móvil guardado sin interrupciones');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Filter and modal states for PSU
  const [adminPsuFilterBrand, setAdminPsuFilterBrand] = useState<string>('All');
  const [showPsuModal, setShowPsuModal] = useState(false);
  const [editingPsu, setEditingPsu] = useState<Partial<PSU>>({
    name: '',
    brand: 'Corsair',
    wattage: 850,
    efficiency: '80 PLUS Gold',
    tier: 'Tier A',
    modular: 'Totalmente Modular',
    atx3: true
  });

  const filteredAdminPsus = useMemo(() => {
    return psus.filter(p => {
      if (adminPsuFilterBrand === 'All') return true;
      if (adminPsuFilterBrand === 'Corsair') return p.brand === 'Corsair';
      if (adminPsuFilterBrand === 'Genérica') return !p.brand || p.brand === 'Genérica';
      return p.brand === adminPsuFilterBrand;
    });
  }, [psus, adminPsuFilterBrand]);

  const handleSavePsu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPsu.name) return;
    const psu: PSU = {
      id: editingPsu.id || `psu-${Date.now()}`,
      name: editingPsu.name!,
      brand: editingPsu.brand || 'Corsair',
      wattage: Number(editingPsu.wattage) || 850,
      efficiency: (editingPsu.efficiency as any) || '80 PLUS Gold',
      tier: editingPsu.tier || 'Tier A',
      modular: (editingPsu.modular as any) || 'Totalmente Modular',
      atx3: Boolean(editingPsu.atx3)
    };
    await addOrUpdatePsu(psu);
    setShowPsuModal(false);
    setActionSuccess('Fuente de poder guardada exitosamente');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // If not logged in as Admin, show high-security Login screen
  if (!isAdmin) {
    return (
      <div className={`mx-auto ${embedded ? 'max-w-xl py-4' : 'max-w-md py-16 px-4'}`}>
        <div className="bg-[#151921] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Shield className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              Apartado de Administración
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Acceso Restringido</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Este apartado está reservado para la gestión de la base de datos de hardware en caliente, altas y bajas de componentes y monitoreo de telemetría.
            </p>
          </div>

          {user?.email?.toLowerCase() === 'adamarmoza@gmail.com' && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 text-left space-y-2">
              <div className="flex items-center gap-2 font-bold text-cyan-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Sesión detectada como Administrador Principal:</span>
              </div>
              <p className="text-[11px] text-cyan-300/80">
                Tu cuenta ({user.email}) tiene permisos asignados. Puedes activar las herramientas de administración directamente:
              </p>
              <button
                type="button"
                onClick={async () => {
                  await loginAsAdmin('embudo-admin-2026');
                }}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Activar Funciones de Administrador</span>
              </button>
            </div>
          )}

          {loginError && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              Contraseña de administrador incorrecta.
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Clave Maestra de Administrador
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Ingresa clave de administrador..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
            >
              Desbloquear Panel Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${embedded ? 'w-full' : 'pb-16 max-w-7xl mx-auto px-4 sm:px-6'}`}>
      {/* Header */}
      {!embedded ? (
        <div className="border-b border-slate-800 pb-6 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Shield className="w-4 h-4" /> Gestión Administrativa en Caliente
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Panel de Control & Base de Datos
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Disponibilidad 99.9% activa. Actualizaciones en memoria y backend sin reiniciar el servicio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Refrescar métricas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logoutAdmin}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 text-slate-300 hover:text-rose-300 text-xs font-bold cursor-pointer"
            >
              Cerrar Sesión Admin
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#151921] border border-slate-800 rounded-2xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Shield className="w-4 h-4" /> Panel de Control & Base de Datos
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestión de base de datos en caliente, métricas de telemetría y altas/bajas de hardware.
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#1C222D] hover:bg-slate-700/60 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refrescar Estadísticas</span>
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'stats', label: 'Estadísticas & Métricas', icon: BarChart3 },
          { id: 'cpus', label: `Procesadores (${cpus.length})`, icon: Cpu },
          { id: 'gpus', label: `Tarjetas Gráficas (${gpus.length})`, icon: Monitor },
          { id: 'socs', label: `SoCs Móviles (${socs.length})`, icon: Smartphone },
          { id: 'psus', label: `Fuentes de Poder (${psus.length})`, icon: Zap }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: METRICS & TELEMETRY */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Diagnósticos Realizados</div>
              <div className="text-3xl font-black text-white mt-1">{stats.totalDiagnosesRun.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +14% vs semana anterior
              </div>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Usuarios Activos (24h)</div>
              <div className="text-3xl font-black text-cyan-300 mt-1">{stats.activeUsers24h.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">Concurrencia sin degradación</div>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Bottleneck Promedio</div>
              <div className="text-3xl font-black text-amber-300 mt-1">{stats.averageBottleneckPct}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Mayoría en 1440p Gaming</div>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Hardware en Base</div>
              <div className="text-3xl font-black text-teal-300 mt-1">{cpus.length + gpus.length + socs.length}</div>
              <div className="text-[10px] text-slate-400 mt-1">Zero downtime sync</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top CPUs */}
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> CPUs Más Consultados
              </h4>
              <div className="space-y-2 text-xs">
                {stats.topCpusQueried.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <strong className="text-cyan-400 font-mono">{item.count.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Top GPUs */}
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-indigo-400" /> GPUs Más Consultadas
              </h4>
              <div className="space-y-2 text-xs">
                {stats.topGpusQueried.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <strong className="text-indigo-400 font-mono">{item.count.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Top SoCs */}
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-400" /> SoCs Móviles Top
              </h4>
              <div className="space-y-2 text-xs">
                {stats.topMobileSocQueried.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <strong className="text-teal-400 font-mono">{item.count.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CPUS CRUD */}
      {activeTab === 'cpus' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Catálogo de Procesadores (Ordenados por Generación)</h3>
              <p className="text-xs text-slate-400">Total de {filteredAdminCpus.length} procesadores mostrados por arquitectura y generación cronológica.</p>
            </div>
            <button
              onClick={() => {
                setEditingCpu({
                  name: '',
                  brand: 'AMD',
                  socket: 'AM5',
                  cores: 8,
                  threads: 16,
                  baseClock: 4.2,
                  boostClock: 5.0,
                  tdp: 120,
                  gamingScore: 95,
                  multicoreScore: 85,
                  singlecoreScore: 92,
                  releaseYear: 2026,
                  pcieGen: 5
                });
                setShowCpuModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Agregar Nuevo CPU
            </button>
          </div>

          {/* Filters for Admin CPU list */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1">
              {(['All', 'AMD', 'Intel'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => {
                    setAdminCpuFilterBrand(b);
                    setAdminCpuFilterGen('All');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    adminCpuFilterBrand === b
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <select
              value={adminCpuFilterGen}
              onChange={(e) => setAdminCpuFilterGen(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">⚡ Todas las Generaciones ({filteredAdminCpus.length})</option>
              {availableAdminCpuGens.map(g => (
                <option key={g.id} value={g.id}>
                  {g.shortLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Grouped CPU Sections */}
          <div className="space-y-6">
            {adminCpuGroups.map(group => (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                  <span className="text-xs font-black tracking-wider uppercase text-cyan-400">
                    {group.label}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {group.cpus.length} modelos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.cpus.map(c => {
                    const meta = getCpuGenerationMeta(c);
                    return (
                      <div key={c.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {meta.shortLabel}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{c.tdp}W TDP • {c.socket}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-2">{c.name}</h4>
                          <div className="text-xs text-slate-400 mt-1 font-mono">
                            {c.cores}C / {c.threads}T • Base {c.baseClock}G • Boost {c.boostClock}G
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>Gaming: <strong className="text-cyan-400">{c.gamingScore}/100</strong></span>
                            <span>Año: <strong className="text-slate-300">{c.releaseYear}</strong></span>
                            <span>PCIe: <strong className="text-slate-300">{c.pcieGen}.0</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setEditingCpu(c);
                              setShowCpuModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 cursor-pointer"
                            title="Editar CPU"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCpu(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="Eliminar CPU"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GPUS CRUD */}
      {activeTab === 'gpus' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Catálogo de Tarjetas Gráficas</h3>
              <p className="text-xs text-slate-400">Total registradas: {gpus.length} GPUs (Mostrando: {filteredAdminGpus.length})</p>
            </div>
            <button
              onClick={() => {
                setEditingGpu({
                  name: '',
                  brand: 'NVIDIA',
                  vram: 16,
                  vramType: 'GDDR7',
                  tdp: 285,
                  recommendedPsu: 750,
                  score1080p: 95,
                  score1440p: 95,
                  score4k: 90,
                  rayTracingScore: 92,
                  releaseYear: 2026,
                  dlssFsrSupport: 'DLSS 4.0'
                });
                setShowGpuModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Agregar Nueva GPU
            </button>
          </div>

          {/* GPU Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1">
              {(['All', 'NVIDIA', 'AMD'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => {
                    setAdminGpuFilterBrand(b);
                    setAdminGpuFilterGen('All');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    adminGpuFilterBrand === b
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <select
              value={adminGpuFilterGen}
              onChange={(e) => setAdminGpuFilterGen(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">⚡ Todas las Familias ({filteredAdminGpus.length})</option>
              {availableAdminGpuGens.map(g => (
                <option key={g.id} value={g.id}>
                  {g.shortLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Grouped GPU Sections */}
          <div className="space-y-6">
            {adminGpuGroups.map(group => (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                  <span className="text-xs font-black tracking-wider uppercase text-indigo-400">
                    {group.label}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {group.gpus.length} modelos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.gpus.map(g => {
                    const meta = getGpuGenerationMeta(g);
                    return (
                      <div key={g.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {meta.shortLabel}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{g.tdp}W • {g.recommendedPsu}W PSU</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-2">{g.name}</h4>
                          <div className="text-xs text-slate-400 mt-1 font-mono">
                            {g.vram}GB {g.vramType} • RayTracing: {g.rayTracingScore}/100
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>1080p: <strong className="text-emerald-400">{g.score1080p}</strong></span>
                            <span>1440p: <strong className="text-cyan-400">{g.score1440p}</strong></span>
                            <span>4K: <strong className="text-blue-400">{g.score4k}</strong></span>
                            <span>Año: <strong className="text-slate-300">{g.releaseYear}</strong></span>
                          </div>
                          {g.dlssFsrSupport && (
                            <div className="text-[10px] text-indigo-300 mt-1.5 font-mono">
                              Tecnología: {g.dlssFsrSupport}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setEditingGpu(g);
                              setShowGpuModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 cursor-pointer"
                            title="Editar GPU"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteGpu(g.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="Eliminar GPU"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SOCS CRUD */}
      {activeTab === 'socs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Catálogo de SoCs Móviles</h3>
            <button
              onClick={() => {
                setEditingSoc({
                  name: '',
                  manufacturer: 'Qualcomm',
                  processNodeNm: 3,
                  cpuConfiguration: 'Oryon Cores',
                  gpuName: 'Adreno',
                  anTuTuScore: 3000000,
                  geekbenchSingle: 3100,
                  geekbenchMulti: 9500,
                  gamingScore120fps: 98,
                  thermalStabilityPct: 88,
                  tdpAvgWatts: 7.0,
                  typicalDevices: ['Dispositivo Flagship']
                });
                setShowSocModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agregar Nuevo SoC
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socs.map(s => (
              <div key={s.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400">
                      {s.manufacturer} ({s.processNodeNm}nm)
                    </span>
                    <span className="text-xs text-slate-400 font-mono">~{s.tdpAvgWatts}W</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">{s.name}</h4>
                  <div className="text-xs text-slate-400 mt-1">
                    AnTuTu: ~{(s.anTuTuScore / 1000000).toFixed(2)}M • Estabilidad: {s.thermalStabilityPct}%
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setEditingSoc(s);
                      setShowSocModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-teal-400 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSoc(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PSUS CRUD */}
      {activeTab === 'psus' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Catálogo de Fuentes de Poder (PSUs)
              </h3>
              <p className="text-xs text-slate-400">
                Gestión de fuentes de alto rendimiento Corsair (Shift, HX, AX), ROG Thor, Seasonic y referencias.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPsu({
                  name: '',
                  brand: 'Corsair',
                  wattage: 1000,
                  efficiency: '80 PLUS Gold',
                  tier: 'Tier A (Shift Side-Cable)',
                  modular: 'Totalmente Modular',
                  atx3: true
                });
                setShowPsuModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Agregar Nueva Fuente
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Fuentes</div>
              <div className="text-xl font-black text-white mt-0.5">{psus.length}</div>
            </div>
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-amber-500/30">
              <div className="text-[10px] text-amber-400 uppercase font-semibold">Gama Corsair</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                {psus.filter(p => p.brand === 'Corsair').length} modelos
              </div>
            </div>
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-cyan-500/30">
              <div className="text-[10px] text-cyan-400 uppercase font-semibold">Nativas ATX 3.1 / 3.0</div>
              <div className="text-xl font-black text-cyan-300 mt-0.5">
                {psus.filter(p => p.atx3).length}
              </div>
            </div>
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Ultra Power (1000W+)</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">
                {psus.filter(p => p.wattage >= 1000).length}
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Filtrar Fabricante:</span>
            {['All', 'Corsair', 'ASUS ROG', 'Seasonic', 'be quiet!', 'Genérica'].map(b => (
              <button
                key={b}
                onClick={() => setAdminPsuFilterBrand(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adminPsuFilterBrand === b
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {b === 'All' ? `Todas (${psus.length})` : b}
              </button>
            ))}
          </div>

          {/* PSUs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAdminPsus.map(p => (
              <div
                key={p.id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      p.brand === 'Corsair'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : p.brand === 'ASUS ROG'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : p.brand === 'Seasonic'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {p.brand || 'Genérica'}
                    </span>
                    {p.atx3 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                        ATX 3.1 Ready
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white line-clamp-2">{p.name}</h4>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-base font-black text-amber-400 font-mono">{p.wattage}W</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {p.efficiency}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                    {p.tier && <div>• <span className="text-slate-300 font-semibold">{p.tier}</span></div>}
                    {p.modular && <div>• {p.modular}</div>}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setEditingPsu(p);
                      setShowPsuModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                    title="Editar Fuente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePsu(p.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                    title="Eliminar Fuente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CPU Modal */}
      {showCpuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveCpu} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">{editingCpu.id ? 'Editar CPU' : 'Nuevo CPU'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingCpu.name || ''}
                  onChange={(e) => setEditingCpu({ ...editingCpu, name: e.target.value })}
                  placeholder="ej: AMD Ryzen 7 7800X3D"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Marca</label>
                <select
                  value={editingCpu.brand || 'AMD'}
                  onChange={(e) => setEditingCpu({ ...editingCpu, brand: e.target.value as any })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="AMD">AMD</option>
                  <option value="Intel">Intel</option>
                  <option value="Apple">Apple</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Cores / Threads</label>
                <input
                  type="number"
                  value={editingCpu.cores || 8}
                  onChange={(e) => setEditingCpu({ ...editingCpu, cores: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">TDP (Watts)</label>
                <input
                  type="number"
                  value={editingCpu.tdp || 120}
                  onChange={(e) => setEditingCpu({ ...editingCpu, tdp: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Gaming Score (0-100)</label>
                <input
                  type="number"
                  value={editingCpu.gamingScore || 90}
                  onChange={(e) => setEditingCpu({ ...editingCpu, gamingScore: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowCpuModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
              >
                Guardar en Caliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GPU Modal */}
      {showGpuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveGpu} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">{editingGpu.id ? 'Editar GPU' : 'Nueva GPU'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingGpu.name || ''}
                  onChange={(e) => setEditingGpu({ ...editingGpu, name: e.target.value })}
                  placeholder="ej: NVIDIA RTX 5070 Ti"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Marca</label>
                <select
                  value={editingGpu.brand || 'NVIDIA'}
                  onChange={(e) => setEditingGpu({ ...editingGpu, brand: e.target.value as any })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="NVIDIA">NVIDIA</option>
                  <option value="AMD">AMD</option>
                  <option value="Intel">Intel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">VRAM (GB)</label>
                <input
                  type="number"
                  value={editingGpu.vram || 16}
                  onChange={(e) => setEditingGpu({ ...editingGpu, vram: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">TDP (Watts)</label>
                <input
                  type="number"
                  value={editingGpu.tdp || 285}
                  onChange={(e) => setEditingGpu({ ...editingGpu, tdp: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">PSU Mínimo (Watts)</label>
                <input
                  type="number"
                  value={editingGpu.recommendedPsu || 750}
                  onChange={(e) => setEditingGpu({ ...editingGpu, recommendedPsu: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowGpuModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
              >
                Guardar en Caliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SoC Modal */}
      {showSocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveSoc} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">{editingSoc.id ? 'Editar SoC' : 'Nuevo SoC'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingSoc.name || ''}
                  onChange={(e) => setEditingSoc({ ...editingSoc, name: e.target.value })}
                  placeholder="ej: Snapdragon 8 Elite"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Fabricante</label>
                <select
                  value={editingSoc.manufacturer || 'Qualcomm'}
                  onChange={(e) => setEditingSoc({ ...editingSoc, manufacturer: e.target.value as any })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Qualcomm">Qualcomm</option>
                  <option value="Apple">Apple</option>
                  <option value="MediaTek">MediaTek</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Google">Google</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nodo (nm)</label>
                <input
                  type="number"
                  value={editingSoc.processNodeNm || 3}
                  onChange={(e) => setEditingSoc({ ...editingSoc, processNodeNm: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Estabilidad Térmica %</label>
                <input
                  type="number"
                  value={editingSoc.thermalStabilityPct || 85}
                  onChange={(e) => setEditingSoc({ ...editingSoc, thermalStabilityPct: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Consumo Medio (W)</label>
                <input
                  type="number"
                  step={0.1}
                  value={editingSoc.tdpAvgWatts || 7.0}
                  onChange={(e) => setEditingSoc({ ...editingSoc, tdpAvgWatts: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowSocModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer"
              >
                Guardar en Caliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PSU Modal */}
      {showPsuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSavePsu} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {editingPsu.id ? 'Editar Fuente de Poder' : 'Nueva Fuente de Poder'}
              </h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Actualización en caliente</span>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Nombre Completo del Modelo</label>
              <input
                type="text"
                required
                value={editingPsu.name || ''}
                onChange={(e) => setEditingPsu({ ...editingPsu, name: e.target.value })}
                placeholder="ej: Corsair RM1000x SHIFT 1000W 80 PLUS Gold"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Fabricante / Marca</label>
                <select
                  value={editingPsu.brand || 'Corsair'}
                  onChange={(e) => setEditingPsu({ ...editingPsu, brand: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Corsair">Corsair</option>
                  <option value="ASUS ROG">ASUS ROG</option>
                  <option value="Seasonic">Seasonic</option>
                  <option value="be quiet!">be quiet!</option>
                  <option value="MSI">MSI</option>
                  <option value="EVGA">EVGA</option>
                  <option value="Genérica">Genérica / Básica</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Potencia (Watts)</label>
                <input
                  type="number"
                  required
                  min={300}
                  max={2500}
                  step={50}
                  value={editingPsu.wattage || 850}
                  onChange={(e) => setEditingPsu({ ...editingPsu, wattage: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Eficiencia Energética</label>
                <select
                  value={editingPsu.efficiency || '80 PLUS Gold'}
                  onChange={(e) => setEditingPsu({ ...editingPsu, efficiency: e.target.value as any })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="80 PLUS Titanium">80 PLUS Titanium</option>
                  <option value="80 PLUS Platinum">80 PLUS Platinum</option>
                  <option value="80 PLUS Gold">80 PLUS Gold</option>
                  <option value="80 PLUS Silver">80 PLUS Silver</option>
                  <option value="80 PLUS Bronze">80 PLUS Bronze</option>
                  <option value="80 PLUS White">80 PLUS White</option>
                  <option value="Genérica">Genérica / Sin Certificación</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Modularidad</label>
                <select
                  value={editingPsu.modular || 'Totalmente Modular'}
                  onChange={(e) => setEditingPsu({ ...editingPsu, modular: e.target.value as any })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Totalmente Modular">Totalmente Modular</option>
                  <option value="Semi-Modular">Semi-Modular</option>
                  <option value="No Modular">No Modular</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Tier / Categoría de Calidad</label>
                <input
                  type="text"
                  value={editingPsu.tier || ''}
                  onChange={(e) => setEditingPsu({ ...editingPsu, tier: e.target.value })}
                  placeholder="ej: Tier A+ (GaN DSP) o Tier A"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(editingPsu.atx3)}
                    onChange={(e) => setEditingPsu({ ...editingPsu, atx3: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-white font-bold">Compatible ATX 3.0 / ATX 3.1</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPsuModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer transition-all shadow-md"
              >
                Guardar Fuente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
