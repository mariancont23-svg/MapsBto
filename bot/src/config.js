import dotenv from 'dotenv';
dotenv.config();

const required = (key) => {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
  return process.env[key];
};

export default {
  botToken:        required('DISCORD_BOT_TOKEN'),
  placesApiKey:    required('GOOGLE_PLACES_API_KEY'),
  countryCode:     process.env.COUNTRY_CODE || '40',
  defaultMax:      parseInt(process.env.DEFAULT_MAX_LEADS) || 20,
  dbPath:          './data/leads.db',
  whatsappToken:   process.env.WHATSAPP_TOKEN   || null,
  whatsappPhoneId: process.env.WHATSAPP_PHONE_ID || null,
  messageTemplate: process.env.MESSAGE_TEMPLATE ||
    `Hello {name}!

I found your business on Google Maps and wanted to reach out.

We are a web design agency and we help local businesses attract more customers with a professional website.

If you're interested, we offer a free consultation with no obligation.

When would be a good time to chat?`,
};
