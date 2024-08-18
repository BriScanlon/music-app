import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: Number, default: 2 },
  status: { type: Number, default: 1 },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
