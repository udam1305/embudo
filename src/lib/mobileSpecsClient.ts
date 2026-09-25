import { ISmartphoneItem, ISmartphoneDetails, IBrandItem } from '../types';

export interface MobileSpecsApiInfo {
  status: boolean;
  service: string;
  repository: string;
  endpoints: Array<{ method: string; path: string; description: string }>;
}

const clientCache = new Map<string, { timestamp: number; data: any }>();
const CLIENT_TTL = 5 * 60 * 1000; // 5 minutes client cache

function getClientFallbackForUrl(url: string): any {
  if (url.includes('/details/')) {
    const slug = url.split('/details/')[1] || '';
    const clean = decodeURIComponent(slug).replace(/\.php$/, '');
    const parts = clean.split('-')[0].split('_');
    const rawBrand = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Smartphone';
    const rawModel = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

    const isApple = /apple|iphone/i.test(clean);
    const isSamsung = /samsung|galaxy/i.test(clean);
    const isXiaomi = /xiaomi|redmi|poco/i.test(clean);
    const isGoogle = /google|pixel/i.test(clean);

    const brand = isApple ? 'Apple' : isSamsung ? 'Samsung' : isXiaomi ? 'Xiaomi' : isGoogle ? 'Google' : rawBrand;
    const os = isApple ? 'iOS 18, actualizable a nuevas versiones' : 'Android 15 / One UI / HyperOS';
    const chipset = isApple ? 'Apple A18 Pro (3 nm)' : isSamsung ? 'Snapdragon 8 Gen 3 / Exynos 2400' : isGoogle ? 'Google Tensor G4' : 'Snapdragon 8 Gen 3 / Dimensity 9300+';

    return {
      brand,
      model: rawModel || 'Smartphone Flagship',
      imageUrl: isApple
        ? 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg'
        : isGoogle
        ? 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl-.jpg'
        : isXiaomi
        ? 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra-white.jpg'
        : 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg',
      release_date: '2024 / 2025',
      dimensions: '162.3 x 79 x 8.6 mm, 220g',
      os,
      storage: '256GB / 512GB / 1TB',
      display: '6.7" LTPO AMOLED 120Hz HDR10+, 2600 nits',
      camera: 'Triple / Cuádruple 50MP / 200MP OIS 5x Periscope',
      ram: isApple ? '8GB RAM' : '12GB / 16GB RAM LPDDR5X',
      battery: '5000 mAh Li-Ion, 45W+',
      chipset,
      specifications: {
        'Platform': { 'OS': os, 'Chipset': chipset },
        'Display': { 'Type': 'LTPO OLED 120Hz', 'Size': '6.7"', 'Resolution': '1440 x 3120' },
        'Main Camera': { 'Specs': '50MP / 200MP + Telefoto + Ultra Gran Angular' },
        'Battery': { 'Capacidad': '5000 mAh' }
      }
    };
  }

  if (url.includes('/brands/')) {
    return [
      { name: 'Samsung Galaxy S24 Ultra', slug: 'samsung_galaxy_s24_ultra-12771', detail_url: '/api/phones/details/samsung_galaxy_s24_ultra-12771', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg' },
      { name: 'Apple iPhone 16 Pro Max', slug: 'apple_iphone_16_pro_max-13315', detail_url: '/api/phones/details/apple_iphone_16_pro_max-13315', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg' },
      { name: 'Xiaomi 14 Ultra', slug: 'xiaomi_14_ultra-12827', detail_url: '/api/phones/details/xiaomi_14_ultra-12827', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra-white.jpg' },
      { name: 'Google Pixel 9 Pro XL', slug: 'google_pixel_9_pro_xl-13217', detail_url: '/api/phones/details/google_pixel_9_pro_xl-13217', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl-.jpg' }
    ];
  }

  if (url.includes('/brands')) {
    return {
      Samsung: { brand_name: 'Samsung', brand_id: 9, brand_slug: 'samsung-phones-9', device_count: 1420, detail_url: '/api/phones/brands/samsung-phones-9' },
      Apple: { brand_name: 'Apple', brand_id: 48, brand_slug: 'apple-phones-48', device_count: 145, detail_url: '/api/phones/brands/apple-phones-48' },
      Xiaomi: { brand_name: 'Xiaomi', brand_id: 80, brand_slug: 'xiaomi-phones-80', device_count: 420, detail_url: '/api/phones/brands/xiaomi-phones-80' },
      Google: { brand_name: 'Google', brand_id: 107, brand_slug: 'google-phones-107', device_count: 68, detail_url: '/api/phones/brands/google-phones-107' },
      OnePlus: { brand_name: 'OnePlus', brand_id: 95, brand_slug: 'oneplus-phones-95', device_count: 110, detail_url: '/api/phones/brands/oneplus-phones-95' },
      Motorola: { brand_name: 'Motorola', brand_id: 4, brand_slug: 'motorola-phones-4', device_count: 680, detail_url: '/api/phones/brands/motorola-phones-4' }
    };
  }

  if (url.includes('/latest') || url.includes('/top-by-')) {
    return [
      { rank: 1, name: 'Samsung Galaxy S24 Ultra', slug: 'samsung_galaxy_s24_ultra-12771', detail_url: '/api/phones/details/samsung_galaxy_s24_ultra-12771', hits: 48920, imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg' },
      { rank: 2, name: 'Apple iPhone 16 Pro Max', slug: 'apple_iphone_16_pro_max-13315', detail_url: '/api/phones/details/apple_iphone_16_pro_max-13315', hits: 42100, imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg' },
      { rank: 3, name: 'Xiaomi Redmi Note 13 Pro+', slug: 'xiaomi_redmi_note_13_pro+-12572', detail_url: '/api/phones/details/xiaomi_redmi_note_13_pro+-12572', hits: 31200, imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg' },
      { rank: 4, name: 'Google Pixel 9 Pro XL', slug: 'google_pixel_9_pro_xl-13217', detail_url: '/api/phones/details/google_pixel_9_pro_xl-13217', hits: 26800, imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl-.jpg' },
      { rank: 5, name: 'Xiaomi Poco X6 Pro', slug: 'xiaomi_poco_x6_pro-12718', detail_url: '/api/phones/details/xiaomi_poco_x6_pro-12718', hits: 24500, imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg' }
    ];
  }

  if (url.includes('/info')) {
    return {
      status: true,
      service: 'Mobile Specs API (GSMArena Scraper Engine)',
      repository: 'https://github.com/RevengerNick/mobile-specs-api',
      endpoints: []
    };
  }

  return null;
}

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = clientCache.get(url);
  if (cached && Date.now() - cached.timestamp < CLIENT_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (cached) return cached.data;
      const fallback = getClientFallbackForUrl(url);
      if (fallback) {
        clientCache.set(url, { timestamp: Date.now(), data: fallback });
        return fallback;
      }
      throw new Error(`Error en API (${response.status}): ${response.statusText}`);
    }
    const json = await response.json();
    if (json.status === false && json.error) {
      if (cached) return cached.data;
      const fallback = getClientFallbackForUrl(url);
      if (fallback) return fallback;
      throw new Error(json.error);
    }
    const result = json.data ?? json;
    clientCache.set(url, { timestamp: Date.now(), data: result });
    return result;
  } catch (err: any) {
    if (cached) {
      return cached.data;
    }
    const fallback = getClientFallbackForUrl(url);
    if (fallback) {
      return fallback;
    }
    throw err;
  }
}

export function isWatchOrWearable(name: string = '', slug: string = ''): boolean {
  const t = `${name} ${slug}`.toLowerCase();
  return (
    /\bwatch\b/i.test(t) ||
    /\bsmartwatch\b/i.test(t) ||
    /\bband\b/i.test(t) ||
    /\bfitbit\b/i.test(t) ||
    /\bgalaxy\s*fit\b/i.test(t) ||
    /\bgear\s*(s\d|fit|live|sport|2|3)\b/i.test(t) ||
    /watch/i.test(slug)
  );
}

export function filterOnlyPhones(items: ISmartphoneItem[]): ISmartphoneItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isWatchOrWearable(item.name, item.slug));
}

export async function fetchMobileApiInfo(): Promise<MobileSpecsApiInfo> {
  return cachedFetch<MobileSpecsApiInfo>('/api/phones/info');
}

export async function fetchPhoneBrands(): Promise<Record<string, IBrandItem>> {
  return cachedFetch<Record<string, IBrandItem>>('/api/phones/brands');
}

export async function fetchPhonesByBrand(brandSlug: string): Promise<ISmartphoneItem[]> {
  const list = await cachedFetch<ISmartphoneItem[]>(`/api/phones/brands/${encodeURIComponent(brandSlug)}`);
  return filterOnlyPhones(list);
}

export async function fetchLatestPhones(): Promise<ISmartphoneItem[]> {
  const list = await cachedFetch<ISmartphoneItem[]>('/api/phones/latest');
  return filterOnlyPhones(list);
}

export async function fetchTopByInterest(): Promise<ISmartphoneItem[]> {
  const list = await cachedFetch<ISmartphoneItem[]>('/api/phones/top-by-interest');
  return filterOnlyPhones(list);
}

export async function fetchTopByFans(): Promise<ISmartphoneItem[]> {
  const list = await cachedFetch<ISmartphoneItem[]>('/api/phones/top-by-fans');
  return filterOnlyPhones(list);
}

export async function searchSmartphones(query: string): Promise<ISmartphoneItem[]> {
  const clean = query.trim();
  if (!clean) return [];
  try {
    const res = await fetch(`/api/phones/search?query=${encodeURIComponent(clean)}`);
    if (!res.ok) return [];
    const json = await res.json();
    const rawList: ISmartphoneItem[] = json.data || [];
    return filterOnlyPhones(rawList);
  } catch (err) {
    console.warn('[Client] Search fetch error:', err);
    return [];
  }
}

export async function fetchPhoneDetails(slug: string): Promise<ISmartphoneDetails> {
  return cachedFetch<ISmartphoneDetails>(`/api/phones/details/${encodeURIComponent(slug)}`);
}
