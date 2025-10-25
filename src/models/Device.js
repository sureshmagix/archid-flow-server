import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  name: { type: String, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: 
true },
  status: { type: String, enum: ['online','offline','unknown'], default: 
'unknown' },
  lastSeenAt: { type: Date },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('Device', DeviceSchema);
