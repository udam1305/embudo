import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './serverApp';

const PORT = 3000;

async function startServer() {
  // Vite dev server or static production files
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
