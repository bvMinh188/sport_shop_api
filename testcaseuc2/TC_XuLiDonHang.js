require('dotenv').config();
const { By, Key, until, Builder } = require('selenium-webdriver');
const { expect } = require('chai');
require('chromedriver');
const axios = require('axios');
const chrome = require('selenium-webdriver/chrome');
const createChromeDriver  = require('./utils/chrome-config');
const {
    login,
    filterOrders,
    getOrderDetails,
    clickButton,
    waitForAlertAndDismiss,
    filterAndWaitForStatus,
    findOrderRowWithButton,
    getOrderIdFromRow,
    waitForOrderStatus,
    reloadAndWait
} = require('./utils/func');


describe('Test Cases cho chức năng xử lý đơn hàng', function () {
    this.timeout(120000);
    let driver;

    before(async function () {
        let options = new chrome.Options();
        // Tắt các cảnh báo và log không cần thiết
        options.addArguments(
            '--disable-gpu', 
            '--no-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-logging',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--log-level=3',
            '--silent',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript-harmony-shipping',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
        );
        
        // Tắt console log
        options.setLoggingPrefs({
            'browser': 'OFF',
            'driver': 'OFF',
            'performance': 'OFF'
        });
        
        driver = await createChromeDriver(options);
        await login(driver, "nguyenbasang180503@gmail.com", "sangcua1905");
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    async function changeOrderStatus(driver, order, action) {
        if (!order) {
            throw new Error('Không tìm thấy đối tượng đơn hàng để thực hiện hành động.');
        }
    
        // Các form ẩn để gửi yêu cầu PUT/PATCH
        const confirmOrderForm = await driver.findElement(By.name('confirm-order-form'));
        const completeOrderForm = await driver.findElement(By.name('complete-order-form'));
        const deleteOrderForm = await driver.findElement(By.name('delete-order-form')); // Dùng cho 'cancel'
    
        try {
            switch (action.toLowerCase()) { // Chuyển đổi action về chữ thường để so sánh linh hoạt
                case 'confirm':
                    // Nút "Xác nhận" (btn-confirm) có sẵn trong đối tượng order từ getOrderDetails
                    if (order.confirmButton) {
                        await order.confirmButton.click();
                        // jQuery script đã gửi yêu cầu API PUT/PATCH khi nút được click.
                        // Chúng ta cần chờ đợi để thông báo thành công xuất hiện
                        // và sau đó là dữ liệu bảng được làm mới.
                        await waitForAlertAndDismiss(driver, 'success', 20000); 
                        await driver.sleep(1000); // Đợi thêm một chút để UI cập nhật
                    } else {
                        throw new Error(`Nút "Xác nhận" không khả dụng cho đơn hàng ID: ${order.orderId} (Trạng thái: ${order.status}).`);
                    }
                    break;
    
                case 'cancel':
                    await order.cancelButton.click();
                    const deleteOrderModal = await driver.wait(until.elementLocated(By.id('delete-order-modal')), 10000, 'Modal xác nhận hủy không xuất hiện.');
                    await driver.wait(until.elementIsVisible(deleteOrderModal), 20000, 'Modal xác nhận hủy không hiển thị.');
                    const confirmCancelBtn = await driver.wait(until.elementLocated(By.id('btn-delete-order')), 5000, 'Không tìm thấy nút "Xác nhận" trong modal hủy.');
                    await confirmCancelBtn.click();
                    await waitForAlertAndDismiss(driver, 'success', 15000);
                    break;
                case 'complete':
                    // Nút "Hoàn thành" (btn-complete) có sẵn trong đối tượng order
                    if (order.completeButton) {
                        await order.completeButton.click();
                        await waitForAlertAndDismiss(driver, 'success', 20000);
                        await driver.sleep(1); // Đợi thêm một chút để UI cập nhật
                    } else {
                        throw new Error(`Nút "Hoàn thành" không khả dụng cho đơn hàng ID: ${order.orderId} (Trạng thái: ${order.status}).`);
                    }
                    break;
    
                default:
                    throw new Error(`Hành động không xác định: ${action}. Chỉ hỗ trợ 'confirm', 'cancel', 'complete'.`);
            }
    
        } catch (error) {
            console.error(`Lỗi khi thay đổi trạng thái đơn hàng ID: ${order?.orderId} với hành động "${action}":`, error);
            throw error; // Ném lỗi để caller có thể xử lý
        }
    }

    it('TC1: Xác nhận đơn hàng khi trạng thái chờ xác nhận - Thành công', async function () {
        await reloadAndWait(driver, 'chờ xác nhận');
        // Tìm hàng đơn hàng có nút xác nhận
        const orderRow = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]");
        const orderId = await getOrderIdFromRow(orderRow);
        const confirmButton = await orderRow.findElement(By.css('.btn-success.btn-confirm'));
        const orderToConfirm = { orderId, status: 'chờ xác nhận', confirmButton };
        await changeOrderStatus(driver, orderToConfirm, 'confirm');
        // Kiểm tra lại trạng thái đơn hàng sau khi xác nhận
        await reloadAndWait(driver, 'đang giao hàng');
        const { finalStatus } = await waitForOrderStatus(driver, orderId, 'đang giao hàng');
        expect(finalStatus.trim().toLowerCase()).to.equal('đang giao hàng', `Trạng thái đơn hàng ID: ${orderId} không đúng sau khi xác nhận.`);
    });

    it('TC2: Hủy đơn hàng khi trạng thái chờ xác nhận - Thành công', async function () {
        await reloadAndWait(driver, 'chờ xác nhận');
        // Tìm hàng đơn hàng có nút hủy
        const orderRow = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-danger') and @data-bs-target='#delete-order-modal']");
        const orderId = await getOrderIdFromRow(orderRow);
        const cancelButton = await orderRow.findElement(By.css(".btn-danger[data-bs-target='#delete-order-modal']"));
        const orderToCancel = { orderId, status: 'chờ xác nhận', cancelButton };
        await changeOrderStatus(driver, orderToCancel, 'cancel');
        // Kiểm tra lại trạng thái đơn hàng sau khi hủy
        await reloadAndWait(driver, 'đã hủy');
        const { finalStatus } = await waitForOrderStatus(driver, orderId, 'đã hủy');
        expect(finalStatus.trim().toLowerCase()).to.equal('đã hủy', `Trạng thái đơn hàng ID: ${orderId} không đúng sau khi hủy.`);
    });

    it('TC3: Hoàn thành đơn hàng khi trạng thái chờ xác nhận - Thất bại', async function () {
        await reloadAndWait(driver, 'chờ xác nhận');
        // Tìm một hàng đơn hàng bất kỳ đang ở trạng thái "chờ xác nhận"
        const orderRow = await driver.wait(
            until.elementLocated(By.xpath(
                "//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), 'CHỜ XÁC NHẬN', 'chờ xác nhận'))='chờ xác nhận']]"
            )),
            25000,
            "Không tìm thấy hàng đơn hàng 'chờ xác nhận' để kiểm tra."
        );
        const orderId = await getOrderIdFromRow(orderRow);
        const initialStatusElement = await orderRow.findElement(By.css('td:nth-child(7) span'));
        const initialStatus = (await initialStatusElement.getText()).trim().toLowerCase();
        expect(initialStatus).to.equal('chờ xác nhận', 'Trạng thái ban đầu của đơn hàng không phải là "chờ xác nhận".');
        // Kiểm tra rằng nút "Hoàn thành" không hiển thị hoặc không thể click
        const completeButtons = await orderRow.findElements(By.xpath(".//button[contains(@class, 'btn-success') and contains(text(), 'Hoàn thành')]"));
        expect(completeButtons.length).to.equal(0, `Nút "Hoàn thành" không nên hiển thị cho đơn hàng ID: ${orderId} ở trạng thái "chờ xác nhận".`);
        // Tải lại trang và kiểm tra lại trạng thái để đảm bảo không có sự thay đổi bất ngờ
        await reloadAndWait(driver, 'chờ xác nhận');
        const { finalStatus } = await waitForOrderStatus(driver, orderId, 'chờ xác nhận');
        expect(finalStatus).to.equal(initialStatus, `Trạng thái đơn hàng ID: ${orderId} đã thay đổi từ "${initialStatus}" sau khi thử hành động không hợp lệ.`);
    });

    it('TC4: Hoàn thành đơn hàng khi trạng thái đang giao hàng - Thành công', async function () {
        let orderToCompleteId = null;

        try {
            await reloadAndWait(driver, 'đang giao hàng');
            const potentialOrderRows = await driver.wait(async () => {
                const rows = await driver.findElements(By.xpath(
                    "//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), 'ĐANG GIAO HÀNG', 'đang giao hàng'))='đang giao hàng']]"
                ));
                return rows.length > 0 ? rows : false;
            }, 10000, "Không tìm thấy bất kỳ đơn hàng 'đang giao hàng' nào.");

            let foundRunningOrder = null;
            for (let row of potentialOrderRows) {
                try {
                    // Try to find the complete button within this row
                    const completeButton = await row.findElement(By.css(".btn-success.btn-complete"));
                    // If button is found, this is our order!
                    foundRunningOrder = row;
                    break; 
                } catch (e) {
                    // Button not found in this row, try next one
                    continue; 
                }
            }

            if (foundRunningOrder) {
                orderToCompleteId = await getOrderIdFromRow(foundRunningOrder);
            } else {
                throw new Error("Không tìm thấy đơn hàng 'đang giao hàng' có nút Hoàn thành sẵn có.");
            }

        } catch (e) {
            // Nếu không tìm thấy đơn hàng 'đang giao hàng', sẽ tạo mới từ 'chờ xác nhận'
            await reloadAndWait(driver, 'chờ xác nhận');
            const orderRowForConfirm = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]");
            orderToCompleteId = await getOrderIdFromRow(orderRowForConfirm);
            const confirmButton = await orderRowForConfirm.findElement(By.css(".btn-success.btn-confirm"));
            const orderForConfirmation = { orderId: orderToCompleteId, status: 'chờ xác nhận', confirmButton: confirmButton };
            await changeOrderStatus(driver, orderForConfirmation, 'confirm');
            await reloadAndWait(driver, 'đang giao hàng');
            await waitForOrderStatus(driver, orderToCompleteId, 'đang giao hàng');
        }
       
        const { orderRow: orderRowToComplete } = await waitForOrderStatus(driver, orderToCompleteId, 'đang giao hàng');
        
        // Get the "Hoàn thành" button from that specific row
        const completeButtonInRow = await orderRowToComplete.findElement(By.css(".btn-success.btn-complete"));
        const orderToComplete = { orderId: orderToCompleteId, status: 'đang giao hàng', completeButton: completeButtonInRow };

        // 3. Thực hiện hành động hoàn thành đơn hàng
        await changeOrderStatus(driver, orderToComplete, 'complete');
        await driver.sleep(2000);
        // 4. Kiểm tra lại trạng thái đơn hàng sau khi hoàn thành
        await reloadAndWait(driver, 'đã giao hàng');
        const { finalStatus } = await waitForOrderStatus(driver, orderToComplete.orderId, 'đã giao hàng');
        expect(finalStatus.trim().toLowerCase()).to.equal('đã giao hàng', `Trạng thái đơn hàng ID: ${orderToComplete.orderId} không đúng sau khi hoàn thành.`);
        await driver.sleep(1000); // Wait for observation
   
    });
    it('TC5: Hủy đơn hàng khi trạng thái đang giao hàng - Thất bại', async function () {
        let orderIdToTest = null;
        try {
            await reloadAndWait(driver, 'đang giao hàng');
            const orderRow = await driver.wait(
                until.elementLocated(By.xpath(
                    "//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), 'ĐANG GIAO HÀNG', 'đang giao hàng'))='đang giao hàng']]"
                )),
                15000,
                "Không tìm thấy đơn hàng 'đang giao hàng' có sẵn để kiểm tra."
            );
            orderIdToTest = await getOrderIdFromRow(orderRow);
        } catch (e) {
            // Nếu không tìm thấy, chúng ta sẽ chuyển một đơn hàng từ "chờ xác nhận" sang "đang giao hàng"
            await reloadAndWait(driver, 'chờ xác nhận');
            const orderRowForConfirm = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]");
            orderIdToTest = await getOrderIdFromRow(orderRowForConfirm);
            const confirmButton = await orderRowForConfirm.findElement(By.css(".btn-success.btn-confirm"));
            const orderForConfirmation = { orderId: orderIdToTest, status: 'chờ xác nhận', confirmButton: confirmButton };
            await changeOrderStatus(driver, orderForConfirmation, 'confirm');
            await reloadAndWait(driver, 'đang giao hàng'); 
            await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng'); 
        }
        const { orderRow: orderRowToTest, finalStatus: initialStatus } = await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
        expect(initialStatus.trim().toLowerCase()).to.equal('đang giao hàng', 'Trạng thái ban đầu của đơn hàng không phải là "đang giao hàng".');
        const cancelButtonXPath = `.//button[contains(@class, 'btn-danger') and @data-bs-target='#delete-order-modal']`;
        const cancelButtons = await orderRowToTest.findElements(By.xpath(cancelButtonXPath));
        expect(cancelButtons.length).to.equal(0, `Nút "Hủy" không nên hiển thị cho đơn hàng ID: ${orderIdToTest} ở trạng thái "đang giao hàng".`);
        await reloadAndWait(driver, 'đang giao hàng');
        const { finalStatus: currentStatusAfterAttempt } = await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
        expect(currentStatusAfterAttempt).to.equal(initialStatus, `Trạng thái đơn hàng ID: ${orderIdToTest} đã thay đổi từ "${initialStatus}" sau khi thử hành động không hợp lệ.`);
        await driver.sleep(1000);
    });

    it('TC6: Xác nhận đơn hàng khi trạng thái đang giao hàng - Thất bại', async function () {
        let orderIdToTest = null;
        try {
            await reloadAndWait(driver, 'đang giao hàng');
            const orderRow = await driver.wait(
                until.elementLocated(By.xpath(
                    "//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), 'ĐANG GIAO HÀNG', 'đang giao hàng'))='đang giao hàng']]"
                )),
                15000,
                "Không tìm thấy đơn hàng 'đang giao hàng' có sẵn để kiểm tra."
            );
            orderIdToTest = await getOrderIdFromRow(orderRow);
        } catch (e) {
            await reloadAndWait(driver, 'chờ xác nhận');
            const orderRowForConfirm = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]");
            orderIdToTest = await getOrderIdFromRow(orderRowForConfirm);
            const confirmButton = await orderRowForConfirm.findElement(By.css(".btn-success.btn-confirm"));
            const orderForConfirmation = { orderId: orderIdToTest, status: 'chờ xác nhận', confirmButton: confirmButton };
            await changeOrderStatus(driver, orderForConfirmation, 'confirm');
            await reloadAndWait(driver, 'đang giao hàng');
            await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
        }
    
        const { orderRow: orderRowToTest, finalStatus: initialStatus } = await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
        expect(initialStatus.trim().toLowerCase()).to.equal('đang giao hàng', 'Trạng thái ban đầu của đơn hàng không phải là "đang giao hàng".');
    
        const confirmButtonXPath = `.//button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]`;
        const confirmButtons = await orderRowToTest.findElements(By.xpath(confirmButtonXPath));
        expect(confirmButtons.length).to.equal(0, `Nút "Xác nhận" không nên hiển thị cho đơn hàng ID: ${orderIdToTest} ở trạng thái "đang giao hàng".`);
    
        await reloadAndWait(driver, 'đang giao hàng');
        const { finalStatus: currentStatusAfterAttempt } = await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
        expect(currentStatusAfterAttempt).to.equal(initialStatus, `Trạng thái đơn hàng ID: ${orderIdToTest} đã thay đổi từ "${initialStatus}" sau khi thử hành động không hợp lệ.`);
        await driver.sleep(1000);
    });    

    it('TC7: Hủy đơn hàng khi trạng thái đã giao hàng - Thất bại', async function () {
        let orderIdToTest = null;
    
        try {
            await reloadAndWait(driver, 'đã giao hàng');
            const orderRow = await driver.wait(
                until.elementLocated(By.xpath(
                    "//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), 'ĐÃ GIAO HÀNG', 'đã giao hàng'))='đã giao hàng']]"
                )),
                15000,
                "Không tìm thấy đơn hàng 'đã giao hàng' có sẵn để kiểm tra."
            );
            orderIdToTest = await getOrderIdFromRow(orderRow);
        } catch (e) {
            await reloadAndWait(driver, 'chờ xác nhận');
            const orderRowForConfirm = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]");
            orderIdToTest = await getOrderIdFromRow(orderRowForConfirm);
            const confirmButton = await orderRowForConfirm.findElement(By.css(".btn-success.btn-confirm"));
            const orderForConfirmation = { orderId: orderIdToTest, status: 'chờ xác nhận', confirmButton: confirmButton };
            await changeOrderStatus(driver, orderForConfirmation, 'confirm');
    
            await reloadAndWait(driver, 'đang giao hàng');
            const { orderRow: orderRowToComplete } = await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
            const completeButtonInRow = await orderRowToComplete.findElement(By.css(".btn-success.btn-complete"));
            const orderToComplete = { orderId: orderIdToTest, status: 'đang giao hàng', completeButton: completeButtonInRow };
            await changeOrderStatus(driver, orderToComplete, 'complete');
    
            await reloadAndWait(driver, 'đã giao hàng');
            await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        }
    
        const { orderRow: orderRowToTest, finalStatus: initialStatus } = await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        expect(initialStatus.trim().toLowerCase()).to.equal('đã giao hàng', 'Trạng thái ban đầu của đơn hàng không phải là "đã giao hàng".');
    
        const cancelButtonXPath = `.//button[contains(@class, 'btn-danger') and @data-bs-target='#delete-order-modal']`;
        const cancelButtons = await orderRowToTest.findElements(By.xpath(cancelButtonXPath));
        expect(cancelButtons.length).to.equal(0, `Nút "Hủy" không nên hiển thị cho đơn hàng ID: ${orderIdToTest} ở trạng thái "đã giao hàng".`);
    
        await reloadAndWait(driver, 'đã giao hàng');
        const { finalStatus: currentStatusAfterAttempt } = await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        expect(currentStatusAfterAttempt).to.equal(initialStatus, `Trạng thái đơn hàng ID: ${orderIdToTest} đã thay đổi từ "${initialStatus}" sau khi thử hành động không hợp lệ.`);
        console.log(`Đơn hàng ID: ${orderIdToTest} vẫn ở trạng thái "${currentStatusAfterAttempt}" như mong đợi.`);
        await driver.sleep(1000);
    });

    it('TC8: Xác nhận đơn hàng khi trạng thái đã giao hàng- Thất bại', async function () {
        let orderIdToTest = null;
    
        try {
            await reloadAndWait(driver, 'đã giao hàng');
            const orderRow = await driver.wait(
                until.elementLocated(By.xpath(
                    "//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), 'ĐÃ GIAO HÀNG', 'đã giao hàng'))='đã giao hàng']]"
                )),
                15000,
                "Không tìm thấy đơn hàng 'đã giao hàng' có sẵn để kiểm tra."
            );
            orderIdToTest = await getOrderIdFromRow(orderRow);
        } catch (e) {
            await reloadAndWait(driver, 'chờ xác nhận');
            const orderRowForConfirm = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]");
            orderIdToTest = await getOrderIdFromRow(orderRowForConfirm);
            const confirmButton = await orderRowForConfirm.findElement(By.css(".btn-success.btn-confirm"));
            const orderForConfirmation = { orderId: orderIdToTest, status: 'chờ xác nhận', confirmButton: confirmButton };
            await changeOrderStatus(driver, orderForConfirmation, 'confirm');
    
            await reloadAndWait(driver, 'đang giao hàng');
            const { orderRow: orderRowToComplete } = await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
            const completeButtonInRow = await orderRowToComplete.findElement(By.css(".btn-success.btn-complete"));
            const orderToComplete = { orderId: orderIdToTest, status: 'đang giao hàng', completeButton: completeButtonInRow };
            await changeOrderStatus(driver, orderToComplete, 'complete');
    
            await reloadAndWait(driver, 'đã giao hàng');
            await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        }
    
        const { orderRow: orderRowToTest, finalStatus: initialStatus } = await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        expect(initialStatus.trim().toLowerCase()).to.equal('đã giao hàng', 'Trạng thái ban đầu của đơn hàng không phải là "đã giao hàng".');
    
        const confirmButtonXPath = `.//button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]`;
        const confirmButtons = await orderRowToTest.findElements(By.xpath(confirmButtonXPath));
        expect(confirmButtons.length).to.equal(0, `Nút "Xác nhận" không nên hiển thị cho đơn hàng ID: ${orderIdToTest} ở trạng thái "đã giao hàng".`);
    
        await reloadAndWait(driver, 'đã giao hàng');
        const { finalStatus: currentStatusAfterAttempt } = await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        expect(currentStatusAfterAttempt).to.equal(initialStatus, `Trạng thái đơn hàng ID: ${orderIdToTest} đã thay đổi từ "${initialStatus}" sau khi thử hành động không hợp lệ.`);
        console.log(`Đơn hàng ID: ${orderIdToTest} vẫn ở trạng thái "${currentStatusAfterAttempt}" như mong đợi.`);
        await driver.sleep(1000);

    });    

    it('TC9: Hoàn thành đơn hàng khi trạng thái đã giao hàng - Thất bại', async function () {
        let orderIdToTest = null;
    
        try {
            await reloadAndWait(driver, 'đã giao hàng');
            const orderRow = await driver.wait(
                until.elementLocated(By.xpath(
                    "//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), 'ĐÃ GIAO HÀNG', 'đã giao hàng'))='đã giao hàng']]"
                )),
                15000,
                "Không tìm thấy đơn hàng 'đã giao hàng' có sẵn để kiểm tra."
            );
            orderIdToTest = await getOrderIdFromRow(orderRow);
        } catch (e) {
            await reloadAndWait(driver, 'chờ xác nhận');
            const orderRowForConfirm = await findOrderRowWithButton(driver, 'chờ xác nhận', "button[contains(@class, 'btn-success') and contains(text(), 'Xác nhận')]");
            orderIdToTest = await getOrderIdFromRow(orderRowForConfirm);
            const confirmButton = await orderRowForConfirm.findElement(By.css(".btn-success.btn-confirm"));
            const orderForConfirmation = { orderId: orderIdToTest, status: 'chờ xác nhận', confirmButton: confirmButton };
            await changeOrderStatus(driver, orderForConfirmation, 'confirm');
    
            await reloadAndWait(driver, 'đang giao hàng');
            const { orderRow: orderRowToComplete } = await waitForOrderStatus(driver, orderIdToTest, 'đang giao hàng');
            const completeButtonInRow = await orderRowToComplete.findElement(By.css(".btn-success.btn-complete"));
            const orderToComplete = { orderId: orderIdToTest, status: 'đang giao hàng', completeButton: completeButtonInRow };
            await changeOrderStatus(driver, orderToComplete, 'complete');
    
            await reloadAndWait(driver, 'đã giao hàng');
            await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        }
    
        const { orderRow: orderRowToTest, finalStatus: initialStatus } = await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        expect(initialStatus.trim().toLowerCase()).to.equal('đã giao hàng', 'Trạng thái ban đầu của đơn hàng không phải là "đã giao hàng".');
    
        const completeButtonXPath = `.//button[contains(@class, 'btn-success') and contains(text(), 'Hoàn thành')]`;
        const completeButtons = await orderRowToTest.findElements(By.xpath(completeButtonXPath));
        expect(completeButtons.length).to.equal(0, `Nút "Hoàn thành" không nên hiển thị cho đơn hàng ID: ${orderIdToTest} ở trạng thái "đã giao hàng".`);
    
        await reloadAndWait(driver, 'đã giao hàng');
        const { finalStatus: currentStatusAfterAttempt } = await waitForOrderStatus(driver, orderIdToTest, 'đã giao hàng');
        expect(currentStatusAfterAttempt).to.equal(initialStatus, `Trạng thái đơn hàng ID: ${orderIdToTest} đã thay đổi từ "${initialStatus}" sau khi thử hành động không hợp lệ.`);
        console.log(`Đơn hàng ID: ${orderIdToTest} vẫn ở trạng thái "${currentStatusAfterAttempt}" như mong đợi.`);
        await driver.sleep(1000);
    });
    
});








