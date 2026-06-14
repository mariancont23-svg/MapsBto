import config from './config.js';

export async function sendWhatsAppMessage(phone, lead) {
  const digits = phone.replace(/\D/g, '');

  const body = config.messageTemplate
    .replace(/\{name\}/g, lead.name)
    .replace(/\{category\}/g, lead.category || 'business')
    .replace(/\{address\}/g, lead.address || '');

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${config.whatsappPhoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: digits,
        type: 'text',
        text: { preview_url: false, body },
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}
