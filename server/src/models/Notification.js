import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['in-app', 'email', 'push', 'sms']
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: {
      type: Date
    },
    error: {
      type: String
    },
    sentAt: {
      type: Date
    }
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      default: 'generic'
    },
    title: {
      type: String
    },
    content: {
      type: String,
      required: true
    },
    data: {
      type: Object
    },
    link: {
      type: String
    },
    channels: [
      {
        type: String,
        enum: ['in-app', 'email', 'push', 'sms']
      }
    ],
    deliveries: {
      type: [deliverySchema],
      default: []
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Notification', notificationSchema);