# AGENTS.md —— i18n

规则见[根 AGENTS.md](../../AGENTS.md)；子系统契约见 [docs/subsystems/i18n.md](../../docs/subsystems/i18n.md)。

- **当前只有 `zh-CN`**：不要凭空新增语言目录，也不要恢复已删除的 en-US / ja-JP / ko-KR / zh-Hant。
- 文案按功能分文件放在 `lang/zh-CN/*.ts`；key 用 `模块.语义`，不用序号。
- 新增语言文件**不需要登记**：`utils.ts` 用 `import.meta.glob` 自动收集。
- 主进程要显示的文案走 `src/i18n/main.ts`，渲染进程走 vue-i18n 的 `t()`；两侧都不要硬编码字符串。
- 改完跑 `npm run lint:i18n`——它会报缺失键、多余键，以及代码里引用了不存在的 key。
