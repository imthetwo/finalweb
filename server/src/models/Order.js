import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        
        orderItems: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true }, // Lưu giá lúc mua để tránh thay đổi sau này
            }
        ],

        totalPrice: { type: Number, required: true },
        
        status: { 
            type: String, 
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], 
            default: "Pending" 
        },

        paymentMethod: { type: String, enum: ["COD", "Online"], required: true },
        
        shippingAddress: {
            city: String,
            district: String,
            street: String,
            phone: String,
        },

        // Audit Log: Nhân viên nào xử lý đơn này?
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);