const { By } = require('selenium-webdriver');
const axios = require('axios');

async function login(driver, email, password) {
  // Đăng nhập qua API để lấy token
  const res = await axios.post('http://localhost:3000/api/auth/login', {
    email,
    password
  }, { withCredentials: true });

  if (!res.data.success || !res.data.data.token) {
    throw new Error('Login failed: ' + (res.data.message || 'No token received'));
  }

  // Truy cập đúng domain trước khi set cookie
  await driver.get('http://localhost:5000');

  // 1. Set cookie token cho backend
  await driver.manage().addCookie({
    name: 'token',
    value: res.data.data.token,
    path: '/',
    domain: 'localhost',
    httpOnly: false,
    sameSite: 'Lax'
  });

  // 2. Set document.cookie và localStorage cho frontend (FE) bằng JS
  await driver.executeScript(`
    document.cookie = "token=${res.data.data.token}; path=/; SameSite=Lax";
    localStorage.setItem('user', JSON.stringify(${JSON.stringify(res.data.data.user)}));
  `);

  // 3. Log lại document.cookie và localStorage để xác nhận
  const docCookie = await driver.executeScript('return document.cookie;');
  const localUser = await driver.executeScript('return localStorage.getItem("user");');
  console.log('document.cookie sau khi login:', docCookie);
  console.log('localStorage user sau khi login:', localUser);
}

module.exports = login;