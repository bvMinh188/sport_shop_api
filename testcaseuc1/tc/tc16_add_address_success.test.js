const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('TC16: Thêm địa chỉ thành công khi nhập đầy đủ thông tin', function () {
    this.timeout(30000);
    let driver;

    before(async function () {
        driver = await createDriver();
        await login(driver, 'user@gmail.com', '123');
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('Nhập đầy đủ thông tin và thêm địa chỉ thành công', async function () {
        await driver.get('http://localhost:5000/cart/show');

        const changeAddressButton = await driver.findElement(By.id('changeAddress'));
        await changeAddressButton.click();

        await driver.wait(until.elementLocated(By.id('addressModal')), 5000);
        const addressModal = await driver.findElement(By.id('addressModal'));
        await driver.wait(until.elementIsVisible(addressModal), 5000);
        
        const addNewAddressButton = await driver.findElement(By.id('addNewAddress'));
        await addNewAddressButton.click();
        
        const newAddressForm = await driver.findElement(By.id('newAddressForm'));
        await driver.wait(until.elementIsVisible(newAddressForm), 5000);

        const nameInput = await driver.findElement(By.id('newName'));
        await nameInput.sendKeys('Minh');

        const phoneInput = await driver.findElement(By.id('newPhone'));
        await phoneInput.sendKeys('0987654321');
        
        const addressInput = await driver.findElement(By.id('newAddress'));
        await addressInput.sendKeys('123 Đường ABC, Quận 1, TP.HCM');
        
        const saveButton = await driver.findElement(By.id('saveAddress'));
        await saveButton.click();
        
        // Chờ thông báo thành công
        const messageContainer = await driver.wait(until.elementLocated(By.css('.message-container.show')), 5000);
        const message = await driver.wait(until.elementIsVisible(messageContainer.findElement(By.css('.message'))), 5000);
        const messageText = await message.getText();
        expect(messageText).to.include('Thêm địa chỉ thành công'); // Có thể là 'thành công' hoặc 'Địa chỉ' tuỳ thông báo FE
        await new Promise(resolve => setTimeout(resolve, 3000)); // dừng 3 giây để xem thông báo
    });
}); 