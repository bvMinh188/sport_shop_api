const { describe, it, before, after } = require('mocha');
const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../utils/setup');
const login = require('../utils/login');

describe('Tất cả Test Cases Quản lý Đơn hàng', function () {
    
    describe('TC1: Xem danh sách đơn hàng', function () {
        require('./TC_1_viewOrderList.test.js');
    });
    
    describe('TC2: Admin thao tác đơn hàng', function () {
        require('./TC_2_adminOrderActions.test.js');
    });
    
    describe('TC3: Hủy đơn hàng chờ xác nhận', function () {
        require('./TC_3_cancelOrder.test.js');
    });
    
    describe('TC5: Hủy đơn hàng đã xác nhận', function () {
        require('./TC_5_cancelConfirmedOrder.test.js');
    });
    
    describe('TC6: Lọc đơn hàng theo trạng thái', function () {
        require('./TC_6_filterOrderByStatus.test.js');
    });
    
    describe('TC7: Thông báo đơn hàng', function () {
        require('./TC_7_orderNotification.test.js');
    });
}); 