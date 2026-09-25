import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Cpu,
  Eye,
  Camera,
  Battery,
  HardDrive,
  Layers,
  Sparkles,
  ExternalLink,
  Scale,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { ISmartphoneDetails } from '../types';
import { fetchPhoneDetails } from '../lib/mobileSpecsClient';

interface PhoneDetailsModalProps {
  slug: string | null;
  onClose: () => void;
  onDiagnoseSoc?: (chipsetName: string) => void;
  onAddToCompare?: (details: ISmartphoneDetails) => void;
}

export const PhoneDetailsModal: React.FC<PhoneDetailsModalProps> = ({
  slug,
  onClose,
  onDiagnoseSoc,
  onAddToCompare,
}) => {
  const [details, setDetails] = useState<ISmartphoneDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Platform': true,
    'Display': true,
    'Main Camera': true,
    'Battery': true,
  });

  useEffect(() => {
    if (!slug) {
      setDetails(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchPhoneDetails(slug)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'No se pudieron cargar los detalles del dispositivo');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!slug) return null;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#12161F] border border-slate-700/80 rounded-2xl shadow-2xl text-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800 bg-[#161B26]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Ficha Técnica GSMArena
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {details?.model || slug.replace(/-/g, ' ')}
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

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-semibold text-slate-400">
                Extrayendo especificaciones en tiempo real desde GSMArena...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchPhoneDetails(slug)
                    .then((data) => {
                      setDetails(data);
                      setLoading(false);
                    })
                    .catch((err) => {
                      setError(err.message || 'No se pudieron cargar los detalles del dispositivo');
                      setLoading(false);
                    });
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold transition-colors cursor-pointer shrink-0"
              >
                Reintentar
              </button>
            </div>
          )}

          {details && !loading && (
            <>
              {/* Device Hero Summary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-[#181E2B] p-5 sm:p-6 rounded-2xl border border-slate-800">
                {/* Image */}
                <div className="md:col-span-4 flex flex-col items-center justify-center">
                  <div className="relative w-44 h-56 flex items-center justify-center bg-[#0F131A] rounded-xl border border-slate-700/60 p-3 shadow-inner">
                    {details.imageUrl ? (
                      <img
                        src={details.imageUrl}
                        alt={details.model}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain filter drop-shadow-md"
                        onError={(e) => {
                          // Hide broken image
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Smartphone className="w-20 h-20 text-slate-600" />
                    )}
                  </div>
                  {details.release_date && (
                    <span className="text-[11px] text-slate-400 font-medium mt-3 text-center">
                      📅 {details.release_date}
                    </span>
                  )}
                  {details.dimensions && (
                    <span className="text-[10px] text-slate-500 text-center mt-0.5">
                      📐 {details.dimensions}
                    </span>
                  )}
                </div>

                {/* Core Highlights */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {details.brand}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {details.model}
                    </h3>
                    {details.os && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        ⚙️ Sistema Operativo: <strong className="text-slate-200">{details.os}</strong>
                      </p>
                    )}
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {details.display && (
                      <div className="p-3 bg-[#131722] rounded-xl border border-slate-700/70">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> Pantalla
                        </div>
                        <div className="text-xs font-bold text-white leading-snug truncate" title={details.display}>
                          {details.display}
                        </div>
                      </div>
                    )}

                    {details.chipset && (
                      <div className="p-3 bg-[#131722] rounded-xl border border-slate-700/70">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <Cpu className="w-3.5 h-3.5 text-purple-400" /> Procesador
                        </div>
                        <div className="text-xs font-bold text-white leading-snug truncate" title={details.chipset}>
                          {details.chipset}
                        </div>
                      </div>
                    )}

                    {details.camera && (
                      <div className="p-3 bg-[#131722] rounded-xl border border-slate-700/70">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" /> Cámara
                        </div>
                        <div className="text-xs font-bold text-white leading-snug truncate" title={details.camera}>
                          {details.camera}
                        </div>
                      </div>
                    )}

                    {details.battery && (
                      <div className="p-3 bg-[#131722] rounded-xl border border-slate-700/70">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <Battery className="w-3.5 h-3.5 text-amber-400" /> Batería
                        </div>
                        <div className="text-xs font-bold text-white leading-snug truncate" title={details.battery}>
                          {details.battery}
                        </div>
                      </div>
                    )}

                    {details.storage && (
                      <div className="p-3 bg-[#131722] rounded-xl border border-slate-700/70">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Almacenamiento
                        </div>
                        <div className="text-xs font-bold text-white leading-snug truncate" title={details.storage}>
                          {details.storage}
                        </div>
                      </div>
                    )}

                    {details.ram && (
                      <div className="p-3 bg-[#131722] rounded-xl border border-slate-700/70">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <Layers className="w-3.5 h-3.5 text-pink-400" /> Memoria RAM
                        </div>
                        <div className="text-xs font-bold text-white leading-snug truncate" title={details.ram}>
                          {details.ram}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    {onDiagnoseSoc && details.chipset && (
                      <button
                        onClick={() => onDiagnoseSoc(details.chipset || details.model)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-cyan-200" />
                        Evaluar Gaming & Throttling del Chipset
                      </button>
                    )}

                    {onAddToCompare && (
                      <button
                        onClick={() => onAddToCompare(details)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1C2230] hover:bg-[#232A3C] text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Scale className="w-4 h-4 text-cyan-400" />
                        Añadir a Comparativa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Specifications Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Especificaciones Técnicas Completas ({Object.keys(details.specifications || {}).length} Categorías)
                </h4>

                {Object.entries(details.specifications || {}).map(([catName, specs]) => {
                  const isExpanded = expandedCategories[catName] !== false;
                  return (
                    <div
                      key={catName}
                      className="bg-[#161B26] border border-slate-800 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => toggleCategory(catName)}
                        className="w-full px-4 py-3 bg-[#191F2C] hover:bg-[#1E2535] flex items-center justify-between text-left cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          {catName}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 divide-y divide-slate-800/80 text-xs">
                          {Object.entries(specs).map(([key, val]) => (
                            <div key={key} className="py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <span className="sm:col-span-4 font-semibold text-slate-400">
                                {key}
                              </span>
                              <span className="sm:col-span-8 text-slate-200 whitespace-pre-line leading-relaxed font-mono text-[11px] sm:text-xs">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
