/**
 * ملف الأدوات المساعدة - Full Store
 * وظائف مشتركة ومساعدة للموقع
 */

class Utils {
    // التمرير السلس إلى عنصر معين
    static scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // التحقق من صحة البريد الإلكتروني
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // التحقق من صحة رقم الهاتف الليبي
    static isValidLibyanPhone(phone) {
        // أرقام الهواتف الليبية تبدأ بـ 091, 092, 093, 094, 095
        const phoneRegex = /^(091|092|093|094|095)\d{7}$/;
        const cleanPhone = phone.replace(/[\s-]/g, '');
        return phoneRegex.test(cleanPhone);
    }

    // تنسيق رقم الهاتف
    static formatPhone(phone) {
        const cleanPhone = phone.replace(/[\s-]/g, '');
        if (cleanPhone.length === 10) {
            return `${cleanPhone.substr(0, 3)}-${cleanPhone.substr(3, 3)}-${cleanPhone.substr(6, 4)}`;
        }
        return phone;
    }

    // تنسيق التاريخ بالعربية
    static formatDateArabic(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
        return new Date(date).toLocaleDateString('ar-SA', options);
    }

    // تنسيق الوقت بالعربية
    static formatTimeArabic(date) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return new Date(date).toLocaleTimeString('ar-SA', options);
    }

    // إنشاء معرف فريد
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}${randomStr}`;
    }

    // تحويل النص إلى رابط آمن (slug)
    static createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\u0600-\u06FF\w\s-]/g, '') // إبقاء الأحرف العربية والإنجليزية والأرقام
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // اقتطاع النص
    static truncateText(text, length = 100, suffix = '...') {
        if (text.length <= length) return text;
        return text.substr(0, length).trim() + suffix;
    }

    // تحويل الحجم بالبايت إلى تنسيق قابل للقراءة
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // التحقق من نوع المتصفح
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.indexOf('Chrome') > -1) {
            browser = 'Chrome';
        } else if (ua.indexOf('Firefox') > -1) {
            browser = 'Firefox';
        } else if (ua.indexOf('Safari') > -1) {
            browser = 'Safari';
        } else if (ua.indexOf('Edge') > -1) {
            browser = 'Edge';
        }
        
        return {
            name: browser,
            version: ua.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/)?.[1] || 'Unknown',
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
        };
    }

    // التحقق من دعم المتصفح لميزة معينة
    static checkFeatureSupport() {
        return {
            localStorage: typeof Storage !== 'undefined',
            geolocation: 'geolocation' in navigator,
            notifications: 'Notification' in window,
            serviceWorker: 'serviceWorker' in navigator,
            webShare: 'share' in navigator,
            camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
        };
    }

    // حفظ البيانات في التخزين المحلي
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    }

    // استرجاع البيانات من التخزين المحلي
    static getFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('خطأ في استرجاع البيانات:', error);
            return defaultValue;
        }
    }

    // حذف البيانات من التخزين المحلي
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('خطأ في حذف البيانات:', error);
            return false;
        }
    }

    // ضغط الصورة قبل الرفع
    static compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // نسخ النص إلى الحافظة
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // fallback للمتصفحات القديمة
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    // إنشاء رابط تحميل ملف
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // التحقق من الاتصال بالإنترنت
    static checkOnlineStatus() {
        return {
            isOnline: navigator.onLine,
            connectionType: navigator.connection?.effectiveType || 'unknown'
        };
    }

    // تشغيل كود عند تغيير حالة الاتصال
    static onConnectionChange(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    }

    // تحويل الأرقام الإنجليزية إلى عربية
    static convertToArabicNumbers(str) {
        const arabicNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str.replace(/[0-9]/g, (match) => arabicNumbers[parseInt(match)]);
    }

    // تحويل الأرقام العربية إلى إنجليزية
    static convertToEnglishNumbers(str) {
        const arabicNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let result = str;
        arabicNumbers.forEach((arabic, index) => {
            result = result.replace(new RegExp(arabic, 'g'), index.toString());
        });
        return result;
    }

    // إنشاء كود QR
    static generateQRCode(text, size = 200) {
        // يتطلب مكتبة QR code أو استخدام API
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        return qrApiUrl;
    }

    // التحقق من قوة كلمة المرور
    static checkPasswordStrength(password) {
        let score = 0;
        let feedback = [];

        // الطول
        if (password.length >= 8) score += 1;
        else feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');

        // الأحرف الكبيرة والصغيرة
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
        else feedback.push('يجب أن تحتوي على أحرف كبيرة وصغيرة');

        // الأرقام
        if (/\d/.test(password)) score += 1;
        else feedback.push('يجب أن تحتوي على رقم واحد على الأقل');

        // الرموز الخاصة
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) score += 1;
        else feedback.push('يجب أن تحتوي على رمز خاص واحد على الأقل');

        const strength = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً'][score];
        
        return {
            score,
            strength,
            feedback
        };
    }

    // معايرة النموذج (Form Validation)
    static validateForm(formData, rules) {
        const errors = {};

        for (const [field, value] of Object.entries(formData)) {
            const fieldRules = rules[field];
            if (!fieldRules) continue;

            // مطلوب
            if (fieldRules.required && (!value || value.toString().trim() === '')) {
                errors[field] = fieldRules.messages?.required || `حقل ${field} مطلوب`;
                continue;
            }

            // الحد الأدنى للطول
            if (fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = fieldRules.messages?.minLength || `يجب أن يكون ${field} ${fieldRules.minLength} أحرف على الأقل`;
                continue;
            }

            // الحد الأقصى للطول
            if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = fieldRules.messages?.maxLength || `يجب أن لا يتجاوز ${field} ${fieldRules.maxLength} حرف`;
                continue;
            }

            // البريد الإلكتروني
            if (fieldRules.email && !this.isValidEmail(value)) {
                errors[field] = fieldRules.messages?.email || 'البريد الإلكتروني غير صحيح';
                continue;
            }

            // رقم الهاتف
            if (fieldRules.phone && !this.isValidLibyanPhone(value)) {
                errors[field] = fieldRules.messages?.phone || 'رقم الهاتف غير صحيح';
                continue;
            }

            // نمط مخصص
            if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = fieldRules.messages?.pattern || `تنسيق ${field} غير صحيح`;
                continue;
            }
        }

        return Object.keys(errors).length === 0 ? null : errors;
    }

    // إنشاء loader
    static showLoader(message = 'جاري التحميل...') {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.innerHTML = `
            <div class="loader-backdrop">
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;

        // إضافة الأنماط
        if (!document.getElementById('loaderStyles')) {
            const style = document.createElement('style');
            style.id = 'loaderStyles';
            style.textContent = `
                .loader-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .loader-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }
                .loader-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e9ecef;
                    border-top: 4px solid #5c7cfa;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(loader);
        return loader;
    }

    // إخفاء loader
    static hideLoader() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.remove();
        }
    }
}

// تصدير النواة لاستخدامها في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

// إضافة وظائف عامة للنافذة
window.scrollToProducts = () => {
    // التحقق من وجود عناصر في العربة
    const cart = JSON.parse(localStorage.getItem('fullstore_cart') || '[]');
    if (cart.length === 0) {
        // إخفاء زر "تسوق الآن" إذا كانت العربة فارغة
        const ctaBtn = document.querySelector('.cta-btn');
        if (ctaBtn) {
            ctaBtn.style.display = 'none';
        }
    }
    Utils.scrollToElement('products', 80);
};

window.scrollToSection = (sectionId) => Utils.scrollToElement(sectionId, 80);

// وظيفة لإظهار/إخفاء زر "تسوق الآن" حسب حالة العربة
window.updateShopNowButton = () => {
    const cart = JSON.parse(localStorage.getItem('fullstore_cart') || '[]');
    const ctaBtn = document.querySelector('.cta-btn');
    if (ctaBtn) {
        if (cart.length === 0) {
            ctaBtn.style.display = 'none';
        } else {
            ctaBtn.style.display = 'inline-flex';
        }
    }
};