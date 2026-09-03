import React, { useState } from 'react';
import { Layers, CheckCircle2, ArrowRight, Sparkles, Cpu, Monitor, Zap, HardDrive, DollarSign } from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { PrebuiltPC } from '../types';
import { ActiveTab } from '../components/Navbar';

interface CatalogViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ setActiveTab }) => {
  const { prebuilts, updateConfig } = useHardware();
  const [selectedTier, setSelectedTier] = useState<string>('All');

  const filtered = prebuilts.filter(p => selectedTier === 'All' || p.tier === selectedTier);

  const handleLoadPrebuilt = (pc: PrebuiltPC) => {
    updateConfig({
      cpu: pc.cpu,
      gpu: pc.gpu,
      ram: pc.ram,
      storage: pc.storage,
      resolution: pc.tier === 'Entusiasta' ? '4k' : pc.tier === 'Alta' ? '1440p' : pc.tier === 'Media' ? '1440p' : '1080p'
    });
    setActiveTab('pc-diag');
  };

  const tiers = ['All', 'Entrada', 'Media', 'Alta', 'Entusiasta'];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          <Layers className="w-4 h-4 text-cyan-400" /> CATÁLOGO DE ENSAMBLES BALANCEADOS
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Configuraciones Prearmadas (Gama Entrada a Entusiasta)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          PCs diseñadas para eliminar cuellos de botella por hardware, con relaciones perfectas de consumo y rendimiento.
        </p>

        {/* Tier filter buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {tiers.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                selectedTier === t
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t === 'All' ? 'Todos los Ensambles' : `Gama ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(pc => (
          <div
            key={pc.id}
            className="bg-[#151921] hover:border-cyan-500/40 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl transition-all duration-200"
          >
            <div>
              {/* Top tier badge & price */}
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

              {/* Component breakdown */}
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

              {/* Highlights */}
              <div className="space-y-1.5 mb-6">
                {pc.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA to customize */}
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
    </div>
  );
};
