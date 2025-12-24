const nodemailer = require('nodemailer');
require('dotenv').config();

const users = [
    { email: 'email-noreply@brpl.net', label: 'Env User' },
    { email: 'ektadev531@gmail.com', label: 'Codebase User' }
];

const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/"/g, '') : 'kvujrqktsgiybwyj';

const configs = [
    { host: 'smtp.gmail.com', port: 465, secure: true, label: 'Gmail 465' },
    { host: 'mail.brpl.net', port: 465, secure: true, label: 'BRPL 465' },
    { host: 'mail.brpl.net', port: 587, secure: false, label: 'BRPL 587' }
];

async function verify(user, config) {
    console.log(`Testing: ${user.label} (${user.email}) | ${config.label}`);
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: user.email,
            pass: pass // No spaces
        },
        tls: { rejectUnauthorized: false } // Relax security for test
    });

    try {
        await transporter.verify();
        console.log(`✅ SUCCESS: ${user.email} with ${config.label} works!`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${user.email} with ${config.label}: ${error.code} - ${error.responseCode}`);
        return false;
    }
}

async function run() {
    console.log(`Password used (first 4 chars): ${pass.substring(0, 4)}... (Length: ${pass.length})`);

    for (const user of users) {
        for (const config of configs) {
            await verify(user, config);
        }
    }
}

run();
