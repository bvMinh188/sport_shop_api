const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC8: Cập nhật số lượng sản phẩm trong giỏ hàng thành công', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Cập nhật số lượng thành công với giá trị hợp lệ', async function () {
    try {
      // Đăng nhập, giả định sản phẩm đã có trong giỏ hàng
      await login(driver, 'user@gmail.com', '123');

      // Vào trang giỏ hàng
      await driver.get('http://localhost:5000/cart/show');
      await driver.wait(until.elementLocated(By.css('table')), 5000);

      // Click nút Sửa
      const editBtn = await driver.findElement(By.css('.edit-btn'));
      await editBtn.click();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Nhập số lượng mới hợp lệ
      const qtyInput = await driver.wait(until.elementLocated(By.css('.quantity-input')), 5000);
      await qtyInput.clear();
      await qtyInput.sendKeys('2');

      // Click nút Cập nhật
      const updateBtn = await driver.findElement(By.css('.update-btn'));
      await updateBtn.click();

      // Đợi và kiểm tra thông báo thành công
      await driver.wait(async () => {
        const messageElem = await driver.findElement(By.css('.message'));
        const messageText = await messageElem.getText();
        return messageText.includes('Cập nhật số lượng thành công');
      }, 5000, 'Không thấy thông báo cập nhật thành công');

      // Đợi trang tải lại và kiểm tra số lượng mới
      await driver.wait(until.stalenessOf(qtyInput), 5000);
      const newQuantitySpan = await driver.findElement(By.css('.quantity'));
      const newQuantity = await newQuantitySpan.getText();
      expect(newQuantity).to.equal('2');

      // Dừng 3 giây để quan sát thông báo
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (e) {
      console.error('Lỗi khi chạy test TC8:', e);
      throw e;
    }
  });
}); 