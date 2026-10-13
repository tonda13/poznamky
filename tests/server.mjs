// Minimal static server for Playwright tests (serves the repository root).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const port = Number(process.env.PORT) || 4173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    try {
        const body = await readFile(join(root, path === '/' ? 'index.html' : path));
        res.writeHead(200, { 'Content-Type': types[extname(path)] || 'text/html; charset=utf-8' });
        res.end(body);
    } catch {
        res.writeHead(404);
        res.end('Not found');
    }
}).listen(port);
