const path = require("path");
const express = require("express");
const morgan = require("morgan");
const methodOverride = require('method-override');
const handlebars = require("express-handlebars");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');

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

// Template engine
app.engine("hbs", handlebars.engine({
  extname: '.hbs',
  helpers: {
    eq: function (a, b) {
      return a === b;
    },
    sum: (a, b) => a + b,
    formatPrince: (a) => {
      if (a == null) {  // Kiểm tra giá trị null hoặc undefined
        return "Không có giá";  
      }
      return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND"; // Định dạng giá với dấu phẩy
    },
    totalQuantity: function(sizes) {
      return sizes.reduce((total, size) => total + size.quantity, 0);
    },
    formatDate: function(datetime){
      return new Date(datetime).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh', // Giờ Việt Nam
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
      });
    },
    json: function (context) {
      return JSON.stringify(context);  // Chuyển đối tượng thành chuỗi JSON
    }
  }
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "views"));

// Khởi tạo route
route(app);

app.listen(PORT, () => console.log(`App listening at http://localhost:${PORT}`));
