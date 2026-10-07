const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:8000';

router.use((req, res, next) => {
  if (Transaction.db.readyState !== 1) {
    return res.status(503).json({ msg: 'Database connection unavailable' });
  }
  next();
});

// Haversine formula to compute great-circle distance between two GPS points in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371.0; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const rLat1 = lat1 * (Math.PI / 180);
  const rLat2 = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function isValidCoordinates(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function generateDynamicRiskExplanations(payload, input, mlData, previousLat, previousLon, currentLat, currentLon) {
  const amount = Number(payload.amount) || 0;
  const prevAmount = Number(input.previousTransactionAmount) || 0;
  const distance = Number(payload.distanceFromPrevious) || 0;
  const fraudCount = Number(input.previousFraudCount) || 0;
  const frequency = Number(input.transactionFrequency) || 0;
  const ipRisk = Number(payload.ipRiskScore) || 0;
  const accountAge = Number(payload.accountAge) || 365;
  const timeStr = payload.time || '12:00';
  const category = payload.merchantCategory || 'Other';
  const riskScore = mlData.risk_score || 0;
  const prediction = mlData.prediction || 'Genuine';

  let hour = 12;
  try {
    hour = parseInt(timeStr.split(':')[0], 10);
  } catch (_) {}

  const riskSignals = [];
  const safeSignals = [];

  // 1. Amount & Amount delta compared with previous transaction
  if (prevAmount > 0 && amount >= 3 * prevAmount && amount >= 1000) {
    const ratio = (amount / prevAmount).toFixed(1);
    riskSignals.push(`Transaction amount ($${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}) is ${ratio}x higher than previous transaction ($${prevAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`);
  } else if (amount >= 5000) {
    riskSignals.push(`High monetary amount ($${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}) exceeds standard baseline`);
  } else if (amount >= 1500) {
    riskSignals.push(`Elevated transaction amount ($${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}) flagged for verification`);
  } else if (amount <= 500) {
    safeSignals.push(`Transaction amount ($${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}) is within normal purchasing bounds`);
  } else {
    safeSignals.push(`Transaction amount ($${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}) aligns with typical transaction range`);
  }

  // 2. Geographical Distance / Location Deviation
  if (distance >= 500) {
    riskSignals.push(`Large geographical deviation (${distance.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} km from previous transaction location)`);
  } else if (distance >= 100) {
    riskSignals.push(`Noticeable geographical distance (${distance.toFixed(1)} km from previous transaction)`);
  } else if (distance > 0 && distance < 50) {
    safeSignals.push(`Transaction location is in the local vicinity (${distance.toFixed(1)} km from previous transaction)`);
  } else if (distance === 0 && previousLat !== null) {
    safeSignals.push(`Transaction is at the same location as the previous transaction (0.00 km)`);
  }

  // 3. Time / Temporal Risk
  if (hour >= 0 && hour <= 5) {
    riskSignals.push(`Transaction initiated during late-night window (${timeStr})`);
  } else if ((hour >= 6 && hour <= 8) || (hour >= 21 && hour <= 23)) {
    if (riskScore >= 50) {
      riskSignals.push(`Off-peak transaction timing (${timeStr})`);
    } else {
      safeSignals.push(`Transaction occurred during regular evening/morning hours (${timeStr})`);
    }
  } else {
    safeSignals.push(`Standard daytime transaction hour (${timeStr})`);
  }

  // 4. IP Risk Score
  if (ipRisk >= 70) {
    riskSignals.push(`High IP network risk score (${ipRisk}/100) detected on incoming client`);
  } else if (ipRisk >= 40) {
    if (riskScore >= 40) {
      riskSignals.push(`Moderate IP risk score (${ipRisk}/100)`);
    } else {
      safeSignals.push(`Acceptable IP network risk score (${ipRisk}/100)`);
    }
  } else if (input.ipRiskScore !== undefined && ipRisk >= 0) {
    safeSignals.push(`Low IP network risk score (${ipRisk}/100)`);
  }

  // 5. Previous Fraud History
  if (fraudCount > 0) {
    riskSignals.push(`User account has ${fraudCount} previously recorded fraud incident(s)`);
  } else if (input.previousFraudCount !== undefined && fraudCount === 0) {
    safeSignals.push(`Clean account history with zero previous fraud flags`);
  }

  // 6. Transaction Frequency Velocity
  if (frequency >= 10) {
    riskSignals.push(`Unusually high transaction frequency velocity (${frequency} transactions/day)`);
  } else if (input.transactionFrequency !== undefined && frequency > 0 && frequency <= 5) {
    safeSignals.push(`Normal transaction frequency velocity (${frequency} transactions/day)`);
  }

  // 7. Account Age
  if (accountAge < 30) {
    riskSignals.push(`New account creation (${accountAge} days active)`);
  } else if (accountAge >= 365 && riskScore < 40) {
    safeSignals.push(`Established account tenure (${accountAge} days active)`);
  }

  // 8. Device
  if (payload.deviceType === 'Unknown') {
    riskSignals.push(`Unrecognized or masked device client detected`);
  }

  // Select factors matching prediction
  if (riskScore >= 60 || prediction === 'Fraud') {
    return riskSignals.length > 0 ? riskSignals.slice(0, 5) : (mlData.explanation?.evaluated_factors || ['Statistical fraud pattern identified by XGBoost']);
  } else if (riskScore >= 30 || prediction === 'Suspicious') {
    return (riskSignals.concat(safeSignals)).slice(0, 4);
  } else {
    return safeSignals.length > 0 ? safeSignals.slice(0, 4) : (mlData.explanation?.evaluated_factors || ['Transaction evaluated within normal safety thresholds']);
  }
}

// Format helper to ensure frontend `id` and location fields are always properly formatted
function formatTxn(t) {
  const obj = t.toObject ? t.toObject() : t;
  return {
    ...obj,
    id: obj.transactionId || (obj._id ? obj._id.toString() : 'TXN00000'),
    merchantCategory: obj.merchantCategory || 'Other',
    latitude: obj.latitude !== undefined ? obj.latitude : null,
    longitude: obj.longitude !== undefined ? obj.longitude : null,
    accuracy: obj.accuracy !== undefined ? obj.accuracy : null,
    previousLatitude: obj.previousLatitude !== undefined ? obj.previousLatitude : null,
    previousLongitude: obj.previousLongitude !== undefined ? obj.previousLongitude : null,
    distanceFromPreviousKm: obj.distanceFromPreviousKm !== undefined ? obj.distanceFromPreviousKm : (obj.distanceFromPrevious || 0),
    riskFactors: obj.riskFactors || [],
    timeline: obj.timeline || []
  };
}

// GET /api/transactions/last-location - Retrieve authenticated user's most recent valid location
router.get('/last-location', auth, async (req, res) => {
  try {
    const lastTxn = await Transaction.findOne({
      userId: req.user.id,
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).sort({ createdAt: -1 });

    if (!lastTxn || !isValidCoordinates(lastTxn.latitude, lastTxn.longitude)) {
      return res.json({ hasPrevious: false, location: null });
    }

    return res.json({
      hasPrevious: true,
      location: {
        latitude: lastTxn.latitude,
        longitude: lastTxn.longitude,
        accuracy: lastTxn.accuracy,
        displayName: lastTxn.location,
        date: lastTxn.date,
        time: lastTxn.time,
        transactionId: lastTxn.transactionId
      }
    });
  } catch (err) {
    console.error('Error fetching last location:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET /api/transactions
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { userId: req.user.id };

    if (req.user.role === 'Admin' || req.user.role === 'Analyst') {
      if (req.query.userId) {
        query.userId = req.query.userId;
      } else {
        query = {}; // all transactions for staff
      }
    }

    if (req.query.search) {
      const s = req.query.search;
      const searchConditions = [
        { transactionId: { $regex: s, $options: 'i' } },
        { location: { $regex: s, $options: 'i' } },
        { merchantCategory: { $regex: s, $options: 'i' } },
        { type: { $regex: s, $options: 'i' } }
      ];
      if (query.userId) {
        query = {
          $and: [
            { userId: query.userId },
            { $or: searchConditions }
          ]
        };
      } else {
        query = { $or: searchConditions };
      }
    }

    if (req.query.filter) {
      const f = req.query.filter.toString().toLowerCase();
      let targetPrediction = null;
      if (f === 'genuine') targetPrediction = 'Genuine';
      else if (f === 'suspicious') targetPrediction = 'Suspicious';
      else if (f === 'fraud') targetPrediction = 'Fraud';

      if (targetPrediction) {
        if (query.$and) {
          query.$and.push({ prediction: targetPrediction });
        } else if (query.$or) {
          query = {
            $and: [
              { $or: query.$or },
              { prediction: targetPrediction }
            ]
          };
        } else {
          query.prediction = targetPrediction;
        }
      }
    }

    const rawTransactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);
    const transactions = rawTransactions.map(formatTxn);

    res.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ msg: 'Server error fetching transactions', error: err.message });
  }
});

// GET /api/transactions/stats
router.get('/stats', auth, async (req, res) => {
  try {
    let query = { userId: req.user.id };
    if (req.user.role === 'Admin' || req.user.role === 'Analyst') {
      query = {};
    }

    const txns = await Transaction.find(query);
    const totalTransactions = txns.length;
    const genuine = txns.filter(t => t.prediction === 'Genuine').length;
    const suspicious = txns.filter(t => t.prediction === 'Suspicious').length;
    const fraud = txns.filter(t => t.prediction === 'Fraud').length;
    const fraudRate = totalTransactions > 0 ? Math.round((fraud / totalTransactions) * 10000) / 100 : 0;

    res.json({
      totalTransactions,
      genuine,
      suspicious,
      fraud,
      fraudRate,
      trends: {
        totalTransactions: 0,
        genuine: 0,
        suspicious: 0,
        fraud: 0,
        fraudRate: 0,
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ msg: 'Server error fetching stats', error: err.message });
  }
});

// POST /api/transactions/analyze
router.post('/analyze', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const input = req.body;

    // Validate current GPS coordinates if supplied
    let currentLat = null;
    let currentLon = null;
    let currentAccuracy = null;

    if (input.latitude !== undefined && input.longitude !== undefined && input.latitude !== null && input.longitude !== null) {
      const latNum = Number(input.latitude);
      const lonNum = Number(input.longitude);
      if (isValidCoordinates(latNum, lonNum)) {
        currentLat = latNum;
        currentLon = lonNum;
        currentAccuracy = input.accuracy !== undefined ? Math.max(0, Number(input.accuracy) || 0) : null;
      }
    }

    // Lookup user's most recent previous transaction location from MongoDB
    const lastTxn = await Transaction.findOne({
      userId: req.user.id,
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).sort({ createdAt: -1 });

    let calculatedDistance = 0;
    let previousLat = null;
    let previousLon = null;

    if (lastTxn && isValidCoordinates(lastTxn.latitude, lastTxn.longitude)) {
      previousLat = lastTxn.latitude;
      previousLon = lastTxn.longitude;
      if (currentLat !== null && currentLon !== null) {
        // Calculate server-side Haversine distance in km
        calculatedDistance = calculateHaversineDistance(previousLat, previousLon, currentLat, currentLon);
      }
    } else if (input.distanceFromPrevious !== undefined && Number(input.distanceFromPrevious) > 0) {
      calculatedDistance = Math.max(0, Number(input.distanceFromPrevious));
    }

    // Existing 20-feature input schema for XGBoost model inference
    const payload = {
      amount: Number(input.amount) || 0,
      merchantCategory: input.merchantCategory || 'Other',
      location: input.location || (currentLat !== null ? `Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}` : 'Unknown'),
      date: input.date || new Date().toISOString().split('T')[0],
      time: input.time || new Date().toISOString().split('T')[1].substring(0, 5),
      accountAge: Number(input.accountAge) || 365,
      distanceFromPrevious: calculatedDistance,
      deviceType: input.deviceType || 'Mobile',
      ipRiskScore: Number(input.ipRiskScore) || 0,
      type: input.type || 'Payment',
    };

    let mlData;
    try {
      const mlRes = await fetch(`${ML_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (mlRes.ok) {
        mlData = await mlRes.json();
      } else {
        console.warn(`ML API returned status ${mlRes.status}`);
      }
    } catch (mlErr) {
      console.warn('ML API unreachable, using rule-based evaluation:', mlErr.message);
    }

    // Default fallback if ML API is offline
    if (!mlData) {
      const transHour = parseInt(payload.time.split(':')[0] || '12', 10);
      let calculatedScore = 15;
      if (payload.amount > 5000) calculatedScore += 45;
      else if (payload.amount > 1000) calculatedScore += 25;
      if (payload.distanceFromPrevious > 500) calculatedScore += 30;
      if (transHour >= 0 && transHour <= 5) calculatedScore += 20;
      calculatedScore = Math.min(100, calculatedScore);

      mlData = {
        fraud_probability: calculatedScore / 100,
        risk_score: calculatedScore,
        prediction: calculatedScore >= 70 ? 'Fraud' : calculatedScore >= 35 ? 'Suspicious' : 'Genuine',
        risk_level: calculatedScore >= 80 ? 'Critical' : calculatedScore >= 60 ? 'High' : calculatedScore >= 30 ? 'Medium' : 'Low',
        model_version: 'v1.0.0-heuristic',
        explanation: {
          evaluated_factors: calculatedScore >= 50 ? ['Elevated transaction risk pattern'] : ['Standard verified transaction pattern']
        }
      };
    }

    const fraudProbability = Math.round(mlData.fraud_probability * 1000) / 10;
    const riskScore = mlData.risk_score;

    let prediction = 'Genuine';
    if (mlData.prediction === 'Fraud' || riskScore >= 71) prediction = 'Fraud';
    else if (riskScore >= 31 || mlData.prediction === 'Suspicious') prediction = 'Suspicious';

    let riskLevel = mlData.risk_level || 'Low';
    if (!mlData.risk_level) {
       if (riskScore >= 80) riskLevel = 'Critical';
       else if (riskScore >= 60) riskLevel = 'High';
       else if (riskScore >= 30) riskLevel = 'Medium';
    }

    // Risk decisions:
    // 0-30: LOW RISK -> APPROVE
    // 31-70: MEDIUM RISK -> OTP VERIFICATION
    // 71-100: HIGH RISK -> BLOCK
    let status = 'approved';
    if (riskScore >= 71) {
      status = 'blocked';
    } else if (riskScore >= 31) {
      status = 'otp_required';
    }

    // Generate dynamic explanations based on actual transaction inputs & XGBoost result
    const factors = generateDynamicRiskExplanations(
      payload,
      input,
      mlData,
      previousLat,
      previousLon,
      currentLat,
      currentLon
    );

    const newTxn = new Transaction({
      transactionId: `TXN${Date.now()}`,
      userId: user._id,
      userName: user.name,
      amount: payload.amount,
      type: payload.type,
      merchantCategory: payload.merchantCategory,
      merchantUrl: input.merchantUrl,
      location: payload.location,
      latitude: currentLat,
      longitude: currentLon,
      accuracy: currentAccuracy,
      previousLatitude: previousLat,
      previousLongitude: previousLon,
      distanceFromPrevious: calculatedDistance,
      distanceFromPreviousKm: calculatedDistance,
      date: payload.date,
      time: payload.time,
      riskScore,
      fraudProbability,
      prediction,
      riskLevel,
      status,
      accountAge: payload.accountAge,
      previousTransactionAmount: Number(input.previousTransactionAmount) || 0,
      transactionFrequency: Number(input.transactionFrequency) || 0,
      previousFraudCount: Number(input.previousFraudCount) || 0,
      deviceType: payload.deviceType,
      ipRiskScore: payload.ipRiskScore,
      riskFactors: factors,
      timeline: [
        { time: `${payload.date} ${payload.time}`, event: 'Transaction initiated', status: 'info' },
        { time: `${payload.date} ${payload.time}`, event: `AI Risk Assessment completed (${riskLevel})`, status: riskLevel === 'Low' ? 'info' : 'warning' }
      ],
      modelVersion: mlData.model_version
    });

    await newTxn.save();

    res.json(formatTxn(newTxn));
  } catch (err) {
    console.error('Error analyzing transaction:', err.message);
    res.status(500).json({ msg: 'Server error analyzing transaction', error: err.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { transactionId: req.params.id };
    if (req.user.role !== 'Admin' && req.user.role !== 'Analyst') {
      query.userId = req.user.id;
    }
    const txn = await Transaction.findOne(query);
    if (!txn) return res.status(404).json({ msg: 'Transaction not found' });
    res.json(formatTxn(txn));
  } catch (err) {
    console.error('Error fetching transaction by ID:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
