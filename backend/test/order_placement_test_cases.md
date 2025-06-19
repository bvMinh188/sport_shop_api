# Test Cases cho Use Case Đặt Hàng

### TC-1.1: Thêm sản phẩm vào giỏ hàng khi chưa đăng nhập
- **Precondition**: Người dùng chưa đăng nhập
- **Steps**:
  1. Truy cập trang chi tiết sản phẩm
  2. Nhấn nút "Thêm vào giỏ hàng"
- **Expected Result**: 
  - Hệ thống chuyển hướng đến trang đăng nhập
  - Hiển thị thông báo yêu cầu đăng nhập

### TC-1.2: Thêm sản phẩm vào giỏ hàng khi đã đăng nhập
- **Precondition**: Người dùng đã đăng nhập
- **Steps**:
  1. Truy cập trang chi tiết sản phẩm
  2. Nhấn nút "Thêm vào giỏ hàng"
- **Expected Result**:
  - Sản phẩm được thêm vào giỏ hàng
  - Hiển thị thông báo thành công
  - Số lượng sản phẩm trong giỏ hàng được cập nhật

### TC-1.3: Thêm sản phẩm hết hàng vào giỏ hàng
- **Precondition**: Sản phẩm có số lượng tồn kho = 0
- **Steps**:
  1. Truy cập trang chi tiết sản phẩm
  2. Nhấn nút "Thêm vào giỏ hàng"
- **Expected Result**:
  - Hiển thị thông báo sản phẩm hết hàng
  - Không thêm sản phẩm vào giỏ hàng

### TC-1.4: Thêm nhiều sản phẩm cùng lúc vào giỏ hàng
- **Precondition**: Người dùng đã đăng nhập
- **Steps**:
  1. Truy cập trang danh sách sản phẩm
  2. Chọn nhiều sản phẩm
  3. Nhấn nút "Thêm vào giỏ hàng"
- **Expected Result**:
  - Tất cả sản phẩm được thêm vào giỏ hàng
  - Hiển thị thông báo thành công
  - Số lượng sản phẩm trong giỏ hàng được cập nhật chính xác

### TC-1.5: Xem giỏ hàng trống
- **Precondition**: Giỏ hàng trống
- **Steps**:
  1. Truy cập trang giỏ hàng
- **Expected Result**:
  - Hiển thị thông báo giỏ hàng trống
  - Không hiển thị danh sách sản phẩm

### TC-1.6: Xem giỏ hàng có sản phẩm
- **Precondition**: Giỏ hàng có ít nhất 1 sản phẩm
- **Steps**:
  1. Truy cập trang giỏ hàng
- **Expected Result**:
  - Hiển thị danh sách sản phẩm
  - Hiển thị đầy đủ thông tin: tên, số lượng, đơn giá, tổng tiền

### TC-1.7: Cập nhật số lượng sản phẩm vượt quá tồn kho
- **Precondition**: Giỏ hàng có sản phẩm, số lượng tồn kho < số lượng muốn cập nhật
- **Steps**:
  1. Truy cập trang giỏ hàng
  2. Cập nhật số lượng sản phẩm vượt quá tồn kho
- **Expected Result**:
  - Hiển thị thông báo số lượng tồn kho không đủ
  - Số lượng sản phẩm không được cập nhật

### TC-1.8: Tạo đơn hàng với thông tin đầy đủ
- **Precondition**: Giỏ hàng có sản phẩm
- **Steps**:
  1. Truy cập trang thanh toán
  2. Nhập đầy đủ thông tin giao hàng
  3. Chọn phương thức thanh toán
  4. Nhấn nút "Thanh toán"
- **Expected Result**:
  - Đơn hàng được tạo thành công
  - Hiển thị thông báo thành công
  - Giỏ hàng được làm trống

### TC-1.9: Tạo đơn hàng với thông tin không hợp lệ
- **Precondition**: Giỏ hàng có sản phẩm
- **Steps**:
  1. Truy cập trang thanh toán
  2. Nhập thông tin không hợp lệ (số điện thoại sai định dạng, email không hợp lệ)
  3. Nhấn nút "Thanh toán"
- **Expected Result**:
  - Hiển thị thông báo lỗi cho từng trường thông tin không hợp lệ
  - Không tạo đơn hàng

### TC-1.10: Tạo đơn hàng với địa chỉ giao hàng ngoài phạm vi
- **Precondition**: Giỏ hàng có sản phẩm
- **Steps**:
  1. Truy cập trang thanh toán
  2. Nhập địa chỉ giao hàng ngoài phạm vi phục vụ
  3. Nhấn nút "Thanh toán"
- **Expected Result**:
  - Hiển thị thông báo địa chỉ ngoài phạm vi phục vụ
  - Không tạo đơn hàng
  - Yêu cầu nhập lại địa chỉ 