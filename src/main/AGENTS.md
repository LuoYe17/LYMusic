# AGENTS.md —— 主进程

规则见[根 AGENTS.md](../../AGENTS.md)；结构见 [docs/architecture.md](../../docs/architecture.md)；子系统契约见 [docs/subsystems/](../../docs/subsystems/)。

- 新桌面能力放 `modules/*`，在 `index.ts` 的 `initialize()` 里编排；**初始化顺序有讲究**，改前读[架构全景的启动顺序一节](../../docs/architecture.md#主进程启动顺序有讲究)。
- `registerSchemesAsPrivileged` 与 `disableHardwareAcceleration` 必须在 `app.whenReady()` 之前执行。
- 不 import `src/renderer/*`；跨进程共享的东西放 `src/shared/*`。
- **IPC**：通道命名稳定，返回结构与既有风格一致；新增 `music-source:*` 一类通道必须同时登记进 `src/preload/index.ts` 的白名单（三处同改）。
- **路径**：外部给的路径先过 `pathGuard`。`resolveSafePath` 返回 `null` 表示拒绝，不要兜底成默认路径；目录变动后调 `invalidatePathGuardCaches()`。
- **URL**：对外请求与下载先过 `urlGuard`（仅 HTTPS + 拒私网 IP），`UnsafeUrlError` 按拒绝处理。
- **异常**：文件锁类错误（`EBUSY`/`EPERM`/`EACCES`…）已有全局兜底降级为日志；其他异常不要 catch-all 吞掉，让错误可见。
- **凭证**：Cookie / session 只在主进程流转，不进日志、不回传渲染进程。
- 细节：音源 [music-source-ipc](../../docs/subsystems/music-source-ipc.md)、窗口托盘等 [desktop-shell](../../docs/subsystems/desktop-shell.md)、安全边界 [security-boundaries](../../docs/subsystems/security-boundaries.md)。

## 验证

```bash
npx vitest run src/main   # pathGuard / urlGuard 的回归网，改这两个模块必跑
npm run dev               # 其余改动手动验证触及面
```
