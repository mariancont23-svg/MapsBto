import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
  console.error('\n❌  GOOGLE_PLACES_API_KEY is not set in your .env file.');
  console.error('    Get a free key at: https://console.cloud.google.com\n');
  process.exit(1);
}

export default {
  placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  countryCode: process.env.COUNTRY_CODE || '40',
  discordWebhook: process.env.DISCORD_WEBHOOK_URL || '',
  messageDelayMs: parseInt(process.env.MESSAGE_DELAY_MS) || 18000,
  maxLeads: parseInt(process.env.MAX_LEADS) || 50,
  sessionPath: './sessions',
  dbPath: './data/leads.db',
  messageTemplate:
    process.env.MESSAGE_TEMPLATE ||
    `Hola {name}! 👋

Vi tu negocio en Google Maps y quería escribirte.

Somos una agencia de diseño web y ayudamos a negocios locales como el tuyo a conseguir más clientes con una página web profesional.

Si te interesa, podemos hacer una consulta gratuita sin compromiso. 🙌

¿Cuándo tienes un momento para hablar?`,
};
