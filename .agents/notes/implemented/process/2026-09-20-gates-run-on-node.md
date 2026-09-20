# Agent Note: 门禁脚本改用 node 跑，不再要求装 bun

Status: implemented

## 背景

`lint:i18n`、`lint:song-fields`、`verify:docs` 三个门禁是 TypeScript 文件，`package.json` 里原本写死用 `bun` 执行。而 husky 的 `pre-commit` 会跑 `npm run lint:i18n`——于是**没装 bun 的机器根本提交不了**：

```text
'bun' 不是内部或外部命令，也不是可运行的程序或批处理文件
husky - pre-commit script failed (code 1)
```

新克隆一个仓库、换一台机器，撞到的第一堵墙就是这个；仓库自己的规则又禁止把 `--no-verify` 当常规手段。CI 还得为此多装一个 `oven-sh/setup-bun` 动作（多一个供应链依赖与一处版本 pin）。

## 决策

三个门禁脚本用 `node` 直接跑：`npm run` 脚本里写 `node scripts/xxx.ts`。Node ≥22.18 原生支持类型抹除，不再需要任何额外运行时。

- `scripts/check_song_field_reads.ts` 的 `import.meta.dir`（Bun 专有）改成 `import.meta.dirname`（node ≥20.11 与 bun 都支持）。
- `package.json` 增加 `engines.node >= 22.18`，把真实要求写进仓库而不是靠口口相传。
- CI 的 Code Quality 移除 Setup Bun 步骤。

## 放弃的方案

**保留 bun，在 README 写明「提交前需安装 bun」。** 把一道环境准备工作推给每个新环境，而且失败点在提交那一刻才暴露；`pre-commit` 是本地最频繁的路径，不该依赖可选工具。

**引入 `tsx` / `esbuild-register` 之类的 TS 加载器。** node 已经原生能跑这些脚本，再加一层加载器只是多一个依赖要跟版本。

**给 `scripts/` 加一个 `package.json` 声明 `type: module`。** 唯一收益是消掉 node 打印的 `MODULE_TYPELESS_PACKAGE_JSON` 警告；为此新增一个寄生 package.json 不划算，警告本身无害。

## 影响

- 没装 bun 的机器现在能正常提交：`pre-commit` 的 i18n 检查走 node。
- CI 少一个 action 及其 pin；Node 版本要求变成硬要求（`engines` 与 CI 的 24 都满足）。
- 三个脚本在 bun 下依然能跑（改完的 `import.meta.dirname` 两边都支持），但 bun 不再是要求。
- 每次跑门禁会多一行 `MODULE_TYPELESS_PACKAGE_JSON` 警告，属 node 的提示，不影响结果。
- `scripts/export_i18n_report.ts` 仍然只用 `Bun.Glob` 且没接进任何 npm script：它是孤立脚本，不在门禁路径上；要用它得装 bun，或者以后改成 node 的 `fs.glob`。

## 验证

```bash
# bun 从 PATH 里去掉后，三个门禁仍应全绿
npm run lint:i18n && npm run lint:song-fields && npm run verify:docs

# 提交路径：pre-commit 会跑 lint:i18n，无 bun 时也应通过
git commit --allow-empty -m "chore: 验证钩子不依赖 bun"
```

CI 侧：Code Quality 不再有 Setup Bun 步骤，但 `lint:i18n` / `verify:docs` 照常运行。
