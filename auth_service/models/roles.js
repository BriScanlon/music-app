import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  role_no: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
});

const RoleModel = mongoose.model('Role', roleSchema);

export default RoleModel;
