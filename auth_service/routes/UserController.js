import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import RouteBase from './RouteBase.js';
import log from '../helpers/logger.js';
import auth from '../middleware/auth.js';
import { missingKeys, handleError } from '../helpers/requestHelpers.js';
import UserModel from '../models/user.js';
import RoleModel from '../models/roles.js';
import TenantModel from '../models/tenants.js';
import dotenv from 'dotenv';

dotenv.config();

const { PASSWORD_POLICY, MULTI_TENANCY } = process.env;
const isTenanted = MULTI_TENANCY && MULTI_TENANCY?.toLowerCase() !== 'false';

const emailRegex = new RegExp(
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
);
const pwdRegex = new RegExp(PASSWORD_POLICY);

export default class UserController extends RouteBase {
  constructor() {
    super('/user');
    this.initialiseRoutes();
  }

  initialiseRoutes() {
    // C
    this.router.post(this.path + 's', auth, this.getUsers.bind(this));
    this.router.post(this.path, auth, this.postCreate.bind(this));

    // R
    this.router.get(this.path + 's', auth, this.getUsers.bind(this));
    this.router.get(this.path + '/:id', auth, this.getUsers.bind(this));

    // U
    this.router.put(this.path + '/:id', auth, this.putUpdateById.bind(this));

    // D
    this.router.delete(this.path + '/:id', auth, this.deleteDeleteById.bind(this));
  }

  async getUsers(req, res) {
    try {
      if (req.user.role > 1) {
        log(1, `${req.user.username} is not authorised to get users.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const { id } = req?.params;
      const { sort, limit, include_deleted, page, search } = req?.body || {};

      const query = id ? { _id: id } : {};

      if (!include_deleted && !id) query.status = 1;

      if (search && !id) {
        query['$or'] = [];
        query['$or'].push({ username: { $regex: search, $options: 'i' } });
        query['$or'].push({ email: { $regex: search, $options: 'i' } });
        query['$or'].push({ name: { $regex: search, $options: 'i' } });

        const roles = await RoleModel.find({
          $or: [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }],
        }).distinct('role_no');

        query['$or'].push({ role: { $in: roles } });
      }

      if (isTenanted && req.user?.tenant && req.user?.role > 0) query.tenant = Types.ObjectId(req.user.tenant);

      const count = await UserModel.find(query).count();

      const users = id
        ? await UserModel.findById(id).select({ password: false })
        : await UserModel.find(query)
          .sort(sort || { name: 1 })
          .collation({ locale: 'en', numericOrdering: true })
          .limit(limit || 0)
          .skip((page || 0) * (limit || 0))
          .select({ password: false })
          .lean();

      return res.status(200).json({ count, [id ? 'user' : 'users']: users, status: 200, success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }

  async postCreate(req, res) {
    const { user, body } = req || {};

    try {
      if (user.role > 1) {
        log(1, `${user.username} is not authorised to create users.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const { email, username, password, additionalFields, name, role } = {
        role: user.role,
        ...(body || {}),
      };

      const tenant = isTenanted ? (user.role > 0 ? user.tenant : req?.body?.tenant) : undefined;

      if (role < user.role) {
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const error = missingKeys(['username', 'password'], req?.body);
      if (error.length) throw new Error(`Missing ${error.join(', ')} from body.`, { cause: { status: 400 } });

      if (email && !emailRegex.test(email)) {
        throw new Error(`Unable to verify email format.`, { cause: { status: 400 } });
      }

      if (PASSWORD_POLICY && !pwdRegex.test(password)) {
        throw new Error('Password failed policy check.', { cause: { status: 400 } });
      }

      if (role > 0 && isTenanted && tenant && !Types.ObjectId.isValid(tenant)) {
        throw new Error('Tenancy invalid/required.', { cause: { status: 400 } });
      }

      const userExists = await UserModel.exists({ username });

      if (userExists) throw new Error('User already exists.', { cause: { status: 400 } });

      if (isTenanted && tenant) {
        const tenantValid = await TenantModel.findById(tenant).lean();
        if (!tenantValid || tenantValid.status !== 1) {
          throw new Error('Tenancy invalid/required.', { cause: { status: 400 } });
        }
      }

      const hashedPassword = bcrypt.hashSync(String(password), 10); // Ensure password is hashed

      const newUser = new UserModel({
        email,
        username,
        name,
        password: hashedPassword, // Store hashed password
        additionalFields,
        role,
        tenant,
      });
      await newUser.save();

      const _user = newUser.toObject();
      delete _user.password;

      return res
        .status(200)
        .json({ user: _user, status: 200, success: true, message: 'Successfully created a new user.' });
    } catch (err) {
      handleError(err, res);
    }
  }

  async putUpdateById(req, res) {
    const { id } = req.params || {};
    const isUser = String(req.user._id) === id;
    const isAdmin = req.user.role === 0;

    try {
      log(0, `Request user: ${JSON.stringify(req.user)}`); // Add logging to verify req.user
      if (!isUser && !isAdmin) {
        log(1, `${req.user.username} is not authorised to edit users.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (!Types.ObjectId.isValid(id)) throw new Error('User not found.', { cause: { status: 404 } });

      const { username, email, password, current_password, name, role, additionalFields, status } = req.body || {};

      if (
        !username &&
        !email &&
        !password &&
        !name &&
        typeof role === 'undefined' &&
        typeof status === 'undefined' &&
        !additionalFields
      ) {
        throw new Error('No update requested.', { cause: { status: 400 } });
      }

      const query = { _id: Types.ObjectId(id) };
      if (isTenanted && req.user.role > 0 && req.user.tenant) query.tenant = Types.ObjectId(req.user.tenant);

      const user = await UserModel.findOne(query);

      if (!user) throw new Error('User not found.', { cause: { status: 404 } });

      if (user.role < req.user.role) {
        log(1, `${req.user.username} is not authorised to edit users (edit permissions).`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (!isAdmin && role < req.user.role) {
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (!isAdmin && password && !bcrypt.compareSync(current_password, user.password)) {
        throw new Error('Current password missing or incorrect.', { cause: { status: 400 } });
      }

      if (email && !emailRegex.test(email)) {
        throw new Error('Unable to update user with invalid email.', { cause: { status: 400 } });
      }

      if (PASSWORD_POLICY && password && !pwdRegex.test(password)) {
        throw new Error('Unable to update user with failing password.', { cause: { status: 400 } });
      }

      if (username) user.username = username;
      if (email) user.email = email;
      if (password) user.password = bcrypt.hashSync(password, 10); // Ensure password is hashed
      if (name) user.name = name;
      if (isAdmin && !isUser && role) user.role = role;
      if (isAdmin && !isUser && status) user.status = status;

      if (isAdmin && !isUser && additionalFields) {
        const _af = { ...user.additionalFields, ...additionalFields };
        user.additionalFields = Object.keys(_af).reduce((obj, key) => {
          if (Boolean(_af[key] !== null)) obj[key] = _af[key];
          return obj;
        }, {});
      }

      await user.save();
      const _user = await UserModel.findById(String(id)).select({ _id: false, password: false });
      return res.status(200).json({ user: _user, status: 200, success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }


  async deleteDeleteById(req, res) {
    try {
      if (req.user.role > 1) {
        log(1, `${req.user.username} is not authorised to delete users.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const { id } = req?.params;
      if (!Types.ObjectId.isValid(id)) throw new Error('User not found.', { cause: { status: 404 } });

      const query = { _id: Types.ObjectId(id) };
      if (isTenanted && req.user?.role > 0 && req.user?.tenant) query.tenant = Types.ObjectId(req.user.tenant);

      const user = await UserModel.findOne(query).select({ password: false });

      if (!user) throw new Error('User not found.', { cause: { status: 404 } });

      if (user.role < req.user.role) {
        log(1, `${req.user.username} is not authorised to edit users (delete permissions).`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (user.status == 0 && !req?.body?.hard_delete) {
        throw new Error('User is already marked for deletion.', { cause: { status: 400 } });
      }

      if (req?.body?.hard_delete) {
        await UserModel.deleteOne({ _id: String(id) });
      } else {
        await UserModel.findByIdAndUpdate(String(id), { status: 0, deleted_at: Date.now() });
      }

      return res
        .status(200)
        .json({ status: 200, user: req?.body?.hard_delete ? null : user.toObject(), success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }
}
