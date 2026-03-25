// fetch-admin-token.js
const axios = require('axios');

const USER_SERVICE_URL = 'http://localhost:8081'; // Change if needed
const ADMIN_USERNAME = 'testadmin1';     // Change to your admin username
const ADMIN_PASSWORD = 'passworda1';     // Change to your admin password

async function fetchAdminToken() {
  try {
    const res = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    console.log('Admin JWT token:\n', res.data.token);
  } catch (err) {
    console.error('Failed to fetch admin token:', err.response?.data || err.message);
  }
}

fetchAdminToken();
