/**
 * Admin Panel API Client
 * يتعامل مع Backend API لحفظ المنتجات في الملفات
 */

// Configuration
const API_BASE_URL = window.location.origin;
const API_ENDPOINTS = {
    products: `${API_BASE_URL}/api/products`,
    uploadImages: `${API_BASE_URL}/api/upload-images`,
    stats: `${API_BASE_URL}/api/stats`
};

// Global Variables
let products = [];
let editingProductId = null;
let uploadedImageFiles = [];
let uploadedImagePaths = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    initializeTabs();
    initializeImageUpload();
    initializeForm();
});

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Image Upload
function initializeImageUpload() {
    const uploadZone = document.getElementById('imageUploadZone');
    const fileInput = document.getElementById('productImages');

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageSelection);

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary-color)';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
}

function handleImageSelection(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        uploadedImageFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const index = uploadedImageFiles.length - 1;
            displayImagePreview(e.target.result, index);
        };
        reader.readAsDataURL(file);
    });
}

function displayImagePreview(src, index) {
    const container = document.getElementById('imagePreviewContainer');
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.innerHTML = `
        <img src="${src}" alt="صورة المنتج">
        <button type="button" class="image-preview-remove" onclick="removeImage(${index})">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(preview);
}

function removeImage(index) {
    uploadedImageFiles.splice(index, 1);
    if (uploadedImagePaths[index]) {
        uploadedImagePaths.splice(index, 1);
    }
    
    // Refresh preview
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    uploadedImageFiles.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            displayImagePreview(e.target.result, i);
        };
        reader.readAsDataURL(file);
    });
}

// Form Management
function initializeForm() {
    const form = document.getElementById('productForm');
    form.addEventListener('submit', handleFormSubmit);

    // Auto-calculate discount
    const priceInput = document.getElementById('productPrice');
    const originalPriceInput = document.getElementById('productOriginalPrice');
    const discountInput = document.getElementById('productDiscount');

    const calculateDiscount = () => {
        const price = parseFloat(priceInput.value) || 0;
        const originalPrice = parseFloat(originalPriceInput.value) || 0;
        if (price && originalPrice && originalPrice > price) {
            const discount = ((originalPrice - price) / originalPrice * 100).toFixed(1);
            discountInput.value = discount;
        }
    };

    priceInput.addEventListener('input', calculateDiscount);
    originalPriceInput.addEventListener('input', calculateDiscount);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span> جاري الحفظ...';
    submitBtn.disabled = true;

    try {
        // Upload images first if there are new files
        if (uploadedImageFiles.length > 0) {
            const imagePaths = await uploadImages();
            if (imagePaths) {
                uploadedImagePaths = imagePaths;
            } else {
                throw new Error('فشل رفع الصور');
            }
        }

        // Validate
        if (uploadedImagePaths.length === 0 && !editingProductId) {
            showAlert('يرجى رفع صورة واحدة على الأقل', 'error');
            return;
        }

        // Collect form data
        const formData = collectFormData();

        // Save product
        if (editingProductId) {
            await updateProduct(editingProductId, formData);
            showAlert('تم تحديث المنتج بنجاح!', 'success');
        } else {
            await addProduct(formData);
            showAlert('تم إضافة المنتج بنجاح!', 'success');
        }

        // Reset form and reload
        resetForm();
        await loadProducts();
        updateStats();

    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'حدث خطأ أثناء حفظ المنتج', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function uploadImages() {
    const formData = new FormData();
    uploadedImageFiles.forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch(API_ENDPOINTS.uploadImages, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error uploading images:', error);
        return null;
    }
}

function collectFormData() {
    const showInPages = Array.from(document.querySelectorAll('input[name="showInPages"]:checked'))
        .map(cb => cb.value);

    const data = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        inStock: document.getElementById('productInStock').checked,
        featured: document.getElementById('productFeatured').checked,
        showInPages: showInPages,
        images: uploadedImagePaths
    };

    // Optional fields
    const originalPrice = parseFloat(document.getElementById('productOriginalPrice').value);
    if (originalPrice) data.originalPrice = originalPrice;

    const discount = parseFloat(document.getElementById('productDiscount').value);
    if (discount) data.discount = discount;

    const limitedQuantity = parseInt(document.getElementById('productLimitedQuantity').value);
    if (limitedQuantity) data.limitedQuantity = limitedQuantity;

    return data;
}

function resetForm() {
    document.getElementById('productForm').reset();
    uploadedImageFiles = [];
    uploadedImagePaths = [];
    document.getElementById('imagePreviewContainer').innerHTML = '';
    editingProductId = null;
    
    // Reset checkboxes to default
    document.getElementById('productInStock').checked = true;
    document.getElementById('productFeatured').checked = false;
    document.querySelectorAll('input[name="showInPages"]').forEach(cb => {
        cb.checked = cb.value === 'index' || cb.value === 'products';
    });
    
    // Reset buttons
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة المنتج';
    submitBtn.style.background = '';
    cancelBtn.style.display = 'none';
}

// API Functions

async function loadProducts() {
    try {
        const response = await fetch(API_ENDPOINTS.products);
        const result = await response.json();
        
        if (result.success) {
            products = result.data;
            renderProductsTable();
            updateStats();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('خطأ في تحميل المنتجات', 'error');
    }
}

async function addProduct(productData) {
    const response = await fetch(API_ENDPOINTS.products, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message);
    }
    
    return result.data;
}

async function updateProduct(id, productData) {
    const response = await fetch(`${API_ENDPOINTS.products}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message);
    }
    
    return result.data;
}

async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ سيتم حذف الصور أيضاً.')) {
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.products}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert('تم حذف المنتج بنجاح', 'success');
            await loadProducts();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('خطأ في حذف المنتج', 'error');
    }
}

// Stats Update
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('inStockProducts').textContent = products.filter(p => p.inStock).length;
    document.getElementById('featuredProducts').textContent = products.filter(p => p.featured).length;
    
    const categories = [...new Set(products.map(p => p.category))];
    document.getElementById('totalCategories').textContent = categories.length;
}

// Products Table
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: var(--text-muted);"></i>
                    <p style="margin-top: 1rem; color: var(--text-muted);">لا توجد منتجات حالياً</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td class="product-image-cell">
                <img src="${product.images && product.images[0] ? product.images[0] : 'images/placeholder.png'}" alt="${product.name}">
            </td>
            <td>${product.name}</td>
            <td>
                <span class="badge badge-info">${getCategoryName(product.category)}</span>
            </td>
            <td>${product.price} د.ل</td>
            <td>
                <span class="badge ${product.inStock ? 'badge-success' : 'badge-danger'}">
                    ${product.inStock ? 'متوفر' : 'غير متوفر'}
                </span>
            </td>
            <td>
                ${product.featured ? '<i class="fas fa-star" style="color: var(--warning-color);"></i>' : '-'}
            </td>
            <td>
                <div class="product-actions">
                    <button class="action-btn action-btn-edit" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                        تعديل
                    </button>
                    <button class="action-btn action-btn-delete" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                        حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;

    // Fill form
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOriginalPrice').value = product.originalPrice || '';
    document.getElementById('productDiscount').value = product.discount || '';
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productLimitedQuantity').value = product.limitedQuantity || '';
    document.getElementById('productInStock').checked = product.inStock;
    document.getElementById('productFeatured').checked = product.featured;

    // Show in pages
    document.querySelectorAll('input[name="showInPages"]').forEach(cb => {
        cb.checked = product.showInPages && product.showInPages.includes(cb.value);
    });

    // Images
    uploadedImagePaths = product.images || [];
    uploadedImageFiles = [];
    document.getElementById('imagePreviewContainer').innerHTML = '';
    
    if (product.images && product.images.length > 0) {
        product.images.forEach((img, i) => {
            displayImagePreview(img, i);
        });
    }

    // Switch to add product tab
    document.querySelector('.tab-btn[data-tab="add-product"]').click();

    // Update buttons
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث المنتج';
    submitBtn.style.background = 'var(--warning-color)';
    cancelBtn.style.display = 'block';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showAlert('تم تحميل بيانات المنتج للتعديل', 'info');
}

// Utility Functions
function getCategoryName(category) {
    const categories = {
        'electronics': 'إلكترونيات',
        'tools': 'أدوات',
        'clothes': 'ملابس',
        'random': 'متنوعة'
    };
    return categories[category] || category;
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle';
    
    alert.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}
