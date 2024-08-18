import { Types } from 'mongoose';
import RouteBase from './RouteBase.js';
import auth from '../middleware/auth.js';
import TenantModel from '../models/tenants.js';
import UserModel from '../models/user.js';
import log from '../helpers/logger.js';
import { handleError } from '../helpers/requestHelpers.js';
import dotenv from 'dotenv';

dotenv.config();

const { MULTI_TENANCY } = process.env;

export default class TenantController extends RouteBase {
  constructor() {
    super('/tenant');
    if (!MULTI_TENANCY || MULTI_TENANCY.toLowerCase() === 'false') return;
    this.initialiseEndpoints();
  }

  initialiseEndpoints() {

    // C
    this.router.post(this.path, auth, this.createTenant.bind(this));

    // R
    this.router.post(this.path + 's', auth, this.readTenants.bind(this));
    this.router.get(this.path + 's', auth, this.readTenants.bind(this));
    this.router.get(this.path + '/:id', auth, this.readTenants.bind(this));

    // U
    this.router.put(this.path + '/:id', auth, this.updateTenant.bind(this));

    // D
    this.router.delete(this.path + '/:id', auth, this.deleteTenant.bind(this));
  }

  async createTenant(req, res) {
    const { role } = req.user;
    const { name } = req.body;

    try {
      if (role > 0) {
        log(1, `${req.user.username} is not authorised to create tenants.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (!name) throw new Error('Missing name from body.', { cause: { status: 400 } });

      const exists = await TenantModel.exists({ name });
      if (exists) throw new Error('Tenant with this name already exists.', { cause: { status: 400 } });

      const tenant = new TenantModel({ name });
      await tenant.save();

      return res.status(200).json({ status: 200, success: true, message: 'Success.', tenant });
    } catch (err) {
      handleError(err, res);
    }
  }

  async readTenants(req, res) {
    const { role } = req.user;
    const { id } = req.params;
    const { limit, page, search, sort } = req.body;

    try {
      if (role > 0) {
        log(1, `${req.user.username} is not authorised to read tenants.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (id) {
        if (!Types.ObjectId.isValid(id)) throw new Error('Tenant not found.', { cause: { status: 404 } });

        const tenant = await TenantModel.findById(id).lean();
        if (!tenant) throw new Error('Tenant not found.', { cause: { status: 404 } });

        return res.status(200).json({ status: 200, success: true, message: 'Success.', data: tenant });
      }

      const query = { status: 1 };
      if (search) query.name = { $regex: search, $options: 'i' };

      const [tenantCount, tenants] = await Promise.all([
        TenantModel.find(query).countDocuments(),
        TenantModel.find(query)
          .sort(sort)
          .limit(limit || 0)
          .skip((page || 0) * (limit || 0)),
      ]);

      return res.status(200).json({ status: 200, success: true, message: 'Success.', data: tenants, count: tenantCount });
    } catch (err) {
      handleError(err, res);
    }
  }

  async updateTenant(req, res) {
    const { id } = req.params;
    const { name, status } = req.body;
    const { role } = req.user;

    try {
      if (role > 0) {
        log(1, `${req.user.username} is not authorised to modify tenants.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (!Types.ObjectId.isValid(id)) throw new Error('Tenant not found.', { cause: { status: 404 } });

      const updatedTenant = await TenantModel.findByIdAndUpdate(id, { name, status }, { new: true });
      if (!updatedTenant) throw new Error('Tenant not found.', { cause: { status: 404 } });

      return res.status(200).json({ status: 200, success: true, message: 'Success.', data: updatedTenant });
    } catch (err) {
      handleError(err, res);
    }
  }

  async deleteTenant(req, res) {
    const { id } = req.params;
    const { role } = req.user;

    try {
      if (role > 0) {
        log(1, `${req.user.username} is not authorised to delete tenants.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      if (!Types.ObjectId.isValid(id)) throw new Error('Tenant not found.', { cause: { status: 404 } });

      const [valid] = await Promise.all([
        TenantModel.findByIdAndUpdate(id, { status: 0 }),
        UserModel.updateMany({ tenant: id }, { status: 0 }),
      ]);
      if (!valid) throw new Error('Tenant not found.', { cause: { status: 404 } });

      return res.status(200).json({ status: 200, success: true, message: 'Success.' });
    } catch (err) {
      handleError(err, res);
    }
  }
}
