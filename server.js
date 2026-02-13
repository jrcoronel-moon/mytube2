import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3998;
const CHANNELS_FILE = path.join(__dirname, 'channels.json');

app.use(express.json());

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Channels API
app.get('/api/channels', (req, res) => {
    try {
        if (existsSync(CHANNELS_FILE)) {
            const data = JSON.parse(readFileSync(CHANNELS_FILE, 'utf-8'));
            res.json(data);
        } else {
            res.json(Array(10).fill(''));
        }
    } catch {
        res.json(Array(10).fill(''));
    }
});

app.post('/api/channels', (req, res) => {
    try {
        writeFileSync(CHANNELS_FILE, JSON.stringify(req.body, null, 2));
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// YouTube title via oEmbed (no API key needed)
app.get('/api/title', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.json({ title: '' });
    try {
        const resp = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (resp.ok) {
            const data = await resp.json();
            return res.json({ title: data.title || '' });
        }
        res.json({ title: '' });
    } catch {
        res.json({ title: '' });
    }
});

// Shutdown endpoint
app.post('/api/shutdown', (req, res) => {
    res.json({ message: 'Shutting down...' });
    console.log('Received shutdown signal. Closing server...');
    setTimeout(() => process.exit(0), 500);
});

// Find Chrome/Chromium executable
function findChrome() {
    const candidates = process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : process.platform === 'win32'
        ? [
            `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
            `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
            `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
            `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
          ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
          ];

    return candidates.find(c => existsSync(c)) || null;
}

// Start server
app.listen(PORT, async () => {
    console.log(`MyTube2 running at http://localhost:${PORT}`);

    const url = `http://localhost:${PORT}`;
    const chrome = findChrome();

    if (chrome) {
        const cmd = `"${chrome}" --app=${url} --window-size=1024,700`;
        exec(cmd, (err) => {
            if (err) console.error('Chrome launch error:', err.message);
        });
        console.log('Launched in app mode (minimal UI)');
    } else {
        const open = (await import('open')).default;
        await open(url);
        console.log('Chrome not found, opened in default browser');
    }
});
