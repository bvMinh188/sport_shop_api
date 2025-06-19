const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC9: Đặt hàng với giỏ hàng trống', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Không cho phép đặt hàng khi giỏ hàng trống', async function () {
    await login(driver, 'user1@gmail.com', '123');
    await driver.get('http://localhost:5000/cart/show');

    // Đợi cho thông báo giỏ hàng trống xuất hiện
    await driver.wait(until.elementLocated(By.css('.empty-cart')), 5000);

    // Tìm nút đặt hàng (nếu có)
    const orderBtn = await driver.findElements(By.css('#orderForm button[type="submit"]'));
    if (orderBtn.length > 0 && await orderBtn[0].isEnabled()) {
      await orderBtn[0].click();
      // Đợi message lỗi xuất hiện
      await driver.wait(async () => {
        const msg = await driver.findElement(By.css('.message')).getText();
        return msg.includes('Bạn vẫn chưa chọn sản phẩm nào để mua hàng');
      }, 2000);
      // Dừng lại 3 giây để quan sát thông báo
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      // Nếu không có nút đặt hàng, test vẫn pass vì không thể đặt hàng
      expect(true).to.be.true;
    }
  });
}); 