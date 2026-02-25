/**
 * Generate a TOTP secret for Admin 2FA (Google Authenticator).
 * Run once: node scripts/generate-admin-2fa-secret.js
 * Add the printed ADMIN_2FA_SECRET to your .env file.
 * Scan the QR code (or enter the secret manually) in Google Authenticator.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@brpl.com';
const issuer = 'BRPL Admin';

const secret = speakeasy.generateSecret({
  name: `${issuer} (${adminEmail})`,
  length: 20,
  issuer
});
const otpauthUrl = secret.otpauth_url;

console.log('\n--- Admin 2FA Setup (Google Authenticator) ---\n');
console.log('Add this to your backend .env file:\n');
console.log('ADMIN_2FA_SECRET="' + secret.base32 + '"');
console.log('\nOptional: set admin email/password if not already set:');
console.log('ADMIN_EMAIL="' + adminEmail + '"');
console.log('ADMIN_PASSWORD="your-secure-password"');
console.log('\n--- Add to Google Authenticator ---');
console.log('Option A: Scan QR code (saved as backend/scripts/admin-2fa-qr.png)');
console.log('Option B: Enter this secret manually in the app:');
console.log(secret.base32);
console.log('\n---');

if (otpauthUrl) {
  QRCode.toFile(
    require('path').join(__dirname, 'admin-2fa-qr.png'),
    otpauthUrl,
    { width: 256, margin: 2 },
    (err) => {
      if (err) console.error('QR save error:', err.message);
      else console.log('QR code saved to backend/scripts/admin-2fa-qr.png');
    }
  );
}
