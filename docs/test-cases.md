# Bảng Test Case Chi Tiết — Pecify PC Store

> **Hệ thống:** NestJS (backend, `http://localhost:3001`) + Next.js 16 (frontend, `http://localhost:3000`)
> **Cơ sở dữ liệu:** PostgreSQL (Supabase) — Prisma ORM
> **Loại kiểm thử:** Manual / Functional / Security Testing
> **Quy ước cột:**
> - **Loại:** N = Normal (luồng đúng) · A = Abnormal (luồng lỗi) · B = Boundary (giá trị biên)
> - **Ưu tiên:** Cao / TB / Thấp
> - **Kết quả thực tế** & **Trạng thái** (Pass/Fail) để trống cho tester điền khi chạy thực tế.

---

## Mục lục
1. [Xác thực & Tài khoản](#1-xác-thực--tài-khoản-authentication)
2. [Hồ sơ người dùng](#2-hồ-sơ-người-dùng-profile)
3. [Sản phẩm & Danh mục](#3-sản-phẩm--danh-mục-products--categories)
4. [Giỏ hàng](#4-giỏ-hàng-cart)
5. [Đặt hàng & Thanh toán](#5-đặt-hàng--thanh-toán-orders--payments)
6. [Mã giảm giá](#6-mã-giảm-giá-coupons)
7. [Yêu thích & Đánh giá](#7-yêu-thích--đánh-giá-wishlist--reviews)
8. [Trợ lý AI & PC Builder](#8-trợ-lý-ai--pc-builder)
9. [Quản trị — Sản phẩm](#9-quản-trị--sản-phẩm-admin-products)
10. [Quản trị — Đơn hàng & Người dùng](#10-quản-trị--đơn-hàng--người-dùng)
11. [Quản trị — Hero Video & Import](#11-quản-trị--hero-video--import-excel)
12. [Bảo mật & Phi chức năng](#12-bảo-mật--phi-chức-năng-non-functional)

---

## 1. Xác thực & Tài khoản (Authentication)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-AUTH-01 | N | Cao | Đăng ký thành công | Email chưa tồn tại trong DB | 1. Mở `/login`, chọn tab "Đăng ký"<br>2. Nhập Họ tên, Email, Mật khẩu hợp lệ<br>3. Nhấn "Đăng ký" | name=`Nguyen Van A`<br>email=`a@mail.com`<br>pass=`Abc12345` | HTTP 201; tài khoản được tạo (role=USER); trả về JWT; chuyển về trang chủ và hiển thị tên user trên header | | |
| TC-AUTH-02 | A | Cao | Đăng ký email trùng | Email `a@mail.com` đã tồn tại | 1. Đăng ký lại với email đã có | email=`a@mail.com` | HTTP 409/400; thông báo "Email đã được sử dụng"; không tạo bản ghi mới | | |
| TC-AUTH-03 | A | TB | Email sai định dạng | - | 1. Nhập email không có `@`<br>2. Submit | email=`abc.mail` | Client chặn submit, hiển thị lỗi "Email không hợp lệ"; backend trả 400 nếu bypass | | |
| TC-AUTH-04 | B | TB | Mật khẩu ngắn hơn tối thiểu | - | 1. Nhập mật khẩu < 6 (8) ký tự | pass=`123` | Lỗi validation "Mật khẩu quá ngắn"; không gửi/không tạo tài khoản | | |
| TC-AUTH-05 | A | TB | Bỏ trống trường bắt buộc | - | 1. Để trống Họ tên/Email/Mật khẩu<br>2. Submit | (rỗng) | Hiển thị lỗi "Trường bắt buộc"; nút Đăng ký không thực thi | | |
| TC-AUTH-06 | N | Cao | Đăng nhập thành công | Đã có tài khoản | 1. Tab "Đăng nhập"<br>2. Nhập email + mật khẩu đúng<br>3. Submit | email=`a@mail.com`<br>pass=`Abc12345` | HTTP 200; lưu JWT; header hiển thị tên + menu user; JWT chứa `fullName` | | |
| TC-AUTH-07 | A | Cao | Sai mật khẩu | Đã có tài khoản | 1. Nhập email đúng, mật khẩu sai | pass=`wrong99` | HTTP 401; "Email hoặc mật khẩu không đúng"; không đăng nhập | | |
| TC-AUTH-08 | A | TB | Email chưa đăng ký | - | 1. Đăng nhập với email không tồn tại | email=`none@mail.com` | HTTP 401; thông báo lỗi chung (không tiết lộ email tồn tại hay không) | | |
| TC-AUTH-09 | N | Cao | Đăng nhập Google OAuth | - | 1. Nhấn "Đăng nhập với Google"<br>2. Chọn tài khoản Google<br>3. Cho phép quyền | Tài khoản Google thật | Redirect `/auth/google/callback`; tạo/đăng nhập tài khoản; quay lại web đã đăng nhập | | |
| TC-AUTH-10 | N | TB | Quên mật khẩu — gửi mail | Email đã đăng ký | 1. "Quên mật khẩu"<br>2. Nhập email<br>3. Gửi | email=`a@mail.com` | HTTP 200; sinh reset token lưu DB; gửi email chứa link; UI báo "Đã gửi email" | | |
| TC-AUTH-11 | A | TB | Quên mật khẩu — email lạ | - | 1. Nhập email không tồn tại | email=`x@mail.com` | Vẫn báo "Đã gửi" (tránh dò email); không gửi mail thật | | |
| TC-AUTH-12 | N | Cao | Đặt lại mật khẩu hợp lệ | Có token reset còn hạn | 1. Mở link reset<br>2. Nhập mật khẩu mới + xác nhận<br>3. Submit | newPass=`NewAbc123` | HTTP 200; cập nhật mật khẩu; token bị vô hiệu; đăng nhập được bằng mật khẩu mới | | |
| TC-AUTH-13 | A | TB | Token reset hết hạn/sai | Token không hợp lệ | 1. Mở link reset với token sai | token=`fake` | HTTP 400; "Token không hợp lệ hoặc đã hết hạn" | | |
| TC-AUTH-14 | N | TB | Đăng xuất | Đang đăng nhập | 1. Mở menu user<br>2. Nhấn "Đăng xuất" | - | Xóa JWT khỏi store/cookie; về trạng thái khách; Zustand auth store reset | | |
| TC-AUTH-15 | N | TB | Giữ phiên sau reload | Đang đăng nhập | 1. F5 / mở lại trang | - | Vẫn đăng nhập (đọc lại token); không bị văng về trang login | | |

## 2. Hồ sơ người dùng (Profile)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-PROF-01 | N | TB | Xem hồ sơ | Đang đăng nhập | 1. Vào trang Tài khoản | - | `GET /users/me` 200; hiển thị tên, email, thông tin | | |
| TC-PROF-02 | N | TB | Cập nhật hồ sơ | Đang đăng nhập | 1. Sửa tên/SĐT/địa chỉ<br>2. Lưu | name=`A Updated` | `PATCH /users/me` 200; dữ liệu được lưu, hiển thị lại đúng | | |
| TC-PROF-03 | N | Cao | Đổi mật khẩu | Đang đăng nhập | 1. Nhập mật khẩu cũ + mới<br>2. Lưu | old=`Abc12345`, new=`Xyz98765` | `PATCH /users/me/password` 200; đăng nhập lại được bằng mật khẩu mới | | |
| TC-PROF-04 | A | TB | Đổi mật khẩu — sai mật khẩu cũ | Đang đăng nhập | 1. Nhập sai mật khẩu cũ | old=`wrong` | HTTP 400/401; "Mật khẩu hiện tại không đúng"; không đổi | | |

## 3. Sản phẩm & Danh mục (Products / Categories)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-PROD-01 | N | Cao | Danh sách sản phẩm | DB có sản phẩm | 1. Mở trang Shop | - | `GET /products` 200; lưới sản phẩm có ảnh (Cloudinary), tên, giá | | |
| TC-PROD-02 | N | Cao | Chi tiết sản phẩm | - | 1. Nhấn 1 sản phẩm | id hợp lệ | `GET /products/:id` 200; trang chi tiết: ảnh, mô tả, giá, tồn kho, nút thêm giỏ | | |
| TC-PROD-03 | A | TB | Sản phẩm không tồn tại | - | 1. Truy cập URL `/product/<id sai>` | id=`999999` | HTTP 404; trang "Không tìm thấy sản phẩm" | | |
| TC-PROD-04 | N | Cao | Lọc theo danh mục | - | 1. Chọn danh mục trên nav | category=`Laptop` | Chỉ hiển thị sản phẩm đúng danh mục; URL phản ánh danh mục | | |
| TC-PROD-05 | N | TB | "All Products" | - | 1. Chọn "All Products" trên nav | - | Hiển thị toàn bộ sản phẩm, không lọc danh mục | | |
| TC-PROD-06 | N | Cao | Tìm kiếm khớp từ | - | 1. Nhập từ khóa<br>2. Enter | keyword=`RTX` | Trả về sản phẩm chứa từ "RTX" (word-boundary), có khớp theo tên danh mục | | |
| TC-PROD-07 | B | Cao | Không khớp giữa từ | - | 1. Tìm từ ngắn nằm giữa từ khác | keyword=`cat` | KHÔNG trả về "graphics"/"category"... (chống false-positive giữa từ) | | |
| TC-PROD-08 | A | TB | Tìm kiếm rỗng | - | 1. Nhập từ không tồn tại | keyword=`zzzqqq` | Hiển thị "Không tìm thấy sản phẩm" | | |
| TC-PROD-09 | B | TB | Phân trang giữ bộ lọc | Sản phẩm > 1 trang | 1. Lọc danh mục/tìm kiếm<br>2. Sang trang 2 | page=2 | Giữ nguyên `search`/`category` params khi đổi trang | | |
| TC-PROD-10 | N | Thấp | Sắp xếp/giá hiển thị | - | 1. Kiểm tra định dạng giá | - | Giá hiển thị đúng định dạng tiền tệ, không sai số | | |

## 4. Giỏ hàng (Cart)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-CART-01 | N | Cao | Thêm vào giỏ | Đăng nhập | 1. Mở sản phẩm<br>2. "Thêm vào giỏ" | qty=1 | `POST /cart/items` 200; item vào giỏ; badge số lượng +1 | | |
| TC-CART-02 | N | TB | Thêm trùng sản phẩm | Giỏ đã có sản phẩm X | 1. Thêm lại sản phẩm X | qty=1 | Cộng dồn số lượng (ràng buộc `@@unique[cartId,productId]`), không tạo dòng mới | | |
| TC-CART-03 | N | TB | Tăng/giảm số lượng | Giỏ có item | 1. Mở giỏ<br>2. Nhấn +/- | - | `PATCH /cart/items/:id`; số lượng & tổng tiền cập nhật | | |
| TC-CART-04 | B | Cao | Số lượng = 0 | Giỏ có item | 1. Giảm số lượng về 0 | qty=0 | Xóa item hoặc chặn; KHÔNG cho số lượng ≤ 0 (backend chặn qty âm) | | |
| TC-CART-05 | A | TB | Số lượng âm (qua API) | Giỏ có item | 1. Gọi PATCH với qty=-5 | qty=`-5` | HTTP 400; từ chối; giỏ không đổi | | |
| TC-CART-06 | N | TB | Xóa 1 item | Giỏ có item | 1. Nhấn xóa item | - | `DELETE /cart/items/:id` 200; item biến mất; tổng cập nhật | | |
| TC-CART-07 | N | TB | Xóa toàn bộ giỏ | Giỏ có item | 1. "Xóa tất cả" | - | `DELETE /cart` 200; giỏ trống; badge = 0 | | |
| TC-CART-08 | A | TB | Xem giỏ khi chưa login | Chưa đăng nhập | 1. Mở giỏ hàng | - | Yêu cầu đăng nhập / giỏ local rỗng (tùy thiết kế), không lỗi 500 | | |

## 5. Đặt hàng & Thanh toán (Orders / Payments)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-ORD-01 | N | Cao | Tạo đơn hàng | Giỏ có hàng, đã login | 1. Vào Checkout<br>2. Nhập địa chỉ giao<br>3. "Đặt hàng" | địa chỉ hợp lệ | `POST /orders` 201; đơn được tạo (status mặc định); chuyển trang order-success | | |
| TC-ORD-02 | A | Cao | Đặt hàng giỏ trống | Giỏ rỗng | 1. Vào Checkout | - | Chặn đặt hàng; thông báo "Giỏ hàng trống" | | |
| TC-ORD-03 | A | TB | Thiếu địa chỉ giao | Giỏ có hàng | 1. Để trống địa chỉ<br>2. Đặt hàng | (rỗng) | Lỗi validation; không tạo đơn | | |
| TC-ORD-04 | N | TB | Xem lịch sử đơn | Đã có đơn | 1. "Đơn hàng của tôi" | - | `GET /orders` 200; danh sách đơn kèm trạng thái, tổng tiền | | |
| TC-ORD-05 | N | TB | Chi tiết đơn | Đã có đơn | 1. Mở 1 đơn | id hợp lệ | `GET /orders/:id` 200; danh sách item, địa chỉ, trạng thái | | |
| TC-ORD-06 | A | TB | Xem đơn người khác | Đăng nhập user B | 1. Gọi `/orders/:id` của user A | id của A | HTTP 403/404; không xem được đơn người khác | | |
| TC-ORD-07 | N | TB | Hủy đơn chưa giao | Đơn ở trạng thái cho phép hủy | 1. Mở đơn<br>2. "Hủy đơn" | - | `POST /orders/:id/cancel` 200; status → "Đã hủy" | | |
| TC-ORD-08 | A | TB | Hủy đơn đã giao | Đơn đã hoàn tất | 1. Thử hủy | - | Chặn; thông báo không thể hủy đơn đã giao | | |
| TC-PAY-01 | N | Cao | Khởi tạo thanh toán MoMo | Đã tạo đơn | 1. Chọn MoMo<br>2. Khởi tạo | - | `POST /payments/initiate` trả URL/QR MoMo | | |
| TC-PAY-02 | N | Cao | Nhận IPN MoMo thành công | Đã initiate | 1. MoMo gọi `/payments/momo/ipn` (giả lập) | payload hợp lệ + chữ ký đúng | Map đúng orderId; cập nhật trạng thái đơn = "Đã thanh toán" | | |
| TC-PAY-03 | A | Cao | IPN chữ ký sai | - | 1. Gửi IPN với chữ ký sai | signature sai | Từ chối; không cập nhật đơn (chống giả mạo) | | |
| TC-PAY-04 | N | TB | Kiểm tra trạng thái thanh toán | Đã initiate | 1. `GET /payments/status/:orderId` | - | Trả về đúng trạng thái hiện tại của giao dịch | | |

## 6. Mã giảm giá (Coupons)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-COUP-01 | N | Cao | Áp mã hợp lệ | Coupon `SALE10` còn hạn | 1. Nhập mã ở checkout<br>2. "Áp dụng" | code=`SALE10` | `POST /coupons/validate` 200; giảm đúng %/số tiền; tổng cập nhật | | |
| TC-COUP-02 | A | TB | Mã không tồn tại | - | 1. Nhập mã sai | code=`FAKE` | HTTP 400; "Mã không hợp lệ"; không giảm | | |
| TC-COUP-03 | A | TB | Mã hết hạn | Coupon đã hết hạn | 1. Nhập mã hết hạn | code=`OLD2020` | "Mã đã hết hạn"; không áp dụng | | |
| TC-COUP-04 | B | TB | Đơn dưới mức tối thiểu | Coupon có min order | 1. Áp mã khi tổng < ngưỡng | - | Báo điều kiện chưa đạt; không giảm | | |
| TC-COUP-05 | A | Thấp | Gỡ mã đã áp | Đã áp mã | 1. Xóa mã | - | Hoàn lại tổng tiền gốc | | |

## 7. Yêu thích & Đánh giá (Wishlist / Reviews)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-WISH-01 | N | TB | Thêm vào wishlist | Đăng nhập | 1. Nhấn icon ♥ trên sản phẩm | - | `POST /wishlist` 200; tim chuyển trạng thái active; lưu qua Zustand | | |
| TC-WISH-02 | N | TB | Bỏ wishlist | Có sản phẩm yêu thích | 1. Bỏ tim / xóa | - | `DELETE /wishlist/:productId` 200; loại khỏi danh sách | | |
| TC-WISH-03 | N | Thấp | Xem danh sách yêu thích | Có item wishlist | 1. Mở trang Wishlist | - | `GET /wishlist` 200; hiển thị các sản phẩm đã thích | | |
| TC-WISH-04 | A | Thấp | Wishlist khi chưa login | Chưa login | 1. Nhấn ♥ | - | Yêu cầu đăng nhập; không lỗi 500 | | |
| TC-REV-01 | N | TB | Gửi đánh giá | Đăng nhập | 1. Mở sản phẩm<br>2. Chọn số sao + nội dung<br>3. Gửi | rating=5, text=`Sản phẩm tốt` | `POST /reviews` 200/201; review hiển thị; rating trung bình cập nhật | | |
| TC-REV-02 | B | TB | Rating ngoài 1–5 | Đăng nhập | 1. Gửi review rating=0 hoặc 6 | rating=`6` | HTTP 400; chặn rating ngoài khoảng 1–5 | | |
| TC-REV-03 | N | TB | Xem review sản phẩm | Sản phẩm có review | 1. Mở sản phẩm | - | `GET /reviews/product/:id` 200; danh sách review | | |
| TC-REV-04 | N | TB | Xóa review của mình | Là chủ review | 1. Nhấn xóa review | - | `DELETE /reviews/:id` 200; review biến mất | | |
| TC-REV-05 | A | TB | Xóa review người khác | User B | 1. Thử xóa review của A | - | HTTP 403; không cho xóa | | |

## 8. Trợ lý AI & PC Builder

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-AI-01 | N | TB | Chat tư vấn AI | - | 1. Mở chatbox<br>2. Gửi câu hỏi | `Tư vấn PC gaming 20 triệu` | `POST /ai/chat` 200; AI trả lời gợi ý cấu hình/sản phẩm phù hợp | | |
| TC-AI-02 | A | Thấp | Gửi tin nhắn rỗng | - | 1. Gửi nội dung trống | (rỗng) | Chặn gửi / báo lỗi; không gọi API thừa | | |
| TC-PCB-01 | N | Cao | Dựng cấu hình PC | DB có linh kiện | 1. Mở Custom Lab<br>2. Chọn CPU, GPU, RAM, Mainboard... | - | Lấy linh kiện THẬT từ DB (không mock); tính tổng giá chính xác | | |
| TC-PCB-02 | N | TB | Đồng bộ state builder | Đang dựng PC | 1. Chọn linh kiện ở component A<br>2. Quan sát component B | - | `builderStore` (Zustand) đồng bộ tức thì giữa các component | | |
| TC-PCB-03 | N | TB | Thêm cấu hình vào giỏ | Đã chọn đủ linh kiện | 1. Nhấn "Thêm vào giỏ" | - | Các linh kiện được thêm vào giỏ hàng | | |
| TC-PCB-04 | B | Thấp | Thiếu linh kiện bắt buộc | Đang dựng PC | 1. Bỏ trống CPU<br>2. Thử hoàn tất | - | Cảnh báo thiếu linh kiện bắt buộc | | |

## 9. Quản trị — Sản phẩm (Admin Products)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-ADM-01 | N | Cao | Vào dashboard admin | Tài khoản role=ADMIN | 1. Đăng nhập admin<br>2. Vào `/admin` | admin acc | Vào được; `GET /admin/stats` 200; hiển thị thống kê (đồng bộ token cookie cho Server Component) | | |
| TC-ADM-02 | A | Cao | User thường vào admin | role=USER | 1. Truy cập `/admin` | user acc | HTTP 403 / redirect; không xem được trang quản trị | | |
| TC-ADM-03 | A | Cao | Truy cập admin API không token | - | 1. Gọi `/admin/products` không JWT | - | HTTP 401 Unauthorized | | |
| TC-ADM-04 | N | Cao | Thêm sản phẩm | Là admin | 1. Quản lý SP → "Thêm"<br>2. Nhập tên, giá, costPrice, mô tả, danh mục<br>3. Upload ảnh<br>4. Lưu | sản phẩm hợp lệ | `POST /admin/products` 201; ảnh lên Cloudinary; SP hiển thị ở Shop | | |
| TC-ADM-05 | A | TB | Thêm SP thiếu trường | Là admin | 1. Bỏ trống tên/giá<br>2. Lưu | (thiếu) | HTTP 400 validation; không tạo | | |
| TC-ADM-06 | B | TB | Giá âm | Là admin | 1. Nhập giá = -100 | price=`-100` | Chặn; báo lỗi giá không hợp lệ | | |
| TC-ADM-07 | N | TB | Sửa sản phẩm | Có sản phẩm | 1. Mở SP → chỉnh giá/mô tả<br>2. Lưu | - | `PATCH /admin/products/:id` 200; dữ liệu cập nhật | | |
| TC-ADM-08 | N | TB | Xóa sản phẩm | Có sản phẩm | 1. Nhấn xóa<br>2. Xác nhận | - | `DELETE /admin/products/:id` 200; SP biến mất khỏi Shop | | |
| TC-ADM-09 | N | TB | Hiển thị biên lợi nhuận | SP có costPrice & price | 1. Xem chi tiết SP trong admin | - | Hiển thị margin = price − costPrice đúng | | |
| TC-ADM-10 | N | Thấp | Upload ảnh sai định dạng | Là admin | 1. Upload file .txt làm ảnh | file.txt | Chặn; báo lỗi định dạng không hỗ trợ | | |

## 10. Quản trị — Đơn hàng & Người dùng

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-ADM-11 | N | TB | Danh sách đơn hàng | Là admin | 1. Vào quản lý đơn | - | `GET /admin/orders` 200; danh sách tất cả đơn | | |
| TC-ADM-12 | N | Cao | Cập nhật trạng thái đơn | Có đơn | 1. Chọn đơn → đổi trạng thái | status=`Shipping` | `PATCH /admin/orders/:id/status` 200; trạng thái cập nhật, user thấy thay đổi | | |
| TC-ADM-13 | N | TB | Xuất Excel đơn hàng | Có đơn | 1. Nhấn "Export" | - | `GET /admin/orders/export`; tải file .xlsx chứa đơn | | |
| TC-ADM-14 | N | TB | Xuất Excel sản phẩm | Có SP | 1. Nhấn "Export" SP | - | `GET /admin/products/export`; tải file .xlsx | | |
| TC-ADM-15 | N | TB | Danh sách người dùng | Là admin | 1. Vào quản lý user | - | `GET /admin/users` 200; danh sách user kèm role | | |

## 11. Quản trị — Hero Video & Import Excel

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-ADM-16 | N | Cao | Đổi video nền trang chủ | Là admin | 1. Vào Hero Video Manager<br>2. Upload video<br>3. Lưu | file .mp4 | `POST /admin/upload-video`; video lên Cloudinary; trang chủ dùng video mới làm nền | | |
| TC-ADM-17 | A | TB | Upload video quá lớn/sai định dạng | Là admin | 1. Upload file ảnh thay vì video | file.jpg | Chặn; báo lỗi định dạng/kích thước | | |
| TC-ADM-18 | N | TB | Tải template import | Là admin | 1. Nhấn "Tải template" | - | `GET /admin/products/template`; tải file Excel mẫu (có cột costPrice, description) | | |
| TC-ADM-19 | N | Cao | Import sản phẩm (admin) | File Excel hợp lệ | 1. Điền template<br>2. Import | file .xlsx | `POST /admin/products/import`; tạo SP hàng loạt; báo số dòng thành công | | |
| TC-ADM-20 | A | TB | Import file sai cấu trúc | Là admin | 1. Import file thiếu cột | file lỗi | Báo lỗi rõ ràng; không tạo dữ liệu rác | | |
| TC-ADM-21 | N | Cao | STAFF import tạo draft | Tài khoản role=STAFF | 1. Staff import sản phẩm | file hợp lệ | Sản phẩm ở trạng thái **draft** chờ admin duyệt (không public ngay) | | |
| TC-ADM-22 | N | TB | Admin duyệt draft của staff | Có SP draft | 1. Admin mở draft → duyệt | - | SP chuyển sang public, hiển thị ở Shop | | |
| TC-ADM-23 | A | TB | STAFF truy cập chức năng admin-only | role=STAFF | 1. Staff thử xóa SP / xem user | - | Bị chặn theo phân quyền (chỉ admin được) | | |

## 12. Bảo mật & Phi chức năng (Non-functional)

| Mã | Loại | Ưu tiên | Tiêu đề | Tiền điều kiện | Các bước thực hiện | Dữ liệu test | Kết quả mong đợi | KQ thực tế | Trạng thái |
|----|------|---------|---------|----------------|--------------------|--------------|------------------|------------|------------|
| TC-SEC-01 | A | Cao | Gọi API cần auth khi chưa login | - | 1. `GET /users/me` không JWT | - | HTTP 401 Unauthorized | | |
| TC-SEC-02 | A | Cao | Gửi field thừa (whitelist) | - | 1. POST body kèm field lạ | `{...,"hack":1}` | HTTP 400 (`forbidNonWhitelisted`); request bị từ chối | | |
| TC-SEC-03 | A | Cao | Sai kiểu dữ liệu DTO | - | 1. Gửi `price` dạng chuỗi | price=`"abc"` | HTTP 400 kèm message validation | | |
| TC-SEC-04 | A | Cao | JWT giả mạo/sửa | - | 1. Sửa payload token rồi gọi API | token sửa | HTTP 401; chữ ký không khớp | | |
| TC-SEC-05 | A | TB | JWT secret bắt buộc | Khởi động server | 1. Chạy server thiếu `JWT_SECRET` | - | Server fail-fast, không chạy với secret mặc định (hardcode đã loại bỏ) | | |
| TC-SEC-06 | A | TB | Truy cập thẳng route admin (frontend) | role=USER | 1. Gõ URL `/admin/...` | - | Bị chặn/redirect, không lộ giao diện quản trị | | |
| TC-SEC-07 | N | TB | Responsive đa thiết bị | - | 1. Mở web ở mobile/tablet/desktop | 360px / 768px / 1440px | Layout không vỡ, menu/nav hoạt động đúng | | |
| TC-SEC-08 | N | Thấp | Thời gian tải trang chủ | - | 1. Đo thời gian load trang chủ | - | Tải hợp lý (< vài giây); ảnh/video không chặn render | | |
| TC-SEC-09 | N | Thấp | CORS / API base URL | - | 1. Frontend gọi backend | - | Gọi đúng `NEXT_PUBLIC_API_URL`, không bị CORS chặn | | |
| TC-SEC-10 | N | TB | Thông báo lỗi thân thiện | - | 1. Gây lỗi bất kỳ (mất mạng API) | - | Hiển thị toast/thông báo lỗi rõ ràng, không lộ stack trace | | |

---

### Thống kê
- **Tổng số test case:** ~90
- **Phân loại:** Normal (N) · Abnormal (A) · Boundary (B)
- **Phạm vi:** Authentication, Profile, Products, Cart, Orders, Payments (MoMo), Coupons, Wishlist, Reviews, AI/PC Builder, Admin (CRUD/Import/Hero Video/Phân quyền STAFF-ADMIN), Bảo mật & Phi chức năng.

> **Ghi chú khi kiểm thử:** Điền cột *Kết quả thực tế* (mô tả ngắn những gì quan sát được) và *Trạng thái* (Pass/Fail). Với case Fail, ghi mã lỗi/screenshot vào phần ghi chú riêng để truy vết.
7