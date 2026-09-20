# 子系统：播放

播放是所有改动最容易碰坏的地方，因为它天然异步、天然有竞态。规则只有一条：**换曲只走 `playbackCoordinator`**。

## 指挥链

```text
UI / hooks
  → playlist.setPlay | nextPlay | prevPlay      列表层：索引、连点合并、同曲 toggle
  → playbackCoordinator.playTrack              唯一换曲入口
  → playbackController.playTrack               generation 取消 + 解析 + 元数据
  → audioService.play | preload                双槽音频
```

模块内的权威说明写在 `src/renderer/services/playbackCoordinator.ts` 头部注释；本文件只补它没说清的不变式。

**不变式**

- UI、hooks、组件**不直接 import `playbackController`**。改音质、前缀升级、启动恢复这些例外也经 coordinator 暴露。
- 列表语义（下一首/上一首、单曲循环、连点同曲 toggle）留在 `playlist` 层，不要塞进 controller。
- `playbackCoordinator` 不静态导入 Pinia（会成环），需要 store 时由 controller 动态 import。

## 竞态怎么防的

- **generation**：每次 `playTrack` 递增计数器，异步 `await` 回来后校验是否仍是最新——过期结果直接丢弃（`getCurrentGeneration` 可在调试时观察）。
- **URL 过期**：`setupUrlExpiredHandler` 注册在 coordinator 上，解析出的播放地址失效时重新解析并从当前进度接上。

## 双槽音频

`audioService` 持有两个 `AudioSlot`（`slots: [AudioSlot, AudioSlot]`，`activeSlot` / `standbySlot`），用来做无感换档：后台槽加载就绪后再切换，避免 audible gap。`seamlessSwitchQuality`（改音质、后台升质）与 `tryUpgradePartialStreamNow`（前缀秒播 → 完整文件）都建立在这套双槽机制上。

改这两条路径时不要退回单槽或直接替换 `src`——那会引入可听见的断点。

## 状态模型

| 类型              | 活在哪                       | 说明                                   |
| ----------------- | ---------------------------- | -------------------------------------- |
| `Track`           | `src/shared/domain/track.ts` | 元数据（曲名、艺人、专辑、时长）       |
| `PlaybackRuntime` | 渲染进程会话态               | 播放进度、音质、是否正在播放等运行信息 |
| `SongResult`      | 音源返回                     | 外部数据形状，读字段用 `songFields`    |

详细迁移进度见 [track-migration](../track-migration.md)。

## 验证

`src/renderer/services/streamPipeline.test.ts`、`persistenceService.test.ts` 覆盖了流与前缀升级的一部分逻辑，`npm test` 会跑。改播放主路径时手动必过：连续快速切歌（验证 generation 丢弃）、切音质（验证双槽接续）、断网后恢复（验证 URL 过期重解析）。
