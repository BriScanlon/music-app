import mongoose from 'mongoose';
import log from './helpers/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const { MONGODB_USER, MONGODB_PASSWORD, DATABASE_CONNECTION } = process.env;
const useAuth = Boolean(MONGODB_USER && MONGODB_PASSWORD);

const mongoUri = `mongodb://${useAuth ? `${MONGODB_USER}:${MONGODB_PASSWORD}@` : ''}${DATABASE_CONNECTION}`;
const redactedMongoUri = `mongodb://${useAuth ? `${MONGODB_USER}:******@` : ''}${DATABASE_CONNECTION}`;

async function testDatabaseConnection() {
  log(0, `Connecting to database: ${redactedMongoUri}`);
  
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    log(0, `Mongoose default connection open to ${redactedMongoUri}`);
    
    const db = mongoose.connection.db;
    const admin = db.admin();
    const { databases } = await admin.listDatabases();
    
    log(0, 'Existing databases:', databases);
    
    const dbExists = databases.some(db => db.name === 'saas');
    
    if (!dbExists) {
      log(0, 'Database "saas" does not exist. Creating...');
      await db.createCollection('testCollection');
      await db.dropCollection('testCollection');
      log(0, 'Database "saas" created successfully.');
    } else {
      log(0, 'Database "saas" already exists.');
    }
    
    log(0, 'Database connection and check completed successfully.');
  } catch (err) {
    log(3, `Error in testDatabaseConnection: ${err.message}`);
  } finally {
    mongoose.connection.close();
  }
}

testDatabaseConnection();
