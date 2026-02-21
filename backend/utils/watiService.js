/**
 * WATI (WhatsApp API) integration service.
 * Creates/updates contacts and optionally sends template messages.
 * Requires WATI_API_KEY and WATI_BASE_URL in environment.
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const WATI_BASE_URL = process.env.WATI_BASE_URL || ''; // e.g. https://live-server-XXXXX.wati.io
const WATI_API_KEY = process.env.WATI_API_KEY || '';
const WATI_TEMPLATE_PAID = process.env.WATI_TEMPLATE_PAID || '';   // Optional: template name for paid users
const WATI_TEMPLATE_UNPAID = process.env.WATI_TEMPLATE_UNPAID || ''; // Optional: template name for unpaid users
const WATI_CHANNEL_NUMBER = process.env.WATI_CHANNEL_NUMBER || '';   // Required for sending templates (WhatsApp channel number)

/**
 * Normalize phone for WATI: country code, no + symbol.
 * @param {string} phone - Raw phone (may contain +, spaces, dashes)
 * @returns {string} Digits only (country code + number)
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '').trim();
}

/**
 * Make HTTPS/HTTP request to WATI API.
 * @param {string} method - GET, POST, etc.
 * @param {string} path - e.g. /api/v1/addContact/919876543210
 * @param {object} body - Optional JSON body
 * @returns {Promise<{ success: boolean, data?: object, statusCode?: number }>}
 */
function watiRequest(method, path, body = null) {
  return new Promise((resolve) => {
    if (!WATI_BASE_URL || !WATI_API_KEY) {
      console.warn('[WATI] Skipped: WATI_BASE_URL or WATI_API_KEY not set');
      return resolve({ success: false });
    }

    const url = new URL(path, WATI_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${WATI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (_) {
          parsed = { raw: data };
        }
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data: parsed
        });
      });
    });

    req.on('error', (err) => {
      console.error('[WATI] Request error:', err.message);
      resolve({ success: false, error: err.message });
    });

    if (body && (method === 'POST' || method === 'PUT')) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Create or update a contact in WATI with custom attributes (Email, PaymentStatus).
 * WATI addContact creates or updates the contact; we pass name and customParams.
 *
 * @param {object} params
 * @param {string} params.name - Full name
 * @param {string} params.phone - Phone with country code (no +)
 * @param {string} [params.email] - Email
 * @param {string} [params.paymentStatus] - 'paid' | 'unpaid'
 * @returns {Promise<boolean>} - true if sync succeeded (or skipped), false on API failure
 */
async function createOrUpdateContact({ name, phone, email, paymentStatus }) {
  const whatsappNumber = normalizePhone(phone);
  if (!whatsappNumber) {
    console.warn('[WATI] createOrUpdateContact: missing or invalid phone');
    return false;
  }

  const customParams = [];
  if (email) customParams.push({ name: 'Email', value: String(email) });
  if (paymentStatus !== undefined && paymentStatus !== null) {
    customParams.push({ name: 'PaymentStatus', value: String(paymentStatus).toLowerCase() });
  }

  const body = {
    name: name || 'Unknown',
    customParams: customParams.length ? customParams : undefined
  };

  const path = `/api/v1/addContact/${encodeURIComponent(whatsappNumber)}`;
  const result = await watiRequest('POST', path, body);

  if (!result.success) {
    console.error('[WATI] createOrUpdateContact failed:', result.statusCode, result.data);
    return false;
  }
  return true;
}

/**
 * Send a template message to a contact (optional).
 * Use WATI dashboard to create templates; set WATI_TEMPLATE_PAID / WATI_TEMPLATE_UNPAID and WATI_CHANNEL_NUMBER to trigger.
 *
 * @param {string} phone - Phone with country code (no +)
 * @param {string} templateName - Template name as in WATI
 * @param {Array<{ name: string, value: string }>} [parameters] - Template parameters if required
 * @returns {Promise<boolean>}
 */
async function sendTemplateMessage(phone, templateName, parameters = []) {
  const whatsappNumber = normalizePhone(phone);
  if (!whatsappNumber || !templateName || !WATI_CHANNEL_NUMBER) return false;
  if (!WATI_BASE_URL || !WATI_API_KEY) return false;

  const body = {
    template_name: templateName,
    broadcast_name: `template_${Date.now()}`,
    channel_number: WATI_CHANNEL_NUMBER,
    parameters: (parameters || []).map(p => ({ name: p.name, value: p.value }))
  };

  const path = `/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(whatsappNumber)}`;
  const result = await watiRequest('POST', path, body);

  if (!result.success) {
    console.error('[WATI] sendTemplateMessage failed:', result.statusCode, result.data);
    return false;
  }
  return true;
}

/**
 * Sync a registration to WATI: create/update contact and optionally send template by payment status.
 * Call this after saving the user (registration or after payment verification).
 *
 * @param {object} user - User document or plain object with fname, lname?, email, mobile, isPaid
 */
async function syncRegistrationToWati(user) {
  if (!user || !user.mobile) return;

  const name = [user.fname, user.lname].filter(Boolean).join(' ').trim() || user.fname || 'Unknown';
  const paymentStatus = user.isPaid ? 'paid' : 'unpaid';

  try {
    const ok = await createOrUpdateContact({
      name,
      phone: user.mobile,
      email: user.email,
      paymentStatus
    });
    if (!ok) return;

    const templateName = paymentStatus === 'paid' ? WATI_TEMPLATE_PAID : WATI_TEMPLATE_UNPAID;
    if (templateName) {
      await sendTemplateMessage(user.mobile, templateName, []);
    }
  } catch (err) {
    console.error('[WATI] syncRegistrationToWati error:', err.message);
  }
}

module.exports = {
  normalizePhone,
  createOrUpdateContact,
  sendTemplateMessage,
  syncRegistrationToWati
};
