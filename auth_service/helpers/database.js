import mongoose from 'mongoose';
import log from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const { MONGODB_USER, MONGODB_PASSWORD, DATABASE_CONNECTION } = process.env;
const useAuth = Boolean(MONGODB_USER && MONGODB_PASSWORD);

const mongoUri = `mongodb://${useAuth ? `${MONGODB_USER}:${MONGODB_PASSWORD}@` : ''}${DATABASE_CONNECTION}`;
const redactedMongoUri = `mongodb://${useAuth ? `${MONGODB_USER}:******@` : ''}${DATABASE_CONNECTION}`;

export default function database() {
  if (!useAuth) {
    log(1, `Mongodb connection is missing login credentials, this is insecure. Continuing...`);
  }

  return new Promise(async (resolve, reject) => {
    mongoose.set('strictQuery', false);
    mongoose.connection.removeAllListeners();

    mongoose.connection.on('connected', () => {
      resolve(true);
      log(0, 'Mongoose default connection open to ' + redactedMongoUri);
    });

    mongoose.connection.on('error', (err) => {
      reject(err);
      log(2, 'Mongoose default connection error: ' + err);
    });

    mongoose.connection.on('disconnected', () => {
      log(1, 'Mongoose default connection disconnected');
    });

    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        log(0, 'Mongoose default connection disconnected through app termination');
        process.exit(0);
      });
    });

    try {
      await mongoose.connect(mongoUri);
    } catch (err) {
      reject(err);
    }
  });
}
