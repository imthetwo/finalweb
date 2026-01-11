import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // 1. Mã đơn hàng hiển thị cho khách (Ví dụ: DH20260110-4829)
    orderCode: {
      type: String,
      unique: true,
      index: true
    },
    // 2. Người đặt hàng
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // 3. Danh sách sản phẩm (Snapshot: Lưu giá tại thời điểm mua)
    orderItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Số lượng tối thiểu là 1"]
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Giá sản phẩm không thể âm"]
        }
      }
    ],
    // 4. Tổng tiền đơn hàng
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Tổng tiền không thể âm"]
    },
    // 5. Trạng thái vận chuyển
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    // 6. Trạng thái thanh toán
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid"
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      required: true
    },
    // 7. Địa chỉ nhận hàng (Lưu trực tiếp, không dùng ref để tránh bị đổi dữ liệu cũ)
    shippingAddress: {
      fullName: String,
      phone: String,
      city: String,
      district: String,
      street: String
    },
    // 8. Audit Log: Nhân viên nào đã xử lý/xác nhận đơn này?
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true // Tự động tạo createdAt, updatedAt
  }
);

export default mongoose.model("Order", orderSchema);