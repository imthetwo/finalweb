# Quy tắc dự án — Pecify PC Store

## 1. QUY TẮC CỨNG VỀ CẤU TRÚC CODE

- `page.tsx` không vượt quá ~40 dòng JSX. Nếu vượt → bắt buộc tách component con.
- Component chỉ thêm `"use client"` khi có `useState`/`useEffect`/`onClick`/`onChange`. Không thêm thừa.
- Không viết `fetch()`/`axios` trực tiếp trong `page.tsx` hoặc trong component UI — luôn qua file trong `data/`.
- Mỗi file chỉ làm 1 việc: UI thuần / logic state / gọi API / định nghĩa type. Không trộn.
- Bên backend (NestJS): Controller chỉ gọi Service, không viết business logic trong Controller. Service không trả raw Prisma error ra ngoài — luôn wrap exception rõ nghĩa.

## 2. LUÔN XUẤT PHÁT TỪ DỮ LIỆU THẬT — KHÔNG BỊA

- TUYỆT ĐỐI không tự tạo mock data, hardcode mảng giả, hoặc đoán field không có trong schema để "code cho chạy được".
- Trước khi viết bất kỳ component/hook/API call nào, PHẢI đọc trước:
  1. `schema.prisma` — để biết đúng tên field, type, quan hệ.
  2. DTO/Controller tương ứng ở backend — để biết response thật trả về gì.
  3. Nếu chưa có API endpoint cho việc này → BÁO TRƯỚC, không tự bịa response giả định.
- Nếu field/endpoint cần dùng chưa tồn tại → liệt kê rõ "cần thêm field X vào model Y" hoặc "cần thêm endpoint Z", không tự thêm ngầm.
- Type ở frontend (`types.ts`) phải khớp 1:1 với response thật của NestJS, không tự suy diễn thêm field không có.
- Nếu không chắc response trả về gì → đọc code Controller/Service backend trước khi viết frontend, không đoán.

## 3. FRONTEND — BACKEND PHẢI LIÊN KẾT CHẶT

- Mỗi khi tạo/sửa API endpoint ở NestJS → kiểm tra ngay có frontend nào đang gọi/cần gọi endpoint đó không, và cập nhật đồng bộ.
- Mỗi khi tạo/sửa component frontend cần data → kiểm tra ngay backend đã có endpoint tương ứng chưa. Nếu chưa có, tạo cả 2 phía trong cùng 1 lần (không chỉ làm 1 bên rồi để bên kia trống).
- Đặt tên hàm `data/get<Ten>.ts` ở frontend phải map rõ ràng tới đúng route ở NestJS Controller (path, method, params) — viết comment trên hàm ghi rõ endpoint nó gọi.
- DTO validate ở backend (`class-validator`) phải khớp với field mà frontend form đang gửi lên — không để lệch.

## 4. SAU MỖI LẦN CODE — LUÔN TRẢ BÁO CÁO ĐẦY ĐỦ

Sau khi hoàn thành bất kỳ task code nào, PHẢI viết báo cáo theo format:

```
## Báo cáo
- **Đã làm:** [liệt kê file đã tạo/sửa]
- **Backend thay đổi:** [endpoint mới, DTO mới, schema mới nếu có]
- **Frontend thay đổi:** [component mới, hook mới, type mới nếu có]
- **Chưa làm / cần làm tiếp:** [nếu có]
- **Cần người dùng làm thêm:** [migration, env var, test manual nếu có]
```

Không bỏ qua phần báo cáo này dù task nhỏ hay lớn.

## 5. KHI KHÔNG CHẮC — DỪNG LẠI HỎI, KHÔNG TỰ ĐOÁN

Nếu thiếu thông tin (schema chưa rõ, endpoint chưa có, requirement mơ hồ) → dừng lại, hỏi rõ trước khi viết code. Không tự giả định rồi code đại cho xong.
