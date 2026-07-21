/**
 * EventBus - Module giao tiếp trung tâm giữa các module
 * Các module không gọi trực tiếp lẫn nhau mà thông qua EventBus
 */
class EventBus {
    constructor() {
        this._listeners = {};
    }

    /**
     * Đăng ký lắng nghe sự kiện
     * @param {string} event - Tên sự kiện
     * @param {Function} callback - Hàm xử lý
     * @param {Object} context - Context cho callback
     * @returns {Function} Hàm hủy đăng ký
     */
    on(event, callback, context = null) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        const listener = { callback, context };
        this._listeners[event].push(listener);

        // Trả về hàm unsubscribe
        return () => this.off(event, callback, context);
    }

    /**
     * Đăng ký lắng nghe sự kiện một lần
     * @param {string} event - Tên sự kiện
     * @param {Function} callback - Hàm xử lý
     * @param {Object} context - Context cho callback
     */
    once(event, callback, context = null) {
        const wrapper = (...args) => {
            this.off(event, wrapper, context);
            callback.apply(context, args);
        };
        this.on(event, wrapper, context);
    }

    /**
     * Hủy đăng ký lắng nghe
     * @param {string} event - Tên sự kiện
     * @param {Function} callback - Hàm xử lý
     * @param {Object} context - Context cho callback
     */
    off(event, callback, context = null) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(
            listener => listener.callback !== callback || listener.context !== context
        );
    }

    /**
     * Phát sự kiện
     * @param {string} event - Tên sự kiện
     * @param {...*} args - Dữ liệu đi kèm
     */
    emit(event, ...args) {
        if (!this._listeners[event]) return;
        // Clone mảng để tránh lỗi khi listener tự hủy trong callback
        const listeners = [...this._listeners[event]];
        listeners.forEach(listener => {
            listener.callback.apply(listener.context, args);
        });
    }

    /**
     * Xóa toàn bộ listener của một sự kiện hoặc tất cả
     * @param {string} [event] - Tên sự kiện (nếu không truyền thì xóa tất cả)
     */
    clear(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    }
}

// Singleton instance
const eventBus = new EventBus();
export default eventBus;
