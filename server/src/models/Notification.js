import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String
    },
    isRead: {
      type: Boolean,
      default: false
    },
    link: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

export default mongoose.model('Notification', notificationSchema);
