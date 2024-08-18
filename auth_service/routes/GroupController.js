import { Types } from 'mongoose';
import RouteBase from './RouteBase.js';
import auth, { checkPermission } from '../middleware/auth.js';
import log from '../helpers/logger.js';
import { handleError, missingKeys } from '../helpers/requestHelpers.js';
import GroupModel from '../models/group.js';
import UserModel from '../models/user.js';
import PermissionModel from '../models/permission.js';

export default class GroupController extends RouteBase {
    constructor() {
        super('/group');
        this.initialiseRoutes();
    }

    initialiseRoutes() {
        // C
        this.router.post(this.path, auth, this.createGroup.bind(this));
        this.router.post(this.path + '/:id/users', auth, this.addUserToGroup.bind(this));
        this.router.post(this.path + '/:id/permissions', auth, this.addPermissionToGroup.bind(this));

        // R
        this.router.get(this.path + 's', auth, this.getGroups.bind(this));
        this.router.post(this.path + 's', auth, this.getGroups.bind(this));
        this.router.get(this.path + '/:id', auth, this.getGroup.bind(this));

        // U
        this.router.put(this.path + '/:id', auth, this.updateGroup.bind(this));
        this.router.post(this.path + '/:groupId/users/:userId', auth, this.addUserToGroup.bind(this));

        // D
        this.router.delete(this.path + '/:id', auth, this.deleteGroup.bind(this));
    }

    async getGroups(req, res) {
        try {
            const groups = await GroupModel.find().populate('permissions').populate('users').lean();
            return res.status(200).json({ success: true, data: groups });
        } catch (error) {
            handleError(error, res);
        }
    }

    async getGroup(req, res) {
        try {
            const { id } = req.params;
            const group = await GroupModel.findById(id).populate('permissions').populate('users').lean();
            if (!group) {
                return res.status(404).json({ success: false, message: 'Group not found' });
            }
            return res.status(200).json({ success: true, data: group });
        } catch (error) {
            handleError(error, res);
        }
    }

    async createGroup(req, res) {
        try {
            const { name, description } = req.body;
            const error = missingKeys(['name'], req.body);
            if (error.length) throw new Error(`Missing ${error.join(', ')} from body.`, { cause: { status: 400 } });

            const group = new GroupModel({ name, description });
            await group.save();
            return res.status(201).json({ success: true, data: group });
        } catch (error) {
            handleError(error, res);
        }
    }

    async updateGroup(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const group = await GroupModel.findById(id);
            if (!group) {
                return res.status(404).json({ success: false, message: 'Group not found' });
            }

            if (name) group.name = name;
            if (description) group.description = description;

            await group.save();
            return res.status(200).json({ success: true, data: group });
        } catch (error) {
            handleError(error, res);
        }
    }

    async deleteGroup(req, res) {
        try {
            const { id } = req.params;
            const group = await GroupModel.findByIdAndDelete(id);
            if (!group) {
                return res.status(404).json({ success: false, message: 'Group not found' });
            }
            return res.status(200).json({ success: true, message: 'Group deleted' });
        } catch (error) {
            handleError(error, res);
        }
    }

    async addUserToGroup(req, res) {
        const { groupId, userId } = req.params;
        try {
            const group = await GroupModel.findById(groupId);
            const user = await UserModel.findById(userId);

            if (!group) {
                return res.status(404).json({ success: false, message: 'Group not found' });
            }

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (!Array.isArray(user.groups)) user.groups = [];
            if (!Array.isArray(group.users)) group.users = [];

            if (user.groups.includes(groupId)) {
                return res.status(400).json({ success: false, message: 'User already in group' });
            }

            if (group.users.includes(userId)) {
                return res.status(400).json({ success: false, message: 'User already in group' });
            }

            user.groups.push(groupId);
            group.users.push(userId);

            await user.save();
            await group.save();

            return res.status(200).json({ success: true, message: 'User added to group' });
        } catch (err) {
            handleError(err, res);
        }
    }

    async addPermissionToGroup(req, res) {
        try {
            const { id } = req.params;
            const { permissionId } = req.body;

            const group = await GroupModel.findById(id);
            if (!group) {
                return res.status(404).json({ success: false, message: 'Group not found' });
            }

            const permission = await PermissionModel.findById(permissionId);
            if (!permission) {
                return res.status(404).json({ success: false, message: 'Permission not found' });
            }

            if (!Array.isArray(group.permissions)) group.permissions = [];

            if (group.permissions.includes(permissionId)) {
                return res.status(400).json({ success: false, message: 'Permission already in group' });
            }

            group.permissions.push(permissionId);

            await group.save();
            return res.status(200).json({ success: true, data: group });
        } catch (error) {
            handleError(error, res);
        }
    }
}
