const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');

describe('TC1: Thêm sản phẩm vào giỏ hàng khi chưa đăng nhập', function () {
  let driver;
  this.timeout(30000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
    // Chờ 2 giây để có thể thấy
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('Thêm sản phẩm vào giỏ hàng khi chưa đăng nhập', async function () {
    await driver.get('http://localhost:5000/products/673705fc8e4584ab5f6e1905');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Chọn size còn hàng đầu tiên
    const sizeButtons = await driver.findElements(By.css('.size-btn:not([disabled])'));
    expect(sizeButtons.length).to.be.greaterThan(0);
    await sizeButtons[0].click();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Nhấn nút Thêm vào giỏ hàng
    const addToCartBtn = await driver.findElement(By.css('.add-to-cart-btn'));
    await addToCartBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Kiểm tra message hiển thị đúng
    const messageElem = await driver.findElement(By.css('.message'));
    const messageText = await messageElem.getText();
    expect(messageText).to.include('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');

    // Đợi chuyển hướng sang trang login
    await driver.wait(until.urlContains('/auth/login'), 5000);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/auth/login');

    // Kiểm tra nội dung trang login
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(bodyText.toLowerCase()).to.include('đăng nhập');
  });
}); 