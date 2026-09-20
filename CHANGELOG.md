# 更新日志

记录 **LYMusic** 对外可见的变更。  
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

发版流水线会按 `## [vX.Y.Z]` 从本文件抽取对应段落作为 Release 说明。

## [未发布]

### 变更

- 许可证由 MIT 改为 **GPL-3.0-only**：打包进产物的音源库 `ly-music-source` 是 GPL-3.0；上游 AlgerMusicPlayer 的 MIT 声明与原文保留在新增的 `THIRD_PARTY_NOTICES.md`，`package.json` 补上 `license` 字段

### 修复

- 自动更新源指向错仓库：`build.publish`、更新地址常量与各 UI 入口统一改指向 `LuoYe17/LYMusic`；删除渲染进程经第三方代理的自建检查（含 `VITE_GITHUB_TOKEN`）与两个只服务旧链接的死组件
- `npm install` / `npm ci` 在 npm 12 下报 `EALLOWGIT`：新增 `.npmrc`（`allow-git=root`）放行直接 git 依赖 `ly-music-source`
- 门禁脚本（i18n / 字段读取 / 文档）改用 node 直接跑 TypeScript，不再要求机器上装 bun；没装 bun 时的 `pre-commit` 失败问题随之消失

### 文档

- 建立文档分层与决策笔记体系：新增 `docs/AGENTS.md`（文档标准与字数预算）、`.agents/notes/`（决策笔记，含 3 篇历史决策）、`docs/architecture.md` 与 `docs/subsystems/`（子系统契约）、`docs/cookbook/`（GitHub Flow、发版）
- `AGENTS.md` 瘦身为常备规则，细节下沉到 `docs/`；各源码目录新增模块级 `AGENTS.md`
- 新增文档门禁 `npm run verify:docs`（笔记结构 + 字数预算），并接入 PR CI
- 修正过期描述：i18n 已仅剩简体中文、macOS 不在打包与流水线内；`DEV.md` 删除（技术栈与命令本就与 `README.md` 重复）
- 目录调整：`docs/github-flow.md` → `docs/cookbook/github-flow.md`

（发版前归入版本号时再拆「新增 / 修复 / 变更 / 移除」。）

## [v5.1.0]

LYMusic 独立维护基线（由 AlgerMusicPlayer 魔改而来）。

### 产品定位

- 品牌与打包：`LYMusic` / `LYMusicPlayer` / `com.luoye.music`
- 发布与自动更新源指向本仓库（GitHub Releases + electron-updater）
- 在线音源切换为 TypeScript 库 [`ly-music-source`](https://github.com/LuoYe17/ly-music-source)，当前对接 **汽水音乐**
- 界面语言仅保留简体中文

### 能力摘要

- 汽水扫码登录（含短信二次验证）；登录态本机加密存储（Electron `safeStorage`）
- 发现页竖滑推荐流（封面 / 歌词 / 音质与音效入口）
- 搜索、收藏、播放历史、用户歌单（含增删改）
- 播放链路：双槽预加载、低码率起播后无感升质、下一首预加载、磁盘音乐/歌词缓存
- 汽水六档音质与会员门控；播放条音质与输出设备
- 全屏播放页、EQ / 音效预设、下载管理
- 系统能力：托盘与媒体键、Linux MPRIS、Windows 任务栏缩略图按钮、应用内检查更新
- 构建目标：Windows（NSIS）与 Linux（AppImage / deb / rpm），x64 / arm64

### 相对上游的主要取舍

- 去掉捐赠 / 赞赏入口
- 不再以网易云 API 为主路径
- 精简多语言、快捷键自定义页等周边能力，优先核心播放体验

> 更早的上游变更历史见 [algerkong/AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer)。
