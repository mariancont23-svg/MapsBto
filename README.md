# MapsBto — Google Maps → WhatsApp Lead Bot

Automatically find businesses on Google Maps and send them a WhatsApp Business message from your account.

## How it works

```
npm run scrape -- -k "restaurantes" -l "Madrid"
         ↓
   Playwright opens Google Maps, scrolls results,
   clicks each listing, extracts phone number + details,
   saves everything to a local SQLite database.

npm run send
         ↓
   Scan QR with your WhatsApp Business phone (once).
   Bot checks each pending lead, verifies they're on WhatsApp,
   and sends your message with a safe delay between sends.
```

## Setup

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure your settings

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description | Default |
|---|---|---|
| `COUNTRY_CODE` | Default country code (no +). Spain=34, Colombia=57, Mexico=52 | `34` |
| `MESSAGE_DELAY_MS` | Milliseconds between WhatsApp messages | `18000` (18s) |
| `SCRAPE_DELAY_MS` | Milliseconds between Google Maps clicks | `2500` |
| `MAX_LEADS` | Max businesses to scrape per search | `50` |
| `SCRAPER_HEADLESS` | `false` = see the browser, `true` = run invisible | `false` |
| `MESSAGE_TEMPLATE` | Your WhatsApp message. Use `{name}`, `{category}`, `{address}` | see `.env.example` |

## Usage

### Scrape leads from Google Maps

```bash
# Basic
npm run scrape -- -k "restaurantes" -l "Madrid"

# With options
npm run scrape -- -k "peluquerias" -l "Barcelona" --max 100

# Other examples
npm run scrape -- -k "dentistas" -l "Bogotá"
npm run scrape -- -k "tiendas ropa" -l "Ciudad de México"
npm run scrape -- -k "fontaneros" -l "Valencia"
```

### Send WhatsApp messages

```bash
npm run send
```

On first run it shows a QR code — scan it with WhatsApp Business on your phone.  
After that the session is saved and QR is not needed again.

```bash
# Limit to 20 messages in this session
npm run send -- --number 20
```

### Check your leads

```bash
npm run leads
```

Shows stats (total / pending / sent / failed) and the most recent 30 leads.

## Tips to avoid WhatsApp bans

- Keep `MESSAGE_DELAY_MS` at **18000 or higher** (18 seconds minimum between messages)
- Don't send more than **100–150 messages per day** from one account
- Use a **WhatsApp Business** account, not a personal one
- Make sure your message sounds natural — avoid spam-like phrases
- Start with small batches (20–30) and increase gradually

## Database

Leads are stored in `data/leads.db` (SQLite). Each lead has a `status`:

- `pending` — not yet contacted
- `sent` — message delivered
- `failed` — not on WhatsApp or send error

The bot never sends to the same phone number twice (unique constraint).

## Project structure

```
src/
  index.js      CLI entry point (scrape / send / leads commands)
  scraper.js    Playwright-based Google Maps scraper
  whatsapp.js   whatsapp-web.js client + message sending
  database.js   SQLite schema and queries
  config.js     Loads .env settings
data/
  leads.db      SQLite database (auto-created, gitignored)
sessions/
  whatsapp/     WhatsApp session files (auto-created, gitignored)
```
