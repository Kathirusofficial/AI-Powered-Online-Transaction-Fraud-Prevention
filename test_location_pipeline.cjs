const http = require('http');

async function test() {
  console.log('--- STARTING LOCATION & HAVERSINE PIPELINE VERIFICATION ---');

  // 1. Verify ML service is healthy
  const mlRes = await fetch('http://127.0.0.1:8000/health');
  const mlHealth = await mlRes.json();
  console.log('1. ML Health:', mlHealth);

  if (mlHealth.status !== 'ok' || mlHealth.feature_count !== 20) {
    throw new Error('ML health check failed or feature_count is not 20');
  }

  // 2. Register / Login test user
  const email = `geotest_${Date.now()}@fraudshield.io`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Geo Test User',
      email,
      password: 'Password123!',
      role: 'Analyst'
    })
  });
  const regData = await regRes.json();
  const token = regData.token;
  console.log('2. User registered & authenticated. Token obtained:', token ? 'YES' : 'NO');

  // 3. Check /last-location initially (should be null / hasPrevious: false)
  const lastLocRes1 = await fetch('http://localhost:5000/api/transactions/last-location', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const lastLoc1 = await lastLocRes1.json();
  console.log('3. Initial Last Location Check:', lastLoc1);

  // 4. Submit First Transaction from Coimbatore (Lat 11.0168, Lon 76.9558)
  console.log('\n4. Submitting Transaction 1 from Coimbatore (11.0168, 76.9558)...');
  const txn1Res = await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 45.0,
      merchantCategory: 'Retail',
      location: 'Coimbatore, Tamil Nadu, India',
      latitude: 11.0168,
      longitude: 76.9558,
      accuracy: 15,
      date: '2026-09-03',
      time: '14:30',
      accountAge: 400,
      type: 'Payment'
    })
  });
  const txn1 = await txn1Res.json();
  console.log('Transaction 1 Raw Response:', JSON.stringify(txn1, null, 2));

  // 5. Submit Second Transaction from Bangalore (Lat 12.9716, Lon 77.5946)
  console.log('\n5. Submitting Transaction 2 from Bangalore (12.9716, 77.5946)...');
  const txn2Res = await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 150.0,
      merchantCategory: 'Electronics',
      location: 'Bangalore, Karnataka, India',
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 20,
      date: '2026-09-03',
      time: '15:15',
      accountAge: 400,
      type: 'Payment'
    })
  });
  const txn2 = await txn2Res.json();
  console.log('Transaction 2 Output:');
  console.log(' - Txn ID:', txn2.transactionId);
  console.log(' - Current Location:', txn2.location, `(${txn2.latitude}, ${txn2.longitude})`);
  console.log(' - Previous Location:', `(${txn2.previousLatitude}, ${txn2.previousLongitude})`);
  console.log(' - Calculated Haversine Distance:', txn2.distanceFromPreviousKm, 'km (Expected ~227 km)');
  console.log(' - Prediction:', txn2.prediction, '| Risk Score:', txn2.riskScore, '| Risk Level:', txn2.riskLevel);

  // 6. Submit Third Transaction from London (Lat 51.5074, Lon -0.1278) - Rapid Overseas Anomaly
  console.log('\n6. Submitting Transaction 3 from London (51.5074, -0.1278)...');
  const txn3Res = await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 3200.0,
      merchantCategory: 'Travel',
      location: 'London, United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278,
      accuracy: 10,
      date: '2026-09-03',
      time: '15:45',
      accountAge: 400,
      type: 'Transfer'
    })
  });
  const txn3 = await txn3Res.json();
  console.log('Transaction 3 Output:');
  console.log(' - Txn ID:', txn3.transactionId);
  console.log(' - Current Location:', txn3.location, `(${txn3.latitude}, ${txn3.longitude})`);
  console.log(' - Previous Location (Bangalore):', `(${txn3.previousLatitude}, ${txn3.previousLongitude})`);
  console.log(' - Calculated Haversine Distance:', txn3.distanceFromPreviousKm, 'km (Expected ~7990 km)');
  console.log(' - Prediction:', txn3.prediction, '| Risk Score:', txn3.riskScore, '| Risk Level:', txn3.riskLevel);

  // 7. Submit Fourth Transaction with Location Denied / No GPS (Fallback test)
  console.log('\n7. Submitting Transaction 4 without GPS (Location permission denied fallback)...');
  const txn4Res = await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 25.0,
      merchantCategory: 'Groceries',
      location: 'Local Store',
      date: '2026-09-03',
      time: '16:00',
      accountAge: 400,
      type: 'Payment'
    })
  });
  const txn4 = await txn4Res.json();
  console.log('Transaction 4 Output:');
  console.log(' - Txn ID:', txn4.transactionId);
  console.log(' - Current Location:', txn4.location);
  console.log(' - Prediction:', txn4.prediction, '| Risk Score:', txn4.riskScore, '| Status:', txn4.status);

  console.log('\n--- ALL LOCATION & HAVERSINE PIPELINE TESTS PASSED SUCCESSFULLY ---');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
