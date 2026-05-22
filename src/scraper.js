import { chromium } from 'playwright';
import { insertLead, logSearch } from './database.js';
import config from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 1000));

function cleanPhone(raw, countryCode) {
  let digits = raw.replace(/[^\d+]/g, '');

  // If it starts with 00, replace with +
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);

  // If no country code prefix, add the configured one
  if (!digits.startsWith('+')) {
    // Drop leading 0 (local trunk prefix) if present
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = '+' + countryCode + digits;
  }

  return digits;
}

export async function scrapeGoogleMaps(keyword, location) {
  const query = `${keyword} în ${location}`;
  console.log(`\n🔍 Searching Google Maps for: "${query}"`);

  const browser = await chromium.launch({
    headless: config.scraperHeadless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ro-RO'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ro-RO',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  let leadsFound = 0;

  try {
    await page.goto(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );
    await sleep(3000);

    // Accept cookies if prompted (EU)
    const acceptBtn = page.getByRole('button', { name: /accept all|acceptați tot|acceptati tot/i });
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
      await sleep(1000);
    }

    // Scroll the results feed to load more listings
    const feed = page.locator('[role="feed"]');
    let previousCount = 0;
    let stableRounds = 0;

    while (stableRounds < 3) {
      await feed.evaluate((el) => el.scrollBy(0, 1200)).catch(() => {});
      await sleep(1800);
      const count = await page.locator('a[href*="/maps/place/"]').count();
      if (count === previousCount) {
        stableRounds++;
      } else {
        stableRounds = 0;
        previousCount = count;
      }
      if (count >= config.maxLeads) break;
    }

    const hrefs = await page
      .locator('a[href*="/maps/place/"]')
      .evaluateAll((els) => [...new Set(els.map((e) => e.href))]);

    console.log(`📌 Found ${hrefs.length} listings. Extracting details...\n`);

    for (let i = 0; i < Math.min(hrefs.length, config.maxLeads); i++) {
      try {
        await page.goto(hrefs[i], { waitUntil: 'domcontentloaded', timeout: 20000 });
        await sleep(config.scrapeDelayMs);

        // Business name
        const name = await page.locator('h1').first().textContent({ timeout: 5000 }).catch(() => '');

        // Phone — Google Maps stores it as a tel: link or data-item-id
        let phone = '';

        const telLink = page.locator('a[href^="tel:"]').first();
        if (await telLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          const href = await telLink.getAttribute('href');
          phone = href?.replace('tel:', '') ?? '';
        }

        // Fallback: data-item-id attribute
        if (!phone) {
          const phoneEl = page.locator('[data-item-id^="phone:tel:"]').first();
          if (await phoneEl.isVisible({ timeout: 2000 }).catch(() => false)) {
            const attr = await phoneEl.getAttribute('data-item-id');
            phone = attr?.replace('phone:tel:', '') ?? '';
          }
        }

        if (!phone) {
          console.log(`  [${i + 1}/${hrefs.length}] ⏭  No phone — ${name.trim() || hrefs[i]}`);
          continue;
        }

        const cleanedPhone = cleanPhone(phone, config.countryCode);

        // Address
        const address = await page
          .locator('[data-item-id="address"]')
          .first()
          .textContent({ timeout: 2000 })
          .catch(() => '');

        // Website
        const website = await page
          .locator('a[data-item-id^="authority"]')
          .first()
          .getAttribute('href')
          .catch(() => '');

        // Category
        const category = await page
          .locator('button[jsaction*="category"]')
          .first()
          .textContent({ timeout: 2000 })
          .catch(() => '');

        const lead = {
          name: name.trim(),
          phone: cleanedPhone,
          address: address.trim(),
          website: website?.trim() ?? '',
          category: category.trim(),
          search_query: query,
        };

        const result = insertLead(lead);
        if (result.changes > 0) {
          leadsFound++;
          const siteTag = lead.website ? ' 🌐' : ' ✗ no website';
          console.log(`  [${i + 1}/${hrefs.length}] ✅ ${lead.name} — ${lead.phone}${siteTag}`);
        } else {
          console.log(`  [${i + 1}/${hrefs.length}] ♻️  Already exists — ${lead.name}`);
        }
      } catch (err) {
        console.log(`  [${i + 1}/${hrefs.length}] ❌ Error: ${err.message.slice(0, 80)}`);
      }
    }

    logSearch(keyword, location, leadsFound);
    console.log(`\n✅ Scraping done. ${leadsFound} new leads added to database.`);
  } finally {
    await browser.close();
  }

  return leadsFound;
}
