# AGENTS.md —— 仓库脚本

规则见[根 AGENTS.md](../AGENTS.md)。

这些脚本是门禁，CI 会跑：`check_i18n.ts`、`check_song_field_reads.ts`、`verify-docs.ts`。其余是打包辅助脚本。

- 用 `bun` 执行（`package.json` 里显式写 `bun scripts/...`），本地与 CI 保持一致。
- 失败时打印**具体文件与行号 + 原因 + 怎么改**，让下一个人不用读脚本源码。
- **不要为了让门禁变绿而放宽规则**：往允许清单里加文件、把阈值调高、加 `// 忽略` 注释都属于放宽，要在 PR 里说明理由。
- 新增门禁脚本要同时接进 `package.json` 与 [.github/workflows/pr-check.yml](../.github/workflows/pr-check.yml)。
- 保持自洽：只用 Node 内置模块与仓库已有依赖，不引入新依赖。
