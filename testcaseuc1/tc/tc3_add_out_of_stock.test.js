const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC3: Thêm sản phẩm vượt quá tồn kho vào giỏ hàng', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Thêm sản phẩm vượt quá tồn kho vào giỏ hàng', async function () {
    try {
      await login(driver, 'user@gmail.com', '123');
      await driver.get('http://localhost:5000/products/673705fc8e4584ab5f6e1905');
      
      // Đợi nút size-btn xuất hiện (tối đa 5s)
      await driver.wait(until.elementLocated(By.css('.size-btn:not([disabled])')), 5000);
      const sizeButtons = await driver.findElements(By.css('.size-btn:not([disabled])'));
      console.log('Số lượng size còn hàng:', sizeButtons.length);
      if (sizeButtons.length === 0) {
        const pageSource = await driver.getPageSource();
        console.log('HTML trang sản phẩm:', pageSource);
      }
      expect(sizeButtons.length).to.be.greaterThan(0);
      await sizeButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 300)); // Đợi UI cập nhật

      // Nhập số lượng vượt quá tồn kho
      const qtyInput = await driver.findElement(By.css('input#quantity'));
      await qtyInput.clear();
      await qtyInput.sendKeys('999'); // Số lượng lớn hơn tồn kho
      console.log('Đã nhập số lượng: 999');

      // Nhấn nút Thêm vào giỏ hàng
      const addToCartBtn = await driver.findElement(By.css('.add-to-cart-btn'));
      await addToCartBtn.click();

      // Đợi message lỗi xuất hiện (tối đa 2s)
      await driver.wait(async () => {
        const messageElem = await driver.findElement(By.css('.message'));
        const messageText = await messageElem.getText();
        console.log('Message hiển thị:', messageText);
        return messageText.includes('Số lượng sản phẩm trong kho không đủ');
      }, 2000, 'Không thấy message lỗi vượt quá tồn kho');

      // Đợi 3 giây để quan sát
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Kiểm tra lại trang sản phẩm vẫn hiển thị đúng tên sản phẩm
      const productTitle = await driver.findElement(By.css('.product-title')).getText();
      console.log('Tên sản phẩm sau khi thêm vào giỏ:', productTitle);
      expect(productTitle).to.not.be.empty;
    } catch (e) {
      console.error('Lỗi khi chạy test TC3:', e);
      throw e;
    }
  });
}); 