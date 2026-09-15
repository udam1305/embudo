export type WorkloadType = 'gaming' | 'streaming' | 'render3d' | 'video_edit' | 'multitask';
export type ResolutionType = '1080p' | '1440p' | 'ultrawide' | '4k' | '5k_ultrawide' | '8k';
export type GraphicPreset = 'low' | 'medium' | 'high' | 'ultra' | 'raytracing';
export type UpscalingTechnology = 'none' | 'dlss' | 'fsr' | 'xess';
export type UpscalingMode = 'native' | 'quality' | 'balanced' | 'performance' | 'ultra_performance';
export type DeviceType = 'desktop' | 'laptop';

export interface CPU {
  id: string;
  name: string;
  brand: 'AMD' | 'Intel' | 'Apple' | 'Other';
  platform?: 'desktop' | 'laptop';
  isLaptop?: boolean;
  socket: string;
  cores: number;
  threads: number;
  baseClock: number; // GHz
  boostClock: number; // GHz
  tdp: number; // Watts
  gamingScore: number; // 0 - 100
  multicoreScore: number; // 0 - 100
  singlecoreScore: number; // 0 - 100
  releaseYear: number;
  pcieGen: number; // 3, 4, 5
  generation?: string;
  integratedGpu?: string;
  sourceUrl?: string;
}

export interface GPU {
  id: string;
  name: string;
  brand: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple';
  platform?: 'desktop' | 'laptop';
  isLaptop?: boolean;
  vram: number; // GB
  vramType: string; // GDDR6, GDDR6X, GDDR7, LPDDR5X, Unificada
  tdp: number; // Watts (TGP in laptops)
  recommendedPsu: number; // Watts
  score1080p: number; // 0 - 100
  score1440p: number; // 0 - 100
  score4k: number; // 0 - 100
  rayTracingScore: number; // 0 - 100
  releaseYear: number;
  dlssFsrSupport: string; // DLSS 3.5 / 4.0, FSR 3.1
  sourceUrl?: string;
}

export interface RAM {
  id: string;
  name?: string;
  brand?: string;
  type: 'DDR4' | 'DDR5' | 'DDR3';
  capacityGb: number;
  speedMhz: number;
  channels: 'single' | 'dual' | 'quad';
  casLatency: number;
}

export interface Storage {
  id: string;
  type: 'NVMe Gen5' | 'NVMe Gen4' | 'NVMe Gen3' | 'SATA SSD' | 'HDD';
  capacityGb: number;
  readSpeedMb: number;
}

export interface PSU {
  id: string;
  name: string;
  brand?: 'Corsair' | 'Seasonic' | 'ASUS ROG' | 'be quiet!' | 'MSI' | 'EVGA' | 'Genérica' | 'Laptop Original' | string;
  wattage: number;
  efficiency: '80 PLUS White' | '80 PLUS Bronze' | '80 PLUS Silver' | '80 PLUS Gold' | '80 PLUS Platinum' | '80 PLUS Titanium' | 'Genérica' | string;
  tier?: string;
  modular?: 'Totalmente Modular' | 'Semi-Modular' | 'No Modular';
  atx3?: boolean;
}

export interface MobileSoC {
  id: string;
  name: string;
  manufacturer: 'Qualcomm' | 'Apple' | 'MediaTek' | 'Samsung' | 'Google';
  processNodeNm: number; // e.g. 3, 4, 5
  cpuConfiguration: string; // e.g. "1x Oryon 4.32GHz + 6x 3.53GHz"
  gpuName: string;
  anTuTuScore: number;
  geekbenchSingle: number;
  geekbenchMulti: number;
  gamingScore120fps: number; // 0 - 100
  thermalStabilityPct: number; // 0 - 100 (e.g. 85% means slight throttling, 60% severe throttling)
  tdpAvgWatts: number;
  typicalDevices: string[];
}

export interface DiagnosisConfig {
  cpu: CPU;
  gpu: GPU;
  ram: RAM;
  storage: Storage;
  psu?: PSU;
  resolution: ResolutionType;
  workload: WorkloadType;
  workloads?: WorkloadType[];
  os: 'Windows 11' | 'Windows 10' | 'Linux' | 'macOS';
  deviceType?: DeviceType; // 'desktop' | 'laptop'
  laptopChargerWatts?: number; // e.g. 65, 100, 140, 180, 230, 280, 330
  // Multi-Monitor & Scaling Configuration
  monitorCount?: number; // 1, 2, 3, 4
  monitorMode?: 'gaming_primary' | 'surround_span'; // primary game vs spanned surround
  secondaryResolution?: ResolutionType;
  upscalingTech?: UpscalingTechnology; // 'none' | 'dlss' | 'fsr' | 'xess'
  upscalingMode?: UpscalingMode; // 'native' | 'quality' | 'balanced' | 'performance' | 'ultra_performance'
  renderScalePct?: number; // Internal render percentage, e.g. 100, 67, 58, 50, 33
}

export interface BottleneckResult {
  bottleneckPct: number; // 0 - 100%
  limitingFactor: 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Equilibrado';
  severity: 'perfect' | 'minor' | 'moderate' | 'heavy' | 'critical';
  summary: string;
  technicalDetails: {
    cpuLoadEst: number;
    gpuLoadEst: number;
    ramSpeedPenaltyPct: number;
    storagePenaltyPct: number;
    recommendedResolution: string;
  };
  laptopAnalysis?: {
    isLaptop: boolean;
    chassisType: 'Ultrabook / Liviana' | 'Gamer Equilibrada' | 'Gamer Alto Rendimiento' | 'Workstation Móvil';
    combinedTdpWatts: number;
    chargerCapacityWatts: number;
    batteryDrainRisk: boolean;
    thermalThrottleRisk: 'Bajo' | 'Moderado' | 'Alto' | 'Severo';
    coolingGuidance: string;
  };
  displayAnalysis?: {
    totalMonitors: number;
    mode: 'gaming_primary' | 'surround_span';
    outputResolutionLabel: string;
    internalRenderResolutionLabel: string;
    totalPixelsMegaPixels: number;
    upscalingActive: boolean;
    upscalingName: string;
    renderScalePct: number;
    vramEstimatedUsageGb: number;
    vramCapacityGb: number;
    vramSaturationPct: number;
    vramAlert?: string;
    multiMonitorOverheadWatts: number;
    cableRecommendation: string;
  };
  powerStats: {
    systemEstimatedWatts: number;
    peakSurgeWatts: number;
    recommendedPsuWatts: number;
    psuEfficiencyRating: string;
    userPsuEvaluation?: {
      wattage: number;
      efficiency: string;
      status: 'optimal' | 'sufficient' | 'tight' | 'insufficient';
      message: string;
      headroomWatts: number;
      loadPercentage: number;
    };
  };
  fpsEstimates: Array<{
    game: string;
    lowFps: number;
    medFps: number;
    ultraFps: number;
    rtFps: number;
    onePercentLow: number;
  }>;
  driverAdvice: string[];
  upgradeRecommendations: Array<{
    priority: number;
    componentType: 'CPU' | 'GPU' | 'RAM' | 'Almacenamiento' | 'Fuente';
    suggestedItem: string;
    gainPercentage: number;
    reason: string;
  }>;
}

export interface MobileDiagnosisResult {
  soc: MobileSoC;
  usageProfile: 'gaming_hardcore' | 'gaming_casual' | 'emulation' | 'multitask_social' | 'content_creation';
  overallScore: number;
  throttleRisk: 'Bajo' | 'Moderado' | 'Alto' | 'Extremo';
  stutterRisk: 'Mínimo (60/120 FPS estables)' | 'Ocasional (pequeños tirones)' | 'Frecuente (Frame drops notorios)';
  estimatedBatteryHoursGaming: number;
  temperaturesEstimate: {
    idleC: number;
    gaming20minC: number;
    gaming60minC: number;
  };
  supportedGames: Array<{
    title: string;
    targetFps: '30 FPS' | '60 FPS' | '90 FPS' | '120 FPS';
    graphicsQuality: 'Bajo' | 'Medio' | 'Alto' | 'Ultra';
    experience: 'Excelente' | 'Fluido' | 'Jugable' | 'Inestable';
  }>;
  tips: string[];
}

export interface PrebuiltPC {
  id: string;
  tier: 'Entrada' | 'Media' | 'Alta' | 'Entusiasta' | 'Notebook Gaming' | 'Notebook Fino' | string;
  formFactor?: 'desktop' | 'laptop';
  name: string;
  description: string;
  targetResolution: string;
  cpu: CPU;
  gpu: GPU;
  ram: RAM;
  storage: Storage;
  psu: string;
  estimatedPriceUsd: number;
  bottleneckScore: number;
  highlights: string[];
}

export interface UserSavedDiagnosis {
  id: string;
  title: string;
  createdAt: string;
  config: DiagnosisConfig;
  result: BottleneckResult;
  isFavorite?: boolean;
}

export interface AdminStats {
  totalDiagnosesRun: number;
  topCpusQueried: { name: string; count: number }[];
  topGpusQueried: { name: string; count: number }[];
  averageBottleneckPct: number;
  topMobileSocQueried: { name: string; count: number }[];
  lastDatabaseUpdate: string;
  activeUsers24h: number;
}
