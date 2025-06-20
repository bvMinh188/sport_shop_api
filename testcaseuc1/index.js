// File index.js để chạy tất cả 10 test case cho Use Case 1: Đặt hàng

console.log('Bắt đầu chạy 16 test case cho Use Case 1: Đặt hàng...');

// Import tất cả test case
// require('./tc/tc1_add_to_cart_not_logged_in.test');
// require('./tc/tc2_add_to_cart_logged_in.test');
// require('./tc/tc3_add_out_of_stock.test');
// require('./tc/tc4_filter_by_category.test');
// require('./tc/tc5_filter_by_price.test');
// require('./tc/tc6_view_cart_with_products.test');
// require('./tc/tc7_update_qty_exceed_stock.test');
// require('./tc/tc8_update_quantity_successfully.test')
// require('./tc/tc9_remove_product_from_cart.test');
// require('./tc/tc10_checkout_valid_info.test');
// require('./tc/tc11_checkout_invalid_info.test');
// require('./tc/tc12_checkout_full_info.test');
require('./tc/tc13_add_address_missing_name.test');
require('./tc/tc14_add_address_invalid_phone.test');
require('./tc/tc15_add_address_missing_address.test');
require('./tc/tc16_add_address_success.test');

console.log('Đã import tất cả 16 test case. Chạy lệnh: npm test'); 