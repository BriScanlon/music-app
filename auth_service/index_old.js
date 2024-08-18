import log from './helpers/logger.js';
import database from './helpers/database.js';
import Microservice from './routes/express.js';
import AuthController from './routes/AuthController.js';
import UserController from './routes/UserController.js';
import RoleController from './routes/RoleController.js';
import APIKeyController from './routes/APIKeyController.js';
import TenantController from './routes/TenantController.js';
import dotenv from 'dotenv';

dotenv.config();

log(0, 'Starting Service Initialization');

class Service {
  constructor() {
    log(0, 'Service Constructor Called');
    this._initialiseDB()
      .then(() => {
        log(0, 'Database Initialization Complete');
        this.app = new Microservice([
          new AuthController(),
          new RoleController(),
          new UserController(),
          new APIKeyController(),
          new TenantController(),
        ]);
        log(0, 'Microservice Initialization Complete');
      })
      .catch((err) => {
        log(2, err);
        process.exit(110);
      });
  }

  async _initialiseDB() {
    const timeout = 20;
    const waitingLoop = async (attempt = 0) => {
      if (attempt >= 3) throw new Error(`Connection to database failed after ${attempt} attempts.`);
      try {
        log(0, `Attempting to connect to database.${attempt ? ` This is attempt number ${attempt + 1}.` : ''}`);
        await database();
      } catch (err) {
        log(1, `Connection to database failed. Attempting again in ${timeout} seconds.`);
        log(3, err);
        await new Promise((res) => setTimeout(() => res(), timeout * 1000));
        await waitingLoop(attempt + 1);
      }
    };
    await waitingLoop(0);
  }
}

new Service();
log(0, 'Service Initialization Complete');

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(3, `Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  log(3, `Uncaught Exception: ${err.message}`);
  process.exit(1);
});
