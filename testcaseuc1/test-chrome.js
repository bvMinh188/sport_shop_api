const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testChrome() {
  console.log('Đang thử mở Chrome...');
  
  try {
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    
    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('Chrome đã mở thành công!');
    
    // Mở một trang web đơn giản
    await driver.get('https://www.google.com');
    console.log('Đã mở Google.com');
    
    // Chờ 3 giây
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Đóng browser
    await driver.quit();
    console.log('Đã đóng Chrome');
    
  } catch (error) {
    console.error('Lỗi khi mở Chrome:', error.message);
  }
}

testChrome(); 