import config from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildMessage(lead) {
  return config.messageTemplate
    .replace(/\{name\}/g, lead.name)
    .replace(/\{category\}/g, lead.category || 'business')
    .replace(/\{address\}/g, lead.address || '');
}

function buildWaLink(phone, message) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildEmbed(lead) {
  const message = buildMessage(lead);
  const waLink = buildWaLink(lead.phone, message);

  return {
    title: `🏢 ${lead.name}`,
    color: 0x25D366,
    description: `### [📲 Click here to send WhatsApp message](${waLink})`,
    fields: [
      { name: '📞 Phone',    value: lead.phone,           inline: true  },
      { name: '🏷️ Category', value: lead.category || '—', inline: true  },
      { name: '📍 Address',  value: lead.address  || '—', inline: false },
    ],
    footer: { text: 'Found via Google Places • No website' },
    timestamp: new Date().toISOString(),
  };
}

export async function postLeadToDiscord(lead) {
  if (!config.discordWebhook) return;

  try {
    const res = await fetch(config.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [buildEmbed(lead)] }),
    });

    if (!res.ok) {
      console.log(`  ⚠️  Discord: ${res.status} ${res.statusText}`);
    }
    await sleep(2000);
  } catch (err) {
    console.log(`  ⚠️  Discord error: ${err.message}`);
  }
}

export async function postAllToDiscord(leads) {
  if (!config.discordWebhook) {
    console.log('❌ DISCORD_WEBHOOK_URL is not set in your .env file.');
    return;
  }

  console.log(`\n📨 Posting ${leads.length} leads to Discord...\n`);
  let posted = 0;

  for (const lead of leads) {
    await postLeadToDiscord(lead);
    posted++;
    console.log(`  [${posted}/${leads.length}] ✅ ${lead.name}`);
  }

  console.log(`\n✅ Done. ${posted} leads posted to Discord.\n`);
}
