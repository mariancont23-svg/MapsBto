import dotenv from 'dotenv';
dotenv.config();

export default {
  countryCode: process.env.COUNTRY_CODE || '34',
  messageDelayMs: parseInt(process.env.MESSAGE_DELAY_MS) || 18000,
  scrapeDelayMs: parseInt(process.env.SCRAPE_DELAY_MS) || 2500,
  maxLeads: parseInt(process.env.MAX_LEADS) || 50,
  scraperHeadless: process.env.SCRAPER_HEADLESS !== 'false',
  sessionPath: './sessions/whatsapp',
  dbPath: './data/leads.db',
  messageTemplate:
    process.env.MESSAGE_TEMPLATE ||
    `Hola {name}! 👋

Vi tu negocio en Google Maps y quería escribirte.

Somos una agencia de diseño web y ayudamos a negocios locales como el tuyo a conseguir más clientes con una página web profesional.

Si te interesa, podemos hacer una consulta gratuita sin compromiso. 🙌

¿Cuándo tienes un momento para hablar?`,
};
