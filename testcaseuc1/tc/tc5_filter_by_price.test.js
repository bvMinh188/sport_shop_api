const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');

describe('TC5: Lọc sản phẩm theo giá tăng dần và giảm dần', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Xắp sếp sản phẩm theo giá tăng dần và giảm dần', async function () {
    // Đợi nút filter xuất hiện
    await driver.wait(until.elementLocated(By.id('filterButton')), 5000);
    const filterBtn = await driver.findElement(By.id('filterButton'));
    await filterBtn.click();
    // Chọn "Giá tăng dần"
    const ascBtn = await driver.findElement(By.css('.price-filter[data-sort="asc"]'));
    await ascBtn.click();
    // Đợi sản phẩm render lại
    await driver.wait(until.elementLocated(By.css('.product-card')), 5000);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Dừng 2 giây quan sát

    // Lọc giảm dần
    await filterBtn.click();
    const descBtn = await driver.findElement(By.css('.price-filter[data-sort="desc"]'));
    await descBtn.click();
    await driver.wait(until.elementLocated(By.css('.product-card')), 5000);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Dừng 2 giây quan sát
    // Đảm bảo có sản phẩm hiển thị lại
    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.be.greaterThan(0);
  });
}); 