const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_URL = 'https://github.com/buildcores/buildcores-open-db.git';
const CLONE_DIR = '/tmp/buildcores-db';
const OUTPUT_DIR = path.resolve(__dirname, '../server/data/buildcores');

console.log('[BuildCores] Iniciando sincronización de componentes desde:', REPO_URL);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. Prepare repository (use existing /tmp/buildcores-test or clone)
let sourceDir = '/tmp/buildcores-test/open-db';
if (!fs.existsSync(sourceDir)) {
  sourceDir = path.join(CLONE_DIR, 'open-db');
  if (!fs.existsSync(CLONE_DIR)) {
    console.log('[BuildCores] Clonando repositorio con sparse-checkout...');
    execSync(`git clone --depth 1 --filter=blob:none --sparse ${REPO_URL} ${CLONE_DIR}`, { stdio: 'inherit' });
    execSync(`cd ${CLONE_DIR} && git sparse-checkout set open-db/CPU open-db/GPU open-db/Motherboard open-db/PSU open-db/RAM open-db/Storage open-db/CPUCooler`, { stdio: 'inherit' });
  }
}

console.log('[BuildCores] Leyendo datos desde:', sourceDir);

// Helpers
function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

// --- 1. PARSE CPUS ---
console.log('[BuildCores] Procesando procesadores (CPUs)...');
const cpuFiles = fs.readdirSync(path.join(sourceDir, 'CPU')).filter(f => f.endsWith('.json'));
const cpus = [];

for (const file of cpuFiles) {
  const raw = safeReadJson(path.join(sourceDir, 'CPU', file));
  if (!raw || !raw.metadata?.name) continue;

  const name = raw.metadata.name;
  const mfr = (raw.metadata.manufacturer || '').toLowerCase();
  const brand = mfr.includes('amd') ? 'AMD' : mfr.includes('intel') ? 'Intel' : mfr.includes('apple') ? 'Apple' : 'Other';

  const cores = Number(raw.cores?.total || raw.cores?.performance) || 6;
  const threads = Number(raw.cores?.threads) || (cores * 2);
  const baseClock = Number(raw.clocks?.performance?.base) || 3.0;
  const boostClock = Number(raw.clocks?.performance?.boost) || baseClock || 3.6;
  const tdp = Number(raw.specifications?.tdp) || 65;
  const releaseYear = Number(raw.metadata.releaseYear) || (name.includes('9800X3D') || name.includes('9900X') ? 2024 : 2022);
  
  // Smart scoring
  let gamingScore = Math.min(100, Math.max(25, Math.round((boostClock / 5.7) * 55 + (cores >= 8 ? 25 : cores * 3) + (releaseYear >= 2024 ? 18 : releaseYear >= 2022 ? 14 : releaseYear >= 2020 ? 8 : 0))));
  if (name.includes('X3D')) gamingScore = Math.min(100, gamingScore + 10);
  const multicoreScore = Math.min(100, Math.max(20, Math.round((cores * 3.2) + (boostClock * 5))));
  const singlecoreScore = Math.min(100, Math.max(20, Math.round((boostClock / 6.0) * 80 + (releaseYear >= 2023 ? 15 : 8))));

  cpus.push({
    id: 'bc-cpu-' + raw.opendb_id,
    name,
    brand,
    socket: raw.socket || 'N/A',
    cores,
    threads,
    baseClock,
    boostClock,
    tdp,
    gamingScore,
    multicoreScore,
    singlecoreScore,
    releaseYear,
    pcieGen: raw.specifications?.pciExpressVersion ? parseInt(raw.specifications.pciExpressVersion) : (releaseYear >= 2022 ? 5 : 4),
    sourceUrl: raw.general_product_information?.manufacturer_url
  });
}
console.log(`[BuildCores] Procesados ${cpus.length} CPUs`);

// --- 2. PARSE GPUS ---
console.log('[BuildCores] Procesando tarjetas gráficas (GPUs)...');
const gpuFiles = fs.readdirSync(path.join(sourceDir, 'GPU')).filter(f => f.endsWith('.json'));
const gpus = [];

for (const file of gpuFiles) {
  const raw = safeReadJson(path.join(sourceDir, 'GPU', file));
  if (!raw) continue;

  const name = raw.metadata?.name || raw.chipset;
  if (!name) continue;

  const mfr = (raw.chipset_manufacturer || raw.metadata?.manufacturer || '').toLowerCase();
  const brand = mfr.includes('amd') ? 'AMD' : mfr.includes('intel') ? 'Intel' : 'NVIDIA';
  const vram = Number(raw.memory) || 8;
  const vramType = raw.memory_type || 'GDDR6';
  let tdp = Number(raw.tdp) || 180;
  if (tdp <= 0) tdp = 120;
  const releaseYear = Number(raw.metadata?.releaseYear) || 2023;
  const chipset = raw.chipset || '';

  // Calculate scores
  let score1080p = 75;
  let score1440p = 65;
  let score4k = 50;
  let rt = 50;

  if (chipset.includes('5090') || name.includes('5090')) {
    score1080p = 100; score1440p = 100; score4k = 100; rt = 100;
  } else if (chipset.includes('5080') || name.includes('5080') || chipset.includes('4090') || name.includes('4090')) {
    score1080p = 99; score1440p = 98; score4k = 95; rt = 95;
  } else if (chipset.includes('5070') || chipset.includes('4080') || chipset.includes('7900 XTX') || chipset.includes('9070 XT')) {
    score1080p = 98; score1440p = 94; score4k = 88; rt = brand === 'NVIDIA' ? 90 : 72;
  } else if (chipset.includes('4070') || chipset.includes('7800 XT') || chipset.includes('3080') || chipset.includes('9070')) {
    score1080p = 94; score1440p = 86; score4k = 72; rt = brand === 'NVIDIA' ? 82 : 60;
  } else if (chipset.includes('4060') || chipset.includes('7600') || chipset.includes('3060') || chipset.includes('9060 XT')) {
    score1080p = 82; score1440p = 68; score4k = 48; rt = brand === 'NVIDIA' ? 68 : 45;
  } else {
    score1080p = Math.min(95, Math.max(30, Math.round((tdp / 300) * 50 + (vram / 16) * 35)));
    score1440p = Math.min(95, Math.max(20, Math.round(score1080p * 0.85)));
    score4k = Math.min(95, Math.max(10, Math.round(score1080p * 0.65)));
    rt = brand === 'NVIDIA' ? Math.round(score1440p * 0.9) : Math.round(score1440p * 0.65);
  }

  const recPsu = Number(raw.recommended_power_supply) || Math.max(500, Math.round((tdp * 2 + 150) / 50) * 50);

  gpus.push({
    id: 'bc-gpu-' + raw.opendb_id,
    name,
    brand,
    vram,
    vramType,
    tdp,
    recommendedPsu: recPsu,
    score1080p,
    score1440p,
    score4k,
    rayTracingScore: rt,
    releaseYear,
    dlssFsrSupport: brand === 'NVIDIA' ? 'DLSS 3.5 / 4.0' : brand === 'AMD' ? 'FSR 3.1' : 'XeSS 1.3',
    sourceUrl: raw.general_product_information?.manufacturer_url
  });
}
console.log(`[BuildCores] Procesados ${gpus.length} GPUs`);

// --- 3. PARSE MOTHERBOARDS ---
console.log('[BuildCores] Procesando placas base (Motherboards)...');
const mbFiles = fs.readdirSync(path.join(sourceDir, 'Motherboard')).filter(f => f.endsWith('.json'));
const motherboards = [];

for (const file of mbFiles) {
  const raw = safeReadJson(path.join(sourceDir, 'Motherboard', file));
  if (!raw || !raw.metadata?.name) continue;

  const name = raw.metadata.name;
  const brand = raw.metadata.manufacturer || 'Genérica';
  const socket = raw.socket || 'N/A';
  const chipset = raw.chipset || 'N/A';
  const formFactor = raw.form_factor || 'ATX';
  const mem = raw.memory || {};
  const memoryType = mem.memory_type || (name.includes('DDR5') ? 'DDR5' : name.includes('DDR4') ? 'DDR4' : 'DDR4');

  motherboards.push({
    id: 'bc-mb-' + raw.opendb_id,
    name,
    brand,
    socket,
    chipset,
    formFactor,
    memoryType,
    maxMemoryGb: Number(mem.max_capacity) || 128,
    memorySlots: Number(mem.slots) || 4,
    wifiSupport: raw.wireless_networking || (name.toLowerCase().includes('wifi') ? 'Wi-Fi 6E/7' : 'No')
  });
}
console.log(`[BuildCores] Procesadas ${motherboards.length} Placas Base`);

// --- 4. PARSE PSUS ---
console.log('[BuildCores] Procesando fuentes de poder (PSUs)...');
const psuFiles = fs.readdirSync(path.join(sourceDir, 'PSU')).filter(f => f.endsWith('.json'));
const psus = [];

for (const file of psuFiles) {
  const raw = safeReadJson(path.join(sourceDir, 'PSU', file));
  if (!raw || !raw.metadata?.name) continue;

  const name = raw.metadata.name;
  const brand = raw.metadata.manufacturer || 'Genérica';
  const wattage = Number(raw.wattage) || 650;
  const eff = raw.efficiency_rating || '80+ Bronze';
  const modular = raw.modular === 'Full' || raw.modular === 'Fully Modular' ? 'Totalmente Modular' :
                  raw.modular === 'Semi' || raw.modular === 'Semi-Modular' ? 'Semi-Modular' : 'No Modular';
  const atx3 = Boolean(raw.connectors?.pcie_12VHPWR > 0 || raw.connectors?.pcie_12V_2x6 > 0 || name.includes('ATX 3') || name.includes('PCIe 5'));

  psus.push({
    id: 'bc-psu-' + raw.opendb_id,
    name,
    brand,
    wattage,
    efficiency: eff,
    modular,
    atx3
  });
}
console.log(`[BuildCores] Procesadas ${psus.length} Fuentes de Poder`);

// --- 5. PARSE RAMS ---
console.log('[BuildCores] Procesando memorias RAM...');
const ramFiles = fs.readdirSync(path.join(sourceDir, 'RAM')).filter(f => f.endsWith('.json'));
const rams = [];

for (const file of ramFiles) {
  const raw = safeReadJson(path.join(sourceDir, 'RAM', file));
  if (!raw || !raw.metadata?.name) continue;

  const name = raw.metadata.name;
  const brand = raw.metadata.manufacturer || 'Genérica';
  const type = raw.ram_type === 'DDR5' ? 'DDR5' : raw.ram_type === 'DDR3' ? 'DDR3' : 'DDR4';
  const capacityGb = Number(raw.capacity) || 16;
  const speedMhz = Number(raw.speed) || (type === 'DDR5' ? 6000 : 3200);
  const casLatency = Number(raw.cas_latency) || (type === 'DDR5' ? 32 : 16);
  const channels = raw.modules && Array.isArray(raw.modules) && raw.modules[0] > 1 ? 'dual' : 'single';

  rams.push({
    id: 'bc-ram-' + raw.opendb_id,
    name,
    brand,
    type,
    capacityGb,
    speedMhz,
    channels,
    casLatency
  });
}
console.log(`[BuildCores] Procesadas ${rams.length} Memorias RAM`);

// --- 6. PARSE STORAGES ---
console.log('[BuildCores] Procesando unidades de almacenamiento...');
const storageFiles = fs.readdirSync(path.join(sourceDir, 'Storage')).filter(f => f.endsWith('.json'));
const storages = [];

for (const file of storageFiles) {
  const raw = safeReadJson(path.join(sourceDir, 'Storage', file));
  if (!raw || !raw.metadata?.name) continue;

  const name = raw.metadata.name;
  const cap = Number(raw.capacity) || 1000;
  const isNvme = Boolean(raw.nvme || raw.interface?.toLowerCase().includes('nvme') || raw.interface?.toLowerCase().includes('m.2'));
  let type = 'SATA SSD';
  let speed = 550;
  if (isNvme) {
    if (raw.interface?.includes('5.0')) {
      type = 'NVMe Gen5';
      speed = 10000;
    } else if (raw.interface?.includes('4.0')) {
      type = 'NVMe Gen4';
      speed = 7000;
    } else {
      type = 'NVMe Gen3';
      speed = 3500;
    }
  } else if (raw.storage_type?.toLowerCase().includes('hdd') || name.toLowerCase().includes('hdd')) {
    type = 'HDD';
    speed = 150;
  }

  storages.push({
    id: 'bc-storage-' + raw.opendb_id,
    name,
    type,
    capacityGb: cap,
    readSpeedMb: speed
  });
}
console.log(`[BuildCores] Procesadas ${storages.length} Unidades de Almacenamiento`);

// Write parsed files
fs.writeFileSync(path.join(OUTPUT_DIR, 'cpus.json'), JSON.stringify(cpus, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'gpus.json'), JSON.stringify(gpus, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'motherboards.json'), JSON.stringify(motherboards, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'psus.json'), JSON.stringify(psus, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'rams.json'), JSON.stringify(rams, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'storages.json'), JSON.stringify(storages, null, 2));

const metadata = {
  sourceRepo: 'https://github.com/buildcores/buildcores-open-db',
  license: 'Open Data Commons Attribution License (ODC-By) v1.0',
  synchronizedAt: new Date().toISOString(),
  counts: {
    cpus: cpus.length,
    gpus: gpus.length,
    motherboards: motherboards.length,
    psus: psus.length,
    rams: rams.length,
    storages: storages.length,
    total: cpus.length + gpus.length + motherboards.length + psus.length + rams.length + storages.length
  }
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
console.log('[BuildCores] ¡Sincronización completa con éxito!', metadata);
