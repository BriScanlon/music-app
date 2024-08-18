import RouteBase from './RouteBase.js';
import jwt from 'jsonwebtoken';
import log from '../helpers/logger.js';
import auth from '../middleware/auth.js';
import KeyModel from '../models/apikeys.js';
import { missingKeys, handleError } from '../helpers/requestHelpers.js';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET_KEY } = process.env;

export default class APIKeyController extends RouteBase {
  constructor() {
    super('/api-key');
    this.initialiseRoutes();
  }

  initialiseRoutes() {

    // C
    this.router.post(this.path, auth, this.postCreate.bind(this));
    this.router.post(this.path + '/gen/:id', auth, this.genKey.bind(this));

    // R
    this.router.get(this.path + 's', auth, this.getKeys.bind(this));
    this.router.post(this.path + 's', auth, this.getKeys.bind(this));
    this.router.post(this.path + '/query', auth, this.getAllKeys.bind(this));
    this.router.get(this.path + '/:id', auth, this.getKeys.bind(this));
    this.router.post(this.path + '/:id', auth, this.getKeys.bind(this));

    // U
    this.router.put(this.path + '/:id', auth, this.putUpdateById.bind(this));

    //D
    this.router.delete(this.path + '/:id', auth, this.deleteDeleteById.bind(this));
  }

  async getAllKeys(req, res) {
    try {
      if (req.user.role > 1) {
        log(1, `${req.user.username} is not authorised to get keys.`);
        throw new Error('Unable to authenticate user.', { cause: { status: 403 } });
      }

      const { limit, page, ...filters } = req.body || {};
      const count = await KeyModel.find(filters).countDocuments();
      const keys = await KeyModel.find(filters)
        .limit(limit || 0)
        .skip((page || 0) * (limit || 0))
        .lean();

      return res.status(200).json({ count, keys, success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }

  async getKeys(req, res) {
    const { limit, page } = req.body || {};
    const filters = { owner: req.user._id };
    if (req.params.id) filters._id = String(req.params.id);

    try {
      const count = await KeyModel.find(filters).countDocuments();
      const keys = await KeyModel.find(filters)
        .limit(limit || 0)
        .skip((page || 0) * (limit || 0))
        .lean();

      return res.status(200).json({ count, keys, success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }

  async genKey(req, res) {
    const { id } = req.params || {};
    const { _id: owner } = req.user;
    const { life } = { life: 604800, ...(req.body || {}) };

    try {
      const key = await KeyModel.findOne({ _id: id, owner });
      if (!key) throw new Error('Key not found', { cause: { status: 404 } });

      const token = jwt.sign({ key: { id } }, JWT_SECRET_KEY, { expiresIn: life });
      return res.status(200).json({ success: true, message: 'OK', key: token });
    } catch (err) {
      handleError(err, res);
    }
  }

  async postCreate(req, res) {
    const { _id: owner, role: _role } = req.user;
    const { name, description, role } = { role: _role, ...(req.body || {}) };

    try {
      const error = missingKeys(['name'], req.body);
      if (error.length) throw new Error(`Missing ${error.join(', ')} from body.`, { cause: { status: 400 } });

      const key = new KeyModel({ owner, name, description, role: Math.max(_role, role) });
      await key.save();

      return res.status(200).json({ success: true, message: 'Successfully created a new key.', key });
    } catch (err) {
      handleError(err, res);
    }
  }

  async putUpdateById(req, res) {
    const { id } = req.params || {};
    const { name, description, role } = req.body || {};

    try {
      if (typeof name === 'undefined' && typeof description === 'undefined' && typeof role === 'undefined') {
        throw new Error('No update requested.', { cause: { status: 400 } });
      }

      const key = await KeyModel.findById(id);
      if (!key) throw new Error('Key not found', { cause: { status: 404 } });

      const isUser = String(req.user._id) === String(key.owner);
      const isAdmin = req.user.role <= 1;
      if (!isUser && !isAdmin) {
        log(1, `Account ${req.user.username} does not have permissions to edit this key.`);
        throw new Error('You do not have permissions to edit this key.', { cause: { status: 403 } });
      }

      if (name) key.name = name;
      if (description) key.description = description;
      if (role) key.role = Math.max(req.user.role, role);
      await key.save();

      res.status(200).json({ key: key.toObject(), success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }

  async deleteDeleteById(req, res) {
    const { id } = req.params || {};

    try {
      const key = await KeyModel.findById(id);
      if (!key) throw new Error('Key not found', { cause: { status: 404 } });

      const isUser = String(req.user._id) === String(key.owner);
      const isAdmin = req.user.role <= 1;
      if (!isUser && !isAdmin) {
        log(1, `Account ${req.user.username} does not have permissions to delete this key.`);
        throw new Error('You do not have permissions to delete this key.', { cause: { status: 403 } });
      }

      await KeyModel.deleteOne({ _id: key._id });

      res.status(200).json({ success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }
}
