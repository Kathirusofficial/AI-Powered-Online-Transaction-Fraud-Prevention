const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  amount: Number,
  currency: {
    type: String,
    default: 'INR'
  },
  amountInr: Number,
  modelAmountUsd: Number,
  type: String,
  merchantCategory: String,
  merchantUrl: String,
  location: String,
  locationSource: {
    type: String,
    enum: ['REAL_GPS', 'SCENARIO_PROFILE', 'MANUAL_ENTRY', 'UNKNOWN'],
    default: 'SCENARIO_PROFILE'
  },
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  previousLatitude: Number,
  previousLongitude: Number,
  distanceFromPreviousKm: Number,
  date: String,
  time: String,
  riskScore: Number,
  fraudProbability: Number,
  prediction: String,
  riskLevel: String,
  status: String,
  accountAge: Number,
  previousTransactionAmount: Number,
  transactionFrequency: Number,
  previousFraudCount: Number,
  distanceFromPrevious: Number,
  deviceType: String,
  ipRiskScore: Number,
  riskFactors: [String],
  timeline: [{
    time: String,
    event: String,
    status: String
  }],
  modelVersion: String
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', TransactionSchema);
