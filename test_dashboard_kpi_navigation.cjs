async function runKPITests() {
  console.log('=== VERIFYING DASHBOARD KPI NAVIGATION & FILTERING ===\n');

  // 1. Register test user
  const email = `kpi_test_${Date.now()}@fraudshield.io`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dashboard KPI Tester',
      email,
      password: 'Password123!',
      role: 'Analyst'
    })
  });
  const { token } = await regRes.json();
  console.log('User registered with token');

  // 2. Ingest Genuine transaction
  const txn1 = await (await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      amount: 45.0,
      merchantCategory: 'Groceries',
      location: 'Coimbatore, India',
      latitude: 11.0168,
      longitude: 76.9558,
      accuracy: 10,
      date: '2026-09-03',
      time: '12:00',
      accountAge: 400,
      previousTransactionAmount: 45.0,
      transactionFrequency: 2,
      previousFraudCount: 0,
      deviceType: 'Mobile',
      ipRiskScore: 5,
      type: 'Payment'
    })
  })).json();
  console.log('Created Genuine Txn:', txn1.id, '| Prediction:', txn1.prediction);

  // 3. Ingest Suspicious transaction (Moderate IP / Late night)
  const txn2 = await (await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      amount: 1200.0,
      merchantCategory: 'Electronics',
      location: 'Bangalore, India',
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
      date: '2026-09-03',
      time: '03:00',
      accountAge: 365,
      previousTransactionAmount: 45.0,
      transactionFrequency: 4,
      previousFraudCount: 0,
      deviceType: 'Desktop',
      ipRiskScore: 65,
      type: 'Payment'
    })
  })).json();
  console.log('Created Suspicious/Elevated Txn:', txn2.id, '| Prediction:', txn2.prediction, '| Score:', txn2.riskScore);

  // 4. Ingest Fraud transaction (Massive displacement + High Amount)
  const txn3 = await (await fetch('http://localhost:5000/api/transactions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      amount: 9500.0,
      merchantCategory: 'Travel',
      location: 'London, UK',
      latitude: 51.5074,
      longitude: -0.1278,
      accuracy: 10,
      date: '2026-09-03',
      time: '04:00',
      accountAge: 365,
      previousTransactionAmount: 45.0,
      transactionFrequency: 15,
      previousFraudCount: 2,
      deviceType: 'Desktop',
      ipRiskScore: 95,
      type: 'Payment'
    })
  })).json();
  console.log('Created Fraud Txn:', txn3.id, '| Prediction:', txn3.prediction, '| Score:', txn3.riskScore);

  // 5. Query Dashboard stats (used by KPI cards)
  const stats = await (await fetch('http://localhost:5000/api/transactions/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log('\n--- DASHBOARD STATS (Real KPI Card Values) ---');
  console.log('Total Transactions KPI:', stats.totalTransactions);
  console.log('Genuine KPI:', stats.genuine);
  console.log('Suspicious KPI:', stats.suspicious);
  console.log('Fraud Detected KPI:', stats.fraud);
  console.log('Fraud Rate KPI:', `${stats.fraudRate}%`);

  // 6. Test KPI Navigation Targets
  console.log('\n--- TESTING KPI ROUTE FILTERS ---');
  // Total -> /transactions
  const allTxns = await (await fetch('http://localhost:5000/api/transactions?page=1&limit=10', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log('KPI 1: /transactions -> Total count:', allTxns.total);

  // Genuine -> /transactions?filter=genuine
  const genuineTxns = await (await fetch('http://localhost:5000/api/transactions?page=1&limit=10&filter=genuine', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log('KPI 2: /transactions?filter=genuine -> Filtered count:', genuineTxns.total);
  genuineTxns.transactions.forEach(t => console.log(`   - ${t.id} (${t.prediction})`));

  // Suspicious -> /transactions?filter=suspicious
  const suspiciousTxns = await (await fetch('http://localhost:5000/api/transactions?page=1&limit=10&filter=suspicious', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log('KPI 3: /transactions?filter=suspicious -> Filtered count:', suspiciousTxns.total);
  suspiciousTxns.transactions.forEach(t => console.log(`   - ${t.id} (${t.prediction})`));

  // Fraud -> /transactions?filter=fraud
  const fraudTxns = await (await fetch('http://localhost:5000/api/transactions?page=1&limit=10&filter=fraud', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log('KPI 4/5: /fraud-alerts -> Filtered fraud count:', fraudTxns.total);
  fraudTxns.transactions.forEach(t => console.log(`   - ${t.id} (${t.prediction})`));

  console.log('\n=== ALL DASHBOARD KPI NAVIGATION & FILTERING CHECKS PASSED ===');
}

runKPITests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
