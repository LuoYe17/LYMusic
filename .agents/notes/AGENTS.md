# AGENTS.md —— Agent Notes 子目录

笔记的规范在 [README.md](README.md)，文档通用标准在 [docs/AGENTS.md](../../docs/AGENTS.md)。

**每新增一篇笔记，先做一次取代检查**：在活跃目录树（`proposed/`、`implemented/`、`rejected/`）里搜同一决策或同一机制的旧笔记。能整体取代的，在同一个提交里把旧笔记改写成新结论或删掉；只能部分取代的，两篇都留着并互相链接，同时把仍然成立的事实改对。

`proposed/` 的笔记在代码落地时必须改写：状态行、`## 提案` → 现在时的 `## 决策`、`## 验收标准`/`## 风险` 折进 `## 影响` 或 `## 验证`。

`rejected/` 的笔记一经写入即冻结：只在状态行补否决原因，正文不再改。

写完跑 `npm run verify:docs`（等同 `bun scripts/verify-docs.ts`），它会校验状态行、必需章节、分类目录与文件名日期。
