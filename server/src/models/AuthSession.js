import mongoose from 'mongoose';

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refreshToken: {
      type: String,
      required: true,
      select: false
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('AuthSession', authSessionSchema);