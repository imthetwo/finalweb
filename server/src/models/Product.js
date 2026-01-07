import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true },
        sku: { type: String, required: true, unique: true }, // Mã kho hàng
        price: { type: Number, required: true, min: 0 },
        discountPrice: { type: Number, default: 0 },
        stock: { type: Number, required: true, min: 0 },
        
        // Liên kết dữ liệu
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },

        // Thông số kỹ thuật động (Dùng cho Laptop, RAM, PC...)
        specifications: { type: Object, required: true },
        
        images: [
            {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
            }
        ],

        // Audit Log: Ai là người sửa cuối?
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        
        isAvailable: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Product", productSchema);