const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken'); // Import thư viện jwt để stub
const app = require('../app'); // Import app Express của bạn

// Import các thành phần cần mock
const authMiddleware = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// --- Test 1: Kiểm tra lớp xác thực (Authentication) ---
describe('API Authentication', () => {
    it('GET /api/cart - Thiếu User (không có token): nên trả về lỗi 401', async () => {
        const res = await request(app)
            .get('/api/cart')
            // Supertest không cần header `Authorization` ở đây
            .expect(401);

        // Middleware sẽ trả về lỗi "No token provided"
        expect(res.body.message).to.equal('No token provided');
    });
});


// --- Test 2, 3, 4: Kiểm tra lớp logic nghiệp vụ (Business Logic) ---
describe('API Logic Tests (khi đã xác thực)', () => {
    let userFindByIdStub;

    // Trước mỗi test, giả lập quy trình xác thực thành công
    beforeEach(() => {
        // Giả lập jwt.verify thành công và trả về một payload giả
        sinon.stub(jwt, 'verify').returns({ id: 'fakeUserId' });
        
        // Giả lập User.findById để middleware tìm thấy user từ payload giả
        userFindByIdStub = sinon.stub(User, 'findById');
        userFindByIdStub.resolves({ _id: 'fakeUserId', name: 'fake', addresses: [] });
    });

    // Sau mỗi test, khôi phục lại tất cả các stub
    afterEach(() => {
        sinon.restore();
    });

    it('PUT /api/cart/update/:itemId - Quá số lượng tồn kho: nên trả về lỗi 400', async () => {
        const fakeItemId = 'fakeItemId';

        sinon.stub(Cart, 'findOne').resolves({
            _id: fakeItemId,
            product: 'fakeProductId',
            size: 42
        });

        sinon.stub(Product, 'findById').resolves({
            _id: 'fakeProductId',
            name: 'Fake Product',
            sizes: [{ size: 42, quantity: 5 }]
        });

        const res = await request(app)
            .put(`/api/cart/update/${fakeItemId}`)
            .set('Authorization', 'Bearer fakeToken') // Cần gửi một token giả để vượt qua bước check `if (!token)`
            .send({ quantity: 10 }) 
            .expect(400);
        
        expect(res.body.message).to.equal('Số lượng sản phẩm không đủ trong kho');
    });

    it('POST /api/orders - Thiếu địa chỉ: nên trả về lỗi 400', async () => {
        // User đã được stub là không có địa chỉ trong beforeEach
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer fakeToken')
            .send({}) 
            .expect(400);

        expect(res.body.message).to.equal('Vui lòng chọn địa chỉ giao hàng');
    });

    it('POST /api/orders - Thiếu sản phẩm (giỏ hàng rỗng): nên trả về lỗi 400', async () => {
        const mockQuery = {
            populate: sinon.stub().resolves([])
        };
        sinon.stub(Cart, 'find').returns(mockQuery);
        
        userFindByIdStub.resolves({
            _id: 'fakeUserId',
            addresses: [{ isDefault: true, address: '123 Default St' }]
        });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer fakeToken')
            .send({ address: '123 Test St' })
            .expect(400);
        
        expect(res.body.message).to.equal('Giỏ hàng trống');
    });
}); 