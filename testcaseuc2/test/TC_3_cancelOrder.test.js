const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('Test Case: Hủy đơn hàng ở trạng thái "Chờ xác nhận"', function () {
    let driver;

    before(async function () {
        this.timeout(30000);
        try {
            driver = await createDriver();
            await driver.get('http://localhost:5000');
            await login(driver, 'admin@gmail.com', '123');
            await driver.wait(until.urlContains('/admin/order'), 10000);
        } catch (error) {
            throw error;
        }
    });

    after(async function () {
        try {
            if (driver) {
                await driver.quit();
            }
        } catch (error) {
        }
    });

    it('TC3: Hủy đơn hàng ở trạng thái "Chờ xác nhận"', async function () {
        this.timeout(20000);
        
        try {
            await driver.get('http://localhost:5000/admin/order');
            await driver.wait(until.elementLocated(By.css('.order-list, .order-item, tr[data-order-id]')), 10000);
            
            const orderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            expect(orderList.length).to.be.greaterThan(0, 'Không tìm thấy đơn hàng nào');
            
            let orderToCancel = null;
            let orderId = '';
            
            for (let i = 0; i < orderList.length; i++) {
                const order = orderList[i];
                const status = await order.findElement(By.css('.order-status, .status')).getText();
                
                if (status.includes('Chờ xác nhận') || status.includes('Pending') || status.includes('Waiting')) {
                    orderToCancel = order;
                    orderId = await order.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
                    break;
                }
            }
            
            expect(orderToCancel).to.not.be.null;
            
            const cancelBtn = await orderToCancel.findElement(By.css('.cancel-order, .btn-cancel, .cancel-btn'));
            expect(await cancelBtn.isDisplayed()).to.be.true;
            
            await cancelBtn.click();
            
            await driver.wait(until.elementLocated(By.css('.modal, .popup, .confirm-dialog')), 5000);
            
            const confirmBtn = await driver.findElement(By.css('.confirm-cancel, .btn-confirm, .yes-btn, .confirm'));
            await confirmBtn.click();
            
            await driver.wait(until.elementLocated(By.css('.message, .alert, .toast')), 5000);
            
            const message = await driver.findElement(By.css('.message, .alert, .toast')).getText();
            expect(message).to.include('hủy') || expect(message).to.include('cancel') || expect(message).to.include('success');
            
            await driver.sleep(2000);
            
            await driver.get('http://localhost:5000/user/order');
            await driver.wait(until.elementLocated(By.css('.order-list, .order-item, tr[data-order-id]')), 10000);
            
            const updatedOrderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            
            let orderFound = false;
            let updatedStatus = '';
            
            for (let i = 0; i < updatedOrderList.length; i++) {
                const order = updatedOrderList[i];
                const currentOrderId = await order.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
                
                if (currentOrderId === orderId) {
                    orderFound = true;
                    updatedStatus = await order.findElement(By.css('.order-status, .status')).getText();
                    break;
                }
            }
            
            expect(orderFound).to.be.true;
            expect(updatedStatus).to.include('Đã hủy') || expect(updatedStatus).to.include('Cancelled') || expect(updatedStatus).to.include('Canceled');
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('cancel-order-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });
}); 