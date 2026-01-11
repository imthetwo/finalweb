import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountValue: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['fixed', 'percent'],
      required: true
    },
    minOrderValue: {
      type: Number,
      default: 0
    },
    expiryDate: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: 1
    },
    usedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Voucher', voucherSchema);
