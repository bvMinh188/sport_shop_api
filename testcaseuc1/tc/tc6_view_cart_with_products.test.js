const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC6: Xem giỏ hàng có sản phẩm', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Xem giỏ hàng có sản phẩm', async function () {
    await login(driver, 'user@gmail.com', '123');
    
    // Thêm sản phẩm vào giỏ hàng trước
    await driver.get('http://localhost:5000/products/673705fc8e4584ab5f6e1905');
    await driver.wait(until.elementLocated(By.css('.size-btn:not([disabled])')), 5000);
    const sizeButtons = await driver.findElements(By.css('.size-btn:not([disabled])'));
    expect(sizeButtons.length).to.be.greaterThan(0);
    await sizeButtons[0].click();
    await new Promise(resolve => setTimeout(resolve, 300));
    const addToCartBtn = await driver.findElement(By.css('.add-to-cart-btn'));
    await addToCartBtn.click();
    await driver.wait(async () => {
      const messageElem = await driver.findElement(By.css('.message'));
      const messageText = await messageElem.getText();
      return messageText.includes('Thêm sản phẩm vào giỏ hàng thành công');
    }, 2000, 'Không thấy message thành công');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Xem giỏ hàng
    await driver.get('http://localhost:5000/cart/show');
    await driver.wait(until.elementLocated(By.css('.order-info')), 5000);
    const orderInfo = await driver.findElement(By.css('.order-info')).getText();
    expect(orderInfo).to.not.include('Bạn vẫn chưa chọn sản phẩm nào để mua');
    // Có thể kiểm tra tên sản phẩm nếu muốn

    // Chờ 5 giây để quan sát giao diện giỏ hàng
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
}); 