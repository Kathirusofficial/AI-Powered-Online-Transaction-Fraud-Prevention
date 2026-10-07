const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI environment variable is missing in configuration.');
  process.exit(1);
}

let isConnected = false;
let activeDatabaseType = 'none';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 && activeDatabaseType === 'atlas') return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    activeDatabaseType = 'atlas';
    console.log('MongoDB Atlas Connected');
  } catch (err) {
    console.error('MongoDB Atlas Connection Error:', err.message);
    if (err.message && (err.message.includes('whitelist') || err.message.includes('Could not connect') || err.message.includes('SSL routines') || err.message.includes('alert number 80'))) {
      console.error('----------------------------------------------------------------------');
      console.error('ACTION REQUIRED: In MongoDB Atlas (https://cloud.mongodb.com):');
      console.error('  1. Navigate to Security -> Network Access -> Add IP Address');
      console.error('  2. Click "Allow Access From Anywhere" (0.0.0.0/0) or add 14.102.45.138');
      console.error('  3. Click "Confirm"');
      console.error('----------------------------------------------------------------------');
    }

    // If local MongoDB is accessible, connect as a graceful fallback while Atlas IP whitelist is updated
    if (!isConnected) {
      try {
        console.log('Attempting local MongoDB connection while Atlas is being configured...');
        await mongoose.connect('mongodb://127.0.0.1:27017/fraud_prevention', {
          serverSelectionTimeoutMS: 2000,
        });
        isConnected = true;
        activeDatabaseType = 'local_fallback';
        console.log('NOTICE: Connected to local MongoDB fallback. App is ready.');
      } catch (localErr) {
        isConnected = false;
        activeDatabaseType = 'disconnected';
        console.error('Local fallback not available:', localErr.message);
      }
    }

    // Periodically test if Atlas has become reachable so we seamlessly switch to Atlas
    if (activeDatabaseType !== 'atlas') {
      setTimeout(async () => {
        try {
          const testConn = await mongoose.createConnection(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 }).asPromise();
          await testConn.close();
          console.log('MongoDB Atlas is now accessible! Upgrading connection to MongoDB Atlas...');
          await mongoose.disconnect();
          await mongoose.connect(process.env.MONGODB_URI);
          isConnected = true;
          activeDatabaseType = 'atlas';
          console.log('MongoDB Atlas Connected');
        } catch {
          // Still waiting for IP whitelist; retry
          if (activeDatabaseType === 'disconnected') {
            connectDB();
          }
        }
      }, 10000);
    }
  }
};

connectDB();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fraud-backend',
    database: mongoose.connection.readyState === 1 ? (activeDatabaseType === 'atlas' ? 'connected (Atlas)' : 'connected (Local Fallback)') : 'disconnected',
    time: new Date().toISOString()
  });
});

app.get('/api/ml/health', async (req, res) => {
  try {
    const ML_URL = process.env.ML_API_URL || 'http://127.0.0.1:8000';
    const mlRes = await fetch(`${ML_URL}/health`);
    if (!mlRes.ok) throw new Error(`ML health returned ${mlRes.status}`);
    const data = await mlRes.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({
      status: 'offline',
      model_loaded: false,
      model_version: 'Unavailable',
      feature_count: 0,
      algorithm: 'Unavailable',
      error: err.message
    });
  }
});

app.get('/api/ml/model-info', async (req, res) => {
  try {
    const ML_URL = process.env.ML_API_URL || 'http://127.0.0.1:8000';
    const mlRes = await fetch(`${ML_URL}/model-info`);
    if (!mlRes.ok) throw new Error(`ML model-info returned ${mlRes.status}`);
    const data = await mlRes.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({
      model_loaded: false,
      algorithm: 'XGBoost Classifier',
      error: err.message
    });
  }
});

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing in configuration.');
  process.exit(1);
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
