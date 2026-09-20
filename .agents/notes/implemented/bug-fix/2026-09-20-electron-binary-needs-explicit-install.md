# Agent Note: dev 前自动补齐 electron 二进制

Status: implemented

## 背景

`npm run dev` 会报：

```text
Error: Electron uninstall
    at getElectronPath (electron-vite/dist/chunks/lib-q6ns0vZr.js:155:19)
```

electron-vite 启动要读 `node_modules/electron/path.txt`，而**装完依赖后这个文件根本不存在**：electron 43 的 npm 包没有 `postinstall` 脚本（`npm view electron@43.1.1 scripts` 为空），二进制改由包内的显式 bin `install-electron`（`install.js`）下载。于是「装好依赖 ≠ 装好二进制」，`node_modules/electron/dist` 一直是空的。

排查时很容易被两个方向带偏，都验证过不成立：

- npm 12 的 `allowScripts` 审批：electron 压根不在被挡列表里，因为它没有脚本可挡。
- 依赖升版本导致审批失效：与本次现象无关。

国内网络还叠加了第二个问题：默认从 GitHub 下载二进制时常失败，表现就是「有时候能用、有时候不能用」。

## 决策

新增 [scripts/ensure-electron.mjs](../../../../scripts/ensure-electron.mjs)，接在 `npm run dev` 与 `npm run start` 前面：

- 二进制在 → 立即退出（约 100ms，无输出）。
- 缺失 → 调用 electron 自带的 `install.js` 补下载；默认源失败时自动改走 npmmirror 重试。
- 检查方式与 electron 自己一致：`path.txt` 的内容是相对 `dist/` 的路径（本版本写入 `electron.exe`），按 `join(__dirname, 'dist', 内容)` 解析。

只挂在 dev / start：打包时 electron-builder 会自己下载 electron，CI（lint / build / typecheck / test）都不需要这个二进制。

## 放弃的方案

**挂到 `postinstall`。** 本地是省事，但 CI 每次都要多下一次上百 MB，而 CI 根本不需要它；而且会把「装依赖失败」和「下载二进制失败」两种问题混在一起。

**只写文档让人手动跑 `npx install-electron`。** 这正是「经常出现」的成因：报错在 dev 启动那一刻才出现，人只看到 `Electron uninstall`，并不知道该跑什么命令。

**走 npm 12 的脚本审批（`approve-scripts` / `.npmrc` 的 `allow-scripts`）。** 包里没有脚本可审批，改这些配置对现象没有任何影响。

**改全局 npm 配置 `electron_mirror`。** 能缓解国内下载，但改的是机器而不是仓库，换机器、换人还会踩。脚本内做镜像回退更自洽；用户若自己设了该配置，也照常生效。

## 影响

- `npm run dev` / `npm run start` 前多一次存在性检查，通常约 100ms；只有二进制缺失时才联网。
- 下载失败会打印可直接复制的重试命令与镜像配置建议，不再只留一句 `Electron uninstall`。
- CI 与打包流程不受影响。
- 如果将来 electron 恢复 `postinstall`（或改用平台子包分发二进制），这个脚本会退化成无操作，可以直接删。

## 验证

```bash
rm -rf node_modules/electron/dist node_modules/electron/path.txt
node scripts/ensure-electron.mjs   # 自动补齐，退出码 0
npx electron -v                    # 打印 v43.1.1
```
