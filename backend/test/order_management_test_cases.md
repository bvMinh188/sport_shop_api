# Test Cases cho Use Case Quản Lý Đơn Hàng

### TC-2.1: Tạo đơn hàng mới
- **Precondition**: Không có đơn hàng nào
- **Steps**:
  1. Tạo đơn hàng mới
- **Expected Result**:
  - Trạng thái đơn hàng là "Chờ xác nhận"
  - Admin nhận được thông báo

### TC-2.2: Admin xác nhận đơn hàng
- **Precondition**: Đơn hàng ở trạng thái "Chờ xác nhận"
- **Steps**:
  1. Admin kiểm tra thông tin đơn hàng
  2. Xác nhận đơn hàng
- **Expected Result**:
  - Trạng thái đơn hàng chuyển sang "Đang giao hàng"
  - Khách hàng nhận được thông báo

### TC-2.3: Cập nhật trạng thái giao hàng thành công
- **Precondition**: Đơn hàng đang ở trạng thái "Đang giao hàng"
- **Steps**:
  1. Admin cập nhật trạng thái giao hàng
- **Expected Result**:
  - Trạng thái đơn hàng chuyển sang "Đã giao hàng"
  - Khách hàng nhận được thông báo

### TC-2.4: Khách hàng hủy đơn hàng chưa xác nhận
- **Precondition**: Đơn hàng ở trạng thái "Chờ xác nhận"
- **Steps**:
  1. Khách hàng yêu cầu hủy đơn hàng
- **Expected Result**:
  - Đơn hàng được hủy thành công
  - Trạng thái chuyển sang "Đã hủy"
  - Admin nhận được thông báo

### TC-2.5: Khách hàng hủy đơn hàng đã xác nhận
- **Precondition**: Đơn hàng đã được xác nhận
- **Steps**:
  1. Khách hàng yêu cầu hủy đơn hàng
- **Expected Result**:
  - Hiển thị thông báo không thể hủy đơn hàng
  - Trạng thái đơn hàng không thay đổi

### TC-2.6: Admin hủy đơn hàng
- **Precondition**: Đơn hàng ở bất kỳ trạng thái nào
- **Steps**:
  1. Admin hủy đơn hàng
- **Expected Result**:
  - Đơn hàng được hủy thành công
  - Trạng thái chuyển sang "Đã hủy"
  - Khách hàng nhận được thông báo

### TC-2.7: Khách hàng xem danh sách đơn hàng
- **Precondition**: Khách hàng đã đăng nhập
- **Steps**:
  1. Truy cập trang quản lý đơn hàng
- **Expected Result**:
  - Hiển thị danh sách đơn hàng của khách hàng
  - Hiển thị đầy đủ thông tin: mã đơn hàng, ngày đặt, trạng thái, tổng tiền

### TC-2.8: Khách hàng xem chi tiết đơn hàng
- **Precondition**: Có đơn hàng trong danh sách
- **Steps**:
  1. Nhấn vào đơn hàng để xem chi tiết
- **Expected Result**:
  - Hiển thị đầy đủ thông tin chi tiết đơn hàng
  - Hiển thị danh sách sản phẩm trong đơn hàng
  - Hiển thị lịch sử cập nhật trạng thái

### TC-2.9: Admin xem danh sách tất cả đơn hàng
- **Precondition**: Admin đã đăng nhập
- **Steps**:
  1. Truy cập trang quản lý đơn hàng
- **Expected Result**:
  - Hiển thị danh sách tất cả đơn hàng
  - Có thể lọc theo trạng thái, ngày đặt, khách hàng
  - Hiển thị thống kê số lượng đơn hàng theo trạng thái

### TC-2.10: Admin tìm kiếm và lọc đơn hàng
- **Precondition**: Có nhiều đơn hàng trong hệ thống
- **Steps**:
  1. Nhập thông tin tìm kiếm (mã đơn hàng, tên khách hàng)
  2. Chọn bộ lọc (trạng thái, khoảng thời gian)
  3. Nhấn nút tìm kiếm
- **Expected Result**:
  - Hiển thị kết quả tìm kiếm phù hợp
  - Có thể sắp xếp kết quả theo các tiêu chí
  - Hiển thị tổng số kết quả tìm thấy 