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
    
    // Thêm sản phẩm vào giỏ hàng
    await driver.get('http://localhost:5000/products/1');
    await driver.findElement(By.css('button#add-to-cart')).click();
    
    // Vào giỏ hàng và xóa sản phẩm
    await driver.get('http://localhost:5000/cart');
    await driver.findElement(By.css('button.remove-item')).click();
    
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(bodyText).to.include('Giỏ hàng trống');
  });
}); 