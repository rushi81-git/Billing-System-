const axios = require('axios');
const { Notification } = require('../models');

/**
 * Sanitize phone — extract 10-digit Indian mobile number
 */
const sanitizePhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d]/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.slice(2);
  if (cleaned.length === 11 && cleaned.startsWith('0')) return cleaned.slice(1);
  return cleaned.slice(-10);
};

const sanitizePhoneWA = (phone) => `91${sanitizePhone(phone)}`;

// ─────────────────────────────────────────────────────────────
// FAST2SMS
// ─────────────────────────────────────────────────────────────
const sendSMS = async (bill, customer, message) => {
  let status = 'FAILED';
  let logMessage = message;

  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey || apiKey === 'your_fast2sms_api_key') {
      console.warn('[SMS] Fast2SMS not configured – skipping');
      await logNotification(bill.id, 'SMS', 'FAILED', 'Fast2SMS API key not set');
      return;
    }

    const phone = sanitizePhone(customer.phone);
    console.log(`[SMS] Sending to ${phone}...`);

    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'q', message, language: 'english', flash: 0, numbers: phone },
      { headers: { authorization: apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    console.log('[SMS] Fast2SMS raw response:', JSON.stringify(response.data));

    if (response.data?.return === true) {
      status = 'SENT';
      console.log(`[SMS] ✅ Successfully sent to ${phone}`);
    } else {
      logMessage = `Fast2SMS rejected: ${JSON.stringify(response.data)}`;
      console.error('[SMS] ❌', logMessage);
    }
  } catch (err) {
    logMessage = `Error: ${err.response?.data?.message || err.message}`;
    console.error('[SMS] ❌ Exception:', logMessage);
  }

  await logNotification(bill.id, 'SMS', status, logMessage);
};

// ─────────────────────────────────────────────────────────────
// WHATSAPP CLOUD API
// BUG FIX: was marking SENT without checking actual API response
// ─────────────────────────────────────────────────────────────
const sendWhatsApp = async (bill, customer, message) => {
  let status = 'FAILED';
  let logMessage = message;

  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;
    const version       = process.env.WHATSAPP_API_VERSION || 'v18.0';

    if (!phoneNumberId || !accessToken) {
      console.warn('[WhatsApp] Not configured – skipping');
      await logNotification(bill.id, 'WHATSAPP', 'FAILED', 'WhatsApp credentials not set');
      return;
    }

    if (/^\+?\d{10,11}$/.test(phoneNumberId)) {
      console.warn('[WhatsApp] ⚠️  WHATSAPP_PHONE_NUMBER_ID looks like a phone number — it must be the Meta numeric ID, not the actual number.');
    }

    const phone = sanitizePhoneWA(customer.phone);
    console.log(`[WhatsApp] Sending to ${phone}...`);
    console.log(`[WhatsApp] Using Phone Number ID: ${phoneNumberId}`);
    console.log(`[WhatsApp] Message: ${message}`);

    const response = await axios.post(
      `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    // ✅ FIXED: properly check the response body
    // Meta returns: { messaging_product, contacts: [...], messages: [{ id }] }
    console.log('[WhatsApp] Raw API response:', JSON.stringify(response.data));

    const messageId = response.data?.messages?.[0]?.id;
    if (messageId) {
      status = 'SENT';
      logMessage = `Sent. Meta message_id: ${messageId}`;
      console.log(`[WhatsApp] ✅ Sent to ${phone} | message_id: ${messageId}`);
    } else {
      // API returned 200 but no message ID — treat as failure
      logMessage = `No message ID in response: ${JSON.stringify(response.data)}`;
      console.error('[WhatsApp] ❌ Unexpected response:', logMessage);
    }

  } catch (err) {
    // Axios throws on 4xx/5xx — get the actual Meta error detail
    const metaError = err.response?.data?.error;
    if (metaError) {
      logMessage = `Meta API Error ${metaError.code}: ${metaError.message} | ${metaError.error_data?.details || ''}`;
      console.error('[WhatsApp] ❌ Meta error:', logMessage);

      // Print actionable hint based on error code
      if (metaError.code === 190) console.error('[WhatsApp] 🔑 Access token expired — refresh it in Meta Developer Console');
      if (metaError.code === 131030) console.error('[WhatsApp] 📵 Recipient not in allowed test numbers — add them in Meta Dev Console → WhatsApp → API Setup');
      if (metaError.code === 100) console.error('[WhatsApp] 🆔 Invalid Phone Number ID — check WHATSAPP_PHONE_NUMBER_ID in .env');
    } else {
      logMessage = `Error: ${err.message}`;
      console.error('[WhatsApp] ❌ Network/unknown error:', logMessage);
    }
  }

  await logNotification(bill.id, 'WHATSAPP', status, logMessage);
};

/**
 * Log notification to DB (never throws)
 */
const logNotification = async (billId, type, status, message) => {
  try {
    await Notification.create({ bill_id: billId, type, status, message, sent_at: new Date() });
  } catch (err) {
    console.error('[Notification Log] DB save failed:', err.message);
  }
};

// ─── Message builders ────────────────────────────────────────
const buildInvoiceMessage = (bill, customer, invoiceUrl, amountPaid, amountDue) => {
  const shopName  = process.env.SHOP_NAME || 'our store';
  const total     = parseFloat(bill.final_amount).toFixed(2);
  const paid      = parseFloat(amountPaid || bill.amount_paid || total).toFixed(2);
  const due       = parseFloat(amountDue  || bill.amount_due  || 0).toFixed(2);
  const urlLine   = invoiceUrl ? `\nView Invoice: ${invoiceUrl}` : '';
  const isPending = parseFloat(due) > 0;

  let msg =
    `Thank you for shopping at ${shopName}!\n` +
    `Bill ID: ${bill.bill_id}\n` +
    `Total Bill: Rs.${total}\n` +
    `Paid Now:   Rs.${paid}\n`;

  if (isPending) {
    msg += `Balance Due: Rs.${due}\n`;
    if (bill.due_date) msg += `Due Date: ${bill.due_date}\n`;
    msg += `Status: PENDING (Partial Payment)`;
  } else {
    msg += `Status: PAID ✅`;
  }

  msg += urlLine;
  return msg;
};

const buildReminderMessage = (bill, customer) => {
  const shopName = process.env.SHOP_NAME || 'Store';
  const due      = parseFloat(bill.amount_due || bill.final_amount).toFixed(2);
  return (
    `Dear ${customer.name},\n` +
    `Reminder from ${shopName}: Your balance of Rs.${due} ` +
    `(Bill: ${bill.bill_id}) is due${bill.due_date ? ` by ${bill.due_date}` : ''}.\n` +
    `Please visit us or contact us to clear the balance. Thank you!`
  );
};

module.exports = {
  sendSMS,
  sendWhatsApp,
  logNotification,
  buildInvoiceMessage,
  buildReminderMessage,
};
