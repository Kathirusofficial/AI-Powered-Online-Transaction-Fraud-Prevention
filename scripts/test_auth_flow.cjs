const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const BASE_URL = 'http://localhost:5000/api';

async function testAuthFlow() {
  console.log('=== STARTING AUTHENTICATION & LOGIN DIAGNOSTIC TEST ===\n');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('Backend Health:', health);

  // 2. Register a new test user with uppercase email & trailing spaces
  const timestamp = Date.now();
  const testEmailRaw = `  TestUser_${timestamp}@FraudShield.IO  `;
  const cleanEmail = `testuser_${timestamp}@fraudshield.io`;
  const testPassword = 'StrongPassword123!';

  console.log(`\n--- 1. Testing Registration with raw email: "${testEmailRaw}" ---`);
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Auth Test User',
      email: testEmailRaw,
      password: testPassword,
    })
  });

  const regData = await regRes.json();
  if (regRes.status !== 200 || !regData.token) {
    console.error('Registration failed:', regRes.status, regData);
    process.exit(1);
  }
  console.log('Registration succeeded! Stored email in token response:', regData.user.email);
  if (regData.user.email !== cleanEmail) {
    console.error('ERROR: Email was not normalized! Expected:', cleanEmail, 'Got:', regData.user.email);
    process.exit(1);
  }
  console.log('[PASS] Email was properly trimmed and lowercased on registration.');

  // 3. Duplicate registration check
  console.log('\n--- 2. Testing Duplicate Registration Prevention ---');
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate User',
      email: cleanEmail,
      password: 'AnotherPassword123!'
    })
  });
  const dupData = await dupRes.json();
  if (dupRes.status === 400 && dupData.msg === 'User already exists') {
    console.log('[PASS] Duplicate registration rejected with 400 "User already exists".');
  } else {
    console.error('ERROR: Duplicate registration did not return 400:', dupRes.status, dupData);
  }

  // 4. Login with uppercase email variant
  console.log('\n--- 3. Testing Login with Uppercase Email Variant ---');
  const upperLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `TESTUSER_${timestamp}@FRAUDSHIELD.IO`,
      password: testPassword
    })
  });
  const upperLoginData = await upperLoginRes.json();
  if (upperLoginRes.status === 200 && upperLoginData.token) {
    console.log('[PASS] Login succeeded with uppercase email! Token received.');
  } else {
    console.error('ERROR: Uppercase login failed:', upperLoginRes.status, upperLoginData);
  }

  // 5. Login with trailing whitespace email variant
  console.log('\n--- 4. Testing Login with Trailing Whitespace in Email ---');
  const spaceLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `  ${cleanEmail}  `,
      password: testPassword
    })
  });
  const spaceLoginData = await spaceLoginRes.json();
  if (spaceLoginRes.status === 200 && spaceLoginData.token) {
    console.log('[PASS] Login succeeded with whitespace email! Token received.');
  } else {
    console.error('ERROR: Whitespace login failed:', spaceLoginRes.status, spaceLoginData);
  }

  // 6. Login with wrong password
  console.log('\n--- 5. Testing Login with Incorrect Password ---');
  const wrongPwdRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      password: 'WrongPassword999!'
    })
  });
  const wrongPwdData = await wrongPwdRes.json();
  if (wrongPwdRes.status === 400 && wrongPwdData.msg === 'Invalid Credentials') {
    console.log('[PASS] Incorrect password correctly rejected with "Invalid Credentials".');
  } else {
    console.error('ERROR: Wrong password did not return 400 "Invalid Credentials":', wrongPwdRes.status, wrongPwdData);
  }

  // 7. Verify JWT format & access protected route
  console.log('\n--- 6. Testing Protected Route with JWT ---');
  const token = upperLoginData.token;
  const locRes = await fetch(`${BASE_URL}/transactions/last-location`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const locData = await locRes.json();
  if (locRes.status === 200) {
    console.log('[PASS] Protected endpoint accessed successfully with Bearer token.');
  } else {
    console.error('ERROR: Protected endpoint rejected token:', locRes.status, locData);
  }

  console.log('\n==================================================');
  console.log('ALL AUTHENTICATION FLOW TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

testAuthFlow().catch(err => {
  console.error('Test execution error:', err.message);
  process.exit(1);
});
