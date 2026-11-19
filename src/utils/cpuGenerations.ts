import { CPU } from '../types';

export interface CpuGenerationMeta {
  id: string;
  name: string;
  shortLabel: string;
  brand: 'AMD' | 'Intel' | 'Apple' | 'Other';
  order: number; // Higher number = newer generation
  socket: string;
  years: string;
  isLaptop?: boolean;
}

export const KNOWN_CPU_GENERATIONS: CpuGenerationMeta[] = [
  // --- AMD Laptop Generations ---
  {
    id: 'amd-zen5-mobile',
    name: 'AMD Ryzen AI Serie 300 (Zen 5 Mobile • Strix Point)',
    shortLabel: 'Ryzen AI 300 (Laptop)',
    brand: 'AMD',
    order: 204,
    socket: 'FP8 (BGA)',
    years: '2024 - 2025',
    isLaptop: true
  },
  {
    id: 'amd-zen4-mobile',
    name: 'AMD Ryzen Serie 8000/7000 Mobile (Zen 4 • Hawk Point / Dragon Range)',
    shortLabel: 'Ryzen 8000/7000 (Laptop)',
    brand: 'AMD',
    order: 184,
    socket: 'FP7 / FP8 / FL1 (BGA)',
    years: '2023 - 2024',
    isLaptop: true
  },
  {
    id: 'amd-zen3-mobile',
    name: 'AMD Ryzen Serie 6000/5000 Mobile (Zen 3/3+ Laptop)',
    shortLabel: 'Ryzen 6000/5000 (Laptop)',
    brand: 'AMD',
    order: 164,
    socket: 'FP6 (BGA)',
    years: '2021 - 2023',
    isLaptop: true
  },

  // --- AMD Desktop Generations (Newest to Oldest) ---
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
    id: 'amd-threadripper',
    name: 'AMD Ryzen Threadripper (sTR5 / sTRX4 / TR4)',
    shortLabel: 'Ryzen Threadripper',
    brand: 'AMD',
    order: 175,
    socket: 'sTR5 / sTRX4 / TR4',
    years: '2017 - 2025'
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
  {
    id: 'amd-phenom',
    name: 'AMD Phenom II / Phenom (AM3 / AM2+)',
    shortLabel: 'Phenom II / Phenom',
    brand: 'AMD',
    order: 60,
    socket: 'AM3 / AM2+',
    years: '2008 - 2011'
  },
  {
    id: 'amd-athlon',
    name: 'AMD Athlon II / Athlon 64 / Athlon (AM3 / AM2 / 939 / AM4)',
    shortLabel: 'Athlon II / 64',
    brand: 'AMD',
    order: 50,
    socket: 'AM3 / AM2 / 939 / AM4',
    years: '2004 - 2020'
  },
  {
    id: 'amd-a-series',
    name: 'AMD A-Series APU (FM2+ / FM2)',
    shortLabel: 'A-Series APU (FM2+)',
    brand: 'AMD',
    order: 55,
    socket: 'FM2+ / FM2',
    years: '2012 - 2016'
  },

  // --- Intel Laptop Generations ---
  {
    id: 'intel-ultra2-mobile',
    name: 'Intel Core Ultra Serie 2 (Lunar Lake • BGA2833 Laptop)',
    shortLabel: 'Core Ultra 200V (Laptop)',
    brand: 'Intel',
    order: 207,
    socket: 'BGA2833',
    years: '2024 - 2025',
    isLaptop: true
  },
  {
    id: 'intel-ultra1-mobile',
    name: 'Intel Core Ultra Serie 1 (Meteor Lake • BGA2049 Laptop)',
    shortLabel: 'Core Ultra 100H (Laptop)',
    brand: 'Intel',
    order: 197,
    socket: 'BGA2049',
    years: '2023 - 2024',
    isLaptop: true
  },
  {
    id: 'intel-14th-mobile',
    name: 'Intel Core 14.ª Gen Mobile (Raptor Lake-HX Laptop)',
    shortLabel: 'Core 14.ª Gen (Laptop HX)',
    brand: 'Intel',
    order: 194,
    socket: 'BGA1964',
    years: '2024',
    isLaptop: true
  },
  {
    id: 'intel-13th-mobile',
    name: 'Intel Core 13.ª Gen Mobile (Raptor Lake-H / HX Laptop)',
    shortLabel: 'Core 13.ª Gen (Laptop H/HX)',
    brand: 'Intel',
    order: 184,
    socket: 'BGA1744 / BGA1964',
    years: '2023',
    isLaptop: true
  },
  {
    id: 'intel-12th-mobile',
    name: 'Intel Core 12.ª Gen Mobile (Alder Lake-H / U Laptop)',
    shortLabel: 'Core 12.ª Gen (Laptop H/U)',
    brand: 'Intel',
    order: 174,
    socket: 'BGA1744',
    years: '2022',
    isLaptop: true
  },
  {
    id: 'intel-11th-mobile',
    name: 'Intel Core 11.ª Gen Mobile (Tiger Lake-H Laptop)',
    shortLabel: 'Core 11.ª Gen (Laptop)',
    brand: 'Intel',
    order: 154,
    socket: 'BGA1787',
    years: '2021',
    isLaptop: true
  },
  {
    id: 'intel-10th-mobile',
    name: 'Intel Core 10.ª Gen Mobile (Comet Lake-H Laptop)',
    shortLabel: 'Core 10.ª Gen (Laptop)',
    brand: 'Intel',
    order: 144,
    socket: 'BGA1440',
    years: '2020',
    isLaptop: true
  },

  // --- Apple Silicon (Laptop / MacBook) ---
  {
    id: 'apple-m-series',
    name: 'Apple Silicon Serie M (MacBook Pro / Air)',
    shortLabel: 'Apple Silicon (MacBook)',
    brand: 'Apple',
    order: 191,
    socket: 'Apple SoC',
    years: '2020 - 2024',
    isLaptop: true
  },

  // --- Intel Desktop Generations (Newest to Oldest) ---
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
  },
  {
    id: 'intel-5th',
    name: 'Intel Core 5.ª Gen (Broadwell • LGA1150)',
    shortLabel: 'Core 5.ª Gen (LGA1150)',
    brand: 'Intel',
    order: 90,
    socket: 'LGA1150',
    years: '2015'
  },
  {
    id: 'intel-4th',
    name: 'Intel Core 4.ª Gen (Haswell / Devil\'s Canyon • LGA1150)',
    shortLabel: 'Core 4.ª Gen (LGA1150)',
    brand: 'Intel',
    order: 85,
    socket: 'LGA1150',
    years: '2013 - 2014'
  },
  {
    id: 'intel-3rd',
    name: 'Intel Core 3.ª Gen (Ivy Bridge • LGA1155)',
    shortLabel: 'Core 3.ª Gen (LGA1155)',
    brand: 'Intel',
    order: 75,
    socket: 'LGA1155',
    years: '2012 - 2013'
  },
  {
    id: 'intel-2nd',
    name: 'Intel Core 2.ª Gen (Sandy Bridge • LGA1155)',
    shortLabel: 'Core 2.ª Gen (LGA1155)',
    brand: 'Intel',
    order: 65,
    socket: 'LGA1155',
    years: '2011'
  },
  {
    id: 'intel-1st',
    name: 'Intel Core 1.ª Gen (Nehalem / Westmere • LGA1366 / LGA1156)',
    shortLabel: 'Core 1.ª Gen (LGA1366/1156)',
    brand: 'Intel',
    order: 55,
    socket: 'LGA1366 / LGA1156',
    years: '2008 - 2010'
  },
  {
    id: 'intel-core2',
    name: 'Intel Core 2 Quad / Core 2 Duo (LGA775)',
    shortLabel: 'Core 2 Quad / Duo',
    brand: 'Intel',
    order: 45,
    socket: 'LGA775',
    years: '2006 - 2009'
  },
  {
    id: 'intel-xeon-ws',
    name: 'Intel Xeon Workstation & Server (LGA2011 / LGA2011-3 / LGA1366)',
    shortLabel: 'Intel Xeon Workstation',
    brand: 'Intel',
    order: 70,
    socket: 'LGA2011 / LGA2011-3',
    years: '2010 - 2018'
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
  const isLap = cpu.platform === 'laptop' || cpu.isLaptop || socket.includes('BGA') || socket.includes('FP') || socket.includes('FL1') || socket.includes('SOC');

  // Apple Silicon
  if (cpu.brand === 'Apple' || name.includes('apple') || name.includes('m1') || name.includes('m2') || name.includes('m3') || name.includes('m4')) {
    return KNOWN_CPU_GENERATIONS.find(g => g.id === 'apple-m-series')!;
  }

  // AMD Mobile
  if (isLap || name.includes('hx 370') || name.includes('ryzen ai') || name.includes('7945hx') || name.includes('8845hs') || name.includes('7840hs') || name.includes('8945hs') || name.includes('8645hs') || name.includes('7640hs') || name.includes('7735hs') || name.includes('6800h') || name.includes('5800h') || name.includes('5600h') || name.includes('5700u') || name.includes('5500u')) {
    if (name.includes('ai 9') || name.includes('hx 370') || name.includes('ai 300') || name.includes('strix')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen5-mobile')!;
    }
    if (name.includes('7945hx') || name.includes('8945hs') || name.includes('8845hs') || name.includes('7840hs') || name.includes('8645hs') || name.includes('7640hs') || name.includes('8840u') || name.includes('7735hs')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen4-mobile')!;
    }
    if (name.includes('6900hx') || name.includes('6800h') || name.includes('5800h') || name.includes('5600h') || name.includes('5700u') || name.includes('5500u')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen3-mobile')!;
    }
  }

  // Intel Mobile
  if (isLap || name.includes('288v') || name.includes('258v') || name.includes('226v') || name.includes('185h') || name.includes('155h') || name.includes('125h') || name.includes('14900hx') || name.includes('14700hx') || name.includes('14650hx') || name.includes('14500hx') || name.includes('13980hx') || name.includes('13900h') || name.includes('13700h') || name.includes('13620h') || name.includes('13500h') || name.includes('13420h') || name.includes('12900h') || name.includes('12700h') || name.includes('12500h') || name.includes('1255u') || name.includes('1235u') || name.includes('11800h') || name.includes('11400h') || name.includes('10750h') || name.includes('10300h')) {
    if (name.includes('288v') || name.includes('258v') || name.includes('226v') || (name.includes('ultra') && name.includes('v'))) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-ultra2-mobile')!;
    }
    if (name.includes('185h') || name.includes('165h') || name.includes('155h') || name.includes('135h') || name.includes('125h') || (name.includes('ultra') && name.includes('h'))) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-ultra1-mobile')!;
    }
    if (name.includes('14900hx') || name.includes('14700hx') || name.includes('14650hx') || name.includes('14500hx')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-14th-mobile')!;
    }
    if (name.includes('13980hx') || name.includes('13900h') || name.includes('13700h') || name.includes('13620h') || name.includes('13500h') || name.includes('13420h')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-13th-mobile')!;
    }
    if (name.includes('12900h') || name.includes('12700h') || name.includes('12500h') || name.includes('1255u') || name.includes('1235u')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-12th-mobile')!;
    }
    if (name.includes('11800h') || name.includes('11400h')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-11th-mobile')!;
    }
    if (name.includes('10750h') || name.includes('10300h')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-10th-mobile')!;
    }
  }

  // AMD Desktop
  if (cpu.brand === 'AMD' || name.includes('ryzen') || name.includes('fx-') || name.includes('phenom') || name.includes('athlon')) {
    if (name.includes('threadripper') || socket.includes('TR')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-threadripper')!;
    }
    if (name.includes('9950') || name.includes('9900') || name.includes('9800') || name.includes('9700') || name.includes('9600')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen5')!;
    }
    if (name.includes('8700') || name.includes('8600') || name.includes('8500') || name.includes('8400') || name.includes('8300')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen4-apu')!;
    }
    if (name.includes('7950') || name.includes('7900') || name.includes('7800') || name.includes('7700') || name.includes('7600') || name.includes('7500')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen4')!;
    }
    if (name.includes('5950') || name.includes('5900') || name.includes('5800') || name.includes('5700') || name.includes('5600') || name.includes('5500') || name.includes('5300') || name.includes('5100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen3')!;
    }
    if (name.includes('4750') || name.includes('4700') || name.includes('4650') || name.includes('4600') || name.includes('4500') || name.includes('4350') || name.includes('4300') || name.includes('4100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen2')!;
    }
    if (name.includes('3950') || name.includes('3900') || name.includes('3800') || name.includes('3700') || name.includes('3600') || name.includes('3500') || name.includes('3400') || name.includes('3300') || name.includes('3200') || name.includes('3100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen2')!;
    }
    if (name.includes('2700') || name.includes('2600') || name.includes('2400') || name.includes('2300') || name.includes('2200') || name.includes('1600 af')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zenplus')!;
    }
    if (name.includes('1800') || name.includes('1700') || name.includes('1600') || name.includes('1500') || name.includes('1400') || name.includes('1300') || name.includes('1200')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-zen1')!;
    }
    if (name.includes('fx-') || socket.includes('AM3+')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-fx')!;
    }
    if (name.includes('phenom')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-phenom')!;
    }
    if (name.includes('a10-') || name.includes('a8-') || name.includes('a6-') || name.includes('a4-') || socket.includes('FM2')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-a-series')!;
    }
    if (name.includes('athlon')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'amd-athlon')!;
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
  if (cpu.brand === 'Intel' || name.includes('intel') || name.includes('core') || name.includes('xeon') || name.includes('pentium') || name.includes('celeron')) {
    if (name.includes('xeon') || socket.includes('2011') || socket.includes('2066')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-xeon-ws') || KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-1st')!;
    }
    if (name.includes('ultra') || socket === 'LGA1851') {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-ultra2')!;
    }
    if (name.includes('14900') || name.includes('14700') || name.includes('14600') || name.includes('14500') || name.includes('14400') || name.includes('14100') || name.includes('intel 300')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-14th')!;
    }
    if (name.includes('13900') || name.includes('13700') || name.includes('13600') || name.includes('13500') || name.includes('13400') || name.includes('13100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-13th')!;
    }
    if (name.includes('12900') || name.includes('12700') || name.includes('12600') || name.includes('12500') || name.includes('12400') || name.includes('12100') || name.includes('g7400')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-12th')!;
    }
    if (name.includes('11900') || name.includes('11700') || name.includes('11600') || name.includes('11500') || name.includes('11400')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-11th')!;
    }
    if (name.includes('10900') || name.includes('10850') || name.includes('10700') || name.includes('10600') || name.includes('10500') || name.includes('10400') || name.includes('10105') || name.includes('10100') || name.includes('g6400')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-10th')!;
    }
    if (name.includes('9900') || name.includes('9700') || name.includes('9600') || name.includes('9500') || name.includes('9400') || name.includes('9350') || name.includes('9100')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-9th')!;
    }
    if (name.includes('8086') || name.includes('8700') || name.includes('8600') || name.includes('8500') || name.includes('8400') || name.includes('8350') || name.includes('8100') || name.includes('g5400')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-8th')!;
    }
    if (name.includes('7700') || name.includes('7600') || name.includes('7500') || name.includes('7400') || name.includes('7350') || name.includes('7100') || name.includes('g4560') || name.includes('g4600')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-7th')!;
    }
    if (name.includes('6700') || name.includes('6600') || name.includes('6500') || name.includes('6400') || name.includes('6100') || name.includes('g4400')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-6th')!;
    }
    if (name.includes('5775') || name.includes('5675')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-5th')!;
    }
    if (name.includes('4790') || name.includes('4770') || name.includes('4690') || name.includes('4670') || name.includes('4590') || name.includes('4460') || name.includes('4440') || name.includes('4170') || name.includes('4160') || name.includes('4130') || name.includes('g3258') || name.includes('g3220') || socket.includes('1150')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-4th')!;
    }
    if (name.includes('3770') || name.includes('3570') || name.includes('3470') || name.includes('3330') || name.includes('3240') || name.includes('3220') || name.includes('g2120') || name.includes('g2020')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-3rd')!;
    }
    if (name.includes('2700') || name.includes('2600') || name.includes('2550') || name.includes('2500') || name.includes('2400') || name.includes('2300') || name.includes('2120') || name.includes('2100') || name.includes('g860') || name.includes('g620') || socket.includes('1155')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-2nd')!;
    }
    if (name.includes('i7-9') || name.includes('i7-8') || name.includes('i5-7') || name.includes('i5-6') || name.includes('i3-5') || socket.includes('1156') || socket.includes('1366')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-1st')!;
    }
    if (name.includes('core 2') || name.includes('qx9') || name.includes('q9') || name.includes('q8') || name.includes('q6') || name.includes('e8600') || name.includes('e8400') || name.includes('e7500') || name.includes('e6600') || name.includes('e5400') || name.includes('e5200') || socket.includes('775')) {
      return KNOWN_CPU_GENERATIONS.find(g => g.id === 'intel-core2')!;
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
  brand: 'AMD' | 'Intel' | 'Apple' | 'Other';
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
