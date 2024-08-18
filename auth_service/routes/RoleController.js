import RouteBase from './RouteBase.js';
import log from '../helpers/logger.js';
import auth from '../middleware/auth.js';
import RoleModel from '../models/roles.js';
import { handleError, missingKeys } from '../helpers/requestHelpers.js';

export default class RoleController extends RouteBase {
  constructor() {
    super('/role');
    this.initialiseRoles();
    this.initialiseRoutes();
  }

  async initialiseRoles() {
    const hasRoles = await RoleModel.exists({});
    if (hasRoles) return;

    const superAdmin = new RoleModel({
      role_no: 0,
      name: 'SuperAdmin',
      description: 'Highest user level, this account can do anything.',
    });

    const admin = new RoleModel({
      role_no: 1,
      name: 'Admin',
      description: 'System admin account, can do most things on the system.',
    });

    await Promise.all([superAdmin.save(), admin.save()]);
    log(0, 'Default roles have been created.');
  }

  initialiseRoutes() {
    this.router.get(this.path + 's', auth, this.getRoles.bind(this));
    this.router.post(this.path, auth, this.postCreate.bind(this));
    this.router.get(this.path + '/:no', auth, this.getRoles.bind(this));
    this.router.put(this.path + '/:no', auth, this.putUpdateById.bind(this));
    this.router.delete(this.path + '/:no', auth, this.deleteDeleteById.bind(this));
  }

  async getRoles(req, res) {
    try {
      if (req.user.role > 1) {
        log(1, `${req.user.username} is not authorised to get roles.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const filters = {};
      if (req.params.no) filters.role_no = String(req.params.no);

      const count = await RoleModel.find(filters).countDocuments();
      const roles = await RoleModel.find(filters);

      return res.status(200).json({
        count,
        roles: filters.role_no && roles.length ? roles[0] : roles,
        success: true,
        message: 'OK',
      });
    } catch (err) {
      handleError(err, res);
    }
  }

  async postCreate(req, res) {
    try {
      if (req.user.role > 1) {
        log(1, `${req.user.username} is not authorised to create roles.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const { role, name, description } = req.body;
      const error = missingKeys(['role', 'name'], req.body);
      if (error.length) throw new Error(`Missing ${error.join(', ')} from body`, { cause: { status: 400 } });

      const roleExists = await RoleModel.findOne({ role_no: role });
      if (Boolean(roleExists)) throw new Error('Role already exists.', { cause: { status: 400 } });

      const newRole = new RoleModel({ role_no: role, name, description });
      await newRole.save();
      const data = newRole.toObject();

      return res.status(200).json({ role: data, success: true, message: 'Successfully created a new role.' });
    } catch (err) {
      handleError(err, res);
    }
  }

  async putUpdateById(req, res) {
    try {
      if (req.user.role > 1) {
        log(1, `${req.user.username} is not authorised to update roles.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const { no } = req.params;
      const { name, description } = req.body;
      if (!name && !description) throw new Error('No update requested.', { cause: { status: 400 } });

      const role = await RoleModel.findOne({ role_no: no });
      if (!role) throw new Error('Role not found.', { cause: { status: 404 } });

      if (name) role.name = name;
      if (description) role.description = description;
      await role.save();

      return res.status(200).json({ role: role.toObject(), success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }

  async deleteDeleteById(req, res) {
    try {
      if (req.user.role > 1) {
        log(1, `${req.user.username} is not authorised to delete roles.`);
        throw new Error('This action requires a higher level of authentication.', { cause: { status: 403 } });
      }

      const { no } = req.params;
      const role = await RoleModel.findOne({ role_no: no });
      if (!role) throw new Error('Role not found.', { cause: { status: 404 } });

      await RoleModel.deleteOne({ _id: role._id });

      return res.status(200).json({ success: true, message: 'OK' });
    } catch (err) {
      handleError(err, res);
    }
  }
}
