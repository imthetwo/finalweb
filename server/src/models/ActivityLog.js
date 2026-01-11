import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  targetModel: { type: String, index: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  correlationId: { type: String, index: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

activityLogSchema.index({ targetModel: 1, targetId: 1, createdAt: -1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
