# 子系统：音源 IPC

在线检索与播放能力来自 `ly-music-source`。它**只在主进程实例化**，渲染进程通过 IPC 使用。相关文件：

- `src/main/modules/musicSource.ts`：创建 client、会话持久化、注册 `ipcMain.handle('music-source:*')`
- `src/preload/index.ts`：`MUSIC_SOURCE_CHANNELS` 白名单（唯一暴露方式）
- `src/renderer/api/musicSource.ts`：渲染侧封装，统一返回类型

## 契约

- **通道命名**：`music-source:<动作>`，动作名字与音源 SDK 方法一一对应。
- **返回形状**：一律 `MusicSourceIpcResult<T>`：

  ```ts
  type MusicSourceIpcResult<T> =
    { ok: true; data: T } | { ok: false; code: string; message: string };
  ```

  失败不抛异常到 UI，`code` 用于分支（如未登录、会员不足），`message` 用于展示。

- **新增能力要同时改三处**：`preload` 白名单、主进程 handler、渲染侧封装。少改一处就白名单拒绝，表现为调用无声失败。
- **禁止**在渲染进程直接 `import 'ly-music-source'` 当运行时客户端使用——会话与凭证不在那边。

## 会话与凭证

- 登录态、Cookie、二维码登录（`create-qr-login` / `poll-qr-login` / MFA）全部在主进程完成，渲染进程只看到结果状态（`get-auth-state` / `get-profile` / `get-membership`）。
- 会话持久化在 `userData` 目录下；**不要把 Cookie 写进日志、提交进仓库或回传到渲染进程**。
- 退出登录走 `logout`，它同时清理缓存目录。

## 失败面

| 现象                         | 先查                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| 调用无声失败（无 ok/false）  | 通道是否在 `MUSIC_SOURCE_CHANNELS` 白名单里                |
| `ok: false` 且 code 为登录类 | 会话是否过期，`get-auth-state` 是否为空                    |
| URL 播放 403/过期            | 解析结果的有效期，渲染侧是否有 URL 过期处理（见 playback） |
| 本地文件读不到               | 路径是否被 `pathGuard` 拒绝（见 security-boundaries）      |

## 验证

改动后至少手动跑一遍：`npm run dev` → 搜索一首 → 播放 → 打开歌词，确认 `ok` 路径与至少一个失败路径（例如未登录时调需要登录的接口）行为一致。
