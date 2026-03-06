const { request } = require('@playwright/test');

async function createApiContext() {
  return request.newContext({
    baseURL: process.env.API_BASE_URL || 'http://localhost:5001/api'
  });
}

async function loginAndGetToken(apiContext, email, password) {
  const response = await apiContext.post('/auth/login', {
    data: { email, password }
  });
  if (!response.ok()) {
    throw new Error(`API login failed for ${email}: ${response.status()}`);
  }

  const body = await response.json();
  return body?.data?.token;
}

async function getUsers(apiContext, token) {
  const response = await apiContext.get('/auth/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok()) {
    throw new Error(`Fetching users failed: ${response.status()}`);
  }
  const body = await response.json();
  return body?.data?.users || [];
}

module.exports = {
  createApiContext,
  loginAndGetToken,
  getUsers
};
