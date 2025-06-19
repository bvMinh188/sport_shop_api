const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('Test Case: Tìm kiếm đơn hàng theo mã đơn hàng', function () {
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

    it('TC13: Tìm kiếm đơn hàng theo mã đơn hàng', async function () {
        this.timeout(20000);
        
        try {
            await driver.get('http://localhost:5000/admin/transaction');
            await driver.wait(until.elementLocated(By.css('.table, .order-table, .transaction-table')), 10000);
            
            const orderList = await driver.findElements(By.css('tr[data-order-id], .order-row, .transaction-row'));
            expect(orderList.length).to.be.greaterThan(0, 'Không tìm thấy đơn hàng nào');
            
            const firstOrder = orderList[0];
            const orderId = await firstOrder.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
            
            const searchInput = await driver.findElement(By.css('input[type="search"], .search-input, input[placeholder*="tìm"], input[name="search"]'));
            await searchInput.clear();
            await searchInput.sendKeys(orderId);
            
            const searchBtn = await driver.findElement(By.css('.search-btn, .btn-search, button[type="submit"], .search-button'));
            await searchBtn.click();
            
            await driver.sleep(2000);
            
            const searchResults = await driver.findElements(By.css('tr[data-order-id], .order-row, .transaction-row'));
            
            expect(searchResults.length).to.be.greaterThan(0, 'Không tìm thấy kết quả tìm kiếm');
            
            const foundOrder = searchResults[0];
            const foundOrderId = await foundOrder.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
            
            expect(foundOrderId).to.equal(orderId);
            
            const clearSearchBtn = await driver.findElement(By.css('.clear-search, .reset-search, .btn-clear, .clear-btn'));
            await clearSearchBtn.click();
            
            await driver.sleep(2000);
            
            const resetOrderList = await driver.findElements(By.css('tr[data-order-id], .order-row, .transaction-row'));
            expect(resetOrderList.length).to.equal(orderList.length);
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('search-order-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });

    it('TC13b: Tìm kiếm đơn hàng không tồn tại', async function () {
        this.timeout(15000);
        
        try {
            await driver.get('http://localhost:5000/admin/transaction');
            await driver.wait(until.elementLocated(By.css('.table, .order-table, .transaction-table')), 10000);
            
            const searchInput = await driver.findElement(By.css('input[type="search"], .search-input, input[placeholder*="tìm"], input[name="search"]'));
            await searchInput.clear();
            await searchInput.sendKeys('ORDER_NOT_EXIST_12345');
            
            const searchBtn = await driver.findElement(By.css('.search-btn, .btn-search, button[type="submit"], .search-button'));
            await searchBtn.click();
            
            await driver.sleep(2000);
            
            const noResultsMessage = await driver.findElement(By.css('.no-results, .empty-state, .not-found, .no-data'));
            const messageText = await noResultsMessage.getText();
            
            expect(messageText).to.include('không tìm thấy') || expect(messageText).to.include('not found') || expect(messageText).to.include('no results') || expect(messageText).to.include('empty');
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('search-order-not-found-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });
}); 