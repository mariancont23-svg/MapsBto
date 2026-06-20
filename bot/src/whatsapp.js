import config from './config.js';

export async function sendWhatsAppMessage(phone) {
  const digits = phone.replace(/\D/g, '');

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
        type: 'template',
        template: {
          name: 'mesaj1',
          language: { code: 'ro' },
        },
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}
