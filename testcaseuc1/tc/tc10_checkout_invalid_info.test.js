const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC10: Đặt hàng khi không nhập địa chỉ', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Không cho phép đặt hàng khi không chọn địa chỉ', async function () {
    await login(driver, 'user2@gmail.com', '123');
    await driver.get('http://localhost:5000/cart/show');

    // Đợi vài giây để giỏ hàng load sản phẩm từ API
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click nút đặt hàng khi chưa chọn địa chỉ
    const orderBtn = await driver.findElement(By.css('#orderForm button[type="submit"]'));
    await orderBtn.click();

    // Đợi message lỗi xuất hiện
    await driver.wait(async () => {
      const msg = await driver.findElement(By.css('.message')).getText();
      return msg.includes('Vui lòng chọn địa chỉ giao hàng');
    }, 2000);

    // Dừng lại 3 giây để quan sát thông báo
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
}); 