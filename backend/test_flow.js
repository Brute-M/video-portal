const fs = require('fs');
const path = require('path');

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    const baseURL = 'http://localhost:5000';

    console.log('--- Starting Verification ---');

    // 1. Create dummy files
    const trailVidPath = path.join(__dirname, 'dummy_trail.txt');
    const mainVidPath = path.join(__dirname, 'dummy_main.txt');
    fs.writeFileSync(trailVidPath, 'Dummy Trail Video Content');
    fs.writeFileSync(mainVidPath, 'Dummy Main Video Content');

    // 2. Register
    console.log('\n--- 1. Registering User ---');
    const form = new FormData();
    form.append('fname', 'Test');
    form.append('lname', 'User');
    form.append('email', 'testuser_' + Date.now() + '@example.com');
    form.append('password', 'password123');
    form.append('mobile', '1234567890');
    form.append('otp', '1234');
    form.append('gender', 'Male');
    form.append('zone_id', 'Zone1');
    form.append('city', 'Test City');
    form.append('state', 'Test State');
    form.append('pincode', '110001');
    form.append('address1', 'Test Address 1');
    form.append('aadhar', '123456789012');

    // Append file
    const fileBlob = new Blob([fs.readFileSync(trailVidPath)], { type: 'text/plain' });
    form.append('trail_video', fileBlob, 'dummy_trail.txt');

    try {
        const regRes = await fetch(`${baseURL}/auth/register`, {
            method: 'POST',
            body: form
        });

        const regData = await regRes.json();
        console.log('Registration Status:', regRes.status);
        console.log('Registration Response:', regData);

        if (regRes.status !== 201) return;

        // 3. Login
        console.log('\n--- 2. Logging In ---');
        // Actually, register returns the email/id, but we need token to call protected routes.
        // Wait, did I login in register? 
        // Checking authController... register does NOT return token in original code, only login does.
        // I will login now.

        const loginRes = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: regData.email,
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        if (loginRes.status !== 200) return;
        const token = loginData.token;
        console.log('Token received');

        // 4. Upload Video
        console.log('\n--- 3. Uploading Dashboard Video ---');
        const vidForm = new FormData();
        const mainBlob = new Blob([fs.readFileSync(mainVidPath)], { type: 'text/plain' });
        vidForm.append('video', mainBlob, 'dummy_main.txt');

        const uploadRes = await fetch(`${baseURL}/api/video/upload`, {
            method: 'POST',
            headers: {
                'Authorization': token
            },
            body: vidForm
        });

        const uploadData = await uploadRes.json();
        console.log('Upload Status:', uploadRes.status);
        console.log('Upload Response:', uploadData);

        if (uploadRes.status !== 201) return;
        const videoId = uploadData.videoId;

        // 5. Payment
        console.log('\n--- 4. Finalizing Payment ---');
        const payRes = await fetch(`${baseURL}/api/video/payment-success`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ videoId })
        });

        const payData = await payRes.json();
        console.log('Payment Status:', payRes.status);
        console.log('Payment Response:', payData);

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        // Cleanup
        if (fs.existsSync(trailVidPath)) fs.unlinkSync(trailVidPath);
        if (fs.existsSync(mainVidPath)) fs.unlinkSync(mainVidPath);
    }
}

runTest();
