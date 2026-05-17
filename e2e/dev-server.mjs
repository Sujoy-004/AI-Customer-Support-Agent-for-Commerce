import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const STATIC_DIR = path.resolve(__dirname, '../shopify-widget');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;

  // Strip query params for path resolution
  const cleanPath = urlPath.split('?')[0];
  let filePath = path.join(STATIC_DIR, cleanPath);

  // If no extension, try .js
  if (!path.extname(filePath)) {
    const jsPath = filePath + '.js';
    if (fs.existsSync(jsPath)) {
      filePath = jsPath;
    }
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(`404 - ${urlPath} not found`);
      console.log(`404: ${urlPath}`);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    console.log(`200: ${urlPath}`);
  });
});

server.listen(PORT, () => {
  console.log(`Serving ${STATIC_DIR} on http://localhost:${PORT}`);
});
