const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC4: Thêm nhiều sản phẩm vào giỏ hàng', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Thêm nhiều sản phẩm vào giỏ hàng', async function () {
    await login(driver, 'user@gmail.com', '123');
    
    // Thêm sản phẩm 1
    await driver.get('http://localhost:5000/products/1');
    await driver.findElement(By.css('button#add-to-cart')).click();
    
    // Thêm sản phẩm 2
    await driver.get('http://localhost:5000/products/2');
    await driver.findElement(By.css('button#add-to-cart')).click();
    
    // Kiểm tra số lượng trong giỏ hàng
    const cartCount = await driver.findElement(By.css('.cart-count')).getText();
    expect(Number(cartCount)).to.be.greaterThan(1);
  });
}); 