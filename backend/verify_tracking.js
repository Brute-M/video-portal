const axios = require('axios');

async function testTracking() {
    const trackingId = 'test-' + Date.now();
    const trackend = 'step-one';

    try {
        console.log('Sending track request...');
        const trackRes = await axios.post('http://localhost:5000/auth/track-visit', {
            trackingId,
            trackend,
            ipAddress: '127.0.0.1',
            userAgent: 'TestScript/1.0'
        });

        console.log('Track Response Status:', trackRes.status);
        console.log('Track Response Data:', trackRes.data);

        if (trackRes.status !== 200 || !trackRes.data.success) {
            console.error('Tracking failed!');
            return;
        }

        console.log('Fetching visits to verify...');
        // Allow a moment for DB save if needed, though await should be enough in controller
        await new Promise(resolve => setTimeout(resolve, 1000));

        const visitsRes = await axios.get('http://localhost:5000/auth/visits?limit=5');

        if (visitsRes.status !== 200 || !visitsRes.data.success) {
            console.error('Failed to fetch visits!');
            return;
        }

        const visits = visitsRes.data.data.items;
        const found = visits.find(v => v.trackingId === trackingId);

        if (found) {
            console.log('Found visit record:', found);
            if (found.trackend === trackend) {
                console.log('SUCCESS: trackend field verified locally!');
            } else {
                console.error(`FAILURE: trackend mismatch. Expected '${trackend}', got '${found.trackend}'`);
            }
        } else {
            console.error('FAILURE: Created visit not found in latest visits list.');
        }

    } catch (error) {
        console.error('Error during test:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testTracking();
