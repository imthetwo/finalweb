import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    logo: {
      url: {
        type: String
      },
      publicId: {
        type: String
      }
    },
    origin: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Brand", brandSchema);