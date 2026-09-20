# 子系统：桌面壳

主进程里和「让这个东西像桌面应用」有关的部分。所有模块都在 `src/main/modules/`，由 `index.ts` 的 `initialize()` 编排顺序（见 [架构全景](../architecture.md#主进程启动顺序有讲究)）。

| 模块              | 职责                                                    | 对外钩子                                                                      |
| ----------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `config`          | electron-store 配置（含 `getStore` / `getSharedStore`） | `initializeConfig()`                                                          |
| `window`          | 主窗口创建、`setAppQuitting`                            | `initializeWindowManager` / `createMainWindow`                                |
| `window-size`     | 窗口尺寸与位置记忆                                      | `initWindowSizeManager()`                                                     |
| `tray`            | 托盘图标与菜单，随播放状态更新                          | `initializeTray` / `updateTrayMenu` / `updatePlayState` / `updateCurrentSong` |
| `shortcuts`       | 全局快捷键，支持动作白名单校验                          | `initializeShortcuts` / `isShortcutActionSupported`                           |
| `downloadManager` | 下载队列（`download:*` 通道），需要窗口引用回报进度     | `initializeDownloadManager` / `setDownloadManagerWindow`                      |
| `cache`           | 磁盘缓存（`cache-lyric` / `clear-disk-cache`）          | `initializeCacheManager`                                                      |
| `fileManager`     | 文件相关 IPC（`check-file-exists` 等）                  | `initializeFileManager()`                                                     |
| `fonts`           | 字体加载                                                | `initializeFonts()`                                                           |
| `update`          | electron-updater 与 `app-update:*` 通道                 | `setupUpdateHandlers(mainWindow)`                                             |
| `mpris`           | Linux 桌面媒体控制（其他平台空实现）                    | `initializeMpris` 及三个 update                                               |

## 生命周期与关闭语义

- `requestSingleInstanceLock()` 失败即 `app.quit()`；`second-instance` 事件把已有窗口恢复并聚焦。
- `window-all-closed`：非 macOS 退出应用；macOS 保留（`activate` 时重建窗口）。
- `before-quit` 里 `setAppQuitting(true)`——窗口关闭逻辑靠这个标记区分「关窗口」与「退应用」，新增的拦截逻辑要读它，不要自己猜。
- 语言变更由渲染进程发 `change-language`，主进程改 locale、刷新托盘菜单并广播 `language-changed`。

## MPRIS（仅 Linux）

`app.commandLine.appendSwitch('disable-features', 'MediaSessionService')` 关掉 Chromium 自带的媒体会话，避免和自定义 MPRIS 重复显示。播放状态、当前曲目、进度都从 `index.ts` 的 IPC 分发到 `mpris` 模块。

## 更新

`app-update:*` 通道负责检查、下载、打开 Release 页、退出并安装；更新状态由 `src/shared/appUpdate.ts` 的类型约束（渲染进程只读状态，不自己判断版本）。

更新源是本仓库的 GitHub Releases：`package.json` 的 `build.publish` 决定打包时生成的 `resources/app-update.yml`，electron-updater 按它读 `latest.yml`。地址一律从 `src/shared/appUpdate.ts` 的 `APP_REPO_URL` 派生。旧的自建检查与第三方代理已删除，网页版因此只保留「官网更新」入口（见[笔记](../../.agents/notes/implemented/process/2026-09-20-update-feed-is-the-repo-releases.md)）。

## 验证

桌面壳没有自动化测试：改动后手动过一遍触及面（托盘菜单与播放状态同步、快捷键、下载进度、Linux 上 MPRIS 不重复）。打包改动见 [release](../cookbook/release.md)。
