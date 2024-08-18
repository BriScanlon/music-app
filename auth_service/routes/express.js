import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import log from '../helpers/logger.js';
import dotenv from 'dotenv';

dotenv.config();

class Microservice {
  constructor(controllers) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.startServer();
  }

  initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Allow specific origins
    const allowedOrigins = process.env.BASE_HOST.split(',').map(host => host.trim());

    this.app.use(
      cors({
        credentials: true,
        origin: (origin, callback) => {
          if (!origin) return callback(null, true); // Allow non-browser clients
          if (allowedOrigins.includes(new URL(origin).hostname) || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
      })
    );

    // Handle preflight requests
    this.app.options('*', (req, res) => {
      const origin = req.headers.origin;
      if (allowedOrigins.includes(new URL(origin).hostname) || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(204);
      } else {
        res.sendStatus(403);
      }
    });
  }

  initializeControllers(controllers) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

  startServer() {
    const port = process.env.INTERNAL_PORT || 3001;
    this.server = this.app.listen(port, () => {
      log(0, `Microservice (${process.env.MICROSERVICE_NAME} - v${process.env.npm_package_version}) started. ${port}:${process.env.EXTERNAL_PORT}`);
    });
  }
}

export default Microservice;
