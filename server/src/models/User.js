import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vnPhoneRegex = /^(\+84|0)(3|5|7|8|9)\d{8}$/;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  hashedPassword: { type: String, required: true, select: false },
  email: { type: String, required: true, unique: true, lowercase: true, match: emailRegex, index: true },
  displayName: { type: String, required: true, trim: true },
  avatar: { url: String, publicId: String },
  bio: { type: String, maxlength: 500 },
  phone: { type: String, match: vnPhoneRegex, sparse: true },
  role: { type: String, enum: ['admin','staff','customer'], default: 'customer', index: true },
  address: { city: String, district: String, street: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('User', userSchema);