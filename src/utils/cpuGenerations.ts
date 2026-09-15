import { CPU } from '../types';

export interface CpuGenerationMeta {
  id: string;
  name: string;
  shortLabel: string;
  brand: 'AMD' | 'Intel' | 'Other';
  order: number; // Higher number = newer generation
  socket: string;
  years: string;
}

export const KNOWN_CPU_GENERATIONS: CpuGenerationMeta[] = [
  // --- AMD Generations (Newest to Oldest) ---
  {
    id: 'amd-zen5',
    name: 'AMD Ryzen Serie 9000 (Zen 5 • AM5)',
    shortLabel: 'Ryzen 9000 (Zen 5)',
    brand: 'AMD',
    order: 200,
    socket: 'AM5',
    years: '2024 - 2025'
  },
  {
    id: 'amd-zen4-apu',
    name: 'AMD Ryzen Serie 8000G (Zen 4 • AM5)',
    shortLabel: 'Ryzen 8000G',
    brand: 'AMD',
    order: 190,
    socket: 'AM5',
    years: '2024'
  },
  {
    id: 'amd-zen4',
    name: 'AMD Ryzen Serie 7000 (Zen 4 • AM5)',
    shortLabel: 'Ryzen 7000 (Zen 4)',
    brand: 'AMD',
    order: 180,
    socket: 'AM5',
    years: '2022 - 2023'
  },
  {
    id: 'amd-zen3',
    name: 'AMD Ryzen Serie 5000 (Zen 3 • AM4)',
    shortLabel: 'Ryzen 5000 (Zen 3)',
    brand: 'AMD',
    order: 160,
    socket: 'AM4',
    years: '2020 - 2024'
  },
  {
    id: 'amd-zen2',
    name: 'AMD Ryzen Serie 3000 (Zen 2 • AM4)',
    shortLabel: 'Ryzen 3000 (Zen 2)',
    brand: 'AMD',
    order: 140,
    socket: 'AM4',
    years: '2019 - 2020'
  },
  {
    id: 'amd-zenplus',
    name: 'AMD Ryzen Serie 2000 (Zen+ • AM4)',
    shortLabel: 'Ryzen 2000 (Zen+)',
    brand: 'AMD',
    order: 120,
    socket: 'AM4',
    years: '2018 - 2019'
  },
  {
    id: 'amd-zen1',
    name: 'AMD Ryzen Serie 1000 (Zen • AM4)',
    shortLabel: 'Ryzen 1000 (Zen)',
    brand: 'AMD',
    order: 100,
    socket: 'AM4',
    years: '2017'
  },
  {
    id: 'amd-fx',
    name: 'AMD FX Series (Piledriver • AM3+)',
    shortLabel: 'AMD FX (AM3+)',
    brand: 'AMD',
    order: 80,
    socket: 'AM3+',
    years: '2012 - 2015'
  },

  // --- Intel Generations (Newest to Oldest) ---
  {
    id: 'intel-ultra2',
    name: 'Intel Core Ultra Serie 2 (Arrow Lake • LGA1851)',
    shortLabel: 'Core Ultra 200 (LGA1851)',
    brand: 'Intel',
    order: 205,
    socket: 'LGA1851',
    years: '2024'
  },
  {
    id: 'intel-14th',
    name: 'Intel Core 14.ª Gen (Raptor Lake Refresh • LGA1700)',
    shortLabel: 'Core 14.ª Gen (LGA1700)',
    brand: 'Intel',
    order: 195,
    socket: 'LGA1700',
    years: '2023 - 2024'
  },
  {
    id: 'intel-13th',
    name: 'Intel Core 13.ª Gen (Raptor Lake • LGA1700)',
    shortLabel: 'Core 13.ª Gen (LGA1700)',
    brand: 'Intel',
    order: 185,
    socket: 'LGA1700',
    years: '2022 - 2023'
  },
  {
    id: 'intel-12th',
    name: 'Intel Core 12.ª Gen (Alder Lake • LGA1700)',
    shortLabel: 'Core 12.ª Gen (LGA1700)',
    brand: 'Intel',
    order: 175,
    socket: 'LGA1700',
    years: '2021 - 2022'
  },
  {
    id: 'intel-11th',
    name: 'Intel Core 11.ª Gen (Rocket Lake • LGA1200)',
    shortLabel: 'Core 11.ª Gen (LGA1200)',
    brand: 'Intel',
    order: 155,
    socket: 'LGA1200',
    years: '2021'
  },
  {
    id: 'intel-10th',
    name: 'Intel Core 10.ª Gen (Comet Lake • LGA1200)',
    shortLabel: 'Core 10.ª Gen (LGA1200)',
    brand: 'Intel',
    order: 145,
    socket: 'LGA1200',
    years: '2020'
  },
  {
    id: 'intel-9th',
    name: 'Intel Core 9.ª Gen (Coffee Lake Refresh • LGA1151)',
    shortLabel: 'Core 9.ª Gen (LGA1151)',
    brand: 'Intel',
    order: 135,
    socket: 'LGA1151',
    years: '2018 - 2019'
  },
  {
    id: 'intel-8th',
    name: 'Intel Core 8.ª Gen (Coffee Lake • LGA1151)',
    shortLabel: 'Core 8.ª Gen (LGA1151)',
    brand: 'Intel',
    order: 125,
    socket: 'LGA1151',
    years: '2017 - 2018'
  },
  {
    id: 'intel-7th',
    name: 'Intel Core 7.ª Gen (Kaby Lake • LGA1151)',
    shortLabel: 'Core 7.ª Gen (LGA1151)',
    brand: 'Intel',
    order: 115,
    socket: 'LGA1151',
    years: '2017'
  },
  {
    id: 'intel-6th',
    name: 'Intel Core 6.ª Gen (Skylake • LGA1151)',
    shortLabel: 'Core 6.ª Gen (LGA1151)',
    brand: 'Intel',
    order: 95,
    socket: 'LGA1151',
    years: '2015'
  }
];

/**
 * Accurately detects and returns the generation metadata for a CPU.
 */
export function getCpuGenerationMeta(cpu: CPU): CpuGenerationMeta {
  if (cpu.generation) {
    const matched = KNOWN_CPU_GENERATIONS.find(g => g.id === cpu.generation || g.name === cpu.generation || g.shortLabel === cpu.generation);
    if (matched) return matched;
  }

  const name = cpu.name.toLowerCase();
  const socket = cpu.socket.toUpperCase();

  // AMD
  if (cpu.brand === 'AMD' || name.includes('ryzen') || name.includes('fx-')) {
    if (name.includes('9950') || name.includes('9900') || name.includes('9800') || name.includes('9700') || name.includes('9600')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen5')!;
    }
    if (name.includes('8700') || name.includes('8600') || name.includes('8500')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen4-apu')!;
    }
    if (name.includes('7950') || name.includes('7900') || name.includes('7800') || name.includes('7700') || name.includes('7600') || name.includes('7500')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen4')!;
    }
    if (name.includes('5950') || name.includes('5900') || name.includes('5800') || name.includes('5700') || name.includes('5600') || name.includes('5500')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen3')!;
    }
    if (name.includes('3950') || name.includes('3900') || name.includes('3700') || name.includes('3600') || name.includes('3300') || name.includes('3100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen2')!;
    }
    if (name.includes('2700') || name.includes('2600') || name.includes('2200') || name.includes('1600 af')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zenplus')!;
    }
    if (name.includes('1800') || name.includes('1700') || name.includes('1600') || name.includes('1500') || name.includes('1200')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen1')!;
    }
    if (name.includes('fx-') || socket.includes('AM3')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-fx')!;
    }
    return {
      id: 'amd-other',
      name: `AMD (${cpu.socket})`,
      shortLabel: `AMD ${cpu.socket}`,
      brand: 'AMD',
      order: 70,
      socket: cpu.socket,
      years: `${cpu.releaseYear || ''}`
    };
  }

  // Intel
  if (cpu.brand === 'Intel' || name.includes('intel') || name.includes('core')) {
    if (name.includes('ultra') || socket === 'LGA1851') {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-ultra2')!;
    }
    if (name.includes('14900') || name.includes('14700') || name.includes('14600') || name.includes('14400') || name.includes('14100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-14th')!;
    }
    if (name.includes('13900') || name.includes('13700') || name.includes('13600') || name.includes('13400') || name.includes('13100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-13th')!;
    }
    if (name.includes('12900') || name.includes('12700') || name.includes('12600') || name.includes('12400') || name.includes('12100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-12th')!;
    }
    if (name.includes('11900') || name.includes('11700') || name.includes('11600') || name.includes('11400')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-11th')!;
    }
    if (name.includes('10900') || name.includes('10700') || name.includes('10600') || name.includes('10400') || name.includes('10100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-10th')!;
    }
    if (name.includes('9900') || name.includes('9700') || name.includes('9600') || name.includes('9400') || name.includes('9100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-9th')!;
    }
    if (name.includes('8700') || name.includes('8600') || name.includes('8400') || name.includes('8100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-8th')!;
    }
    if (name.includes('7700') || name.includes('7600') || name.includes('7400') || name.includes('7100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-7th')!;
    }
    if (name.includes('6700') || name.includes('6600') || name.includes('6400') || name.includes('6100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-6th')!;
    }
    return {
      id: 'intel-other',
      name: `Intel (${cpu.socket})`,
      shortLabel: `Intel ${cpu.socket}`,
      brand: 'Intel',
      order: 70,
      socket: cpu.socket,
      years: `${cpu.releaseYear || ''}`
    };
  }

  return {
    id: 'other',
    name: `${cpu.brand} (${cpu.socket})`,
    shortLabel: cpu.brand,
    brand: 'Other',
    order: 10,
    socket: cpu.socket,
    years: `${cpu.releaseYear || ''}`
  };
}

export interface CpuGroup {
  id: string;
  label: string;
  shortLabel: string;
  brand: 'AMD' | 'Intel' | 'Other';
  order: number;
  cpus: CPU[];
}

/**
 * Groups and sorts CPUs by generation (newest generation first, and within each generation
 * sorted by tier / performance descending).
 */
export function groupCpusByGeneration(cpus: CPU[]): CpuGroup[] {
  const map = new Map<string, { meta: CpuGenerationMeta; list: CPU[] }>();

  for (const cpu of cpus) {
    const meta = getCpuGenerationMeta(cpu);
    if (!map.has(meta.id)) {
      map.set(meta.id, { meta, list: [] });
    }
    map.get(meta.id)!.list.push(cpu);
  }

  const groups: CpuGroup[] = [];

  for (const [, entry] of map.entries()) {
    // Sort CPUs within the generation by multicore + gaming score or tier descending
    entry.list.sort((a, b) => {
      const scoreA = a.gamingScore * 0.5 + a.multicoreScore * 0.5;
      const scoreB = b.gamingScore * 0.5 + b.multicoreScore * 0.5;
      return scoreB - scoreA;
    });

    groups.push({
      id: entry.meta.id,
      label: entry.meta.name,
      shortLabel: entry.meta.shortLabel,
      brand: entry.meta.brand,
      order: entry.meta.order,
      cpus: entry.list
    });
  }

  // Sort groups: if brand is homogeneous, by order descending.
  // If mixed (AMD + Intel), sort AMD groups newest to oldest, then Intel groups newest to oldest,
  // or pure order descending.
  groups.sort((a, b) => {
    if (a.brand !== b.brand) {
      // Keep AMD together, Intel together for clean grouped browsing
      return a.brand.localeCompare(b.brand);
    }
    return b.order - a.order;
  });

  return groups;
}

/**
 * Returns a flat array of CPUs ordered by generation and performance.
 */
export function getSortedCpusByGeneration(cpus: CPU[]): CPU[] {
  const groups = groupCpusByGeneration(cpus);
  return groups.flatMap(g => g.cpus);
}
