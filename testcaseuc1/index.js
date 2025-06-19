// File index.js để chạy tất cả 10 test case cho Use Case 1: Đặt hàng

console.log('Bắt đầu chạy 10 test case cho Use Case 1: Đặt hàng...');

// Import tất cả test case
require('./tc/tc1_add_to_cart_not_logged_in.test');
require('./tc/tc2_add_to_cart_logged_in.test');
require('./tc/tc3_add_out_of_stock.test');
require('./tc/tc4_add_multiple_products.test');
require('./tc/tc5_view_empty_cart.test');
require('./tc/tc6_view_cart_with_products.test');
require('./tc/tc7_update_qty_exceed_stock.test');
require('./tc/tc8_remove_product_from_cart.test');
require('./tc/tc9_checkout_valid_info.test');
require('./tc/tc10_checkout_invalid_info.test');

console.log('Đã import tất cả 10 test case. Chạy lệnh: npm test'); 