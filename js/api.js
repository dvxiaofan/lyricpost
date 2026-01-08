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

/**
 * iTunes Search API 封装
 * 用于获取专辑封面（备选）
 */
class ITunesAPI {
    constructor() {
        this.baseUrl = 'https://itunes.apple.com';
    }

    /**
     * 搜索歌曲获取封面
     * @param {string} trackName - 歌曲名
     * @param {string} artistName - 歌手名
     * @returns {Promise<string|null>} 封面 URL
     */
    async getCoverArt(trackName, artistName) {
        try {
            const query = `${trackName} ${artistName}`;
            const url = `${this.baseUrl}/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;

            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const match = this.findBestMatch(data.results, trackName, artistName);
                if (match && match.artworkUrl100) {
                    return match.artworkUrl100.replace('100x100', '600x600');
                }
            }

            return null;
        } catch (error) {
            console.error('iTunes 获取封面失败:', error);
            return null;
        }
    }

    findBestMatch(results, trackName, artistName) {
        const normalize = (str) => str.toLowerCase().trim();
        const trackNorm = normalize(trackName);
        const artistNorm = normalize(artistName);

        for (const result of results) {
            const resultTrack = normalize(result.trackName || '');
            const resultArtist = normalize(result.artistName || '');
            if (resultTrack === trackNorm && resultArtist.includes(artistNorm)) {
                return result;
            }
        }

        for (const result of results) {
            const resultTrack = normalize(result.trackName || '');
            if (resultTrack === trackNorm || resultTrack.includes(trackNorm)) {
                return result;
            }
        }

        return results[0];
    }
}

/**
 * QQ 音乐 API 封装（通过 JSONP）
 * 用于获取专辑封面（首选）
 */
class QQMusicAPI {
    constructor() {
        this.callbackIndex = 0;
    }

    /**
     * JSONP 请求
     */
    jsonp(url, callbackName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('请求超时'));
            }, 5000);

            const cleanup = () => {
                clearTimeout(timeout);
                delete window[callbackName];
                script.remove();
            };

            window[callbackName] = (data) => {
                cleanup();
                resolve(data);
            };

            script.src = url;
            script.onerror = () => {
                cleanup();
                reject(new Error('请求失败'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * 搜索歌曲获取封面
     * @param {string} trackName - 歌曲名
     * @param {string} artistName - 歌手名
     * @returns {Promise<string|null>} 封面 URL
     */
    async getCoverArt(trackName, artistName) {
        try {
            const query = `${trackName} ${artistName}`;
            const callback = `qqMusicCallback${++this.callbackIndex}`;
            const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=1&n=5&w=${encodeURIComponent(query)}&format=jsonp&jsonpCallback=${callback}`;

            const data = await this.jsonp(url, callback);

            if (data.data && data.data.song && data.data.song.list && data.data.song.list.length > 0) {
                const song = this.findBestMatch(data.data.song.list, trackName, artistName);
                if (song && song.albummid) {
                    // 返回 300x300 高清封面
                    return `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.albummid}.jpg`;
                }
            }

            return null;
        } catch (error) {
            console.error('QQ音乐获取封面失败:', error);
            return null;
        }
    }

    findBestMatch(songs, trackName, artistName) {
        const normalize = (str) => str.toLowerCase().trim();
        const trackNorm = normalize(trackName);
        const artistNorm = normalize(artistName);

        // 优先找完全匹配
        for (const song of songs) {
            const songName = normalize(song.songname || '');
            const singerName = song.singer ? song.singer.map(s => normalize(s.name)).join(' ') : '';

            if (songName === trackNorm && singerName.includes(artistNorm)) {
                return song;
            }
        }

        // 其次找歌曲名匹配
        for (const song of songs) {
            const songName = normalize(song.songname || '');
            if (songName === trackNorm || songName.includes(trackNorm) || trackNorm.includes(songName)) {
                return song;
            }
        }

        return songs[0];
    }
}

/**
 * 封面获取服务（多源）
 */
class CoverArtService {
    constructor() {
        this.qqMusic = new QQMusicAPI();
        this.itunes = new ITunesAPI();
    }

    /**
     * 获取封面（先试 QQ 音乐，失败再试 iTunes）
     */
    async getCoverArt(trackName, artistName) {
        // 先试 QQ 音乐
        let cover = await this.qqMusic.getCoverArt(trackName, artistName);
        if (cover) {
            console.log('封面来源: QQ音乐');
            return cover;
        }

        // 再试 iTunes
        cover = await this.itunes.getCoverArt(trackName, artistName);
        if (cover) {
            console.log('封面来源: iTunes');
            return cover;
        }

        return null;
    }
}

// 全局实例
const lrcLibAPI = new LrcLibAPI();
const coverArtService = new CoverArtService();
