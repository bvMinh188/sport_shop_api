const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('Test Case: Xem danh sách đơn hàng khi đã đăng nhập (có đơn hàng)', function () {
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

    it('TC1: Xem danh sách đơn hàng khi đã đăng nhập (có đơn hàng)', async function () {
        this.timeout(20000);
        
        try {
            await driver.get('http://localhost:5000/admin/transaction');
            await driver.wait(until.elementLocated(By.css('.table, .order-table, .transaction-table')), 10000);
            
            const pageTitle = await driver.findElement(By.css('h1, h2, .page-title')).getText();
            expect(pageTitle).to.include('Đơn hàng') || expect(pageTitle).to.include('Transaction') || expect(pageTitle).to.include('Order');
            
            const orderList = await driver.findElements(By.css('tr[data-order-id], .order-row, .transaction-row'));
            
            expect(orderList.length).to.be.greaterThan(0, 'Không tìm thấy đơn hàng nào trong danh sách');
            
            const firstOrder = orderList[0];
            
            const orderId = await firstOrder.findElement(By.css('.order-id, .order-number, [data-order-id]')).getText();
            expect(orderId).to.not.be.empty;
            
            const orderDate = await firstOrder.findElement(By.css('.order-date, .date-created, .created-at')).getText();
            expect(orderDate).to.not.be.empty;
            
            const orderStatus = await firstOrder.findElement(By.css('.order-status, .status')).getText();
            expect(orderStatus).to.not.be.empty;
            
            const orderTotal = await firstOrder.findElement(By.css('.order-total, .total-amount, .amount')).getText();
            expect(orderTotal).to.not.be.empty;
            
            const viewDetailBtn = await firstOrder.findElement(By.css('.view-detail, .btn-detail, a[href*="order"], .btn-view'));
            expect(await viewDetailBtn.isDisplayed()).to.be.true;
            
            try {
                const updateBtn = await firstOrder.findElement(By.css('.update-status, .btn-update, .btn-edit'));
                if (await updateBtn.isDisplayed()) {
                    expect(await updateBtn.isDisplayed()).to.be.true;
                }
            } catch (error) {
            }
            
            try {
                const pagination = await driver.findElement(By.css('.pagination, .page-nav'));
                if (await pagination.isDisplayed()) {
                    const firstPageBtn = await pagination.findElement(By.css('.first-page, .page-1, .pagination-first'));
                    expect(await firstPageBtn.isDisplayed()).to.be.true;
                    
                    const lastPageBtn = await pagination.findElement(By.css('.last-page, .pagination-last'));
                    expect(await lastPageBtn.isDisplayed()).to.be.true;
                }
            } catch (error) {
            }
            
            try {
                const filterSection = await driver.findElement(By.css('.filter-section, .order-filter, .search-filter'));
                if (await filterSection.isDisplayed()) {
                    const statusFilter = await filterSection.findElement(By.css('select[name="status"], .status-filter'));
                    expect(await statusFilter.isDisplayed()).to.be.true;
                    
                    const searchInput = await filterSection.findElement(By.css('input[type="search"], .search-input, input[placeholder*="tìm"]'));
                    expect(await searchInput.isDisplayed()).to.be.true;
                }
            } catch (error) {
            }
            
            try {
                const totalOrders = await driver.findElement(By.css('.total-orders, .order-count, .total-count')).getText();
                expect(totalOrders).to.not.be.empty;
            } catch (error) {
            }
            
            await driver.manage().window().setRect({ width: 768, height: 1024 });
            await driver.sleep(1000);
            
            const orderListMobile = await driver.findElements(By.css('tr[data-order-id], .order-row, .transaction-row'));
            expect(orderListMobile.length).to.be.greaterThan(0, 'Danh sách không hiển thị trên mobile');
            
            await driver.manage().window().maximize();
            
        } catch (error) {
            try {
                const screenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('admin-order-list-failure.png', screenshot, 'base64');
            } catch (screenshotError) {
            }
            
            throw error;
        }
    });
}); 