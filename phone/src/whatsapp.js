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
  return phone.replace(/\D/g, '') + '@s.whatsapp.net';
}

async function createConnection(limit, noWebsiteOnly, attempt, maxAttempts) {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  return new Promise((resolve, reject) => {
    let ready = false;

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      printQRInTerminal: false,
      browser: ['MapsBto', 'Chrome', '124.0.0'],
      // Keep connection alive
      keepAliveIntervalMs: 10_000,
      retryRequestDelayMs: 2_000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        if (attempt === 1) {
          console.log('\n📱 Scan this QR code with WhatsApp Business:\n');
          qrcode.generate(qr, { small: true });
          console.log('\n⏳ Waiting for scan...\n');
        }
      }

      if (connection === 'open') {
        if (ready) return;
        ready = true;
        console.log('🤖 WhatsApp connected!\n');
        try {
          const result = await sendPendingLeads(sock, limit, noWebsiteOnly);
          await sock.end().catch(() => {});
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.error('\n❌ Logged out. Delete the sessions/ folder and try again.');
          reject(new Error('Logged out'));
          return;
        }

        if (!ready) {
          // Stream error before connection was ready — caller will retry
          reject(new Error(`stream_error:${statusCode}`));
        }
        // If ready=true, messages were already sent — resolve normally handled above
      }
    });
  });
}

export async function startWhatsAppBot(limit = 50, noWebsiteOnly = true) {
  const MAX_RETRIES = 4;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await createConnection(limit, noWebsiteOnly, attempt, MAX_RETRIES);
    } catch (err) {
      if (err.message === 'Logged out') throw err;

      if (attempt < MAX_RETRIES) {
        const wait = attempt * 4000;
        console.log(`\n🔄 Connection dropped — retrying in ${wait / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await sleep(wait);
      } else {
        throw new Error(`Could not connect after ${MAX_RETRIES} attempts. Try running npm run send again.`);
      }
    }
  }
}

async function sendPendingLeads(sock, limit, noWebsiteOnly) {
  const leads = getPendingLeads(limit, noWebsiteOnly);
  const filterNote = noWebsiteOnly ? ' (no website only)' : '';

  if (leads.length === 0) {
    console.log('📭 No pending leads without a website. Run `npm run scrape` or use --with-website to include all.');
    return { sent: 0, failed: 0 };
  }

  console.log(`📋 Sending messages to ${leads.length} leads${filterNote}...\n`);
  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    const jid = toJid(lead.phone);
    const message = formatMessage(config.messageTemplate, lead);

    try {
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
