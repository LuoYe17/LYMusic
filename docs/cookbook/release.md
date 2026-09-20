# 操作手册：发版

流水线：推送 `v*` 标签 → [build.yml](../../.github/workflows/build.yml) 在 Windows 与 Linux 上构建 → 建 GitHub Release，说明从 `CHANGELOG.md` 抽取。

## 步骤

1. **改版本号**：`package.json` 的 `version`（语义化版本）。
2. **写更新日志**：在 `CHANGELOG.md` 加一段，标题必须是 `## [vX.Y.Z]`（与标签一致，抽取靠这个正则）。

   ```markdown
   ## [v5.2.0]

   ### 新增

   - ...
   ```

3. **跑一遍上线前检查**：`npm run lint && npm run typecheck && npm test && npm run verify:docs`。
4. **提交并打标签**（标签必须带 `v` 前缀，形如 `v5.2.0`）：

   ```bash
   git commit -am "chore(release): 5.2.0"
   git tag v5.2.0
   git push origin main --follow-tags
   ```

5. 等 CI 出 Release，核对产物与说明段落。

## 产物范围

发布产物同时是**自动更新源**：electron-updater 读同一次发布里的 `latest.yml` 取版本与文件清单，所以不要手动删已发布版本的资产——落后的客户端要靠它们升级上来。

| 平台    | 目标                                   | 在 CI 里 |
| ------- | -------------------------------------- | -------- |
| Windows | NSIS（x64 / arm64）                    | 是       |
| Linux   | AppImage / deb / rpm（x64 / arm64）    | 是       |
| macOS   | 无（electron-builder 里没有 mac 配置） | 否       |

本地手动打包用 `npm run build:win` / `npm run build:linux`（输出 `dist/`）；`npm run build:unpack` 出未打包目录，用于排查打包后行为差异。

## 坑

- **标签不带 `v` 不会触发**，`on.push.tags` 只匹配 `v*`。
- **CHANGELOG 标题写成 `## [5.2.0]`** 会导致 Release 说明为空——抽取按 `## [v<版本>]`。
- 版本号只改 `package.json` 不够，`CHANGELOG.md` 没对应段落时 Release 说明同样是空的。
- macOS 相关：`electron-builder` 配置与 CI 都不覆盖 mac；`scripts/merge_latest_mac_yml.mjs` 是上游遗留脚本，当前没有任何脚本引用它，不要按它推断 mac 流程。
