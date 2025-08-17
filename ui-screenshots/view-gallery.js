const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIRECTORY = __dirname;

const server = http.createServer((req, res) => {
  let filePath = path.join(DIRECTORY, req.url === '/' ? 'index.html' : req.url);
  
  const extname = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.css': 'text/css',
    '.js': 'text/javascript'
  }[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     🖼️  UI Gallery Server Running!              ║
╠════════════════════════════════════════════════╣
║                                                ║
║  View the gallery at:                         ║
║  👉 http://localhost:${PORT}                     ║
║                                                ║
║  Press Ctrl+C to stop the server              ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});