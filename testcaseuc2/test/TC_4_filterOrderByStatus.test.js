const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('Test Case: Lọc đơn hàng theo trạng thái "Chờ xác nhận"', function () {
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

    it('TC11: Lọc đơn hàng theo trạng thái "Chờ xác nhận"', async function () {
        this.timeout(20000);
        
        try {
            await driver.get('http://localhost:5000/admin/order');
            await driver.wait(until.elementLocated(By.css('.order-list, .order-item, tr[data-order-id]')), 10000);
            
            const initialOrderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            expect(initialOrderList.length).to.be.greaterThan(0, 'Không tìm thấy đơn hàng nào');
            
            const filterSection = await driver.findElement(By.css('.filter-section, .order-filter, .search-filter, .filter-container'));
            expect(await filterSection.isDisplayed()).to.be.true;
            
            const statusFilter = await filterSection.findElement(By.css('select[name="status"], .status-filter, .filter-status'));
            expect(await statusFilter.isDisplayed()).to.be.true;
            
            await statusFilter.click();
            
            const pendingOption = await driver.findElement(By.css('option[value="pending"], option[value="waiting"], option:contains("Chờ xác nhận"), option:contains("Pending")'));
            await pendingOption.click();
            
            const applyFilterBtn = await filterSection.findElement(By.css('.apply-filter, .btn-filter, .filter-btn, button[type="submit"]'));
            await applyFilterBtn.click();
            
            await driver.sleep(2000);
            
            const filteredOrderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            
            if (filteredOrderList.length > 0) {
                for (let i = 0; i < filteredOrderList.length; i++) {
                    const order = filteredOrderList[i];
                    const status = await order.findElement(By.css('.order-status, .status')).getText();
                    
                    expect(status).to.include('Chờ xác nhận') || expect(status).to.include('Pending') || expect(status).to.include('Waiting');
                }
            }
            
            const clearFilterBtn = await filterSection.findElement(By.css('.clear-filter, .reset-filter, .btn-reset'));
            await clearFilterBtn.click();
            
            await driver.sleep(2000);
            
            const resetOrderList = await driver.findElements(By.css('.order-item, .order-card, tr[data-order-id]'));
            expect(resetOrderList.length).to.equal(initialOrderList.length);
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('filter-order-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });
}); 