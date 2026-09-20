# Agent Note: 整仓改按 GPL-3.0-only 分发

Status: implemented

## 背景

仓库转公开后，许可证对不上：`LICENSE` 是 MIT（版权行还是上游作者），而依赖 `ly-music-source` 是 **GPL-3.0-only**，并且经 electron-vite 打包进了交付产物（`out/main/index.js` 里有它的代码）。GPL-3.0 是 copyleft：分发含它的二进制时，整个组合作品必须按 GPL-3.0 分发。`package.json` 此前没有 `license` 字段。

自动更新的产物（Release 里的安装包）就是二进制分发，所以这不是纸面问题。

## 决策

- `LICENSE` 换成 GPL-3.0 原文（不再自称 MIT）。
- 新增 [THIRD_PARTY_NOTICES.md](../../../../THIRD_PARTY_NOTICES.md)：保留上游 AlgerMusicPlayer 的 MIT 声明与许可原文，并说明音源库的 GPL 是整仓采用 GPL 的原因。
- `package.json` 补 `"license": "GPL-3.0-only"`；README 的许可行与声明段同步。

MIT 允许再许可（`sublicense`），所以把整体改为 GPL 合法；唯一硬性义务是保留上游版权声明与许可原文，这份义务由 NOTICES 承担。

## 放弃的方案

**把 `ly-music-source` 改成 MIT/LGPL，让 LYMusic 保住 MIT。** 该库 23 个提交同属一位版权人，法律上完全可行；但它的 README 是有意选的 GPL——包含 legal notice、明确声明不授予音乐内容许可、商业使用须自行取得授权。为了 App 的 LICENSE 标签好看而削掉这个姿态，不划算。

**保持 MIT 不动。** 公开仓库会显示 MIT，而二进制里含 GPL 代码，属于明确的许可证不一致；被指出来只是时间问题。

**只写一句「MIT + GPL 双许可」省掉 NOTICES。** 保留上游版权声明与许可原文是 MIT 的条件，不能省。

## 影响

- 源码与发布产物都按 GPL-3.0-only 分发：想闭源分发或商用要另行处理。
- 上游 MIT 声明移入 NOTICES 维护；改动上游代码时不需要改它，但不要删。
- GitHub 的许可证识别会跟随 `LICENSE`，与 `package.json` 字段保持一致。
- 这只是工程侧的许可证对齐，不构成法律意见。

## 验证

```bash
head -1 LICENSE                                  # GNU GENERAL PUBLIC LICENSE / Version 3
node -e "console.log(require('./package.json').license)"   # GPL-3.0-only
ls THIRD_PARTY_NOTICES.md                        # 存在且含上游 MIT 原文
```
