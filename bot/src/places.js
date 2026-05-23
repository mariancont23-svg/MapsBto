import { insertLead } from './database.js';
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
    throw new Error(`Places API: ${json.status} — ${json.error_message || ''}`);
  }
  return json;
}

function normalisePhone(raw, countryCode) {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  if (!d.startsWith('+')) {
    if (d.startsWith('0')) d = d.slice(1);
    d = '+' + countryCode + d;
  }
  return d;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function searchPlaces(keyword, location, max, onLead) {
  const query = `${keyword} in ${location}`;
  const leads = [];
  let pageToken;

  do {
    const params = { query, language: 'en' };
    if (pageToken) { params.pagetoken = pageToken; await sleep(2000); }
    const data = await apiGet('textsearch', params);
    for (const place of (data.results || [])) {
      if (leads.length >= max) break;

      try {
        const detail = await apiGet('details', {
          place_id: place.place_id,
          fields: 'name,formatted_phone_number,formatted_address,website,types',
        });
        const p = detail.result;

        // Skip if has website
        if (p.website) continue;
        if (!p.formatted_phone_number) continue;

        const phone = normalisePhone(p.formatted_phone_number, config.countryCode);
        const category = (p.types || [])
          .filter((t) => !['point_of_interest', 'establishment'].includes(t))
          .join(', ').replace(/_/g, ' ');

        const lead = {
          name: p.name || place.name,
          phone,
          address: p.formatted_address || '',
          category,
          place_id: place.place_id,
          search_query: query,
        };

        const result = insertLead(lead);
        if (result.changes > 0) {
          leads.push(lead);
          if (onLead) await onLead(lead);
        }

        await sleep(200);
      } catch { /* skip failed places */ }
    }
    pageToken = data.next_page_token;
    if (leads.length >= max) break;
  } while (pageToken);

  return leads;
}
