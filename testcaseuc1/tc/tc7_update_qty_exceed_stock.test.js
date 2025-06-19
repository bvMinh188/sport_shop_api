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
    await login(driver, 'user@gmail.com', '123');
    
    // Thêm sản phẩm vào giỏ hàng
    await driver.get('http://localhost:5000/products/1');
    await driver.findElement(By.css('button#add-to-cart')).click();
    
    // Vào giỏ hàng và cập nhật số lượng
    await driver.get('http://localhost:5000/cart');
    const qtyInput = await driver.findElement(By.css('input[name="quantity"]'));
    await qtyInput.clear();
    await qtyInput.sendKeys('999'); // Số lượng lớn
    
    await driver.findElement(By.css('button.update-qty')).click();
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(bodyText).to.include('vượt quá tồn kho');
  });
}); 