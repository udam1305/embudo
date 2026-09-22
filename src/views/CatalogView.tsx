import React, { useState, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Cpu,
  Monitor,
  Zap,
  HardDrive,
  DollarSign,
  Search,
  Database,
  ExternalLink,
  CircuitBoard,
  Flame,
  Gauge,
  Check,
  Filter
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { PrebuiltPC, CPU, GPU, Motherboard, PSU, RAM, Storage } from '../types';
import { ActiveTab } from '../components/Navbar';

interface CatalogViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

type CatalogSection = 'prebuilts' | 'components';
type ComponentCategory = 'cpus' | 'gpus' | 'motherboards' | 'psus' | 'rams' | 'storages';

export const CatalogView: React.FC<CatalogViewProps> = ({ setActiveTab }) => {
  const {
    prebuilts,
    cpus,
    gpus,
    motherboards,
    psus,
    rams,
    storages,
    buildcoresMetadata,
    updateConfig
  } = useHardware();

  const [activeSection, setActiveSection] = useState<CatalogSection>('prebuilts');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [prebuiltBrand, setPrebuiltBrand] = useState<string>('All');
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('cpus');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const filteredPrebuilts = prebuilts.filter(p => {
    const matchTier = selectedTier === 'All' || p.tier === selectedTier;
    const matchBrand = prebuiltBrand === 'All' || 
      p.cpu.brand?.toLowerCase() === prebuiltBrand.toLowerCase() ||
      p.gpu.brand?.toLowerCase() === prebuiltBrand.toLowerCase() ||
      p.name.toLowerCase().includes(prebuiltBrand.toLowerCase());
    return matchTier && matchBrand;
  });

  const handleLoadPrebuilt = (pc: PrebuiltPC) => {
    const isLap = pc.tier.includes('Notebook') || pc.cpu.platform === 'laptop' || pc.cpu.isLaptop;
    updateConfig({
      platform: isLap ? 'laptop' : 'desktop',
      cpu: pc.cpu,
      gpu: pc.gpu,
      ram: pc.ram,
      storage: pc.storage,
      resolution: pc.tier === 'Entusiasta' ? '4k' : isLap ? '1440p' : pc.tier === 'Alta' ? '1440p' : pc.tier === 'Media' ? '1440p' : '1080p'
    });
    setActiveTab('pc-diag');
  };

  const handleEquipComponent = (type: ComponentCategory, item: any) => {
    if (type === 'cpus') {
      updateConfig({ cpu: item as CPU });
    } else if (type === 'gpus') {
      updateConfig({ gpu: item as GPU });
    } else if (type === 'motherboards') {
      updateConfig({ motherboard: item as Motherboard });
    } else if (type === 'psus') {
      updateConfig({ psu: item as PSU });
    } else if (type === 'rams') {
      updateConfig({ ram: item as RAM });
    } else if (type === 'storages') {
      updateConfig({ storage: item as Storage });
    }
    setActiveTab('pc-diag');
  };

  // Prebuilt tiers
  const tiers = ['All', 'Entrada', 'Media', 'Alta', 'Entusiasta', 'Notebook Gaming', 'Notebook Fino'];

  // Current category list
  const currentCategoryList = useMemo(() => {
    switch (activeCategory) {
      case 'cpus': return cpus;
      case 'gpus': return gpus;
      case 'motherboards': return motherboards;
      case 'psus': return psus;
      case 'rams': return rams;
      case 'storages': return storages;
      default: return [];
    }
  }, [activeCategory, cpus, gpus, motherboards, psus, rams, storages]);

  // Extract all available brands with item counts for filter
  const brandStats = useMemo(() => {
    const counts: Record<string, number> = {};
    currentCategoryList.forEach((item: any) => {
      const b = item.brand?.trim();
      if (b) {
        counts[b] = (counts[b] || 0) + 1;
      }
    });

    const sortedByCount = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const sortedAlpha = Object.keys(counts).sort((a, b) => a.localeCompare(b));

    return {
      counts,
      topBrands: ['All', ...sortedByCount.slice(0, 10)],
      allBrandsAlphabetical: ['All', ...sortedAlpha],
      totalBrandsCount: Object.keys(counts).length
    };
  }, [currentCategoryList]);

  // Filter components
  const filteredComponents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentCategoryList.filter((item: any) => {
      const matchBrand = brandFilter === 'All' || item.brand?.toLowerCase() === brandFilter.toLowerCase();
      const matchQuery = !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.socket && item.socket.toLowerCase().includes(q)) ||
        (item.chipset && item.chipset.toLowerCase().includes(q));
      return matchBrand && matchQuery;
    });
  }, [currentCategoryList, searchQuery, brandFilter]);

  const paginatedComponents = useMemo(() => {
    return filteredComponents.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredComponents, page]);

  const totalCount = buildcoresMetadata?.counts?.total || (cpus.length + gpus.length + motherboards.length + psus.length + rams.length + storages.length);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header with Switcher */}
      <div className="border-b border-slate-800 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-cyan-400" /> Catálogo de Hardware & Ensambles
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Catálogo de Componentes & Equipos Prearmados
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Explora configuraciones balanceadas o navega por los más de {totalCount.toLocaleString()} componentes importados automáticamente desde BuildCores Open DB.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#12161F] p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveSection('prebuilts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'prebuilts'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Equipos Prearmados ({prebuilts.length})
            </button>
            <button
              onClick={() => setActiveSection('components')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'components'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>BuildCores Open DB ({totalCount.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* Section 1: Prebuilts Filters (Tiers & Brands) */}
        {activeSection === 'prebuilts' && (
          <div className="space-y-3 mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                Gamas:
              </span>
              {tiers.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                    selectedTier === t
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {t === 'All' ? 'Todas' : t.startsWith('Notebook') ? `💻 ${t}` : `Gama ${t}`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                Marca / Ecosistema:
              </span>
              {[
                { id: 'All', label: 'Todas las Marcas' },
                { id: 'AMD', label: '🔴 AMD (Ryzen / Radeon)' },
                { id: 'Intel', label: '🔵 Intel (Core / Arc)' },
                { id: 'NVIDIA', label: '🟢 NVIDIA (GeForce RTX)' }
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => setPrebuiltBrand(b.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    prebuiltBrand === b.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Component Categories Bar */}
        {activeSection === 'components' && (
          <div className="mt-6 space-y-4">
            {/* Repository attribution banner */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-cyan-300">
                <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Base de datos sincronizada en tiempo real desde <strong>buildcores/buildcores-open-db</strong></span>
              </div>
              <a
                href="https://github.com/buildcores/buildcores-open-db"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-200 flex items-center gap-1 font-mono text-[11px] font-bold"
              >
                <span>Ver en GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'cpus', label: `CPUs (${cpus.length})`, icon: Cpu },
                { id: 'gpus', label: `GPUs (${gpus.length})`, icon: Monitor },
                { id: 'motherboards', label: `Placas Base (${motherboards.length})`, icon: CircuitBoard },
                { id: 'psus', label: `Fuentes (${psus.length})`, icon: Zap },
                { id: 'rams', label: `Memorias RAM (${rams.length})`, icon: Layers },
                { id: 'storages', label: `Almacenamiento (${storages.length})`, icon: HardDrive }
              ].map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id as ComponentCategory);
                      setPage(1);
                      setBrandFilter('All');
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/20'
                        : 'bg-[#151921] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search & Brand Filter Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder={`Buscar en ${currentCategoryList.length.toLocaleString()} ${activeCategory}... (ej: Ryzen, RTX, B650, DDR5, Corsair)`}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#151921] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Dropdown for EVERY Single Brand */}
                <div className="flex items-center gap-2">
                  <div className="relative min-w-[200px]">
                    <select
                      id="catalog-brand-select"
                      value={brandFilter}
                      onChange={(e) => {
                        setBrandFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2.5 bg-[#151921] border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="All">
                        🏷️ Todas las Marcas ({currentCategoryList.length.toLocaleString()})
                      </option>
                      {brandStats.allBrandsAlphabetical.filter(b => b !== 'All').map(brand => (
                        <option key={brand} value={brand}>
                          {brand} ({brandStats.counts[brand] || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {brandFilter !== 'All' && (
                    <button
                      onClick={() => {
                        setBrandFilter('All');
                        setPage(1);
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap border border-slate-700"
                      title="Quitar filtro de marca"
                    >
                      ✕ Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Brand Pills with item counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap mr-1">
                  Populares:
                </span>
                {brandStats.topBrands.map(brand => {
                  const isAll = brand === 'All';
                  const isSelected = brandFilter.toLowerCase() === brand.toLowerCase();
                  const count = isAll ? currentCategoryList.length : brandStats.counts[brand];
                  return (
                    <button
                      key={brand}
                      onClick={() => {
                        setBrandFilter(brand);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{isAll ? 'Todas' : brand}</span>
                      {count !== undefined && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: PREBUILTS CARDS */}
      {activeSection === 'prebuilts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrebuilts.map(pc => (
            <div
              key={pc.id}
              className="bg-[#151921] hover:border-cyan-500/40 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    pc.tier === 'Entusiasta'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : pc.tier === 'Alta'
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      : pc.tier === 'Media'
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    Gama {pc.tier}
                  </span>
                  <div className="text-xl font-black text-white flex items-center font-mono">
                    <DollarSign className="w-4 h-4 text-emerald-400 -mr-1" />
                    {pc.estimatedPriceUsd} <span className="text-xs text-slate-500 font-sans font-normal ml-1">USD est.</span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-white mb-1.5">{pc.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-5">{pc.description}</p>

                <div className="space-y-2 mb-5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"><Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU:</span>
                    <strong className="text-white font-medium text-xs truncate max-w-[240px]">{pc.cpu.name}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"><Monitor className="w-3.5 h-3.5 text-blue-400" /> GPU:</span>
                    <strong className="text-white font-medium text-xs truncate max-w-[240px]">{pc.gpu.name}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"><Layers className="w-3.5 h-3.5 text-teal-400" /> RAM:</span>
                    <strong className="text-white font-medium text-xs truncate max-w-[240px]">{pc.ram.capacityGb}GB {pc.ram.type} @ {pc.ram.speedMhz}MHz</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"><Zap className="w-3.5 h-3.5 text-orange-400" /> PSU:</span>
                    <strong className="text-white font-medium text-xs truncate max-w-[240px]">{pc.psu}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  {pc.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id={`catalog-load-btn-${pc.id}`}
                onClick={() => handleLoadPrebuilt(pc)}
                className="w-full py-3 rounded-xl bg-[#1C222D] hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 group border border-slate-700 hover:border-cyan-500 shadow-md"
              >
                <span>Diagnosticar & Probar Ensamble</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-400 group-hover:text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: BUILDCORES COMPONENTS GRID */}
      {activeSection === 'components' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mostrando {paginatedComponents.length} de {filteredComponents.length} componentes encontrados</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-cyan-400 hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedComponents.map((item: any) => (
              <div
                key={item.id}
                className="bg-[#151921] hover:border-cyan-500/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">
                      {item.brand || 'Componente'}
                    </span>
                    {item.releaseYear && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.releaseYear}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 leading-snug line-clamp-2">
                    {item.name}
                  </h4>

                  {/* Component specific badges */}
                  <div className="space-y-1.5 text-[11px] text-slate-300 font-mono mb-4">
                    {/* CPU Specifics */}
                    {activeCategory === 'cpus' && (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Socket:</span>
                          <span className="text-cyan-400 font-bold">{item.socket}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Núcleos / Hilos:</span>
                          <span>{item.cores}C / {item.threads}T</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Frecuencias:</span>
                          <span>{item.baseClock} - {item.boostClock} GHz</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">TDP:</span>
                          <span className="text-amber-400">{item.tdp}W</span>
                        </div>
                      </>
                    )}

                    {/* GPU Specifics */}
                    {activeCategory === 'gpus' && (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">VRAM:</span>
                          <span className="text-cyan-400 font-bold">{item.vram}GB {item.vramType}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Consumo TDP:</span>
                          <span className="text-amber-400">{item.tdp}W</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">PSU Recomendada:</span>
                          <span>{item.recommendedPsu}W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Upscaling:</span>
                          <span className="text-emerald-400">{item.dlssFsrSupport}</span>
                        </div>
                      </>
                    )}

                    {/* Motherboard Specifics */}
                    {activeCategory === 'motherboards' && (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Socket CPU:</span>
                          <span className="text-cyan-400 font-bold">{item.socket}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Chipset:</span>
                          <span>{item.chipset}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Factor de Forma:</span>
                          <span>{item.formFactor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Memoria Compatible:</span>
                          <span className="text-emerald-400">{item.memoryType}</span>
                        </div>
                      </>
                    )}

                    {/* PSU Specifics */}
                    {activeCategory === 'psus' && (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Potencia:</span>
                          <span className="text-amber-400 font-bold">{item.wattage}W</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Certificación:</span>
                          <span className="text-emerald-400">{item.efficiency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Modularidad:</span>
                          <span>{item.modular}</span>
                        </div>
                      </>
                    )}

                    {/* RAM Specifics */}
                    {activeCategory === 'rams' && (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Capacidad & Tipo:</span>
                          <span className="text-cyan-400 font-bold">{item.capacityGb}GB {item.type}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Frecuencia:</span>
                          <span>{item.speedMhz} MHz</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Latencia CAS:</span>
                          <span>CL{item.casLatency}</span>
                        </div>
                      </>
                    )}

                    {/* Storage Specifics */}
                    {activeCategory === 'storages' && (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Capacidad:</span>
                          <span className="text-cyan-400 font-bold">{item.capacityGb >= 1000 ? `${item.capacityGb / 1000}TB` : `${item.capacityGb}GB`}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-1">
                          <span className="text-slate-500">Interfaz:</span>
                          <span>{item.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Velocidad Lectura:</span>
                          <span className="text-emerald-400">~{item.readSpeedMb} MB/s</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleEquipComponent(activeCategory, item)}
                  className="w-full py-2.5 rounded-xl bg-[#1C222D] hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/80 hover:border-cyan-400"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:text-slate-950" />
                  <span>Probar en Diagnóstico</span>
                </button>
              </div>
            ))}
          </div>

          {/* Load more button */}
          {paginatedComponents.length < filteredComponents.length && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-3 rounded-xl bg-[#151921] hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cargar más componentes (+{ITEMS_PER_PAGE})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
