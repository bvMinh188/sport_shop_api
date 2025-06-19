const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC8: Xóa sản phẩm khỏi giỏ hàng', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Xóa sản phẩm khỏi giỏ hàng', async function () {
    await login(driver, 'user@gmail.com', '123');
    
    // Vào giỏ hàng (giả định đã có sản phẩm từ test case 2)
    await driver.get('http://localhost:5000/cart/show');

    // Đợi cho nút xóa xuất hiện và click
    const deleteBtn = await driver.wait(until.elementLocated(By.css('.delete-btn')), 5000);
    await deleteBtn.click();

    // Đợi reload lại và kiểm tra thông báo giỏ hàng trống
    await driver.wait(until.elementLocated(By.css('.empty-cart')), 5000);
    const emptyText = await driver.findElement(By.css('.empty-cart h5')).getText();
    expect(emptyText).to.include('Bạn vẫn chưa chọn sản phẩm nào để mua');
  });
}); 