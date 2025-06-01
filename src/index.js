const path = require("path");
const express = require("express");
const morgan = require("morgan");
const methodOverride = require('method-override');
const handlebars = require("express-handlebars");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
const { checkLogin } = require('./middleware/auth');

const route = require('./routes');
const db = require('./config/db');

// Kết nối tới cơ sở dữ liệu
db.connect();

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3000;

const session = require('express-session');
const flash = require('connect-flash');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

// Truyền các thông báo flash đến tất cả các view
app.use((req, res, next) => {
    res.locals.message = req.flash();
    next();
});


// Thiết lập thư mục tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser()); 

app.use(methodOverride('_method'));

// HTTP logger
app.use(morgan("combined"));

// Apply authentication middleware globally
app.use(checkLogin);

// Template engine
app.engine("hbs", handlebars.engine({
  extname: '.hbs',
  helpers: {
    // So sánh bằng (==)
    eq: function (a, b) {
      return a === b;
    },
    not: function (a) {
      return !a;
    },
    or: function (a, b) {
      return a || b;
    },
    sum: (a, b) => a + b,
    subtract: (a, b) => a - b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    range: function (start, end) {
      let list = [];
      for (let i = start; i <= end; i++) list.push(i);
      return list;
    },
    // Helper cho phân trang
    times: function(n, block) {
      var accum = '';
      for(var i = 1; i <= n; ++i)
          accum += block.fn(i);
      return accum;
    },
    add: function(a, b) {
      return a + b;
    },
    // Định dạng giá tiền (VD: 1.000.000)
    formatCurrency: (amount) => {
      if (amount == null) return "0";  
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    // Định dạng giá tiền cũ (VD: 1.000.000 VND)
    formatPrince: (a) => {
      if (a == null) return "Không có giá";  
      return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
    },
    // Tính tổng số lượng từ danh sách sizes
    totalQuantity: function(sizes) {
      return sizes.reduce((total, size) => total + size.quantity, 0);
    },
    // Định dạng ngày tháng theo giờ Việt Nam
    formatDate: function(datetime){
      return new Date(datetime).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
      });
    },
    // Chuyển đối tượng thành chuỗi JSON
    json: function (context) {
      return JSON.stringify(context);
    },
    // Kiểm tra nếu giá trị lớn hơn hoặc bằng ngưỡng (>=)
    ifGreaterOrEqual: function (value, threshold, options) {
      return value >= threshold ? options.fn(this) : options.inverse(this);
    },
    findDefaultAddress: (addresses) => {
      if (!addresses || addresses.length === 0) return null;
      return addresses.find(addr => addr.isDefault) || addresses[0];
    },
    // Lấy địa chỉ từ đơn hàng
    getOrderAddress: function(order) {
      if (!order || !order.address) return '';
      return order.address;
    },
    // Lấy class cho trạng thái đơn hàng
    getStatusClass: function(status) {
      switch(status) {
        case 'chờ xác nhận':
          return 'badge-pending';
        case 'đã xác nhận':
          return 'badge-confirmed';
        case 'đang giao hàng':
          return 'badge-shipping';
        case 'đã giao hàng':
          return 'badge-delivered';
        case 'đã hủy':
          return 'badge-cancelled';
        default:
          return 'badge-secondary';
      }
    }
  }
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "views"));

// Khởi tạo route
route(app);

app.listen(PORT, () => console.log(`App listening at http://localhost:${PORT}`));
