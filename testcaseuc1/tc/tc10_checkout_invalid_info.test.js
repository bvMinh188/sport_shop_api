const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC10: Thanh toán với thông tin không hợp lệ', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Thanh toán với thông tin không hợp lệ', async function () {
    await login(driver, 'user@gmail.com', '123');
    
    // Thêm sản phẩm vào giỏ hàng
    await driver.get('http://localhost:5000/products/1');
    await driver.findElement(By.css('button#add-to-cart')).click();
    
    // Vào trang thanh toán
    await driver.get('http://localhost:5000/checkout');
    
    // Điền thông tin không hợp lệ
    await driver.findElement(By.name('fullName')).sendKeys(''); // Tên trống
    await driver.findElement(By.name('phone')).sendKeys('123'); // SĐT không hợp lệ
    await driver.findElement(By.name('address')).sendKeys(''); // Địa chỉ trống
    
    // Click nút thanh toán
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Kiểm tra thông báo lỗi
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(bodyText).to.include('Vui lòng điền đầy đủ thông tin');
  });
}); 