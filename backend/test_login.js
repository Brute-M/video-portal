const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'archnaprashadward34@gmail.com',
            password: 'nahush@123'
        });
        console.log("Login Success!");
        console.log("Status:", response.status);
        console.log("Data:", response.data);
    } catch (error) {
        console.log("Login Failed!");
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        } else {
            console.log("Error:", error.message);
        }
    }
}

testLogin();
