# AGENTS.md —— 渲染进程

规则见[根 AGENTS.md](../../AGENTS.md)；播放与音源的契约见 [docs/subsystems/](../../docs/subsystems/)。

- **数据**：音源数据只经 `api/musicSource.ts`，返回 `MusicSourceIpcResult<T>`——先判 `ok`，失败用 `code` 分支，别把 IPC 失败当异常抛。
- **播放**：换曲只走 `playbackCoordinator`；**不要直接 import `playbackController`**，也不要绕过列表层自己算下一首。理由见 [playback](../../docs/subsystems/playback.md)。
- **状态**：跨页面共享的进 `store/modules/*`；只服务单个页面的状态留在组件里。
- **文案**：用户可见文案走 i18n（`t('模块.语义')`），不硬编码中文。改完跑 `npm run lint:i18n`。
- **字段**：读 `SongResult` 的艺人/时长用 `songFields` / `toPlayableView`，别直接摸 `ar`/`dt`（门禁 `npm run lint:song-fields`）。
- **风格**：Composition API + `<script setup>`；组件文件 PascalCase、目录 kebab-case；样式优先 Tailwind。

## 验证

```bash
npm test        # vitest：streamPipeline / persistenceService / playlistPlayMode 等
npm run dev     # UI 与交互改动手动过一遍触及路径
```
