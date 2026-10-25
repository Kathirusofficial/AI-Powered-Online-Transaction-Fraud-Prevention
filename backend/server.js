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

const dns = require('dns');

// Helper to ensure MongoDB Atlas URI has properly encoded credentials and correct database path
function sanitizeAtlasURI(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return rawUri;
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^/?#]+)(.*)$/);
  if (!match) return rawUri;

  const [, protocol, user, rawPass, host, rest] = match;

  // Strip placeholder angle brackets < > if present
  let cleanPass = rawPass;
  if (cleanPass.startsWith('<') && cleanPass.endsWith('>')) {
    cleanPass = cleanPass.slice(1, -1);
  }

  // URL-encode special characters in password without double-encoding
  let encodedPass;
  try {
    const decoded = decodeURIComponent(cleanPass);
    encodedPass = encodeURIComponent(decoded);
  } catch {
    encodedPass = encodeURIComponent(cleanPass);
  }

  // Ensure database path is fraud_prevention
  let pathAndQuery = rest;
  if (!pathAndQuery || pathAndQuery === '/' || pathAndQuery.startsWith('/?')) {
    const query = pathAndQuery.includes('?') ? pathAndQuery.slice(pathAndQuery.indexOf('?')) : '?retryWrites=true&w=majority';
    pathAndQuery = `/fraud_prevention${query}`;
  }

  return `${protocol}${user}:${encodedPass}@${host}${pathAndQuery}`;
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  const uri = sanitizeAtlasURI(process.env.MONGODB_URI);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Atlas Connected');
  } catch (err) {
    if (err.message && (err.message.includes('querySrv ECONNREFUSED') || err.message.includes('querySrv EREFUSED'))) {
      try {
        console.warn('DNS SRV lookup failed on local DNS. Retrying with public DNS resolvers (8.8.8.8, 1.1.1.1)...');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB Atlas Connected (via public DNS resolver)');
        return;
      } catch (retryErr) {
        err = retryErr;
      }
    }

    console.error('MongoDB Atlas Connection Error:', err.message);
    if (err.message && (err.message.includes('bad auth') || err.message.includes('Authentication failed') || err.code === 8000)) {
      console.error('----------------------------------------------------------------------');
      console.error('ACTION REQUIRED: MongoDB Atlas Authentication Failed (Code 8000):');
      console.error('  The credentials for database user "kathir" were rejected by the cluster.');
      console.error('  Steps to resolve:');
      console.error('  1. Log into MongoDB Atlas (https://cloud.mongodb.com)');
      console.error('  2. Navigate to Security -> Database Access');
      console.error('  3. Find user "kathir" and click "Edit" -> "Edit Password"');
      console.error('  4. Set a new password and ensure Built-in Role is "Read and write to any database"');
      console.error('  5. Click "Update User"');
      console.error('  6. In backend/.env, update MONGODB_URI with the new password:');
      console.error('     mongodb+srv://kathir:ENCODED_PASSWORD@kathir.9ytr9vw.mongodb.net/fraud_prevention?retryWrites=true&w=majority');
      console.error('----------------------------------------------------------------------');
    } else if (err.message && (err.message.includes('whitelist') || err.message.includes('Could not connect') || err.message.includes('SSL routines') || err.message.includes('alert number 80'))) {
      console.error('----------------------------------------------------------------------');
      console.error('ACTION REQUIRED: IP Whitelist in MongoDB Atlas (https://cloud.mongodb.com):');
      console.error('  1. Navigate to Security -> Network Access -> Add IP Address');
      console.error('  2. Click "Allow Access From Anywhere" (0.0.0.0/0) or add your current public IP');
      console.error('  3. Click "Confirm" and allow ~1 minute for Atlas to apply network changes');
      console.error('----------------------------------------------------------------------');
    } else if (err.message && (err.message.includes('querySrv') || err.code === 'ECONNREFUSED' || err.code === 'EBADNAME')) {
      console.error('----------------------------------------------------------------------');
      console.error('ACTION REQUIRED: MongoDB Atlas SRV / DNS Resolution Issue:');
      console.error('  1. Check MONGODB_URI in backend/.env:');
      console.error('     - Remove any placeholder angle brackets "<" and ">" around passwords/values.');
      console.error('     - Ensure special characters in password (e.g., "@", ":", "/", "?", "#")');
      console.error('       are URL-encoded (e.g., "@" -> "%40").');
      console.error('  2. If your local network or ISP blocks DNS SRV queries, switch DNS to');
      console.error('     8.8.8.8 / 1.1.1.1 or use the standard (non-SRV) replica set URI from Atlas');
      console.error('     (Database -> Connect -> Drivers -> select version 2.2.12 or earlier).');
      console.error('----------------------------------------------------------------------');
    }
  }
};

connectDB();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fraud-backend',
    database: mongoose.connection.readyState === 1 ? 'connected (Atlas)' : 'disconnected',
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
app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));

