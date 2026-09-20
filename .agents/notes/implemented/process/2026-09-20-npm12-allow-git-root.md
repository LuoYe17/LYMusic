# Agent Note: 用 .npmrc 放行直接 git 依赖，让新克隆装得上包

Status: implemented

## 背景

`ly-music-source` 是按 tag 锁定的 git 依赖：

```json
"ly-music-source": "git+https://github.com/LuoYe17/ly-music-source.git#v0.1.24"
```

npm 12 起默认 `allow-git=none`，直接拒绝安装 git 依赖，报 `EALLOWGIT: Fetching packages of type "git" have been disabled`。新克隆一个仓库、换一台机器、或 CI 里 npm 跟着 Node 升级，`npm install` / `npm ci` 就会当场失败——本次检查里已经真实复现过一次。

CI 此前一直是绿的，只是因为它的 Node 24 自带的 npm 还没收紧到这一步，属于运气而不是保障。

## 决策

仓库根目录放 [`.npmrc`](../../../../.npmrc)，写一行 `allow-git=root`。

`root` 只放行**本项目自己声明的** git 依赖：`package.json` 里那一个 `ly-music-source` 能装，传递依赖里的 git 引用仍然被拒。配置文件随仓库走，新机器与 CI 一视同仁，不用任何人记住额外参数。

## 放弃的方案

**`allow-git=all`。** 它会把整个供应链限制放开——将来某个传递依赖偷偷换成 git 源也能装进来，而我们只是要放行自己声明的这一个依赖。

**每次手敲 `npm install --allow-git=root`。** 不可发现：新克隆的人、CI 配置、以及未来的自己都不会知道需要这个参数；写进 README 也会随 npm 版本变化而失效。

**改成 tarball URL 或发到 npm registry。** npm 12 的 `allow-remote` 默认同样是 `none`，tarball URL 一样会被拦；发 registry 要额外维护一条发布链路，而 tag 锁定的 git 依赖已经能满足「固定版本 + 可追溯」。

## 影响

- 新克隆、CI、本地都能直接 `npm install` / `npm ci`，`.npmrc` 被删掉就会退回 `EALLOWGIT`。
- npm 12 仍然会拦下 5 个依赖的 install script（`vue-demi`、`@parcel/watcher`、`electron-winstaller`、`esbuild` ×2），这是 `allowScripts` 策略，与本次改动无关：实测 `build`、18 个测试文件、`typecheck` 全部不受影响，不要为了消掉警告把它们加进白名单。
- `package.json` 的 `allowScripts` 已经白名单了 `electron` 与 `ly-music-source`（electron 需要下载二进制），本次不动。

## 验证

```bash
rm -rf node_modules && npm ci    # 干净环境安装，不加任何额外参数
npm run build && npx vitest run && npm run typecheck
```
