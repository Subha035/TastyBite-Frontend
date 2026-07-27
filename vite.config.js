import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bookingQrFilePlugin = () => {
  const writeQrFile = (req, res) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { bookingId, imageBuffer, imageType = 'png' } = JSON.parse(body);

        if (!bookingId || !imageBuffer) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing bookingId or imageBuffer' }));
          return;
        }

        const uploadDir = path.join(__dirname, 'assets', 'table_booking');
        fs.mkdirSync(uploadDir, { recursive: true });

        const extension = imageType === 'jpg' ? 'jpg' : 'png';
        const filePath = path.join(uploadDir, `${bookingId}.${extension}`);
        const buffer = Buffer.from(imageBuffer, 'base64');
        fs.writeFileSync(filePath, buffer);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ savedPath: `assets/table_booking/${bookingId}.${extension}` }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unable to save QR code file.' }));
      }
    });
  };

  return {
    name: 'booking-qr-file-plugin',
    configureServer(server) {
      server.middlewares.use('/api/bookings/qr', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        writeQrFile(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/bookings/qr', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        writeQrFile(req, res);
      });
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), bookingQrFilePlugin()],
});
