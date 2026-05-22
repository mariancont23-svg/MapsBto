# MapsBto — Tutorial

This bot finds businesses on Google Maps that **don't have a website** and sends them a WhatsApp message from your WhatsApp Business account.

---

## Before you start — read this

> ⚠️ **WhatsApp rules**
> - Use a **WhatsApp Business** account, not your personal one
> - Never send more than **80 messages per day**
> - Always wait at least **18 seconds between messages** (already set by default)
> - Make your message sound natural — avoid words like "free", "offer", "promo"
> - Start with **10–20 messages the first day**, then increase gradually
>
> Breaking these rules can get your number **temporarily or permanently banned**.

> ⚠️ **Google Maps rules**
> - Don't run more than **3–4 searches per hour**
> - If the browser gets stuck or Google shows a CAPTCHA, stop and wait 30 minutes
> - Don't close the browser window while it's scraping

---

## Step 1 — Install the required software (one time only)

### 1.1 Install Node.js
1. Go to **https://nodejs.org**
2. Download the **LTS** version (big green button)
3. Run the installer — click Next on everything, keep all defaults

### 1.2 Install Git
1. Go to **https://git-scm.com/download/win**
2. Download and run the installer — keep all defaults

### 1.3 Open PowerShell
Press `Win + R`, type `powershell`, press Enter

---

## Step 2 — Download and set up the bot (one time only)

Paste these commands one by one into PowerShell:

```powershell
git clone https://github.com/mariancont23-svg/MapsBto.git
cd MapsBto
npm install
npx playwright install chromium
```

Wait for each one to finish before running the next. `npm install` may take 2–3 minutes.

---

## Step 3 — Configure your settings (one time only)

```powershell
copy .env.example .env
notepad .env
```

A text file opens. Change these values:

```
COUNTRY_CODE=40
```
*(40 is Romania. Change to 44 for UK, 49 for Germany, etc.)*

Scroll down to `MESSAGE_TEMPLATE` and write your message. Use `{name}` where you want the business name to appear. Example:

```
MESSAGE_TEMPLATE=Bună ziua, {name}! 👋

Am găsit afacerea dvs. pe Google Maps și am vrut să vă contactez.

Suntem o agenție de web design și ajutăm afacerile locale să atragă mai mulți clienți printr-un site web profesional.

Dacă vă interesează, vă oferim o consultație gratuită fără nicio obligație. 🙌

Când aveți un moment să discutăm?
```

Save the file: press `Ctrl + S`, then close Notepad.

---

## Step 4 — Find leads (scraping)

This opens a Chrome window and automatically searches Google Maps for businesses without a website.

```powershell
npm run scrape -- -k "restaurante" -l "București" --max 20
```

**Replace:**
- `restaurante` → the type of business you're looking for
- `București` → the city
- `20` → how many leads you want (max 60 per search)

**Examples:**
```powershell
npm run scrape -- -k "saloane de înfrumusețare" -l "Cluj-Napoca" --max 20
npm run scrape -- -k "cabinete stomatologice" -l "Timișoara" --max 15
npm run scrape -- -k "florării" -l "Brașov" --max 20
```

While running you will see:
```
  ✅ Restaurant Buna — +40712345678    ← saved (no website)
  ⏭  Pizzeria Roma — has website      ← skipped automatically
  ⏭  No phone — Cafe Central          ← skipped (no phone listed)
```

Wait for it to finish before moving to Step 5.

---

## Step 5 — Check your leads

```powershell
npm run leads
```

You will see something like:
```
── Lead Statistics ─────────────────
  Total        18
  No website   18  ← your targets
  Has website  0
  Pending      18
  Sent         0
  Failed       0
```

If you're happy with the results, continue to Step 6.

---

## Step 6 — Send WhatsApp messages

```powershell
npm run send
```

**First time only:** a QR code appears in the terminal.
1. Open **WhatsApp Business** on your phone
2. Tap the three dots (⋮) → **Linked devices** → **Link a device**
3. Scan the QR code on your screen
4. Wait a few seconds — the bot will say `🤖 WhatsApp bot ready!`

The bot then sends messages one by one with a delay between each. **Do not close PowerShell while it's running.**

You will see:
```
✅ Sent → Restaurant Buna (+40712345678)
   ⏳ Waiting 21s...

✅ Sent → Salon Elegant (+40723456789)
   ⏳ Waiting 19s...
```

When finished:
```
📊 Done!  Sent: 18  |  Failed: 2
```

---

## Do everything in one command

Instead of running scrape and send separately, you can do both at once:

```powershell
npm run run:auto -- -k "restaurante" -l "București" --max 20
```

This scrapes first, then opens WhatsApp and sends automatically.

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run leads` | Show all leads and stats |
| `npm run clear` | Delete all leads and start fresh |
| `npm run reset` | Reset failed leads so they get retried |
| `npm run send -- --number 10` | Send to max 10 leads this session |

---

## Something went wrong?

**WhatsApp disconnected mid-send:**
The bot retries automatically up to 4 times. If it still fails, just run `npm run send` again — it picks up where it left off (already-sent leads are skipped).

**The browser got stuck on Google Maps:**
Close PowerShell, wait 15 minutes, then try again with a smaller `--max` number.

**"No pending leads" message:**
Either everything was already sent, or all scraped businesses had websites. Run `npm run scrape` again with a different keyword or city.

**QR code keeps appearing every time:**
Your session expired. Delete the sessions folder and scan again:
```powershell
Remove-Item -Recurse -Force sessions
npm run send
```

---

## Daily workflow (after setup)

```powershell
cd MapsBto
npm run scrape -- -k "YOUR KEYWORD" -l "YOUR CITY" --max 20
npm run leads
npm run send
```

That's it. Takes about 5 minutes to set up, then the bot does the rest.
