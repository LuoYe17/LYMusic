# AGENTS.md —— shared

规则见[根 AGENTS.md](../../AGENTS.md)。

- 只放主进程与渲染进程**都能用**的纯类型与工具；依赖 electron 或 DOM 的东西放回各自进程。
- `domain/` 是领域模型（`Track`、`songFields`、`trackAdapter`）：改字段或语义要同步 [docs/track-migration.md](../../docs/track-migration.md) 与音源 IPC 文档。
- 这里同时被两端引用，改签名的爆炸半径最大：先看调用方再动手。

## 验证

```bash
npx vitest run src/shared
```
