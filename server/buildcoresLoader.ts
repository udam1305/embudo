import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { CPU, GPU, Motherboard, PSU, RAM, Storage, MobileSoC } from '../src/types';
import {
  INITIAL_CPUS,
  INITIAL_GPUS,
  INITIAL_MOTHERBOARDS,
  INITIAL_RAMS,
  INITIAL_STORAGES,
  INITIAL_PSUS,
  INITIAL_SOCS
} from '../src/data/initialData';

const DATA_DIR = path.resolve(process.cwd(), 'server/data/buildcores');

export interface BuildCoresMetadata {
  sourceRepo: string;
  license: string;
  synchronizedAt: string;
  counts: {
    cpus: number;
    gpus: number;
    motherboards: number;
    psus: number;
    rams: number;
    storages: number;
    total: number;
  };
}

let cachedMetadata: BuildCoresMetadata = {
  sourceRepo: 'https://github.com/buildcores/buildcores-open-db',
  license: 'Open Data Commons Attribution License (ODC-By) v1.0',
  synchronizedAt: new Date().toISOString(),
  counts: {
    cpus: 0,
    gpus: 0,
    motherboards: 0,
    psus: 0,
    rams: 0,
    storages: 0,
    total: 0
  }
};

let buildCoresCpus: CPU[] = [];
let buildCoresGpus: GPU[] = [];
let buildCoresMotherboards: Motherboard[] = [];
let buildCoresPsus: PSU[] = [];
let buildCoresRams: RAM[] = [];
let buildCoresStorages: Storage[] = [];
let isSyncing = false;

function loadJsonFile<T>(filename: string, fallback: T): T {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`[BuildCores] Error al leer ${filename}:`, e);
  }
  return fallback;
}

export function loadBuildCoresData() {
  console.log('[BuildCores] Cargando base de datos sincronizada desde:', DATA_DIR);

  cachedMetadata = loadJsonFile<BuildCoresMetadata>('metadata.json', cachedMetadata);
  const rawCpus = loadJsonFile<CPU[]>('cpus.json', []);
  const rawGpus = loadJsonFile<GPU[]>('gpus.json', []);
  const rawMbs = loadJsonFile<Motherboard[]>('motherboards.json', []);
  const rawPsus = loadJsonFile<PSU[]>('psus.json', []);
  const rawRams = loadJsonFile<RAM[]>('rams.json', []);
  const rawStorages = loadJsonFile<Storage[]>('storages.json', []);

  // Merge seed items at top for instant discovery of flagship items
  const cpuIds = new Set(INITIAL_CPUS.map(c => c.name.toLowerCase()));
  buildCoresCpus = [
    ...INITIAL_CPUS,
    ...rawCpus.filter(c => !cpuIds.has(c.name.toLowerCase()))
  ];

  const gpuIds = new Set(INITIAL_GPUS.map(g => g.name.toLowerCase()));
  buildCoresGpus = [
    ...INITIAL_GPUS,
    ...rawGpus.filter(g => !gpuIds.has(g.name.toLowerCase()))
  ];

  const mbIds = new Set(INITIAL_MOTHERBOARDS.map(m => m.name.toLowerCase()));
  buildCoresMotherboards = [
    ...INITIAL_MOTHERBOARDS,
    ...rawMbs.filter(m => !mbIds.has(m.name.toLowerCase()))
  ];

  const psuIds = new Set(INITIAL_PSUS.map(p => p.name.toLowerCase()));
  buildCoresPsus = [
    ...INITIAL_PSUS,
    ...rawPsus.filter(p => !psuIds.has(p.name.toLowerCase()))
  ];

  const ramIds = new Set(INITIAL_RAMS.map(r => r.name?.toLowerCase() || r.id));
  buildCoresRams = [
    ...INITIAL_RAMS,
    ...rawRams.filter(r => !ramIds.has(r.name?.toLowerCase() || r.id))
  ];

  const storageIds = new Set(INITIAL_STORAGES.map(s => s.id));
  buildCoresStorages = [
    ...INITIAL_STORAGES,
    ...rawStorages.filter(s => !storageIds.has(s.id))
  ];

  cachedMetadata.counts = {
    cpus: buildCoresCpus.length,
    gpus: buildCoresGpus.length,
    motherboards: buildCoresMotherboards.length,
    psus: buildCoresPsus.length,
    rams: buildCoresRams.length,
    storages: buildCoresStorages.length,
    total: buildCoresCpus.length + buildCoresGpus.length + buildCoresMotherboards.length + buildCoresPsus.length + buildCoresRams.length + buildCoresStorages.length
  };

  console.log(`[BuildCores] Base de datos activa con ${cachedMetadata.counts.total} componentes listos:`, cachedMetadata.counts);
}

// Initial load
loadBuildCoresData();

export function getBuildCoresStatus() {
  return {
    isSyncing,
    metadata: cachedMetadata,
    repository: 'https://github.com/buildcores/buildcores-open-db',
    lastSync: cachedMetadata.synchronizedAt
  };
}

export function getAllComponents() {
  return {
    cpus: buildCoresCpus,
    gpus: buildCoresGpus,
    motherboards: buildCoresMotherboards,
    psus: buildCoresPsus,
    rams: buildCoresRams,
    storages: buildCoresStorages,
    socs: INITIAL_SOCS,
    metadata: cachedMetadata
  };
}

export function searchComponents(category: string, query: string, limit = 50) {
  const q = (query || '').toLowerCase().trim();
  let list: any[] = [];

  switch (category.toLowerCase()) {
    case 'cpu':
    case 'cpus':
      list = buildCoresCpus;
      break;
    case 'gpu':
    case 'gpus':
      list = buildCoresGpus;
      break;
    case 'motherboard':
    case 'motherboards':
    case 'placas':
      list = buildCoresMotherboards;
      break;
    case 'psu':
    case 'psus':
    case 'fuentes':
      list = buildCoresPsus;
      break;
    case 'ram':
    case 'rams':
    case 'memorias':
      list = buildCoresRams;
      break;
    case 'storage':
    case 'storages':
    case 'almacenamiento':
      list = buildCoresStorages;
      break;
    default:
      list = [];
  }

  if (!q) {
    return list.slice(0, limit);
  }

  return list.filter(item => {
    const name = (item.name || '').toLowerCase();
    const brand = (item.brand || '').toLowerCase();
    const socket = (item.socket || '').toLowerCase();
    const chipset = (item.chipset || '').toLowerCase();
    return name.includes(q) || brand.includes(q) || socket.includes(q) || chipset.includes(q);
  }).slice(0, limit);
}

export async function triggerBuildCoresSync(): Promise<{ success: boolean; message: string; metadata?: BuildCoresMetadata }> {
  if (isSyncing) {
    return { success: false, message: 'La sincronización con BuildCores ya está en curso' };
  }

  isSyncing = true;
  return new Promise((resolve) => {
    console.log('[BuildCores] Ejecutando sincronización en segundo plano...');
    exec('node scripts/sync-buildcores.cjs', (error, stdout, stderr) => {
      isSyncing = false;
      if (error) {
        console.error('[BuildCores] Error durante la sincronización:', error, stderr);
        resolve({ success: false, message: 'Error durante la sincronización: ' + error.message });
        return;
      }

      console.log('[BuildCores] Sincronización finalizada, recargando memoria:', stdout);
      loadBuildCoresData();
      resolve({
        success: true,
        message: `Sincronización exitosa con https://github.com/buildcores/buildcores-open-db. ${cachedMetadata.counts.total} componentes listos.`,
        metadata: cachedMetadata
      });
    });
  });
}
