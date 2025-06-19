const { Builder, By, until } = require("selenium-webdriver");
const { expect } = require("chai");
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe("Admin - Quản lý đơn hàng", function () {
  let driver;

  before(async function () {
    driver = await createDriver();
    await driver.get("http://localhost:5000");
    await login(driver, 'admin@gmail.com', '123'); // đổi nếu tài khoản admin khác
    await driver.wait(until.urlIs("/admin/order"), 5000);
  });

  after(async function () {
    await driver.quit();
  });

  it("TC_2 Xem chi tiết đơn hàng", async function () {
    const viewButtons = await driver.findElements(By.css(".btn-view-order"));
    expect(viewButtons.length).to.be.greaterThan(0);

    await viewButtons[2].click();
    console.log("Số nút xem:", viewButtons.length);

    // Chờ modal mở ra
    await driver.wait(until.elementLocated(By.css("#detail-order-modal.show")), 5000);

    // Chờ nội dung chi tiết sản phẩm hiển thị
    const detail = await driver.wait(until.elementLocated(By.id("order-products")), 5000);
    const isDisplayed = await detail.isDisplayed();

    expect(isDisplayed).to.be.true;
    await driver.sleep(5000); // chờ thêm 5 giây
  });


  it("Xác nhận đơn hàng (chuyển sang 'đang giao')", async function () {
      const confirmButtons = await driver.findElements(By.css(".btn-confirm"));
      if (confirmButtons.length === 0) {
        console.log("Không có đơn hàng nào cần xác nhận")
          this.skip(); // Không có đơn để xác nhận
      }

      await confirmButtons[0].click();
      const message = await driver.wait(until.elementLocated(By.id("order-message")), 5000);
      const text = await message.getText();
      expect(text).to.include("xác nhận");

      // Chờ reload rồi kiểm tra nút "Giao thành công"
      await driver.sleep(1500);
      await driver.navigate().refresh();
      const completeButtons = await driver.findElements(By.css(".btn-complete"));
      expect(completeButtons.length).to.be.greaterThan(0);
      await driver.sleep(5000); // chờ thêm 5 giây
  });

  it("Giao đơn hàng thành công (chuyển sang trạng thái hoàn tất)", async function () {
      const completeButtons = await driver.findElements(By.css(".btn-complete"));
      if (completeButtons.length === 0) {
          this.skip(); // Không có đơn đang giao
      }

      await completeButtons[0].click();
      const message = await driver.wait(until.elementLocated(By.id("order-message")), 5000);
      const text = await message.getText();
      expect(text).to.include("giao thành công");
      await driver.sleep(5000); // chờ thêm 5 giây
  });

  it("Hủy đơn hàng", async function () {
      // Reload để chắc chắn đang ở trạng thái "chờ xác nhận"
      await driver.navigate().refresh();
      const cancelButtons = await driver.findElements(By.css(".cancel-order"));
      if (cancelButtons.length === 0) {
        console.log("Không có đơn hàng nào chưa xác nhận để hủy")
          this.skip(); // Không có đơn chờ xác nhận để hủy
      }

      await cancelButtons[0].click();
      await driver.wait(until.elementLocated(By.id("confirmCancelOrder")), 3000);
      const confirmCancel = await driver.findElement(By.id("confirmCancelOrder"));
      await driver.sleep(2000); // chờ thêm 5 giây
      await confirmCancel.click();

      const message = await driver.wait(until.elementLocated(By.id("order-message")), 5000);
      const text = await message.getText();
      expect(text).to.include("bị hủy");
      await driver.sleep(5000); // chờ thêm 5 giây
  });
});
