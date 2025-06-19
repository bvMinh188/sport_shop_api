const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('Test Case: Nhận thông báo khi đơn hàng được xác nhận/hoàn thành', function () {
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

    it('TC23: Nhận thông báo khi đơn hàng được xác nhận', async function () {
        this.timeout(25000);
        
        try {
            await driver.get('http://localhost:5000/user/order');
            await driver.wait(until.elementLocated(By.css('.order-list, .order-item, tr[data-order-id]')), 10000);
            
            const orderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            expect(orderList.length).to.be.greaterThan(0, 'Không tìm thấy đơn hàng nào');
            
            let pendingOrder = null;
            let orderId = '';
            
            for (let i = 0; i < orderList.length; i++) {
                const order = orderList[i];
                const status = await order.findElement(By.css('.order-status, .status')).getText();
                
                if (status.includes('Chờ xác nhận') || status.includes('Pending') || status.includes('Waiting')) {
                    pendingOrder = order;
                    orderId = await order.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
                    break;
                }
            }
            
            expect(pendingOrder).to.not.be.null;
            
            await driver.get('http://localhost:5000/user/profile');
            await driver.sleep(3000);
            
            const notificationIcon = await driver.findElement(By.css('.notification-icon, .notifications, .bell-icon, .notification-bell'));
            await notificationIcon.click();
            
            await driver.wait(until.elementLocated(By.css('.notification-dropdown, .notification-panel, .notification-list')), 5000);
            
            const notifications = await driver.findElements(By.css('.notification-item, .notification, .alert-item'));
            
            let orderConfirmedNotification = false;
            
            for (let i = 0; i < notifications.length; i++) {
                const notification = notifications[i];
                const notificationText = await notification.getText();
                
                if (notificationText.includes(orderId) && (notificationText.includes('xác nhận') || notificationText.includes('confirmed') || notificationText.includes('approved'))) {
                    orderConfirmedNotification = true;
                    break;
                }
            }
            
            expect(orderConfirmedNotification).to.be.true;
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('order-confirmation-notification-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });

    it('TC25: Nhận thông báo khi đơn hàng hoàn thành', async function () {
        this.timeout(25000);
        
        try {
            await driver.get('http://localhost:5000/user/order');
            await driver.wait(until.elementLocated(By.css('.order-list, .order-item, tr[data-order-id]')), 10000);
            
            const orderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            expect(orderList.length).to.be.greaterThan(0, 'Không tìm thấy đơn hàng nào');
            
            let deliveredOrder = null;
            let orderId = '';
            
            for (let i = 0; i < orderList.length; i++) {
                const order = orderList[i];
                const status = await order.findElement(By.css('.order-status, .status')).getText();
                
                if (status.includes('Đã giao') || status.includes('Delivered') || status.includes('Completed') || status.includes('Finished')) {
                    deliveredOrder = order;
                    orderId = await order.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
                    break;
                }
            }
            
            expect(deliveredOrder).to.not.be.null;
            
            await driver.get('http://localhost:5000/user/profile');
            await driver.sleep(3000);
            
            const notificationIcon = await driver.findElement(By.css('.notification-icon, .notifications, .bell-icon, .notification-bell'));
            await notificationIcon.click();
            
            await driver.wait(until.elementLocated(By.css('.notification-dropdown, .notification-panel, .notification-list')), 5000);
            
            const notifications = await driver.findElements(By.css('.notification-item, .notification, .alert-item'));
            
            let orderCompletedNotification = false;
            
            for (let i = 0; i < notifications.length; i++) {
                const notification = notifications[i];
                const notificationText = await notification.getText();
                
                if (notificationText.includes(orderId) && (notificationText.includes('hoàn thành') || notificationText.includes('completed') || notificationText.includes('delivered') || notificationText.includes('finished'))) {
                    orderCompletedNotification = true;
                    break;
                }
            }
            
            expect(orderCompletedNotification).to.be.true;
            
            const markAsReadBtn = await driver.findElement(By.css('.mark-all-read, .read-all, .clear-notifications'));
            await markAsReadBtn.click();
            
            await driver.sleep(2000);
            
            const unreadNotifications = await driver.findElements(By.css('.notification-item.unread, .notification.unread, .alert-item.unread'));
            expect(unreadNotifications.length).to.equal(0);
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('order-completion-notification-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });

    it('TC24: Nhận thông báo khi đơn hàng được giao', async function () {
        this.timeout(25000);
        
        try {
            await driver.get('http://localhost:5000/user/order');
            await driver.wait(until.elementLocated(By.css('.order-list, .order-item, tr[data-order-id]')), 10000);
            
            const orderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            expect(orderList.length).to.be.greaterThan(0, 'Không tìm thấy đơn hàng nào');
            
            let shippingOrder = null;
            let orderId = '';
            
            for (let i = 0; i < orderList.length; i++) {
                const order = orderList[i];
                const status = await order.findElement(By.css('.order-status, .status')).getText();
                
                if (status.includes('Đang giao') || status.includes('Shipping') || status.includes('In transit') || status.includes('On the way')) {
                    shippingOrder = order;
                    orderId = await order.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
                    break;
                }
            }
            
            expect(shippingOrder).to.not.be.null;
            
            await driver.get('http://localhost:5000/user/profile');
            await driver.sleep(3000);
            
            const notificationIcon = await driver.findElement(By.css('.notification-icon, .notifications, .bell-icon, .notification-bell'));
            await notificationIcon.click();
            
            await driver.wait(until.elementLocated(By.css('.notification-dropdown, .notification-panel, .notification-list')), 5000);
            
            const notifications = await driver.findElements(By.css('.notification-item, .notification, .alert-item'));
            
            let orderShippingNotification = false;
            
            for (let i = 0; i < notifications.length; i++) {
                const notification = notifications[i];
                const notificationText = await notification.getText();
                
                if (notificationText.includes(orderId) && (notificationText.includes('đang giao') || notificationText.includes('shipping') || notificationText.includes('in transit'))) {
                    orderShippingNotification = true;
                    break;
                }
            }
            
            expect(orderShippingNotification).to.be.true;
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('order-shipping-notification-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });
}); 