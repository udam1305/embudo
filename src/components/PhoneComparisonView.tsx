import React, { useState, useEffect } from 'react';
import {
  Scale,
  Search,
  Smartphone,
  Eye,
  Cpu,
  Camera,
  Battery,
  HardDrive,
  Layers,
  ArrowRightLeft,
  X,
  Loader2
} from 'lucide-react';
import { ISmartphoneDetails, ISmartphoneItem } from '../types';
import { fetchPhoneDetails, searchSmartphones } from '../lib/mobileSpecsClient';

interface PhoneComparisonViewProps {
  initialPhoneA?: ISmartphoneDetails | null;
  initialPhoneB?: ISmartphoneDetails | null;
  onDiagnoseSoc?: (chipsetName: string) => void;
}

export const PhoneComparisonView: React.FC<PhoneComparisonViewProps> = ({
  initialPhoneA,
  initialPhoneB,
  onDiagnoseSoc,
}) => {
  const [phoneA, setPhoneA] = useState<ISmartphoneDetails | null>(initialPhoneA || null);
  const [phoneB, setPhoneB] = useState<ISmartphoneDetails | null>(initialPhoneB || null);

  const [searchQueryA, setSearchQueryA] = useState('');
  const [searchQueryB, setSearchQueryB] = useState('');
  const [resultsA, setResultsA] = useState<ISmartphoneItem[]>([]);
  const [resultsB, setResultsB] = useState<ISmartphoneItem[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Initialize with top defaults if none provided
  useEffect(() => {
    if (!phoneA && !initialPhoneA) {
      setLoadingA(true);
      fetchPhoneDetails('samsung_galaxy_s24_ultra-12771')
        .then((res) => setPhoneA(res))
        .catch(() => {})
        .finally(() => setLoadingA(false));
    }
    if (!phoneB && !initialPhoneB) {
      setLoadingB(true);
      fetchPhoneDetails('apple_iphone_16_pro_max-13315')
        .then((res) => setPhoneB(res))
        .catch(() => {})
        .finally(() => setLoadingB(false));
    }
  }, []);

  const handleSearchA = async (q: string) => {
    setSearchQueryA(q);
    if (q.length < 2) {
      setResultsA([]);
      return;
    }
    try {
      const res = await searchSmartphones(q);
      setResultsA(res.slice(0, 6));
    } catch {}
  };

  const handleSearchB = async (q: string) => {
    setSearchQueryB(q);
    if (q.length < 2) {
      setResultsB([]);
      return;
    }
    try {
      const res = await searchSmartphones(q);
      setResultsB(res.slice(0, 6));
    } catch {}
  };

  const selectPhoneA = async (slug: string) => {
    setLoadingA(true);
    setResultsA([]);
    setSearchQueryA('');
    try {
      const data = await fetchPhoneDetails(slug);
      setPhoneA(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingA(false);
    }
  };

  const selectPhoneB = async (slug: string) => {
    setLoadingB(true);
    setResultsB([]);
    setSearchQueryB('');
    try {
      const data = await fetchPhoneDetails(slug);
      setPhoneB(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingB(false);
    }
  };

  const swapPhones = () => {
    const temp = phoneA;
    setPhoneA(phoneB);
    setPhoneB(temp);
  };

  return (
    <div className="space-y-6">
      {/* Comparison Controller */}
      <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Comparativa Técnica Cara a Cara (GSMArena Specs)
            </h3>
          </div>
          <button
            onClick={swapPhones}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1C222D] hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            Invertir Lados
          </button>
        </div>

        {/* Search Row for Phone A & Phone B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Phone A Selector */}
          <div className="relative">
            <label htmlFor="compare-phone-a-input" className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1.5 cursor-pointer">
              Dispositivo A: {phoneA?.model || 'Seleccionar...'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="compare-phone-a-input"
                name="comparePhoneA"
                aria-label="Buscar teléfono A para comparar"
                type="text"
                placeholder="Buscar teléfono A (ej: Galaxy S24, iPhone 16...)"
                value={searchQueryA}
                onChange={(e) => handleSearchA(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQueryA && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQueryA('');
                    setResultsA([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Limpiar selección A"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results dropdown A */}
            {resultsA.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1.5 bg-[#181E2B] border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
                {resultsA.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => selectPhoneA(item.slug)}
                    className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-cyan-500/10 transition-colors text-xs text-slate-200 cursor-pointer"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.brand || 'GSMArena'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone B Selector */}
          <div className="relative">
            <label htmlFor="compare-phone-b-input" className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1.5 cursor-pointer">
              Dispositivo B: {phoneB?.model || 'Seleccionar...'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="compare-phone-b-input"
                name="comparePhoneB"
                aria-label="Buscar teléfono B para comparar"
                type="text"
                placeholder="Buscar teléfono B (ej: Pixel 9, Xiaomi 14...)"
                value={searchQueryB}
                onChange={(e) => handleSearchB(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {searchQueryB && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQueryB('');
                    setResultsB([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Limpiar selección B"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results dropdown B */}
            {resultsB.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1.5 bg-[#181E2B] border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
                {resultsB.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => selectPhoneB(item.slug)}
                    className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-blue-500/10 transition-colors text-xs text-slate-200 cursor-pointer"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.brand || 'GSMArena'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device A View */}
        <div className="bg-[#151921] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>

          {loadingA ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs text-slate-400">Cargando especificaciones...</span>
            </div>
          ) : phoneA ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-24 h-32 bg-[#0E121A] rounded-xl border border-slate-700 p-2 flex items-center justify-center shrink-0">
                  {phoneA.imageUrl ? (
                    <img
                      src={phoneA.imageUrl}
                      alt={phoneA.model}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Smartphone className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {phoneA.brand}
                  </span>
                  <h4 className="text-lg font-black text-white mt-1 leading-snug">{phoneA.model}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">📅 {phoneA.release_date}</div>
                  <div className="text-[11px] text-slate-500">📐 {phoneA.dimensions}</div>
                </div>
              </div>

              {/* Specs Rows */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Pantalla
                  </div>
                  <div className="font-semibold text-white">{phoneA.display || phoneA.specifications['Display']?.['Type'] || 'No especificado'}</div>
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Procesador / Chipset
                  </div>
                  <div className="font-semibold text-cyan-300">{phoneA.chipset || phoneA.specifications['Platform']?.['Chipset'] || 'No especificado'}</div>
                  {phoneA.specifications['Platform']?.['GPU'] && (
                    <div className="text-[11px] text-slate-400 mt-1">GPU: {phoneA.specifications['Platform']['GPU']}</div>
                  )}
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" /> Cámaras
                  </div>
                  <div className="font-semibold text-white">{phoneA.camera || 'Ver detalles'}</div>
                  {phoneA.specifications['Main Camera'] && (
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {Object.values(phoneA.specifications['Main Camera'])[0]}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Battery className="w-3.5 h-3.5 text-amber-400" /> Batería & Carga
                  </div>
                  <div className="font-semibold text-white">{phoneA.battery || phoneA.specifications['Battery']?.['Type'] || 'No especificado'}</div>
                  {phoneA.specifications['Battery']?.['Charging'] && (
                    <div className="text-[11px] text-slate-400 mt-1">Carga: {phoneA.specifications['Battery']['Charging']}</div>
                  )}
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Almacenamiento & RAM
                  </div>
                  <div className="font-semibold text-white">{phoneA.storage}</div>
                  {phoneA.ram && <div className="text-[11px] text-slate-400 mt-1">RAM: {phoneA.ram}</div>}
                </div>
              </div>

              {onDiagnoseSoc && phoneA.chipset && (
                <button
                  onClick={() => onDiagnoseSoc(phoneA.chipset || phoneA.model)}
                  className="w-full py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Evaluar Rendimiento de Gaming de {phoneA.brand}
                </button>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Busca y selecciona un smartphone para el lado A
            </div>
          )}
        </div>

        {/* Device B View */}
        <div className="bg-[#151921] border border-blue-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>

          {loadingB ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-blue-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs text-slate-400">Cargando especificaciones...</span>
            </div>
          ) : phoneB ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-24 h-32 bg-[#0E121A] rounded-xl border border-slate-700 p-2 flex items-center justify-center shrink-0">
                  {phoneB.imageUrl ? (
                    <img
                      src={phoneB.imageUrl}
                      alt={phoneB.model}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Smartphone className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {phoneB.brand}
                  </span>
                  <h4 className="text-lg font-black text-white mt-1 leading-snug">{phoneB.model}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">📅 {phoneB.release_date}</div>
                  <div className="text-[11px] text-slate-500">📐 {phoneB.dimensions}</div>
                </div>
              </div>

              {/* Specs Rows */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Eye className="w-3.5 h-3.5 text-blue-400" /> Pantalla
                  </div>
                  <div className="font-semibold text-white">{phoneB.display || phoneB.specifications['Display']?.['Type'] || 'No especificado'}</div>
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Procesador / Chipset
                  </div>
                  <div className="font-semibold text-blue-300">{phoneB.chipset || phoneB.specifications['Platform']?.['Chipset'] || 'No especificado'}</div>
                  {phoneB.specifications['Platform']?.['GPU'] && (
                    <div className="text-[11px] text-slate-400 mt-1">GPU: {phoneB.specifications['Platform']['GPU']}</div>
                  )}
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" /> Cámaras
                  </div>
                  <div className="font-semibold text-white">{phoneB.camera || 'Ver detalles'}</div>
                  {phoneB.specifications['Main Camera'] && (
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {Object.values(phoneB.specifications['Main Camera'])[0]}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <Battery className="w-3.5 h-3.5 text-amber-400" /> Batería & Carga
                  </div>
                  <div className="font-semibold text-white">{phoneB.battery || phoneB.specifications['Battery']?.['Type'] || 'No especificado'}</div>
                  {phoneB.specifications['Battery']?.['Charging'] && (
                    <div className="text-[11px] text-slate-400 mt-1">Carga: {phoneB.specifications['Battery']['Charging']}</div>
                  )}
                </div>

                <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Almacenamiento & RAM
                  </div>
                  <div className="font-semibold text-white">{phoneB.storage}</div>
                  {phoneB.ram && <div className="text-[11px] text-slate-400 mt-1">RAM: {phoneB.ram}</div>}
                </div>
              </div>

              {onDiagnoseSoc && phoneB.chipset && (
                <button
                  onClick={() => onDiagnoseSoc(phoneB.chipset || phoneB.model)}
                  className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Evaluar Rendimiento de Gaming de {phoneB.brand}
                </button>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Busca y selecciona un smartphone para el lado B
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
