# Agent Note: 质量门禁改用 oxlint，并让 CI 与 package.json 对齐

Status: implemented

## 背景

仓库早已切到 oxlint（根目录只剩 `.oxlintrc.json`，没有 `eslint.config.*`），但 PR CI 的 Code Quality 仍在跑 `npx eslint`——结果是 lint 步骤必挂，门禁名存实亡。同时 `SongResult` 的镜像字段（`ar` / `dt`）正在往 `songFields` 迁移，需要一个能自动拦住"新代码继续读旧字段"的检查，光靠约定守不住。

## 决策

门禁以 `package.json` 的脚本为唯一事实来源，CI 只负责调用它们：

- `lint:ox` = `oxlint ./src`；`lint` = `oxlint --fix` + `lint:i18n` + `lint:song-fields`。
- `lint:song-fields` 是 P0 门禁：禁止业务代码直接读 `ar` / `dt`，允许清单之外的新违规直接失败。
- CI 的 Code Quality 跑 `lint:ox` 与 `lint:song-fields`，并保留 typecheck、单测、i18n 检查。
- `575835f` 把当时 oxlint 报出的八条告警清零，此后 CI 维持零告警。

## 放弃的方案

**修好 ESLint 配置并搬回 ESLint**：仓库的迁移已经完成，搬回去要重建插件与规则矩阵，等于走回头路；oxlint 零配置、快，足以覆盖这个仓库的检查需求。

**先把 CI 里的 lint 步骤注释掉、本地再说**：这是"过 CI 而跳过 lint"的做法，门禁会变成装饰；正确做法是让 CI 调用仓库已有的脚本。

（本节依据 `69b9a6b` 的提交说明与当时的配置现状还原：提交里明确写了"仓库已无 eslint.config，Code Quality 仍跑 npx eslint 会直接挂"。）

## 影响

- 新增检查要同时改 `package.json` 与 `.github/workflows/pr-check.yml`，两处都指向脚本名，不重复写命令。
- 本地与 CI 走同一套脚本；脚本是 TS 文件，最初用 `bun` 跑，后来改成 `node` 直接跑（见[门禁脚本改用 node](2026-09-20-gates-run-on-node.md)），现在两者都能跑。
- 门禁的允许清单（`LEGACY_ALLOW` / `ALLOW_PREFIXES`）是存量豁免，不是新增入口：往里加条目要在 PR 里说明。

## 验证

- `npm run lint` 在本地应零失败；CI 的 Code Quality 与本地一致。
- `lint:song-fields` 能拦住新违规：在业务代码里写一处 `song.dt` 应立刻报错并指出文件与行号。
