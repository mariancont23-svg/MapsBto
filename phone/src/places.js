import { insertLead, logSearch } from './database.js';
import config from './config.js';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

async function apiGet(path, params) {
  const url = new URL(`${PLACES_BASE}/${path}/json`);
  Object.entries({ ...params, key: config.placesApiKey }).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${json.status} — ${json.error_message || ''}`);
  }
  return json;
}

function normalisePhone(raw, countryCode) {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  if (!digits.startsWith('+')) {
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = '+' + countryCode + digits;
  }
  return digits;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function searchPlaces(keyword, location) {
  const query = `${keyword} en ${location}`;
  console.log(`\n🔍 Searching Google Places for: "${query}"`);

  let allResults = [];
  let pageToken = undefined;

  // Google Places Text Search returns up to 20 results per page, max 3 pages (60 total)
  do {
    const params = { query, language: 'es' };
    if (pageToken) {
      params.pagetoken = pageToken;
      await sleep(2000); // API requires a short wait before using next_page_token
    }

    const data = await apiGet('textsearch', params);
    allResults = allResults.concat(data.results || []);
    pageToken = data.next_page_token;

    if (allResults.length >= config.maxLeads) break;
  } while (pageToken);

  const slice = allResults.slice(0, config.maxLeads);
  console.log(`📌 Found ${slice.length} listings. Fetching phone numbers...\n`);

  let newLeads = 0;

  for (let i = 0; i < slice.length; i++) {
    const place = slice[i];
    try {
      // Fetch full details to get phone number
      const detail = await apiGet('details', {
        place_id: place.place_id,
        fields: 'name,formatted_phone_number,formatted_address,website,types',
        language: 'es',
      });

      const p = detail.result;
      if (!p?.formatted_phone_number) {
        console.log(`  [${i + 1}/${slice.length}] ⏭  No phone — ${place.name}`);
        continue;
      }

      const phone = normalisePhone(p.formatted_phone_number, config.countryCode);
      const category = (p.types || [])
        .filter((t) => !['point_of_interest', 'establishment'].includes(t))
        .join(', ')
        .replace(/_/g, ' ');

      const lead = {
        name: p.name || place.name,
        phone,
        address: p.formatted_address || '',
        website: p.website || '',
        category,
        place_id: place.place_id,
        search_query: query,
      };

      const result = insertLead(lead);
      if (result.changes > 0) {
        newLeads++;
        console.log(`  [${i + 1}/${slice.length}] ✅ ${lead.name} — ${lead.phone}`);
      } else {
        console.log(`  [${i + 1}/${slice.length}] ♻️  Already exists — ${lead.name}`);
      }

      // Respect Places API rate limits
      await sleep(200);
    } catch (err) {
      console.log(`  [${i + 1}/${slice.length}] ❌ ${place.name}: ${err.message.slice(0, 80)}`);
    }
  }

  logSearch(keyword, location, newLeads);
  console.log(`\n✅ Done. ${newLeads} new leads saved.`);
  return newLeads;
}
