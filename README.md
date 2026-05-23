# 🗺️ Maps WhatsApp Lead Bot

> Automatically find businesses on Google Maps with **no website** and send them a WhatsApp Business message — no paid APIs, no third-party services, runs on your own machine.

![Node.js](https://img.shields.io/badge/Node.js-22%2B-brightgreen?logo=node.js)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Linux%20%7C%20Android-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Business-25D366?logo=whatsapp)

---

## What it does

1. **Scrapes Google Maps** for a business type and city you choose
2. **Filters automatically** — only saves businesses with no website (your real targets)
3. **Sends WhatsApp messages** from your WhatsApp Business account with a personalised message
4. **Tracks everything** in a local SQLite database — never contacts the same number twice

Perfect for **web design agencies**, **freelancers**, and **digital marketing consultants** looking for cold outreach leads that actually need their service.

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
npm run scrape -- -k "restaurants" -l "New York" --max 20
         ↓
   Playwright opens Google Maps, scrolls results,
   checks each listing for a website — skips it if found,
   saves only businesses WITHOUT a website to SQLite.

npm run send
         ↓
   Scan QR with your WhatsApp Business phone (once, session saved).
   Bot checks each number exists on WhatsApp,
   sends your personalised message with safe delays between sends.
```

---

## Features

- ✅ **Website filter** — skips businesses that already have a website during scraping
- ✅ **Deduplication** — same phone number never contacted twice across sessions
- ✅ **Auto-retry** — reconnects automatically if WhatsApp drops mid-session
- ✅ **No paid API** needed for the desktop version (uses Playwright browser)
- ✅ **Android version** included — runs in Termux with Google Places API + Baileys
- ✅ **Configurable message** — personalise with `{name}`, `{category}`, `{address}`
- ✅ **Safe delays** — randomised waits between messages to avoid bans
- ✅ **Simple CLI** — scrape, send, leads, reset, clear

---

## Requirements

- **Node.js 22 or higher** — https://nodejs.org (download LTS)
- **Git** — https://git-scm.com
- **WhatsApp Business** account on your phone

---

## Quick Start

```bash
git clone YOUR_REPO_URL
cd MapsBto
npm install
npx playwright install chromium
cp .env.example .env
```

Edit `.env` with your country code and message, then:

```bash
npm run scrape -- -k "restaurants" -l "London" --max 20
npm run send
```

Full setup guide: [TUTORIAL.md](TUTORIAL.md)

---

## Commands

| Command | Description |
|---|---|
| `npm run scrape -- -k "type" -l "city"` | Find leads on Google Maps |
| `npm run send` | Send WhatsApp messages to all pending leads |
| `npm run run:auto -- -k "type" -l "city"` | Scrape + send in one command |
| `npm run leads` | View all leads and stats |
| `npm run reset` | Reset failed leads back to pending |
| `npm run clear` | Delete all leads and start fresh |

---

## Configuration (`.env`)

| Variable | Description | Default |
|---|---|---|
| `COUNTRY_CODE` | Your country code without `+` | `40` |
| `MESSAGE_DELAY_MS` | Milliseconds between messages (min: 15000) | `18000` |
| `SCRAPE_DELAY_MS` | Milliseconds between page loads | `2500` |
| `MAX_LEADS` | Max no-website leads to collect per search | `50` |
| `SCRAPER_HEADLESS` | `false` = visible browser, `true` = background | `false` |
| `MESSAGE_TEMPLATE` | Outreach message. Use `{name}` `{category}` `{address}` | see `.env.example` |

**Country codes:** Romania=40, UK=44, Germany=49, France=33, USA=1, Spain=34, Italy=39

---

## Avoiding bans

### WhatsApp
- Use a **WhatsApp Business** account, not a personal one
- Maximum **80 messages per day**
- Keep `MESSAGE_DELAY_MS` at **18000 or higher**
- Start with **10–20 messages your first day**, then scale up slowly
- Write natural-sounding messages — avoid "free", "offer", "click here"

### Google Maps
- Maximum **3–4 searches per hour**
- If you see a CAPTCHA, stop and wait 30 minutes
- Don't close the browser while scraping

---

## Android version (no computer needed)

A Termux-compatible version lives in the `phone/` folder. It uses:
- **Google Places API** instead of Playwright — no browser needed
- **Baileys** instead of whatsapp-web.js — pure WebSocket, no Puppeteer

See [`phone/README.md`](phone/README.md) for setup.

---

## Project structure

```
src/
  index.js      CLI — all commands
  scraper.js    Playwright-based Google Maps scraper
  whatsapp.js   whatsapp-web.js client + sending logic
  database.js   SQLite schema and queries
  config.js     .env loader
phone/
  src/          Android/Termux version (Places API + Baileys)
TUTORIAL.md     Full step-by-step guide for first-time users
```

---

## License

MIT — see [LICENSE](LICENSE)

---

*Keywords: whatsapp bot, google maps scraper, lead generation bot, whatsapp business automation, cold outreach tool, web design leads, google maps automation, whatsapp marketing, playwright scraper, nodejs whatsapp bot, business leads scraper, no website leads*
