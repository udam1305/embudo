import { GPU } from '../types';

export interface GpuGenerationMeta {
  id: string;
  brand: 'NVIDIA' | 'AMD' | 'Intel';
  label: string;
  shortLabel: string;
  architecture: string;
  order: number;
}

export const KNOWN_GPU_GENERATIONS: GpuGenerationMeta[] = [
  // --- NVIDIA (Chronological recent to older) ---
  {
    id: 'nv-rtx50',
    brand: 'NVIDIA',
    label: 'GeForce RTX 50 Series (Blackwell • 2025)',
    shortLabel: 'RTX 50 (Blackwell)',
    architecture: 'Blackwell',
    order: 1
  },
  {
    id: 'nv-rtx40',
    brand: 'NVIDIA',
    label: 'GeForce RTX 40 Series (Ada Lovelace • 2022 - 2024)',
    shortLabel: 'RTX 40 (Ada Lovelace)',
    architecture: 'Ada Lovelace',
    order: 2
  },
  {
    id: 'nv-rtx30',
    brand: 'NVIDIA',
    label: 'GeForce RTX 30 Series (Ampere • 2020 - 2022)',
    shortLabel: 'RTX 30 (Ampere)',
    architecture: 'Ampere',
    order: 3
  },
  {
    id: 'nv-rtx20',
    brand: 'NVIDIA',
    label: 'GeForce RTX 20 Series (Turing RTX • 2018 - 2020)',
    shortLabel: 'RTX 20 (Turing)',
    architecture: 'Turing',
    order: 4
  },
  {
    id: 'nv-gtx16',
    brand: 'NVIDIA',
    label: 'GeForce GTX 16 Series (Turing GTX • 2019 - 2020)',
    shortLabel: 'GTX 16 (Turing)',
    architecture: 'Turing',
    order: 5
  },
  {
    id: 'nv-gtx10',
    brand: 'NVIDIA',
    label: 'GeForce GTX 10 Series (Pascal • 2016 - 2017)',
    shortLabel: 'GTX 10 (Pascal)',
    architecture: 'Pascal',
    order: 6
  },

  // --- AMD Radeon (Chronological recent to older) ---
  {
    id: 'amd-rx7000',
    brand: 'AMD',
    label: 'Radeon RX 7000 Series (RDNA 3 • 2022 - 2024)',
    shortLabel: 'Radeon RX 7000 (RDNA 3)',
    architecture: 'RDNA 3',
    order: 7
  },
  {
    id: 'amd-rx6000',
    brand: 'AMD',
    label: 'Radeon RX 6000 Series (RDNA 2 • 2020 - 2022)',
    shortLabel: 'Radeon RX 6000 (RDNA 2)',
    architecture: 'RDNA 2',
    order: 8
  },
  {
    id: 'amd-rx5000',
    brand: 'AMD',
    label: 'Radeon RX 5000 Series (RDNA 1 • 2019 - 2020)',
    shortLabel: 'Radeon RX 5000 (RDNA 1)',
    architecture: 'RDNA 1',
    order: 9
  },
  {
    id: 'amd-vega-vii',
    brand: 'AMD',
    label: 'Radeon Vega & VII Series (GCN 5 • 2017 - 2019)',
    shortLabel: 'Radeon Vega / VII',
    architecture: 'Vega / GCN 5',
    order: 10
  },
  {
    id: 'amd-rx500',
    brand: 'AMD',
    label: 'Radeon RX 500 Series (Polaris Refresh • 2017 - 2018)',
    shortLabel: 'Radeon RX 500 (Polaris)',
    architecture: 'Polaris',
    order: 11
  },
  {
    id: 'amd-rx400',
    brand: 'AMD',
    label: 'Radeon RX 400 Series (Polaris Original • 2016)',
    shortLabel: 'Radeon RX 400 (Polaris)',
    architecture: 'Polaris',
    order: 12
  }
];

export function getGpuGenerationMeta(gpu: GPU): GpuGenerationMeta {
  const name = gpu.name.toUpperCase();
  const id = gpu.id.toLowerCase();
  const brand = gpu.brand;

  if (brand === 'NVIDIA') {
    if (name.includes('RTX 50') || id.includes('5090') || id.includes('5080') || id.includes('5070') || id.includes('5060')) {
      return KNOWN_GPU_GENERATIONS[0]; // nv-rtx50
    }
    if (name.includes('RTX 40') || id.includes('4090') || id.includes('4080') || id.includes('4070') || id.includes('4060')) {
      return KNOWN_GPU_GENERATIONS[1]; // nv-rtx40
    }
    if (name.includes('RTX 30') || id.includes('3090') || id.includes('3080') || id.includes('3070') || id.includes('3060') || id.includes('3050')) {
      return KNOWN_GPU_GENERATIONS[2]; // nv-rtx30
    }
    if (name.includes('RTX 20') || id.includes('2080') || id.includes('2070') || id.includes('2060')) {
      return KNOWN_GPU_GENERATIONS[3]; // nv-rtx20
    }
    if (name.includes('GTX 16') || id.includes('1660') || id.includes('1650') || id.includes('1630')) {
      return KNOWN_GPU_GENERATIONS[4]; // nv-gtx16
    }
    if (name.includes('GTX 10') || id.includes('1080') || id.includes('1070') || id.includes('1060') || id.includes('1050')) {
      return KNOWN_GPU_GENERATIONS[5]; // nv-gtx10
    }
  }

  if (brand === 'AMD') {
    if (name.includes('RX 7') || id.includes('7900') || id.includes('7800') || id.includes('7700') || id.includes('7600')) {
      return KNOWN_GPU_GENERATIONS[6]; // amd-rx7000
    }
    if (name.includes('RX 6') || id.includes('6950') || id.includes('6900') || id.includes('6800') || id.includes('6750') || id.includes('6700') || id.includes('6650') || id.includes('6600') || id.includes('6500') || id.includes('6400')) {
      return KNOWN_GPU_GENERATIONS[7]; // amd-rx6000
    }
    if (name.includes('RX 5700') || name.includes('RX 5600') || name.includes('RX 5500') || id.includes('5700') || id.includes('5600') || id.includes('5500')) {
      return KNOWN_GPU_GENERATIONS[8]; // amd-rx5000
    }
    if (name.includes('VEGA') || name.includes('VII') || id.includes('vega') || id.includes('vii')) {
      return KNOWN_GPU_GENERATIONS[9]; // amd-vega-vii
    }
    if (name.includes('RX 590') || name.includes('RX 580') || name.includes('RX 570') || name.includes('RX 560') || name.includes('RX 550') || id.includes('590') || id.includes('580') || id.includes('570') || id.includes('560') || id.includes('550')) {
      return KNOWN_GPU_GENERATIONS[10]; // amd-rx500
    }
    if (name.includes('RX 480') || name.includes('RX 470') || name.includes('RX 460') || id.includes('480') || id.includes('470') || id.includes('460')) {
      return KNOWN_GPU_GENERATIONS[11]; // amd-rx400
    }
  }

  // Fallback
  return {
    id: `other-${brand.toLowerCase()}`,
    brand,
    label: `${brand} Otras Gráficas`,
    shortLabel: brand,
    architecture: 'Standard GPU',
    order: 99
  };
}

export interface GpuGroup {
  id: string;
  label: string;
  shortLabel: string;
  brand: 'NVIDIA' | 'AMD' | 'Intel';
  order: number;
  gpus: GPU[];
}

export function groupGpusByGeneration(gpus: GPU[]): GpuGroup[] {
  const groupsMap = new Map<string, GpuGroup>();

  gpus.forEach(gpu => {
    const meta = getGpuGenerationMeta(gpu);
    if (!groupsMap.has(meta.id)) {
      groupsMap.set(meta.id, {
        id: meta.id,
        label: meta.label,
        shortLabel: meta.shortLabel,
        brand: meta.brand,
        order: meta.order,
        gpus: []
      });
    }
    groupsMap.get(meta.id)!.gpus.push(gpu);
  });

  // Sort groups by generation order
  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);

  // Within each group, keep high-end models first (e.g. 5090 -> 5080 -> 5070; or by 1440p score descending)
  sortedGroups.forEach(group => {
    group.gpus.sort((a, b) => {
      if (b.score1440p !== a.score1440p) {
        return b.score1440p - a.score1440p;
      }
      return b.vram - a.vram;
    });
  });

  return sortedGroups;
}
