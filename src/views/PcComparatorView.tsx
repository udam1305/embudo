import React, { useState, useMemo } from 'react';
import { Scale, Cpu, Monitor, Zap, Gauge, Gamepad2, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { calculateBottleneck } from '../lib/calculatorEngine';
import { DiagnosisConfig } from '../types';
import { groupCpusByGeneration, getCpuGenerationMeta } from '../utils/cpuGenerations';
import { groupGpusByGeneration, getGpuGenerationMeta } from '../utils/gpuGenerations';

export const PcComparatorView: React.FC = () => {
  const { cpus, gpus, rams, storages } = useHardware();

  // Brand filters for Setup A and Setup B
  const [cpuBrandA, setCpuBrandA] = useState<'All' | 'AMD' | 'Intel' | 'Apple'>('All');
  const [gpuBrandA, setGpuBrandA] = useState<'All' | 'NVIDIA' | 'AMD' | 'Intel' | 'Apple'>('All');
  const [cpuBrandB, setCpuBrandB] = useState<'All' | 'AMD' | 'Intel' | 'Apple'>('All');
  const [gpuBrandB, setGpuBrandB] = useState<'All' | 'NVIDIA' | 'AMD' | 'Intel' | 'Apple'>('All');

  const filteredCpuGroupsA = useMemo(() => {
    const list = cpuBrandA === 'All' ? cpus : cpus.filter(c => c.brand === cpuBrandA);
    return groupCpusByGeneration(list);
  }, [cpus, cpuBrandA]);

  const filteredGpuGroupsA = useMemo(() => {
    const list = gpuBrandA === 'All' ? gpus : gpus.filter(g => g.brand === gpuBrandA);
    return groupGpusByGeneration(list);
  }, [gpus, gpuBrandA]);

  const filteredCpuGroupsB = useMemo(() => {
    const list = cpuBrandB === 'All' ? cpus : cpus.filter(c => c.brand === cpuBrandB);
    return groupCpusByGeneration(list);
  }, [cpus, cpuBrandB]);

  const filteredGpuGroupsB = useMemo(() => {
    const list = gpuBrandB === 'All' ? gpus : gpus.filter(g => g.brand === gpuBrandB);
    return groupGpusByGeneration(list);
  }, [gpus, gpuBrandB]);

  // Setup A (Default: 7800X3D + RTX 5070 Ti)
  const [setupA, setSetupA] = useState<DiagnosisConfig>(() => ({
    cpu: cpus.find(c => c.id === 'cpu-7800x3d') || cpus[0],
    gpu: gpus.find(g => g.id === 'gpu-5070ti') || gpus[0],
    ram: rams[0],
    storage: storages[1],
    resolution: '1440p',
    workload: 'gaming',
    os: 'Windows 11'
  }));

  // Setup B (Alternative: Core i7-14700K + RTX 4070 Ti Super)
  const [setupB, setSetupB] = useState<DiagnosisConfig>(() => ({
    cpu: cpus.find(c => c.id === 'cpu-14700k') || cpus[1] || cpus[0],
    gpu: gpus.find(g => g.id === 'gpu-4070ts') || gpus[2] || gpus[0],
    ram: rams[0],
    storage: storages[1],
    resolution: '1440p',
    workload: 'gaming',
    os: 'Windows 11'
  }));

  const [resolution, setResolution] = useState<'1080p' | '1440p' | '4k'>('1440p');

  const resultA = calculateBottleneck({ ...setupA, resolution });
  const resultB = calculateBottleneck({ ...setupB, resolution });

  const cpuMetaA = useMemo(() => getCpuGenerationMeta(setupA.cpu), [setupA.cpu]);
  const cpuMetaB = useMemo(() => getCpuGenerationMeta(setupB.cpu), [setupB.cpu]);
  const gpuMetaA = useMemo(() => getGpuGenerationMeta(setupA.gpu), [setupA.gpu]);
  const gpuMetaB = useMemo(() => getGpuGenerationMeta(setupB.gpu), [setupB.gpu]);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          <Scale className="w-4 h-4 text-cyan-400" /> MÓDULO COMPARADOR LADO A LADO
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Comparador de Ensambles PC (Setup A vs Setup B)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Evalúa dos configuraciones frente a frente para determinar cuál ofrece mayor equilibrio, menos cuello de botella y mejor tasa de cuadros por Watts.
        </p>

        {/* Global Resolution switch */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resolución de prueba:</span>
          {(['1080p', '1440p', 'ultrawide', '4k', '8k'] as const).map(res => (
            <button
              key={res}
              id={`comparator-res-${res}`}
              onClick={() => setResolution(res)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                resolution === res
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {res === '8k' ? '8K Ultra HD' : res === 'ultrawide' ? 'Ultrawide 21:9' : res}
            </button>
          ))}
        </div>
      </div>

      {/* Side by Side Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup A */}
        <div className="bg-[#151921] border border-cyan-500/30 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30">
                CONFIGURACIÓN A
              </span>
              <h3 className="text-base font-bold text-white mt-2">{setupA.cpu.name}</h3>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 text-[10px]">
                  {cpuMetaA.shortLabel}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">{setupA.cpu.socket}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{setupA.cpu.releaseYear}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cuello de Botella</div>
              <div className="text-3xl font-black text-white mt-0.5">{resultA.bottleneckPct}%</div>
            </div>
          </div>

          {/* Selectors for Setup A */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PROCESADOR A</label>
                <div className="flex items-center gap-1 text-[10px]">
                  {(['All', 'AMD', 'Intel', 'Apple'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCpuBrandA(b)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        cpuBrandA === b ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <label htmlFor="comp-select-cpu-a" className="sr-only">
                Seleccionar Procesador A
              </label>
              <select
                id="comp-select-cpu-a"
                name="setupCpuA"
                aria-label="Seleccionar Procesador A"
                value={setupA.cpu.id}
                onChange={(e) => {
                  const found = cpus.find(c => c.id === e.target.value);
                  if (found) setSetupA(prev => ({ ...prev, cpu: found }));
                }}
                className="w-full px-3 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                {filteredCpuGroupsA.map(group => (
                  <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                    {group.cpus.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cores}C/{c.threads}T • {c.socket})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <label htmlFor="comp-select-gpu-a" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                    GRÁFICA A
                  </label>
                  <span className="text-[10px] font-bold text-cyan-400 font-mono">{gpuMetaA.shortLabel}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  {(['All', 'NVIDIA', 'AMD', 'Intel', 'Apple'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setGpuBrandA(b)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        gpuBrandA === b ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <select
                id="comp-select-gpu-a"
                name="setupGpuA"
                aria-label="Seleccionar Tarjeta Gráfica A"
                value={setupA.gpu.id}
                onChange={(e) => {
                  const found = gpus.find(g => g.id === e.target.value);
                  if (found) setSetupA(prev => ({ ...prev, gpu: found }));
                }}
                className="w-full px-3 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                {filteredGpuGroupsA.map(group => (
                  <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                    {group.gpus.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.vram}GB {g.vramType} • {g.tdp}W)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Consumo</div>
              <div className="font-black text-white mt-1">~{resultA.powerStats.systemEstimatedWatts}W</div>
            </div>
            <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">PSU Mín.</div>
              <div className="font-black text-white mt-1">{resultA.powerStats.recommendedPsuWatts}W</div>
            </div>
            <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">FPS Ultra</div>
              <div className="font-black text-cyan-400 mt-1">{resultA.fpsEstimates[0]?.ultraFps} FPS</div>
            </div>
          </div>

          <div className="p-2.5 bg-[#1C222D] rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Recomendación PSU:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">CORSAIR</span>
              {resultA.powerStats.recommendedPsuWatts >= 1200 ? 'AX1600i / RM1200x' : resultA.powerStats.recommendedPsuWatts >= 1000 ? 'RM1000x SHIFT' : resultA.powerStats.recommendedPsuWatts >= 850 ? 'RM850x SHIFT' : 'RM750x SHIFT'}
            </span>
          </div>
        </div>

        {/* Setup B */}
        <div className="bg-[#151921] border border-blue-500/30 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest px-2.5 py-1 rounded bg-blue-500/15 border border-blue-500/30">
                CONFIGURACIÓN B
              </span>
              <h3 className="text-base font-bold text-white mt-2">{setupB.cpu.name}</h3>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30 text-[10px]">
                  {cpuMetaB.shortLabel}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">{setupB.cpu.socket}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{setupB.cpu.releaseYear}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cuello de Botella</div>
              <div className="text-3xl font-black text-white mt-0.5">{resultB.bottleneckPct}%</div>
            </div>
          </div>

          {/* Selectors for Setup B */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PROCESADOR B</label>
                <div className="flex items-center gap-1 text-[10px]">
                  {(['All', 'AMD', 'Intel', 'Apple'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCpuBrandB(b)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        cpuBrandB === b ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <label htmlFor="comp-select-cpu-b" className="sr-only">
                Seleccionar Procesador B
              </label>
              <select
                id="comp-select-cpu-b"
                name="setupCpuB"
                aria-label="Seleccionar Procesador B"
                value={setupB.cpu.id}
                onChange={(e) => {
                  const found = cpus.find(c => c.id === e.target.value);
                  if (found) setSetupB(prev => ({ ...prev, cpu: found }));
                }}
                className="w-full px-3 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                {filteredCpuGroupsB.map(group => (
                  <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                    {group.cpus.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cores}C/{c.threads}T • {c.socket})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <label htmlFor="comp-select-gpu-b" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                    GRÁFICA B
                  </label>
                  <span className="text-[10px] font-bold text-blue-400 font-mono">{gpuMetaB.shortLabel}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  {(['All', 'NVIDIA', 'AMD', 'Intel', 'Apple'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setGpuBrandB(b)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        gpuBrandB === b ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <select
                id="comp-select-gpu-b"
                name="setupGpuB"
                aria-label="Seleccionar Tarjeta Gráfica B"
                value={setupB.gpu.id}
                onChange={(e) => {
                  const found = gpus.find(g => g.id === e.target.value);
                  if (found) setSetupB(prev => ({ ...prev, gpu: found }));
                }}
                className="w-full px-3 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-semibold text-white cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                {filteredGpuGroupsB.map(group => (
                  <optgroup key={group.id} label={`─── ${group.label.toUpperCase()} ───`}>
                    {group.gpus.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.vram}GB {g.vramType} • {g.tdp}W)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Consumo</div>
              <div className="font-black text-white mt-1">~{resultB.powerStats.systemEstimatedWatts}W</div>
            </div>
            <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">PSU Mín.</div>
              <div className="font-black text-white mt-1">{resultB.powerStats.recommendedPsuWatts}W</div>
            </div>
            <div className="p-3 bg-[#1C222D] rounded-xl border border-slate-700/80">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">FPS Ultra</div>
              <div className="font-black text-blue-400 mt-1">{resultB.fpsEstimates[0]?.ultraFps} FPS</div>
            </div>
          </div>

          <div className="p-2.5 bg-[#1C222D] rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Recomendación PSU:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">CORSAIR</span>
              {resultB.powerStats.recommendedPsuWatts >= 1200 ? 'AX1600i / RM1200x' : resultB.powerStats.recommendedPsuWatts >= 1000 ? 'RM1000x SHIFT' : resultB.powerStats.recommendedPsuWatts >= 850 ? 'RM850x SHIFT' : 'RM750x SHIFT'}
            </span>
          </div>
        </div>
      </div>

      {/* Head to Head FPS Summary Table */}
      <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-cyan-400" /> COMPARATIVA DETALLADA DE CUADROS POR SEGUNDO ({resolution.toUpperCase()} ULTRA)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 pr-2">Juego Evaluado</th>
                <th className="py-2.5 px-2 text-center text-cyan-400 font-bold">Setup A ({setupA.gpu.name})</th>
                <th className="py-2.5 px-2 text-center text-blue-400 font-bold">Setup B ({setupB.gpu.name})</th>
                <th className="py-2.5 pl-2 text-right font-bold text-emerald-400">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {resultA.fpsEstimates.map((fA, idx) => {
                const fB = resultB.fpsEstimates[idx];
                const diff = fA.ultraFps - (fB?.ultraFps || 0);
                const pct = fB?.ultraFps ? Math.round((diff / fB.ultraFps) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-[#1C222D]/40">
                    <td className="py-2.5 pr-2 font-sans font-semibold text-slate-200">{fA.game}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-cyan-300">{fA.ultraFps} FPS</td>
                    <td className="py-2.5 px-2 text-center font-bold text-blue-300">{fB?.ultraFps} FPS</td>
                    <td className="py-2.5 pl-2 text-right font-bold">
                      <span className={diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {diff >= 0 ? `+${diff} FPS (+${pct}%) Setup A` : `${diff} FPS (${pct}%) Setup B`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
