import { ISmartphoneItem, ISmartphoneDetails, IBrandItem } from '../types';

export interface MobileSpecsApiInfo {
  status: boolean;
  service: string;
  repository: string;
  endpoints: Array<{ method: string; path: string; description: string }>;
}

const clientCache = new Map<string, { timestamp: number; data: any }>();
const CLIENT_TTL = 5 * 60 * 1000; // 5 minutes client cache

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = clientCache.get(url);
  if (cached && Date.now() - cached.timestamp < CLIENT_TTL) {
    return cached.data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error en API (${response.status}): ${response.statusText}`);
  }
  const json = await response.json();
  if (json.status === false && json.error) {
    throw new Error(json.error);
  }
  const result = json.data ?? json;
  clientCache.set(url, { timestamp: Date.now(), data: result });
  return result;
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
  const res = await fetch(`/api/phones/search?query=${encodeURIComponent(clean)}`);
  if (!res.ok) throw new Error('Error al buscar teléfonos');
  const json = await res.json();
  const rawList: ISmartphoneItem[] = json.data || [];
  return filterOnlyPhones(rawList);
}

export async function fetchPhoneDetails(slug: string): Promise<ISmartphoneDetails> {
  return cachedFetch<ISmartphoneDetails>(`/api/phones/details/${encodeURIComponent(slug)}`);
}
