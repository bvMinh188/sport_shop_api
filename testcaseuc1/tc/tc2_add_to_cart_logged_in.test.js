const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC2: Thêm sản phẩm vào giỏ hàng khi đã đăng nhập', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Thêm sản phẩm vào giỏ hàng khi đã đăng nhập', async function () {
    try {
      await login(driver, 'user@gmail.com', '123');
      await driver.get('http://localhost:5000/products/673705fc8e4584ab5f6e1905');
      
      // Đợi nút size-btn xuất hiện (tối đa 5s)
      await driver.wait(until.elementLocated(By.css('.size-btn:not([disabled])')), 5000);
      const sizeButtons = await driver.findElements(By.css('.size-btn:not([disabled])'));
      if (sizeButtons.length === 0) {
        const pageSource = await driver.getPageSource();
      }
      expect(sizeButtons.length).to.be.greaterThan(0);
      await sizeButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 300)); // Đợi UI cập nhật

      // Nhấn nút Thêm vào giỏ hàng
      const addToCartBtn = await driver.findElement(By.css('.add-to-cart-btn'));
      await addToCartBtn.click();

      // Đợi message thành công xuất hiện (tối đa 2s)
      await driver.wait(async () => {
        const messageElem = await driver.findElement(By.css('.message'));
        const messageText = await messageElem.getText();
        return messageText.includes('Thêm sản phẩm vào giỏ hàng thành công');
      }, 2000, 'Không thấy message thành công');

      // Đợi reload trang (tối đa 2s)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Kiểm tra lại trang sản phẩm vẫn hiển thị đúng tên sản phẩm
      const productTitle = await driver.findElement(By.css('.product-title')).getText();
      expect(productTitle).to.not.be.empty;
    } catch (e) {
      console.error('Lỗi khi chạy test TC2:', e);
      throw e;
    }
  });
}); 