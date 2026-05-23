# Maps WhatsApp Lead Bot

Automatically find businesses on Google Maps that **don't have a website** and send them a WhatsApp Business message — directly from your account, no third-party services needed.

---

## ⚠️ Legal & Ethical Disclaimer

**Read this before using.**

- This tool is intended for **legitimate outreach to real businesses** for services they may genuinely need.
- You are solely responsible for how you use this software. The authors accept no liability for misuse, bans, legal issues, or damages of any kind.
- Respect **WhatsApp's Terms of Service** — mass unsolicited messaging is a violation and can result in your number being permanently banned.
- Respect **Google's Terms of Service** — automated scraping of Google Maps may violate their ToS. Use responsibly, with delays, and at low volume.
- Never send misleading, deceptive, or illegal messages.
- Always give recipients an easy way to ask you to stop.

**This software is provided as-is. Use at your own risk.**

---

## How it works

```
npm run scrape -- -k "restaurants" -l "New York"
         ↓
   Playwright opens Google Maps, scrolls results,
   clicks each listing, checks for a website,
   saves only businesses WITHOUT a website to SQLite.

npm run send
         ↓
   Scan QR with your WhatsApp Business phone (once).
   Bot verifies each number is on WhatsApp,
   sends your message with a safe delay between sends.
```

---

## Requirements

- **Node.js 22 or higher** — https://nodejs.org (download LTS)
- **Git** — https://git-scm.com
- **WhatsApp Business** account on your phone

---

## Setup

```bash
git clone YOUR_REPO_URL
cd MapsBto
npm install
npx playwright install chromium
cp .env.example .env
```

Edit `.env` with your settings (see Configuration below), then you're ready.

---

## Configuration (`.env`)

| Variable | Description | Default |
|---|---|---|
| `COUNTRY_CODE` | Your country code without `+` | `40` |
| `MESSAGE_DELAY_MS` | Milliseconds between WhatsApp messages (min: 15000) | `18000` |
| `SCRAPE_DELAY_MS` | Milliseconds between Google Maps page loads | `2500` |
| `MAX_LEADS` | Max leads to collect per search | `50` |
| `SCRAPER_HEADLESS` | `false` = show browser, `true` = run in background | `false` |
| `MESSAGE_TEMPLATE` | Your outreach message. Placeholders: `{name}` `{category}` `{address}` | see `.env.example` |

**Country codes:** Romania=40, UK=44, Germany=49, France=33, USA=1, Spain=34, Italy=39

---

## Commands

```bash
# Scrape leads from Google Maps (only saves businesses without a website)
npm run scrape -- -k "restaurants" -l "London" --max 20

# Send WhatsApp messages to all pending leads
npm run send

# Scrape + send in one command
npm run run:auto -- -k "restaurants" -l "London" --max 20

# View leads and stats
npm run leads

# Reset failed leads back to pending
npm run reset

# Delete all leads and start fresh
npm run clear
```

---

## Avoiding bans

### WhatsApp
- Use a **WhatsApp Business** account, not a personal one
- Maximum **80 messages per day**
- Keep `MESSAGE_DELAY_MS` at **18000 or higher** (18 seconds between messages)
- Start slow: **10–20 messages the first day**, then increase gradually
- Your message must sound human and natural
- Never include spam trigger words

### Google Maps
- Maximum **3–4 searches per hour**
- If you see a CAPTCHA, stop and wait 30 minutes before retrying
- Don't close the browser while it's scraping

---

## Android (phone version)

A Termux-compatible version is available in the `phone/` folder.
It uses the **Google Places API** instead of Playwright (no browser needed)
and **Baileys** instead of whatsapp-web.js (no Puppeteer needed).

See [`phone/README.md`](phone/README.md) for setup instructions.

---

## Database

Leads are stored in `data/leads.db` (SQLite, auto-created). Each lead has a status:

| Status | Meaning |
|---|---|
| `pending` | Not yet contacted |
| `sent` | Message delivered |
| `failed` | Not on WhatsApp or send error |

The same phone number is **never messaged twice**.

---

## Project structure

```
src/
  index.js      CLI — all commands
  scraper.js    Playwright Google Maps scraper
  whatsapp.js   WhatsApp Web client + message sending
  database.js   SQLite schema and queries
  config.js     Loads .env settings
phone/
  src/          Android/Termux version (Places API + Baileys)
data/           SQLite database (auto-created, gitignored)
sessions/       WhatsApp session (auto-created, gitignored)
TUTORIAL.md     Step-by-step guide for first-time users
```

---

## License

MIT — see [LICENSE](LICENSE)
