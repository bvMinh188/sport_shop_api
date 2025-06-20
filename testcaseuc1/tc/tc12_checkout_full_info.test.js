"use strict";
const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

// Thay đổi thông tin này cho phù hợp với hệ thống test
const TEST_USER = { username: "testuser", password: "testpassword" };
const PRODUCT_URL = "http://localhost:5000/products";
const ORDER_URL = "http://localhost:5000/cart/show";

describe('TC12: Đặt hàng thành công khi thông tin đầy đủ', function () {
  let driver;
  this.timeout(30000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Đặt hàng thành công khi đã đăng nhập, có sản phẩm và địa chỉ', async function () {
    await login(driver, 'user@gmail.com', '123');
    // Thêm sản phẩm vào giỏ hàng
    await driver.get('http://localhost:5000/products/673705fc8e4584ab5f6e1905');
    await driver.wait(until.elementLocated(By.css('.size-btn:not([disabled])')), 5000);
    const sizeButtons = await driver.findElements(By.css('.size-btn:not([disabled])'));
    expect(sizeButtons.length).to.be.greaterThan(0);
    await sizeButtons[0].click();
    await new Promise(resolve => setTimeout(resolve, 300));
    const addToCartBtn = await driver.findElement(By.css('.add-to-cart-btn'));
    await addToCartBtn.click();
    // Đợi message thành công
    await driver.wait(async () => {
      const messageElem = await driver.findElement(By.css('.message'));
      const messageText = await messageElem.getText();
      return messageText.includes('Thêm sản phẩm vào giỏ hàng thành công');
    }, 2000);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Vào trang đặt hàng
    await driver.get('http://localhost:5000/cart/show');
    await driver.wait(until.elementLocated(By.css('#orderForm')), 5000);
    await driver.wait(until.elementLocated(By.css('.selected-address .current-address')), 5000);

    // Nhấn nút Đặt hàng (giả sử luôn có địa chỉ mặc định)
    const orderBtn = await driver.findElement(By.css('#orderForm button[type="submit"]'));
    await driver.wait(until.elementIsVisible(orderBtn), 5000);
    await driver.wait(until.elementIsEnabled(orderBtn), 5000);
    await driver.executeScript('arguments[0].scrollIntoView(true);', orderBtn);
    const disabledAttr = await orderBtn.getAttribute('disabled');
    await new Promise(resolve => setTimeout(resolve, 500)); // chờ UI ổn định
    await orderBtn.click();
    // Đợi message thành công
    await driver.wait(async () => {
      const msg = await driver.findElement(By.css('.message')).getText();
      return msg.includes('Đặt hàng thành công');
    }, 5000);
    // Đợi chuyển hướng về profile
    await driver.wait(until.urlContains('/user/profile'), 5000);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/user/profile');
    // Dừng lại 3 giây để quan sát thông báo
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
}); 