import { DiagnosisConfig, BottleneckResult, MobileSoC, MobileDiagnosisResult, WorkloadType, ResolutionType, UpscalingMode, UpscalingTechnology } from '../types';

export function calculateBottleneck(config: DiagnosisConfig): BottleneckResult {
  const { cpu, gpu, ram, storage, resolution, workload } = config;

  // Multi-Monitor & Scaling Configuration
  const monitorCount = Math.max(1, Math.min(4, config.monitorCount || 1));
  const monitorMode = config.monitorMode || 'gaming_primary';
  const upscalingMode: UpscalingMode = config.upscalingMode || 'native';
  const upscalingTech: UpscalingTechnology = config.upscalingTech || (gpu.brand === 'NVIDIA' ? 'dlss' : gpu.brand === 'AMD' ? 'fsr' : 'xess');

  // Scaling multipliers & render ratios
  let renderScaleRatio = 1.0;
  let upscalingName = 'Nativo 100%';
  let upscalingFpsBoost = 1.0;

  if (upscalingMode === 'quality') {
    renderScaleRatio = 0.667;
    upscalingFpsBoost = 1.38;
    upscalingName = `${upscalingTech.toUpperCase()} Calidad (67% Render)`;
  } else if (upscalingMode === 'balanced') {
    renderScaleRatio = 0.58;
    upscalingFpsBoost = 1.62;
    upscalingName = `${upscalingTech.toUpperCase()} Equilibrado (58% Render)`;
  } else if (upscalingMode === 'performance') {
    renderScaleRatio = 0.50;
    upscalingFpsBoost = 1.95;
    upscalingName = `${upscalingTech.toUpperCase()} Rendimiento (50% Render)`;
  } else if (upscalingMode === 'ultra_performance') {
    renderScaleRatio = 0.333;
    upscalingFpsBoost = 2.75;
    upscalingName = `${upscalingTech.toUpperCase()} Ultra Rendimiento (33% Render - 8K Opt.)`;
  }

  // Base display specifications
  let baseWidth = 2560;
  let baseHeight = 1440;
  let resolutionLabel = '1440p Quad HD';

  switch (resolution) {
    case '1080p':
      baseWidth = 1920;
      baseHeight = 1080;
      resolutionLabel = '1080p Full HD (1920x1080)';
      break;
    case '1440p':
      baseWidth = 2560;
      baseHeight = 1440;
      resolutionLabel = '1440p Quad HD (2560x1440)';
      break;
    case 'ultrawide':
      baseWidth = 3440;
      baseHeight = 1440;
      resolutionLabel = 'Ultrawide UWQHD (3440x1440)';
      break;
    case '4k':
      baseWidth = 3840;
      baseHeight = 2160;
      resolutionLabel = '4K Ultra HD (3840x2160)';
      break;
    case '5k_ultrawide':
      baseWidth = 5120;
      baseHeight = 1440;
      resolutionLabel = '5K Dual QHD (5120x1440)';
      break;
    case '8k':
      baseWidth = 7680;
      baseHeight = 4320;
      resolutionLabel = '8K Ultra HD (7680x4320)';
      break;
  }

  // Active rendering dimensions
  const activeWidth = (monitorMode === 'surround_span' && monitorCount > 1)
    ? baseWidth * monitorCount
    : baseWidth;
  const activeHeight = baseHeight;

  const totalPixelsMegaPixels = Number(((activeWidth * activeHeight) / 1_000_000).toFixed(1));
  const renderWidth = Math.round(activeWidth * renderScaleRatio);
  const renderHeight = Math.round(activeHeight * renderScaleRatio);
  const internalRenderResolutionLabel = `${renderWidth} x ${renderHeight}`;

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
    case 'ultrawide':
      cpuWeight = 0.28;
      gpuWeight = 0.72;
      break;
    case '4k':
      cpuWeight = 0.18;
      gpuWeight = 0.82;
      break;
    case '5k_ultrawide':
      cpuWeight = 0.13;
      gpuWeight = 0.87;
      break;
    case '8k':
      cpuWeight = 0.07;
      gpuWeight = 0.93;
      break;
  }

  // If heavy upscaling is active, the internal render resolution is lower, shifting work slightly back to CPU
  if (upscalingMode === 'performance' || upscalingMode === 'ultra_performance') {
    cpuWeight += 0.08;
    gpuWeight -= 0.08;
  }

  // If surround mode across 3-4 monitors, GPU load expands further
  if (monitorMode === 'surround_span' && monitorCount > 1) {
    gpuWeight = Math.min(0.95, gpuWeight + 0.08);
    cpuWeight = Math.max(0.05, 1 - gpuWeight);
  }

  // 2. Workload modifier (supports single or multiple selected workloads)
  const activeWorkloads: WorkloadType[] = (config.workloads && config.workloads.length > 0)
    ? config.workloads
    : [workload || 'gaming'];

  const baseGpuScore = (resolution === '8k' || resolution === '4k' || resolution === '5k_ultrawide')
    ? gpu.score4k
    : (resolution === '1440p' || resolution === 'ultrawide')
    ? gpu.score1440p
    : gpu.score1080p;

  let totalCpuScore = 0;
  let totalGpuScore = 0;

  activeWorkloads.forEach(w => {
    if (w === 'render3d') {
      totalCpuScore += (cpu.multicoreScore * 0.7) + (cpu.singlecoreScore * 0.3);
      totalGpuScore += (gpu.score4k * 0.6) + (gpu.rayTracingScore * 0.4);
    } else if (w === 'streaming') {
      totalCpuScore += (cpu.gamingScore * 0.65) + (cpu.multicoreScore * 0.35);
      totalGpuScore += baseGpuScore;
    } else if (w === 'video_edit') {
      totalCpuScore += (cpu.multicoreScore * 0.8) + (cpu.singlecoreScore * 0.2);
      totalGpuScore += (gpu.score1440p * 0.5) + (gpu.score4k * 0.5);
    } else if (w === 'multitask') {
      totalCpuScore += (cpu.multicoreScore * 0.6) + (cpu.gamingScore * 0.4);
      totalGpuScore += baseGpuScore;
    } else {
      // gaming
      totalCpuScore += cpu.gamingScore;
      totalGpuScore += baseGpuScore;
    }
  });

  const effectiveCpuScore = totalCpuScore / activeWorkloads.length;
  const effectiveGpuScore = totalGpuScore / activeWorkloads.length;

  // 3. RAM Penalties
  let ramPenaltyPct = 0;
  if (ram.channels === 'single') {
    ramPenaltyPct += 14; // Single channel severely caps modern CPU memory bus
  }
  if (ram.capacityGb < 16) {
    ramPenaltyPct += 18;
  } else if (ram.capacityGb < 32 && (resolution === '4k' || resolution === '5k_ultrawide' || resolution === '8k' || activeWorkloads.some(w => w === 'render3d' || w === 'video_edit' || w === 'multitask') || monitorCount > 1)) {
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

  // 5. VRAM Estimation & Saturation Check
  let baseVramGb = 7.0;
  if (resolution === '1080p') baseVramGb = 6.2;
  else if (resolution === '1440p') baseVramGb = 9.2;
  else if (resolution === 'ultrawide') baseVramGb = 10.5;
  else if (resolution === '4k') baseVramGb = 13.8;
  else if (resolution === '5k_ultrawide') baseVramGb = 14.8;
  else if (resolution === '8k') baseVramGb = 22.5;

  // Upscaling reduces frame buffer rendering allocation
  if (upscalingMode === 'quality') baseVramGb *= 0.90;
  else if (upscalingMode === 'balanced') baseVramGb *= 0.82;
  else if (upscalingMode === 'performance') baseVramGb *= 0.72;
  else if (upscalingMode === 'ultra_performance') baseVramGb *= 0.58;

  // Multi-monitor overhead
  let multiMonitorVramOverhead = 0;
  if (monitorCount > 1) {
    if (monitorMode === 'surround_span') {
      multiMonitorVramOverhead = (monitorCount - 1) * 2.5;
    } else {
      multiMonitorVramOverhead = (monitorCount - 1) * 0.7; // DWM + Hardware accelerated browsers
    }
  }

  const vramEstimatedUsageGb = Number((baseVramGb + multiMonitorVramOverhead).toFixed(1));
  const vramCapacityGb = gpu.vram;
  const vramSaturationPct = Math.round((vramEstimatedUsageGb / vramCapacityGb) * 100);

  let vramAlert: string | undefined = undefined;
  let vramPenaltyBottleneck = 0;

  if (vramSaturationPct > 105) {
    vramPenaltyBottleneck = Math.min(45, Math.round((vramSaturationPct - 100) * 0.6));
    vramAlert = `⚠️ Sobresaturación de VRAM: Tu ensamble demanda ~${vramEstimatedUsageGb}GB y la ${gpu.name} dispone de ${vramCapacityGb}GB. El desbordamiento a la RAM del sistema provocará micro-tirones severos (stuttering). Activa escalado (${gpu.brand === 'NVIDIA' ? 'DLSS' : 'FSR'} Rendimiento/Ultra) o reduce resolución.`;
  }

  // Compute Delta between CPU and GPU
  let rawBottleneck = 0;
  let limitingFactor: 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Equilibrado' = 'Equilibrado';

  if (vramSaturationPct > 115) {
    limitingFactor = 'GPU';
    rawBottleneck = Math.max(vramPenaltyBottleneck, 25);
  } else if (ramPenaltyPct >= 15) {
    limitingFactor = 'RAM';
    rawBottleneck = ramPenaltyPct;
  } else if (storagePenaltyPct >= 15) {
    limitingFactor = 'Storage';
    rawBottleneck = storagePenaltyPct;
  } else if (penalizedCpuPower < effectiveGpuScore * 0.90) {
    limitingFactor = 'CPU';
    rawBottleneck = Math.min(65, Math.round(((effectiveGpuScore - penalizedCpuPower) / effectiveGpuScore) * 100 * cpuWeight * 1.8));
  } else if (effectiveGpuScore < penalizedCpuPower * 0.75 && (resolution === '4k' || resolution === '8k' || resolution === '5k_ultrawide')) {
    limitingFactor = 'GPU';
    rawBottleneck = Math.min(30, Math.round(((penalizedCpuPower - effectiveGpuScore) / penalizedCpuPower) * 100 * 0.35));
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
  const monitorInfoText = monitorCount > 1
    ? ` en configuración de ${monitorCount} monitores (${monitorMode === 'surround_span' ? 'Surround extendido' : 'Multitarea'})`
    : '';

  if (vramAlert) {
    summary = `${vramAlert}`;
  } else if (severity === 'perfect') {
    summary = `¡Excelente balance! Tu combinación de ${cpu.name} y ${gpu.name} en ${resolution.toUpperCase()}${monitorInfoText} está prácticamente libre de cuello de botella (${bottleneckPct}%).`;
  } else if (limitingFactor === 'CPU') {
    summary = `Se detecta un cuello de botella por procesador del ${bottleneckPct}%. En ${resolution.toUpperCase()}${monitorInfoText}, la ${gpu.name} tiene más potencial gráfico del que el ${cpu.name} puede procesar en cuadros por segundo.`;
  } else if (limitingFactor === 'RAM') {
    summary = `Se detecta limitación por memoria RAM (${ram.capacityGb}GB ${ram.type} en modo ${ram.channels === 'single' ? 'Single-Channel' : 'Dual-Channel'}). La falta de ancho de banda genera caídas de cuadros (stuttering).`;
  } else if (limitingFactor === 'Storage') {
    summary = `El almacenamiento (${storage.type}) ralentiza el streaming de texturas y los tiempos de carga en títulos modernos con DirectStorage.`;
  } else {
    summary = `Balance adecuado con un ligero margen de ${bottleneckPct}% orientado a GPU bound, ideal para ${resolution.toUpperCase()}${monitorInfoText}.`;
  }

  // Multi-monitor overhead watts
  const multiMonitorOverheadWatts = monitorCount > 1 ? (monitorCount - 1) * 15 : 0;

  // Power & PSU calculations
  const cpuPeak = Math.round(cpu.tdp * 1.28);
  const gpuPeak = Math.round(gpu.tdp * 1.25);
  const sysOtherWatts = 70 + (ram.channels === 'dual' ? 16 : 8) + multiMonitorOverheadWatts;
  const systemEstimatedWatts = cpuPeak + gpuPeak + sysOtherWatts;
  const peakSurgeWatts = Math.round(systemEstimatedWatts * 1.20);
  
  // Recommend PSU with 30-40% headroom for 80+ Gold sweet spot efficiency curve
  const roundedPsu = Math.ceil((systemEstimatedWatts * 1.35) / 50) * 50;
  const recommendedPsuWatts = Math.max(gpu.recommendedPsu, roundedPsu);
  const psuEfficiencyRating = recommendedPsuWatts >= 850 ? '80 PLUS Gold / Platinum (ATX 3.0 / PCIe 5.0 12V-2x6)' : '80 PLUS Gold (750W+)';

  // User PSU Evaluation
  const userPsu = config.psu;
  let userPsuEvaluation: BottleneckResult['powerStats']['userPsuEvaluation'] = undefined;

  if (userPsu) {
    const headroomWatts = userPsu.wattage - systemEstimatedWatts;
    const loadPercentage = Math.min(150, Math.round((systemEstimatedWatts / userPsu.wattage) * 100));
    let status: 'optimal' | 'sufficient' | 'tight' | 'insufficient' = 'sufficient';
    let message = '';

    if (userPsu.wattage < systemEstimatedWatts) {
      status = 'insufficient';
      message = `⚠️ Tu fuente de ${userPsu.wattage}W es insuficiente. El ensamble demanda ~${systemEstimatedWatts}W continuos (pico de ${peakSurgeWatts}W). Provocará apagados de seguridad (OCP/OPP).`;
    } else if (userPsu.wattage < peakSurgeWatts) {
      status = 'tight';
      message = `⚠️ Tu fuente de ${userPsu.wattage}W soporta el uso continuo (${loadPercentage}% de carga), pero está al límite ante picos transitorios de ${peakSurgeWatts}W.`;
    } else if (userPsu.wattage >= recommendedPsuWatts) {
      status = 'optimal';
      message = `✅ Tu fuente de ${userPsu.wattage}W es óptima (${loadPercentage}% de carga). Permite operar en la curva ideal de eficiencia y absorbe picos transitorios con total holgura.`;
    } else {
      status = 'sufficient';
      message = `✔️ Tu fuente de ${userPsu.wattage}W es suficiente para el consumo continuo (~${systemEstimatedWatts}W) con un margen adecuado.`;
    }

    userPsuEvaluation = {
      wattage: userPsu.wattage,
      efficiency: userPsu.efficiency,
      status,
      message,
      headroomWatts,
      loadPercentage
    };
  }

  // 6. Cable and Bandwidth Recommendation
  let cableRecommendation = 'DisplayPort 1.4a o HDMI 2.0 (Hasta 1440p / 144Hz)';
  if (resolution === '8k' || totalPixelsMegaPixels >= 25) {
    cableRecommendation = 'DisplayPort 2.1 (UHBR20 / 80Gbps) o HDMI 2.1 (48Gbps con DSC nativo para 8K HDR 120Hz)';
  } else if (resolution === '4k' || resolution === '5k_ultrawide') {
    cableRecommendation = 'DisplayPort 1.4a con DSC o HDMI 2.1 para 4K a 144Hz / 240Hz';
  } else if (monitorCount >= 3) {
    cableRecommendation = `Requiere GPU con al menos ${monitorCount} salidas digitales (${monitorCount}x DP 1.4a/2.1 + HDMI 2.1)`;
  }

  // 7. FPS Estimates in Top Games with Scaling & Multi-Monitor Impact
  let resolutionFpsMult = 1.0;
  if (resolution === '1080p') resolutionFpsMult = 1.40;
  else if (resolution === '1440p') resolutionFpsMult = 1.00;
  else if (resolution === 'ultrawide') resolutionFpsMult = 0.82;
  else if (resolution === '4k') resolutionFpsMult = 0.58;
  else if (resolution === '5k_ultrawide') resolutionFpsMult = 0.48;
  else if (resolution === '8k') resolutionFpsMult = 0.18; // 33.2 Million pixels!

  // Surround mode multiplier
  let surroundFpsFactor = 1.0;
  if (monitorMode === 'surround_span' && monitorCount > 1) {
    surroundFpsFactor = 1 / Math.pow(monitorCount, 0.85);
  } else if (monitorCount > 1) {
    // Primary mode has slight background DWM and video playback penalty
    surroundFpsFactor = 1 - (monitorCount - 1) * 0.035;
  }

  // VRAM penalty on FPS if saturating
  const vramFpsFactor = vramSaturationPct > 105 ? Math.max(0.40, 1 - (vramSaturationPct - 100) * 0.015) : 1.0;

  const gpuBaseFps = (gpu.score1440p * 1.45) * resolutionFpsMult * upscalingFpsBoost * surroundFpsFactor * vramFpsFactor;
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
    const onePctLow = Math.round(ultra * (ram.channels === 'single' ? 0.62 : 0.88) * (vramSaturationPct > 105 ? 0.55 : 1.0));

    return {
      game: g.name,
      lowFps: Math.max(10, low),
      medFps: Math.max(8, med),
      ultraFps: Math.max(5, ultra),
      rtFps: Math.max(4, rt),
      onePercentLow: Math.max(3, onePctLow)
    };
  });

  // 8. Driver and OS advice
  const driverAdvice: string[] = [];
  if (resolution === '8k') {
    driverAdvice.push('🖥️ CONFIGURACIÓN 8K: Para jugar en 8K a más de 60 FPS estables, se recomienda imperativamente activar DLSS o FSR en modo "Rendimiento" o "Ultra Rendimiento" con Frame Generation activo.');
  }

  if (monitorCount > 1) {
    if (monitorMode === 'surround_span') {
      driverAdvice.push(`Configura ${gpu.brand === 'NVIDIA' ? 'NVIDIA Surround' : 'AMD Eyefinity'} en el panel de control gráfico para unificar las ${monitorCount} pantallas en un único lienzo panorámico.`);
    } else {
      driverAdvice.push(`Con ${monitorCount} monitores en multitarea, activa "Aceleración por hardware" en Discord y Chrome para descargar a la CPU.`);
    }
  }

  if (gpu.brand === 'NVIDIA') {
    driverAdvice.push(`Instala el controlador NVIDIA GeForce Game Ready Driver (570.xx+) con soporte para ${gpu.dlssFsrSupport}.`);
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

  // 9. Upgrade Recommendations
  const upgradeRecommendations: Array<{
    priority: number;
    componentType: 'CPU' | 'GPU' | 'RAM' | 'Almacenamiento' | 'Fuente';
    suggestedItem: string;
    gainPercentage: number;
    reason: string;
  }> = [];

  if (vramSaturationPct > 105) {
    upgradeRecommendations.unshift({
      priority: 1,
      componentType: 'GPU',
      suggestedItem: gpu.brand === 'NVIDIA' ? 'NVIDIA GeForce RTX 5090 (32GB GDDR7) o RTX 5080 (16GB)' : 'AMD Radeon RX 7900 XTX (24GB GDDR6)',
      gainPercentage: 45,
      reason: `Resolución ${resolution.toUpperCase()} y setup multimonitor requieren al menos ${vramEstimatedUsageGb}GB de VRAM. Tu tarjeta actual (${gpu.vram}GB) satura su memoria.`
    });
  }

  if (ram.channels === 'single' || ram.capacityGb < 32) {
    upgradeRecommendations.push({
      priority: 2,
      componentType: 'RAM',
      suggestedItem: 'Kit 32GB (2x16GB) DDR5 6000MHz CL30 Corsair Vengeance / Dominator',
      gainPercentage: ram.channels === 'single' ? 22 : 12,
      reason: 'Elimina el cuello de botella por ancho de banda de memoria y estabiliza caídas de FPS.'
    });
  }

  if (limitingFactor === 'CPU' && bottleneckPct >= 15) {
    upgradeRecommendations.push({
      priority: 3,
      componentType: 'CPU',
      suggestedItem: cpu.brand === 'AMD' ? 'AMD Ryzen 7 7800X3D o 9800X3D (AM5)' : 'Intel Core i7-14700K / Core Ultra 7',
      gainPercentage: Math.round(bottleneckPct * 0.9),
      reason: `Desbloquea el 100% de la capacidad de tu ${gpu.name} en resoluciones competitivas.`
    });
  }

  if (storage.type === 'HDD' || storage.type === 'SATA SSD') {
    upgradeRecommendations.push({
      priority: 4,
      componentType: 'Almacenamiento',
      suggestedItem: 'M.2 NVMe PCIe 4.0 2TB (7000+ MB/s)',
      gainPercentage: 15,
      reason: 'Carga instantánea de partidas y soporte para DirectStorage en juegos de nueva generación.'
    });
  }

  if (userPsu && userPsu.wattage < peakSurgeWatts) {
    upgradeRecommendations.unshift({
      priority: 1,
      componentType: 'Fuente',
      suggestedItem: `Fuente Corsair RM${recommendedPsuWatts}x SHIFT 80+ Gold (ATX 3.1)`,
      gainPercentage: 0,
      reason: `Tu fuente actual (${userPsu.wattage}W) está por debajo del pico transitorio de ${peakSurgeWatts}W. Requiere actualización prioritaria para evitar reinicios o apagados súbitos.`
    });
  } else if (!userPsu && systemEstimatedWatts > gpu.recommendedPsu * 0.85) {
    upgradeRecommendations.push({
      priority: 5,
      componentType: 'Fuente',
      suggestedItem: `Fuente Corsair RM${recommendedPsuWatts}x SHIFT 80+ Gold Modular`,
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
      recommendedResolution: resolution === '8k' ? '8K con DLSS/FSR Rendimiento o 4K Nativo' : resolution === '1080p' && penalizedCpuPower < effectiveGpuScore ? '1440p (traslada carga a la GPU)' : resolution
    },
    displayAnalysis: {
      totalMonitors: monitorCount,
      mode: monitorMode,
      outputResolutionLabel: resolutionLabel,
      internalRenderResolutionLabel,
      totalPixelsMegaPixels,
      upscalingActive: upscalingMode !== 'native',
      upscalingName,
      renderScalePct: Math.round(renderScaleRatio * 100),
      vramEstimatedUsageGb,
      vramCapacityGb,
      vramSaturationPct,
      vramAlert,
      multiMonitorOverheadWatts,
      cableRecommendation
    },
    powerStats: {
      systemEstimatedWatts,
      peakSurgeWatts,
      recommendedPsuWatts,
      psuEfficiencyRating,
      userPsuEvaluation
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
