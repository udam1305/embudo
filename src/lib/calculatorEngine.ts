import { DiagnosisConfig, BottleneckResult, MobileSoC, MobileDiagnosisResult } from '../types';

export function calculateBottleneck(config: DiagnosisConfig): BottleneckResult {
  const { cpu, gpu, ram, storage, resolution, workload } = config;

  // 1. Resolution weights (CPU vs GPU balance)
  let cpuWeight = 0.50;
  let gpuWeight = 0.50;

  switch (resolution) {
    case '1080p':
      cpuWeight = 0.52;
      gpuWeight = 0.48;
      break;
    case '1440p':
      cpuWeight = 0.35;
      gpuWeight = 0.65;
      break;
    case '4k':
      cpuWeight = 0.18;
      gpuWeight = 0.82;
      break;
    case 'ultrawide':
      cpuWeight = 0.28;
      gpuWeight = 0.72;
      break;
  }

  // 2. Workload modifier
  let effectiveCpuScore = cpu.gamingScore;
  let effectiveGpuScore = resolution === '4k' ? gpu.score4k : (resolution === '1440p' || resolution === 'ultrawide') ? gpu.score1440p : gpu.score1080p;

  if (workload === 'render3d') {
    effectiveCpuScore = (cpu.multicoreScore * 0.7) + (cpu.singlecoreScore * 0.3);
    effectiveGpuScore = (gpu.score4k * 0.6) + (gpu.rayTracingScore * 0.4);
  } else if (workload === 'streaming') {
    effectiveCpuScore = (cpu.gamingScore * 0.65) + (cpu.multicoreScore * 0.35);
  } else if (workload === 'video_edit') {
    effectiveCpuScore = (cpu.multicoreScore * 0.8) + (cpu.singlecoreScore * 0.2);
  } else if (workload === 'multitask') {
    effectiveCpuScore = (cpu.multicoreScore * 0.6) + (cpu.gamingScore * 0.4);
  }

  // 3. RAM Penalties
  let ramPenaltyPct = 0;
  if (ram.channels === 'single') {
    ramPenaltyPct += 14; // Single channel severely caps modern CPU memory bus
  }
  if (ram.capacityGb < 16) {
    ramPenaltyPct += 18;
  } else if (ram.capacityGb < 32 && (resolution === '4k' || workload === 'render3d' || workload === 'video_edit')) {
    ramPenaltyPct += 6;
  }
  if (ram.type === 'DDR4' && ram.speedMhz < 3200) {
    ramPenaltyPct += 7;
  }

  // 4. Storage Penalty
  let storagePenaltyPct = 0;
  if (storage.type === 'HDD') {
    storagePenaltyPct += 20;
  } else if (storage.type === 'SATA SSD') {
    storagePenaltyPct += 4;
  }

  // Adjust CPU output based on memory speed
  const ramFactor = Math.max(0.70, 1 - (ramPenaltyPct / 100));
  const penalizedCpuPower = effectiveCpuScore * ramFactor;

  // Compute Delta between CPU capabilities and GPU capabilities for this resolution
  // If CPU power is lower than what GPU demands, CPU bottlenecks GPU
  // If GPU power is lower, GPU is at 100% (desired in high res gaming)
  let rawBottleneck = 0;
  let limitingFactor: 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Equilibrado' = 'Equilibrado';

  if (ramPenaltyPct >= 15) {
    limitingFactor = 'RAM';
    rawBottleneck = ramPenaltyPct;
  } else if (storagePenaltyPct >= 15) {
    limitingFactor = 'Storage';
    rawBottleneck = storagePenaltyPct;
  } else if (penalizedCpuPower < effectiveGpuScore * 0.90) {
    limitingFactor = 'CPU';
    // CPU cannot feed GPU: bottleneck is proportion of GPU untapped
    rawBottleneck = Math.min(65, Math.round(((effectiveGpuScore - penalizedCpuPower) / effectiveGpuScore) * 100 * cpuWeight * 1.8));
  } else if (effectiveGpuScore < penalizedCpuPower * 0.75 && resolution === '4k') {
    limitingFactor = 'GPU';
    rawBottleneck = Math.min(25, Math.round(((penalizedCpuPower - effectiveGpuScore) / penalizedCpuPower) * 100 * 0.3));
  } else {
    limitingFactor = 'Equilibrado';
    rawBottleneck = Math.max(1, Math.round(Math.abs(penalizedCpuPower - effectiveGpuScore) * 0.15));
  }

  const bottleneckPct = Math.min(95, Math.max(0.5, rawBottleneck));

  let severity: 'perfect' | 'minor' | 'moderate' | 'heavy' | 'critical' = 'perfect';
  if (bottleneckPct < 5) severity = 'perfect';
  else if (bottleneckPct < 15) severity = 'minor';
  else if (bottleneckPct < 28) severity = 'moderate';
  else if (bottleneckPct < 45) severity = 'heavy';
  else severity = 'critical';

  // Summary message
  let summary = '';
  if (severity === 'perfect') {
    summary = `¡Excelente balance! Tu combinación de ${cpu.name} y ${gpu.name} en ${resolution.toUpperCase()} está prácticamente libre de cuello de botella (${bottleneckPct}%). Los componentes se complementan con máxima eficiencia.`;
  } else if (limitingFactor === 'CPU') {
    summary = `Se detecta un cuello de botella por procesador del ${bottleneckPct}%. En ${resolution.toUpperCase()}, la ${gpu.name} tiene más potencial gráfico del que el ${cpu.name} puede procesar en cuadros por segundo.`;
  } else if (limitingFactor === 'RAM') {
    summary = `Se detecta limitación por memoria RAM (${ram.capacityGb}GB ${ram.type} en modo ${ram.channels === 'single' ? 'Single-Channel' : 'Dual-Channel'}). La falta de ancho de banda genera caídas de cuadros (stuttering).`;
  } else if (limitingFactor === 'Storage') {
    summary = `El almacenamiento (${storage.type}) ralentiza el streaming de texturas y los tiempos de carga en títulos modernos con DirectStorage.`;
  } else {
    summary = `Balance adecuado con un ligero margen de ${bottleneckPct}% orientado a GPU bound, ideal para resoluciones altas.`;
  }

  // Power & PSU calculations
  const cpuPeak = Math.round(cpu.tdp * 1.28);
  const gpuPeak = Math.round(gpu.tdp * 1.25);
  const sysOtherWatts = 70 + (ram.channels === 'dual' ? 16 : 8);
  const systemEstimatedWatts = cpuPeak + gpuPeak + sysOtherWatts;
  const peakSurgeWatts = Math.round(systemEstimatedWatts * 1.20);
  
  // Recommend PSU with 30-40% headroom for 80+ Gold sweet spot efficiency curve
  const roundedPsu = Math.ceil((systemEstimatedWatts * 1.35) / 50) * 50;
  const recommendedPsuWatts = Math.max(gpu.recommendedPsu, roundedPsu);
  const psuEfficiencyRating = recommendedPsuWatts >= 850 ? '80 PLUS Gold / Platinum (ATX 3.0 / PCIe 5.0 12V-2x6)' : '80 PLUS Gold (750W+)';

  // 5. FPS Estimates in Top Games
  // Base GPU performance factor
  const gpuBaseFps = (gpu.score1440p * 1.45) * (resolution === '1080p' ? 1.40 : resolution === '1440p' ? 1.0 : resolution === 'ultrawide' ? 0.85 : 0.62);
  const cpuFactor = Math.min(1.0, penalizedCpuPower / (resolution === '1080p' ? 95 : 85));

  const gamePresets = [
    { name: 'Cyberpunk 2077 (Phantom Liberty)', mult: 0.95, rtMult: 0.58 },
    { name: 'Call of Duty: Warzone', mult: 1.55, rtMult: 1.10 },
    { name: 'Counter-Strike 2', mult: 3.20, rtMult: 2.80 },
    { name: 'Fortnite (Unreal Engine 5.4 Nanite)', mult: 1.40, rtMult: 0.85 },
    { name: 'Black Myth: Wukong', mult: 0.90, rtMult: 0.52 },
    { name: 'Grand Theft Auto V / Enchanced', mult: 1.95, rtMult: 1.45 }
  ];

  const fpsEstimates = gamePresets.map(g => {
    const med = Math.round(gpuBaseFps * g.mult * (0.85 + cpuFactor * 0.15));
    const low = Math.round(med * 1.35);
    const ultra = Math.round(med * 0.78);
    const rt = Math.round(med * (g.rtMult / g.mult) * (gpu.rayTracingScore / 90));
    const onePctLow = Math.round(ultra * (ram.channels === 'single' ? 0.62 : 0.88));

    return {
      game: g.name,
      lowFps: Math.max(25, low),
      medFps: Math.max(20, med),
      ultraFps: Math.max(15, ultra),
      rtFps: Math.max(10, rt),
      onePercentLow: Math.max(10, onePctLow)
    };
  });

  // 6. Driver and OS advice
  const driverAdvice: string[] = [];
  if (gpu.brand === 'NVIDIA') {
    driverAdvice.push(`Instala el último controlador NVIDIA GeForce Game Ready Driver (570.xx+) con soporte para ${gpu.dlssFsrSupport}.`);
    driverAdvice.push('Activa "NVIDIA Reflex Low Latency" en modo On+Boost en el panel de control para reducir latencia del sistema.');
  } else if (gpu.brand === 'AMD') {
    driverAdvice.push(`Mantén actualizado AMD Software: Adrenalin Edition con soporte para ${gpu.dlssFsrSupport} y HYPR-RX.`);
  }

  if (cpu.brand === 'AMD' && cpu.socket === 'AM5') {
    driverAdvice.push('Asegúrate de tener actualizado el Chipset Driver de AMD y habilitar el perfil AMD EXPO en la BIOS para memoria DDR5.');
  } else if (cpu.brand === 'Intel') {
    driverAdvice.push('Verifica que tu BIOS tenga el microcódigo 0x12B o más reciente con perfil Intel Default Baseline Profile activo.');
  }

  if (ram.channels === 'single') {
    driverAdvice.push('⚠️ ALERTA DE MEMORIA: Tu memoria RAM opera en Single Channel. Agregar un segundo módulo idéntico duplicará el ancho de banda y elevará los 1% Lows hasta un 25%.');
  }

  if (config.os === 'Windows 11') {
    driverAdvice.push('En Windows 11, activa la "Programación de GPU acelerada por hardware" (HAGS) y desactiva el aislamiento del núcleo (VBS) si buscas el máximo rendimiento en juegos.');
  }

  // 7. Upgrade Recommendations
  const upgradeRecommendations: Array<{
    priority: number;
    componentType: 'CPU' | 'GPU' | 'RAM' | 'Almacenamiento' | 'Fuente';
    suggestedItem: string;
    gainPercentage: number;
    reason: string;
  }> = [];

  if (ram.channels === 'single' || ram.capacityGb < 32) {
    upgradeRecommendations.push({
      priority: 1,
      componentType: 'RAM',
      suggestedItem: 'Kit 32GB (2x16GB) DDR5 6000MHz CL30 (o DDR4 3600 CL16)',
      gainPercentage: ram.channels === 'single' ? 22 : 12,
      reason: 'Elimina el cuello de botella por ancho de banda de memoria y estabiliza caídas de FPS.'
    });
  }

  if (limitingFactor === 'CPU' && bottleneckPct >= 15) {
    upgradeRecommendations.push({
      priority: 2,
      componentType: 'CPU',
      suggestedItem: cpu.brand === 'AMD' ? 'AMD Ryzen 7 7800X3D o 9800X3D (AM5)' : 'Intel Core i7-14700K / Core Ultra 7',
      gainPercentage: Math.round(bottleneckPct * 0.9),
      reason: `Desbloquea el 100% de la capacidad de tu ${gpu.name} en resoluciones competitivas.`
    });
  }

  if (storage.type === 'HDD' || storage.type === 'SATA SSD') {
    upgradeRecommendations.push({
      priority: 3,
      componentType: 'Almacenamiento',
      suggestedItem: 'M.2 NVMe PCIe 4.0 2TB (7000+ MB/s)',
      gainPercentage: 15,
      reason: 'Carga instantánea de partidas y soporte para DirectStorage en juegos de nueva generación.'
    });
  }

  if (systemEstimatedWatts > gpu.recommendedPsu * 0.85) {
    upgradeRecommendations.push({
      priority: 4,
      componentType: 'Fuente',
      suggestedItem: `Fuente ${recommendedPsuWatts}W 80 PLUS Gold Modular`,
      gainPercentage: 5,
      reason: 'Garantiza estabilidad ante picos transitorios (transient spikes) y protege tus componentes.'
    });
  }

  return {
    bottleneckPct,
    limitingFactor,
    severity,
    summary,
    technicalDetails: {
      cpuLoadEst: Math.min(100, Math.round((effectiveGpuScore / (penalizedCpuPower + 0.1)) * 50 + (100 - effectiveCpuScore * 0.3))),
      gpuLoadEst: Math.min(100, Math.round((penalizedCpuPower / (effectiveGpuScore + 0.1)) * 50 + (100 - effectiveGpuScore * 0.3))),
      ramSpeedPenaltyPct: ramPenaltyPct,
      storagePenaltyPct: storagePenaltyPct,
      recommendedResolution: resolution === '1080p' && penalizedCpuPower < effectiveGpuScore ? '1440p (traslada carga a la GPU)' : resolution
    },
    powerStats: {
      systemEstimatedWatts,
      peakSurgeWatts,
      recommendedPsuWatts,
      psuEfficiencyRating
    },
    fpsEstimates,
    driverAdvice,
    upgradeRecommendations
  };
}

export function calculateMobileDiagnostic(
  soc: MobileSoC,
  usageProfile: 'gaming_hardcore' | 'gaming_casual' | 'emulation' | 'multitask_social' | 'content_creation'
): MobileDiagnosisResult {
  // Score evaluation
  let overallScore = soc.gamingScore120fps;
  if (usageProfile === 'content_creation') {
    overallScore = Math.round((soc.geekbenchMulti / 10500) * 100);
  } else if (usageProfile === 'multitask_social') {
    overallScore = Math.round((soc.geekbenchSingle / 3500) * 40 + (soc.geekbenchMulti / 10500) * 60);
  }

  // Throttle risk evaluation
  let throttleRisk: 'Bajo' | 'Moderado' | 'Alto' | 'Extremo' = 'Bajo';
  if (soc.thermalStabilityPct >= 85) throttleRisk = 'Bajo';
  else if (soc.thermalStabilityPct >= 75) throttleRisk = 'Moderado';
  else if (soc.thermalStabilityPct >= 65) throttleRisk = 'Alto';
  else throttleRisk = 'Extremo';

  // Stutter risk evaluation
  let stutterRisk: 'Mínimo (60/120 FPS estables)' | 'Ocasional (pequeños tirones)' | 'Frecuente (Frame drops notorios)' = 'Mínimo (60/120 FPS estables)';
  if (soc.gamingScore120fps >= 90 && soc.thermalStabilityPct >= 80) {
    stutterRisk = 'Mínimo (60/120 FPS estables)';
  } else if (soc.gamingScore120fps >= 75) {
    stutterRisk = 'Ocasional (pequeños tirones)';
  } else {
    stutterRisk = 'Frecuente (Frame drops notorios)';
  }

  // Battery estimate in hours for a typical 5000 mAh phone (approx 19.25 Wh)
  const powerDraw = Math.max(3.5, soc.tdpAvgWatts * (usageProfile === 'gaming_hardcore' || usageProfile === 'emulation' ? 1.15 : 0.65));
  const estimatedBatteryHoursGaming = Number((19.25 / powerDraw).toFixed(1));

  // Temperature estimates
  const baseIdle = 31;
  const gaming20minC = Math.round(baseIdle + (soc.tdpAvgWatts * 1.5) + (100 - soc.thermalStabilityPct) * 0.15);
  const gaming60minC = Math.round(gaming20minC + (soc.thermalStabilityPct < 80 ? 4 : 2));

  // Game simulations
  const supportedGames: Array<{
    title: string;
    targetFps: '30 FPS' | '60 FPS' | '90 FPS' | '120 FPS';
    graphicsQuality: 'Bajo' | 'Medio' | 'Alto' | 'Ultra';
    experience: 'Excelente' | 'Fluido' | 'Jugable' | 'Inestable';
  }> = [
    {
      title: 'Genshin Impact (Sumeru / Natlan 60 FPS)',
      targetFps: soc.gamingScore120fps > 88 ? '60 FPS' : '60 FPS',
      graphicsQuality: soc.gamingScore120fps > 92 ? 'Ultra' : soc.gamingScore120fps > 80 ? 'Alto' : 'Medio',
      experience: soc.gamingScore120fps > 90 && soc.thermalStabilityPct > 80 ? 'Excelente' : soc.gamingScore120fps > 75 ? 'Fluido' : 'Jugable'
    },
    {
      title: 'Call of Duty: Warzone Mobile',
      targetFps: soc.gamingScore120fps > 95 ? '120 FPS' : soc.gamingScore120fps > 85 ? '90 FPS' : '60 FPS',
      graphicsQuality: soc.gamingScore120fps > 90 ? 'Ultra' : 'Alto',
      experience: soc.thermalStabilityPct > 82 ? 'Excelente' : 'Fluido'
    },
    {
      title: 'League of Legends: Wild Rift',
      targetFps: soc.gamingScore120fps > 80 ? '120 FPS' : '90 FPS',
      graphicsQuality: 'Ultra',
      experience: 'Excelente'
    },
    {
      title: 'PUBG Mobile / BGMI (90-120 FPS Mode)',
      targetFps: soc.gamingScore120fps > 85 ? '120 FPS' : '90 FPS',
      graphicsQuality: soc.gamingScore120fps > 85 ? 'Ultra' : 'Medio',
      experience: 'Excelente'
    },
    {
      title: 'Emulación Nintendo Switch / PS2 / Yuzu-Eden',
      targetFps: soc.geekbenchSingle > 2800 && soc.manufacturer === 'Qualcomm' ? '60 FPS' : '30 FPS',
      graphicsQuality: soc.manufacturer === 'Qualcomm' && soc.gamingScore120fps > 90 ? 'Alto' : 'Medio',
      experience: soc.manufacturer === 'Qualcomm' && soc.gamingScore120fps > 90 ? 'Excelente' : soc.manufacturer === 'Apple' ? 'Jugable' : 'Inestable'
    }
  ];

  const tips: string[] = [];
  if (soc.thermalStabilityPct < 80) {
    tips.push('Recomendado usar un ventilador magnético / cooler Peltier para sesiones largas de gaming y evitar caídas bruscas de FPS por estrangulamiento térmico.');
  }
  if (soc.manufacturer === 'Qualcomm') {
    tips.push('Tu SoC cuenta con controladores GPU Adreno; en emuladores como Sudachi / Yuzu puedes instalar Custom Drivers Turnip (Mesa) para ganar hasta 35% más de rendimiento.');
  }
  if (soc.manufacturer === 'Apple') {
    tips.push('Activa el "Modo Juego" en iOS para priorizar recursos de CPU/GPU y reducir la latencia de audio en AirPods y mandos Bluetooth.');
  }
  tips.push('Evita jugar mientras cargas el teléfono con carga ultra rápida (67W-120W) para proteger la salud de la batería de altas temperaturas.');

  return {
    soc,
    usageProfile,
    overallScore,
    throttleRisk,
    stutterRisk,
    estimatedBatteryHoursGaming,
    temperaturesEstimate: {
      idleC: baseIdle,
      gaming20minC,
      gaming60minC
    },
    supportedGames,
    tips
  };
}

export function calculateElectricityCost(
  watts: number,
  hoursPerDay: number,
  costPerKwh: number, // e.g. 0.15 USD or EUR
  currencySymbol: string = '$'
) {
  const kwhDaily = (watts * hoursPerDay) / 1000;
  const kwhMonthly = kwhDaily * 30.5;
  const kwhYearly = kwhDaily * 365;

  const costDaily = kwhDaily * costPerKwh;
  const costMonthly = kwhMonthly * costPerKwh;
  const costYearly = kwhYearly * costPerKwh;

  return {
    kwhDaily: Number(kwhDaily.toFixed(2)),
    kwhMonthly: Number(kwhMonthly.toFixed(1)),
    kwhYearly: Number(kwhYearly.toFixed(1)),
    costDaily: `${currencySymbol}${costDaily.toFixed(2)}`,
    costMonthly: `${currencySymbol}${costMonthly.toFixed(2)}`,
    costYearly: `${currencySymbol}${costYearly.toFixed(2)}`
  };
}
