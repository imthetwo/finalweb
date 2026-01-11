import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    } // snapshot price at purchase
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderItems: {
      type: [orderItemSchema],
      required: true
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Refunded'],
      default: 'Unpaid'
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Online', 'QR'],
      required: true
    },
    shippingAddress: {
      fullName: {
        type: String
      },
      phone: {
        type: String
      },
      city: {
        type: String
      },
      district: {
        type: String
      },
      street: {
        type: String
      }
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);