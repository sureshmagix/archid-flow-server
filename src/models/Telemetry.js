import mongoose from 'mongoose';

const TelemetrySchema = new mongoose.Schema({
  deviceId: { type: String, index: true, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

export default mongoose.model('Telemetry', TelemetrySchema);
