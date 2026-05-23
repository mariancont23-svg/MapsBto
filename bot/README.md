# Discord Lead Bot — Deploy to Railway

Control the scraper from Discord on your phone. Type a command, leads appear in the channel.

## Commands

| Command | What it does |
|---|---|
| `!scrape restaurante București 20` | Find 20 leads in Bucharest with no website |
| `!scrape "hair salons" London 15` | Supports multi-word keywords in quotes |
| `!leads` | Show total leads in database |
| `!clear` | Delete all leads |
| `!help` | Show all commands |

---

## Deploy to Railway (free)

### 1. Create a Discord bot

1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name
3. Go to **Bot** → **Reset Token** → copy the token
4. Scroll down → enable **Message Content Intent**
5. Go to **OAuth2 → URL Generator** → check `bot`
6. Under Bot Permissions check: `Send Messages`, `Read Message History`, `View Channels`
7. Copy the generated URL → open it → add the bot to your server

### 2. Deploy on Railway

1. Go to https://railway.app → sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select this repo → set **Root Directory** to `bot`
4. Go to **Variables** and add:

| Variable | Value |
|---|---|
| `DISCORD_BOT_TOKEN` | your bot token from step 1 |
| `GOOGLE_PLACES_API_KEY` | your Places API key |
| `COUNTRY_CODE` | your country code (40=Romania) |
| `MESSAGE_TEMPLATE` | your WhatsApp outreach message |

5. Railway deploys automatically. Bot goes online in ~1 minute.

### 3. Use it

Open Discord on your phone and type in any channel where the bot is present:

```
!scrape restaurante București 20
```

Leads appear as cards with WhatsApp and Google Maps links.

---

## Notes

- The bot only saves and posts businesses **without a website**
- Each phone number is saved only once — no duplicates across sessions
- `!clear` resets the database if you want to start fresh
- Railway's free trial gives enough credits to run a small bot 24/7
