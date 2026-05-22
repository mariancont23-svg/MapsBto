# MapsBto Phone Edition — Run directly on Android

No computer needed. Runs entirely inside **Termux** on your Android phone.

## Why different from the desktop version?

| | Desktop version | Phone version (this) |
|---|---|---|
| Maps scraping | Playwright browser | Google Places API (HTTP only) |
| WhatsApp client | whatsapp-web.js (Puppeteer) | Baileys (WebSocket, no browser) |
| Needs computer | ✅ Yes | ❌ No |
| Needs API key | ❌ No | ✅ Yes (free tier) |

---

## Setup (one time)

### 1. Install Termux

Download **Termux** from F-Droid (NOT the Play Store version, it's outdated):
- https://f-droid.org/packages/com.termux/

### 2. Clone and set up

Open Termux and run:

```bash
pkg install git -y
git clone https://github.com/mariancont23-svg/MapsBto.git
cd MapsBto/phone
bash setup-termux.sh
```

### 3. Get a Google Places API key (free)

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Go to **APIs & Services → Library**
4. Enable **"Places API"**
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Copy the key

Google gives **$200/month free credit** — that's roughly 40,000 place searches.

### 4. Add your API key

```bash
nano .env
```

Set:
```
GOOGLE_PLACES_API_KEY=AIza...your_key_here
COUNTRY_CODE=34   # change to your country
```

Save with `Ctrl+X → Y → Enter`

---

## Usage

### Find leads on Google Maps

```bash
npm run scrape -- -k "restaurantes" -l "Madrid"
npm run scrape -- -k "peluquerias" -l "Barcelona"
npm run scrape -- -k "dentistas" -l "Bogotá"
npm run scrape -- -k "fontaneros" -l "Valencia" --max 30
```

### Send WhatsApp messages

```bash
npm run send
```

A QR code appears in the terminal — scan it with **WhatsApp Business** on your phone.  
The session is saved so you only scan once.

```bash
# Send max 20 messages this session
npm run send -- --number 20
```

### Check lead stats

```bash
npm run leads
```

---

## Customise your message

Edit `.env` and set `MESSAGE_TEMPLATE`. Use:
- `{name}` — business name
- `{category}` — business type (restaurant, hair salon, etc.)
- `{address}` — street address

---

## Tips to avoid WhatsApp bans

- Keep `MESSAGE_DELAY_MS` at **18000 or higher** (18 seconds between messages)
- Don't send more than **100 messages per day**
- Use a **WhatsApp Business** account
- Keep your phone plugged in while sending (Termux can be killed by battery saver)
- To prevent Termux from sleeping: `termux-wake-lock` before running `npm run send`

---

## Keep Termux awake while sending

```bash
# Acquire wake lock (keeps CPU on)
termux-wake-lock

# Then send
npm run send

# Release when done
termux-wake-release
```
