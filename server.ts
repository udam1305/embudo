import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_CPUS,
  INITIAL_GPUS,
  INITIAL_RAMS,
  INITIAL_STORAGES,
  INITIAL_SOCS,
  INITIAL_PREBUILTS,
  INITIAL_ADMIN_STATS
} from './src/data/initialData';
import { calculateBottleneck, calculateMobileDiagnostic } from './src/lib/calculatorEngine';
import { CPU, GPU, MobileSoC } from './src/types';
import {
  getAllComponents,
  getBuildCoresStatus,
  searchComponents,
  triggerBuildCoresSync
} from './server/buildcoresLoader';
import {
  getBrands,
  getPhonesByBrand,
  getLatestPhones,
  getTopByInterest,
  getTopByFans,
  searchPhones,
  getPhoneDetails
} from './server/mobileSpecsService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory dynamic databases that update seamlessly without downtime
let cpus = [...INITIAL_CPUS];
let gpus = [...INITIAL_GPUS];
let rams = [...INITIAL_RAMS];
let storages = [...INITIAL_STORAGES];
let socs = [...INITIAL_SOCS];
let prebuilts = [...INITIAL_PREBUILTS];
let stats = { ...INITIAL_ADMIN_STATS };

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'embudo-admin-2026';

// Middleware for Admin authentication
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];

  if (adminKey === ADMIN_SECRET_KEY || (authHeader && authHeader === `Bearer ${ADMIN_SECRET_KEY}`)) {
    return next();
  }

  res.status(401).json({ error: 'Acceso no autorizado. Se requieren credenciales de administrador.' });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Embudo Core Engine',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // 1. Get all hardware components (Integrated with BuildCores Open DB)
  app.get('/api/components/all', (req: Request, res: Response) => {
    const all = getAllComponents();
    res.json({
      cpus: all.cpus,
      gpus: all.gpus,
      motherboards: all.motherboards,
      psus: all.psus,
      rams: all.rams,
      storages: all.storages,
      socs: all.socs,
      metadata: all.metadata,
      timestamp: Date.now()
    });
  });

  // BuildCores sync status & metadata
  app.get('/api/buildcores/status', (req: Request, res: Response) => {
    res.json(getBuildCoresStatus());
  });

  // Trigger automatic/manual sync from GitHub repository
  app.post('/api/buildcores/sync', async (req: Request, res: Response) => {
    try {
      const result = await triggerBuildCoresSync();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Error en sincronización' });
    }
  });

  // Search through 20,000+ components on demand
  app.get('/api/components/search', (req: Request, res: Response) => {
    const { category, q, limit } = req.query;
    const results = searchComponents(
      String(category || 'cpus'),
      String(q || ''),
      limit ? parseInt(String(limit)) : 50
    );
    res.json({ success: true, count: results.length, results });
  });

  // 2. Bottleneck calculation endpoint
  app.post('/api/calculate/bottleneck', (req: Request, res: Response) => {
    try {
      const config = req.body;
      if (!config || !config.cpu || !config.gpu || !config.ram || !config.storage) {
        return res.status(400).json({ error: 'Configuración de componentes incompleta' });
      }

      const result = calculateBottleneck(config);

      // Increment live statistics
      stats.totalDiagnosesRun += 1;
      const cpuStat = stats.topCpusQueried.find(c => c.name === config.cpu.name);
      if (cpuStat) cpuStat.count += 1;
      else stats.topCpusQueried.push({ name: config.cpu.name, count: 1 });

      const gpuStat = stats.topGpusQueried.find(g => g.name === config.gpu.name);
      if (gpuStat) gpuStat.count += 1;
      else stats.topGpusQueried.push({ name: config.gpu.name, count: 1 });

      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Error calculating bottleneck:', err);
      res.status(500).json({ error: 'Error interno en el motor de cálculo' });
    }
  });

  // 3. Mobile SoC calculation endpoint
  app.post('/api/calculate/mobile', (req: Request, res: Response) => {
    try {
      const { soc, usageProfile } = req.body;
      if (!soc) {
        return res.status(400).json({ error: 'SoC no especificado' });
      }
      const result = calculateMobileDiagnostic(soc, usageProfile || 'gaming_hardcore');

      const socStat = stats.topMobileSocQueried.find(s => s.name === soc.name);
      if (socStat) socStat.count += 1;
      else stats.topMobileSocQueried.push({ name: soc.name, count: 1 });

      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al evaluar procesador móvil' });
    }
  });

  // --- MOBILE SPECS API (RevengerNick/mobile-specs-api integration) ---
  // API Info & Endpoints documentation
  app.get('/api/phones/info', (req: Request, res: Response) => {
    res.json({
      status: true,
      service: 'Mobile Specs API (GSMArena Scraper Engine)',
      repository: 'https://github.com/RevengerNick/mobile-specs-api',
      endpoints: [
        { method: 'GET', path: '/api/phones/brands', description: 'List of all phone brands' },
        { method: 'GET', path: '/api/phones/brands/:brandSlug', description: 'List of phones for brand slug' },
        { method: 'GET', path: '/api/phones/latest', description: 'Latest released smartphones' },
        { method: 'GET', path: '/api/phones/top-by-interest', description: 'Top 10 smartphones by daily interest' },
        { method: 'GET', path: '/api/phones/top-by-fans', description: 'Top 10 smartphones by total fans' },
        { method: 'GET', path: '/api/phones/search?query=:q', description: 'Search smartphones across 6,000+ devices' },
        { method: 'GET', path: '/api/phones/details/:slug', description: 'Complete technical specifications of a phone' }
      ]
    });
  });

  // 1. All brands
  app.get('/api/phones/brands', async (req: Request, res: Response) => {
    try {
      const data = await getBrands();
      res.json({ status: true, data });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err?.message || 'Error al obtener marcas' });
    }
  });

  // 2. Phones by brand
  app.get('/api/phones/brands/:brandSlug', async (req: Request, res: Response) => {
    try {
      const { brandSlug } = req.params;
      const data = await getPhonesByBrand(brandSlug);
      res.json({ status: true, data });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err?.message || 'Error al obtener teléfonos por marca' });
    }
  });

  // 3. Latest devices
  app.get('/api/phones/latest', async (req: Request, res: Response) => {
    try {
      const data = await getLatestPhones();
      res.json({ status: true, data });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err?.message || 'Error al obtener últimos dispositivos' });
    }
  });

  // 4. Top 10 by daily interest
  app.get('/api/phones/top-by-interest', async (req: Request, res: Response) => {
    try {
      const data = await getTopByInterest();
      res.json({ status: true, data });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err?.message || 'Error al obtener top por interés' });
    }
  });

  // 5. Top 10 by fans
  app.get('/api/phones/top-by-fans', async (req: Request, res: Response) => {
    try {
      const data = await getTopByFans();
      res.json({ status: true, data });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err?.message || 'Error al obtener top por fans' });
    }
  });

  // 6. Search phones
  app.get('/api/phones/search', async (req: Request, res: Response) => {
    try {
      const query = (req.query.query || req.query.q || '') as string;
      if (!query || !query.trim()) {
        return res.status(400).json({ status: false, error: 'Query parameter is required' });
      }
      const data = await searchPhones(query);
      res.json({ status: true, data });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err?.message || 'Error en búsqueda de teléfonos' });
    }
  });

  // 7. Phone details
  app.get(['/api/phones/details/:slug', '/api/phones/:slug'], async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const data = await getPhoneDetails(slug);
      res.json({ status: true, data });
    } catch (err: any) {
      res.status(500).json({ status: false, error: err?.message || 'Error al obtener especificaciones del teléfono' });
    }
  });

  // 4. Prebuilt Catalogs
  app.get('/api/catalog', (req: Request, res: Response) => {
    res.json({ prebuilts });
  });

  // 5. Admin Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const all = getAllComponents();
    res.json({
      stats: {
        ...stats,
        totalCpus: all.cpus.length,
        totalGpus: all.gpus.length,
        totalMotherboards: all.motherboards.length,
        totalPsus: all.psus.length,
        totalRams: all.rams.length,
        totalStorages: all.storages.length,
        totalSocs: all.socs.length,
        buildCores: all.metadata
      }
    });
  });

  // 6. Admin Authentication Verification
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === 'admin123' || password === ADMIN_SECRET_KEY || password === 'embudo2026') {
      return res.json({
        success: true,
        token: ADMIN_SECRET_KEY,
        user: { name: 'Administrador Embudo', role: 'admin' }
      });
    }
    res.status(401).json({ success: false, error: 'Contraseña de administrador incorrecta' });
  });

  // 7. Admin CRUD for CPUs (No-Downtime Hot Updates)
  app.post('/api/components/cpu', requireAdminAuth, (req: Request, res: Response) => {
    const newCpu: CPU = req.body;
    if (!newCpu.name || !newCpu.tdp) {
      return res.status(400).json({ error: 'Datos de CPU inválidos' });
    }
    const id = newCpu.id || `cpu-${Date.now()}`;
    const cpuEntry = { ...newCpu, id };
    const existingIndex = cpus.findIndex(c => c.id === id || c.name.toLowerCase() === newCpu.name.toLowerCase());
    if (existingIndex >= 0) {
      cpus[existingIndex] = cpuEntry;
    } else {
      cpus.unshift(cpuEntry);
    }
    stats.lastDatabaseUpdate = new Date().toISOString().split('T')[0] + ' (Hot-update aplicada)';
    res.json({ success: true, message: 'CPU guardado correctamente en la base de datos', cpu: cpuEntry });
  });

  app.delete('/api/components/cpu/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    cpus = cpus.filter(c => c.id !== id);
    res.json({ success: true, message: 'CPU eliminado' });
  });

  // 8. Admin CRUD for GPUs
  app.post('/api/components/gpu', requireAdminAuth, (req: Request, res: Response) => {
    const newGpu: GPU = req.body;
    if (!newGpu.name || !newGpu.vram) {
      return res.status(400).json({ error: 'Datos de GPU inválidos' });
    }
    const id = newGpu.id || `gpu-${Date.now()}`;
    const gpuEntry = { ...newGpu, id };
    const existingIndex = gpus.findIndex(g => g.id === id || g.name.toLowerCase() === newGpu.name.toLowerCase());
    if (existingIndex >= 0) {
      gpus[existingIndex] = gpuEntry;
    } else {
      gpus.unshift(gpuEntry);
    }
    stats.lastDatabaseUpdate = new Date().toISOString().split('T')[0] + ' (Hot-update aplicada)';
    res.json({ success: true, message: 'GPU guardada correctamente en la base de datos', gpu: gpuEntry });
  });

  app.delete('/api/components/gpu/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    gpus = gpus.filter(g => g.id !== id);
    res.json({ success: true, message: 'GPU eliminada' });
  });

  // 9. Admin CRUD for Mobile SoCs
  app.post('/api/components/soc', requireAdminAuth, (req: Request, res: Response) => {
    const newSoc: MobileSoC = req.body;
    if (!newSoc.name || !newSoc.manufacturer) {
      return res.status(400).json({ error: 'Datos de SoC inválidos' });
    }
    const id = newSoc.id || `soc-${Date.now()}`;
    const socEntry = { ...newSoc, id };
    const existingIndex = socs.findIndex(s => s.id === id || s.name.toLowerCase() === newSoc.name.toLowerCase());
    if (existingIndex >= 0) {
      socs[existingIndex] = socEntry;
    } else {
      socs.unshift(socEntry);
    }
    stats.lastDatabaseUpdate = new Date().toISOString().split('T')[0] + ' (Hot-update aplicada)';
    res.json({ success: true, message: 'SoC móvil guardado correctamente en la base de datos', soc: socEntry });
  });

  app.delete('/api/components/soc/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    socs = socs.filter(s => s.id !== id);
    res.json({ success: true, message: 'SoC eliminado' });
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Embudo Server] Ejecutándose en el puerto http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start Embudo server:', err);
  process.exit(1);
});
