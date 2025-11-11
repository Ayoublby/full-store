/**
 * نظام العربة المحسن - Full Store
 * نظام إدارة عربة التسوق مع حفظ محلي
 */

class CartSystem {
    constructor() {
        this.items = [];
        this.total = 0;
        this.storageKey = 'fullstore_cart';
        this.init();
    }

    init() {
        this.loadCart();
        this.updateCartDisplay();
        this.setupEventListeners();
        this.clearCartOnSessionEnd();
    }

    // تحميل العربة من التخزين المحلي
    loadCart() {
        const savedCart = localStorage.getItem(this.storageKey);
        if (savedCart) {
            try {
                const cartData = JSON.parse(savedCart);
                this.items = cartData.items || [];
                this.calculateTotal();
            } catch (error) {
                console.error('خطأ في تحميل العربة:', error);
                this.items = [];
            }
        }
    }

    // حفظ العربة في التخزين المحلي
    saveCart() {
        const cartData = {
            items: this.items,
            total: this.total,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(cartData));
    }

    // إضافة منتج للعربة
    addItem(productId, quantity = 1) {
        if (typeof productSystem === 'undefined') {
            this.showNotification('نظام المنتجات غير محمل', 'error');
            return;
        }

        const product = productSystem.getProduct(productId);
        if (!product) {
            this.showNotification('المنتج غير موجود', 'error');
            return;
        }

        if (!product.inStock) {
            this.showNotification('هذا المنتج غير متوفر حالياً', 'warning');
            return;
        }

        // البحث عن المنتج في العربة
        const existingItem = this.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                productId: productId,
                product: product,
                quantity: quantity,
                price: product.price,
                addedAt: new Date().toISOString()
            });
        }

        this.calculateTotal();
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`تم إضافة ${product.name} إلى العربة`, 'success');
    }

    // إزالة منتج من العربة
    removeItem(productId) {
        const itemIndex = this.items.findIndex(item => item.productId === productId);
        if (itemIndex > -1) {
            const removedItem = this.items[itemIndex];
            this.items.splice(itemIndex, 1);
            this.calculateTotal();
            this.saveCart();
            this.updateCartDisplay();
            this.showNotification(`تم إزالة ${removedItem.product.name} من العربة`, 'info');
        }
    }

    // تحديث كمية منتج
    updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeItem(productId);
            return;
        }

        // تعيين حد أقصى للكمية
        if (newQuantity > 99) {
            newQuantity = 99;
            this.showNotification('الحد الأقصى للكمية هو 99', 'warning');
        }

        const item = this.items.find(item => item.productId === productId);
        if (item) {
            const oldQuantity = item.quantity;
            item.quantity = parseInt(newQuantity);
            this.calculateTotal();
            this.saveCart();
            this.updateCartDisplay();
            
            // إظهار رسالة تأكيد
            const change = item.quantity - oldQuantity;
            if (change > 0) {
                this.showNotification(`تم زيادة كمية ${item.product.name}`, 'success');
            } else if (change < 0) {
                this.showNotification(`تم تقليل كمية ${item.product.name}`, 'info');
            }
        }
    }
    
    // زيادة كمية منتج
    increaseQuantity(productId) {
        const item = this.items.find(item => item.productId === productId);
        if (item) {
            this.updateQuantity(productId, item.quantity + 1);
        }
    }
    
    // تقليل كمية منتج
    decreaseQuantity(productId) {
        const item = this.items.find(item => item.productId === productId);
        if (item) {
            this.updateQuantity(productId, item.quantity - 1);
        }
    }
    
    // تحديث الكمية من حقل الإدخال
    updateQuantityFromInput(productId, value) {
        const quantity = parseInt(value);
        if (isNaN(quantity) || quantity < 1) {
            // إعادة تعيين القيمة إلى الكمية الحالية
            const item = this.items.find(item => item.productId === productId);
            if (item) {
                const input = document.querySelector(`input[onchange*="${productId}"]`);
                if (input) input.value = item.quantity;
            }
            this.showNotification('يرجى إدخال كمية صحيحة', 'warning');
            return;
        }
        this.updateQuantity(productId, quantity);
    }
    
    // التعامل مع الضغط على المفاتيح في حقل الكمية
    handleQuantityKeyPress(event) {
        // السماح بالأرقام والمفاتيح الخاصة فقط
        const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
        return allowedKeys.includes(event.key);
    }

    // حساب المجموع الكلي
    calculateTotal() {
        this.total = this.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
    }

    // تحديث عرض العربة
    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartModal();
        this.updateCartPageDisplay();
        
        // تحديث زر "تسوق الآن" في الصفحة الرئيسية
        if (typeof window.updateShopNowButton === 'function') {
            window.updateShopNowButton();
        }
    }

    // تحديث عدد المنتجات في العربة
    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    // تحديث محتوى مودال العربة
    updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');

        if (!cartItems || !cartSummary) return;

        if (this.items.length === 0) {
            cartItems.innerHTML = this.getEmptyCartHTML();
            cartSummary.innerHTML = '';
            return;
        }

        cartItems.innerHTML = this.items.map(item => this.createCartItemHTML(item)).join('');
        cartSummary.innerHTML = this.createCartSummaryHTML();
    }

    // إنشاء HTML لعنصر في العربة
    createCartItemHTML(item) {
        const product = item.product;
        const subtotal = item.price * item.quantity;
        
        // تحديد المسار الصحيح للصورة حسب الصفحة الحالية
        let productImageSrc = '';
        if (product.images && product.images.length > 0) {
            const currentPath = window.location.pathname;
            // إذا كنا في مجلد pages، نحتاج لإضافة ../
            if (currentPath.includes('/pages/')) {
                productImageSrc = `../${product.images[0]}`;
            } else {
                productImageSrc = product.images[0];
            }
        }
        
        const productImage = productImageSrc 
            ? `<img src="${productImageSrc}" alt="${product.name}" class="cart-item-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        
        const noImagePlaceholder = `<div class="cart-item-image no-image" ${productImageSrc ? 'style="display:none;"' : ''}><i class="fas fa-image"></i></div>`;

        return `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="cart-item-image-container">
                    ${productImage}
                    ${noImagePlaceholder}
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${product.name}</h4>
                    <p class="cart-item-price">السعر: ${this.formatPrice(item.price)}</p>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease-btn" onclick="cart.decreaseQuantity('${item.productId}')" ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" 
                                   onchange="cart.updateQuantityFromInput('${item.productId}', this.value)" 
                                   onkeypress="return cart.handleQuantityKeyPress(event)">
                            <button class="quantity-btn increase-btn" onclick="cart.increaseQuantity('${item.productId}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-btn" onclick="cart.removeItem('${item.productId}')">
                            <i class="fas fa-trash"></i>
                            إزالة
                        </button>
                    </div>
                    <div class="cart-item-subtotal">المجموع: ${this.formatPrice(subtotal)}</div>
                </div>
            </div>
        `;
    }

    // إنشاء HTML لملخص العربة
    createCartSummaryHTML() {
        const itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
        
        return `
            <div class="cart-summary-content">
                <div class="customer-info-section">
                    <h4><i class="fas fa-user"></i> معلومات العميل</h4>
                    <div class="form-group">
                        <label for="customerName">الاسم الكامل *</label>
                        <input type="text" id="customerName" placeholder="أدخل اسمك الكامل" required>
                    </div>
                    <div class="form-group">
                        <label for="customerAddress">العنوان *</label>
                        <textarea id="customerAddress" placeholder="أدخل عنوانك بالتفصيل" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="customerPhone">رقم الهاتف (اختياري)</label>
                        <input type="tel" id="customerPhone" placeholder="09xxxxxxxx">
                    </div>
                </div>
                
                <div class="order-summary-section">
                    <h4><i class="fas fa-receipt"></i> ملخص الطلب</h4>
                    <div class="summary-row">
                        <span>عدد المنتجات:</span>
                        <span>${itemsCount}</span>
                    </div>
                    <div class="summary-row">
                        <span>المجموع الفرعي:</span>
                        <span>${this.formatPrice(this.total)}</span>
                    </div>
                    <div class="summary-row total-row">
                        <span><strong>المجموع الكلي:</strong></span>
                        <span><strong>${this.formatPrice(this.total)}</strong></span>
                    </div>
                </div>
                
                <div class="cart-actions">
                    <button class="btn btn-primary btn-large" onclick="cart.checkout()">
                        <i class="fab fa-whatsapp"></i>
                        إتمام الشراء عبر واتساب
                    </button>
                    <button class="btn btn-secondary clear-cart-btn" onclick="cart.clearCart()">
                        <i class="fas fa-trash"></i>
                        تفريغ العربة
                    </button>
                </div>
            </div>
        `;
    }

    // إنشاء HTML للعربة الفارغة
    getEmptyCartHTML() {
        // في صفحة العربة، لا نعرض زر "تصفح المنتجات" الأزرق
        if (window.location.pathname.includes('cart.html')) {
            return `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>عربة التسوق فارغة</h3>
                    <p>لم تضف أي منتجات بعد</p>
                </div>
            `;
        }
        
        // في المودال أو الصفحات الأخرى، نعرض الزر
        return `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>عربة التسوق فارغة</h3>
                <p>لم تضف أي منتجات بعد</p>
                <button class="btn btn-primary" onclick="cart.closeModal()">
                    <i class="fas fa-shopping-bag"></i>
                    تصفح المنتجات
                </button>
            </div>
        `;
    }

    // إتمام الشراء
    checkout() {
        if (this.items.length === 0) {
            this.showNotification('العربة فارغة', 'warning');
            return;
        }

        // التحقق من معلومات العميل
        const customerName = document.getElementById('customerName')?.value.trim();
        const customerAddress = document.getElementById('customerAddress')?.value.trim();
        const customerPhone = document.getElementById('customerPhone')?.value.trim();

        if (!customerName) {
            this.showNotification('يرجى إدخال الاسم الكامل', 'warning');
            document.getElementById('customerName')?.focus();
            return;
        }

        if (!customerAddress) {
            this.showNotification('يرجى إدخال العنوان', 'warning');
            document.getElementById('customerAddress')?.focus();
            return;
        }

        // إنشاء رسالة واتساب
        const whatsappMessage = this.createWhatsAppMessage(customerName, customerAddress, customerPhone);
        
        // إنشاء ملخص الطلب
        const orderSummary = {
            items: this.items,
            total: this.total,
            customerInfo: {
                name: customerName,
                address: customerAddress,
                phone: customerPhone
            },
            orderDate: new Date().toISOString(),
            orderId: 'ORD-' + Date.now()
        };

        // حفظ الطلب
        this.saveOrder(orderSummary);
        
        // فتح واتساب
        const whatsappUrl = `https://wa.me/218944661136?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
        
        // إظهار رسالة نجاح
        this.showNotification('تم توجيهك إلى واتساب لإتمام الطلب', 'success');
        
        // تفريغ العربة بعد 3 ثوان
        setTimeout(() => {
            this.clearCart();
        }, 3000);
    }

    // إنشاء رسالة واتساب
    createWhatsAppMessage(customerName, customerAddress, customerPhone) {
        let message = `🛒 *طلب جديد لـ Full Store*\n\n`;
        message += `👤 *اسم العميل:* ${customerName}\n`;
        message += `📍 *العنوان:* ${customerAddress}\n`;
        
        if (customerPhone) {
            message += `📞 *رقم الهاتف:* ${customerPhone}\n`;
        }
        
        message += `\n📦 *تفاصيل الطلب:*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        
        this.items.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            message += `${index + 1}. *${item.product.name}*\n`;
            message += `   الكمية: ${item.quantity}\n`;
            message += `   السعر: ${this.formatPrice(item.price)}\n`;
            message += `   المجموع: ${this.formatPrice(subtotal)}\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *المجموع الكلي: ${this.formatPrice(this.total)}*\n`;
        message += `📅 *تاريخ الطلب:* ${new Date().toLocaleDateString('en-US')}\n`;
        message += `🕐 *وقت الطلب:* ${new Date().toLocaleTimeString('en-US')}\n\n`;
        message += `شكراً لاختيارك Full Store! `;
        
        return message;
    }

    // حفظ الطلب
    saveOrder(order) {
        let orders = [];
        const savedOrders = localStorage.getItem('fullstore_orders');
        if (savedOrders) {
            try {
                orders = JSON.parse(savedOrders);
            } catch (error) {
                console.error('خطأ في تحميل الطلبات:', error);
            }
        }
        
        orders.unshift(order);
        // احتفظ بآخر 10 طلبات فقط
        if (orders.length > 10) {
            orders = orders.slice(0, 10);
        }
        
        localStorage.setItem('fullstore_orders', JSON.stringify(orders));
    }

    // تفريغ العربة
    clearCart() {
        this.items = [];
        this.total = 0;
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('تم تفريغ العربة', 'info');
    }

    // تصفير العربة عند انتهاء الجلسة
    clearCartOnSessionEnd() {
        // مراقبة إغلاق النافذة أو التبويب
        window.addEventListener('beforeunload', () => {
            // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
            // مثل حفظ العربة في الخادم قبل المسح
        });

        // مراقبة عدم النشاط لفترة طويلة (30 دقيقة)
        let inactivityTimer;
        const inactivityTime = 30 * 60 * 1000; // 30 دقيقة

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (this.items.length > 0) {
                    this.showNotification('تم تصفير العربة بسبب عدم النشاط', 'info');
                    this.clearCart();
                }
            }, inactivityTime);
        };

        // إعادة تعيين المؤقت عند أي نشاط
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // بدء المؤقت
        resetTimer();
    }

    // عرض مودال العربة أو التوجه لصفحة العربة
    showModal() {
        // إذا كنا في صفحة العربة، لا نحتاج لفعل شيء
        if (window.location.pathname.includes('cart.html')) {
            return;
        }
        
        // التوجه لصفحة العربة
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            window.location.href = 'cart.html';
        } else {
            window.location.href = 'pages/cart.html';
        }
    }

    // إغلاق مودال العربة (للتوافق مع الكود القديم)
    closeModal() {
        // لا نحتاج لهذا في النظام الجديد
    }

    // تحديث عرض العربة في الصفحة المنفصلة
    updateCartPageDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const continueShopping = document.getElementById('continueShopping');

        if (!cartItems || !cartSummary) return;

        if (this.items.length === 0) {
            cartItems.innerHTML = this.getEmptyCartHTML();
            cartSummary.innerHTML = '';
            // إخفاء زر "متابعة التسوق" عندما تكون العربة فارغة
            if (continueShopping) {
                continueShopping.style.display = 'none';
            }
            return;
        }

        cartItems.innerHTML = this.items.map(item => this.createCartItemHTML(item)).join('');
        cartSummary.innerHTML = this.createCartSummaryHTML();
        // إظهار زر "متابعة التسوق" عندما تحتوي العربة على منتجات
        if (continueShopping) {
            continueShopping.style.display = 'block';
        }
    }

    // تنسيق السعر
    formatPrice(price) {
        return `${price.toLocaleString('ar-EG')} د.ل`;
    }

    // عرض إشعار
    showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        // إضافة الأنماط إذا لم تكن موجودة
        this.addNotificationStyles();

        // إضافة الإشعار إلى الصفحة
        document.body.appendChild(notification);

        // إظهار الإشعار
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // إخفاء الإشعار بعد 3 ثوان
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // إضافة أنماط الإشعارات
    addNotificationStyles() {
        if (document.getElementById('notificationStyles')) return;

        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ffffff, #f8f9fa);
                padding: 1.2rem 1.8rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
                display: flex;
                align-items: center;
                gap: 0.8rem;
                z-index: 10000;
                transform: translateX(400px) scale(0.9);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                max-width: 380px;
                font-weight: 500;
                border: 1px solid rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
                font-family: 'Cairo', sans-serif;
            }

            .notification.show {
                transform: translateX(0) scale(1);
                opacity: 1;
            }

            .notification i {
                font-size: 1.2rem;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .notification-success {
                background: linear-gradient(135deg, #e8f5e8, #f0f9f0);
                border-left: 4px solid #51cf66;
                color: #2b8a3e;
            }

            .notification-success i {
                background: #51cf66;
                color: white;
            }

            .notification-error {
                background: linear-gradient(135deg, #ffe0e0, #fff0f0);
                border-left: 4px solid #ff6b6b;
                color: #c92a2a;
            }

            .notification-error i {
                background: #ff6b6b;
                color: white;
            }

            .notification-warning {
                background: linear-gradient(135deg, #fff8e1, #fffbf0);
                border-left: 4px solid #ffd43b;
                color: #e67700;
            }

            .notification-warning i {
                background: #ffd43b;
                color: #333;
            }

            .notification-info {
                background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                border-left: 4px solid #339af0;
                color: #1971c2;
            }

            .notification-info i {
                background: #339af0;
                color: white;
            }

            .notification span {
                flex: 1;
                font-size: 0.95rem;
                line-height: 1.4;
            }

            @media (max-width: 480px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    transform: translateY(-100px) scale(0.9);
                    padding: 1rem 1.2rem;
                }

                .notification.show {
                    transform: translateY(0) scale(1);
                }

                .notification span {
                    font-size: 0.9rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // زر العربة
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.showModal();
            });
        }

        // إغلاق مودال العربة
        const cartModalClose = document.getElementById('cartModalClose');
        const cartModal = document.getElementById('cartModal');
        
        if (cartModalClose) {
            cartModalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target === cartModal) {
                    this.closeModal();
                }
            });
        }
    }

    // الحصول على عدد المنتجات
    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // الحصول على المجموع
    getTotal() {
        return this.total;
    }
}

// تهيئة نظام العربة
let cart;

document.addEventListener('DOMContentLoaded', () => {
    cart = new CartSystem();
});