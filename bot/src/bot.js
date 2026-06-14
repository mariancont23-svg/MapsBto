import { Client, GatewayIntentBits, EmbedBuilder, Events, Partials } from 'discord.js';
import { searchPlaces } from './places.js';
import {
  getStats, clearLeads,
  setLeadMessageId, getLeadByMessageId,
  queueLead, skipLead,
  getNextQueued, markSent, markFailed, getQueueStats,
} from './database.js';
import config from './config.js';
import { getOpenCountries, getCountriesWithTime, pickRandom, getCountryCodeForLocation } from './countries.js';
import { sendWhatsAppMessage } from './whatsapp.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildWaLink(phone, lead) {
  const message = config.messageTemplate
    .replace(/\{name\}/g, lead.name)
    .replace(/\{category\}/g, lead.category || 'business')
    .replace(/\{address\}/g, lead.address || '');
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildMapsLink(lead) {
  const q = encodeURIComponent(`${lead.name} ${lead.address || ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function buildEmbed(lead) {
  return new EmbedBuilder()
    .setTitle(lead.name)
    .setColor(0x25D366)
    .setDescription(`[WhatsApp](${buildWaLink(lead.phone, lead)})  •  [Google Maps](${buildMapsLink(lead)})`)
    .addFields(
      { name: 'Phone',    value: lead.phone,           inline: true },
      { name: 'Category', value: lead.category || '—', inline: true },
    )
    .setFooter({ text: 'React ✅ to queue • ❌ to skip' })
    .setTimestamp();
}

// Post a lead embed, add reaction buttons, store message ID
async function postLead(channel, lead) {
  const msg = await channel.send({ embeds: [buildEmbed(lead)] });
  await msg.react('✅');
  await msg.react('❌');
  setLeadMessageId(lead.phone, msg.id, channel.id);
  return msg;
}

const HELP = `**Commands**
\`!scrape <keyword> <location> [max]\` — Find leads (no website only)
\`!random [max]\` — Scrape a random country currently in business hours (10am–4pm local)
\`!when\` — Show which countries are open for business right now
\`!queue\` — Show WhatsApp send queue status
\`!leads\` — Show total leads in database
\`!clear\` — Delete all leads
\`!help\` — Show this message

**React to lead cards**
✅ — Add to WhatsApp send queue (1 message/minute)
❌ — Skip this lead

**Examples**
\`!scrape restaurante București 20\`
\`!scrape "hair salons" London 15\`
\`!random 10\`
\`!when\``;

// ── Active scrapes tracker ────────────────────────────────────────────────────
const activeScrapes = new Set();

// ── WhatsApp queue scheduler (1 message per 60 seconds) ──────────────────────
const SEND_INTERVAL_MS = 60_000;
let schedulerStartedAt = null;
let lastSentAt = null;

function startScheduler() {
  if (!config.whatsappToken || !config.whatsappPhoneId) return;

  schedulerStartedAt = Date.now();

  setInterval(async () => {
    const lead = getNextQueued();
    if (!lead) return;

    try {
      await sendWhatsAppMessage(lead.phone, lead);
      markSent(lead.phone);
      lastSentAt = Date.now();
      console.log(`WA sent → ${lead.name} (${lead.phone})`);

      if (lead.discord_channel_id) {
        const ch = await client.channels.fetch(lead.discord_channel_id).catch(() => null);
        if (ch) await ch.send(`Sent WhatsApp to **${lead.name}** (${lead.phone})`);
      }
    } catch (err) {
      markFailed(lead.phone);
      console.error(`WA failed → ${lead.phone}: ${err.message}`);

      if (lead.discord_channel_id) {
        const ch = await client.channels.fetch(lead.discord_channel_id).catch(() => null);
        if (ch) await ch.send(`Failed to send to **${lead.name}** (${lead.phone}): ${err.message}`);
      }
    }
  }, SEND_INTERVAL_MS);
}

// ── Event handlers ───────────────────────────────────────────────────────────

client.once(Events.ClientReady, (c) => {
  console.log(`Bot online as ${c.user.tag}`);
  startScheduler();
});

// ── Reaction handler ──────────────────────────────────────────────────────────
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }

  const emoji = reaction.emoji.name;
  if (emoji !== '✅' && emoji !== '❌') return;

  const lead = getLeadByMessageId(reaction.message.id);
  if (!lead) return;

  if (emoji === '✅') {
    const result = queueLead(lead.phone);
    if (result.changes > 0) {
      await reaction.message.channel.send(
        `Queued **${lead.name}** (${lead.phone}) — will send in ~${config.whatsappToken ? '60s' : 'N/A (WHATSAPP_TOKEN not set)'}`
      );
    } else {
      await reaction.message.channel.send(`**${lead.name}** is already queued or sent.`);
    }
  } else {
    skipLead(lead.phone);
  }
});

// ── Message handler ───────────────────────────────────────────────────────────
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith('!')) return;

  const parts = msg.content.match(/(".*?"|[^\s]+)/g) || [];
  const cmd   = parts[0]?.toLowerCase();

  // ── !help ──────────────────────────────────────────────────────────────────
  if (cmd === '!help') {
    return msg.reply(HELP);
  }

  // ── !leads ─────────────────────────────────────────────────────────────────
  if (cmd === '!leads') {
    const { total } = getStats();
    return msg.reply(`Total leads in database: **${total}**`);
  }

  // ── !clear ─────────────────────────────────────────────────────────────────
  if (cmd === '!clear') {
    const result = clearLeads();
    return msg.reply(`Deleted ${result.changes} leads. Database is empty.`);
  }

  // ── !queue ─────────────────────────────────────────────────────────────────
  if (cmd === '!queue') {
    if (!config.whatsappToken) {
      return msg.reply('WhatsApp not configured. Add `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID` to Railway variables.');
    }
    const { pending, sent, failed } = getQueueStats();
    const nextIn = lastSentAt
      ? Math.max(0, Math.round((SEND_INTERVAL_MS - (Date.now() - lastSentAt)) / 1000))
      : 60;
    return msg.reply(
      `**WhatsApp Queue**\n` +
      `Pending: **${pending}** | Sent: **${sent}** | Failed: **${failed}**\n` +
      (pending > 0 ? `Next send in: **${nextIn}s**` : 'Queue is empty — react ✅ on a lead card to add numbers.')
    );
  }

  // ── !when ─────────────────────────────────────────────────────────────────
  if (cmd === '!when') {
    const countries = getCountriesWithTime();
    const open   = countries.filter(c => c.isOpen);
    const soon   = countries.filter(c => !c.isOpen && c.hoursUntilOpen <= 3);
    const closed = countries.filter(c => !c.isOpen && c.hoursUntilOpen > 3);

    const lines = [];

    if (open.length) {
      lines.push('**Open now (10am–4pm local)**');
      for (const c of open) lines.push(`${c.flag} ${c.name} — ${c.localTime}`);
    } else {
      lines.push('No countries in business hours right now.');
    }

    if (soon.length) {
      lines.push('');
      lines.push('**Opening soon (within 3h)**');
      for (const c of soon) lines.push(`${c.flag} ${c.name} — opens in ${c.hoursUntilOpen}h (now ${c.localTime})`);
    }

    if (closed.length) {
      lines.push('');
      lines.push('**Closed**');
      for (const c of closed) lines.push(`${c.flag} ${c.name} — opens in ${c.hoursUntilOpen}h (now ${c.localTime})`);
    }

    return msg.reply(lines.join('\n'));
  }

  // ── !random ───────────────────────────────────────────────────────────────
  if (cmd === '!random') {
    const max  = parseInt(parts[1]) || config.defaultMax;
    const open = getCountriesWithTime().filter(c => c.isOpen);

    if (!open.length) {
      return msg.reply('No countries are in business hours right now (10am–4pm). Try `!when` to see when they open.');
    }

    const country = pickRandom(open);

    if (activeScrapes.has(msg.channelId)) {
      return msg.reply('A scrape is already running in this channel. Wait for it to finish.');
    }

    const cities   = [...country.cities].sort(() => Math.random() - 0.5);
    const keywords = [...country.keywords].sort(() => Math.random() - 0.5);
    const combos   = [];
    for (const city of cities) for (const kw of keywords) combos.push({ city, kw });

    activeScrapes.add(msg.channelId);
    const { city: firstCity, kw: firstKw } = combos[0];
    const status = await msg.reply(
      `${country.flag} **${country.name}** — ${country.localTime} local\nSearching for **${firstKw}** in **${firstCity}** (max ${max})...`
    );

    let found = 0;

    try {
      for (const { city, kw } of combos) {
        if (found >= max) break;
        if (found > 0) {
          await status.edit(
            `${country.flag} **${country.name}** — ${country.localTime} local\n` +
            `Found ${found} so far — also trying **${kw}** in **${city}**...`
          );
        }
        await searchPlaces(kw, city, max - found, async (lead) => {
          found++;
          await postLead(msg.channel, lead);
        }, country.code);
      }

      await status.edit(
        `${country.flag} **${country.name}** — ${country.localTime} local\n` +
        `Done. Found **${found}** lead${found !== 1 ? 's' : ''}.`
      );
    } catch (err) {
      await status.edit(`Error: ${err.message}`);
    } finally {
      activeScrapes.delete(msg.channelId);
    }
  }

  // ── !scrape ────────────────────────────────────────────────────────────────
  if (cmd === '!scrape') {
    const keyword  = parts[1]?.replace(/"/g, '');
    const location = parts[2]?.replace(/"/g, '');
    const max      = parseInt(parts[3]) || config.defaultMax;

    if (!keyword || !location) {
      return msg.reply('Usage: `!scrape <keyword> <location> [max]`\nExample: `!scrape restaurante București 20`');
    }

    if (activeScrapes.has(msg.channelId)) {
      return msg.reply('A scrape is already running in this channel. Wait for it to finish.');
    }

    activeScrapes.add(msg.channelId);
    const detectedCode = getCountryCodeForLocation(location);
    const status = await msg.reply(`Searching for **${keyword}** in **${location}** (max ${max})...`);

    let found = 0;

    try {
      await searchPlaces(keyword, location, max, async (lead) => {
        found++;
        await postLead(msg.channel, lead);
      }, detectedCode);

      await status.edit(
        `Done. Found **${found}** lead${found !== 1 ? 's' : ''} without a website.`
      );
    } catch (err) {
      await status.edit(`Error: ${err.message}`);
    } finally {
      activeScrapes.delete(msg.channelId);
    }
  }
});

client.login(config.botToken);
