import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const cartSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('CartSession', cartSessionSchema);