import { program } from 'commander';
import chalk from 'chalk';
import { scrapeGoogleMaps } from './scraper.js';
import { startWhatsAppBot } from './whatsapp.js';
import { getAllLeads, getStats, resetLeads, clearLeads } from './database.js';

program
  .name('mapsbto')
  .description('Google Maps → WhatsApp Business lead bot')
  .version('1.0.0');

// ── SCRAPE ──────────────────────────────────────────────────────────────────
program
  .command('scrape')
  .description('Search Google Maps and save business phone numbers to the database')
  .requiredOption('-k, --keyword <keyword>', 'Type of business  (e.g. "restaurantes", "peluquerias")')
  .requiredOption('-l, --location <location>', 'City or area      (e.g. "Madrid", "Bogotá centro")')
  .option('-m, --max <number>', 'Max leads to collect', '50')
  .action(async (opts) => {
    process.env.MAX_LEADS = opts.max;
    try {
      await scrapeGoogleMaps(opts.keyword, opts.location);
    } catch (err) {
      console.error(chalk.red('Scraper error:'), err.message);
      process.exit(1);
    }
  });

// ── SEND ────────────────────────────────────────────────────────────────────
program
  .command('send')
  .description('Connect WhatsApp Business and send messages to pending leads without a website')
  .option('-n, --number <number>', 'Max messages to send in this session', '50')
  .option('--with-website', 'Also message businesses that already have a website')
  .action(async (opts) => {
    const noWebsiteOnly = !opts.withWebsite;
    if (noWebsiteOnly) console.log(chalk.dim('  Filtering: businesses without a website only\n'));
    try {
      await startWhatsAppBot(parseInt(opts.number), noWebsiteOnly);
    } catch (err) {
      console.error(chalk.red('WhatsApp error:'), err.message);
      process.exit(1);
    }
  });

// ── RUN (scrape + send in one go) ───────────────────────────────────────────
program
  .command('run')
  .description('Scrape Google Maps then immediately send WhatsApp messages to new leads without a website')
  .requiredOption('-k, --keyword <keyword>', 'Type of business  (e.g. "restaurantes", "peluquerias")')
  .requiredOption('-l, --location <location>', 'City or area      (e.g. "Madrid", "Bogotá centro")')
  .option('-m, --max <number>', 'Max leads to collect and message', '50')
  .option('--with-website', 'Also message businesses that already have a website')
  .action(async (opts) => {
    process.env.MAX_LEADS = opts.max;
    const noWebsiteOnly = !opts.withWebsite;
    try {
      console.log(chalk.bold('\n── Step 1 / 2 — Scraping Google Maps ───────────'));
      const found = await scrapeGoogleMaps(opts.keyword, opts.location);

      if (found === 0) {
        console.log(chalk.yellow('\nNo new leads found — nothing to send.'));
        return;
      }

      console.log(chalk.bold('\n── Step 2 / 2 — Sending WhatsApp messages ──────'));
      if (noWebsiteOnly) console.log(chalk.dim('  Filtering: businesses without a website only\n'));
      await startWhatsAppBot(parseInt(opts.max), noWebsiteOnly);
    } catch (err) {
      console.error(chalk.red('\n❌ Error:'), err.message);
      process.exit(1);
    }
  });

// ── LEADS ───────────────────────────────────────────────────────────────────
program
  .command('leads')
  .description('Show database stats and recent leads')
  .option('-n, --number <number>', 'Number of recent leads to show', '30')
  .action((opts) => {
    const stats = getStats();

    console.log(chalk.bold('\n── Lead Statistics ─────────────────'));
    console.log(`  Total        ${chalk.white.bold(stats.total)}`);
    console.log(`  No website   ${chalk.cyan.bold(stats.no_website)}  ← your targets`);
    console.log(`  Has website  ${chalk.dim(stats.has_website)}`);
    console.log(`  Pending      ${chalk.yellow.bold(stats.pending)}`);
    console.log(`  Sent         ${chalk.green.bold(stats.sent)}`);
    console.log(`  Failed       ${chalk.red.bold(stats.failed)}`);
    console.log('────────────────────────────────────\n');

    const leads = getAllLeads(parseInt(opts.number));
    if (!leads.length) {
      console.log(chalk.dim('  No leads yet. Run: npm run scrape -- -k "keyword" -l "city"'));
      return;
    }

    const statusColor = { pending: chalk.yellow, sent: chalk.green, failed: chalk.red };
    leads.forEach((l) => {
      const color = statusColor[l.status] || chalk.white;
      const site = l.website ? chalk.dim('🌐') : chalk.cyan('✗');
      console.log(
        `  ${color(l.status.padEnd(8))}  ${site}  ${l.name.slice(0, 26).padEnd(26)}  ${l.phone}`
      );
    });
    console.log(chalk.dim('\n  🌐 = has website   ✗ = no website (your targets)\n'));
  });

// ── RESET ───────────────────────────────────────────────────────────────────
program
  .command('reset')
  .description('Reset leads back to pending so they can be sent again')
  .option('--all', 'Reset ALL leads including already-sent ones (default: only failed)')
  .action((opts) => {
    const before = getStats();
    const result = resetLeads(opts.all);

    if (result.changes === 0) {
      if (before.pending > 0) {
        console.log(chalk.yellow(`\nℹ️  No failed leads to reset — but ${before.pending} leads are already pending.`));
        console.log(chalk.dim('   Just run: npm run send\n'));
      } else {
        console.log(chalk.yellow('\nℹ️  No leads to reset. Run npm run scrape first.\n'));
      }
    } else {
      const scope = opts.all ? 'leads' : 'failed leads';
      console.log(chalk.green(`\n✅ Reset ${result.changes} ${scope} back to pending.`));
      console.log(chalk.dim('   Run: npm run send\n'));
    }

    const after = getStats();
    console.log(`   Pending: ${chalk.yellow.bold(after.pending)}  Sent: ${chalk.green.bold(after.sent)}  Failed: ${chalk.red.bold(after.failed)}\n`);
  });

// ── CLEAR ───────────────────────────────────────────────────────────────────
program
  .command('clear')
  .description('Delete ALL leads from the database and start fresh')
  .action(() => {
    const result = clearLeads();
    console.log(chalk.green(`\n✅ Deleted ${result.changes} leads. Database is empty.\n`));
  });

program.parse();
