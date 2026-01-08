/**
 * 图片生成器
 */
class ImageGenerator {
    constructor() {
        this.scaleFactor = 3; // 高清输出
    }

    /**
     * 生成图片并下载
     * @param {HTMLElement} element - 要截图的元素
     * @param {string} filename - 文件名
     */
    async download(element, filename) {
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: null,
                scale: window.devicePixelRatio * this.scaleFactor,
                useCORS: true,
                allowTaint: true
            });

            canvas.toBlob(blob => {
                if (blob) {
                    window.saveAs(blob, filename);
                }
            }, 'image/png');

            return true;
        } catch (error) {
            console.error('图片生成失败:', error);
            throw new Error('图片生成失败，请重试');
        }
    }

    /**
     * 将图片 URL 转换为 base64
     * @param {string} url - 图片 URL
     * @returns {Promise<string>} base64 字符串
     */
    async urlToBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            img.src = url;
        });
    }

    /**
     * 读取本地文件为 base64
     * @param {File} file - 文件对象
     * @returns {Promise<string>} base64 字符串
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * 生成默认封面占位图
     * @param {string} text - 显示的文字
     * @param {string} bgColor - 背景颜色
     * @returns {string} base64 字符串
     */
    generatePlaceholder(text = '?', bgColor = '#333') {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;

        const ctx = canvas.getContext('2d');

        // 背景
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 120, 120);

        // 文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text.charAt(0).toUpperCase(), 60, 60);

        return canvas.toDataURL('image/png');
    }
}

// 全局实例
const imageGenerator = new ImageGenerator();
