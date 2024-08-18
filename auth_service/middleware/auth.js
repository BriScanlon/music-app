import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import log from '../helpers/logger.js';
import KeyModel from '../models/apikeys.js';
import UserModel from '../models/user.js';
import TenantModel from '../models/tenants.js';
import GroupModel from '../models/group.js';

dotenv.config();

const { JWT_SECRET_KEY, JWT_TOKEN_EXPIRE, MULTI_TENANCY } = process.env;
const isTenanted = MULTI_TENANCY && MULTI_TENANCY.toLowerCase() !== 'false';

export default async function auth(req, res, next) {
  const apiKey = req.headers['api-key'];

  if (apiKey) {
    try {
      const { key } = jwt.verify(apiKey, JWT_SECRET_KEY);

      const keyQuery = await KeyModel.findById(key.id);
      if (!keyQuery) return res.status(401).json({ status: 401, message: 'Auth Error' });

      const userQuery = await UserModel.findById(keyQuery.owner).select({ password: false });
      if (!userQuery || userQuery.status !== 1) return res.status(401).json({ status: 401, message: 'Auth Error' });

      userQuery.role = Math.max(keyQuery.role, userQuery.role);
      if (!userQuery.additionalFields) userQuery.additionalFields = {};
      userQuery.additionalFields.apiKey = keyQuery;

      if (isTenanted) {
        const tenant = await TenantModel.findById(userQuery.tenant_id);
        if (!tenant || tenant.status !== 1) return res.status(401).json({ status: 401, message: 'Invalid tenant' });
      }

      req.user = userQuery;
      return next();
    } catch (err) {
      return res.status(500).send({ status: 500, message: 'Invalid Key' });
    }
  }

  const { cookie } = req.headers;
  const cookieToken = cookie?.split('; ')?.find((c) => /^AuthToken=.*$/.test(c));
  const token = cookieToken ? cookieToken.split('=')[1] : req.headers['authorization']?.split(' ')[1];

  try {
    if (!token) throw new Error('TOKEN_ERROR');

    const { user, remember, exp } = jwt.verify(token, JWT_SECRET_KEY);
    const query = await UserModel.findById(user.id).select({ password: false });

    if (!query || query.status !== 1) throw new Error('TOKEN_ERROR');

    if (isTenanted) {
      const tenant = await TenantModel.findById(query.tenant_id);
      if (!tenant || tenant.status !== 1) throw new Error('Invalid tenant');
    }

    const expiresIn = remember ? parseInt(JWT_TOKEN_EXPIRE) : 7200;
    if ((exp - Date.now() / 1000) / 60 / 60 / 24 < 2) {
      const newToken = jwt.sign({ user, remember }, JWT_SECRET_KEY, { expiresIn });
      req.update = { token: newToken, expiresIn };
      res.setHeader('Set-Cookie', `AuthToken=${newToken}; Path=/;${remember ? ` Max-Age=${expiresIn};` : ''}`);
    }

    req.user = query;
    return next();
  } catch (err) {
    if (err.message === 'TOKEN_ERROR') {
      res.setHeader('Set-Cookie', 'AuthToken=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
      return res.status(401).json({ status: 401, message: 'Auth Error' });
    }

    log(2, err);
    return res.status(500).send({ status: 500, message: 'Invalid Token' });
  }
}

export async function checkPermission(req, res, next) {
  const { user } = req;
  const { requiredPermission } = req.route.meta;

  try {
    const groups = await GroupModel.find({ users: user._id }).populate('permissions').lean();
    const userPermissions = groups.reduce((acc, group) => {
      return [...acc, ...group.permissions.map((perm) => perm.name)];
    }, []);

    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ status: 403, message: 'Permission denied' });
    }

    return next();
  } catch (err) {
    log(2, err);
    return res.status(500).send({ status: 500, message: 'Permission check failed' });
  }
}
