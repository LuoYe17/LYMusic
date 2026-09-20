# Agent Note: 自动更新源收口到本仓库的 Releases

Status: implemented

## 背景

仓库从 `AlgerMusicPlayer` 改名并转公开后，更新链路整条是断的，而且指错了对象：

- `package.json` 的 `build.publish.repo` 仍是 `AlgerMusicPlayer`，打包生成的 `app-update.yml` 因此指向另一个仓库；electron-updater 按它取 `latest.yml`，拿不到本项目的版本。
- `src/shared/appUpdate.ts` 的 `APP_UPDATE_RELEASE_URL` 与 TitleBar / AboutTab / TrafficWarningDrawer 的下载入口都写死旧仓库。
- `src/renderer/utils/update.ts` 另有一套渲染进程侧的检查：`api.github.com` 拉旧仓库的 release，经第三方聚合 `api.akams.cn` 取 ghproxy 节点兜底下载，还读 `VITE_GITHUB_TOKEN`（构建时注入前端包，等于把凭证交给任何解包的人）。
- 仓库私有期间，`releases/latest` 无 token 读不到，桌面端的自动更新本来也不可能工作。

## 决策

更新源只有一个：本仓库的 GitHub Releases。

- `package.json`：`homepage` 与 `build.publish.repo` 都改成 `LuoYe17/LYMusic`。
- `src/shared/appUpdate.ts`：新增 `APP_REPO_URL`，`APP_UPDATE_RELEASE_URL` 从它派生；组件一律引用这两个常量，不再手写地址。
- 删除 `src/renderer/utils/update.ts`：连同第三方代理节点、镜像兜底与 `VITE_GITHUB_TOKEN`。网页版不再做自建版本检查，只保留「官网更新」入口（跳 Releases）。
- 删除只服务旧链接的两个死组件：`MobileUpdateModal.vue`（APK 更新弹窗）、`InstallAppModal.vue`。

## 放弃的方案

**自建 feed（electron-updater 的 generic provider + 自己的服务器或对象存储）。** 仓库公开后 GitHub Releases 原生可读，不需要再维护一个更新目录、清理策略与证书；真遇到国内下载慢再换 provider，那时只需要改 `build.publish` 的 url，其余代码不动。

**保留渲染进程的 GitHub 检查，只去掉代理节点。** 网页版拿到版本号也装不了包，检查结果只是展示；为它保留一条并发请求路径与一个可能被注入的 token 不划算。桌面端的检查已经在主进程里，能力更全（下载、安装、进度）。

**给私有仓库配 token 以直连 release。** 桌面端里的凭证必然可被提取，等于把仓库读权限公开发放。

## 影响

- 更新源与品牌入口都只有一个常量出处；改仓库地址只需改 `APP_REPO_URL` 与 `build.publish`。
- 发布即更新源：推送 `v*` 标签产出的 Release 就是客户端升级来源，删掉历史资产会让落后版本无法升级。
- 网页版的「检查更新」按钮不再出现，改为「官网更新」；桌面端行为不变。
- 国内用户下载仍走 GitHub，速度取决于网络环境；若成为常态问题，按上面第一条换成 generic provider。
- `VITE_GITHUB_TOKEN` 彻底不再被读取，CI 里也不需要为它准备 secret。

## 验证

```bash
grep -rn "AlgerMusicPlayer\|VITE_GITHUB_TOKEN\|api.akams.cn" src   # 应无命中
npm run build                                                     # 渲染进程仍可构建
npm run build:win && cat dist/win-unpacked/resources/app-update.yml   # 应指向 LuoYe17/LYMusic
```

注意：`npm run build:unpack`（`electron-builder --dir`）**不会**生成 `app-update.yml`——electron-builder 只在 NSIS 这类合适的目标上写它（见 `app-builder-lib/out/publish/PublishManager.js` 的 `onAfterPack`）。要验证 feed 必须走 `build:win`。

本次实测结果：

- `build:win` 产出的 `dist/win-unpacked/resources/app-update.yml` 内容为 `owner: LuoYe17` / `repo: LYMusic` / `provider: github`。
- 同一次构建产出 `dist/latest.yml`（含各产物的 sha512 与 blockmap 引用）。流水线 [build.yml](../../../../.github/workflows/build.yml) 的 artifact 路径已包含 `dist/latest*.yml` 与 `dist/*.blockmap`，Release 步骤会把它们一并上传，因此更新链路完整。
- 剩余一步是发一个 `v*` 标签实际产出 Release，并在已安装的上一版上验证检查更新。
