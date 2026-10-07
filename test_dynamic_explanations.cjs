async function runTests() {
  console.log('=== TESTING DYNAMIC TRANSACTION EXPLANATIONS ===\n');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/ml/health');
  const health = await healthRes.json();
  console.log('ML Service Health:', health);

  // 2. Register user
  const email = `dyn_test_${Date.now()}@fraudshield.io`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dynamic Explanation Tester',
      email,
      password: 'Password123!',
      role: 'Analyst'
    })
  });
  const { token } = await regRes.json();

  const scenarios = [
    {
      name: 'TEST A — LOW RISK (Standard Normal Activity)',
      payload: {
        amount: 50.0,
        merchantCategory: 'Groceries',
        location: 'Coimbatore, Tamil Nadu, India',
        latitude: 11.0168,
        longitude: 76.9558,
        accuracy: 10,
        date: '2026-09-03',
        time: '12:00',
        accountAge: 400,
        previousTransactionAmount: 50.0,
        transactionFrequency: 2,
        previousFraudCount: 0,
        distanceFromPrevious: 0,
        deviceType: 'Mobile',
        ipRiskScore: 5,
        type: 'Payment'
      }
    },
    {
      name: 'TEST B — HIGH AMOUNT RELATIVE TO PREVIOUS',
      payload: {
        amount: 8500.0,
        merchantCategory: 'Electronics',
        location: 'Coimbatore, Tamil Nadu, India',
        latitude: 11.0168,
        longitude: 76.9558,
        accuracy: 15,
        date: '2026-09-03',
        time: '13:00',
        accountAge: 400,
        previousTransactionAmount: 50.0,
        transactionFrequency: 2,
        previousFraudCount: 0,
        distanceFromPrevious: 0,
        deviceType: 'Mobile',
        ipRiskScore: 15,
        type: 'Payment'
      }
    },
    {
      name: 'TEST C — LARGE LOCATION CHANGE (London to Coimbatore)',
      payload: {
        amount: 450.0,
        merchantCategory: 'Retail',
        location: 'London, United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 20,
        date: '2026-09-03',
        time: '14:30',
        accountAge: 400,
        previousTransactionAmount: 400.0,
        transactionFrequency: 3,
        previousFraudCount: 0,
        deviceType: 'Mobile',
        ipRiskScore: 20,
        type: 'Payment'
      }
    },
    {
      name: 'TEST D — HIGH IP RISK (Proxy / Tor Network)',
      payload: {
        amount: 350.0,
        merchantCategory: 'Online',
        location: 'London, United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 25,
        date: '2026-09-03',
        time: '15:00',
        accountAge: 400,
        previousTransactionAmount: 350.0,
        transactionFrequency: 4,
        previousFraudCount: 0,
        distanceFromPrevious: 0,
        deviceType: 'Desktop',
        ipRiskScore: 92,
        type: 'Payment'
      }
    },
    {
      name: 'TEST E — LATE NIGHT ANOMALOUS TRANSACTION',
      payload: {
        amount: 600.0,
        merchantCategory: 'Retail',
        location: 'London, United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 15,
        date: '2026-09-03',
        time: '02:30',
        accountAge: 400,
        previousTransactionAmount: 500.0,
        transactionFrequency: 2,
        previousFraudCount: 0,
        distanceFromPrevious: 0,
        deviceType: 'Mobile',
        ipRiskScore: 20,
        type: 'Payment'
      }
    },
    {
      name: 'TEST F — REPEAT FRAUD HISTORY',
      payload: {
        amount: 1200.0,
        merchantCategory: 'Shopping',
        location: 'London, United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 15,
        date: '2026-09-03',
        time: '16:00',
        accountAge: 400,
        previousTransactionAmount: 500.0,
        transactionFrequency: 12,
        previousFraudCount: 3,
        distanceFromPrevious: 0,
        deviceType: 'Mobile',
        ipRiskScore: 45,
        type: 'Payment'
      }
    }
  ];

  for (const s of scenarios) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`RUNNING: ${s.name}`);
    console.log(`Input: Amount=$${s.payload.amount}, Time=${s.payload.time}, IP Risk=${s.payload.ipRiskScore}, Freq=${s.payload.transactionFrequency}, PrevFraud=${s.payload.previousFraudCount}`);

    const res = await fetch('http://localhost:5000/api/transactions/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(s.payload)
    });

    const data = await res.json();
    console.log(`\nRESULT: ${data.prediction} (${data.riskLevel}) | Risk Score: ${data.riskScore}/100 | Fraud Prob: ${data.fraudProbability}%`);
    console.log(`Calculated Distance from Previous: ${data.distanceFromPreviousKm} km`);
    console.log('Dynamic Explanations (Evaluated Risk Factors):');
    data.riskFactors.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
  }

  console.log('\n=== ALL DYNAMIC EXPLANATION TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
