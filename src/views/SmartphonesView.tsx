import React, { useState, useMemo, useEffect } from 'react';
import {
  Smartphone,
  Flame,
  BatteryCharging,
  Gauge,
  Gamepad2,
  Sparkles,
  Scale,
  Thermometer,
  Search,
  CheckCircle2,
  TrendingUp,
  Star,
  Clock,
  Layers,
  ExternalLink,
  X,
  Loader2,
  Info,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { calculateMobileDiagnostic } from '../lib/calculatorEngine';
import { ISmartphoneItem, ISmartphoneDetails, IBrandItem } from '../types';
import {
  fetchPhoneBrands,
  fetchPhonesByBrand,
  fetchLatestPhones,
  fetchTopByInterest,
  fetchTopByFans,
  searchSmartphones,
  fetchMobileApiInfo,
  MobileSpecsApiInfo,
  filterOnlyPhones
} from '../lib/mobileSpecsClient';
import { PhoneDetailsModal } from '../components/PhoneDetailsModal';
import { PhoneComparisonView } from '../components/PhoneComparisonView';

export const SmartphonesView: React.FC = () => {
  const { socs } = useHardware();

  // Navigation mode: 'search' (default search engine) | 'compare' | 'soc-diag'
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'compare' | 'soc-diag'>('search');

  // --- Mobile Specs API State ---
  const [apiInfo, setApiInfo] = useState<MobileSpecsApiInfo | null>(null);
  const [brands, setBrands] = useState<Record<string, IBrandItem>>({});
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Phone listings
  const [phones, setPhones] = useState<ISmartphoneItem[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [phoneListTitle, setPhoneListTitle] = useState('Top 10 Smartphones Más Buscados');
  const [currentFilter, setCurrentFilter] = useState<'top-interest' | 'top-fans' | 'latest' | 'brand' | 'search'>('top-interest');
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>('samsung-phones-9');
  const [selectedBrandName, setSelectedBrandName] = useState<string>('Samsung');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Selected phone modal
  const [selectedModalSlug, setSelectedModalSlug] = useState<string | null>(null);

  // Comparison state
  const [compareTargetA, setCompareTargetA] = useState<ISmartphoneDetails | null>(null);
  const [compareTargetB, setCompareTargetB] = useState<ISmartphoneDetails | null>(null);

  // --- SoC Diagnostic State ---
  const [socBrandFilter, setSocBrandFilter] = useState<string>('All');
  const [compareSocBrandFilter, setCompareSocBrandFilter] = useState<string>('All');
  const [selectedSocId, setSelectedSocId] = useState<string>(socs[0]?.id || 'soc-8elite');
  const [usageProfile, setUsageProfile] = useState<'gaming_hardcore' | 'gaming_casual' | 'emulation' | 'multitask_social' | 'content_creation'>('gaming_hardcore');
  const [compareSocId, setCompareSocId] = useState<string>(socs[1]?.id || 'soc-a18pro');
  const [showSocComparison, setShowSocComparison] = useState(false);

  // Popular search suggestions
  const searchSuggestions = [
    'iPhone 16 Pro Max',
    'Galaxy S25 Ultra',
    'Pixel 9 Pro',
    'Xiaomi 14 Ultra',
    'Poco X6 Pro',
    'OnePlus 12',
    'ROG Phone 8',
    'Motorola Edge 50',
    'Realme GT 6',
    'Honor Magic 6'
  ];

  // Popular brands shortcuts
  const popularBrands = [
    { name: 'Apple', slug: 'apple-phones-48' },
    { name: 'Samsung', slug: 'samsung-phones-9' },
    { name: 'Xiaomi', slug: 'xiaomi-phones-80' },
    { name: 'Google', slug: 'google-phones-107' },
    { name: 'OnePlus', slug: 'oneplus-phones-95' },
    { name: 'Motorola', slug: 'motorola-phones-4' },
    { name: 'Realme', slug: 'realme-phones-118' },
    { name: 'Honor', slug: 'honor-phones-121' },
    { name: 'vivo', slug: 'vivo-phones-98' },
    { name: 'Asus', slug: 'asus-phones-46' },
    { name: 'Sony', slug: 'sony-phones-7' },
    { name: 'Nothing', slug: 'nothing-phones-128' },
    { name: 'Oppo', slug: 'oppo-phones-82' },
    { name: 'Huawei', slug: 'huawei-phones-58' }
  ];

  // Load API Info and initial top phones on mount
  useEffect(() => {
    fetchMobileApiInfo().then(setApiInfo).catch(() => {});

    setLoadingBrands(true);
    fetchPhoneBrands()
      .then((data) => setBrands(data))
      .catch(() => {})
      .finally(() => setLoadingBrands(false));

    loadTopInterest();
  }, []);

  const loadTopInterest = async () => {
    setLoadingPhones(true);
    setCurrentFilter('top-interest');
    setPhoneListTitle('Top 10 Smartphones Más Populares Hoy (Daily Hits)');
    try {
      const data = await fetchTopByInterest();
      setPhones(filterOnlyPhones(data));
    } catch {
      setPhones([]);
    } finally {
      setLoadingPhones(false);
    }
  };

  const loadTopFans = async () => {
    setLoadingPhones(true);
    setCurrentFilter('top-fans');
    setPhoneListTitle('Top 10 Favoritos de la Comunidad (Mayor Cantidad de Fans)');
    try {
      const data = await fetchTopByFans();
      setPhones(filterOnlyPhones(data));
    } catch {
      setPhones([]);
    } finally {
      setLoadingPhones(false);
    }
  };

  const loadLatest = async () => {
    setLoadingPhones(true);
    setCurrentFilter('latest');
    setPhoneListTitle('Últimos Teléfonos Lanzados / En Tiendas');
    try {
      const data = await fetchLatestPhones();
      setPhones(filterOnlyPhones(data));
    } catch {
      setPhones([]);
    } finally {
      setLoadingPhones(false);
    }
  };

  const loadBrandPhones = async (slug: string, brandName: string) => {
    setLoadingPhones(true);
    setCurrentFilter('brand');
    setSelectedBrandSlug(slug);
    setSelectedBrandName(brandName);
    setPhoneListTitle(`Catálogo de Teléfonos ${brandName}`);
    try {
      const data = await fetchPhonesByBrand(slug);
      setPhones(filterOnlyPhones(data));
    } catch {
      setPhones([]);
    } finally {
      setLoadingPhones(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      setCurrentFilter('search');
      try {
        const results = await searchSmartphones(searchQuery);
        const filtered = filterOnlyPhones(results);
        setPhones(filtered);
        setPhoneListTitle(`Resultados para "${searchQuery}" (${filtered.length} teléfonos encontrados)`);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    loadTopInterest();
  };

  const handleApplySuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  // Connect phone chipset to SoC diagnostic
  const handleDiagnoseSoc = (chipsetName: string) => {
    setSelectedModalSlug(null);
    setActiveSubTab('soc-diag');

    const clean = chipsetName.toLowerCase();
    const matched = socs.find((s) => {
      const sName = s.name.toLowerCase();
      if (clean.includes('8 elite') && sName.includes('8 elite')) return true;
      if (clean.includes('8 gen 3') && sName.includes('8 gen 3')) return true;
      if (clean.includes('8 gen 2') && sName.includes('8 gen 2')) return true;
      if (clean.includes('a18') && sName.includes('a18')) return true;
      if (clean.includes('a17') && sName.includes('a17')) return true;
      if (clean.includes('9300') && sName.includes('9300')) return true;
      if (clean.includes('9400') && sName.includes('9400')) return true;
      if (clean.includes('tensor g4') && sName.includes('tensor g4')) return true;
      if (clean.includes('tensor g3') && sName.includes('tensor g3')) return true;
      if (clean.includes('exynos 2400') && sName.includes('exynos 2400')) return true;
      return false;
    });

    if (matched) {
      setSelectedSocId(matched.id);
    }
  };

  const handleAddToCompare = (details: ISmartphoneDetails) => {
    setSelectedModalSlug(null);
    if (!compareTargetA) {
      setCompareTargetA(details);
    } else {
      setCompareTargetB(details);
    }
    setActiveSubTab('compare');
  };

  // SoC filters
  const availableSocBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    socs.forEach((s) => {
      if (s.manufacturer) brandsSet.add(s.manufacturer);
    });
    return ['All', ...Array.from(brandsSet).sort()];
  }, [socs]);

  const filteredSocs = useMemo(() => {
    if (socBrandFilter === 'All') return socs;
    return socs.filter((s) => s.manufacturer.toLowerCase() === socBrandFilter.toLowerCase());
  }, [socs, socBrandFilter]);

  const filteredCompareSocs = useMemo(() => {
    if (compareSocBrandFilter === 'All') return socs;
    return socs.filter((s) => s.manufacturer.toLowerCase() === compareSocBrandFilter.toLowerCase());
  }, [socs, compareSocBrandFilter]);

  const currentSoc = socs.find((s) => s.id === selectedSocId) || socs[0];
  const compareSoc = socs.find((s) => s.id === compareSocId) || socs[1];

  const diagResult = calculateMobileDiagnostic(currentSoc, usageProfile);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-5 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            BUSCADOR ESPECIALIZADO DE SMARTPHONES & FICHAS TÉCNICAS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Buscador Universal de Teléfonos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Encuentra al instante cualquier teléfono entre más de 6,000 modelos de GSMArena. Filtro estricto: solo teléfonos (relojes y wearables excluidos).
          </p>
        </div>

        {/* Verification badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Solo Teléfonos</span>
          </div>

          <a
            href="https://github.com/RevengerNick/mobile-specs-api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#151921] hover:bg-[#1C222D] border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Mobile Specs API de GSMArena"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Mobile Specs API</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </a>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('search')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'search'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-[#151921] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          Buscador & Catálogo de Teléfonos
        </button>

        <button
          onClick={() => setActiveSubTab('compare')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'compare'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-[#151921] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4 text-cyan-400" />
          Comparador Cara a Cara
        </button>

        <button
          onClick={() => setActiveSubTab('soc-diag')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'soc-diag'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-[#151921] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-400" />
          Diagnóstico Térmico & Gaming de SoCs
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: TOTAL PHONE SEARCH ENGINE ("TODO UN BUSCADOR")
         ========================================================================= */}
      {activeSubTab === 'search' && (
        <div className="space-y-6">
          {/* Main Hero Search Container */}
          <div className="bg-[#151921] border border-cyan-500/25 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>

            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Buscador Inteligente de Teléfonos
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                ¿Qué teléfono estás buscando?
              </h2>
              <p className="text-xs text-slate-400">
                Escribe cualquier marca, familia o modelo. Búsqueda instantánea en tiempo real.
              </p>
            </div>

            {/* Central High-Contrast Search Input */}
            <div className="relative max-w-3xl mx-auto">
              <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="phone-specs-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribe un teléfono: Galaxy S25 Ultra, iPhone 16 Pro, Xiaomi 14, Poco X6, Pixel 9..."
                className="w-full pl-12 pr-28 py-4 bg-[#1B212D] border-2 border-slate-700/80 hover:border-cyan-500/50 focus:border-cyan-500 rounded-2xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searching && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick search suggestions pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-3xl mx-auto pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Búsquedas Populares:
              </span>
              {searchSuggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => handleApplySuggestion(sug)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C222E] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 transition-all cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/80 pt-4 space-y-4">
              {/* Brand Filter Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Marcas Líderes de Teléfonos
                  </span>

                  {/* Dropdown for 100+ brands */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">Todas las marcas:</span>
                    <select
                      value={selectedBrandSlug}
                      onChange={(e) => {
                        const slug = e.target.value;
                        const brandList = Object.values(brands) as IBrandItem[];
                        const b = brandList.find((item) => item.brand_slug === slug);
                        loadBrandPhones(slug, b?.brand_name || 'Marca');
                      }}
                      className="px-3 py-1 bg-[#1C222E] border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {(Object.values(brands) as IBrandItem[]).map((b) => (
                        <option key={b.brand_slug} value={b.brand_slug}>
                          {b.brand_name} ({b.device_count} terminales)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Popular Brand Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {popularBrands.map((b) => {
                    const isSelected = currentFilter === 'brand' && selectedBrandSlug === b.slug && !searchQuery;
                    return (
                      <button
                        key={b.slug}
                        onClick={() => {
                          setSearchQuery('');
                          loadBrandPhones(b.slug, b.name);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105'
                            : 'bg-[#1C222E] text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/70'
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exploration Modes Bar */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Explorar:
                </span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadTopInterest();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentFilter === 'top-interest' && !searchQuery
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-[#1C222E] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  Top Más Buscados Hoy
                </button>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadTopFans();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentFilter === 'top-fans' && !searchQuery
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-[#1C222E] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-blue-400" />
                  Top Favoritos
                </button>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadLatest();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentFilter === 'latest' && !searchQuery
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#1C222E] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Últimos Lanzamientos
                </button>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              {phoneListTitle}
            </h3>
            <span className="text-xs text-slate-400 font-semibold bg-[#151921] px-3 py-1 rounded-lg border border-slate-800">
              {phones.length} smartphone{phones.length !== 1 ? 's' : ''} (Solo teléfonos)
            </span>
          </div>

          {/* Loading Grid State */}
          {loadingPhones && (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-cyan-400 bg-[#151921] border border-slate-800 rounded-2xl">
              <Loader2 className="w-9 h-9 animate-spin" />
              <p className="text-xs font-semibold text-slate-400">
                Consultando catálogo de smartphones en tiempo real...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loadingPhones && phones.length === 0 && (
            <div className="p-12 text-center bg-[#151921] border border-slate-800 rounded-2xl space-y-3">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-base font-bold text-white">No se encontraron teléfonos para esta búsqueda</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Verifica el nombre del modelo o prueba con una marca en los botones superiores (ej. Apple, Samsung, Xiaomi, Motorola).
              </p>
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-[#1C222E] hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Volver al Top de Smartphones Más Buscados
              </button>
            </div>
          )}

          {/* Phones Cards Grid */}
          {!loadingPhones && phones.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {phones.map((phone, idx) => (
                <div
                  key={phone.slug + idx}
                  className="group bg-[#151921] hover:bg-[#1A202E] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer relative"
                  onClick={() => setSelectedModalSlug(phone.slug)}
                >
                  {/* Rank Badge if present */}
                  {phone.rank && (
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] font-black text-cyan-300">
                      #{phone.rank}
                    </div>
                  )}

                  {/* Daily hits if present */}
                  {phone.hits && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-800/90 text-[10px] font-mono text-slate-400 border border-slate-700/60">
                      {phone.hits.toLocaleString()} hits
                    </div>
                  )}

                  {/* Device Image */}
                  <div className="w-full h-40 flex items-center justify-center bg-[#0E121A] rounded-xl p-3 my-2 border border-slate-800/80 group-hover:border-slate-700 transition-colors">
                    {phone.imageUrl ? (
                      <img
                        src={phone.imageUrl}
                        alt={phone.name}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Smartphone className="w-14 h-14 text-slate-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 pt-1">
                    {phone.brand && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {phone.brand}
                      </span>
                    )}
                    <h4
                      className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 line-clamp-2 transition-colors"
                      title={phone.name}
                    >
                      {phone.name}
                    </h4>

                    {/* View Specs Action */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-cyan-400">
                      <span>Ver Ficha Técnica</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HEAD-TO-HEAD SMARTPHONE COMPARATOR
         ========================================================================= */}
      {activeSubTab === 'compare' && (
        <PhoneComparisonView
          initialPhoneA={compareTargetA}
          initialPhoneB={compareTargetB}
          onDiagnoseSoc={handleDiagnoseSoc}
        />
      )}

      {/* =========================================================================
          VIEW 3: THERMAL STABILITY & GAMING SOC DIAGNOSTIC
         ========================================================================= */}
      {activeSubTab === 'soc-diag' && (
        <div className="space-y-8">
          {/* Main Selector Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: SoC & Profile Selectors */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" /> PROCESADOR MÓVIL (SOC)
                  </label>
                  {/* Brand filter pills */}
                  <div className="flex items-center gap-1 text-[11px] flex-wrap">
                    {availableSocBrands.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSocBrandFilter(b)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          socBrandFilter === b
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  id="mobile-select-soc"
                  value={selectedSocId}
                  onChange={(e) => setSelectedSocId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
                >
                  {filteredSocs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.manufacturer} {s.processNodeNm}nm) • AnTuTu: ~
                      {(s.anTuTuScore / 1000000).toFixed(2)}M
                    </option>
                  ))}
                </select>

                {/* Quick Specs summary */}
                <div className="p-3.5 bg-[#1C222D] rounded-xl border border-slate-700/80 text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Arquitectura CPU:</span>
                    <strong className="text-white truncate max-w-[200px] font-mono">
                      {currentSoc.cpuConfiguration}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">GPU Móvil:</span>
                    <strong className="text-cyan-300 font-mono">{currentSoc.gpuName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Dispositivos típicos:</span>
                    <span className="text-slate-300 text-[11px] truncate max-w-[220px]">
                      {currentSoc.typicalDevices.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Profile Selector */}
              <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                  PERFIL DE USO EN EL TELÉFONO
                </label>
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'gaming_hardcore',
                      label: 'Gaming Competitivo 120 FPS / Warzone',
                      sub: 'Carga térmica y gráfica máxima'
                    },
                    {
                      id: 'emulation',
                      label: 'Emulación Switch / PS2 / Sudachi',
                      sub: 'Exige alto IPC Mononúcleo y drivers Adreno'
                    },
                    {
                      id: 'content_creation',
                      label: 'Edición de Video 4K & Creación',
                      sub: 'Exige CPU multinúcleo y decodificación'
                    },
                    {
                      id: 'multitask_social',
                      label: 'Redes Sociales & Multitarea',
                      sub: 'Eficiencia y ahorro de batería'
                    }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setUsageProfile(p.id as any)}
                      className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        usageProfile === p.id
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                          : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison Toggle Button */}
              <button
                onClick={() => setShowSocComparison(!showSocComparison)}
                className="w-full py-3 bg-[#151921] hover:bg-[#1C222D] border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Scale className="w-4 h-4 text-cyan-400" />
                {showSocComparison ? 'Ocultar Comparativa de Chips' : 'Comparar con Otro Chip Móvil'}
              </button>
            </div>

            {/* Right Column: Thermal & Performance Diagnostic */}
            <div className="lg:col-span-7 space-y-6">
              {/* Main Thermal Stability & Throttling Card */}
              <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      ESTABILIDAD & ESTRANGULAMIENTO TÉRMICO
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">{currentSoc.name}</h3>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                      diagResult.throttleRisk === 'Bajo'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : diagResult.throttleRisk === 'Moderado'
                        ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    Riesgo: {diagResult.throttleRisk}
                  </div>
                </div>

                {/* Stability & Temperature stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700/80 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Estabilidad
                    </div>
                    <div className="text-3xl font-black text-cyan-300 mt-1">
                      {currentSoc.thermalStabilityPct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Retención térmica</div>
                  </div>

                  <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700/80 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Temp. 60m Gaming
                    </div>
                    <div className="text-3xl font-black text-white mt-1">
                      {diagResult.temperaturesEstimate.gaming60minC}°C
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">En chasis / batería</div>
                  </div>

                  <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700/80 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Autonomía
                    </div>
                    <div className="text-3xl font-black text-emerald-400 mt-1">
                      {diagResult.estimatedBatteryHoursGaming}h
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Consumo ~{currentSoc.tdpAvgWatts}W
                    </div>
                  </div>
                </div>

                {/* Stutter risk alert */}
                <div className="p-3.5 rounded-xl bg-[#1C222D] border border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Riesgo de Tirones / Caída de 1% Lows:</span>
                  <strong className="text-emerald-400 font-bold">{diagResult.stutterRisk}</strong>
                </div>
              </div>

              {/* Game Benchmark breakdown for Mobile */}
              <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" /> COMPATIBILIDAD & RENDIMIENTO EN TÍTULOS
                  MÓVILES TOP
                </h3>

                <div className="space-y-2.5 text-xs">
                  {diagResult.supportedGames.map((game, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#1C222D] rounded-xl border border-slate-700/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{game.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Gráficos: {game.graphicsQuality} • Target: {game.targetFps}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          game.experience === 'Excelente'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : game.experience === 'Fluido'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        {game.experience}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips for mobile cooling and performance */}
              <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> RECOMENDACIONES DE OPTIMIZACIÓN MÓVIL
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {diagResult.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 bg-[#1C222D] p-3 rounded-xl border border-slate-700/80"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Optional Side-by-Side Mobile Chipset Comparison Drawer */}
          {showSocComparison && (
            <div className="mt-8 bg-[#151921] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" /> Comparativa: {currentSoc.name} vs{' '}
                  {compareSoc.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-[11px]">
                    {availableSocBrands.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setCompareSocBrandFilter(b)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          compareSocBrandFilter === b
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <select
                    value={compareSocId}
                    onChange={(e) => setCompareSocId(e.target.value)}
                    className="px-3 py-2 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 cursor-pointer"
                  >
                    {filteredCompareSocs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chip A */}
                <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 space-y-2.5">
                  <div className="font-extrabold text-white text-sm">{currentSoc.name}</div>
                  <div className="text-xs text-slate-400">
                    AnTuTu v10:{' '}
                    <strong className="text-cyan-300 font-mono">
                      {(currentSoc.anTuTuScore / 1000000).toFixed(2)}M pts
                    </strong>
                  </div>
                  <div className="text-xs text-slate-400">
                    Geekbench 6 Multi:{' '}
                    <strong className="text-white font-mono">{currentSoc.geekbenchMulti} pts</strong>
                  </div>
                  <div className="text-xs text-slate-400">
                    Retención Térmica:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {currentSoc.thermalStabilityPct}%
                    </strong>
                  </div>
                </div>

                {/* Chip B */}
                <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 space-y-2.5">
                  <div className="font-extrabold text-white text-sm">{compareSoc.name}</div>
                  <div className="text-xs text-slate-400">
                    AnTuTu v10:{' '}
                    <strong className="text-blue-300 font-mono">
                      {(compareSoc.anTuTuScore / 1000000).toFixed(2)}M pts
                    </strong>
                  </div>
                  <div className="text-xs text-slate-400">
                    Geekbench 6 Multi:{' '}
                    <strong className="text-white font-mono">{compareSoc.geekbenchMulti} pts</strong>
                  </div>
                  <div className="text-xs text-slate-400">
                    Retención Térmica:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {compareSoc.thermalStabilityPct}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phone Details Modal */}
      <PhoneDetailsModal
        slug={selectedModalSlug}
        onClose={() => setSelectedModalSlug(null)}
        onDiagnoseSoc={handleDiagnoseSoc}
        onAddToCompare={handleAddToCompare}
      />
    </div>
  );
};
