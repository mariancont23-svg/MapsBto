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
  // WhatsApp expects: digits only (no +), followed by @c.us
  const digits = phone.replace(/\D/g, '');
  return `${digits}@c.us`;
}

export async function startWhatsAppBot(limit = 50) {
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
      console.log('\n📱 Scan this QR code with your WhatsApp Business app:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n⏳ Waiting for scan...\n');
    });

    client.on('authenticated', () => {
      console.log('🔐 Session authenticated — QR won\'t be needed next time.\n');
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
      reject(new Error('WhatsApp auth failed: ' + msg));
    });

    client.on('ready', async () => {
      if (initialized) return;
      initialized = true;

      console.log('🤖 WhatsApp bot ready!\n');

      const leads = getPendingLeads(limit);
      if (leads.length === 0) {
        console.log('📭 No pending leads. Run `npm run scrape` first.');
        await client.destroy();
        return resolve({ sent: 0, failed: 0 });
      }

      console.log(`📋 Sending messages to ${leads.length} leads...\n`);
      let sent = 0;
      let failed = 0;

      for (const lead of leads) {
        const whatsappId = toWhatsAppId(lead.phone);
        const message = formatMessage(config.messageTemplate, lead);

        try {
          // Verify the number is on WhatsApp before sending
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
      await client.destroy();
      resolve({ sent, failed });
    });

    client.initialize().catch(reject);
  });
}
