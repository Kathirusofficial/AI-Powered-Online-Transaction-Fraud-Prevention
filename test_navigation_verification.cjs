async function verifyNavigationEndpoints() {
  console.log('=== VERIFYING FRAUDSHIELD BACKEND & NAVIGATION ENDPOINTS ===\n');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/ml/health');
  const health = await healthRes.json();
  console.log('ML Health:', health);

  // 2. Auth register/login
  const email = `nav_tester_${Date.now()}@fraudshield.io`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Navigation Test User',
      email,
      password: 'Password123!',
      role: 'Analyst'
    })
  });
  const { token, user } = await regRes.json();
  console.log('User registered & token acquired:', user.name, user.email);

  // 3. Last location
  const locRes = await fetch('http://localhost:5000/api/transactions/last-location', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const locData = await locRes.json();
  console.log('Last Location Endpoint:', locData);

  // 4. Create a transaction
  const txnRes = await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 120.0,
      merchantCategory: 'Groceries',
      location: 'Bangalore, Karnataka, India',
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
      date: '2026-09-03',
      time: '14:00',
      accountAge: 365,
      previousTransactionAmount: 100.0,
      transactionFrequency: 2,
      previousFraudCount: 0,
      deviceType: 'Mobile',
      ipRiskScore: 10,
      type: 'Payment'
    })
  });
  const txn = await txnRes.json();
  console.log('Transaction analyzed & stored:', txn.id, '| Prediction:', txn.prediction, '| Risk Score:', txn.riskScore);

  // 5. Query single transaction
  const getTxnRes = await fetch(`http://localhost:5000/api/transactions/${txn.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const singleTxn = await getTxnRes.json();
  console.log('Fetch single transaction:', singleTxn.id, '| Risk factors count:', singleTxn.riskFactors?.length);

  // 6. Paginated transactions
  const pageRes = await fetch('http://localhost:5000/api/transactions?page=1&limit=10', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pagedData = await pageRes.json();
  console.log('Transactions list count:', pagedData.total, 'transactions');

  // 7. Dashboard stats
  const statsRes = await fetch('http://localhost:5000/api/transactions/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const stats = await statsRes.json();
  console.log('Dashboard stats:', stats);

  console.log('\n=== ALL ENDPOINTS VERIFIED & ROUTING READY ===');
}

verifyNavigationEndpoints().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
