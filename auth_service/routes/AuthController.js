import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import RouteBase from './RouteBase.js';
import log from '../helpers/logger.js';
import auth from '../middleware/auth.js';
import { handleError } from '../helpers/requestHelpers.js';
import UserModel from '../models/user.js';

const { JWT_SECRET_KEY, JWT_TOKEN_EXPIRE } = process.env;

export default class AuthController extends RouteBase {
  constructor() {
    super('/auth');
    log(0, 'Initializing AuthController');
    this.initialiseRoutes();
  }

  initialiseRoutes() {
    log(0, 'Initializing AuthController routes');

    // C
    this.router.post(this.path, auth, this.postAuth.bind(this));
    this.router.post(this.path + '/login', this.postLogin.bind(this));

    // R
    this.router.get(this.path, auth, this.postAuth.bind(this));

  }

  /**
   * POST
   * Authenticates a user via their username and password.
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @returns {Response}
   */
  async postLogin(req, res) {
    const { username, password, remember } = req.body || {};

    try {
      if (!username || !password) {
        throw new Error('Unable to authenticate user without any credentials.', { cause: { status: 400 } });
      }

      const user = await UserModel.findOne({
        username: { $regex: new RegExp(`^${String(username)}$`, 'i') },
      });

      if (!user) {
        log(3, 'Incorrect username or password');
        throw new Error('Incorrect username or password', { cause: { status: 401 } });
      }

      if (user.status !== 1) {
        log(3, 'Requested account has been disabled.');
        throw new Error('Requested account has been disabled.', { cause: { status: 401 } });
      }

      let passwordMatch;
      try {
        passwordMatch = bcrypt.compareSync(String(password), user.password);
      } catch (compareErr) {
        throw new Error('Error during bcrypt operation', { cause: { status: 500 } });
      }

      if (!passwordMatch) {
        log(3, 'Incorrect username or password');
        throw new Error('Incorrect username or password', { cause: { status: 401 } });
      }

      const expiresIn = remember ? parseInt(JWT_TOKEN_EXPIRE) : 7200;
      log(0, `Generating token with expiration: ${expiresIn}`);
      let token;
      try {
        token = jwt.sign({ user: { id: String(user._id) }, remember: remember === 'true' }, JWT_SECRET_KEY, {
          expiresIn,
        });
      } catch (signErr) {
        log(3, `Error generating token: ${signErr.message}`);
        throw new Error('Error generating token', { cause: { status: 500 } });
      }

      res.setHeader('Set-Cookie', `AuthToken=${token}; Path=/;${remember ? ` Max-Age=${expiresIn};` : ''}`);

      log(0, `${user.username} successfully logged in.`);

      return res.status(200).json({ success: true, message: 'OK', token });
    } catch (err) {
      log(3, `Error in postLogin: ${err.message}`);
      handleError(err, res);
    }
  }


  /**
   * POST
   * Validates a user's authentication token.
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @returns {Response}
   */
  async postAuth(req, res) {
    log(0, 'AuthController postAuth called');
    const { user, body, update } = req;
    const { role } = body || { role: undefined };

    if (role !== undefined && user.role > role) {
      return res.status(403).json({ status: 403, success: false, message: 'Account not authorised' });
    }

    return res.status(200).json({ success: true, message: 'Authorised', user, update });
  }
}
