# Test Cases cho Use Case 1: Đặt hàng

Đây là bộ test cases tự động cho Use Case 1 - Đặt hàng, sử dụng Selenium WebDriver và Mocha.

## Yêu cầu hệ thống

- Node.js (phiên bản 14 trở lên)
- Chrome browser
- Ứng dụng web đang chạy trên `http://localhost:5000`

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Đảm bảo ứng dụng web đang chạy:
```bash
# Trong thư mục backend
npm start

# Trong thư mục frontend (nếu cần)
npm start
```

## Chạy test

### Chạy tất cả test cases:
```bash
npm test
```

### Chạy một test case cụ thể:
```bash
npx mocha tc/tc1_add_to_cart_not_logged_in.test.js
```

### Chạy test với chế độ watch (tự động chạy lại khi có thay đổi):
```bash
npm run test:watch
```

## Danh sách test cases

1. **TC1**: Thêm sản phẩm vào giỏ hàng khi chưa đăng nhập
2. **TC2**: Thêm sản phẩm vào giỏ hàng khi đã đăng nhập
3. **TC3**: Thêm sản phẩm hết hàng vào giỏ hàng
4. **TC4**: Thêm nhiều sản phẩm vào giỏ hàng
5. **TC5**: Xem giỏ hàng trống
6. **TC6**: Xem giỏ hàng có sản phẩm
7. **TC7**: Cập nhật số lượng vượt quá tồn kho
8. **TC8**: Xóa sản phẩm khỏi giỏ hàng
9. **TC9**: Thanh toán với thông tin hợp lệ
10. **TC10**: Thanh toán với thông tin không hợp lệ

## Lưu ý

- Đảm bảo có tài khoản test với email `user@gmail.com` và mật khẩu `123456`
- Đảm bảo có sản phẩm với ID 1 và 2 trong database
- Test cases sẽ mở Chrome browser tự động
- Mỗi test case có timeout 20 giây 