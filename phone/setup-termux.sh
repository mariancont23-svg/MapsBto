#!/data/data/com.termux/files/usr/bin/bash
# MapsBto — Termux setup script
# Run once: bash setup-termux.sh

set -e

echo ""
echo "🤖 MapsBto — Termux Setup"
echo "──────────────────────────"

echo ""
echo "📦 Updating packages..."
pkg update -y && pkg upgrade -y

echo ""
echo "📦 Installing Node.js and git..."
pkg install nodejs git python -y

echo ""
echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "⚙️  Creating .env from template..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   ✅ .env created. Edit it and add your GOOGLE_PLACES_API_KEY!"
else
  echo "   ℹ️  .env already exists, skipping."
fi

echo ""
echo "────────────────────────────────────"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and set your GOOGLE_PLACES_API_KEY"
echo "     (get one free at https://console.cloud.google.com)"
echo ""
echo "  2. Scrape leads:"
echo "     npm run scrape -- -k \"restaurantes\" -l \"Madrid\""
echo ""
echo "  3. Send WhatsApp messages:"
echo "     npm run send"
echo ""
