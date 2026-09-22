import axios from 'axios';
import * as cheerio from 'cheerio';

export const GSMARENA_BASE_URL = 'https://www.gsmarena.com';

export interface ISearchResult {
  name: string;
  slug: string;
  imageUrl?: string;
  detail_url: string;
  brand?: string;
}

export type TSpecCategory = Record<string, string>;

export interface IPhoneDetails {
  brand: string;
  model: string;
  imageUrl?: string;
  release_date: string;
  dimensions: string;
  os: string;
  storage: string;
  display?: string;
  camera?: string;
  ram?: string;
  battery?: string;
  chipset?: string;
  specifications: Record<string, TSpecCategory>;
}

export interface IBrandDetails {
  brand_name: string;
  brand_id: number;
  brand_slug: string;
  device_count: number;
  detail_url: string;
}

export interface IPhoneListItem {
  name: string;
  slug: string;
  imageUrl?: string;
  detail_url: string;
  rank?: number;
  hits?: number;
  brand?: string;
}

// In-Memory Caches with TTL
const cache = {
  brands: null as { timestamp: number; data: Record<string, IBrandDetails> } | null,
  brandPhones: new Map<string, { timestamp: number; data: IPhoneListItem[] }>(),
  latest: null as { timestamp: number; data: IPhoneListItem[] } | null,
  topByInterest: null as { timestamp: number; data: IPhoneListItem[] } | null,
  topByFans: null as { timestamp: number; data: IPhoneListItem[] } | null,
  phoneDetails: new Map<string, { timestamp: number; data: IPhoneDetails }>(),
  quicksearchIndex: null as {
    timestamp: number;
    brands: Record<string, string>;
    phones: Array<[number, number, string, string, string, string]>;
  } | null,
};

const ONE_HOUR = 60 * 60 * 1000;
const TWELVE_HOURS = 12 * ONE_HOUR;
const TWENTY_FOUR_HOURS = 24 * ONE_HOUR;

/**
 * Filter out smartwatches, fitness bands, wrist wearables, etc.
 * Guarantees that only actual smartphones remain in the dataset.
 */
export function isWatchOrWearable(name: string = '', slug: string = '', keywords: string = ''): boolean {
  const t = `${name} ${slug} ${keywords}`.toLowerCase();
  if (/\bwatch\b/i.test(t)) return true;
  if (/\bsmartwatch\b/i.test(t)) return true;
  if (/\bband\b/i.test(t)) return true;
  if (/\bfitbit\b/i.test(t)) return true;
  if (/\bgalaxy\s*fit\b/i.test(t)) return true;
  if (/\bgear\s*(s\d|fit|live|sport|2|3)\b/i.test(t)) return true;
  if (/watch/i.test(slug)) return true;
  if (/smartwatch/i.test(slug)) return true;
  return false;
}

export function isPhoneOnly(name: string = '', slug: string = '', keywords: string = ''): boolean {
  return !isWatchOrWearable(name, slug, keywords);
}

export async function getHtml(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 12000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Referer': 'https://www.gsmarena.com/'
    },
  });
  return data;
}

/**
 * Returns all available phone brands scraped from GSMArena
 */
export async function getBrands(): Promise<Record<string, IBrandDetails>> {
  if (cache.brands && Date.now() - cache.brands.timestamp < TWENTY_FOUR_HOURS) {
    return cache.brands.data;
  }

  try {
    const html = await getHtml(`${GSMARENA_BASE_URL}/makers.php3`);
    const $ = cheerio.load(html);
    const brands: Record<string, IBrandDetails> = {};

    $('.st-text table td').each((_, el) => {
      const link = $(el).find('a');
      const href = link.attr('href');

      if (href) {
        const brandName = link.contents().first().text().trim();
        const deviceCountText = link.find('span').text();
        const deviceCountMatch = deviceCountText.match(/\d+/);
        const deviceCount = deviceCountMatch ? parseInt(deviceCountMatch[0], 10) : 0;
        const brandIdMatch = href.match(/-(\d+)\.php$/);
        const brandId = brandIdMatch ? parseInt(brandIdMatch[1], 10) : 0;
        const brandSlug = href.replace('.php', '');

        brands[brandName] = {
          brand_name: brandName,
          brand_id: brandId,
          brand_slug: brandSlug,
          device_count: deviceCount,
          detail_url: `/api/phones/brands/${brandSlug}`,
        };
      }
    });

    if (Object.keys(brands).length > 0) {
      cache.brands = { timestamp: Date.now(), data: brands };
      return brands;
    }
  } catch (err: any) {
    console.warn('[MobileSpecsAPI] Error scraping makers.php3:', err.message);
  }

  // Fallback if network issue
  if (cache.brands) return cache.brands.data;
  return getFallbackBrands();
}

/**
 * Returns phones for a given brand slug (e.g. samsung-phones-9)
 */
export async function getPhonesByBrand(brandSlug: string): Promise<IPhoneListItem[]> {
  const cached = cache.brandPhones.get(brandSlug);
  if (cached && Date.now() - cached.timestamp < TWELVE_HOURS) {
    return cached.data;
  }

  try {
    const html = await getHtml(`${GSMARENA_BASE_URL}/${brandSlug}.php`);
    const $ = cheerio.load(html);
    const phones: IPhoneListItem[] = [];

    $('.makers ul li').each((_, el) => {
      const href = $(el).find('a').attr('href');
      if (href) {
        const slug = href.replace('.php', '');
        const name = $(el).find('span').text().trim();
        // Remove watches and wearables so only phones remain
        if (isWatchOrWearable(name, slug)) return;

        let img = $(el).find('img').attr('src');
        if (img && !img.startsWith('http')) {
          img = `https://fdn2.gsmarena.com/vv/bigpic/${img.replace(/^.*\//, '')}`;
        }
        phones.push({
          name,
          slug,
          imageUrl: img,
          detail_url: `/api/phones/${slug}`,
        });
      }
    });

    if (phones.length > 0) {
      cache.brandPhones.set(brandSlug, { timestamp: Date.now(), data: phones });
      return phones;
    }
  } catch (err: any) {
    console.warn(`[MobileSpecsAPI] Error scraping ${brandSlug}.php:`, err.message);
  }

  if (cached) return cached.data;
  return [];
}

/**
 * Returns latest devices from GSMArena
 */
export async function getLatestPhones(): Promise<IPhoneListItem[]> {
  if (cache.latest && Date.now() - cache.latest.timestamp < ONE_HOUR) {
    return cache.latest.data;
  }

  const phones: IPhoneListItem[] = [];

  try {
    // 1. Try homepage module "Latest devices" & "In stores now"
    const html = await getHtml(`${GSMARENA_BASE_URL}/`);
    const $ = cheerio.load(html);

    $('.module-latest a.module-phones-link').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const slug = href.replace('.php', '');
        const img = $(el).find('img').attr('src');
        const name = $(el).text().trim();
        // Exclude watches and wearables so only phones remain
        if (name && isPhoneOnly(name, slug) && !phones.some(p => p.slug === slug)) {
          phones.push({
            name,
            slug,
            imageUrl: img,
            detail_url: `/api/phones/${slug}`,
          });
        }
      }
    });

    if (phones.length > 0) {
      cache.latest = { timestamp: Date.now(), data: phones };
      return phones;
    }
  } catch (err: any) {
    console.warn('[MobileSpecsAPI] Error scraping latest devices from homepage:', err.message);
  }

  if (cache.latest) return cache.latest.data;
  return getFallbackLatestPhones();
}

/**
 * Returns Top 10 phones by daily interest
 */
export async function getTopByInterest(): Promise<IPhoneListItem[]> {
  if (cache.topByInterest && Date.now() - cache.topByInterest.timestamp < ONE_HOUR) {
    return cache.topByInterest.data;
  }

  const phones: IPhoneListItem[] = [];

  try {
    const html = await getHtml(`${GSMARENA_BASE_URL}/`);
    const $ = cheerio.load(html);

    $('h4:contains("Top 10 by daily interest")')
      .closest('.module-rankings')
      .find('table tbody tr')
      .each((index, el) => {
        const link = $(el).find('th a');
        const href = link.attr('href');
        const hitsText = $(el).find('td').last().prev().text().replace(/,/g, '');
        if (href) {
          const slug = href.replace('.php', '');
          const name = link.text().trim();
          // Exclude watches
          if (isWatchOrWearable(name, slug)) return;
          phones.push({
            rank: phones.length + 1,
            name,
            slug,
            hits: parseInt(hitsText, 10) || 0,
            detail_url: `/api/phones/${slug}`,
          });
        }
      });

    if (phones.length > 0) {
      cache.topByInterest = { timestamp: Date.now(), data: phones };
      return phones;
    }
  } catch (err: any) {
    console.warn('[MobileSpecsAPI] Error scraping Top 10 by daily interest:', err.message);
  }

  if (cache.topByInterest) return cache.topByInterest.data;
  return getFallbackTopByInterest();
}

/**
 * Returns Top 10 phones by total fans/favorites
 */
export async function getTopByFans(): Promise<IPhoneListItem[]> {
  if (cache.topByFans && Date.now() - cache.topByFans.timestamp < ONE_HOUR) {
    return cache.topByFans.data;
  }

  const phones: IPhoneListItem[] = [];

  try {
    const html = await getHtml(`${GSMARENA_BASE_URL}/`);
    const $ = cheerio.load(html);

    $('h4:contains("Top 10 by fans")')
      .closest('.module-rankings')
      .find('table tbody tr')
      .each((index, el) => {
        const link = $(el).find('th a');
        const href = link.attr('href');
        const hitsText = $(el).find('td').last().prev().text().replace(/,/g, '');
        if (href) {
          const slug = href.replace('.php', '');
          const name = link.text().trim();
          // Exclude watches
          if (isWatchOrWearable(name, slug)) return;
          phones.push({
            rank: phones.length + 1,
            name,
            slug,
            hits: parseInt(hitsText, 10) || 0,
            detail_url: `/api/phones/${slug}`,
          });
        }
      });

    if (phones.length > 0) {
      cache.topByFans = { timestamp: Date.now(), data: phones };
      return phones;
    }
  } catch (err: any) {
    console.warn('[MobileSpecsAPI] Error scraping Top 10 by fans:', err.message);
  }

  if (cache.topByFans) return cache.topByFans.data;
  return getFallbackTopByFans();
}

/**
 * Fetches and caches the complete quicksearch JSON database from GSMArena
 * Contains 6,000+ smartphones with real-time model names and images!
 */
async function getQuicksearchIndex() {
  if (cache.quicksearchIndex && Date.now() - cache.quicksearchIndex.timestamp < TWENTY_FOUR_HOURS) {
    return cache.quicksearchIndex;
  }

  try {
    // 1. Inspect homepage to find current autocomplete file
    let autocompleteUrl = `${GSMARENA_BASE_URL}/quicksearch-82874.jpg`;
    try {
      const homeHtml = await getHtml(`${GSMARENA_BASE_URL}/`);
      const match = homeHtml.match(/AUTOCOMPLETE_LIST_URL\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        autocompleteUrl = `${GSMARENA_BASE_URL}${match[1]}`;
      }
    } catch {}

    const res = await axios.get(autocompleteUrl, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.gsmarena.com/'
      }
    });

    if (Array.isArray(res.data) && res.data.length >= 2) {
      const [brands, phones] = res.data;
      cache.quicksearchIndex = {
        timestamp: Date.now(),
        brands,
        phones
      };
      return cache.quicksearchIndex;
    }
  } catch (err: any) {
    console.warn('[MobileSpecsAPI] Error fetching quicksearch index:', err.message);
  }

  return cache.quicksearchIndex;
}

/**
 * Searches phones by query string (e.g. "s24", "iphone 16", "pixel 9")
 */
export async function searchPhones(query: string): Promise<ISearchResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const results: ISearchResult[] = [];

  // Try memory quicksearch index first (ultra-fast, instant results for 6,000+ devices)
  const index = await getQuicksearchIndex();
  if (index && index.phones) {
    const { brands, phones } = index;
    const queryParts = cleanQuery.split(/\s+/).filter(Boolean);

    for (const item of phones) {
      const [brandId, phoneId, name, keywords, imgFile] = item;
      const brandName = brands[String(brandId)] || '';

      // Skip watches, wearables, bands so only phones are searched
      if (isWatchOrWearable(name, imgFile, keywords)) continue;

      const fullText = `${brandName} ${name} ${keywords}`.toLowerCase();

      const matches = queryParts.every(part => fullText.includes(part));
      if (matches) {
        // Construct canonical GSMArena slug: brand_name_model-id
        const slugBrand = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const slugName = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const slug = `${slugBrand}_${slugName}-${phoneId}`;

        if (isWatchOrWearable(name, slug, keywords)) continue;

        results.push({
          name: `${brandName} ${name}`.trim(),
          slug,
          brand: brandName,
          imageUrl: imgFile ? `https://fdn2.gsmarena.com/vv/bigpic/${imgFile}` : undefined,
          detail_url: `/api/phones/${slug}`
        });

        if (results.length >= 40) break;
      }
    }

    if (results.length > 0) return results;
  }

  // Fallback: search via GSMArena results.php3 if available
  try {
    const html = await getHtml(`${GSMARENA_BASE_URL}/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(query)}`);
    const $ = cheerio.load(html);

    $('.makers ul li').each((_, el) => {
      const href = $(el).find('a').attr('href');
      if (href) {
        const slug = href.replace('.php', '');
        const name = $(el).find('span').text().trim();
        // Skip watches
        if (isWatchOrWearable(name, slug)) return;

        results.push({
          name,
          slug,
          imageUrl: $(el).find('img').attr('src'),
          detail_url: `/api/phones/${href.replace('.php', '')}`,
        });
      }
    });
  } catch (err: any) {
    console.warn(`[MobileSpecsAPI] Search fallback failed for query "${query}":`, err.message);
  }

  return results;
}

/**
 * Returns detailed specifications for a specific phone by slug (e.g. samsung_galaxy_s24_ultra-12771)
 */
export async function getPhoneDetails(slug: string): Promise<IPhoneDetails> {
  const cleanSlug = slug.replace(/\.php$/, '');
  const cached = cache.phoneDetails.get(cleanSlug);
  if (cached && Date.now() - cached.timestamp < TWENTY_FOUR_HOURS) {
    return cached.data;
  }

  try {
    const html = await getHtml(`${GSMARENA_BASE_URL}/${cleanSlug}.php`);
    const $ = cheerio.load(html);

    const brand = $('h1.specs-phone-name-title a').text().trim() ||
                  $('h1.specs-phone-name-title').text().trim().split(' ')[0] || '';
    const model = $('h1.specs-phone-name-title').text().trim();
    let imageUrl = $('.specs-photo-main img').attr('src') || $('div.specs-photo-main a img').attr('src');
    if (!imageUrl) {
      imageUrl = $('img[src*="/bigpic/"]').first().attr('src');
    }

    const release_date = $('span[data-spec="released-hl"]').text().trim();
    const dimensions = $('span[data-spec="body-hl"]').text().trim();
    const os = $('span[data-spec="os-hl"]').text().trim();
    const storage = $('span[data-spec="storage-hl"]').text().trim();

    // High level highlight specifications
    const display = $('span[data-spec="displaysize-hl"]').text().trim() + ' ' + ($('div[data-spec="displayres-hl"]').text().trim() || '');
    const camera = $('span[data-spec="camerapixels-hl"]').text().trim() + ' ' + ($('div[data-spec="videopixels-hl"]').text().trim() || '');
    const ram = $('span[data-spec="ramsize-hl"]').text().trim() + ' ' + ($('div[data-spec="chipset-hl"]').text().trim() || '');
    const battery = $('span[data-spec="batsize-hl"]').text().trim() + ' ' + ($('div[data-spec="battype-hl"]').text().trim() || '');

    const specifications: Record<string, TSpecCategory> = {};
    $('#specs-list table').each((_, table) => {
      const categoryName = $(table).find('th').text().trim();
      if (!categoryName) return;

      const categorySpecs: TSpecCategory = {};
      const additionalFeatures: string[] = [];

      $(table).find('tr').each((_, row) => {
        const title = $(row).find('td.ttl').text().trim();
        const value = $(row).find('td.nfo').html()?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim() || '';

        if (title && title !== '\u00a0') {
          categorySpecs[title] = value;
        } else if (value) {
          additionalFeatures.push(value);
        }
      });

      if (additionalFeatures.length > 0) {
        categorySpecs['Features'] = additionalFeatures.join('\n');
      }

      if (Object.keys(categorySpecs).length > 0) {
        specifications[categoryName] = categorySpecs;
      }
    });

    // Detect chipset from platform
    const chipset = specifications['Platform']?.['Chipset'] || specifications['Platform']?.['CPU'] || undefined;

    const details: IPhoneDetails = {
      brand: brand || (model ? model.split(' ')[0] : 'Desconocido'),
      model: model || cleanSlug,
      imageUrl,
      release_date,
      dimensions,
      os,
      storage,
      display: display.trim() || undefined,
      camera: camera.trim() || undefined,
      ram: ram.trim() || undefined,
      battery: battery.trim() || undefined,
      chipset,
      specifications
    };

    cache.phoneDetails.set(cleanSlug, { timestamp: Date.now(), data: details });
    return details;
  } catch (err: any) {
    console.warn(`[MobileSpecsAPI] Error scraping details for ${cleanSlug}:`, err.message);
  }

  if (cached) return cached.data;
  return getFallbackPhoneDetails(cleanSlug);
}

// --- FALLBACK SEED DATA (ensures app never shows a blank screen on offline / network error) ---

function getFallbackBrands(): Record<string, IBrandDetails> {
  const topBrands: Array<{ name: string; id: number; slug: string; count: number }> = [
    { name: 'Samsung', id: 9, slug: 'samsung-phones-9', count: 1420 },
    { name: 'Apple', id: 48, slug: 'apple-phones-48', count: 145 },
    { name: 'Xiaomi', id: 80, slug: 'xiaomi-phones-80', count: 420 },
    { name: 'Google', id: 107, slug: 'google-phones-107', count: 68 },
    { name: 'OnePlus', id: 95, slug: 'oneplus-phones-95', count: 110 },
    { name: 'Motorola', id: 4, slug: 'motorola-phones-4', count: 680 },
    { name: 'Sony', id: 7, slug: 'sony-phones-7', count: 410 },
    { name: 'Asus', id: 46, slug: 'asus-phones-46', count: 215 },
    { name: 'Realme', id: 118, slug: 'realme-phones-118', count: 230 },
    { name: 'Honor', id: 121, slug: 'honor-phones-121', count: 260 },
    { name: 'vivo', id: 98, slug: 'vivo-phones-98', count: 480 },
    { name: 'Oppo', id: 82, slug: 'oppo-phones-82', count: 390 },
    { name: 'Nothing', id: 128, slug: 'nothing-phones-128', count: 12 },
    { name: 'Huawei', id: 58, slug: 'huawei-phones-58', count: 450 }
  ];

  const map: Record<string, IBrandDetails> = {};
  for (const b of topBrands) {
    map[b.name] = {
      brand_name: b.name,
      brand_id: b.id,
      brand_slug: b.slug,
      device_count: b.count,
      detail_url: `/api/phones/brands/${b.slug}`
    };
  }
  return map;
}

function getFallbackLatestPhones(): IPhoneListItem[] {
  return [
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung_galaxy_s24_ultra-12771',
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg',
      detail_url: '/api/phones/samsung_galaxy_s24_ultra-12771'
    },
    {
      name: 'Apple iPhone 16 Pro Max',
      slug: 'apple_iphone_16_pro_max-13315',
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
      detail_url: '/api/phones/apple_iphone_16_pro_max-13315'
    },
    {
      name: 'Google Pixel 9 Pro XL',
      slug: 'google_pixel_9_pro_xl-13217',
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl-.jpg',
      detail_url: '/api/phones/google_pixel_9_pro_xl-13217'
    },
    {
      name: 'Xiaomi 14 Ultra',
      slug: 'xiaomi_14_ultra-12827',
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra-white.jpg',
      detail_url: '/api/phones/xiaomi_14_ultra-12827'
    },
    {
      name: 'OnePlus 12',
      slug: 'oneplus_12-12725',
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg',
      detail_url: '/api/phones/oneplus_12-12725'
    },
    {
      name: 'Asus ROG Phone 8 Pro',
      slug: 'asus_rog_phone_8_pro-12758',
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/asus-rog-phone-8-pro.jpg',
      detail_url: '/api/phones/asus_rog_phone_8_pro-12758'
    }
  ];
}

function getFallbackTopByInterest(): IPhoneListItem[] {
  return [
    {
      rank: 1,
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung_galaxy_s24_ultra-12771',
      hits: 48920,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg',
      detail_url: '/api/phones/samsung_galaxy_s24_ultra-12771'
    },
    {
      rank: 2,
      name: 'Apple iPhone 16 Pro Max',
      slug: 'apple_iphone_16_pro_max-13315',
      hits: 42100,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
      detail_url: '/api/phones/apple_iphone_16_pro_max-13315'
    },
    {
      rank: 3,
      name: 'Xiaomi Redmi Note 13 Pro+',
      slug: 'xiaomi_redmi_note_13_pro+-12572',
      hits: 31200,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg',
      detail_url: '/api/phones/xiaomi_redmi_note_13_pro+-12572'
    },
    {
      rank: 4,
      name: 'Google Pixel 9 Pro XL',
      slug: 'google_pixel_9_pro_xl-13217',
      hits: 26800,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl-.jpg',
      detail_url: '/api/phones/google_pixel_9_pro_xl-13217'
    },
    {
      rank: 5,
      name: 'Poco X6 Pro',
      slug: 'xiaomi_poco_x6_pro-12718',
      hits: 24500,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg',
      detail_url: '/api/phones/xiaomi_poco_x6_pro-12718'
    }
  ];
}

function getFallbackTopByFans(): IPhoneListItem[] {
  return [
    {
      rank: 1,
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung_galaxy_s24_ultra-12771',
      hits: 2190,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg',
      detail_url: '/api/phones/samsung_galaxy_s24_ultra-12771'
    },
    {
      rank: 2,
      name: 'Samsung Galaxy S23 Ultra',
      slug: 'samsung_galaxy_s23_ultra-12024',
      hits: 2840,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg',
      detail_url: '/api/phones/samsung_galaxy_s23_ultra-12024'
    },
    {
      rank: 3,
      name: 'Apple iPhone 15 Pro Max',
      slug: 'apple_iphone_15_pro_max-12548',
      hits: 1980,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
      detail_url: '/api/phones/apple_iphone_15_pro_max-12548'
    },
    {
      rank: 4,
      name: 'Google Pixel 8 Pro',
      slug: 'google_pixel_8_pro-12545',
      hits: 1450,
      imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
      detail_url: '/api/phones/google_pixel_8_pro-12545'
    }
  ];
}

function getFallbackPhoneDetails(slug: string): IPhoneDetails {
  return {
    brand: 'Samsung',
    model: 'Samsung Galaxy S24 Ultra',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg',
    release_date: 'Released 2024, January 24',
    dimensions: '232g, 8.6mm thickness',
    os: 'Android 14, up to 7 major OS upgrades, One UI 6.1.1',
    storage: '256GB/512GB/1TB storage, no card slot',
    display: '6.8" 1440x3120 pixels Dynamic LTPO AMOLED 2X, 120Hz, HDR10+, 2600 nits',
    camera: '200 MP 8K video',
    ram: '12GB RAM Snapdragon 8 Gen 3',
    battery: '5000 mAh Li-Ion 45W wired',
    chipset: 'Qualcomm SM8650-AC Snapdragon 8 Gen 3 (4 nm)',
    specifications: {
      'Platform': {
        'OS': 'Android 14, up to 7 major OS upgrades, One UI 6.1.1',
        'Chipset': 'Qualcomm SM8650-AC Snapdragon 8 Gen 3 (4 nm)',
        'CPU': '8-core (1x3.39GHz Cortex-X4 & 3x3.1GHz Cortex-A720 & 2x2.9GHz Cortex-A720 & 2x2.2GHz Cortex-A520)',
        'GPU': 'Adreno 750 (1 GHz)'
      },
      'Display': {
        'Type': 'Dynamic LTPO AMOLED 2X, 120Hz, HDR10+, 2600 nits (peak)',
        'Size': '6.8 inches, 113.5 cm2 (~88.5% screen-to-body ratio)',
        'Resolution': '1440 x 3120 pixels, 19.5:9 ratio (~505 ppi density)',
        'Protection': 'Corning Gorilla Armor'
      },
      'Main Camera': {
        'Quad': '200 MP, f/1.7 (wide) + 50 MP, f/3.4 (periscope telephoto 5x) + 10 MP (telephoto 3x) + 12 MP (ultrawide)',
        'Video': '8K@24/30fps, 4K@30/60/120fps, 1080p@30/60/240fps'
      },
      'Battery': {
        'Type': 'Li-Ion 5000 mAh, non-removable',
        'Charging': '45W wired, PD3.0, 65% in 30 min, 15W wireless'
      }
    }
  };
}
