/**
 * LrcLib API 封装
 * 文档: https://lrclib.net/docs
 */
class LrcLibAPI {
    constructor() {
        this.baseUrl = 'https://lrclib.net/api';
    }

    /**
     * 搜索歌曲
     * @param {string} query - 搜索关键词
     * @returns {Promise<Array>} 歌曲列表
     */
    async search(query) {
        const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'LyricPost/1.0'
            }
        });

        if (!response.ok) {
            throw new Error('搜索失败，请稍后重试');
        }

        const data = await response.json();
        return this.formatSearchResults(data);
    }

    /**
     * 格式化搜索结果
     * @param {Array} data - API 返回的原始数据
     * @returns {Array} 格式化后的歌曲列表
     */
    formatSearchResults(data) {
        return data.map(item => ({
            id: item.id,
            name: item.trackName,
            artist: item.artistName,
            album: item.albumName,
            duration: item.duration,
            plainLyrics: item.plainLyrics,
            syncedLyrics: item.syncedLyrics
        }));
    }

    /**
     * 解析歌词文本为数组
     * @param {string} lyrics - 歌词文本
     * @returns {Array} 歌词行数组
     */
    parseLyrics(lyrics) {
        if (!lyrics) return [];

        return lyrics
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    /**
     * 解析同步歌词 (LRC 格式)
     * @param {string} syncedLyrics - LRC 格式歌词
     * @returns {Array} 带时间戳的歌词数组
     */
    parseSyncedLyrics(syncedLyrics) {
        if (!syncedLyrics) return [];

        const lines = syncedLyrics.split('\n');
        const result = [];
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        for (const line of lines) {
            const match = line.match(timeRegex);
            if (match) {
                const text = line.replace(timeRegex, '').trim();
                if (text) {
                    const minutes = parseInt(match[1], 10);
                    const seconds = parseInt(match[2], 10);
                    const ms = parseInt(match[3].padEnd(3, '0'), 10);
                    const time = minutes * 60 + seconds + ms / 1000;

                    result.push({
                        time,
                        text
                    });
                }
            }
        }

        return result;
    }

    /**
     * 格式化时长
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时长 (如 3:45)
     */
    formatDuration(seconds) {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// 全局实例
const lrcLibAPI = new LrcLibAPI();
