# 子系统：安全边界

三处输入来自不受信任的地方：**渲染进程给的路径**、**外部给的 URL**、**渲染进程的权限请求**。每处都有专门的守门模块，改动它们等于改安全策略。

## `pathGuard`（`src/main/modules/pathGuard.ts`）

渲染进程只能拿到「允许根目录之内」的文件。

- `resolveSafePath(input, roots?)`：把外部路径约束到允许根内，越界返回 `null`——**调用方必须处理 `null`，不要兜底成某个默认路径**。
- `getAllowedRoots()`：允许根清单（带短 TTL 缓存），改变应用可访问范围时改这里，不要在各调用点加判断。
- `parseLocalProtocolUrl(url)`：`local://` 协议 URL 的唯一解析入口，热路径（Range 请求）有内存缓存。
- realpath 解析会沿父目录回退，用于挡住 symlink 逃逸。

缓存失效走 `invalidatePathGuardCaches()`——新增/删除下载目录之类的操作之后必须调，否则旧清单还在生效。

## `urlGuard`（`src/main/modules/urlGuard.ts`）

所有对外请求与下载 URL 先过这两道：

- `assertSafeHttpsUrl(raw)`：只允许 HTTPS，并对域名做 DNS 解析、拒绝私网 IP（挡 SSRF）。
- `assertSafeCoverUrl(raw)`：封面等展示用途的更宽松版本。
- `DOWNLOAD_URL_LIMITS`：下载大小与重定向限制。
- 失败抛 `UnsafeUrlError`，调用方按「拒绝」处理，不要 catch 后继续请求。

## 渲染进程权限（`src/main/index.ts`）

默认拒绝，白名单放行，且必须来自受信任来源（`file:` 或 dev server origin）：

- 放行：`speaker-selection`、`fullscreen`、`clipboard-sanitized-write`
- 明确拒绝：`media`、`audioCapture`、`display-capture`、`mediaKeySystem`
- 不放行 `clipboard-read`：防止注入后读剪贴板外传

改白名单要同时想清楚三件事：谁需要它、请求来自哪个 origin、被滥用时最坏情况是什么。

## `local://` 协议

注册为特权协议（`standard` / `secure` / `supportFetchAPI` / `stream` / `bypassCSP` / `corsEnabled`），且**必须在 `app.whenReady()` 之前**完成注册。`bypassCSP` 只服务于媒体流式播放——这意味着页面侧不能有不可信的 `v-html`；加严 CSP 时要回归验证本地媒体仍可播放。

## 不入库、不进日志

Cookie、session、登录二维码数据只在主进程内存与 `userData` 里流转；日志里不打印凭证，提交里不出现 `.env`、密钥、会话导出文件。

## 验证

`pathGuard.test.ts`、`urlGuard.test.ts` 是这套策略的回归网，改这两个模块后必须跑：

```bash
npx vitest run src/main/modules/pathGuard.test.ts src/main/modules/urlGuard.test.ts
```
