import React from 'react';
import {
  Cpu,
  Smartphone,
  Zap,
  Gauge,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Activity,
  Layers,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../components/Navbar';
import { useHardware } from '../context/HardwareContext';

interface HomeLandingViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({ setActiveTab }) => {
  const { currentConfig, currentResult, updateConfig } = useHardware();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 text-center max-w-4xl mx-auto px-4">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[280px] bg-gradient-to-tr from-cyan-500/15 via-blue-500/10 to-indigo-500/15 blur-[120px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold uppercase tracking-widest mb-5">
          <Sparkles className="w-3.5 h-3.5" /> MOTOR DE MEDICIÓN DE HARDWARE 2026
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-5">
          Mide si tu PC tiene <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Cuello de Botella
          </span>{' '}
          o Pérdida de FPS
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Selecciona tus componentes completos, resolución y tipo de uso. Calcula con precisión el porcentaje de cuello de botella, consumo real en Watts, compatibilidad y diagnóstico térmico para teléfonos.
        </p>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            id="hero-start-pc-btn"
            onClick={() => setActiveTab('pc-diag')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 transition-all uppercase tracking-wider cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-white" />
            Iniciar Diagnóstico de PC
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-start-mobile-btn"
            onClick={() => setActiveTab('smartphones')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#151921] hover:bg-[#1C222D] text-slate-200 font-bold text-sm border border-slate-700 hover:border-slate-600 transition-all cursor-pointer uppercase tracking-wider"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Diagnóstico Móvil (SoC & Throttling)
          </button>
        </div>
      </section>

      {/* Live Interactive Benchmark Showcase (Defaulting to Ryzen 7 7800X3D + RTX 5070 Ti) */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
                <Activity className="w-4 h-4 text-cyan-400" /> CONFIGURACIÓN DE HARDWARE EN VIVO
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {currentConfig.cpu.name} + {currentConfig.gpu.name}
              </h2>
            </div>

            {/* Resolution selector toggle for simulation */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1C222D] rounded-xl border border-slate-700">
              {(['1080p', '1440p', '4k'] as const).map((res) => (
                <button
                  key={res}
                  id={`hero-toggle-${res}`}
                  onClick={() => updateConfig({ resolution: res })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer uppercase ${
                    currentConfig.resolution === res
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Dashboard Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-6">
            {/* Bottleneck Metric Card */}
            <div className="bg-[#1C222D] border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
                <span>Cuello de Botella</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="my-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {currentResult.bottleneckPct}%
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 uppercase">
                    {currentResult.limitingFactor}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Operando en punto óptimo para {currentConfig.resolution.toUpperCase()}. Rendimiento equilibrado.
                </p>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${Math.max(5, currentResult.bottleneckPct * 2)}%` }}
                />
              </div>
            </div>

            {/* Power & PSU Metric Card */}
            <div className="bg-[#1C222D] border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
                <span>Consumo Estimado</span>
                <Zap className="w-4 h-4 text-orange-400" />
              </div>
              <div className="my-3">
                <div className="text-3xl font-black text-white">
                  {currentResult.powerStats.systemEstimatedWatts} <span className="text-xs text-slate-400 font-normal">WATTS</span>
                </div>
                <div className="text-xs font-bold text-orange-300 mt-1">
                  Fuente Sugerida: {currentResult.powerStats.recommendedPsuWatts}W 80+ Gold
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Tolerancia ATX 3.1 para picos transitorios.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Pico Máx: {currentResult.powerStats.peakSurgeWatts}W</span>
            </div>

            {/* FPS Highlight */}
            <div className="bg-[#1C222D] border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
                <span>Cyberpunk 2077 ({currentConfig.resolution.toUpperCase()})</span>
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="my-3">
                <div className="text-3xl font-black text-cyan-400">
                  {currentResult.fpsEstimates[0]?.ultraFps || 95} <span className="text-xs font-bold text-slate-300">FPS</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Ultra Settings • Ray Tracing: ~{currentResult.fpsEstimates[0]?.rtFps || 65} FPS
                </div>
                <div className="text-xs text-emerald-400 mt-1 font-mono">
                  1% Low: {currentResult.fpsEstimates[0]?.onePercentLow || 82} FPS
                </div>
              </div>
              <button
                id="hero-inspect-setup-btn"
                onClick={() => setActiveTab('pc-diag')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 group cursor-pointer uppercase tracking-wider"
              >
                Personalizar este ensamble <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Modules */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2 uppercase tracking-wide">Módulos de Análisis Especializados</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            Accede en un clic a las herramientas técnicas de balance, energía y simulación térmica.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Diagnóstico PC */}
          <div
            onClick={() => setActiveTab('pc-diag')}
            className="group bg-[#151921] hover:bg-[#1C222D] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Diagnóstico de PC Completo
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Elige CPU, GPU, RAM, Almacenamiento y Sistema Operativo. Obtén cálculo de bottleneck, watts, FPS y advertencias de drivers.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Probar Diagnóstico</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Comparador PC */}
          <div
            onClick={() => setActiveTab('comparator')}
            className="group bg-[#151921] hover:bg-[#1C222D] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                Comparador Setup A vs Setup B
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Compara dos configuraciones frente a frente. Descubre cuál ofrece mejor relación FPS por dólar, consumo y estabilidad.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Comparar Ensambles</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Móviles & Smartphones */}
          <div
            onClick={() => setActiveTab('smartphones')}
            className="group bg-[#151921] hover:bg-[#1C222D] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                Diagnóstico de Smartphones
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Evalúa procesadores móviles (Snapdragon, Apple A-Series, Dimensity) para prevenir sobrecalentamiento, tirones en 120 FPS y emulación.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Evaluar Smartphone</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Official Data Banner */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="p-6 rounded-2xl bg-[#151921] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">Datos Verificados Contra Fuentes Oficiales</h4>
              <p className="text-xs text-slate-400">
                Benchmarks reales de TechPowerUp, 3DMark, Geekbench 6 y especificaciones de fabricantes actualizados en tiempo real.
              </p>
            </div>
          </div>
          <button
            id="hero-see-catalog-btn"
            onClick={() => setActiveTab('catalog')}
            className="whitespace-nowrap px-5 py-2.5 text-xs font-bold rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700 uppercase tracking-wider"
          >
            Ver Catálogo Prearmado
          </button>
        </div>
      </section>
    </div>
  );
};
