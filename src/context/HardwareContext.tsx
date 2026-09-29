import React, { createContext, useContext, useState, useEffect } from 'react';
import { CPU, GPU, RAM, Storage, PSU, Motherboard, MobileSoC, PrebuiltPC, DiagnosisConfig, BottleneckResult } from '../types';
import {
  INITIAL_CPUS,
  INITIAL_GPUS,
  INITIAL_RAMS,
  INITIAL_STORAGES,
  INITIAL_PSUS,
  INITIAL_MOTHERBOARDS,
  INITIAL_SOCS,
  INITIAL_PREBUILTS
} from '../data/initialData';
import { calculateBottleneck } from '../lib/calculatorEngine';

interface HardwareContextType {
  cpus: CPU[];
  gpus: GPU[];
  rams: RAM[];
  storages: Storage[];
  psus: PSU[];
  motherboards: Motherboard[];
  socs: MobileSoC[];
  prebuilts: PrebuiltPC[];
  currentConfig: DiagnosisConfig;
  currentResult: BottleneckResult;
  buildcoresMetadata: any;
  isSyncingBuildCores: boolean;
  syncBuildCores: () => Promise<{ success: boolean; message: string }>;
  updateConfig: (patch: Partial<DiagnosisConfig>) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  reloadComponents: () => Promise<void>;
  addOrUpdateCpu: (cpu: CPU) => Promise<boolean>;
  deleteCpu: (id: string) => Promise<boolean>;
  addOrUpdateGpu: (gpu: GPU) => Promise<boolean>;
  deleteGpu: (id: string) => Promise<boolean>;
  addOrUpdateSoc: (soc: MobileSoC) => Promise<boolean>;
  deleteSoc: (id: string) => Promise<boolean>;
  addOrUpdatePsu: (psu: PSU) => Promise<boolean>;
  deletePsu: (id: string) => Promise<boolean>;
  addOrUpdateMotherboard: (mb: Motherboard) => Promise<boolean>;
  deleteMotherboard: (id: string) => Promise<boolean>;
}

const HardwareContext = createContext<HardwareContextType | undefined>(undefined);

// Default seed configuration as requested: AMD Ryzen 7 7800X3D + RTX 5070 Ti in 1440p with Corsair PSU & RAM
const DEFAULT_CONFIG: DiagnosisConfig = {
  cpu: INITIAL_CPUS.find(c => c.id === 'cpu-7800x3d') || INITIAL_CPUS[0], // AMD Ryzen 7 7800X3D
  gpu: INITIAL_GPUS[0], // NVIDIA GeForce RTX 5070 Ti
  ram: INITIAL_RAMS.find(r => r.id === 'ram-corsair-veng-rgb-32-6000') || INITIAL_RAMS[0], // Corsair Vengeance RGB 32GB 6000MHz
  storage: INITIAL_STORAGES[1], // 2TB NVMe Gen4
  psu: INITIAL_PSUS.find(p => p.id === 'psu-corsair-rm850x-shift') || INITIAL_PSUS[6] || INITIAL_PSUS[0], // Corsair RM850x SHIFT ATX 3.1
  motherboard: INITIAL_MOTHERBOARDS.find(m => m.id === 'mb-asus-b650-plus-wifi') || INITIAL_MOTHERBOARDS[2] || INITIAL_MOTHERBOARDS[0],
  platform: 'desktop',
  deviceType: 'desktop',
  resolution: '1440p',
  monitorCount: 1,
  monitorMode: 'gaming_primary',
  upscalingTech: 'dlss',
  upscalingMode: 'native',
  renderScalePct: 100,
  workload: 'gaming',
  workloads: ['gaming'],
  os: 'Windows 11'
};

export const HardwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cpus, setCpus] = useState<CPU[]>(INITIAL_CPUS);
  const [gpus, setGpus] = useState<GPU[]>(INITIAL_GPUS);
  const [rams, setRams] = useState<RAM[]>(INITIAL_RAMS);
  const [storages, setStorages] = useState<Storage[]>(INITIAL_STORAGES);
  const [psus, setPsus] = useState<PSU[]>(INITIAL_PSUS);
  const [motherboards, setMotherboards] = useState<Motherboard[]>(INITIAL_MOTHERBOARDS);
  const [socs, setSocs] = useState<MobileSoC[]>(INITIAL_SOCS);
  const [prebuilts, setPrebuilts] = useState<PrebuiltPC[]>(INITIAL_PREBUILTS);
  const [buildcoresMetadata, setBuildcoresMetadata] = useState<any>(null);
  const [isSyncingBuildCores, setIsSyncingBuildCores] = useState<boolean>(false);

  const [currentConfig, setCurrentConfig] = useState<DiagnosisConfig>(DEFAULT_CONFIG);
  const [currentResult, setCurrentResult] = useState<BottleneckResult>(() => calculateBottleneck(DEFAULT_CONFIG));

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('embudo_recent_searches');
      return stored ? JSON.parse(stored) : ['Ryzen 7 7800X3D', 'RTX 5070 Ti', 'Snapdragon 8 Elite', 'Core i7-14700K'];
    } catch {
      return ['Ryzen 7 7800X3D', 'RTX 5070 Ti'];
    }
  });

  // Load from API on mount
  const reloadComponents = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/components/all', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.cpus && data.cpus.length > 0) setCpus(data.cpus);
        if (data.gpus && data.gpus.length > 0) setGpus(data.gpus);
        if (data.motherboards && data.motherboards.length > 0) setMotherboards(data.motherboards);
        if (data.psus && data.psus.length > 0) setPsus(data.psus);
        if (data.rams && data.rams.length > 0) setRams(data.rams);
        if (data.storages && data.storages.length > 0) setStorages(data.storages);
        if (data.socs && data.socs.length > 0) setSocs(data.socs);
        if (data.metadata) setBuildcoresMetadata(data.metadata);
      }
    } catch (err: any) {
      console.warn('[HardwareContext] Aviso al cargar componentes completos, reintentando:', err?.message);
      // Retry once without abort controller in case of transient latency
      try {
        const retryRes = await fetch('/api/components/all');
        if (retryRes.ok) {
          const data = await retryRes.json();
          if (data.cpus && data.cpus.length > 0) setCpus(data.cpus);
          if (data.gpus && data.gpus.length > 0) setGpus(data.gpus);
          if (data.motherboards && data.motherboards.length > 0) setMotherboards(data.motherboards);
          if (data.psus && data.psus.length > 0) setPsus(data.psus);
          if (data.rams && data.rams.length > 0) setRams(data.rams);
          if (data.storages && data.storages.length > 0) setStorages(data.storages);
          if (data.socs && data.socs.length > 0) setSocs(data.socs);
          if (data.metadata) setBuildcoresMetadata(data.metadata);
        }
      } catch (retryErr) {
        console.warn('[HardwareContext] Catálogo local inicial activo como fallback:', retryErr);
      }
    }
  };

  const syncBuildCores = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncingBuildCores(true);
    try {
      const res = await fetch('/api/buildcores/sync', { method: 'POST' });
      const data = await res.json();
      await reloadComponents();
      setIsSyncingBuildCores(false);
      return {
        success: data.success ?? true,
        message: data.message || 'Componentes sincronizados exitosamente desde buildcores-open-db'
      };
    } catch (err: any) {
      setIsSyncingBuildCores(false);
      return { success: false, message: err?.message || 'Error al conectar con BuildCores' };
    }
  };

  useEffect(() => {
    reloadComponents();
  }, []);

  // Update calculation whenever config changes
  useEffect(() => {
    const res = calculateBottleneck(currentConfig);
    setCurrentResult(res);
  }, [currentConfig]);

  const updateConfig = (patch: Partial<DiagnosisConfig>) => {
    setCurrentConfig(prev => ({
      ...prev,
      ...patch
    }));
  };

  const addRecentSearch = (query: string) => {
    if (!query || query.trim().length < 2) return;
    const clean = query.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      localStorage.setItem('embudo_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('embudo_recent_searches');
  };

  // Admin operations
  const addOrUpdateCpu = async (cpu: CPU): Promise<boolean> => {
    try {
      const token = localStorage.getItem('embudo_admin_token');
      const res = await fetch('/api/components/cpu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cpu)
      });
      if (res.ok) {
        setCpus(prev => {
          const idx = prev.findIndex(c => c.id === cpu.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = cpu;
            return next;
          }
          return [cpu, ...prev];
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    // Local fallback
    setCpus(prev => [cpu, ...prev.filter(c => c.id !== cpu.id)]);
    return true;
  };

  const deleteCpu = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('embudo_admin_token');
      await fetch(`/api/components/cpu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
    setCpus(prev => prev.filter(c => c.id !== id));
    return true;
  };

  const addOrUpdateGpu = async (gpu: GPU): Promise<boolean> => {
    try {
      const token = localStorage.getItem('embudo_admin_token');
      const res = await fetch('/api/components/gpu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gpu)
      });
      if (res.ok) {
        setGpus(prev => {
          const idx = prev.findIndex(g => g.id === gpu.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = gpu;
            return next;
          }
          return [gpu, ...prev];
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    setGpus(prev => [gpu, ...prev.filter(g => g.id !== gpu.id)]);
    return true;
  };

  const deleteGpu = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('embudo_admin_token');
      await fetch(`/api/components/gpu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
    setGpus(prev => prev.filter(g => g.id !== id));
    return true;
  };

  const addOrUpdateSoc = async (soc: MobileSoC): Promise<boolean> => {
    try {
      const token = localStorage.getItem('embudo_admin_token');
      const res = await fetch('/api/components/soc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(soc)
      });
      if (res.ok) {
        setSocs(prev => {
          const idx = prev.findIndex(s => s.id === soc.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = soc;
            return next;
          }
          return [soc, ...prev];
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    setSocs(prev => [soc, ...prev.filter(s => s.id !== soc.id)]);
    return true;
  };

  const deleteSoc = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('embudo_admin_token');
      await fetch(`/api/components/soc/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
    setSocs(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const addOrUpdatePsu = async (psu: PSU): Promise<boolean> => {
    setPsus(prev => [psu, ...prev.filter(p => p.id !== psu.id)]);
    return true;
  };

  const deletePsu = async (id: string): Promise<boolean> => {
    setPsus(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const addOrUpdateMotherboard = async (mb: Motherboard): Promise<boolean> => {
    setMotherboards(prev => [mb, ...prev.filter(m => m.id !== mb.id)]);
    return true;
  };

  const deleteMotherboard = async (id: string): Promise<boolean> => {
    setMotherboards(prev => prev.filter(m => m.id !== id));
    return true;
  };

  return (
    <HardwareContext.Provider
      value={{
        cpus,
        gpus,
        rams,
        storages,
        psus,
        motherboards,
        socs,
        prebuilts,
        currentConfig,
        currentResult,
        buildcoresMetadata,
        isSyncingBuildCores,
        syncBuildCores,
        updateConfig,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        reloadComponents,
        addOrUpdateCpu,
        deleteCpu,
        addOrUpdateGpu,
        deleteGpu,
        addOrUpdateSoc,
        deleteSoc,
        addOrUpdatePsu,
        deletePsu,
        addOrUpdateMotherboard,
        deleteMotherboard
      }}
    >
      {children}
    </HardwareContext.Provider>
  );
};

export const useHardware = () => {
  const context = useContext(HardwareContext);
  if (!context) {
    throw new Error('useHardware must be used within a HardwareProvider');
  }
  return context;
};
