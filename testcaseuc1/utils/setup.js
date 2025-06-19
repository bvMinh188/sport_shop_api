const chromedriver = require('chromedriver');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

function createDriver() {
  const options = new chrome.Options();
  
  // Các tùy chọn cho Chrome
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--disable-web-security');
  options.addArguments('--allow-running-insecure-content');
  options.addArguments('--disable-extensions');
  options.addArguments('--start-maximized');
  
  // Không chạy headless để có thể thấy browser
  // options.addArguments('--headless');
  
  // Tạo driver với Chrome
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}

module.exports = createDriver; 