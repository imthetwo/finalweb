import mongoose from 'mongoose';

// Local cartItemSchema (keeps structure consistent with Cart model)
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

// CartSession: store anonymous or short-lived carts (e.g. guest users)
// - sessionId: public identifier stored in cookie/localStorage on client
// - userId: optional link if guest becomes authenticated
// - expiresAt: TTL index will remove stale sessions automatically

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
    // expiry for the guest cart. Set by server when creating the cart (e.g., now + 7 days)
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    // optional metadata
    ip: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Export model
export default mongoose.model('CartSession', cartSessionSchema);
