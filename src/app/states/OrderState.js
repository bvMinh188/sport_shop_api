class OrderState {
    constructor(order) {
        if (this.constructor === OrderState) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.order = order;
    }

    // Các phương thức chuyển đổi trạng thái
    async confirmOrder() {
        throw new Error("Method 'confirmOrder()' must be implemented.");
    }

    async deliverOrder() {
        throw new Error("Method 'deliverOrder()' must be implemented.");
    }

    async cancelOrder() {
        throw new Error("Method 'cancelOrder()' must be implemented.");
    }

    // Phương thức kiểm tra có thể chuyển sang trạng thái mới không
    canTransitionTo(newState) {
        throw new Error("Method 'canTransitionTo()' must be implemented.");
    }

    // Lấy tên trạng thái hiện tại
    getStateName() {
        throw new Error("Method 'getStateName()' must be implemented.");
    }
}

class PendingState extends OrderState {
    async confirmOrder() {
        if (this.canTransitionTo('đang giao hàng')) {
            this.order.status = 'đang giao hàng';
            await this.order.save();
            return true;
        }
        return false;
    }

    async cancelOrder() {
        if (this.canTransitionTo('đã hủy')) {
            this.order.status = 'đã hủy';
            await this.order.save();
            return true;
        }
        return false;
    }

    canTransitionTo(newState) {
        // Từ chờ xác nhận có thể chuyển sang đang giao hoặc đã hủy
        const allowedTransitions = ['đang giao hàng', 'đã hủy'];
        return allowedTransitions.includes(newState);
    }

    getStateName() {
        return 'chờ xác nhận';
    }
}

class ShippingState extends OrderState {
    async deliverOrder() {
        if (this.canTransitionTo('đã giao hàng')) {
            this.order.status = 'đã giao hàng';
            await this.order.save();
            return true;
        }
        return false;
    }

    async cancelOrder() {
        if (this.canTransitionTo('đã hủy')) {
            this.order.status = 'đã hủy';
            await this.order.save();
            return true;
        }
        return false;
    }

    canTransitionTo(newState) {
        // Từ đang giao có thể chuyển sang đã giao hoặc đã hủy
        const allowedTransitions = ['đã giao hàng', 'đã hủy'];
        return allowedTransitions.includes(newState);
    }

    getStateName() {
        return 'đang giao hàng';
    }
}

class DeliveredState extends OrderState {
    // Không có phương thức chuyển đổi vì đây là trạng thái cuối
    canTransitionTo(newState) {
        // Từ đã giao không thể chuyển sang trạng thái khác
        return false;
    }

    getStateName() {
        return 'đã giao hàng';
    }
}

class CancelledState extends OrderState {
    // Không có phương thức chuyển đổi vì đây là trạng thái cuối
    canTransitionTo(newState) {
        // Từ đã hủy không thể chuyển sang trạng thái khác
        return false;
    }

    getStateName() {
        return 'đã hủy';
    }
}

module.exports = {
    OrderState,
    PendingState,
    ShippingState,
    DeliveredState,
    CancelledState
}; 