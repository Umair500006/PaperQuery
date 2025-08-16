import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';

export function serveClient() {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  const indexHtml = path.join(clientDist, 'index.html');

  const router = express.Router();

  if (fs.existsSync(clientDist)) {
    router.use(express.static(clientDist, {
      index: false,
      setHeaders: (res, filePath) => {
        if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    router.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      if (fs.existsSync(indexHtml)) {
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(indexHtml);
      }
      return next();
    });
  }

  return router;
}
