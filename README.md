# LyricPost - 歌词图片生成器

一个简洁优雅的歌词图片生成工具，搜索歌曲、选择歌词、生成精美分享图片。

## 功能特性

- **歌曲搜索** - 基于 LrcLib API，支持海量歌曲歌词搜索
- **专辑封面** - 自动获取 Spotify 高清专辑封面，支持本地上传
- **繁简转换** - 一键切换繁体/简体中文，支持双向转换
- **自定义样式**
  - 多种预设背景颜色 + 自定义调色板
  - 浅色/深色文字切换
  - 歌词对齐方式（居左/居中/居右）
  - 行间距调节
- **智能省略** - 选择不连续歌词时自动插入省略号
- **高清导出** - 3x 缩放高清 PNG 图片导出
- **深色模式** - 支持深色/浅色主题切换

## 技术栈

- 原生 HTML / CSS / JavaScript（无需构建工具）
- [LrcLib API](https://lrclib.net/) - 歌词搜索
- [Spotify Web API](https://developer.spotify.com/) - 专辑封面
- [OpenCC](https://github.com/nk2028/opencc-js) - 繁简转换
- [html2canvas](https://html2canvas.hertzen.com/) - 图片生成
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) - 文件下载

## 快速开始

### 在线使用

直接访问：[https://dvxiaofan.github.io/lyricpost/](https://dvxiaofan.github.io/lyricpost/)

### 本地运行

```bash
# 克隆项目
git clone https://github.com/your-username/lyricpost.git

# 进入目录
cd lyricpost

# 使用任意静态服务器运行，例如：
npx serve .
# 或
python -m http.server 8000
```

然后在浏览器打开 `http://localhost:8000`

## 使用说明

1. **搜索歌曲** - 输入歌曲名或歌手名进行搜索
2. **选择歌曲** - 从搜索结果中选择目标歌曲
3. **选择歌词** - 点击选择要展示的歌词行（支持繁简转换）
4. **自定义图片** - 调整背景颜色、文字样式、对齐方式等
5. **下载图片** - 点击下载按钮保存高清图片

## 项目结构

```
lyricpost/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── api.js          # API 封装（LrcLib、Spotify）
│   ├── app.js          # 主应用逻辑
│   └── imageGenerator.js   # 图片生成器
└── README.md
```

## 致谢

- [LrcLib](https://lrclib.net/) - 提供免费的歌词 API
- [Spotify](https://developer.spotify.com/) - 提供专辑封面 API
- [palinkiewicz/lyricpost](https://github.com/palinkiewicz/lyricpost) - 项目灵感来源

## 许可证

MIT License
