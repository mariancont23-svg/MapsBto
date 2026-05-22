import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { mkdirSync } from 'fs';
import { getPendingLeads, markLeadSent, markLeadFailed } from './database.js';
import config from './config.js';

mkdirSync('./sessions', { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 3000));

function formatMessage(template, lead) {
  return template
    .replace(/\{name\}/g, lead.name)
    .replace(/\{category\}/g, lead.category || 'negocio')
    .replace(/\{address\}/g, lead.address || '');
}

function toWhatsAppId(phone) {
  return phone.replace(/\D/g, '') + '@c.us';
}

async function createClient(limit, noWebsiteOnly, attempt) {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: config.sessionPath }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  return new Promise((resolve, reject) => {
    let initialized = false;

    client.on('qr', (qr) => {
      if (attempt === 1) {
        console.log('\n📱 Scan this QR code with your WhatsApp Business app:\n');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Waiting for scan...\n');
      }
    });

    client.on('authenticated', () => {
      console.log('🔐 Session authenticated — QR won\'t be needed next time.\n');
    });

    client.on('auth_failure', (msg) => {
      reject(new Error('auth_failure:' + msg));
    });

    client.on('disconnected', (reason) => {
      if (!initialized) reject(new Error('disconnected:' + reason));
    });

    client.on('ready', async () => {
      if (initialized) return;
      initialized = true;
      console.log('🤖 WhatsApp bot ready!\n');
      try {
        const result = await sendPendingLeads(client, limit, noWebsiteOnly);
        await client.destroy();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    client.initialize().catch(reject);
  });
}

export async function startWhatsAppBot(limit = 50, noWebsiteOnly = true) {
  const MAX_RETRIES = 4;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await createClient(limit, noWebsiteOnly, attempt);
    } catch (err) {
      if (err.message.startsWith('auth_failure')) throw err;

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

async function sendPendingLeads(client, limit, noWebsiteOnly) {
  const leads = getPendingLeads(limit, noWebsiteOnly);
  const filterNote = noWebsiteOnly ? ' (no website only)' : '';

  if (leads.length === 0) {
    console.log('📭 No pending leads without a website. Run `npm run scrape` or use --with-website.');
    return { sent: 0, failed: 0 };
  }

  console.log(`📋 Sending messages to ${leads.length} leads${filterNote}...\n`);
  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    const whatsappId = toWhatsAppId(lead.phone);
    const message = formatMessage(config.messageTemplate, lead);

    try {
      const isRegistered = await client.isRegisteredUser(whatsappId);
      if (!isRegistered) {
        console.log(`⏭  ${lead.name} (${lead.phone}) — not on WhatsApp`);
        markLeadFailed(lead.id, 'not on whatsapp');
        failed++;
        continue;
      }

      await client.sendMessage(whatsappId, message);
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
