import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import QRCode from 'qrcode';
import { mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import config from './config.js';

const AUTH_DIR   = './data/wa-auth';
const REDIS_KEY  = 'wa-auth';
const REDIS_URL  = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

mkdirSync(AUTH_DIR, { recursive: true });

const logger = P({ level: 'silent' });

let activeSock   = null;
let isConnected  = false;
let isConnecting = false;
let qrChannel    = null;

// ── Redis helpers ─────────────────────────────────────────────────────────────

async function saveAuthToRedis() {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  try {
    const files = {};
    for (const f of readdirSync(AUTH_DIR)) {
      files[f] = readFileSync(join(AUTH_DIR, f), 'utf8');
    }
    await fetch(`${REDIS_URL}/set/${REDIS_KEY}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.stringify(files)),
    });
  } catch (err) {
    console.error('Redis save error:', err.message);
  }
}

export async function restoreAuthFromRedis() {
  if (!REDIS_URL || !REDIS_TOKEN) return false;
  try {
    const res = await fetch(`${REDIS_URL}/get/${REDIS_KEY}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const { result } = await res.json();
    if (!result) return false;
    const files = JSON.parse(result);
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(AUTH_DIR, name), content);
    }
    console.log('WhatsApp auth restored from Redis');
    return true;
  } catch (err) {
    console.error('Redis restore error:', err.message);
    return false;
  }
}

// ── Session check ─────────────────────────────────────────────────────────────

export function hasSavedSession() {
  try {
    return readdirSync(AUTH_DIR).some(f => f.includes('creds'));
  } catch {
    return false;
  }
}

// ── Connection ────────────────────────────────────────────────────────────────

export function getConnectionStatus() { return isConnected; }
export function setQRChannel(channel) { qrChannel = channel; }

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
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      keepAliveIntervalMs: 10_000,
      connectTimeoutMs: 60_000,
    });

    activeSock = sock;

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      await saveAuthToRedis(); // persist to Redis after every credential update
    });

    sock.ev.on('connection.update', async (update) => {
      if (sock !== activeSock) return;

      const { connection, lastDisconnect, qr } = update;

      if (qr && qrChannel) {
        try {
          const buf = await QRCode.toBuffer(qr, { type: 'png', width: 300, margin: 2 });
          await qrChannel.send({
            content: 'Scan this QR code with WhatsApp to connect:',
            files: [{ attachment: buf, name: 'qr.png' }],
          });
        } catch (err) {
          console.error('QR error:', err.message);
        }
      }

      if (connection === 'open') {
        isConnected  = true;
        isConnecting = false;
        console.log('WhatsApp connected');
        await saveAuthToRedis(); // save immediately on connect
        if (qrChannel) {
          await qrChannel.send('WhatsApp connected and ready.').catch(() => {});
          qrChannel = null;
        }
      }

      if (connection === 'close') {
        isConnected  = false;
        isConnecting = false;
        const code      = lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode : 0;
        const loggedOut = code === DisconnectReason.loggedOut;

        console.log(`WhatsApp closed (code ${code})${loggedOut ? ' — logged out' : ' — reconnecting'}`);
        if (!loggedOut) setTimeout(connect, 5_000);
      }
    });

  } catch (err) {
    isConnecting = false;
    console.error('WhatsApp connect error:', err.message);
    setTimeout(connect, 10_000);
  }
}

export async function initWhatsApp(channel) {
  if (channel) qrChannel = channel;
  if (isConnected || isConnecting) return;
  await connect();
}

export async function sendWhatsAppMessage(phone, lead) {
  if (!isConnected || !activeSock) throw new Error('WhatsApp not connected — use `!waconnect` first');

  const digits = phone.replace(/\D/g, '');
  const jid    = `${digits}@s.whatsapp.net`;

  const text = config.messageTemplate
    .replace(/\{name\}/g,     lead.name)
    .replace(/\{category\}/g, lead.category || 'business')
    .replace(/\{address\}/g,  lead.address  || '');

  await activeSock.sendMessage(jid, { text });
}
