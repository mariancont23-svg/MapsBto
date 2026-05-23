import { Client, GatewayIntentBits, EmbedBuilder, Events } from 'discord.js';
import { searchPlaces } from './places.js';
import { getStats, clearLeads } from './database.js';
import config from './config.js';

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
\`!leads\` — Show total leads in database
\`!clear\` — Delete all leads
\`!help\` — Show this message

**Examples**
\`!scrape restaurante București 20\`
\`!scrape "hair salons" London 15\`
\`!scrape dentists Paris\``;

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
    const status = await msg.reply(`Searching for **${keyword}** in **${location}** (max ${max})...`);

    let found = 0;
    let skipped = 0;

    try {
      await searchPlaces(keyword, location, max, async (lead) => {
        found++;
        await msg.channel.send({ embeds: [buildEmbed(lead)] });
      });

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
