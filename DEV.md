# LYMusic 开发文档

> 基于 AlgerMusicPlayer 的魔改版（产品名 LYMusic / LYMusicPlayer）。
> 结构与启动顺序见 [docs/architecture.md](./docs/architecture.md)；贡献与代理规则见 [AGENTS.md](./AGENTS.md)；产品简介见 [README.md](./README.md)。

## 技术栈

| 类别     | 选型                                                             |
| -------- | ---------------------------------------------------------------- |
| 桌面壳   | Electron、electron-vite、electron-builder                        |
| 前端     | Vue 3、TypeScript、Vue Router                                    |
| UI       | naive-ui、Tailwind CSS、remixicon                                |
| 状态     | Pinia（+ persistedstate）                                        |
| 工具     | VueUse、axios、howler 等                                         |
| 在线音源 | `ly-music-source`（主进程 client，IPC 到渲染进程）               |
| 国际化   | vue-i18n（当前仅简体中文，见 [i18n](./docs/subsystems/i18n.md)） |
| 质量     | oxlint、Prettier、commitlint、husky、lint-staged                 |

## 如何启动

安装依赖（Node 18+；CI 用 Node 24）：

```bash
npm install
```

桌面端：

```bash
npm run dev
```

网页端：

```bash
npm run dev:web
```

网页端没有 Electron 主进程，依赖 IPC 的在线音源能力不可用，只适合调 UI。

## 质量检查

```bash
npm run lint          # oxlint + i18n + SongResult 字段读取门禁
npm run typecheck     # 主进程 + 渲染进程
npm test              # vitest
npm run format        # Prettier
npm run verify:docs   # 文档与决策笔记门禁
```

- `lint:i18n`、`lint:song-fields`、`verify:docs` 都通过 `bun` 执行 TS 脚本，本地没装 [bun](https://bun.sh) 时与 CI 行为会不一致。
- `src/renderer/auto-imports.d.ts`、`components.d.ts` 由 unplugin 生成且不入库；完整 `typecheck` 前先 `npm run build` 或启动过一次 dev。

## 打包

```bash
npm run build:win       # Windows NSIS（x64 / arm64）
npm run build:linux     # AppImage / deb / rpm
npm run build:unpack    # 未打包目录，便于排查打包后行为差异
```

安装包输出到 `dist/`，electron-vite 构建输出到 `out/`（含 `main` / `preload` / `renderer`）。

macOS 未接入：`electron-builder` 没有 mac 配置，CI 也不构建。发版流程见 [docs/cookbook/release.md](./docs/cookbook/release.md)。

## 相关文档

- [docs/architecture.md](./docs/architecture.md) — 结构全景与扩展点
- [docs/subsystems/](./docs/subsystems/) — 子系统当前契约
- [docs/cookbook/](./docs/cookbook/) — 操作手册
- [.agents/notes/](./.agents/notes/README.md) — 决策理由与放弃的方案
- [AGENTS.md](./AGENTS.md) — 贡献与 AI 代理规则
