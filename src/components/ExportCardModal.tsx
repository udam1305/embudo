import React, { useState } from 'react';
import { X, Copy, Check, Share2, Download, Sparkles, Cpu, Zap, Activity, Gamepad2 } from 'lucide-react';
import { DiagnosisConfig, BottleneckResult } from '../types';
import confetti from 'canvas-confetti';

interface ExportCardModalProps {
  config: DiagnosisConfig;
  result: BottleneckResult;
  onClose: () => void;
}

export const ExportCardModal: React.FC<ExportCardModalProps> = ({ config, result, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleCopyShareLink = () => {
    const encoded = encodeURIComponent(
      JSON.stringify({
        cpu: config.cpu.id,
        gpu: config.gpu.id,
        ram: config.ram.id,
        res: config.resolution,
        work: config.workload
      })
    );
    const shareUrl = `${window.location.origin}?config=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyTextReport = () => {
    const text = `📊 INFORME DE DIAGNÓSTICO EMBUDO 📊
-------------------------------------------
🖥️ Procesador: ${config.cpu.name}
🎮 Tarjeta Gráfica: ${config.gpu.name}
⚡ Memoria RAM: ${config.ram.capacityGb}GB ${config.ram.type} @ ${config.ram.speedMhz}MHz (${config.ram.channels.toUpperCase()})
💾 Almacenamiento: ${config.storage.type} (${config.storage.capacityGb}GB)
🎯 Resolución objetivo: ${config.resolution.toUpperCase()} | Modo: ${config.workload.toUpperCase()}

📉 Cuello de Botella: ${result.bottleneckPct}% (${result.limitingFactor})
🔋 Consumo Estimado: ~${result.powerStats.systemEstimatedWatts}W | Fuente Recomendada: ${result.powerStats.recommendedPsuWatts}W
🎮 FPS Estimados:
${result.fpsEstimates.slice(0, 3).map(f => `  • ${f.game}: ${f.ultraFps} FPS Ultra (1% Low: ${f.onePercentLow} FPS)`).join('\n')}

Generado en: Embudo PC & Mobile Bottleneck Engine`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          id="export-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-1">
          <Sparkles className="w-4 h-4" /> Tarjeta de Exportación & Compartir
        </div>
        <h3 className="text-xl font-bold text-white mb-4">Resumen de Diagnóstico Embudo</h3>

        {/* Visual Card Representation */}
        <div id="printable-diagnosis-card" className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/40 rounded-xl p-5 mb-5 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs">
                E
              </div>
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                EMBUDO METRICS
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Procesador (CPU)</div>
              <div className="text-xs font-bold text-cyan-300 truncate">{config.cpu.name}</div>
            </div>
            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tarjeta Gráfica (GPU)</div>
              <div className="text-xs font-bold text-indigo-300 truncate">{config.gpu.name}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Nivel de Cuello de Botella</div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
                <span className={result.bottleneckPct < 8 ? 'text-emerald-400' : result.bottleneckPct < 20 ? 'text-amber-400' : 'text-rose-400'}>
                  {result.bottleneckPct}%
                </span>
                <span className="text-xs font-medium text-slate-400 uppercase">
                  ({result.limitingFactor})
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">Resolución & PSU</div>
              <div className="text-xs font-bold text-slate-200">{config.resolution.toUpperCase()} • {result.powerStats.recommendedPsuWatts}W PSU</div>
            </div>
          </div>

          {/* Quick FPS preview */}
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" /> Rendimiento Ultra Estimado
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {result.fpsEstimates.slice(0, 3).map((f, i) => (
              <div key={i} className="bg-slate-900/60 rounded p-1.5 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 truncate">{f.game.split('(')[0]}</div>
                <div className="font-bold text-white">{f.ultraFps} FPS</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="export-copy-link-btn"
            onClick={handleCopyShareLink}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-cyan-600/20"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace Directo'}
          </button>

          <button
            id="export-copy-text-btn"
            onClick={handleCopyTextReport}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copiedSummary ? '¡Reporte Copiado!' : 'Copiar Informe Texto'}
          </button>
        </div>
      </div>
    </div>
  );
};
