# AGENTS.md —— preload

规则见[根 AGENTS.md](../../AGENTS.md)。

这里是渲染进程唯一的特权入口，改动的默认答案是"不加东西"：

- **只暴露白名单能力**，不要写转发任意 channel 的通用桥，也不要把 `ipcRenderer` 整体暴露出去。
- 新增通道要三处同改：本文件的 `MUSIC_SOURCE_CHANNELS`（或同类白名单）、主进程 handler、`src/renderer/api/*` 封装。
- 暴露的 API 形状由 `index.d.ts` 声明，与实现同步更新。
- 保持 `contextIsolation` 语义：不在 preload 里做业务判断或数据转换，那属于 `src/shared` 或主进程。
