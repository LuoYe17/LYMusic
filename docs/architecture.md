# 架构全景

> 面向要改 `src/` 的人（含 AI 代理）。只讲**结构与为什么这么切**：模块内部细节看 [`subsystems/`](subsystems/)，决策理由看 [`.agents/notes/`](../.agents/notes/README.md)。

一句话：Electron 桌面音乐播放器。渲染进程负责界面与播放逻辑，主进程持有窗口、系统能力和在线音源客户端，两者只经 IPC 往来，中间夹一层白名单化的 preload。

## 进程与三条信任边界

```text
┌────────────────────────┐   IPC（白名单 channel）   ┌────────────────────────────────┐
│ renderer               │ ◄───────────────────────► │ main                           │
│ Vue UI / Pinia / 播放   │                           │ 窗口·托盘·快捷键·下载·缓存·音源 │
│ api/musicSource.ts     │                           │ modules/musicSource.ts         │
└────────────────────────┘                           └────────────────────────────────┘
             ▲                                                       │
             └──────────── preload（显式白名单）──────────────────────┘
```

1. **音源客户端只活在主进程。** `ly-music-source` 由 `src/main/modules/musicSource.ts` 创建，登录会话（Cookie）只在主进程导入/导出；渲染进程拿不到凭证，只能用 IPC 换数据。
2. **preload 是白名单，不是通道。** `src/preload/index.ts` 显式列出允许的 channel（见 `MUSIC_SOURCE_CHANNELS`），渲染进程无法点名任意 channel。
3. **渲染进程默认没有特权。** 权限请求先校验来源，再按白名单放行，其余一律拒绝；细节见 [desktop-shell](subsystems/desktop-shell.md) 与 [security-boundaries](subsystems/security-boundaries.md)。

## 目录职责

| 位置                  | 职责                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `src/main`            | 应用生命周期、窗口、托盘、快捷键、下载、缓存、音源桥接、MPRIS         |
| `src/preload`         | 上下文隔离下暴露 IPC 与桌面能力（唯一入口，白名单约束）               |
| `src/renderer`        | 全部界面、路由、Pinia、播放与音质逻辑                                 |
| `src/i18n`            | 主进程与渲染进程文案（当前仅 `zh-CN`，见 [i18n](subsystems/i18n.md)） |
| `src/shared`          | 主/渲染共享的纯类型与工具，`domain/` 放领域模型                       |
| `scripts/`            | 门禁与仓库脚本（i18n、字段读取、文档校验）                            |
| `resources/` `build/` | 运行时资源与打包配置（图标、entitlements、NSIS）                      |

## 主进程：启动顺序有讲究

改 `src/main/index.ts` 的初始化顺序前先确认这几点，顺序错了不会报错，只会静默失效：

1. `process.on('uncaughtException')` 兜底把**文件锁类错误**（`EBUSY`/`EPERM`/`EACCES`…）降级为日志，其余仍弹错误框——云同步与杀软会短暂锁住 `config.json`，不能让应用炸掉，也不能掩盖真 bug。
2. `protocol.registerSchemesAsPrivileged([local://])` **必须在 `app.whenReady()` 之前**，否则 `local://` 媒体被当作非安全源，触发 CORS 或 `net::ERR_UNKNOWN_URL_SCHEME`。
3. `initializeConfig()` 读设置后按需 `app.disableHardwareAcceleration()`，同样**必须在 ready 之前**。
4. `app.whenReady()` 里依次做：用户模型 ID、权限策略、窗口尺寸管理，然后 `initialize(store)` 编排各模块。
5. `initialize()` 内部顺序：config → fileManager → downloadManager → cache → window → fonts → musicSource → 主窗口 → 托盘 → 快捷键 → MPRIS → 更新。

单实例：拿不到 `requestSingleInstanceLock()` 直接退出，第二个实例把焦点交回第一个窗口。

## 渲染进程：三条主干

- **数据入口**：`src/renderer/api/musicSource.ts` 是唯一的音源 IPC 封装层，统一返回 `MusicSourceIpcResult<T>`（`{ ok: true, data }` 或 `{ ok: false, code, message }`），不让异常穿到 UI。
- **播放**：`UI/hooks → playlist.* → playbackCoordinator → playbackController → audioService`，禁止跳层，理由见 [playback](subsystems/playback.md)。
- **状态**：Pinia 模块在 `store/modules/`。跨页面共享的状态进 store，只服务单个页面的状态留在组件里。

## 领域类型

`Track`（元数据）、`PlaybackRuntime`（会话态）、`SongResult`（音源返回）三者分工与迁移进度见 [track-migration](track-migration.md)。读字段走 `songFields` / `toPlayableView`，门禁 `npm run lint:song-fields`。

## 要加东西时改哪里

| 想做的事       | 改动点                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------- |
| 加一个音源能力 | `preload` 白名单 → `main/modules/musicSource.ts` → `renderer/api/musicSource.ts`（三处同时改） |
| 加一个桌面能力 | `src/main/modules/` 新模块，在 `index.ts` 里编排初始化                                         |
| 加一个设置项   | `store/modules/settings.ts` → 设置页控件 → `src/i18n/lang/zh-CN/settings.ts`                   |
| 加一个页面     | `src/renderer/views/` → `router/`                                                              |
| 改播放行为     | 先看 [playback](subsystems/playback.md) 的指挥链，别绕开 coordinator                           |
