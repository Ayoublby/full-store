/**
 * Backend Server - Full Store Admin Panel
 * Node.js + Express + File System Storage
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

// Ensure necessary directories exist
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const IMAGES_DIR = path.join(__dirname, 'images', 'uploaded');

// Create directories if they don't exist
if (!fsSync.existsSync(IMAGES_DIR)) {
    fsSync.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Initialize products.json if it doesn't exist
if (!fsSync.existsSync(PRODUCTS_FILE)) {
    fsSync.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('الصور المسموحة فقط: JPG, PNG, GIF, WebP'));
        }
    }
});

// Helper functions
async function readProducts() {
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products:', error);
        return [];
    }
}

async function writeProducts(products) {
    try {
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing products:', error);
        return false;
    }
}

async function updateProductsDataJS(products) {
    try {
        const jsContent = `/**
 * بيانات المنتجات - Full Store
 * تم التحديث تلقائياً: ${new Date().toLocaleString('ar-EG')}
 */

const storeProducts = ${JSON.stringify(products, null, 4)};

// لا تغير هذا السطر - مطلوب لعمل النظام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storeProducts;
}`;
        
        const productsDataFile = path.join(__dirname, 'products-data.js');
        await fs.writeFile(productsDataFile, jsContent);
        return true;
    } catch (error) {
        console.error('Error updating products-data.js:', error);
        return false;
    }
}

// API Routes

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await readProducts();
        res.json({
            success: true,
            data: products,
            total: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل المنتجات',
            error: error.message
        });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await readProducts();
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل المنتج',
            error: error.message
        });
    }
});

// Upload images
app.post('/api/upload-images', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لم يتم رفع أي صور'
            });
        }

        const imagePaths = req.files.map(file => `/images/uploaded/${file.filename}`);

        res.json({
            success: true,
            message: 'تم رفع الصور بنجاح',
            data: imagePaths
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في رفع الصور',
            error: error.message
        });
    }
});

// Add new product
app.post('/api/products', async (req, res) => {
    try {
        const products = await readProducts();
        const newProduct = {
            id: `product-${Date.now()}`,
            ...req.body,
            addedDate: new Date().toISOString()
        };

        products.push(newProduct);
        
        await writeProducts(products);
        await updateProductsDataJS(products);

        res.status(201).json({
            success: true,
            message: 'تم إضافة المنتج بنجاح',
            data: newProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة المنتج',
            error: error.message
        });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const products = await readProducts();
        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        products[index] = {
            ...products[index],
            ...req.body,
            id: req.params.id, // Preserve the ID
            updatedDate: new Date().toISOString()
        };

        await writeProducts(products);
        await updateProductsDataJS(products);

        res.json({
            success: true,
            message: 'تم تحديث المنتج بنجاح',
            data: products[index]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث المنتج',
            error: error.message
        });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const products = await readProducts();
        const product = products.find(p => p.id === req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        // Delete product images from disk
        if (product.images && Array.isArray(product.images)) {
            for (const imagePath of product.images) {
                if (imagePath.startsWith('/images/uploaded/')) {
                    const fullPath = path.join(__dirname, imagePath);
                    try {
                        await fs.unlink(fullPath);
                    } catch (err) {
                        console.error(`Error deleting image: ${fullPath}`, err);
                    }
                }
            }
        }

        const updatedProducts = products.filter(p => p.id !== req.params.id);
        
        await writeProducts(updatedProducts);
        await updateProductsDataJS(updatedProducts);

        res.json({
            success: true,
            message: 'تم حذف المنتج بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف المنتج',
            error: error.message
        });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const products = await readProducts();
        
        const stats = {
            total: products.length,
            inStock: products.filter(p => p.inStock).length,
            outOfStock: products.filter(p => !p.inStock).length,
            featured: products.filter(p => p.featured).length,
            categories: [...new Set(products.map(p => p.category))].length,
            byCategory: {}
        };

        // Count by category
        products.forEach(p => {
            if (!stats.byCategory[p.category]) {
                stats.byCategory[p.category] = 0;
            }
            stats.byCategory[p.category]++;
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل الإحصائيات',
            error: error.message
        });
    }
});

// Bulk operations
app.post('/api/products/bulk-update', async (req, res) => {
    try {
        const { ids, updates } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد منتجات للتحديث'
            });
        }

        const products = await readProducts();
        let updatedCount = 0;

        products.forEach((product, index) => {
            if (ids.includes(product.id)) {
                products[index] = {
                    ...product,
                    ...updates,
                    id: product.id,
                    updatedDate: new Date().toISOString()
                };
                updatedCount++;
            }
        });

        await writeProducts(products);
        await updateProductsDataJS(products);

        res.json({
            success: true,
            message: `تم تحديث ${updatedCount} منتج`,
            data: { updatedCount }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في التحديث الجماعي',
            error: error.message
        });
    }
});

app.delete('/api/products/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد منتجات للحذف'
            });
        }

        const products = await readProducts();
        const productsToDelete = products.filter(p => ids.includes(p.id));

        // Delete images
        for (const product of productsToDelete) {
            if (product.images && Array.isArray(product.images)) {
                for (const imagePath of product.images) {
                    if (imagePath.startsWith('/images/uploaded/')) {
                        const fullPath = path.join(__dirname, imagePath);
                        try {
                            await fs.unlink(fullPath);
                        } catch (err) {
                            console.error(`Error deleting image: ${fullPath}`, err);
                        }
                    }
                }
            }
        }

        const updatedProducts = products.filter(p => !ids.includes(p.id));
        
        await writeProducts(updatedProducts);
        await updateProductsDataJS(updatedProducts);

        res.json({
            success: true,
            message: `تم حذف ${productsToDelete.length} منتج`,
            data: { deletedCount: productsToDelete.length }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في الحذف الجماعي',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Full Store Backend Server            ║
║   يعمل على: http://localhost:${PORT}     ║
║                                        ║
║   API Endpoints:                       ║
║   GET    /api/products                 ║
║   GET    /api/products/:id             ║
║   POST   /api/products                 ║
║   PUT    /api/products/:id             ║
║   DELETE /api/products/:id             ║
║   POST   /api/upload-images            ║
║   GET    /api/stats                    ║
║                                        ║
║   Admin Panel:                         ║
║   http://localhost:${PORT}/admin-dashboard-xyz.html
╚════════════════════════════════════════╝
    `);
});

module.exports = app;
