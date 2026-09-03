import React, { useState } from 'react';
import { Calculator, Zap, DollarSign, Gauge, Sliders, Cpu, Monitor, CheckCircle, Info } from 'lucide-react';
import { useHardware } from '../context/HardwareContext';
import { calculateElectricityCost } from '../lib/calculatorEngine';

export const CalculatorsView: React.FC = () => {
  const { cpus, gpus, currentConfig, updateConfig, currentResult } = useHardware();
  const [activeSubTab, setActiveSubTab] = useState<'bottleneck' | 'watts' | 'electricity'>('watts');

  // Electricity calculator state
  const [customWatts, setCustomWatts] = useState<number>(currentResult.powerStats.systemEstimatedWatts || 450);
  const [hoursPerDay, setHoursPerDay] = useState<number>(6);
  const [costPerKwh, setCostPerKwh] = useState<number>(0.15); // $0.15 USD standard
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');

  // PSU extra calculator items
  const [fanCount, setFanCount] = useState<number>(4);
  const [rgbEnabled, setRgbEnabled] = useState<boolean>(true);
  const [coolerType, setCoolerType] = useState<'air' | 'aio240' | 'aio360' | 'custom_loop'>('aio360');
  const [overclockEnabled, setOverclockEnabled] = useState<boolean>(false);

  // Dynamic wattage computation
  const coolerWatts = coolerType === 'air' ? 8 : coolerType === 'aio240' ? 20 : coolerType === 'aio360' ? 30 : 50;
  const fanWatts = fanCount * 3.5;
  const rgbWatts = rgbEnabled ? 12 : 0;
  const ocMultiplier = overclockEnabled ? 1.22 : 1.0;

  const totalCalculatedWatts = Math.round(
    ((currentConfig.cpu.tdp * 1.25 + currentConfig.gpu.tdp * 1.25) * ocMultiplier) +
    coolerWatts + fanWatts + rgbWatts + 60
  );

  const calculatedPsuSizing = Math.ceil((totalCalculatedWatts * 1.35) / 50) * 50;

  const costCalculations = calculateElectricityCost(customWatts, hoursPerDay, costPerKwh, currencySymbol);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          <Calculator className="w-4 h-4 text-cyan-400" /> MÓDULO DE HERRAMIENTAS Y CÁLCULO
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Calculadoras de Rendimiento, Energía y Costos
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Herramientas dedicadas para dimensionar fuentes de poder, consumo eléctrico y balance de hardware.
        </p>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            id="calc-tab-watts"
            onClick={() => setActiveSubTab('watts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
              activeSubTab === 'watts'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-orange-400" />
            1. Watts & Fuente de Poder (PSU)
          </button>

          <button
            id="calc-tab-electricity"
            onClick={() => setActiveSubTab('electricity')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
              activeSubTab === 'electricity'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            2. Costo Eléctrico (kWh)
          </button>

          <button
            id="calc-tab-bottleneck"
            onClick={() => setActiveSubTab('bottleneck')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
              activeSubTab === 'bottleneck'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-[#151921] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Gauge className="w-4 h-4 text-cyan-400" />
            3. Cuello de Botella Rápido
          </button>
        </div>
      </div>

      {/* --- TAB 1: WATTS & PSU CALCULATOR --- */}
      {activeSubTab === 'watts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#151921] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> CONFIGURACIÓN DE CARGA ENERGÉTICA
            </h3>

            {/* Selected CPU & GPU summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CPU Seleccionado</div>
                <div className="text-xs font-bold text-white truncate mt-0.5">{currentConfig.cpu.name}</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-1">TDP: {currentConfig.cpu.tdp}W</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GPU Seleccionada</div>
                <div className="text-xs font-bold text-white truncate mt-0.5">{currentConfig.gpu.name}</div>
                <div className="text-[11px] text-blue-400 font-mono mt-1">TDP: {currentConfig.gpu.tdp}W</div>
              </div>
            </div>

            {/* Cooler Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                SISTEMA DE REFRIGERACIÓN
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'air', label: 'Disipador Aire', w: '8W' },
                  { id: 'aio240', label: 'Líquida 240mm', w: '20W' },
                  { id: 'aio360', label: 'Líquida 360mm', w: '30W' },
                  { id: 'custom_loop', label: 'Custom Loop', w: '50W' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCoolerType(c.id as any)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      coolerType === c.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                        : 'bg-[#1C222D] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">{c.label}</div>
                    <div className="text-[10px] text-slate-500">{c.w}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fan Count & RGB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                  VENTILADORES DE GABINETE: {fanCount}
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={fanCount}
                  onChange={(e) => setFanCount(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 font-mono mt-1">Consumo: ~{(fanCount * 3.5).toFixed(1)}W</div>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 p-3.5 bg-[#1C222D] rounded-xl border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overclockEnabled}
                    onChange={(e) => setOverclockEnabled(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Overclock Activo (CPU/GPU)</div>
                    <div className="text-[10px] text-slate-400">+22% de margen de voltaje</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Sizing result card */}
          <div className="lg:col-span-5 bg-[#151921] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                DIMENSIONAMIENTO SUGERIDO DE PSU
              </span>
              <h4 className="text-4xl font-black text-white mt-1.5 flex items-baseline gap-2">
                {calculatedPsuSizing}W <span className="text-xs font-bold text-cyan-400 uppercase">80+ Gold</span>
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Diseñado para operar en la curva óptima de eficiencia energética (50%–70% de carga) donde la fuente genera menos calor y menor ruido acústico.
              </p>

              <div className="space-y-2 mt-6 pt-4 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Consumo Estimado del Sistema:</span>
                  <strong className="text-white font-mono">~{totalCalculatedWatts} Watts</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Margen de Seguridad (Headroom):</span>
                  <strong className="text-orange-400 font-mono">+35% ({calculatedPsuSizing - totalCalculatedWatts}W)</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Certificación aconsejada:</span>
                  <strong className="text-emerald-400">80 PLUS Gold / ATX 3.1</strong>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3.5 rounded-xl bg-[#1C222D] border border-slate-700 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Para GPUs de la serie RTX 50 y RTX 40, asegúrate de que la fuente incluya cable nativo 12V-2x6 / 12VHPWR.</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ELECTRICITY COST CALCULATOR --- */}
      {activeSubTab === 'electricity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-[#151921] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> PARÁMETROS DE FACTURACIÓN ELÉCTRICA
            </h3>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                CONSUMO PROMEDIO EN USO: {customWatts}W
              </label>
              <input
                type="range"
                min={100}
                max={1200}
                step={25}
                value={customWatts}
                onChange={(e) => setCustomWatts(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>100W (Oficina)</span>
                <span>450W (Gaming Medio)</span>
                <span>1200W (Ultra Enthusiast)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                HORAS DE USO DIARIAS: {hoursPerDay} HRS/DÍA
              </label>
              <input
                type="range"
                min={1}
                max={24}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                  PRECIO POR KWH ({currencySymbol})
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={costPerKwh}
                  onChange={(e) => setCostPerKwh(Math.max(0.01, Number(e.target.value)))}
                  className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                  MONEDA
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1C222D] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer transition-all"
                >
                  <option value="$">$ (USD / Pesos)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="S/.">S/. (PEN)</option>
                  <option value="R$">R$ (BRL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cost results card */}
          <div className="lg:col-span-6 bg-[#151921] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                GASTO ENERGÉTICO MENSUAL ESTIMADO
              </span>
              <h4 className="text-4xl font-black text-white mt-1.5">
                {costCalculations.costMonthly} <span className="text-xs font-bold text-emerald-400 uppercase">/ Mes</span>
              </h4>

              <div className="grid grid-cols-3 gap-3 my-6 text-center">
                <div className="p-3.5 bg-[#1C222D] rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Diario</div>
                  <div className="text-sm font-bold text-white mt-1">{costCalculations.costDaily}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{costCalculations.kwhDaily} kWh</div>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 to-[#1C222D] rounded-xl border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Mensual</div>
                  <div className="text-base font-black text-emerald-300 mt-1">{costCalculations.costMonthly}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{costCalculations.kwhMonthly} kWh</div>
                </div>

                <div className="p-3.5 bg-[#1C222D] rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Anual</div>
                  <div className="text-sm font-bold text-white mt-1">{costCalculations.costYearly}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{costCalculations.kwhYearly} kWh</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Cálculo basado en {hoursPerDay} horas de uso diario a potencia continua de {customWatts}W con una tarifa de {currencySymbol}{costPerKwh}/kWh.
            </p>
          </div>
        </div>
      )}

      {/* --- TAB 3: BOTTLE NECK QUICK CHECK --- */}
      {activeSubTab === 'bottleneck' && (
        <div className="bg-[#151921] border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
            <Gauge className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Calculadora Rápida de Balance</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tu ensamble actual ({currentConfig.cpu.name} + {currentConfig.gpu.name}) presenta un cuello de botella de <strong className="text-cyan-400">{currentResult.bottleneckPct}%</strong> en resolución {currentConfig.resolution.toUpperCase()}.
          </p>
          <div className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 text-left text-xs text-slate-300 space-y-1.5 font-mono">
            <div>• Componente limitante: <strong className="text-cyan-400 font-sans font-bold">{currentResult.limitingFactor}</strong></div>
            <div>• Cyberpunk 2077: <strong className="text-white">{currentResult.fpsEstimates[0]?.ultraFps} FPS Ultra</strong></div>
            <div>• Consumo pico del sistema: <strong className="text-orange-400 font-sans font-bold">~{currentResult.powerStats.peakSurgeWatts}W</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
