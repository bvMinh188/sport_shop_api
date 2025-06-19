const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC7: Cập nhật số lượng vượt quá tồn kho', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Cập nhật số lượng vượt quá tồn kho', async function () {
    try {
      // Login với tài khoản user
      await login(driver, 'user@gmail.com', '123');
      
      // Vào trang giỏ hàng (giả định sản phẩm đã được thêm từ TC2)
      await driver.get('http://localhost:5000/cart/show');

      // Đợi cho bảng giỏ hàng hiển thị
      await driver.wait(until.elementLocated(By.css('table')), 5000);

      // Click nút Sửa để hiện input số lượng
      const editBtn = await driver.findElement(By.css('.edit-btn'));
      await editBtn.click();
      await new Promise(resolve => setTimeout(resolve, 300)); // Đợi UI cập nhật

      // Đợi cho input số lượng hiện ra và nhập số lượng lớn
      const qtyInput = await driver.wait(until.elementLocated(By.css('.quantity-input')), 5000);
      await qtyInput.clear();
      await qtyInput.sendKeys('999');

      // Click nút Cập nhật
      const updateBtn = await driver.findElement(By.css('.update-btn'));
      await updateBtn.click();

      // Đợi và kiểm tra thông báo lỗi - sử dụng message chính xác từ API
      await driver.wait(async () => {
        const messageElem = await driver.findElement(By.css('.message'));
        const messageText = await messageElem.getText();
        console.log('Message hiển thị:', messageText);
        return messageText.includes('Số lượng sản phẩm không đủ trong kho');
      }, 5000, 'Không thấy thông báo lỗi về số lượng không đủ trong kho');

      // Dừng 3 giây để quan sát thông báo
      console.log('Dừng 3 giây để xem thông báo...');
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (e) {
      console.error('Lỗi khi chạy test TC7:', e);
      throw e;
    }
  });
}); 