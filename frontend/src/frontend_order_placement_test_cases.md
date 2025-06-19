# Test Cases Frontend cho Use Case Đặt Hàng

| Test case | Mô tả | Kỳ vọng | Status |
|-----------|-------|---------|--------|
| TC-FE-1.1 | Thêm sản phẩm vào giỏ hàng khi chưa đăng nhập | Khi nhấn "Thêm vào giỏ hàng" trên trang chi tiết sản phẩm, hệ thống chuyển hướng đến trang đăng nhập và hiển thị thông báo yêu cầu đăng nhập |        |
| TC-FE-1.2 | Thêm sản phẩm vào giỏ hàng khi đã đăng nhập | Khi nhấn "Thêm vào giỏ hàng", sản phẩm được thêm vào giỏ hàng, hiển thị thông báo thành công, cập nhật số lượng trên icon giỏ hàng |        |
| TC-FE-1.3 | Thêm sản phẩm hết hàng vào giỏ hàng | Khi nhấn "Thêm vào giỏ hàng" với sản phẩm hết hàng, hiển thị thông báo lỗi "Sản phẩm đã hết hàng" |        |
| TC-FE-1.4 | Thêm nhiều sản phẩm vào giỏ hàng | Thêm nhiều sản phẩm khác nhau, icon giỏ hàng cập nhật đúng số lượng, hiển thị thông báo thành công cho từng sản phẩm |        |
| TC-FE-1.5 | Xem giỏ hàng trống | Truy cập trang giỏ hàng khi chưa có sản phẩm, hiển thị thông báo "Giỏ hàng trống" |        |
| TC-FE-1.6 | Xem giỏ hàng có sản phẩm | Truy cập trang giỏ hàng, hiển thị danh sách sản phẩm, tên, số lượng, đơn giá, tổng tiền |        |
| TC-FE-1.7 | Cập nhật số lượng sản phẩm vượt quá tồn kho | Khi cập nhật số lượng vượt quá tồn kho, hiển thị thông báo lỗi "Số lượng tồn kho không đủ" |        |
| TC-FE-1.8 | Xóa sản phẩm khỏi giỏ hàng | Nhấn nút xóa trên sản phẩm trong giỏ hàng, sản phẩm bị xóa khỏi danh sách, tổng tiền cập nhật lại |        |
| TC-FE-1.9 | Tạo đơn hàng với thông tin đầy đủ | Nhập đầy đủ thông tin giao hàng, nhấn "Thanh toán", hiển thị thông báo thành công, giỏ hàng làm trống |        |
| TC-FE-1.10 | Tạo đơn hàng với thông tin không hợp lệ | Nhập thiếu/thông tin sai định dạng, nhấn "Thanh toán", hiển thị thông báo lỗi cho từng trường không hợp lệ |        | 