/**
 * بيانات المنتجات - Full Store
 * اضف منتجاتك هنا باتباع النموذج المحدد
 */


const storeProducts = [
    // نموذج لمنتج - يمكنك نسخ هذا النموذج واضافة منتجات جديدة
    {
        id: 'product-1',
        name: 'شاحن شاوي بقدرة 90W',
        description: 'شاحن شاومي أصلي بقدرة 90W ، يدعم الشحن السريع، متوافق مع هواتف Xiaomi و Redmi',
        price: 70,
        originalPrice: 90, // السعر الأصلي قبل الخصم
        discount: 22.2, // نسبة الخصم بالمئة
        category: 'electronics', // electronics, tools, clothes, random
        images: [
            'images/electronics/1-1.jpg',
            'images/electronics/1-2.jpg',
            'images/electronics/1-3.jpg',

            
        ],
        inStock: true,
        limitedQuantity: 5, // كمية محدودة
        showInPages: ['index', 'products', 'electronics'], // الصفحات التي سيظهر فيها المنتج
        featured: true, // منتج مميز
        addedDate: '2025-10-05T21:45:00Z' // تاريخ إضافة المنتج
    },
    
    {
        id: 'product-2',
        name: 'ساعة Quartz',
        description: 'ساعة Quartz بتصميم بسيط للرجال، خفيفة الوزن وبسوار بلاستيكي مقاوم للماء، مناسبة للاستخدام اليومي والرياضة والأعمال، بتصميم عصري وأنيق.',
        price: 39,
         // السعر الأصلي قبل الخصم
         // نسبة الخصم بالمئة
        category: 'tools',
        images: [
            'images/tools/1-1.jpg',
            'images/tools/1-2.jpg',
            'images/tools/1-3.jpg',
            'images/tools/1-4.jpg'
        ],
        inStock: true,
        limitedQuantity: 3, // كمية محدودة
        showInPages: ['index', 'products', 'tools'],
        featured: true,
        addedDate: '2025-10-05T21:53:00Z' // تاريخ إضافة المنتج
    },

    {
        id: 'product-3',
        name: 'سترة جينز رجالية جديدة 2025، قطنية واسعة مع قبعة',
        description: 'سترة جينز رجالية عصرية بملمس قطني مريح وتصميم فضفاض مع قبعة، مثالية للإطلالة الكاجوال واليومية، تجمع بين الأناقة والراحة، ومناسبة للرجال والنساء على حد سواء ، يتوفر احجام حتى 5 XL',
        price: 160,
        category: 'clothes',
        images: [
            'images/clothes/1-1.jpg',
            'images/clothes/1-2.jpg'
        ],
        inStock: true,
        showInPages: ['index', 'products', 'clothes'],
        featured: false,
        addedDate: '2025-10-05T23:00:00Z' // تاريخ إضافة المنتج
    },

    {
        id: 'product-4',
        name: 'تيشيرت رجالي بطباعة  ',
        description: 'تيشيرت صيفي مريح برسومات جذابة ، مناسب للرجال والنساء، تصميم عصري رياضي وكاجوال في الوقت نفسه ، متوفر بمقاسات كبيرة ',
        price: 27,
        originalPrice:60,
        discount:55,
        category: 'clothes',
        images: [
            'images/clothes/2-1.jpg',
            'images/clothes/2-2.jpg',
            'images/clothes/2-3.jpg'
        ],
        inStock: true,
        showInPages: ['products','index' ,'clothes'],
        featured: true,
        addedDate: '2025-10-06T00:13:00Z' // تاريخ إضافة المنتج
    },

    {
        id: 'product-5',
        name: 'سماعات أذن TWS تعمل بالبلوتوث',
        description: 'سماعات TWS لاسلكية أنيقة بخاصية التحكم باللمس وجودة صوت عالية، خفيفة ومريحة للاستخدام اليومي والرياضي، تدعم الاتصال السريع بجميع الهواتف الذكية',
        price: 28,
        originalPrice: 53, // السعر الأصلي قبل الخصم
        discount: 47,
        category: 'electronics',
        images: [
            'images/electronics/2-1.jpg',
            'images/electronics/2-2.jpg',
            'images/electronics/2-3.jpg'
        ],
        inStock: true,
        showInPages: ['index', 'products', 'electronics'],
        featured: false,
        addedDate: '2025-10-05T11:30:00Z' // تاريخ إضافة المنتج
    },
    
    {
        id: 'product-6',
        name: 'قفازات بدون أصابع مناسب للأنشطة الخارجية',
        description: 'قفازات عملية بدون أصابع مصممة للأنشطة الخارجية والرياضية، خفيفة ومريحة، توفر الدفء والمرونة أثناء اللعب أو ممارسة الرياضة',
        price: 34,
        category: 'clothes',
        images: [
          'images/tools/3-1.jpg',
          'images/tools/3-4.jpg',
          'images/tools/3-2.jpg',
          'images/tools/3-3.jpg',
          'images/tools/3-5.jpg',
          'images/tools/3-6.jpg',
          'images/tools/3-7.jpg',
          ],
        inStock: true,
        showInPages: ['products','index', 'clothes'],
        featured: false,
        addedDate: '2025-10-06T1:17:00Z' // تاريخ إضافة المنتج
    },

    {
        id: 'product-7',
        name: 'خاتم رجالي بمظهر فاخر بتصميم مطلي',
        description: 'خاتم رجالي عصري بتصميم مطفي أنيق، مثالي للمناسبات أو الاستخدام اليومي، يجمع بين البساطة والفخامة بجودة عالية',
        price: 10,
        category: 'tools',
        images: [
          'images/tools/2-1.jpg',
          'images/tools/2-2.jpg',
          'images/tools/2-3.jpg',
          'images/tools/2-4.jpg',
          'images/tools/2-5.jpg',
          
          
          ],
        inStock: true,
        showInPages: ['index','products', 'tools'],
        featured: true,
        addedDate: '2025-10-06T01:2:00Z' // تاريخ إضافة المنتج
    },


    // ========================================
    // إضافة منتجات جديدة هنا
    // ========================================
    
    // نسخ النموذج التالي واستبدل البيانات:
    /*
    {
        id: 'product-X', // معرف فريد للمنتج
        name: 'اسم المنتج',
        description: 'وصف مفصل للمنتج',
        price: 0, // السعر بالدينار الليبي
        category: 'electronics', // electronics, tools, clothes, random
        images: [
            'images/folder/image1.jpg',
            'images/folder/image2.jpg'
        ],
        inStock: true, // true = متوفر, false = غير متوفر
        showInPages: ['index', 'products', 'electronics'], // الصفحات التي سيظهر فيها
        featured: false, // true = منتج مميز, false = عادي
        addedDate: '2024-01-01T12:00:00Z' // تاريخ إضافة المنتج
    },
    */
    
];

// لا تغير هذا السطر - مطلوب لعمل النظام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storeProducts;
}
