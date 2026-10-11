const mongoose = require('mongoose');

let isMemoryServer = false;
let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rescuemesh';

  try {
    console.log(`[Database] Attempting connection to local MongoDB: ${uri}`);
    // Attempt local MongoDB connection with quick timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[Database] Successfully connected to MongoDB at', uri);
    isMemoryServer = false;
  } catch (err) {
    console.warn('[Database] Local MongoDB not reachable on port 27017. Initializing Embedded In-Memory MongoDB Server for Zero-Config execution...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      console.log(`[Database] Embedded MongoMemoryServer started at: ${memUri}`);
      await mongoose.connect(memUri);
      console.log('[Database] Successfully connected to Embedded In-Memory MongoDB.');
      isMemoryServer = true;
    } catch (memErr) {
      console.error('[Database] Failed to launch Embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }

  // Check if database needs initial seeding
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Database] Empty database detected. Auto-seeding initial demo data...');
      const { seedDatabase } = require('../seed/seedData');
      await seedDatabase();
    }
  } catch (seedErr) {
    console.warn('[Database] Auto-seeding check skipped:', seedErr.message);
  }
};

module.exports = {
  connectDB,
  isMemory: () => isMemoryServer
};
