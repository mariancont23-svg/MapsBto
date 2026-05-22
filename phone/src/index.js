import { program } from 'commander';
import chalk from 'chalk';
import { searchPlaces } from './places.js';
import { startWhatsAppBot } from './whatsapp.js';
import { getAllLeads, getStats } from './database.js';

program
  .name('mapsbto-phone')
  .description('Google Maps → WhatsApp Business lead bot (Termux / phone edition)')
  .version('1.0.0');

// ── SCRAPE ──────────────────────────────────────────────────────────────────
program
  .command('scrape')
  .description('Search Google Places API and save business phone numbers')
  .requiredOption('-k, --keyword <keyword>', 'Type of business  (e.g. "restaurantes", "dentistas")')
  .requiredOption('-l, --location <location>', 'City or area      (e.g. "Madrid", "Bogotá centro")')
  .option('-m, --max <number>', 'Max leads to collect (max 60 per search)', '50')
  .action(async (opts) => {
    process.env.MAX_LEADS = opts.max;
    try {
      await searchPlaces(opts.keyword, opts.location);
    } catch (err) {
      console.error(chalk.red('\n❌ Scraper error:'), err.message);
      process.exit(1);
    }
  });

// ── SEND ────────────────────────────────────────────────────────────────────
program
  .command('send')
  .description('Connect WhatsApp and send messages to all pending leads')
  .option('-n, --number <number>', 'Max messages to send this session', '50')
  .action(async (opts) => {
    try {
      await startWhatsAppBot(parseInt(opts.number));
    } catch (err) {
      console.error(chalk.red('\n❌ WhatsApp error:'), err.message);
      process.exit(1);
    }
  });

// ── LEADS ───────────────────────────────────────────────────────────────────
program
  .command('leads')
  .description('Show stats and recent leads')
  .option('-n, --number <number>', 'Number of leads to show', '30')
  .action((opts) => {
    const stats = getStats();

    console.log(chalk.bold('\n── Lead Statistics ─────────────────'));
    console.log(`  Total    ${chalk.white.bold(stats.total)}`);
    console.log(`  Pending  ${chalk.yellow.bold(stats.pending)}`);
    console.log(`  Sent     ${chalk.green.bold(stats.sent)}`);
    console.log(`  Failed   ${chalk.red.bold(stats.failed)}`);
    console.log('────────────────────────────────────\n');

    const leads = getAllLeads(parseInt(opts.number));
    if (!leads.length) {
      console.log(chalk.dim('  No leads yet. Run: npm run scrape -- -k "keyword" -l "city"'));
      return;
    }

    const statusColor = { pending: chalk.yellow, sent: chalk.green, failed: chalk.red };
    leads.forEach((l) => {
      const color = statusColor[l.status] || chalk.white;
      console.log(
        `  ${color(l.status.padEnd(8))}  ${l.name.slice(0, 28).padEnd(28)}  ${l.phone}`
      );
    });
    console.log();
  });

program.parse();
