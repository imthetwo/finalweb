import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String
    }
  },
  { timestamps: true }
);

categorySchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Category', categorySchema);