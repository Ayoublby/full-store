/**
 * نظام إدارة المنتجات المحسن - Full Store
 * نظام محسن لعرض وإدارة المنتجات بدون تكرار وبأداء أفضل
 */

class EnhancedProductSystem {
    constructor() {
        this.products = [];
        this.displayedProducts = new Set(); // لمنع التكرار
        this.currentPage = '';
        this.categories = {
            'electronics': 'إلكترونيات',
            'tools': 'أدوات',
            'clothes': 'ملابس',
            'random': 'متنوعة'
        };
        this.init();
    }

    init() {
        this.currentPage = this.getCurrentPageName();
        this.loadProducts();
        this.setupEventListeners();
    }

    // تحميل المنتجات من ملف البيانات
    loadProducts() {
        if (typeof storeProducts !== 'undefined') {
            this.products = [...storeProducts];
            this.displayProducts();
        } else {
            console.error('ملف products-data.js غير محمل بشكل صحيح');
        }
    }

    // الحصول على اسم الصفحة الحالية
    getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        return fileName.split('.').shift() || 'index';
    }

    // عرض المنتجات حسب الصفحة والفلاتر
    displayProducts(category = 'all', searchTerm = '', sortBy = 'newest') {
        const productsGrid = document.getElementById("productsGrid");
        const loading = document.getElementById("productsLoading");
        const noProducts = document.getElementById("noProducts");

        if (!productsGrid) return;

        // إظهار حالة التحميل
        this.showLoading(true);
        
        setTimeout(() => {
            this.showLoading(false);
            
            // مسح المنتجات المعروضة حاليا
            productsGrid.innerHTML = "";
            this.displayedProducts.clear();

            // فلترة المنتجات
            let filteredProducts = this.filterProducts(category, searchTerm, sortBy);
            
            // فلترة حسب الصفحة الحالية
            filteredProducts = this.filterByPage(filteredProducts);

            if (filteredProducts.length === 0) {
                this.showNoProducts(true);
                return;
            }

            this.showNoProducts(false);
            
            // عرض المنتجات
            filteredProducts.forEach(product => {
                if (!this.displayedProducts.has(product.id)) {
                    const productCard = this.createProductCard(product);
                    productsGrid.appendChild(productCard);
                    this.displayedProducts.add(product.id);
                }
            });

        }, 300);
    }

    // فلترة المنتجات
    filterProducts(category, searchTerm, sortBy) {
        let filtered = [...this.products];

        // فلترة حسب الفئة
        if (category && category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        // فلترة حسب البحث
        if (searchTerm && searchTerm.length > 0) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(p => {
                const nameMatch = p.name && p.name.toLowerCase().includes(term);
                const descMatch = p.description && p.description.toLowerCase().includes(term);
                const categoryMatch = this.categories[p.category] && this.categories[p.category].toLowerCase().includes(term);
                return nameMatch || descMatch || categoryMatch;
            });
        }

        // ترتيب المنتجات
        filtered = this.sortProducts(filtered, sortBy);

        return filtered;
    }

    // فلترة حسب الصفحة
    filterByPage(products) {
        return products.filter(product => {
            if (!product.showInPages || !Array.isArray(product.showInPages)) {
                return true; // اعرض في جميع الصفحات إذا لم تكن محددة
            }
            return product.showInPages.includes(this.currentPage);
        });
    }

    // ترتيب المنتجات
    sortProducts(products, sortBy) {
        if (!products || products.length === 0) return [];
        
        const sortedProducts = [...products];
        
        switch (sortBy) {
            case 'price-low':
                return sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price-high':
                return sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            case 'name':
                return sortedProducts.sort((a, b) => {
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    return nameA.localeCompare(nameB, 'ar');
                });
            case 'featured':
                return sortedProducts.sort((a, b) => {
                    const featuredA = a.featured ? 1 : 0;
                    const featuredB = b.featured ? 1 : 0;
                    if (featuredA !== featuredB) {
                        return featuredB - featuredA; // المميزة أولاً
                    }
                    // إذا كانت نفس الحالة، رتب حسب الاسم
                    return (a.name || '').localeCompare(b.name || '', 'ar');
                });
            case 'date':
                return sortedProducts.sort((a, b) => {
                    const dateA = a.addedDate ? new Date(a.addedDate) : new Date(0);
                    const dateB = b.addedDate ? new Date(b.addedDate) : new Date(0);
                    return dateB - dateA; // الأحدث أولاً
                });
            case 'newest':
            default:
                return sortedProducts.sort((a, b) => {
                    const dateA = a.addedDate || a.createdAt ? new Date(a.addedDate || a.createdAt) : new Date(0);
                    const dateB = b.addedDate || b.createdAt ? new Date(b.addedDate || b.createdAt) : new Date(0);
                    return dateB - dateA;
                });
        }
    }

    // إنشاء بطاقة منتج محسنة
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;

        // معالجة الصور
        const productImage = this.getProductImage(product);
        const categoryName = this.categories[product.category] || product.category;
        
        // معالجة الأسعار والخصومات
        const priceInfo = this.getPriceInfo(product);
        
        const stockStatus = product.inStock ? 'متوفر' : 'غير متوفر';
        const stockClass = product.inStock ? 'in-stock' : 'out-of-stock';
        
        // شارات المنتج (مميز، خصم، كمية محدودة)
        const badges = this.getProductBadges(product);

        card.innerHTML = `
            ${badges}
            <div class="product-image-container">
                ${productImage}
                <div class="product-overlay">
                    <button class="btn btn-primary btn-sm" onclick="productSystem.addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="productSystem.showProductDetails('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${categoryName}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${this.truncateText(product.description, 100)}</p>
                <div class="product-footer">
                    ${priceInfo}
                    <div class="stock-status ${stockClass}">
                        <i class="fas fa-${product.inStock ? 'check-circle' : 'times-circle'}"></i>
                        ${stockStatus}
                    </div>
                </div>
                ${this.getLimitedQuantityInfo(product)}
            </div>
        `;

        // إضافة تأثيرات تفاعلية
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });

        return card;
    }

    // الحصول على معلومات السعر مع الخصم
    getPriceInfo(product) {
        if (product.originalPrice && product.discount) {
            const originalPrice = this.formatPrice(product.originalPrice);
            const currentPrice = this.formatPrice(product.price);
            return `
                <div class="product-price-container">
                    <div class="product-price current">${currentPrice}</div>
                    <div class="product-price original">${originalPrice}</div>
                </div>
            `;
        } else {
            return `<div class="product-price">${this.formatPrice(product.price)}</div>`;
        }
    }

    // الحصول على شارات المنتج
    getProductBadges(product) {
        let badges = '';
        
        if (product.featured) {
            badges += '<div class="featured-badge"><i class="fas fa-star"></i> مميز</div>';
        }
        
        if (product.discount) {
            badges += `<div class="discount-badge">خصم ${product.discount}%</div>`;
        }
        
        return badges;
    }

    // الحصول على معلومات الكمية المحدودة (ستظهر في أسفل البطاقة)
    getLimitedQuantityInfo(product) {
        if (product.limitedQuantity) {
            return `<div class="limited-quantity-info">كمية محدودة: ${product.limitedQuantity} فقط</div>`;
        }
        return '';
    }

    // معالجة صور المنتج
    getProductImage(product) {
        if (product.images && product.images.length > 0) {
            // تحديد المسار الصحيح للصورة حسب الصفحة الحالية
            const imagePath = this.getCorrectImagePath(product.images[0]);
            return `<img src="${imagePath}" alt="${product.name}" class="product-image" loading="lazy">`;
        } else {
            return `<div class="product-image no-image"><i class="fas fa-image"></i></div>`;
        }
    }

    // تحديد المسار الصحيح للصورة حسب الصفحة الحالية
    getCorrectImagePath(originalPath) {
        const currentPath = window.location.pathname;
        
        // إذا كنا في مجلد pages، نحتاج لإضافة ../
        if (currentPath.includes('/pages/')) {
            return `../${originalPath}`;
        }
        
        // إذا كنا في الصفحة الرئيسية، نستخدم المسار كما هو
        return originalPath;
    }

    // اقتطاع النص
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // تنسيق السعر
    formatPrice(price) {
        return `${price.toLocaleString('ar-EG')} د.ل`;
    }

    // إضافة إلى العربة
    addToCart(productId) {
        const product = this.getProduct(productId);
        if (!product) return;

        if (!product.inStock) {
            this.showNotification('هذا المنتج غير متوفر حالياً', 'warning');
            return;
        }

        // استدعاء نظام العربة إذا كان متوفر
        if (typeof cart !== 'undefined') {
            cart.addItem(productId);
        } else {
            this.showNotification('تم إضافة المنتج إلى العربة', 'success');
        }
    }

    // الحصول على منتج بواسطة ID
    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }

    // عرض تفاصيل المنتج
    showProductDetails(productId) {
        const product = this.getProduct(productId);
        if (!product) return;

        const modal = document.getElementById('productModal');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalBody) return;

        this.renderProductModal(product, modalBody);
        modal.classList.add('active');
    }

    // رندر مودال المنتج
    renderProductModal(product, modalBody) {
        const categoryName = this.categories[product.category] || product.category;
        const formattedPrice = this.formatPrice(product.price);
        const featuredBadge = product.featured ? '<span class="featured-text"><i class="fas fa-star"></i> منتج مميز</span>' : '';

        // معالجة الصور
        let imagesHtml = this.renderProductImages(product);

        modalBody.innerHTML = `
            <div class="product-details">
                ${imagesHtml}
                <div class="product-info-detailed">
                    <div class="product-header">
                        <div class="product-category-badge">${categoryName}</div>
                        ${featuredBadge}
                    </div>
                    <h2 class="product-name">${product.name}</h2>
                    <p class="product-description-full">${product.description}</p>
                    
                    <div class="product-specs">
                        <div class="spec-item">
                            <i class="fas fa-tag"></i>
                            <span>الفئة: ${categoryName}</span>
                        </div>
                        <div class="spec-item ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                            <i class="fas fa-${product.inStock ? 'check-circle' : 'times-circle'}"></i>
                            <span>${product.inStock ? 'متوفر في المخزن' : 'غير متوفر حالياً'}</span>
                        </div>
                        <div class="spec-item">
                            <i class="fas fa-calendar-plus"></i>
                            <span>تاريخ الإضافة: ${this.getProductAddedDate(product)}</span>
                        </div>
                    </div>

                    <div class="price-section">
                        <div class="current-price">${formattedPrice}</div>
                        <div class="price-note">* الأسعار شاملة الضريبة</div>
                    </div>

                    <div class="product-actions-detailed">
                        ${product.inStock ? `
                            <button class="btn btn-primary btn-large" onclick="productSystem.addToCart('${product.id}'); productSystem.closeModal();">
                                <i class="fas fa-cart-plus"></i>
                                أضف إلى العربة
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-large" disabled>
                                <i class="fas fa-times"></i>
                                غير متوفر حالياً
                            </button>
                        `}
                        <button class="btn btn-secondary" onclick="productSystem.shareProduct('${product.id}')">
                            <i class="fas fa-share-alt"></i>
                            مشاركة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // رندر صور المنتج في المودال
    renderProductImages(product) {
        if (product.images && product.images.length > 0) {
            const mainImagePath = this.getCorrectImagePath(product.images[0]);
            return `
                <div class="product-images">
                    <div class="main-image">
                        <img src="${mainImagePath}" alt="${product.name}" id="mainProductImage">
                    </div>
                    ${product.images.length > 1 ? `
                        <div class="image-thumbnails">
                            ${product.images.map((img, index) => {
                                const imagePath = this.getCorrectImagePath(img);
                                return `
                                    <img src="${imagePath}" alt="${product.name}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                                         onclick="productSystem.changeMainImage('${imagePath}')">
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            return `
                <div class="product-images">
                    <div class="main-image no-image">
                        <i class="fas fa-image"></i>
                        <p>لا توجد صور</p>
                    </div>
                </div>
            `;
        }
    }

    // تغيير الصورة الرئيسية
    changeMainImage(imageSrc) {
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = imageSrc;
        }

        // تحديث الصور المصغرة
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumb => {
            thumb.classList.remove('active');
            if (thumb.src === imageSrc) {
                thumb.classList.add('active');
            }
        });
    }

    // مشاركة المنتج
    shareProduct(productId) {
        const product = this.getProduct(productId);
        if (!product) return;

        const shareText = `تفضل منتج رائع من Full Store: ${product.name} - ${this.formatPrice(product.price)}`;
        const shareUrl = `${window.location.origin}?product=${productId}`;

        if (navigator.share) {
            navigator.share({
                title: product.name,
                text: shareText,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showNotification('تم نسخ رابط المنتج إلى الحافظة', 'success');
            });
        }
    }

    // إغلاق المودال
    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // عرض/إخفاء حالة التحميل
    showLoading(show) {
        const loading = document.getElementById("productsLoading");
        if (loading) {
            loading.style.display = show ? "block" : "none";
        }
    }

    // عرض/إخفاء رسالة عدم وجود منتجات
    showNoProducts(show) {
        const noProducts = document.getElementById("noProducts");
        if (noProducts) {
            noProducts.style.display = show ? "block" : "none";
        }
    }

    // عرض إشعار
    showNotification(message, type = 'info') {
        // يمكن تحسين هذا لاحقاً بإضافة نظام إشعارات متقدم
        const alertClass = type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
        alert(message); // مؤقت - يمكن استبداله بنظام إشعارات أفضل
    }

    // إعداد المستمعين للأحداث
    setupEventListeners() {
        // البحث
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch();
                }, 300);
            });
            
            // البحث عند الضغط على Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // فلاتر
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.performSearch();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.performSearch();
            });
        }

        // إغلاق المودال
        const modalClose = document.getElementById('modalClose');
        const productModal = document.getElementById('productModal');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (productModal) {
            productModal.addEventListener('click', (e) => {
                if (e.target === productModal) {
                    this.closeModal();
                }
            });
        }
    }

    // تنفيذ البحث والتصفية
    performSearch() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');

        const searchTerm = searchInput ? searchInput.value.trim() : '';
        const category = categoryFilter ? categoryFilter.value : 'all';
        const sortBy = sortFilter ? sortFilter.value : 'newest';

        this.displayProducts(category, searchTerm, sortBy);
    }

    // إعادة تحميل المنتجات (للاستخدام بعد إضافة منتجات جديدة)
    refresh() {
        this.loadProducts();
    }

    // الحصول على تاريخ إضافة المنتج
    getProductAddedDate(product) {
        // إذا كان المنتج يحتوي على تاريخ إضافة محدد
        if (product.addedDate) {
            return this.formatDate(product.addedDate);
        }
        
        // إذا لم يكن هناك تاريخ محدد، نستخدم تاريخ افتراضي حسب معرف المنتج
        const productIndex = this.products.findIndex(p => p.id === product.id);
        const baseDate = new Date('2024-01-01');
        baseDate.setDate(baseDate.getDate() + productIndex * 7); // إضافة أسبوع لكل منتج
        
        return this.formatDate(baseDate.toISOString());
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// تهيئة النظام
let productSystem;

document.addEventListener('DOMContentLoaded', () => {
    productSystem = new EnhancedProductSystem();
});