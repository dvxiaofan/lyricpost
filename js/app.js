/**
 * 歌词图片生成器 - 主应用
 */
class LyricPostApp {
    constructor() {
        this.currentStep = 1;
        this.songs = [];
        this.selectedSong = null;
        this.selectedLyrics = new Set();

        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.initTheme();
        this.setDefaultCover();
    }

    bindElements() {
        // 页面元素
        this.screens = document.querySelectorAll('.screen');

        // 搜索页
        this.searchForm = document.getElementById('search-form');
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');

        // 歌曲列表
        this.songList = document.getElementById('song-list');

        // 歌词列表
        this.lyricsList = document.getElementById('lyrics-list');
        this.toPreviewBtn = document.getElementById('to-preview');

        // 预览页
        this.songCard = document.getElementById('song-card');
        this.coverImg = document.getElementById('cover-img');
        this.songNameEl = document.getElementById('song-name');
        this.artistNameEl = document.getElementById('artist-name');
        this.cardLyrics = document.getElementById('card-lyrics');

        // 自定义选项
        this.coverInput = document.getElementById('cover-input');
        this.uploadCoverBtn = document.getElementById('upload-cover-btn');
        this.fetchCoverBtn = document.getElementById('fetch-cover-btn');
        this.coverLoading = document.getElementById('cover-loading');
        this.colorPresets = document.querySelectorAll('.color-preset');
        this.customColor = document.getElementById('custom-color');
        this.lightTextSwitch = document.getElementById('light-text-switch');
        this.downloadBtn = document.getElementById('download-btn');

        // 主题切换
        this.themeToggle = document.getElementById('theme-toggle');

        // 返回按钮
        this.backBtns = document.querySelectorAll('.back-btn');

        // Loading 和 Error
        this.loadings = document.querySelectorAll('.loading');
        this.errorEl = document.querySelector('.error');
    }

    bindEvents() {
        // 搜索
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchSongs();
        });

        // 返回按钮
        this.backBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetStep = parseInt(btn.dataset.to, 10);
                this.goToStep(targetStep);
            });
        });

        // 进入预览
        this.toPreviewBtn.addEventListener('click', () => {
            this.goToPreview();
        });

        // 上传封面
        this.uploadCoverBtn.addEventListener('click', () => {
            this.coverInput.click();
        });

        this.coverInput.addEventListener('change', (e) => {
            this.handleCoverUpload(e.target.files[0]);
        });

        // 自动获取封面
        this.fetchCoverBtn.addEventListener('click', () => {
            this.fetchCoverArt();
        });

        // 颜色选择
        this.colorPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                this.setCardColor(preset.dataset.color);
                this.updateColorPresetActive(preset);
            });
        });

        this.customColor.addEventListener('input', () => {
            this.setCardColor(this.customColor.value);
            this.clearColorPresetActive();
        });

        // 浅色文字开关
        this.lightTextSwitch.addEventListener('click', () => {
            this.toggleLightText();
        });

        // 下载
        this.downloadBtn.addEventListener('click', () => {
            this.downloadImage();
        });

        // 主题切换
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 阻止 contenteditable 换行
        document.querySelectorAll('[contenteditable]').forEach(el => {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });

            // 粘贴为纯文本
            el.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        });
    }

    // ============================================
    // 页面导航
    // ============================================

    goToStep(step) {
        this.screens.forEach(screen => {
            const screenStep = parseInt(screen.dataset.step, 10);
            if (screenStep === step) {
                screen.classList.add('active');
                screen.classList.remove('leaving');
            } else if (screenStep < step) {
                screen.classList.remove('active');
                screen.classList.add('leaving');
            } else {
                screen.classList.remove('active');
                screen.classList.remove('leaving');
            }
        });
        this.currentStep = step;
    }

    // ============================================
    // 搜索功能
    // ============================================

    async searchSongs() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showError('请输入歌曲名或歌手名');
            return;
        }

        this.hideError();
        this.showLoading(1);
        this.searchBtn.disabled = true;

        try {
            this.songs = await lrcLibAPI.search(query);

            if (this.songs.length === 0) {
                this.showError('未找到相关歌曲，请尝试其他关键词');
                return;
            }

            this.renderSongList();
            this.goToStep(2);
        } catch (error) {
            this.showError(error.message || '搜索失败，请稍后重试');
        } finally {
            this.hideLoading();
            this.searchBtn.disabled = false;
        }
    }

    renderSongList() {
        this.songList.innerHTML = '';

        this.songs.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'song-item';
            item.innerHTML = `
                <div class="song-item-info">
                    <div class="song-item-name">${this.escapeHtml(song.name)}</div>
                    <div class="song-item-artist">${this.escapeHtml(song.artist)}${song.album ? ' · ' + this.escapeHtml(song.album) : ''}</div>
                </div>
                <div class="song-item-duration">${lrcLibAPI.formatDuration(song.duration)}</div>
            `;

            item.addEventListener('click', () => {
                this.selectSong(index);
            });

            this.songList.appendChild(item);
        });
    }

    // ============================================
    // 歌曲选择
    // ============================================

    selectSong(index) {
        this.selectedSong = this.songs[index];
        this.selectedLyrics.clear();

        this.renderLyricsList();
        this.goToStep(3);
    }

    renderLyricsList() {
        this.lyricsList.innerHTML = '';

        // 优先使用同步歌词，否则使用普通歌词
        let lyrics = [];
        if (this.selectedSong.syncedLyrics) {
            lyrics = lrcLibAPI.parseSyncedLyrics(this.selectedSong.syncedLyrics)
                .map(item => item.text);
        } else if (this.selectedSong.plainLyrics) {
            lyrics = lrcLibAPI.parseLyrics(this.selectedSong.plainLyrics);
        }

        if (lyrics.length === 0) {
            this.lyricsList.innerHTML = '<div class="hint">暂无歌词，你可以在下一步手动输入</div>';
            return;
        }

        lyrics.forEach((line, index) => {
            const el = document.createElement('div');
            el.className = 'lyric-line';
            el.textContent = line;
            el.dataset.index = index;

            el.addEventListener('click', () => {
                this.toggleLyricSelection(index, el);
            });

            this.lyricsList.appendChild(el);
        });
    }

    toggleLyricSelection(index, element) {
        if (this.selectedLyrics.has(index)) {
            this.selectedLyrics.delete(index);
            element.classList.remove('selected');
        } else {
            this.selectedLyrics.add(index);
            element.classList.add('selected');
        }
    }

    // ============================================
    // 预览页
    // ============================================

    goToPreview() {
        // 更新卡片内容
        this.songNameEl.textContent = this.selectedSong.name;
        this.artistNameEl.textContent = this.selectedSong.artist;

        // 获取选中的歌词
        const lyricLines = Array.from(this.lyricsList.querySelectorAll('.lyric-line'));
        const selectedTexts = lyricLines
            .filter((_, index) => this.selectedLyrics.has(index))
            .map(el => el.textContent);

        if (selectedTexts.length > 0) {
            this.cardLyrics.innerHTML = selectedTexts.join('<br>');
        } else {
            this.cardLyrics.innerHTML = '点击此处输入歌词';
        }

        // 设置默认占位封面
        this.setDefaultCover();

        // 随机选择一个颜色
        const randomPreset = this.colorPresets[Math.floor(Math.random() * this.colorPresets.length)];
        this.setCardColor(randomPreset.dataset.color);
        this.updateColorPresetActive(randomPreset);

        this.goToStep(4);
    }

    /**
     * 从 iTunes 获取专辑封面（手动触发）
     */
    async fetchCoverArt() {
        // 显示 loading
        this.coverLoading.classList.remove('hidden');
        this.fetchCoverBtn.disabled = true;

        try {
            const coverUrl = await itunesAPI.getCoverArt(
                this.selectedSong.name,
                this.selectedSong.artist
            );

            if (coverUrl) {
                // 预加载图片
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        this.coverImg.src = coverUrl;
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = coverUrl;
                });
            } else {
                alert('未找到封面，请尝试手动上传');
            }
        } catch (error) {
            console.error('获取封面失败:', error);
            alert('获取封面失败，请尝试手动上传');
        } finally {
            this.coverLoading.classList.add('hidden');
            this.fetchCoverBtn.disabled = false;
        }
    }

    setDefaultCover() {
        const text = this.selectedSong?.name || '?';
        this.coverImg.src = imageGenerator.generatePlaceholder(text);
    }

    async handleCoverUpload(file) {
        if (!file) return;

        try {
            const base64 = await imageGenerator.fileToBase64(file);
            this.coverImg.src = base64;
        } catch (error) {
            console.error('封面上传失败:', error);
        }
    }

    setCardColor(color) {
        this.songCard.style.backgroundColor = color;
    }

    updateColorPresetActive(activePreset) {
        this.colorPresets.forEach(p => p.classList.remove('active'));
        activePreset.classList.add('active');
    }

    clearColorPresetActive() {
        this.colorPresets.forEach(p => p.classList.remove('active'));
    }

    toggleLightText() {
        this.lightTextSwitch.classList.toggle('active');
        const isLight = this.lightTextSwitch.classList.contains('active');
        this.songCard.classList.toggle('light-text', isLight);
        this.songCard.classList.toggle('dark-text', !isLight);
    }

    // ============================================
    // 下载
    // ============================================

    async downloadImage() {
        this.showLoading(4);
        this.downloadBtn.disabled = true;

        try {
            const filename = `${this.selectedSong.artist} - ${this.selectedSong.name}.png`;
            await imageGenerator.download(this.songCard, filename);
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败，请重试');
        } finally {
            this.hideLoading();
            this.downloadBtn.disabled = false;
        }
    }

    // ============================================
    // 主题
    // ============================================

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

        document.body.classList.toggle('dark-mode', isDark);
        this.updateThemeIcon();
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const isDark = document.body.classList.contains('dark-mode');
        const icon = this.themeToggle.querySelector('.material-symbols-outlined');
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }

    // ============================================
    // 工具方法
    // ============================================

    showLoading(step) {
        this.screens.forEach(screen => {
            if (parseInt(screen.dataset.step, 10) === step) {
                const loading = screen.querySelector('.loading');
                if (loading) loading.classList.remove('hidden');
            }
        });
    }

    hideLoading() {
        this.loadings.forEach(loading => loading.classList.add('hidden'));
    }

    showError(message) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
    }

    hideError() {
        this.errorEl.classList.add('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LyricPostApp();
});
