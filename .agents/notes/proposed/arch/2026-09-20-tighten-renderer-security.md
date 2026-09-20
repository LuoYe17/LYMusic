# Agent Note: 收紧渲染进程的安全姿态（webSecurity / CSP / sandbox）

Status: proposed

## 背景

`src/main/modules/window.ts` 里主窗口的 `webPreferences` 是：

```
contextIsolation: true,
sandbox: false,
webSecurity: false,          // 关掉渲染进程的同源策略
backgroundThrottling: false  // 播放场景需要，与安全无关
```

全仓库没有 CSP；`local://` 注册为特权协议时带 `bypassCSP: true`（为媒体流式播放）。

已有防线并不弱：`dompurify` + `safeMarkdown` 处理富文本、preload 通道白名单、权限默认拒绝且校验来源、`pathGuard` / `urlGuard` 管住路径与出网、外链只放行 `http/https/mailto/tel` 并全部交给系统浏览器。

问题在于 `webSecurity: false` 会关掉渲染进程的同源策略：任何注入点（歌词、评论、封面 URL、markdown 渲染）都能跨源读取数据。这不是已确认的漏洞，而是「一旦被绕开，代价被放大」的配置。

之所以写成提案而不是直接改：这几个开关是**为播放链路服务的**，改动必须真跑起来验证（搜索 → 播放 → local:// 缓存流 → 封面 → 歌词 → EQ），而当前环境没有可交互的图形会话，盲改只会把播放静默改坏。

## 提案

三步，各自独立可回滚，每步都要一次真实运行验证。

1. **先加最小 CSP**：在 `session.defaultSession.webRequest.onHeadersReceived` 注入响应头，先只写不影响资源加载的指令（`object-src 'none'`、`base-uri 'self'`、`frame-ancestors 'none'`）。确认播放、封面、歌词照常后，再逐步收紧 `script-src` / `img-src` / `media-src`，把 `local:`、`https:` 与 dev server 显式列入。
2. **评估 `webSecurity: true`**：逐条列出当前真正依赖同源豁免的地方（`local://` 媒体流、远程封面、渲染进程直发的请求），把能改的改走主进程 IPC 代理，改不掉的写清原因。
3. **评估 `sandbox: true`**：preload 只用 `ipcRenderer` + `contextBridge`，理论上可行；需要确认 `@electron-toolkit/preload` 与现有暴露面不依赖 node 能力。

## 放弃的方案

**一次性改成安全默认值并观察。** 没有可交互的运行时验证，播放、封面、歌词哪一条先坏无法预判，最后会变成用户先发现。

**只加一条宽松 CSP（`default-src * 'unsafe-inline'`）。** 形式上有 CSP，实际不拦任何东西，属于自我安慰。

**保持现状不动。** 把「能播就行」当成结论，等于默认接受注入被放大的后果；但这条确实是有意识的取舍，所以留成提案而不是当缺陷。

## 验收标准

- 打包后的 Windows / Linux 应用走通：搜索 → 播放（含 `local://` 缓存流与前缀流升级）→ 远程封面 → 歌词（含逐字）→ EQ/音效 → 下载；控制台无 CORS 或 CSP 违规报错。
- 迷你窗、托盘、快捷键、MPRIS 行为不变。
- 若最终恢复 `webSecurity: true`，笔记需写明每条跨源需求是被消掉还是改走主进程。

## 风险

- Tailwind / naive-ui 注入的 `<style>` 需要 `style-src 'unsafe-inline'` 或 nonce，处理不当会整站掉样式——这是必须先验证的一项。
- `local://` 的媒体流与 Range 请求依赖当前特权设置，收紧 `media-src` 要确认流式播放与 seek 仍可用。
- 更新包下载在主进程侧，不经渲染进程，不受 CSP 影响。
- 三步都只动窗口配置与响应头，回滚成本低；但每步都需要一次真实运行，构建通过不能代替验证。
