import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import QRCode from 'qrcode';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import config from './config.js';

const AUTH_DIR    = './data/wa-auth';
const REDIS_KEY   = 'wa-auth';
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

mkdirSync(AUTH_DIR, { recursive: true });

const logger = P({ level: 'silent' });

let activeSock      = null;
let isConnected     = false;
let isConnecting    = false;
let qrChannel       = null;
let notifyChannel   = null;
let lastQrMessage   = null; // track last QR Discord message so we can replace it

// ── Redis ─────────────────────────────────────────────────────────────────────

async function redisCmd(...args) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([args]),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
  const [{ result, error }] = await res.json();
  if (error) throw new Error(`Redis: ${error}`);
  return result;
}

async function saveAuthToRedis() {
  try {
    const files = {};
    for (const f of readdirSync(AUTH_DIR)) {
      try { files[f] = readFileSync(join(AUTH_DIR, f), 'utf8'); } catch {}
    }
    if (!Object.keys(files).length) return;
    await redisCmd('SET', REDIS_KEY, JSON.stringify(files));
    console.log('Auth saved to Redis');
  } catch (err) {
    console.error('Redis save error:', err.message);
  }
}

async function clearRedisAuth() {
  try { await redisCmd('DEL', REDIS_KEY); } catch {}
}

export async function restoreAuthFromRedis() {
  try {
    const result = await redisCmd('GET', REDIS_KEY);
    if (!result) return false;
    const files = JSON.parse(result);
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(AUTH_DIR, name), content, 'utf8');
    }
    console.log('Auth restored from Redis');
    return true;
  } catch (err) {
    console.error('Redis restore error:', err.message);
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function hasSavedSession() {
  try { return readdirSync(AUTH_DIR).some(f => f.includes('creds')); }
  catch { return false; }
}

export function getConnectionStatus() { return isConnected; }
export function setQRChannel(channel) { qrChannel = channel; }

function clearLocalAuth() {
  try {
    for (const f of readdirSync(AUTH_DIR)) rmSync(join(AUTH_DIR, f));
  } catch {}
}

// ── Connection ────────────────────────────────────────────────────────────────

async function connect() {
  if (isConnecting) return;
  isConnecting = true;
  isConnected  = false;

  if (activeSock) {
    const old = activeSock;
    activeSock = null;
    try { old.end(); } catch {}
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version, auth: state, logger,
      browser: Browsers.macOS('Desktop'),
      printQRInTerminal: false,
      keepAliveIntervalMs: 10_000,
      connectTimeoutMs: 60_000,
    });

    activeSock = sock;

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      await saveAuthToRedis();
    });

    sock.ev.on('connection.update', async (update) => {
      if (sock !== activeSock) return;
      const { connection, lastDisconnect, qr } = update;

      if (qr && qrChannel) {
        try {
          const buf = await QRCode.toBuffer(qr, { type: 'png', width: 300, margin: 2 });
          // Delete the previous QR message so only the latest (valid) one is visible
          if (lastQrMessage) {
            try { await lastQrMessage.delete(); } catch {}
          }
          lastQrMessage = await qrChannel.send({
            content: 'Scan this QR code with WhatsApp (expires in ~20s — a fresh one will appear automatically):',
            files: [{ attachment: buf, name: 'qr.png' }],
          });
        } catch (err) { console.error('QR error:', err.message); }
      }

      if (connection === 'open') {
        isConnected  = true;
        isConnecting = false;
        lastQrMessage = null;
        console.log('WhatsApp connected');
        await saveAuthToRedis();
        if (qrChannel) {
          await qrChannel.send('✅ WhatsApp connected and ready.').catch(() => {});
          notifyChannel = qrChannel;
          qrChannel = null;
        }
      }

      if (connection === 'close') {
        isConnected  = false;
        isConnecting = false;
        const code      = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : 0;
        const loggedOut = code === DisconnectReason.loggedOut;

        console.log(`WhatsApp closed — code ${code} — ${loggedOut ? 'logged out' : 'reconnecting'}`);

        if (loggedOut) {
          clearLocalAuth();
          await clearRedisAuth();
          lastQrMessage = null;
          const ch = notifyChannel;
          if (ch) await ch.send('WhatsApp was logged out by the server. Type `!waconnect` to scan a new QR code.').catch(() => {});
        } else {
          // Notify the QR channel about the failure so the user knows what happened
          if (qrChannel && code) {
            await qrChannel.send(`⚠️ Connection failed (code ${code}) — retrying in 5s...`).catch(() => {});
          }
          setTimeout(connect, 5_000);
        }
      }
    });

  } catch (err) {
    isConnecting = false;
    console.error('WhatsApp connect error:', err.message);
    setTimeout(connect, 10_000);
  }
}

export async function initWhatsApp(channel) {
  if (channel) { qrChannel = channel; notifyChannel = channel; }
  if (isConnected || isConnecting) return;
  await connect();
}

export async function logoutWhatsApp() {
  clearLocalAuth();
  await clearRedisAuth();
  if (activeSock) {
    const sock = activeSock;
    // Null out activeSock BEFORE logout so the connection.update close event
    // is ignored by the per-socket guard and doesn't schedule a reconnect.
    activeSock    = null;
    isConnected   = false;
    isConnecting  = false;
    qrChannel     = null;
    lastQrMessage = null;
    try { await sock.logout(); } catch {}
    try { sock.end(); } catch {}
  } else {
    isConnected   = false;
    isConnecting  = false;
    qrChannel     = null;
    lastQrMessage = null;
  }
}

export async function sendWhatsAppMessage(phone, lead) {
  if (!isConnected || !activeSock) throw new Error('WhatsApp not connected — use `!waconnect` first');
  const digits = phone.replace(/\D/g, '');
  const text = config.messageTemplate
    .replace(/\{name\}/g,     lead.name)
    .replace(/\{category\}/g, lead.category || 'business')
    .replace(/\{address\}/g,  lead.address  || '');
  await activeSock.sendMessage(`${digits}@s.whatsapp.net`, { text });
}
