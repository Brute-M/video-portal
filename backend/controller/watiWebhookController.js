/**
 * WATI webhook controller.
 * Receives WATI events and logs them. Always responds with 200 OK to acknowledge delivery.
 */

const WEBHOOK_LOG_PREFIX = '[WATI Webhook]';

/**
 * Detect event type from WATI webhook payload (structure may vary by event).
 * @param {object} body - Raw webhook body
 * @returns {string} - Event type label for logging
 */
function getEventType(body) {
  if (!body || typeof body !== 'object') return 'unknown';
  // Common WATI webhook fields
  if (body.type) return body.type;
  if (body.event) return body.event;
  if (body.statusString) return `TemplateMessage_${body.statusString}`;
  if (body.message?.type) return `Message_${body.message.type}`;
  if (body.contact) return 'contact_event';
  if (body.message) return 'message_event';
  return 'unknown';
}

/**
 * POST /api/wati/webhook
 * Handle inbound WATI webhook events. Log and respond 200 OK.
 */
const handleWatiWebhook = async (req, res) => {
  // Acknowledge immediately so WATI doesn't retry
  res.status(200).send('OK');

  const body = req.body || {};
  const eventType = getEventType(body);

  try {
    // Log for: Contact Created, Message Received, Message Sent, Template Message Status
    console.log(`${WEBHOOK_LOG_PREFIX} Event: ${eventType}`, JSON.stringify(body, null, 2));
  } catch (err) {
    console.error(`${WEBHOOK_LOG_PREFIX} Log error:`, err.message);
  }
};

module.exports = {
  handleWatiWebhook
};
