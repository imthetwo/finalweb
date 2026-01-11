import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  logo: { url: String, publicId: String },
  origin: { type: String }
}, { timestamps: true });

export default mongoose.model('Brand', brandSchema);