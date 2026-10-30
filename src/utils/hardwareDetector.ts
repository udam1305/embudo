import { CPU, GPU, RAM, Storage, PSU, Motherboard, MobileSoC, ResolutionType, DiagnosisConfig } from '../types';
import {
  INITIAL_CPUS,
  INITIAL_GPUS,
  INITIAL_MOTHERBOARDS,
  INITIAL_RAMS,
  INITIAL_STORAGES,
  INITIAL_PSUS
} from '../data/initialData';

export function cleanSocket(s?: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/^socket\s*/i, '').replace(/[\s\-_/()]/g, '');
}

export interface EnumeratedDevice {
  kind: 'audioinput' | 'audiooutput' | 'videoinput' | 'display' | 'other';
  label: string;
  deviceId: string;
}

export interface DeviceScanResult {
  deviceType: 'desktop' | 'laptop' | 'smartphone';
  deviceTypeName: string;
  os: 'Windows 11' | 'Windows 10' | 'macOS' | 'Linux' | 'Android' | 'iOS';
  macModelName?: string; // e.g. "MacBook Pro 14\"", "MacBook Air 13.6\"", "MacBook Pro 16\""
  rawGpuRenderer: string;
  rawVendor: string;
  webGpuAdapterName?: string;
  logicalThreads: number;
  memoryEstimateGb: number;
  storageEstimateGb: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  displayHz?: number;
  detectedResolution: ResolutionType;
  resolutionLabel: string;
  hasBattery: boolean;
  batteryInfo?: {
    level: number;
    charging: boolean;
  };
  permissionGranted: boolean;
  enumeratedDevices: EnumeratedDevice[];
  // Complete matched entities from catalog
  matchedCpu: CPU;
  matchedGpu: GPU;
  matchedMotherboard: Motherboard;
  matchedRam: RAM;
  matchedStorage: Storage;
  matchedPsu: PSU;
  matchedSoc?: MobileSoC;
  matchedPhoneModel?: string;
  confidenceScore: number; // 0 - 100
  detectionDetails: string[];
}

/**
 * Requests device access permission to unlock real hardware labels (Microphones, Speakers, Cameras, Displays).
 */
export async function requestHardwareDevicePermissions(): Promise<{
  granted: boolean;
  devices: EnumeratedDevice[];
}> {
  const devices: EnumeratedDevice[] = [];
  let granted = false;

  try {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      granted = true;

      const rawDevices = await navigator.mediaDevices.enumerateDevices();
      for (const d of rawDevices) {
        if (d.label) {
          let kind: EnumeratedDevice['kind'] = 'other';
          if (d.kind === 'audioinput') kind = 'audioinput';
          else if (d.kind === 'audiooutput') kind = 'audiooutput';
          else if (d.kind === 'videoinput') kind = 'videoinput';

          devices.push({
            kind,
            label: d.label,
            deviceId: d.deviceId
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('[HardwareDetector] Media permissions not granted or denied:', err?.message);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        const rawDevices = await navigator.mediaDevices.enumerateDevices();
        for (const d of rawDevices) {
          if (d.label) {
            devices.push({
              kind: (d.kind as any) || 'other',
              label: d.label,
              deviceId: d.deviceId
            });
          }
        }
      }
    } catch {}
  }

  return { granted, devices };
}

/**
 * Measures display refresh rate via requestAnimationFrame
 */
async function measureDisplayRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime: number | null = null;

    const countFrames = (time: number) => {
      if (!startTime) startTime = time;
      frameCount++;
      const elapsed = time - startTime;

      if (elapsed >= 350) {
        const fps = Math.round((frameCount / elapsed) * 1000);
        if (fps >= 110) resolve(120);
        else if (fps >= 85) resolve(90);
        else if (fps >= 70) resolve(75);
        else resolve(60);
      } else {
        requestAnimationFrame(countFrames);
      }
    };

    requestAnimationFrame(countFrames);
  });
}

/**
 * Estimates client disk capacity through browser Storage API
 */
async function estimateClientStorageGb(): Promise<number> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate && estimate.quota) {
        const quotaGb = estimate.quota / (1024 * 1024 * 1024);
        // Browsers grant ~60-80% of disk space as storage quota
        if (quotaGb >= 600) return 2000; // 2TB SSD
        if (quotaGb >= 250) return 1000; // 1TB SSD
        if (quotaGb >= 100) return 512;  // 512GB SSD
        return 256;
      }
    }
  } catch {}
  return 1000; // default 1TB
}

/**
 * Probes WebGL, WebGPU, Navigator, Storage, Screen, Battery, and Permitted Hardware Devices.
 */
export async function scanClientDevice(
  cpus: CPU[],
  gpus: GPU[],
  motherboards: Motherboard[],
  rams: RAM[],
  storages: Storage[],
  psus: PSU[],
  socs: MobileSoC[],
  requestPermissions = false
): Promise<DeviceScanResult> {
  const detectionDetails: string[] = [];

  // 1. Permission request & hardware peripheral probe
  let permissionGranted = false;
  let enumeratedDevices: EnumeratedDevice[] = [];

  if (requestPermissions) {
    detectionDetails.push('Solicitando permiso al usuario para escanear dispositivos de hardware...');
    const permResult = await requestHardwareDevicePermissions();
    permissionGranted = permResult.granted;
    enumeratedDevices = permResult.devices;
    if (permissionGranted) {
      detectionDetails.push(`Permiso concedido: ${enumeratedDevices.length} dispositivos físicos verificados`);
    } else {
      detectionDetails.push('Permiso omitido o restringido; usando sondas WebGPU y WebGL');
    }
  } else {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        const rawDevices = await navigator.mediaDevices.enumerateDevices();
        for (const d of rawDevices) {
          if (d.label) {
            enumeratedDevices.push({
              kind: (d.kind as any) || 'other',
              label: d.label,
              deviceId: d.deviceId
            });
          }
        }
        if (enumeratedDevices.some((d) => d.label.length > 0)) {
          permissionGranted = true;
        }
      }
    } catch {}
  }

  // Check hardware labels for Mac or PC details
  let macHardwareModelFromDevices: string | undefined = undefined;
  for (const d of enumeratedDevices) {
    const l = d.label.toLowerCase();
    if (l.includes('macbook pro')) {
      macHardwareModelFromDevices = 'MacBook Pro';
    } else if (l.includes('macbook air') && !macHardwareModelFromDevices) {
      macHardwareModelFromDevices = 'MacBook Air';
    } else if (l.includes('mac studio') && !macHardwareModelFromDevices) {
      macHardwareModelFromDevices = 'Mac Studio';
    } else if (l.includes('imac') && !macHardwareModelFromDevices) {
      macHardwareModelFromDevices = 'iMac';
    }
  }

  // 2. WebGPU Inspection (Ultra precise in modern macOS Safari and Chrome!)
  let webGpuAdapterName: string | undefined = undefined;
  let webGpuArchitecture: string | undefined = undefined;

  try {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu?.requestAdapter) {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        let info = adapter.info;
        if (!info && typeof adapter.requestAdapterInfo === 'function') {
          info = await adapter.requestAdapterInfo();
        }
        if (info) {
          webGpuAdapterName = info.description || info.device || '';
          webGpuArchitecture = info.architecture || '';
          if (webGpuAdapterName || webGpuArchitecture) {
            detectionDetails.push(`WebGPU Hardware: ${webGpuAdapterName || webGpuArchitecture} (Arquitectura: ${webGpuArchitecture || 'Universal'})`);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[HardwareDetector] WebGPU probe:', err?.message);
  }

  // 3. WebGL Graphics Renderer Inspection
  let rawGpuRenderer = 'Tarjeta Gráfica Genérica';
  let rawVendor = 'Desconocido';

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        rawGpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || rawGpuRenderer;
        rawVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || rawVendor;
      } else {
        rawGpuRenderer = (gl.getParameter(gl.RENDERER) as string) || rawGpuRenderer;
        rawVendor = (gl.getParameter(gl.VENDOR) as string) || rawVendor;
      }
    }
  } catch (err: any) {
    console.warn('[HardwareDetector] Error probing WebGL:', err?.message);
  }

  detectionDetails.push(`GPU detectada por WebGL: ${rawGpuRenderer} (${rawVendor})`);

  // 4. Logical threads and estimated memory
  const logicalThreads = navigator.hardwareConcurrency || 8;
  let memoryEstimateGb = (navigator as any).deviceMemory;

  // 5. Operating System & Mobile Device Fingerprinting
  const ua = navigator.userAgent;

  // Direct UA & platform flags
  const isIPhoneUa = /iPhone/i.test(ua) || (typeof navigator !== 'undefined' && (navigator.platform === 'iPhone' || navigator.platform === 'iPhone Simulator'));
  const isIPodUa = /iPod/i.test(ua);
  const isIPadUa = /iPad/i.test(ua) || (
    typeof navigator !== 'undefined' &&
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1 &&
    Math.max(window.screen.width, window.screen.height) <= 1366 &&
    Math.min(window.screen.width, window.screen.height) >= 600
  );
  const isAndroidUa = /Android/i.test(ua);

  // Screen metrics in CSS logical points
  const screenLogicalMin = Math.min(window.screen.width, window.screen.height);
  const screenLogicalMax = Math.max(window.screen.width, window.screen.height);

  // Phone check by touch and screen dimensions:
  // Catches all iPhone models even if Safari / Chrome "Request Desktop Website" is enabled
  // (In desktop mode, Apple sends "Macintosh; Intel Mac OS X 10_15_7" & "MacIntel", but maxTouchPoints is 5 and screenLogicalMin <= 500)
  const isTouchPhoneByDimensions = Boolean(
    typeof navigator !== 'undefined' &&
    navigator.maxTouchPoints > 1 &&
    screenLogicalMin <= 500
  );

  const isIPhoneDevice = Boolean(
    isIPhoneUa ||
    isIPodUa ||
    (isTouchPhoneByDimensions && (
      rawGpuRenderer.toLowerCase().includes('apple') ||
      /Mac/i.test(navigator.platform || '') ||
      /Mac OS X/i.test(ua)
    ))
  );

  const isSmartphoneDevice = Boolean(
    isIPhoneDevice ||
    (isAndroidUa && !/Tablet/i.test(ua)) ||
    (/Mobile/i.test(ua) && !isIPadUa) ||
    isTouchPhoneByDimensions
  );

  let os: DeviceScanResult['os'] = 'Windows 11';
  if (isIPhoneDevice || isIPadUa) {
    os = 'iOS';
  } else if (isAndroidUa || (isSmartphoneDevice && !isIPhoneDevice)) {
    os = 'Android';
  } else if (/Macintosh/i.test(ua) && !isSmartphoneDevice && (typeof navigator === 'undefined' || navigator.maxTouchPoints <= 1)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 11';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows 10';
  }

  detectionDetails.push(`Sistema Operativo: ${os} ${isIPhoneDevice ? '(Apple iOS Mobile)' : ''}`);
  detectionDetails.push(`Hilos de CPU detectados: ${logicalThreads} núcleos`);

  // 6. Battery probe
  let hasBattery = false;
  let batteryInfo: DeviceScanResult['batteryInfo'] = undefined;

  try {
    if (typeof (navigator as any).getBattery === 'function') {
      const b = await (navigator as any).getBattery();
      if (b) {
        hasBattery = true;
        batteryInfo = {
          level: Math.round(b.level * 100),
          charging: b.charging
        };
        detectionDetails.push(`Batería detectada: ${batteryInfo.level}% (${b.charging ? 'cargando' : 'batería'})`);
      }
    }
  } catch {}

  // 7. Screen & Display Diagnostics (including iPhone & MacBook Screen Fingerprints)
  const pixelRatio = window.devicePixelRatio || 1;
  const screenWidth = Math.round(window.screen.width * pixelRatio);
  const screenHeight = Math.round(window.screen.height * pixelRatio);

  let displayHz = 60;
  try {
    displayHz = await measureDisplayRefreshRate();
  } catch {}

  let detectedResolution: ResolutionType = '1080p';
  let resolutionLabel = '1080p Full HD';
  let macModelName: string | undefined = undefined;
  let detectedIphoneModel: string | undefined = undefined;

  // Specific iPhone Identification by Screen Geometry & Refresh Rate:
  if (isIPhoneDevice || (os === 'iOS' && !isIPadUa)) {
    const ptW = screenLogicalMin;
    const ptH = screenLogicalMax;

    if (ptW === 440 && ptH === 956) {
      detectedIphoneModel = 'Apple iPhone 16 Pro Max';
    } else if (ptW === 402 && ptH === 874) {
      detectedIphoneModel = 'Apple iPhone 16 Pro';
    } else if (ptW === 430 && ptH === 932) {
      detectedIphoneModel = displayHz >= 110 ? 'Apple iPhone 15 Pro Max' : 'Apple iPhone 16 Plus';
    } else if (ptW === 393 && ptH === 852) {
      detectedIphoneModel = displayHz >= 110 ? 'Apple iPhone 16 Pro / 15 Pro' : 'Apple iPhone 16 / iPhone 15';
    } else if (ptW === 390 && ptH === 844) {
      detectedIphoneModel = displayHz >= 110 ? 'Apple iPhone 14 Pro / 13 Pro' : 'Apple iPhone 14 / iPhone 13';
    } else if (ptW === 428 && ptH === 926) {
      detectedIphoneModel = displayHz >= 110 ? 'Apple iPhone 13 Pro Max' : 'Apple iPhone 14 Plus / 12 Pro Max';
    } else if (ptW === 414 && ptH === 896) {
      detectedIphoneModel = pixelRatio === 3 ? 'Apple iPhone 11 Pro Max / XS Max' : 'Apple iPhone 11 / XR';
    } else if (ptW === 375 && ptH === 812) {
      detectedIphoneModel = 'Apple iPhone 11 Pro / iPhone X / XS / 13 mini';
    } else if (ptW === 375 && ptH === 667) {
      detectedIphoneModel = 'Apple iPhone SE (3ª Gen)';
    } else {
      detectedIphoneModel = 'Apple iPhone (Super Retina OLED)';
    }

    detectedResolution = '1440p';
    resolutionLabel = `${detectedIphoneModel} (${screenWidth}x${screenHeight} • ${pixelRatio}x DPR • ${displayHz}Hz)`;
  } else if (isIPadUa) {
    detectedResolution = '1440p';
    resolutionLabel = `Liquid Retina iPad (${screenWidth}x${screenHeight} • ${displayHz}Hz)`;
  } else if (os === 'macOS' && !isSmartphoneDevice) {
    macModelName = macHardwareModelFromDevices;
    if ((screenWidth === 3024 && screenHeight === 1964) || (screenWidth === 1964 && screenHeight === 3024) || (window.screen.width === 1512 && pixelRatio === 2)) {
      macModelName = 'MacBook Pro 14" (Liquid Retina XDR)';
      detectedResolution = '1440p';
      resolutionLabel = 'Liquid Retina XDR 14" (3024x1964 • 120Hz ProMotion)';
    } else if ((screenWidth === 3456 && screenHeight === 2234) || (screenWidth === 2234 && screenHeight === 3456) || (window.screen.width === 1728 && pixelRatio === 2)) {
      macModelName = 'MacBook Pro 16" (Liquid Retina XDR)';
      detectedResolution = '4k';
      resolutionLabel = 'Liquid Retina XDR 16" (3456x2234 • 120Hz ProMotion)';
    } else if ((screenWidth === 2560 && screenHeight === 1664) || (screenWidth === 1664 && screenHeight === 2560) || (window.screen.width === 1280 && window.screen.height === 832)) {
      macModelName = 'MacBook Air 13.6" (Liquid Retina)';
      detectedResolution = '1440p';
      resolutionLabel = 'Liquid Retina 13.6" (2560x1664)';
    } else if ((screenWidth === 2880 && screenHeight === 1864) || (screenWidth === 1864 && screenHeight === 2880) || (window.screen.width === 1440 && window.screen.height === 932)) {
      macModelName = 'MacBook Air 15.3" (Liquid Retina)';
      detectedResolution = '1440p';
      resolutionLabel = 'Liquid Retina 15.3" (2880x1864)';
    } else if ((screenWidth === 2560 && screenHeight === 1600) || (screenWidth === 1600 && screenHeight === 2560) || (window.screen.width === 1280 && window.screen.height === 800)) {
      macModelName = macModelName || 'MacBook Air / Pro 13.3" (Retina Display)';
      detectedResolution = '1440p';
      resolutionLabel = 'Retina Display 13.3" (2560x1600)';
    } else {
      macModelName = macModelName || (pixelRatio === 2 ? 'MacBook / Mac con Pantalla Retina' : 'Mac Desktop');
    }
  }

  const maxDim = Math.max(screenWidth, screenHeight);
  const minDim = Math.min(screenWidth, screenHeight);

  if (detectedResolution === '1080p') {
    if (maxDim >= 7000 || minDim >= 4000) {
      detectedResolution = '8k';
      resolutionLabel = '8K Ultra HD (7680x4320)';
    } else if (maxDim >= 4800 && minDim >= 1400) {
      detectedResolution = '5k_ultrawide';
      resolutionLabel = '5K Dual QHD Ultrawide (5120x1440)';
    } else if (maxDim >= 3400 && minDim >= 2000) {
      detectedResolution = '4k';
      resolutionLabel = '4K Ultra HD (3840x2160)';
    } else if (maxDim >= 3200 && minDim >= 1400) {
      detectedResolution = 'ultrawide';
      resolutionLabel = 'Ultrawide UWQHD (3440x1440)';
    } else if (maxDim >= 2400 || minDim >= 1350) {
      detectedResolution = '1440p';
      resolutionLabel = '1440p Quad HD (2560x1440)';
    } else {
      detectedResolution = '1080p';
      resolutionLabel = '1080p Full HD (1920x1080)';
    }
  }

  detectionDetails.push(`Pantalla: ${screenWidth}x${screenHeight} @ ${displayHz}Hz (${resolutionLabel})`);

  // 8. Device Type Determination
  const isMacBook = os === 'macOS' && !isSmartphoneDevice && (macModelName?.includes('MacBook') || hasBattery || pixelRatio === 2);

  let deviceType: DeviceScanResult['deviceType'] = 'desktop';
  let deviceTypeName = 'PC de Escritorio / Sobremesa';

  if (isSmartphoneDevice || isIPhoneDevice || os === 'iOS' || os === 'Android') {
    deviceType = 'smartphone';
    deviceTypeName = detectedIphoneModel || (os === 'iOS' ? 'Apple iPhone' : 'Smartphone / Teléfono Móvil');
    macModelName = undefined; // CRITICAL: Never assign "Mac Desktop" or "MacBook" to a smartphone!
  } else if (isMacBook) {
    deviceType = 'laptop';
    deviceTypeName = macModelName || 'MacBook Portátil';
  } else if (hasBattery || /laptop|mobile|max-q|iris/i.test(rawGpuRenderer)) {
    deviceType = 'laptop';
    deviceTypeName = 'Notebook / Computadora Portátil';
  } else {
    deviceType = 'desktop';
    deviceTypeName = macModelName || 'PC de Escritorio / Sobremesa';
  }

  detectionDetails.push(`Tipo de Dispositivo: ${deviceTypeName}`);

  // Memory estimation for macOS if Safari undefined
  if (!memoryEstimateGb) {
    if (os === 'macOS') {
      if (logicalThreads >= 16) memoryEstimateGb = 36;
      else if (logicalThreads >= 12) memoryEstimateGb = 18;
      else if (logicalThreads >= 10) memoryEstimateGb = 16;
      else memoryEstimateGb = 16;
    } else {
      memoryEstimateGb = 16;
    }
  }
  detectionDetails.push(`Memoria RAM Unificada / Sistema: ${memoryEstimateGb} GB`);

  // 9. Match Apple Silicon or PC GPU
  const combinedGpuString = `${webGpuAdapterName || ''} ${webGpuArchitecture || ''} ${rawGpuRenderer} ${macModelName || ''}`;
  const matchedGpu = matchGpu(combinedGpuString, gpus, deviceType === 'laptop', os, logicalThreads);
  detectionDetails.push(`GPU emparejada: ${matchedGpu.name} (${matchedGpu.vram}GB ${matchedGpu.vramType})`);

  // 10. Match CPU (Apple Silicon or Intel/AMD)
  const matchedCpu = matchCpu(logicalThreads, os, combinedGpuString, cpus, deviceType === 'laptop', macModelName);
  detectionDetails.push(`CPU emparejada: ${matchedCpu.name} (${matchedCpu.cores}C/${matchedCpu.threads}T, Socket ${matchedCpu.socket})`);

  // 11. Match Motherboard / Logic Board (Fixes motherboard not loading!)
  const matchedMotherboard = matchMotherboard(matchedCpu, motherboards, os, deviceType === 'laptop');
  detectionDetails.push(`Placa Base emparejada: ${matchedMotherboard.name} (${matchedMotherboard.socket})`);

  // 12. Match RAM (Fixes RAM loading for Mac and PC!)
  const matchedRam = matchRam(memoryEstimateGb, rams, deviceType === 'laptop', os, matchedCpu);
  detectionDetails.push(`RAM emparejada: ${matchedRam.capacityGb}GB ${matchedRam.type} (${matchedRam.name || 'Memoria Activa'})`);

  // 13. Match Storage through quota estimate (Fixes Storage loading!)
  const storageEstimateGb = await estimateClientStorageGb();
  const matchedStorage = matchStorage(storages, os, storageEstimateGb);
  detectionDetails.push(`Almacenamiento emparejado: ${matchedStorage.name || matchedStorage.type} ${matchedStorage.capacityGb}GB`);

  // 14. Match Power Supply
  const matchedPsu = matchPsu(matchedGpu, psus, deviceType === 'laptop', os);
  detectionDetails.push(`Alimentación: ${matchedPsu.name} (${matchedPsu.wattage}W)`);

  // 15. Smartphone SoC
  let matchedSoc: MobileSoC | undefined = undefined;
  let matchedPhoneModel: string | undefined = undefined;
  if (deviceType === 'smartphone') {
    const socMatch = matchMobileSoc(rawGpuRenderer, ua, socs, detectedIphoneModel, os);
    matchedSoc = socMatch.soc;
    matchedPhoneModel = socMatch.phoneModel || detectedIphoneModel || deviceTypeName;
    detectionDetails.push(`SoC Móvil detectado: ${matchedSoc.name} (${matchedSoc.manufacturer}, ${matchedSoc.processNodeNm}nm)`);
    detectionDetails.push(`Modelo de Smartphone: ${matchedPhoneModel}`);
  }

  // Calculate high accuracy score
  let confidenceScore = 85;
  if (os === 'macOS' && macModelName) confidenceScore = 96;
  if (permissionGranted) confidenceScore = Math.min(99, confidenceScore + 10);
  if (webGpuAdapterName) confidenceScore = Math.min(99, confidenceScore + 8);

  return {
    deviceType,
    deviceTypeName,
    os,
    macModelName,
    rawGpuRenderer,
    rawVendor,
    webGpuAdapterName,
    logicalThreads,
    memoryEstimateGb,
    storageEstimateGb,
    screenWidth,
    screenHeight,
    pixelRatio,
    displayHz,
    detectedResolution,
    resolutionLabel,
    hasBattery,
    batteryInfo,
    permissionGranted,
    enumeratedDevices,
    matchedCpu,
    matchedGpu,
    matchedMotherboard,
    matchedRam,
    matchedStorage,
    matchedPsu,
    matchedSoc,
    matchedPhoneModel,
    confidenceScore,
    detectionDetails
  };
}

/**
 * Intelligent Motherboard Matcher (MacBook Logic Board vs Laptop OEM vs Desktop Socket)
 */
function matchMotherboard(
  cpu: CPU,
  motherboards: Motherboard[],
  os: string,
  isLaptop: boolean
): Motherboard {
  const pool = motherboards && motherboards.length > 0 ? motherboards : INITIAL_MOTHERBOARDS;
  const isApple = os === 'macOS' || cpu.brand === 'Apple' || cpu.socket === 'Apple SoC';

  if (isApple) {
    const appleBoard =
      pool.find((m) => m.id === 'mb-apple-unified-board') ||
      pool.find((m) => m.socket === 'Apple SoC' || m.brand === 'Apple');
    if (appleBoard) return appleBoard;
  }

  if (isLaptop) {
    const laptopBoard =
      pool.find((m) => m.id === 'mb-laptop-integrated-oem') ||
      pool.find((m) => m.formFactor?.toLowerCase().includes('laptop') || m.brand === 'OEM Laptop');
    if (laptopBoard) return laptopBoard;
  }

  // Match desktop motherboard by cleaned socket (e.g. "am5", "lga1700", "lga1851", "am4")
  if (cpu.socket) {
    const cpuSock = cleanSocket(cpu.socket);
    const socketMatches = pool.filter((m) => cleanSocket(m.socket) === cpuSock);
    if (socketMatches.length > 0) {
      // Prioritize modern, popular Wi-Fi gaming boards
      const preferred = socketMatches.find(m => /wifi|gaming|tuf|tomahawk|aorus|rog|strix/i.test(m.name));
      if (preferred) return preferred;
      return socketMatches[0];
    }
  }

  // Fallback by CPU brand if socket didn't directly match
  if (cpu.brand === 'AMD') {
    const am5 = pool.find(m => cleanSocket(m.socket) === 'am5');
    if (am5) return am5;
  } else if (cpu.brand === 'Intel') {
    const lga1700 = pool.find(m => cleanSocket(m.socket) === 'lga1700');
    if (lga1700) return lga1700;
  }

  return pool[0] || INITIAL_MOTHERBOARDS[0];
}

/**
 * Enhanced GPU matcher with Apple Silicon, WebGPU, and NVIDIA/AMD/Intel detection.
 */
function matchGpu(
  rendererStr: string,
  gpus: GPU[],
  isLaptop: boolean,
  os: string,
  threads: number
): GPU {
  const clean = rendererStr.toLowerCase();
  const isApple = os === 'macOS' || clean.includes('apple') || clean.includes('metal') || clean.includes('macbook');

  if (isApple) {
    if (clean.includes('m4 max') || (clean.includes('m4') && threads >= 16)) {
      return gpus.find((g) => g.id === 'gpu-apple-m4-max') || gpus.find((g) => g.name.includes('M4 Max')) || gpus[0];
    }
    if (clean.includes('m4 pro') || (clean.includes('m4') && threads >= 14)) {
      return gpus.find((g) => g.id === 'gpu-apple-m4-pro') || gpus.find((g) => g.name.includes('M4 Pro')) || gpus[0];
    }
    if (clean.includes('m4')) {
      return gpus.find((g) => g.id === 'gpu-apple-m4') || gpus.find((g) => g.name.includes('M4')) || gpus[0];
    }
    if (clean.includes('m3 max') || (clean.includes('m3') && threads >= 16)) {
      return gpus.find((g) => g.id === 'gpu-apple-m3-max') || gpus.find((g) => g.name.includes('M3 Max')) || gpus[0];
    }
    if (clean.includes('m3 pro') || (clean.includes('m3') && threads >= 12)) {
      return gpus.find((g) => g.id === 'gpu-apple-m3-pro') || gpus.find((g) => g.name.includes('M3 Pro')) || gpus[0];
    }
    if (clean.includes('m3')) {
      return gpus.find((g) => g.id === 'gpu-apple-m3') || gpus.find((g) => g.name.includes('M3')) || gpus[0];
    }
    if (clean.includes('m2 max') || (clean.includes('m2') && clean.includes('max'))) {
      return gpus.find((g) => g.id === 'gpu-apple-m2-max') || gpus.find((g) => g.name.includes('M2 Max')) || gpus[0];
    }
    if (clean.includes('m2 pro') || (clean.includes('m2') && threads >= 12)) {
      return gpus.find((g) => g.id === 'gpu-apple-m2-pro') || gpus.find((g) => g.name.includes('M2 Pro')) || gpus[0];
    }
    if (clean.includes('m2')) {
      return gpus.find((g) => g.id === 'gpu-apple-m2') || gpus.find((g) => g.name.includes('M2')) || gpus[0];
    }
    if (clean.includes('m1 max')) {
      return gpus.find((g) => g.id === 'gpu-apple-m1-max') || gpus.find((g) => g.name.includes('M1 Max')) || gpus[0];
    }
    if (clean.includes('m1 pro')) {
      return gpus.find((g) => g.id === 'gpu-apple-m1-pro') || gpus.find((g) => g.name.includes('M1 Pro')) || gpus[0];
    }
    if (clean.includes('m1')) {
      return gpus.find((g) => g.id === 'gpu-apple-m1') || gpus.find((g) => g.name.includes('M1')) || gpus[0];
    }

    if (threads >= 16) return gpus.find((g) => g.id === 'gpu-apple-m3-max') || gpus[0];
    if (threads >= 12) return gpus.find((g) => g.id === 'gpu-apple-m3-pro') || gpus.find((g) => g.id === 'gpu-apple-m2-pro') || gpus[0];
    if (threads >= 10) return gpus.find((g) => g.id === 'gpu-apple-m4') || gpus.find((g) => g.id === 'gpu-apple-m1-pro') || gpus[0];
    return gpus.find((g) => g.id === 'gpu-apple-m3') || gpus.find((g) => g.id === 'gpu-apple-m2') || gpus[0];
  }

  const candidates = isLaptop
    ? gpus.filter((g) => g.isLaptop || g.platform === 'laptop')
    : gpus.filter((g) => !g.isLaptop && g.platform !== 'laptop');

  const pool = candidates.length > 0 ? candidates : gpus;

  const rtxMatch = clean.match(/(?:rtx|gtx)\s*([0-9]{3,4}(?:\s*(?:ti|super))?)/i);
  const rxMatch = clean.match(/rx\s*([0-9]{3,4}(?:\s*(?:xtx|xt|gre))?)/i);
  const arcMatch = clean.match(/arc\s*(a[0-9]{3}|b[0-9]{3})/i);

  if (rtxMatch) {
    const rawMatch = rtxMatch[1].toLowerCase();
    const hasTi = rawMatch.includes('ti');
    const hasSuper = rawMatch.includes('super');
    const modelNum = rawMatch.replace(/\s+/g, '');

    // Prioritize non-Ti/non-Super if not in detection string
    if (!hasTi && !hasSuper) {
      const exactNonTi = pool.find((g) => {
        const cleanName = g.name.toLowerCase().replace(/\s+/g, '');
        return cleanName.includes(modelNum) && !cleanName.includes('ti') && !cleanName.includes('super');
      });
      if (exactNonTi) return exactNonTi;
    }

    const found = pool.find((g) => g.name.toLowerCase().replace(/\s+/g, '').includes(modelNum));
    if (found) return found;
  }

  if (rxMatch) {
    const rawMatch = rxMatch[1].toLowerCase();
    const hasXt = rawMatch.includes('xt');
    const modelNum = rawMatch.replace(/\s+/g, '');

    if (!hasXt) {
      const exactNonXt = pool.find((g) => {
        const cleanName = g.name.toLowerCase().replace(/\s+/g, '');
        return cleanName.includes(modelNum) && !cleanName.includes('xt') && !cleanName.includes('gre');
      });
      if (exactNonXt) return exactNonXt;
    }

    const found = pool.find((g) => g.name.toLowerCase().replace(/\s+/g, '').includes(modelNum));
    if (found) return found;
  }

  if (arcMatch) {
    const modelNum = arcMatch[1].toLowerCase();
    const found = pool.find((g) => g.name.toLowerCase().includes(modelNum));
    if (found) return found;
  }

  const tokens = clean.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((t) => t.length >= 3);
  for (const token of tokens) {
    if (['nvidia', 'amd', 'intel', 'direct3d', 'angle', 'vs', 'ps', 'inc', 'corporation', 'graphics'].includes(token)) {
      continue;
    }
    const found = pool.find((g) => g.name.toLowerCase().includes(token));
    if (found) return found;
  }

  if (isLaptop) {
    return pool.find((g) => g.id === 'gpu-lap-4080') || pool.find((g) => g.name.includes('4070')) || pool[0];
  }
  return pool.find((g) => g.id === 'gpu-5070ti') || pool.find((g) => g.name.includes('4070')) || pool[0];
}

/**
 * Returns candidate CPUs matching a given logical thread count from browser concurrency
 */
export function getCandidateCpusForThreads(threads: number, cpus: CPU[], isLaptop = false): CPU[] {
  const pool = isLaptop
    ? cpus.filter((c) => c.isLaptop || c.platform === 'laptop')
    : cpus.filter((c) => !c.isLaptop && c.platform !== 'laptop');

  const activePool = pool.length > 0 ? pool : cpus;

  // Exact thread count matches
  const exact = activePool.filter((c) => c.threads === threads);
  if (exact.length >= 2) {
    return exact.sort((a, b) => b.gamingScore - a.gamingScore).slice(0, 8);
  }

  // Close matches (within 2-4 threads)
  const close = activePool.filter((c) => Math.abs(c.threads - threads) <= 4);
  return close.sort((a, b) => b.gamingScore - a.gamingScore).slice(0, 8);
}

/**
 * Enhanced CPU matcher with Apple Silicon CPU line.
 */
function matchCpu(
  threads: number,
  os: string,
  renderer: string,
  cpus: CPU[],
  isLaptop: boolean,
  macModelName?: string
): CPU {
  const clean = (renderer + ' ' + (macModelName || '')).toLowerCase();
  const isApple = os === 'macOS' || clean.includes('apple') || clean.includes('macbook');

  if (isApple) {
    if (clean.includes('m4 max') || (clean.includes('m4') && threads >= 16)) {
      return cpus.find((c) => c.id === 'cpu-apple-m4-max') || cpus[0];
    }
    if (clean.includes('m4 pro') || (clean.includes('m4') && threads >= 14)) {
      return cpus.find((c) => c.id === 'cpu-apple-m4-pro') || cpus[0];
    }
    if (clean.includes('m4')) {
      return cpus.find((c) => c.id === 'cpu-apple-m4') || cpus[0];
    }
    if (clean.includes('m3 max') || (clean.includes('m3') && threads >= 16)) {
      return cpus.find((c) => c.id === 'cpu-apple-m3-max') || cpus[0];
    }
    if (clean.includes('m3 pro') || (clean.includes('m3') && threads >= 12)) {
      return cpus.find((c) => c.id === 'cpu-apple-m3-pro') || cpus[0];
    }
    if (clean.includes('m3')) {
      return cpus.find((c) => c.id === 'cpu-apple-m3') || cpus[0];
    }
    if (clean.includes('m2 max')) {
      return cpus.find((c) => c.id === 'cpu-apple-m2-max') || cpus[0];
    }
    if (clean.includes('m2 pro') || (clean.includes('m2') && threads >= 12)) {
      return cpus.find((c) => c.id === 'cpu-apple-m2-pro') || cpus[0];
    }
    if (clean.includes('m2')) {
      return cpus.find((c) => c.id === 'cpu-apple-m2') || cpus[0];
    }
    if (clean.includes('m1 max')) {
      return cpus.find((c) => c.id === 'cpu-apple-m1-max') || cpus[0];
    }
    if (clean.includes('m1 pro')) {
      return cpus.find((c) => c.id === 'cpu-apple-m1-pro') || cpus[0];
    }
    if (clean.includes('m1')) {
      return cpus.find((c) => c.id === 'cpu-apple-m1') || cpus[0];
    }

    if (threads >= 16) return cpus.find((c) => c.id === 'cpu-apple-m3-max') || cpus[0];
    if (threads >= 12) return cpus.find((c) => c.id === 'cpu-apple-m3-pro') || cpus.find((c) => c.id === 'cpu-apple-m2-pro') || cpus[0];
    if (threads >= 10) return cpus.find((c) => c.id === 'cpu-apple-m4') || cpus.find((c) => c.id === 'cpu-apple-m1-pro') || cpus[0];
    return cpus.find((c) => c.id === 'cpu-apple-m3') || cpus.find((c) => c.id === 'cpu-apple-m2') || cpus[0];
  }

  const candidates = isLaptop
    ? cpus.filter((c) => c.isLaptop || c.platform === 'laptop')
    : cpus.filter((c) => !c.isLaptop && c.platform !== 'laptop');

  const pool = candidates.length > 0 ? candidates : cpus;

  const threadMatches = pool.filter((c) => Math.abs(c.threads - threads) <= 2);
  if (threadMatches.length > 0) {
    threadMatches.sort((a, b) => b.gamingScore - a.gamingScore);
    return threadMatches[0];
  }

  if (isLaptop) {
    return pool.find((c) => c.id === 'cpu-lap-r9-ai-hx370') || pool[0];
  }
  return pool.find((c) => c.id === 'cpu-7800x3d') || pool.find((c) => c.name.includes('7800X3D')) || pool[0];
}

/**
 * Match RAM with Apple Unified Memory and SO-DIMMs support
 */
function matchRam(gb: number, rams: RAM[], isLaptop: boolean, os?: string, cpu?: CPU): RAM {
  const pool = rams && rams.length > 0 ? rams : INITIAL_RAMS;
  const isApple = os === 'macOS' || cpu?.brand === 'Apple' || cpu?.socket === 'Apple SoC';

  if (isApple) {
    const targetCap = gb >= 96 ? 128 : gb >= 50 ? 64 : gb >= 40 ? 48 : gb >= 30 ? 36 : gb >= 20 ? 24 : gb >= 17 ? 18 : gb >= 12 ? 16 : 8;
    const appleRam =
      pool.find((r) => r.brand === 'Apple' && r.capacityGb === targetCap) ||
      pool.find((r) => r.id.includes('ram-apple') && r.capacityGb === targetCap) ||
      pool.find((r) => r.brand === 'Apple');
    if (appleRam) return appleRam;
  }

  // Adjust for Chrome privacy clamping (navigator.deviceMemory is capped at 8)
  let effectiveGb = gb;
  const isDdr5Platform = cpu && (
    cleanSocket(cpu.socket) === 'am5' ||
    cleanSocket(cpu.socket) === 'lga1851' ||
    (cpu.name && /7800x3d|7900x|7950x|9800x3d|9900x|9950x|13700|13900|14700|14900|265k|285k/i.test(cpu.name))
  );

  // If browser reports 8 or less, but user has a modern 12+ thread desktop CPU:
  if (effectiveGb <= 8 && cpu && cpu.threads >= 12) {
    effectiveGb = 32;
  } else if (effectiveGb <= 8 && cpu && cpu.threads >= 8) {
    effectiveGb = 16;
  }

  const targetGb = effectiveGb >= 48 ? 64 : effectiveGb >= 24 ? 32 : effectiveGb >= 12 ? 16 : 8;

  if (isLaptop) {
    const lapRam =
      pool.find((r) => r.capacityGb === targetGb && r.name.toLowerCase().includes('so-dimm')) ||
      pool.find((r) => r.capacityGb === targetGb && r.name.toLowerCase().includes('laptop'));
    if (lapRam) return lapRam;
  }

  // On DDR5 desktop platforms:
  if (isDdr5Platform) {
    const ddr5 =
      pool.find((r) => r.capacityGb === targetGb && (r.type === 'DDR5' || r.name.includes('DDR5')) && r.channels === 'dual') ||
      pool.find((r) => r.capacityGb === targetGb && (r.type === 'DDR5' || r.name.includes('DDR5')));
    if (ddr5) return ddr5;
  }

  const match = pool.find((r) => r.capacityGb === targetGb && r.channels === 'dual');
  if (match) return match;
  return pool.find((r) => r.capacityGb === targetGb) || pool[0] || INITIAL_RAMS[0];
}

/**
 * Match Storage with Apple Fabric APFS SSD and Gen4 NVMe support
 */
function matchStorage(storages: Storage[], os?: string, estimatedGb = 1000): Storage {
  const pool = storages && storages.length > 0 ? storages : INITIAL_STORAGES;
  const isApple = os === 'macOS';

  if (isApple) {
    const targetCap = estimatedGb >= 1500 ? 2000 : estimatedGb >= 800 ? 1000 : estimatedGb >= 400 ? 512 : 256;
    const appleStorage =
      pool.find((s) => s.brand === 'Apple' && s.capacityGb === targetCap) ||
      pool.find((s) => s.id.includes('stor-apple') && s.capacityGb === targetCap) ||
      pool.find((s) => s.brand === 'Apple');
    if (appleStorage) return appleStorage;
  }

  const targetCap = estimatedGb >= 1500 ? 2000 : estimatedGb >= 400 ? 1000 : 512;
  return (
    pool.find((s) => s.type === 'NVMe Gen4' && s.capacityGb === targetCap && /samsung|990|980|sn850|crucial|t500|kc3000|kingston/i.test(s.name || s.brand || '')) ||
    pool.find((s) => s.type === 'NVMe Gen4' && s.capacityGb === targetCap) ||
    pool.find((s) => s.type === 'NVMe Gen4') ||
    pool[0] ||
    INITIAL_STORAGES[0]
  );
}

/**
 * Match PSU
 */
function matchPsu(gpu: GPU, psus: PSU[], isLaptop: boolean, os?: string): PSU {
  const pool = psus && psus.length > 0 ? psus : INITIAL_PSUS;
  if (isLaptop || os === 'macOS') {
    return (
      pool.find((p) => p.brand === 'Laptop Original') ||
      pool.find((p) => p.id === 'psu-lap-280w-slim') ||
      pool[0] ||
      INITIAL_PSUS[0]
    );
  }
  const targetWatts = gpu.recommendedPsu || 750;
  return (
    pool.find((p) => p.brand !== 'Laptop Original' && p.wattage >= targetWatts && p.efficiency.includes('Gold')) ||
    pool.find((p) => p.wattage >= targetWatts) ||
    pool[0] ||
    INITIAL_PSUS[0]
  );
}

/**
 * Match Mobile SoC (Snapdragon, Apple A-Series, Dimensity, Tensor, Exynos)
 */
function matchMobileSoc(
  renderer: string,
  ua: string,
  socs: MobileSoC[],
  detectedPhoneModel?: string,
  os?: string
): { soc: MobileSoC; phoneModel?: string } {
  const clean = (renderer + ' ' + ua + ' ' + (detectedPhoneModel || '')).toLowerCase();

  let phoneModel: string | undefined = detectedPhoneModel;
  if (/SM-S928|Galaxy S24 Ultra/i.test(ua)) phoneModel = 'Samsung Galaxy S24 Ultra';
  else if (/SM-S918|Galaxy S23 Ultra/i.test(ua)) phoneModel = 'Samsung Galaxy S23 Ultra';
  else if (/Pixel 9/i.test(ua)) phoneModel = 'Google Pixel 9 Pro';
  else if (/Pixel 8/i.test(ua)) phoneModel = 'Google Pixel 8 Pro';
  else if (/iPhone16/i.test(ua)) phoneModel = 'Apple iPhone 16 Pro Max';
  else if (/iPhone15/i.test(ua)) phoneModel = 'Apple iPhone 15 Pro';
  else if (/Poco X6 Pro/i.test(ua)) phoneModel = 'Xiaomi Poco X6 Pro';

  // 1. Apple iPhone SoC matching by detected model or user agent
  if (detectedPhoneModel?.includes('iPhone') || os === 'iOS' || clean.includes('apple') || clean.includes('iphone')) {
    if (detectedPhoneModel?.includes('16 Pro') || clean.includes('16 pro') || clean.includes('a18 pro')) {
      const s = socs.find(item => item.id === 'soc-a18pro' || item.name.includes('A18 Pro'));
      if (s) return { soc: s, phoneModel: phoneModel || 'Apple iPhone 16 Pro' };
    }
    if (detectedPhoneModel?.includes('16') || clean.includes('16 plus') || clean.includes('a18')) {
      const s = socs.find(item => item.id === 'soc-a18' || item.name.includes('A18'));
      if (s) return { soc: s, phoneModel: phoneModel || 'Apple iPhone 16' };
    }
    if (detectedPhoneModel?.includes('15 Pro') || clean.includes('15 pro') || clean.includes('a17')) {
      const s = socs.find(item => item.id === 'soc-a17pro' || item.name.includes('A17 Pro') || item.name.includes('A17'));
      if (s) return { soc: s, phoneModel: phoneModel || 'Apple iPhone 15 Pro' };
    }
    if (detectedPhoneModel?.includes('15') || detectedPhoneModel?.includes('14 Pro') || clean.includes('a16')) {
      const s = socs.find(item => item.id === 'soc-a16' || item.name.includes('A16'));
      if (s) return { soc: s, phoneModel: phoneModel || 'Apple iPhone 15' };
    }
    if (detectedPhoneModel?.includes('14') || detectedPhoneModel?.includes('13') || clean.includes('a15')) {
      const s = socs.find(item => item.id === 'soc-a15' || item.name.includes('A15'));
      if (s) return { soc: s, phoneModel: phoneModel || 'Apple iPhone 14' };
    }
    if (detectedPhoneModel?.includes('12') || clean.includes('a14')) {
      const s = socs.find(item => item.id === 'soc-a14' || item.name.includes('A14'));
      if (s) return { soc: s, phoneModel: phoneModel || 'Apple iPhone 12' };
    }
    // Apple fallback
    const appleSoc = socs.find(item => item.id === 'soc-a18pro') ||
                     socs.find(item => item.id === 'soc-a17pro') ||
                     socs.find(item => item.manufacturer === 'Apple') ||
                     socs[0];
    return { soc: appleSoc, phoneModel: phoneModel || 'Apple iPhone' };
  }

  // 2. Android Snapdragon / Dimensity / Tensor / Exynos
  if (clean.includes('830') || clean.includes('elite')) {
    const s = socs.find((item) => item.id === 'soc-8elite' || item.name.includes('8 Elite'));
    if (s) return { soc: s, phoneModel };
  }

  if (clean.includes('750') || clean.includes('8 gen 3')) {
    const s = socs.find((item) => item.id === 'soc-8gen3' || item.name.includes('8 Gen 3'));
    if (s) return { soc: s, phoneModel };
  }

  if (clean.includes('9400') || clean.includes('9300') || clean.includes('g720')) {
    const s = socs.find((item) => item.id === 'soc-dimensity9300' || item.name.includes('9300'));
    if (s) return { soc: s, phoneModel };
  }

  if (clean.includes('tensor') || clean.includes('pixel')) {
    const s = socs.find((item) => item.id === 'soc-tensor-g4' || item.name.includes('Tensor'));
    if (s) return { soc: s, phoneModel };
  }

  if (clean.includes('exynos') || clean.includes('xclipse')) {
    const s = socs.find((item) => item.id === 'soc-exynos2400' || item.name.includes('Exynos'));
    if (s) return { soc: s, phoneModel };
  }

  return { soc: socs[0], phoneModel };
}

/**
 * Universal text parser supporting macOS system_profiler AND Windows PowerShell / DxDiag
 */
export function parseSystemInfoText(
  rawText: string,
  cpus: CPU[],
  gpus: GPU[],
  motherboards: Motherboard[],
  rams: RAM[],
  storages: Storage[]
): {
  detectedCpuName?: string;
  detectedGpuName?: string;
  detectedRamGb?: number;
  detectedMacModel?: string;
  detectedMotherboardName?: string;
  detectedStorageName?: string;
  matchedCpu?: CPU;
  matchedGpu?: GPU;
  matchedMotherboard?: Motherboard;
  matchedRam?: RAM;
  matchedStorage?: Storage;
} {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let cpuName: string | undefined = undefined;
  let gpuName: string | undefined = undefined;
  let ramGb: number | undefined = undefined;
  let macModel: string | undefined = undefined;
  let mbName: string | undefined = undefined;
  let storName: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // 1. macOS system_profiler
    if (lower.startsWith('model name:') || lower.startsWith('nombre del modelo:')) {
      macModel = line.split(':')[1]?.trim();
    }
    if (lower.startsWith('chip:') || lower.startsWith('chip name:')) {
      const chipVal = line.split(':')[1]?.trim();
      if (chipVal) {
        cpuName = chipVal;
        gpuName = chipVal + ' GPU';
      }
    }

    // 2. Labeled CPU
    if (!cpuName && (lower.startsWith('cpu:') || lower.startsWith('procesador:') || lower.startsWith('processor:'))) {
      cpuName = line.split(/:(.+)/)[1]?.trim();
    }

    // 3. Labeled GPU
    if (!gpuName && (lower.startsWith('gpu:') || lower.startsWith('tarjeta:') || lower.startsWith('card name:') || lower.startsWith('videocontroller:'))) {
      gpuName = line.split(/:(.+)/)[1]?.trim();
    }

    // 4. Labeled Motherboard
    if (!mbName && (lower.startsWith('placa:') || lower.startsWith('placa base:') || lower.startsWith('motherboard:') || lower.startsWith('baseboard:') || lower.startsWith('product:') || lower.startsWith('mainboard:') || lower.startsWith('system model:'))) {
      mbName = line.split(/:(.+)/)[1]?.trim();
    }

    // 5. Labeled RAM
    if (!ramGb && (lower.startsWith('ram:') || lower.startsWith('memoria:') || lower.startsWith('memory:'))) {
      const match = line.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:gb|mb)?/i);
      if (match) {
        let val = parseFloat(match[1]);
        if (lower.includes('mb') || val > 512) val = Math.round(val / 1024);
        ramGb = Math.round(val);
      }
    }

    // 6. Labeled Storage
    if (!storName && (lower.startsWith('disco:') || lower.startsWith('disk:') || lower.startsWith('drive:') || lower.startsWith('almacenamiento:') || lower.startsWith('ssd:') || lower.startsWith('nvme:') || lower.startsWith('media name:'))) {
      storName = line.split(/:(.+)/)[1]?.trim();
    }

    // 7. PowerShell / Command Table formatting (e.g. "Product \n ---- \n TUF GAMING B650")
    if (!mbName && (lower === 'product' || lower === 'baseboard') && lines[i + 1]?.startsWith('---') && lines[i + 2]) {
      mbName = lines[i + 2].trim();
    }
    if ((lower === 'name' || lower === 'name :') && lines[i + 1]?.startsWith('---') && lines[i + 2]) {
      const val = lines[i + 2].trim();
      if (/geforce|radeon|rtx|gtx|arc|intel graphics/i.test(val) && !gpuName) {
        gpuName = val;
      } else if (/ryzen|intel|core|i[3579]|threadripper|xeon|athlon/i.test(val) && !cpuName) {
        cpuName = val;
      }
    }

    // 8. Isolated RAM number (e.g. 32 or 16 from Measure-Object Sum/1GB)
    if (!ramGb && /^[0-9]+(?:\.[0-9]+)?$/.test(line)) {
      const val = parseFloat(line);
      if (val >= 4 && val <= 256) {
        ramGb = Math.round(val);
      }
    }
  }

  const poolCpus = cpus && cpus.length > 0 ? cpus : INITIAL_CPUS;
  const poolGpus = gpus && gpus.length > 0 ? gpus : INITIAL_GPUS;
  const poolMbs = motherboards && motherboards.length > 0 ? motherboards : INITIAL_MOTHERBOARDS;
  const poolRams = rams && rams.length > 0 ? rams : INITIAL_RAMS;
  const poolStorages = storages && storages.length > 0 ? storages : INITIAL_STORAGES;

  let matchedCpu: CPU | undefined = undefined;
  if (cpuName) {
    const cleanCpu = cpuName.toLowerCase().replace(/processor|cpu|nucleos|cores/g, '').trim();
    matchedCpu =
      poolCpus.find((c) => c.name.toLowerCase().includes(cleanCpu)) ||
      poolCpus.find((c) => cleanCpu.includes(c.name.toLowerCase()));
  }
  if (!matchedCpu && macModel) {
    matchedCpu = poolCpus.find((c) => c.brand === 'Apple') || poolCpus[0];
  } else if (!matchedCpu) {
    matchedCpu = poolCpus.find((c) => c.id === 'cpu-7800x3d') || poolCpus[0];
  }

  let matchedGpu: GPU | undefined = undefined;
  if (gpuName) {
    const cleanGpu = gpuName.toLowerCase().replace(/tarjeta|gráfica|graphics/g, '').trim();
    matchedGpu =
      poolGpus.find((g) => g.name.toLowerCase().includes(cleanGpu)) ||
      poolGpus.find((g) => cleanGpu.includes(g.name.toLowerCase()));
  }
  if (!matchedGpu) {
    matchedGpu = poolGpus.find((g) => g.id === 'gpu-5070ti') || poolGpus[0];
  }

  let matchedMotherboard: Motherboard | undefined = undefined;
  if (macModel) {
    matchedMotherboard = poolMbs.find((m) => m.id === 'mb-apple-unified-board') || poolMbs[0];
  } else if (mbName) {
    const cleanMb = mbName.toLowerCase().trim();
    matchedMotherboard =
      poolMbs.find((m) => m.name.toLowerCase().includes(cleanMb)) ||
      poolMbs.find((m) => cleanMb.includes(m.name.toLowerCase()));
  }
  if (!matchedMotherboard && matchedCpu) {
    matchedMotherboard = matchMotherboard(matchedCpu, poolMbs, macModel ? 'macOS' : 'Windows 11', Boolean(macModel?.includes('MacBook')));
  }
  if (!matchedMotherboard) {
    matchedMotherboard = poolMbs[0];
  }

  let matchedRam: RAM | undefined = undefined;
  if (ramGb) {
    matchedRam = matchRam(ramGb, poolRams, Boolean(macModel?.includes('MacBook')), macModel ? 'macOS' : 'Windows 11', matchedCpu);
  } else {
    matchedRam = matchRam(32, poolRams, false, 'Windows 11', matchedCpu);
  }

  let matchedStorage: Storage | undefined = undefined;
  if (macModel) {
    matchedStorage = poolStorages.find((s) => s.id === 'stor-apple-nvme-1tb') || poolStorages[0];
  } else if (storName) {
    const cleanStor = storName.toLowerCase().trim();
    matchedStorage =
      poolStorages.find((s) => s.name?.toLowerCase().includes(cleanStor)) ||
      poolStorages.find((s) => cleanStor.includes(s.name?.toLowerCase() || ''));
  }
  if (!matchedStorage) {
    matchedStorage = matchStorage(poolStorages, 'Windows 11', 1000);
  }

  return {
    detectedCpuName: cpuName,
    detectedGpuName: gpuName,
    detectedRamGb: ramGb,
    detectedMacModel: macModel,
    detectedMotherboardName: mbName,
    detectedStorageName: storName,
    matchedCpu,
    matchedGpu,
    matchedMotherboard,
    matchedRam,
    matchedStorage
  };
}
