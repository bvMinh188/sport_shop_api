const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC6: Tìm kiếm sản phẩm', function () {
  let driver;
  this.timeout(20000);

  before(async function () {
    driver = await createDriver();
    await driver.get('http://localhost:5000');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Tìm kiếm sản phẩm với từ khóa "giày"', async function () {
    // Đợi ô tìm kiếm xuất hiện
    await driver.wait(until.elementLocated(By.id('searchInput')), 5000);
    const searchInput = await driver.findElement(By.id('searchInput'));
    await searchInput.clear();
    await searchInput.sendKeys('giày');
    // Submit form
    const searchForm = await driver.findElement(By.css('form.search-form'));
    await searchForm.submit();
    // Đợi trang kết quả tìm kiếm load
    await driver.wait(until.urlContains('/products/search'), 5000);
    // Đợi sản phẩm kết quả xuất hiện
    await driver.wait(until.elementLocated(By.css('.product-card')), 5000);
    // Đảm bảo có ít nhất 1 sản phẩm hiển thị
    const productCards = await driver.findElements(By.css('.product-card'));
    expect(productCards.length).to.be.greaterThan(0);
    // Dừng lại 3 giây để quan sát giao diện
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
}); 