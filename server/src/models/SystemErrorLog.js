import mongoose from 'mongoose';

const systemErrorLogSchema = new mongoose.Schema({
  level: { type: String, enum: ['error','warn','info'], default: 'error', index: true },
  message: { type: String, required: true },
  stack: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  occurredAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export default mongoose.model('SystemErrorLog', systemErrorLogSchema);
