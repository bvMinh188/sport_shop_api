const { Builder, By, Key, until } = require('selenium-webdriver');
const axios = require('axios');

async function clickButton(driver, xpath, timeout = 5000) {
    try {
        // Chờ phần tử xuất hiện, hiển thị và sẵn sàng để click
        let element = await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
        element = await driver.wait(until.elementIsVisible(element), timeout);
        element = await driver.wait(until.elementIsEnabled(element), timeout);

        // Cuộn đến phần tử trước khi click để đảm bảo nó nằm trong viewport
        await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element);

        await element.click();
    } catch (error) {
        console.error(`Không thể click vào nút XPath: ${xpath}. Lỗi: ${error.message}`);
        throw error; // Ném lỗi để test case biết có vấn đề
    }
}

async function getOrderDetails(driver) {
    let bookings = [];

    // Chờ cho phần thân bảng (tbody) được tải dữ liệu và có ít nhất một hàng
    // Điều này quan trọng vì nội dung bảng được tải động.
    await driver.wait(until.elementLocated(By.id('orders-table-body')), 10000, "orders-table-body không xuất hiện.");
    await driver.wait(async () => {
        const rows = await driver.findElements(By.css('#orders-table-body tr'));
        // Chờ cho đến khi có ít nhất một hàng không phải hàng rỗng (nếu có loading state)
        return rows.length > 0 && await rows[0].getText() !== "Không có đơn hàng nào."; // Giả sử có thông báo "Không có đơn hàng nào" nếu rỗng
    }, 10000, "Bảng đơn hàng không có dữ liệu hoặc vẫn đang tải.");

    let tbody = await driver.findElement(By.id('orders-table-body'));
    let rows = await tbody.findElements(By.tagName('tr'));

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let bookingData = {};

        // Tìm tất cả các ô (<td>) trong hàng hiện tại
        let cells = await row.findElements(By.tagName('td'));

        if (cells.length >= 8) { // Đảm bảo có đủ số lượng ô
            bookingData.stt = await cells[0].getText();
            bookingData.fullName = await cells[1].getText();
            bookingData.address = await cells[2].getAttribute('title');
            bookingData.phone = await cells[3].getText();
            bookingData.price = await cells[4].getText();
            bookingData.createdAt = await cells[5].getText();
            bookingData.status = await cells[6].getText(); // Trạng thái nằm trực tiếp trong span bên trong td

            // Xử lý các nút hành động
            // Sử dụng các selector chính xác dựa trên HTML đã cung cấp
            const actionButtonsContainer = await cells[7].findElement(By.className('action-buttons'));

            try {
                // Nút "Xem" có data-id chứa _id của đơn hàng
                let btnDetail = await actionButtonsContainer.findElement(By.css('.btn-detail-order'));
                bookingData.detailButton = btnDetail;
                bookingData.orderId = await btnDetail.getAttribute('data-id');
            } catch (e) { /* Nút không tìm thấy */ }

            try {
                let btnConfirm = await actionButtonsContainer.findElement(By.css('.btn-confirm'));
                bookingData.confirmButton = btnConfirm;
            } catch (e) { /* Nút không tìm thấy */ }

            try {
                // Nút "Hủy" có class btn-danger và data-bs-target
                let btnCancel = await actionButtonsContainer.findElement(By.css('.btn-danger[data-bs-target="#delete-order-modal"]'));
                bookingData.cancelButton = btnCancel;
            } catch (e) { /* Nút không tìm thấy */ }

            try {
                let btnComplete = await actionButtonsContainer.findElement(By.css('.btn-complete'));
                bookingData.completeButton = btnComplete;
            } catch (e) { /* Nút không tìm thấy */ }

            bookings.push(bookingData);
        } else {
            console.warn("Bỏ qua hàng do số lượng ô không đủ hoặc hàng rỗng:", await row.getText());
        }
    }
    return bookings;
}

async function login(driver, email, password) {
    await driver.get('http://localhost:5000/');
    await driver.findElement(By.css('a[href="/auth/login"]')).click();
    await driver.wait(until.elementLocated(By.id("form-login")), 5000);
    await driver.findElement(By.id("email")).sendKeys(email);
    await driver.findElement(By.id("password")).sendKeys(password);
    await driver.findElement(By.css('#form-login button[type="submit"]')).click();
    await driver.wait(until.urlContains('http://localhost:5000/admin/home'), 10000, 'Đăng nhập không thành công hoặc không chuyển hướng đến trang admin/home.');
    console.log('Đăng nhập thành công!');
}

async function filterOrders(driver, filters) {
    try {
        if (filters.status) {
            const statusFilterSelect = await driver.wait(until.elementLocated(By.id('statusFilter')), 5000, 'Không tìm thấy bộ lọc trạng thái.');
            const currentSelectedValue = await statusFilterSelect.getAttribute('value');

            let statusValue = '';
            switch (filters.status.toLowerCase()) {
                case 'tất cả': statusValue = 'all'; break;
                case 'chờ xác nhận': statusValue = 'chờ xác nhận'; break;
                case 'đang giao hàng': statusValue = 'đang giao hàng'; break;
                case 'đã giao hàng': statusValue = 'đã giao hàng'; break;
                case 'đã hủy': statusValue = 'đã hủy'; break;
                default:
                    console.warn(`Trạng thái "${filters.status}" không hợp lệ. Mặc định chọn "Tất cả".`);
                    statusValue = 'all';
            }

            // Chỉ thực hiện chọn lại nếu giá trị hiện tại khác với giá trị mong muốn
            if (currentSelectedValue.toLowerCase() !== statusValue.toLowerCase()) {
                await statusFilterSelect.sendKeys(statusValue);
                // Sau khi thay đổi dropdown, chờ cho bảng được tải lại dữ liệu.
                // Ở đây, tôi sẽ chờ cho 'orders-table-body' hiển thị và có nội dung mới.
                // Cách tốt nhất là chờ cho một request XHR hoàn thành hoặc một loading spinner biến mất.
                // Với HTML bạn cung cấp, không có loading spinner rõ ràng,
                // nên chúng ta sẽ dựa vào việc tbody được re-render hoặc chờ một khoảng thời gian ngắn (ít lý tưởng hơn).
                
                // Cải tiến: Chờ cho số lượng hàng trong bảng ổn định hoặc chờ một element trong bảng xuất hiện sau tải.
                // Vì fetchOrders() gọi lại API và empty/append tbody, chúng ta có thể chờ tbody không rỗng.
                await driver.wait(async () => {
                    const rows = await driver.findElements(By.css('#orders-table-body tr'));
                    return rows.length > 0 && await rows[0].getText() !== "Không có đơn hàng nào.";
                }, 10000, `Bảng không được cập nhật với trạng thái "${filters.status}" trong 10 giây.`);

            } else {
                console.log(`Dropdown đã ở trạng thái "${statusValue}". Không cần lọc lại.`);
            }
        } else {
            console.log("Không có bộ lọc trạng thái nào được cung cấp.");
        }
        // Không return getOrderDetails ở đây, để test case gọi khi cần thiết
    } catch (error) {
        console.error("Lỗi trong hàm filterOrders:", error);
        throw error;
    }
}

// Hàm chờ thông báo thành công hoặc lỗi xuất hiện và biến mất
async function waitForAlertAndDismiss(driver, type = 'success', timeout = 10000) {
    const alertSelector = `.alert-container .alert-${type}`;
    const messageSelector = `${alertSelector} .message`;

    // Chờ alert container hiển thị
    const alertContainer = await driver.wait(until.elementLocated(By.css('.alert-container')), timeout, `Alert container không xuất hiện.`);
    await driver.wait(until.elementIsVisible(alertContainer), timeout, `Alert container không hiển thị.`);

    // Lấy nội dung thông báo
    const messageElement = await driver.wait(until.elementLocated(By.css(messageSelector)), timeout, `Thông báo ${type} không xuất hiện.`);
    const message = await messageElement.getText();

    // Chờ alert container biến mất (tự động sau 3 giây như trong JS của bạn)
    await driver.wait(until.elementIsNotVisible(alertContainer), timeout + 3000, `Alert container không biến mất sau thời gian.`);
    
    return message;
}

async function filterAndWaitForStatus(driver, status, timeout = 20000) {
    await filterOrders(driver, { status });
    await driver.sleep(2000);
    await driver.wait(async () => {
        const rows = await driver.findElements(By.css('#orders-table-body tr'));
        if (rows.length === 0) return false;
        for (let row of rows) {
            try {
                const statusCell = await row.findElement(By.css('td:nth-child(7) span'));
                const statusText = await statusCell.getText();
                if (statusText.trim().toLowerCase() === status.toLowerCase()) {
                    return true;
                }
            } catch (e) {}
        }
        return false;
    }, timeout, `Bảng không hiển thị đơn hàng "${status}" sau khi lọc.`);
    await driver.sleep(1000);
}

async function findOrderRowWithButton(driver, status, buttonSelector, timeout = 25000) {
    const xpath = `//tbody[@id='orders-table-body']/tr[./td[7]/span[normalize-space(translate(text(), '${status.toUpperCase()}', '${status.toLowerCase()}'))='${status.toLowerCase()}'] and .//${buttonSelector}]`;
    return await driver.wait(
        until.elementLocated(By.xpath(xpath)),
        timeout,
        `Không tìm thấy hàng đơn hàng '${status}' có nút thao tác phù hợp.`
    );
}

async function getOrderIdFromRow(orderRow) {
    const orderIdElement = await orderRow.findElement(By.css('.btn-detail-order'));
    return await orderIdElement.getAttribute('data-id');
}

async function waitForOrderStatus(driver, orderId, status, timeout = 30000) {
    const xpath = `//tbody[@id='orders-table-body']/tr[.//button[@data-id='${orderId}'] and ./td[7]/span[normalize-space(translate(text(), '${status.toUpperCase()}', '${status.toLowerCase()}'))='${status.toLowerCase()}']]`;
    const orderRow = await driver.wait(
        until.elementLocated(By.xpath(xpath)),
        timeout,
        `Không tìm thấy đơn hàng ID: ${orderId} ở trạng thái '${status}' sau khi thao tác.`
    );
    const statusElement = await orderRow.findElement(By.css('td:nth-child(7) span'));
    const finalStatus = await statusElement.getText();
    return { orderRow, finalStatus };
}

async function reloadAndWait(driver, status) {
    await driver.get('http://localhost:5000/admin/order/');
    await driver.sleep(2000);
    await driver.wait(until.elementLocated(By.id('statusFilter')), 10000);
    await filterAndWaitForStatus(driver, status);
}

module.exports = {
    clickButton,
    login,
    filterOrders,
    getOrderDetails,
    waitForAlertAndDismiss,
    filterAndWaitForStatus,
    findOrderRowWithButton,
    getOrderIdFromRow,
    waitForOrderStatus,
    reloadAndWait
};