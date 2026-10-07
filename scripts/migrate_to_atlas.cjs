/**
 * Utility script to migrate collections from local MongoDB to MongoDB Atlas.
 * Reads documents from mongodb://127.0.0.1:27017/fraud_prevention
 * and inserts/upserts them into the cluster specified by MONGODB_URI in backend/.env.
 */
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const LOCAL_URI = 'mongodb://127.0.0.1:27017/fraud_prevention';
const ATLAS_URI = process.env.MONGODB_URI;

async function migrate() {
  if (!ATLAS_URI) {
    console.error('ERROR: MONGODB_URI is not defined in backend/.env');
    process.exit(1);
  }

  console.log('--- FraudShield Database Migration to MongoDB Atlas ---');
  console.log('Connecting to local MongoDB...');
  const localConn = await mongoose.createConnection(LOCAL_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
  console.log('Connected to local MongoDB.');

  console.log('Connecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, { serverSelectionTimeoutMS: 8000 }).asPromise();
  console.log('Connected to MongoDB Atlas successfully!');

  const collections = ['users', 'transactions'];

  for (const collName of collections) {
    console.log(`\nMigrating collection: ${collName}...`);
    const localColl = localConn.db.collection(collName);
    const atlasColl = atlasConn.db.collection(collName);

    const docs = await localColl.find({}).toArray();
    console.log(`Found ${docs.length} documents in local ${collName}.`);

    if (docs.length === 0) continue;

    let upsertedCount = 0;
    for (const doc of docs) {
      const filter = { _id: doc._id };
      await atlasColl.replaceOne(filter, doc, { upsert: true });
      upsertedCount++;
    }
    console.log(`Successfully migrated ${upsertedCount} documents to Atlas ${collName}.`);
  }

  console.log('\n--- Migration complete! ---');
  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\nMigration failed:', err.message);
  if (err.message && (err.message.includes('whitelist') || err.message.includes('SSL routines') || err.message.includes('alert number 80'))) {
    console.error('\nACTION REQUIRED: In MongoDB Atlas (https://cloud.mongodb.com):');
    console.error('1. Navigate to Security -> Network Access -> Add IP Address');
    console.error('2. Click "Allow Access From Anywhere" (0.0.0.0/0) or add 14.102.45.138');
    console.error('3. Click "Confirm"');
  }
  process.exit(1);
});
