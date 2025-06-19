const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');

describe('TC4: Lọc qua từng danh mục sản phẩm trên trang chủ', function () {
  let driver;
  this.timeout(30000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Lọc qua từng danh mục và kiểm tra sản phẩm hiển thị', async function () {
    // Đợi các nút danh mục render
    await driver.wait(until.elementLocated(By.css('.category-filter')), 5000);
    const categoryButtons = await driver.findElements(By.css('.category-filter'));
    expect(categoryButtons.length).to.be.greaterThan(0);

    for (let i = 0; i < categoryButtons.length; i++) {
      // Lấy lại danh sách nút (vì DOM có thể thay đổi sau mỗi lần click)
      const buttons = await driver.findElements(By.css('.category-filter'));
      const btn = buttons[i];
      const categoryName = await btn.getText();
      await btn.click();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Đợi UI cập nhật

      // Kiểm tra sản phẩm hiển thị (có thể không có sản phẩm)
      const productCards = await driver.findElements(By.css('.product-card'));
      // Nếu không có sản phẩm thì phải có thông báo
      if (productCards.length === 0) {
        const emptyMsg = await driver.findElement(By.css('#product-list')).getText();
        expect(emptyMsg).to.include('Không có sản phẩm nào');
      } else {
        // Nếu có sản phẩm, kiểm tra tên sản phẩm hiển thị
        for (let card of productCards) {
          const title = await card.findElement(By.css('.product-title')).getText();
          expect(title).to.not.be.empty;
        }
      }
    }
  });
}); 