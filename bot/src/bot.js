import { Client, GatewayIntentBits, EmbedBuilder, Events } from 'discord.js';
import { searchPlaces } from './places.js';
import { getStats, clearLeads } from './database.js';
import config from './config.js';
import { getOpenCountries, getCountriesWithTime, pickRandom, getCountryCodeForLocation } from './countries.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
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
    .setFooter({ text: 'Google Maps • No website' })
    .setTimestamp();
}

const HELP = `**Commands**
\`!scrape <keyword> <location> [max]\` — Find leads (no website only)
\`!random [max]\` — Scrape a random country currently in business hours (10am–4pm local)
\`!when\` — Show which countries are open for business right now
\`!leads\` — Show total leads in database
\`!clear\` — Delete all leads
\`!help\` — Show this message

**Examples**
\`!scrape restaurante București 20\`
\`!scrape "hair salons" London 15\`
\`!random 10\`
\`!when\``;

// ── Active scrapes tracker (prevent concurrent runs) ─────────────────────────
const activeScrapes = new Set();

// ── Event handlers ───────────────────────────────────────────────────────────

client.once(Events.ClientReady, (c) => {
  console.log(`Bot online as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith('!')) return;

  // Parse command — support quoted strings e.g. !scrape "hair salons" London 20
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

  // ── !when ─────────────────────────────────────────────────────────────────
  if (cmd === '!when') {
    const countries = getCountriesWithTime();
    const open = countries.filter(c => c.isOpen);
    const soon = countries.filter(c => !c.isOpen && c.hoursUntilOpen <= 3);
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
    const max = parseInt(parts[1]) || config.defaultMax;
    const open = getCountriesWithTime().filter(c => c.isOpen);

    if (!open.length) {
      return msg.reply('No countries are in business hours right now (10am–4pm). Try `!when` to see when they open.');
    }

    const country  = pickRandom(open);
    const city     = pickRandom(country.cities);
    const keyword  = pickRandom(country.keywords);

    if (activeScrapes.has(msg.channelId)) {
      return msg.reply('A scrape is already running in this channel. Wait for it to finish.');
    }

    activeScrapes.add(msg.channelId);
    const status = await msg.reply(
      `${country.flag} **${country.name}** — ${country.localTime} local\nSearching for **${keyword}** in **${city}** (max ${max})...`
    );

    let found = 0;

    try {
      await searchPlaces(keyword, city, max, async (lead) => {
        found++;
        await msg.channel.send({ embeds: [buildEmbed(lead)] });
      }, country.code);

      await status.edit(
        `${country.flag} **${country.name}** — ${country.localTime} local\n` +
        `Done. Found **${found}** lead${found !== 1 ? 's' : ''} for **${keyword}** in **${city}**.`
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
    let skipped = 0;

    try {
      await searchPlaces(keyword, location, max, async (lead) => {
        found++;
        await msg.channel.send({ embeds: [buildEmbed(lead)] });
      }, detectedCode);

      await status.edit(
        `Done. Found **${found}** lead${found !== 1 ? 's' : ''} without a website.` +
        (skipped ? ` Skipped ${skipped} with a website.` : '')
      );
    } catch (err) {
      await status.edit(`Error: ${err.message}`);
    } finally {
      activeScrapes.delete(msg.channelId);
    }
  }
});

client.login(config.botToken);
