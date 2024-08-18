import RouteBase from './RouteBase.js';
import PermissionModel from '../models/permission.js';
import GroupModel from '../models/group.js';
import log from '../helpers/logger.js';
import auth from '../middleware/auth.js';
import { handleError } from '../helpers/requestHelpers.js';

export default class PermissionController extends RouteBase {
    constructor() {
        super('/permission');
        this.initialiseRoutes();
    }

    initialiseRoutes() {
        // C
        this.router.post(this.path, auth, this.createPermission.bind(this));

        // R
        this.router.get(this.path + 's', auth, this.getPermissions.bind(this));
        
        // U
        this.router.put(this.path + '/:id', auth, this.updatePermission.bind(this));
        this.router.post(this.path + '/:permissionId/groups/:groupId', auth, this.addPermissionToGroup.bind(this));

        // D
        this.router.delete(this.path + '/:id', auth, this.deletePermission.bind(this));
    }

    async getPermissions(req, res) {
        try {
            const permissions = await PermissionModel.find().populate('groups');
            return res.status(200).json({ success: true, permissions });
        } catch (err) {
            handleError(err, res);
        }
    }

    async createPermission(req, res) {
        const { name, description, groups } = req.body;
        try {
            const newPermission = new PermissionModel({ name, description, groups });
            await newPermission.save();
            return res.status(201).json({ success: true, permission: newPermission });
        } catch (err) {
            handleError(err, res);
        }
    }

    async updatePermission(req, res) {
        const { id } = req.params;
        const { name, description, groups } = req.body;
        try {
            const updatedPermission = await PermissionModel.findByIdAndUpdate(id, { name, description, groups }, { new: true });
            return res.status(200).json({ success: true, permission: updatedPermission });
        } catch (err) {
            handleError(err, res);
        }
    }

    async deletePermission(req, res) {
        const { id } = req.params;
        try {
            await PermissionModel.findByIdAndDelete(id);
            return res.status(200).json({ success: true, message: 'Permission deleted' });
        } catch (err) {
            handleError(err, res);
        }
    }

    async addPermissionToGroup(req, res) {
        const { groupId, permissionId } = req.params;
        try {
          const group = await GroupModel.findById(groupId);
          const permission = await PermissionModel.findById(permissionId);
      
          if (!group || !permission) {
            return res.status(404).json({ success: false, message: 'Group or permission not found' });
          }
      
          group.permissions.push(permissionId);
          await group.save();
      
          permission.groups.push(groupId);
          await permission.save();
      
          return res.status(200).json({ success: true, message: 'Permission assigned to group' });
        } catch (err) {
          handleError(err, res);
        }
      }
      
}
