# Tutorial — First Time Setup to First Scrape

This bot finds businesses on Google Maps that **don't have a website** and sends them a WhatsApp message from your WhatsApp Business account.

---

## ⚠️ Important — Read Before You Start

> **WhatsApp rules**
> - Use a **WhatsApp Business** account, not your personal one
> - Never send more than **80 messages per day**
> - Always wait at least **18 seconds between messages** (the bot does this automatically)
> - Write your message naturally — avoid words like "free", "offer", "promo", "click here"
> - Start with **10–20 messages your first day**, then increase slowly
>
> Ignoring these rules can get your number **temporarily or permanently banned**.

> **Google Maps rules**
> - Don't run more than **3–4 searches per hour**
> - If the browser gets a CAPTCHA, stop and wait 30 minutes before retrying
> - Don't close the browser window while it's working

> **Legal**
> - Only contact businesses that could genuinely benefit from your service
> - Never send misleading or deceptive messages
> - You are fully responsible for how you use this tool

---

## Step 1 — Install the required software (one time only)

### 1.1 Install Node.js
1. Go to **https://nodejs.org**
2. Click the big **LTS** button to download
3. Run the installer — click Next on everything, keep all defaults

### 1.2 Install Git
1. Go to **https://git-scm.com/download/win**
2. Run the installer — keep all defaults

### 1.3 Open PowerShell
Press `Win + R`, type `powershell`, press Enter

---

## Step 2 — Download and install the bot (one time only)

Paste these commands **one by one** into PowerShell. Wait for each to finish before running the next.

```powershell
git clone YOUR_REPO_URL
cd MapsBto
npm install
npx playwright install chromium
```

`npm install` may take 2–3 minutes — this is normal.

---

## Step 3 — Configure your settings (one time only)

```powershell
copy .env.example .env
notepad .env
```

A text file opens. The most important setting to change:

```
COUNTRY_CODE=40
```

Change `40` to your country's code:
- Romania = 40
- UK = 44
- Germany = 49
- France = 33
- Italy = 39
- USA = 1

Then scroll down to `MESSAGE_TEMPLATE` and write your message.
Use `{name}` where you want the business name to appear. Example:

```
MESSAGE_TEMPLATE=Hello {name}! 👋

I found your business on Google Maps and wanted to reach out.

We are a web design agency and we help local businesses attract more customers with a professional website.

If you're interested, we offer a free consultation with no obligation. 🙌

When would be a good time to chat?
```

Save the file: `Ctrl + S`, then close Notepad.

---

## Step 4 — Find leads

This opens a Chrome window and searches Google Maps for businesses **without a website**.

```powershell
npm run scrape -- -k "restaurants" -l "London" --max 20
```

Replace:
- `restaurants` → the type of business you want to contact
- `London` → the city
- `20` → how many leads you want (start small, max 60 per search)

While it runs you will see:
```
  ✅ Central Grill — +44712345678    ← saved (no website found)
  ⏭  The Italian Place — has website ← skipped automatically
  ⏭  Corner Cafe — no phone listed   ← skipped (can't contact)
```

Wait until it says `✅ Done` before continuing.

---

## Step 5 — Check your leads

```powershell
npm run leads
```

Example output:
```
── Lead Statistics ─────────────────
  Total        18
  No website   18  ← your targets
  Pending      18
  Sent         0
  Failed       0
```

If the results look good, continue to Step 6.

---

## Step 6 — Send WhatsApp messages

```powershell
npm run send
```

**First time only — scan the QR code:**
1. Open **WhatsApp Business** on your phone
2. Tap the three dots `⋮` → **Linked devices** → **Link a device**
3. Scan the QR code shown in PowerShell
4. Wait a few seconds — you will see `🤖 WhatsApp bot ready!`

The bot sends messages automatically with delays between each one. **Do not close PowerShell while it runs.**

```
✅ Sent → Central Grill (+44712345678)
   ⏳ Waiting 21s...

✅ Sent → Corner Bakery (+44723456789)
   ⏳ Waiting 19s...

📊 Done!  Sent: 18  |  Failed: 1
```

The QR session is saved — next time you run `npm run send` it connects automatically.

---

## Do scrape + send in one command

```powershell
npm run run:auto -- -k "restaurants" -l "London" --max 20
```

---

## All commands

| Command | What it does |
|---|---|
| `npm run scrape -- -k "type" -l "city" --max 20` | Find leads on Google Maps |
| `npm run send` | Send WhatsApp messages to all pending leads |
| `npm run run:auto -- -k "type" -l "city" --max 20` | Scrape + send in one step |
| `npm run leads` | Show all leads and stats |
| `npm run clear` | Delete all leads and start fresh |
| `npm run reset` | Reset failed leads so they get retried |
| `npm run send -- --number 10` | Send to maximum 10 leads this session |

---

## Troubleshooting

**WhatsApp disconnected while sending:**
The bot retries automatically up to 4 times. If it still fails, run `npm run send` again — already-sent leads are skipped.

**Browser got stuck / CAPTCHA appeared:**
Close PowerShell, wait 15–30 minutes, try again with a smaller `--max` number.

**"No pending leads" message:**
Either all leads were already sent, or all businesses had websites. Run `npm run scrape` with a different keyword or city.

**QR code appears every time:**
Your session expired. Delete the sessions folder and scan again:
```powershell
Remove-Item -Recurse -Force sessions
npm run send
```

---

## Daily workflow

```powershell
cd MapsBto
npm run scrape -- -k "YOUR KEYWORD" -l "YOUR CITY" --max 20
npm run leads
npm run send
```
