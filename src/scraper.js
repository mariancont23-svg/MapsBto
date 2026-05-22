import { chromium } from 'playwright';
import { insertLead, logSearch } from './database.js';
import config from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 1000));

function cleanPhone(raw, countryCode) {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  if (!digits.startsWith('+')) {
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = '+' + countryCode + digits;
  }
  return digits;
}

// Extract the unique place ID from a Google Maps URL to deduplicate results
function placeIdFromUrl(href) {
  const match = href.match(/place\/[^/]+\/([^/?]+)/);
  return match ? match[1] : href;
}

export async function scrapeGoogleMaps(keyword, location) {
  const query = `${keyword} în ${location}`;
  console.log(`\n🔍 Searching Google Maps for: "${query}"`);
  console.log(`   Target: ${config.maxLeads} leads without a website\n`);

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

    // Scroll until we have enough listings to work with
    // We load more than maxLeads because some will have websites and be skipped
    const targetScroll = config.maxLeads * 4;
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
      if (count >= targetScroll) break;
    }

    // Deduplicate by place ID, not full URL (avoids ♻️ from same listing with different params)
    const allHrefs = await page
      .locator('a[href*="/maps/place/"]')
      .evaluateAll((els) => els.map((e) => e.href));

    const seen = new Set();
    const hrefs = allHrefs.filter((href) => {
      const id = href.match(/place\/[^/]+\/([^/?]+)/)?.[1] ?? href;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    console.log(`📌 Found ${hrefs.length} unique listings. Checking for leads without a website...\n`);

    for (let i = 0; i < hrefs.length && leadsFound < config.maxLeads; i++) {
      try {
        await page.goto(hrefs[i], { waitUntil: 'domcontentloaded', timeout: 20000 });
        await sleep(config.scrapeDelayMs);

        const name = await page.locator('h1').first().textContent({ timeout: 5000 }).catch(() => '');

        // Skip immediately if the business has a website — no need to extract phone
        const website = await page
          .locator('a[data-item-id^="authority"]')
          .first()
          .getAttribute('href')
          .catch(() => '');

        if (website) {
          console.log(`  ⏭  Has website — ${name.trim()}`);
          continue;
        }

        // Phone
        let phone = '';
        const telLink = page.locator('a[href^="tel:"]').first();
        if (await telLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          const href = await telLink.getAttribute('href');
          phone = href?.replace('tel:', '') ?? '';
        }
        if (!phone) {
          const phoneEl = page.locator('[data-item-id^="phone:tel:"]').first();
          if (await phoneEl.isVisible({ timeout: 2000 }).catch(() => false)) {
            const attr = await phoneEl.getAttribute('data-item-id');
            phone = attr?.replace('phone:tel:', '') ?? '';
          }
        }

        if (!phone) {
          console.log(`  ⏭  No phone — ${name.trim()}`);
          continue;
        }

        const cleanedPhone = cleanPhone(phone, config.countryCode);

        const address = await page
          .locator('[data-item-id="address"]')
          .first()
          .textContent({ timeout: 2000 })
          .catch(() => '');

        const category = await page
          .locator('button[jsaction*="category"]')
          .first()
          .textContent({ timeout: 2000 })
          .catch(() => '');

        const lead = {
          name: name.trim(),
          phone: cleanedPhone,
          address: address.trim(),
          website: '',
          category: category.trim(),
          search_query: query,
        };

        const result = insertLead(lead);
        if (result.changes > 0) {
          leadsFound++;
          console.log(`  [${leadsFound}/${config.maxLeads}] ✅ ${lead.name} — ${lead.phone}`);
        }
        // Silently skip duplicates — they're already in the DB from a previous search
      } catch (err) {
        console.log(`  ❌ Error: ${err.message.slice(0, 80)}`);
      }
    }

    logSearch(keyword, location, leadsFound);
    console.log(`\n✅ Done. ${leadsFound} new leads without a website saved.`);
  } finally {
    await browser.close();
  }

  return leadsFound;
}
