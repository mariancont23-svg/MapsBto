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

let sock        = null;
let isConnected = false;
let qrChannel   = null;

export function getConnectionStatus() {
  return isConnected;
}

export function setQRChannel(channel) {
  qrChannel = channel;
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    keepAliveIntervalMs: 10_000,
    connectTimeoutMs: 30_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
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
      isConnected = true;
      console.log('WhatsApp connected');
      if (qrChannel) await qrChannel.send('WhatsApp connected and ready.').catch(() => {});
    }

    if (connection === 'close') {
      isConnected = false;
      const code      = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output.statusCode : 0;
      const loggedOut = code === DisconnectReason.loggedOut;

      if (loggedOut) {
        if (qrChannel) await qrChannel.send('WhatsApp logged out. Type `!waconnect` to reconnect.').catch(() => {});
      } else {
        setTimeout(connect, 5_000);
      }
    }
  });
}

export async function initWhatsApp(channel) {
  qrChannel = channel;
  await connect();
}

export async function sendWhatsAppMessage(phone, lead) {
  if (!isConnected || !sock) throw new Error('WhatsApp not connected — use `!waconnect` first');

  const digits = phone.replace(/\D/g, '');
  const jid    = `${digits}@s.whatsapp.net`;

  const text = config.messageTemplate
    .replace(/\{name\}/g,     lead.name)
    .replace(/\{category\}/g, lead.category || 'business')
    .replace(/\{address\}/g,  lead.address  || '');

  await sock.sendMessage(jid, { text });
}
