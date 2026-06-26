import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import QRCode from 'qrcode';
import { mkdirSync } from 'fs';
import config from './config.js';

const AUTH_DIR = './data/wa-auth';
mkdirSync(AUTH_DIR, { recursive: true });

const logger = P({ level: 'silent' });

let activeSock   = null;   // the one socket we actually use
let isConnected  = false;
let isConnecting = false;
let qrChannel    = null;

export function getConnectionStatus() {
  return isConnected;
}

export function setQRChannel(channel) {
  qrChannel = channel;
}

async function connect() {
  if (isConnecting) return;
  isConnecting = true;
  isConnected  = false;

  // Replace the old socket — but keep a ref so the old close-handler can
  // detect it's been superseded and bail out before scheduling a reconnect.
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

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      // If this socket has been replaced, ignore all its events.
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

        if (!loggedOut) {
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
