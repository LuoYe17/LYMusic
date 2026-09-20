# AGENTS.md —— LYMusic 协作与代理规则

> 面向人类贡献者与 AI 代理。改代码前先读本文。每条规则只在这里写一次，细节去它的"家"；与代码冲突时以代码为准，并在同一次改动里改文档。

## 1. 这是什么

LYMusic 是基于 [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) 的魔改版 Electron 桌面音乐播放器（包名 `LYMusicPlayer`，`appId` `com.luoye.music`），在线检索与播放由主进程的 `ly-music-source` 提供。

结构、启动顺序、扩展点 → [docs/architecture.md](./docs/architecture.md)｜启动与打包命令 → [DEV.md](./DEV.md)

## 2. 常备规则

1. **工作走分支 + PR**，`main` 永远可发布：禁止直接往 `main` 提交，禁止 force-push `main`。
2. **小 PR，一个 PR 讲一个故事**：无关重构、依赖大升级、全库格式化另开分支。鼓励并行多开短分支。
3. **报文用中文，不要 emoji**：commit 与 PR 标题走 Conventional Commits，说明口语但不空洞（好：`fix(player): 暂停键别再自己去摸鱼了`；差：`fix: 修复bug`）。
4. **先读再改**：定位真实调用链再动手，不猜 IPC 通道名、store 字段、路径常量。
5. **外科手术式 diff**：只改完成任务所需的行，不做顺手大重构。
6. **跟随仓库既有风格**：Composition API + `<script setup>`、kebab-case 目录、PascalCase 组件、优先 `type`。
7. **验证过再说完成**：跑相应门禁并说明验证路径，"应该没问题"不算。
8. **不留破窗**：碰出来的坏味道顺手修；发现无关问题就报告，不悄悄带过、不假装没看见。
9. **不提交敏感物**：密钥、Cookie、session、个人配置、大型二进制垃圾，也不写进日志。
10. **文档跟着代码走**：行为或架构变了，同一次改动里更新对应文档，别让文档撒谎。
11. **代理的 Git 边界**：不擅自 force-push、不改他人历史、不发版、不动保护分支；push 与开 PR 按用户授权执行，不常规使用 `--no-verify`。

## 3. 门禁

合并前本地就该绿，CI（[pr-check.yml](./.github/workflows/pr-check.yml)）会再跑一遍：

```bash
npm run lint          # oxlint + i18n + SongResult 字段读取
npm run typecheck     # 主进程 + 渲染进程
npm test              # vitest
npm run verify:docs   # 文档与决策笔记
```

## 4. 决策笔记

引入取舍的**非平凡改动**要在 [.agents/notes/](./.agents/notes/README.md) 留一篇笔记：背景、决策、**放弃的方案**、影响。规范见该目录的 README。

豁免：改样式、调文案、局部 UI 微调、单点 bug 修（除非这个坑值得记住）。

## 5. 各领域的家

| 主题                        | 去哪                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| 结构、启动顺序、扩展点      | [docs/architecture.md](./docs/architecture.md)                                                  |
| 音源 IPC 契约与凭证         | [docs/subsystems/music-source-ipc.md](./docs/subsystems/music-source-ipc.md)                    |
| 播放指挥链与竞态            | [docs/subsystems/playback.md](./docs/subsystems/playback.md)                                    |
| 窗口/托盘/快捷键/更新/MPRIS | [docs/subsystems/desktop-shell.md](./docs/subsystems/desktop-shell.md)                          |
| 路径与 URL 校验、权限白名单 | [docs/subsystems/security-boundaries.md](./docs/subsystems/security-boundaries.md)              |
| 文案与语言                  | [docs/subsystems/i18n.md](./docs/subsystems/i18n.md)                                            |
| Track / SongResult 领域     | [docs/track-migration.md](./docs/track-migration.md)                                            |
| 操作手册（Flow、发版）      | [docs/cookbook/](./docs/cookbook/)                                                              |
| 文档写作规则与字数预算      | [docs/AGENTS.md](./docs/AGENTS.md)                                                              |
| 各目录的模块级规则          | `src/main`、`src/renderer`、`src/preload`、`src/shared`、`src/i18n`、`scripts` 下的 `AGENTS.md` |

## 6. 完成定义

- [ ] 独立分支、命名规范、范围单一
- [ ] commit / PR 标题符合 Conventional Commits，说明用中文
- [ ] lint / typecheck / test / verify:docs 通过
- [ ] 手动验证路径已说明（或已有自动化）
- [ ] 相关文档与 CHANGELOG 已更新，或标明无需
- [ ] 非平凡取舍已留 Agent Note，或说明为何豁免
- [ ] 无密钥、无无关大文件、无 `--no-verify` 掩盖问题

---

<!-- CODEGRAPH_START -->

## CodeGraph

This project has a CodeGraph MCP server configured, exposing a single tool: `codegraph_explore`. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### Use codegraph_explore instead of reading files

Reach for `codegraph_explore` before grep/find or Read for any **structural** question — how does X work, how does X reach Y, what calls what, where is X defined, or surveying an area. It takes a natural-language question or a bag of symbol/file names and returns the relevant symbols' **verbatim, line-numbered source** grouped by file (the same `<n>\t<line>` shape Read gives you, safe to Edit from), plus the call paths between them — including dynamic-dispatch hops (callbacks, React re-render, JSX children) grep can't follow — and a blast-radius summary of what depends on them. Name a file or symbol in the query to read its current source.

### Rules of thumb

- **Answer directly — don't delegate exploration.** ONE `codegraph_explore` usually answers the whole question; follow up with another `codegraph_explore` naming more specific symbols if you need more. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep or Read first** to find or understand indexed code — one `codegraph_explore` returns the relevant source in a single round-trip. Reach for raw Read/Grep only to confirm a specific detail codegraph didn't cover, or for what it doesn't index (configs, docs).
- **Index lag — check the staleness banner, don't guess a wait.** When a codegraph response starts with "⚠️ Some files referenced below were edited since the last index sync…", the listed files are pending re-index — Read those specific files for accurate content. Files NOT in that banner are fresh and codegraph is authoritative for them.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: _"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"_
<!-- CODEGRAPH_END -->
