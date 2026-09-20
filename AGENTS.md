# AGENTS.md —— LYMusic 协作与代理规则

> 面向人类贡献者与 AI 代理。改代码前先读本文。每条规则只写一次，细节去它的"家"；与代码冲突时以代码为准，并在同一次改动里改文档。

## 项目

LYMusic：Electron + Vue 3 桌面音乐播放器（AlgerMusicPlayer 的个人维护版），在线音源走主进程的 `ly-music-source`。

结构、启动顺序、扩展点 → [docs/architecture.md](./docs/architecture.md)｜上手命令 → [README.md](./README.md#快速开始)

## 规则

1. **走分支 + PR**，`main` 永远可发布：禁止直接提交 `main`，禁止 force-push `main`。
2. **小 PR，一个 PR 讲一个故事**：无关重构、依赖大升级、全库格式化另开分支。
3. **中文说人话，不要 emoji**：commit 与 PR 标题走 Conventional Commits（好：`fix(player): 暂停键别再自己去摸鱼了`；差：`fix: 修复bug`）。
4. **先读再改**：定位真实调用链再动手，不猜 IPC 通道名、store 字段、路径常量。
5. **外科手术式 diff**：只改完成任务所需的行，不做顺手大重构。
6. **跟随仓库既有风格**：Composition API + `<script setup>`、kebab-case 目录、PascalCase 组件、优先 `type`。
7. **验证过才算完成**：跑门禁并说明验证路径，"应该没问题"不算。
8. **不留破窗**：碰出来的坏味道顺手修；无关问题报告，不悄悄带过。
9. **不提交敏感物**：密钥、Cookie、session、个人配置、大二进制垃圾，也不写进日志。
10. **文档跟代码走**：行为或架构变了，同一次改动里更新对应文档。
11. **代理的 Git 边界**：不 force-push、不改他人历史、不发版、不动保护分支；push 与开 PR 按用户授权执行，不常规使用 `--no-verify`。

## 门禁

```bash
npm run lint          # oxlint + i18n + SongResult 字段读取
npm run typecheck     # 主进程 + 渲染进程
npm test              # vitest
npm run verify:docs   # 文档分层与决策笔记
```

## 决策笔记

引入取舍的**非平凡改动**，在 [.agents/notes/](./.agents/notes/README.md) 留一篇笔记：背景、决策、**放弃的方案**、影响。豁免：改样式、调文案、局部 UI 微调、单点 bug 修。

## 领域入口

| 主题                        | 去哪                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| 结构、启动顺序、扩展点      | [docs/architecture.md](./docs/architecture.md)                                                  |
| 音源 IPC 契约与凭证         | [docs/subsystems/music-source-ipc.md](./docs/subsystems/music-source-ipc.md)                    |
| 播放指挥链与竞态            | [docs/subsystems/playback.md](./docs/subsystems/playback.md)                                    |
| 窗口 / 托盘 / 快捷键 / 更新 | [docs/subsystems/desktop-shell.md](./docs/subsystems/desktop-shell.md)                          |
| 路径与 URL 校验、权限白名单 | [docs/subsystems/security-boundaries.md](./docs/subsystems/security-boundaries.md)              |
| 文案与语言                  | [docs/subsystems/i18n.md](./docs/subsystems/i18n.md)                                            |
| Track / SongResult 领域     | [docs/track-migration.md](./docs/track-migration.md)                                            |
| 发版与 Flow 操作            | [docs/cookbook/](./docs/cookbook/)                                                              |
| 文档写作规则与字数预算      | [docs/AGENTS.md](./docs/AGENTS.md)                                                              |
| 模块级规则                  | `src/main`、`src/renderer`、`src/preload`、`src/shared`、`src/i18n`、`scripts` 下的 `AGENTS.md` |

完成定义：上面四条门禁全绿，文档与 CHANGELOG 同步，非平凡取舍有笔记，diff 可审查，没用 `--no-verify` 掩盖问题。
