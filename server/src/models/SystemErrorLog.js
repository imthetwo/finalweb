import mongoose from 'mongoose';

const systemErrorLogSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true
    },
    stack: {
      type: String
    },
    path: {
      type: String
    },
    method: {
      type: String
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

export default mongoose.model('SystemErrorLog', systemErrorLogSchema);
