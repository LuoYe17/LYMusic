# Agent Note: 音源客户端与登录会话只留在主进程

Status: implemented

## 背景

在线检索与播放需要两样东西：一个音源客户端，和一份登录会话（汽水 cookie）。这两样东西放在哪，决定了攻击面和安全边界。

改动之前的形态是上游带来的：渲染进程直连自建的 `netease-cloud-music-api` 远程服务，外加多个备用音源解析器（gdmusic、lxMusicStrategy、自定义 API 解析），凭证与解析逻辑都散在前端。

## 决策

`ly-music-source` 只在主进程实例化（`src/main/modules/musicSource.ts`，是仓库里唯一 `import` 它的地方），渲染进程只能经 `src/renderer/api/musicSource.ts` → preload 白名单 → IPC 使用。

- 会话经 Electron `safeStorage` 加密后以 base64 持久化；**加密不可用时干脆不落盘**，不写明文。
- 播放地址落到本地 `local://` 缓存再流式播放，渲染进程不直接持有上游 URL。
- 返回形状统一为 `MusicSourceIpcResult<T>`（`ok` 分支 + `code`），失败不抛异常穿到 UI。
- 备用音源全部移除，只保留官方播放路径。

## 放弃的方案

**保留远程 `netease-cloud-music-api` 后端**（`ba04464` 移除该栈）：桌面应用的主线是本地运行，凭证穿过网络、服务得自己搭和维护，任何一次后端不可用都会让客户端变成空壳。代理与环境变量注入后端地址的配置也在 `7f6e11e` 一并移除——构建产物不该依赖外部后端存活。

**保留渲染进程侧的多音源解析器**（`5b5d001` 移除全部备用音源）：每多一条解析路径就多一套失效方式与合规风险，解析质量还不可控；当时的行为是"官方播放 + 多条兜底"，实际结果是失败原因难以定位。

## 影响

- 加一个音源能力要同时改三处（preload 白名单、主进程 handler、渲染侧封装）；这是刻意保留的摩擦：渲染进程无法点名任意 channel。
- 会话泄露面收敛到主进程：渲染进程拿不到 cookie，也没有 `ly-music-source` 的运行时引用。
- 渲染进程崩溃或本地存储被清不影响登录态。

## 验证

- `grep -rn "from 'ly-music-source'" src` 只应命中 `src/main/modules/musicSource.ts`。
- `src/preload/index.ts` 的 `MUSIC_SOURCE_CHANNELS` 与主进程注册的 `music-source:*` 通道一致。
- 手动路径见 [docs/subsystems/music-source-ipc.md](../../../docs/subsystems/music-source-ipc.md#验证)。
