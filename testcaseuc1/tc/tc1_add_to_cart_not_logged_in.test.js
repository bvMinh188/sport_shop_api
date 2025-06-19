const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');

describe('TC1: Thêm sản phẩm vào giỏ hàng khi chưa đăng nhập', function () {
  let driver;
  this.timeout(30000);

  before(async function () {
    console.log('Đang mở Chrome browser...');
    driver = await createDriver();
    console.log('Chrome đã mở thành công!');
    await driver.get('http://localhost:5000');
    console.log('Đã mở trang chủ');
    // Chờ 2 giây để có thể thấy
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  after(async function () {
    if (driver) {
      console.log('Đang đóng Chrome...');
      await driver.quit();
      console.log('Đã đóng Chrome');
    }
  });

  it('Thêm sản phẩm vào giỏ hàng khi chưa đăng nhập', async function () {
    console.log('Đang mở trang sản phẩm...');
    await driver.get('http://localhost:5000/products/6737064d8e4584ab5f6e1a2b');
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
    console.log('Test case hoàn thành thành công!');
  });
}); 