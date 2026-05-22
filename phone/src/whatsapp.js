import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { mkdirSync } from 'fs';
import { getPendingLeads, markLeadSent, markLeadFailed } from './database.js';
import config from './config.js';

mkdirSync(config.sessionPath, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 3000));

function formatMessage(template, lead) {
  return template
    .replace(/\{name\}/g, lead.name)
    .replace(/\{category\}/g, lead.category || 'negocio')
    .replace(/\{address\}/g, lead.address || '');
}

function toJid(phone) {
  // Baileys format: digits only (no +) + @s.whatsapp.net
  return phone.replace(/\D/g, '') + '@s.whatsapp.net';
}

export async function startWhatsAppBot(limit = 50) {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  return new Promise((resolve, reject) => {
    let ready = false;

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }), // suppress noisy Baileys logs
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      printQRInTerminal: false, // we handle QR ourselves
      browser: ['MapsBto', 'Chrome', '124.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log('\n📱 Scan this QR code with WhatsApp Business:\n');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Waiting for scan...\n');
      }

      if (connection === 'open') {
        if (ready) return;
        ready = true;

        console.log('🤖 WhatsApp connected!\n');
        try {
          const result = await sendPendingLeads(sock, limit);
          await sock.logout().catch(() => {});
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }

      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.error('❌ Logged out from WhatsApp. Delete the sessions/ folder and try again.');
          reject(new Error('Logged out'));
        } else if (!ready) {
          console.error('❌ Connection closed:', lastDisconnect?.error?.message);
          reject(new Error('Connection closed before ready'));
        }
      }
    });
  });
}

async function sendPendingLeads(sock, limit) {
  const leads = getPendingLeads(limit);

  if (leads.length === 0) {
    console.log('📭 No pending leads. Run `npm run scrape` first.');
    return { sent: 0, failed: 0 };
  }

  console.log(`📋 Sending messages to ${leads.length} leads...\n`);
  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    const jid = toJid(lead.phone);
    const message = formatMessage(config.messageTemplate, lead);

    try {
      // Check if the number exists on WhatsApp
      const [result] = await sock.onWhatsApp(lead.phone.replace(/\D/g, ''));
      if (!result?.exists) {
        console.log(`⏭  ${lead.name} (${lead.phone}) — not on WhatsApp`);
        markLeadFailed(lead.id, 'not on whatsapp');
        failed++;
        continue;
      }

      await sock.sendMessage(jid, { text: message });
      markLeadSent(lead.id, message);
      sent++;
      console.log(`✅ Sent → ${lead.name} (${lead.phone})`);

      const delay = config.messageDelayMs + Math.random() * 5000;
      console.log(`   ⏳ Waiting ${Math.round(delay / 1000)}s...\n`);
      await sleep(delay);
    } catch (err) {
      console.log(`❌ Failed → ${lead.name}: ${err.message.slice(0, 80)}`);
      markLeadFailed(lead.id, err.message);
      failed++;
      await sleep(5000);
    }
  }

  console.log(`\n📊 Done!  Sent: ${sent}  |  Failed: ${failed}`);
  return { sent, failed };
}
