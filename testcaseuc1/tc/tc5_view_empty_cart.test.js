const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC5: Xem giỏ hàng trống', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Xem giỏ hàng trống', async function () {
    await login(driver, 'user1@gmail.com', '123');
    await driver.get('http://localhost:5000/cart/show');
    await driver.wait(until.elementLocated(By.css('.order-info')), 5000);

    await driver.wait(async () => {
      const orderInfo = await driver.findElement(By.css('.order-info')).getText();
      return orderInfo.includes('Bạn vẫn chưa chọn sản phẩm nào để mua');
    }, 10000, 'Không thấy thông báo giỏ hàng trống');

    const orderInfo = await driver.findElement(By.css('.order-info')).getText();
    expect(orderInfo).to.include('Bạn vẫn chưa chọn sản phẩm nào để mua');

    // Chờ 5 giây để quan sát giao diện
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
}); 