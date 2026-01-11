import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, required: true, min: 0, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
  specifications: { type: Object },
  images: [{ url: String, publicId: String }],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAvailable: { type: Boolean, default: true, index: true }
}, { timestamps: true });

productSchema.index({ title: 'text' });

export default mongoose.model('Product', productSchema);