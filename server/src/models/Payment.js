import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  transactionId: { type: String, required: true, index: true },
  method: { type: String, enum: ['Momo','Stripe','QR','Other'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Success','Failed','Pending'], required: true },
  paymentData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
