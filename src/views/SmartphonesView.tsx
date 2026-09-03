import React, { useState } from 'react';
import {
  Smartphone,
  Flame,
  BatteryCharging,
  Gauge,
  Gamepad2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Scale,
  Thermometer
} from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { calculateMobileDiagnostic } from '../lib/calculatorEngine';
import { MobileSoC } from '../types';

export const SmartphonesView: React.FC = () => {
  const { socs } = useHardware();

  const [selectedSocId, setSelectedSocId] = useState<string>(socs[0]?.id || 'soc-8elite');
  const [usageProfile, setUsageProfile] = useState<'gaming_hardcore' | 'gaming_casual' | 'emulation' | 'multitask_social' | 'content_creation'>('gaming_hardcore');

  // SoC comparator secondary choice
  const [compareSocId, setCompareSocId] = useState<string>(socs[1]?.id || 'soc-a18pro');
  const [showComparison, setShowComparison] = useState(false);

  const currentSoc = socs.find(s => s.id === selectedSocId) || socs[0];
  const compareSoc = socs.find(s => s.id === compareSocId) || socs[1];

  const diagResult = calculateMobileDiagnostic(currentSoc, usageProfile);
  const diagCompareResult = calculateMobileDiagnostic(compareSoc, usageProfile);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            <Smartphone className="w-4 h-4 text-cyan-400" /> MÓDULO DE DIAGNÓSTICO MÓVIL
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Evaluación de Procesadores de Teléfonos Móviles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mide estabilidad térmica (Thermal Throttling), tirones de FPS (1% Lows), emulación y autonomía en sesiones intensas de juego.
          </p>
        </div>

        <button
          id="mobile-toggle-comparator-btn"
          onClick={() => setShowComparison(!showComparison)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
            showComparison
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-[#151921] text-slate-300 hover:text-white border border-slate-700'
          }`}
        >
          <Scale className="w-4 h-4 text-cyan-400" />
          {showComparison ? 'Ocultar Comparador' : 'Comparar Chips Móviles'}
        </button>
      </div>

      {/* Main Selector Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: SoC & Profile Selectors */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#151921] border border-slate-800 rounded-2xl p-5 space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" /> SELECCIONA EL PROCESADOR (SOC)
            </label>
            <select
              id="mobile-select-soc"
              value={selectedSocId}
              onChange={(e) => setSelectedSocId(e.target.value)}
              className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-500 cursor-pointer transition-all"
            >
              {socs.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.manufacturer} {s.processNodeNm}nm) • AnTuTu: ~{(s.anTuTuScore / 1000000).toFixed(2)}M
                </option>
              ))}
            </select>

            {/* Quick Specs summary */}
            <div className="p-3.5 bg-[#1C222D] rounded-xl border border-slate-700/80 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Arquitectura CPU:</span>
                <strong className="text-white truncate max-w-[200px] font-mono">{currentSoc.cpuConfiguration}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">GPU Móvil:</span>
                <strong className="text-cyan-300 font-mono">{currentSoc.gpuName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Dispositivos típicos:</span>
                <span className="text-slate-300 text-[11px] truncate max-w-[220px]">{currentSoc.typicalDevices.join(', ')}</span>
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
                { id: 'gaming_hardcore', label: 'Gaming Competitivo 120 FPS / Warzone', sub: 'Carga térmica y gráfica máxima' },
                { id: 'emulation', label: 'Emulación Switch / PS2 / Sudachi', sub: 'Exige alto IPC Mononúcleo y drivers Adreno' },
                { id: 'content_creation', label: 'Edición de Video 4K & Creación', sub: 'Exige CPU multinúcleo y decodificación' },
                { id: 'multitask_social', label: 'Redes Sociales & Multitarea', sub: 'Eficiencia y ahorro de batería' }
              ].map(p => (
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
              <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                diagResult.throttleRisk === 'Bajo'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : diagResult.throttleRisk === 'Moderado'
                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                Riesgo: {diagResult.throttleRisk}
              </div>
            </div>

            {/* Stability & Temperature stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Estabilidad
                </div>
                <div className="text-3xl font-black text-cyan-300 mt-1">{currentSoc.thermalStabilityPct}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Retención térmica</div>
              </div>

              <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Temp. 60m Gaming
                </div>
                <div className="text-3xl font-black text-white mt-1">{diagResult.temperaturesEstimate.gaming60minC}°C</div>
                <div className="text-[10px] text-slate-400 mt-0.5">En chasis / batería</div>
              </div>

              <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Autonomía
                </div>
                <div className="text-3xl font-black text-emerald-400 mt-1">{diagResult.estimatedBatteryHoursGaming}h</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Consumo ~{currentSoc.tdpAvgWatts}W</div>
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
              <Gamepad2 className="w-4 h-4 text-cyan-400" /> COMPATIBILIDAD & RENDIMIENTO EN TÍTULOS MÓVILES TOP
            </h3>

            <div className="space-y-2.5 text-xs">
              {diagResult.supportedGames.map((game, i) => (
                <div key={i} className="p-3.5 bg-[#1C222D] rounded-xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{game.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Gráficos: {game.graphicsQuality} • Target: {game.targetFps}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    game.experience === 'Excelente'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : game.experience === 'Fluido'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                  }`}>
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
                <li key={i} className="flex items-start gap-2.5 bg-[#1C222D] p-3 rounded-xl border border-slate-700/80">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Optional Side-by-Side Mobile Chipset Comparison Drawer */}
      {showComparison && (
        <div className="mt-8 bg-[#151921] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" /> Comparativa: {currentSoc.name} vs {compareSoc.name}
            </h3>
            <select
              value={compareSocId}
              onChange={(e) => setCompareSocId(e.target.value)}
              className="px-3 py-2 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 cursor-pointer"
            >
              {socs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chip A */}
            <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 space-y-2.5">
              <div className="font-extrabold text-white text-sm">{currentSoc.name}</div>
              <div className="text-xs text-slate-400">AnTuTu v10: <strong className="text-cyan-300 font-mono">{(currentSoc.anTuTuScore / 1000000).toFixed(2)}M pts</strong></div>
              <div className="text-xs text-slate-400">Geekbench 6 Multi: <strong className="text-white font-mono">{currentSoc.geekbenchMulti} pts</strong></div>
              <div className="text-xs text-slate-400">Retención Térmica: <strong className="text-emerald-400 font-mono">{currentSoc.thermalStabilityPct}%</strong></div>
            </div>

            {/* Chip B */}
            <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 space-y-2.5">
              <div className="font-extrabold text-white text-sm">{compareSoc.name}</div>
              <div className="text-xs text-slate-400">AnTuTu v10: <strong className="text-blue-300 font-mono">{(compareSoc.anTuTuScore / 1000000).toFixed(2)}M pts</strong></div>
              <div className="text-xs text-slate-400">Geekbench 6 Multi: <strong className="text-white font-mono">{compareSoc.geekbenchMulti} pts</strong></div>
              <div className="text-xs text-slate-400">Retención Térmica: <strong className="text-emerald-400 font-mono">{compareSoc.thermalStabilityPct}%</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
