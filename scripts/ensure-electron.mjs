#!/usr/bin/env node
/**
 * 确保 electron 二进制已就位。
 *
 * electron 43 的 npm 包**不再带 postinstall**，二进制改由显式的 bin
 * （`install-electron`）下载：装完依赖后 `node_modules/electron/dist` 是空的，
 * 而 electron-vite 启动时要读 `path.txt`，于是报 "Electron uninstall"。
 * 这个坑跟 npm 12 的脚本审批无关，纯粹是「装依赖不再等于装二进制」。
 *
 * 用法：在 `npm run dev` / `npm run start` 前跑一次。已经装好就立即退出（几毫秒），
 * 缺失时补下载；官方源失败会自动改走 npmmirror（国内网络常见）。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const electronDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'electron');
const installScript = join(electronDir, 'install.js');
const pathFile = join(electronDir, 'path.txt');
const MIRROR = 'https://npmmirror.com/mirrors/electron/';

/**
 * path.txt 里存的是相对 dist/ 的路径（本版本写入的是 `electron.exe`），
 * electron 自己的 index.js 就是按 `join(__dirname, 'dist', 内容)` 解析的。
 */
function binaryReady() {
  if (!existsSync(pathFile)) return false;
  try {
    const relative = readFileSync(pathFile, 'utf8').trim();
    if (!relative) return false;
    return [join(electronDir, 'dist', relative), join(electronDir, relative)].some(existsSync);
  } catch {
    return false;
  }
}

if (binaryReady()) process.exit(0);

if (!existsSync(installScript)) {
  console.error('[ensure-electron] 找不到 node_modules/electron，先跑 npm install');
  process.exit(1);
}

const attempt = (env) =>
  spawnSync(process.execPath, [installScript], {
    cwd: electronDir,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  }).status === 0;

if (attempt({}) && binaryReady()) {
  console.log('[ensure-electron] electron 二进制已补齐');
  process.exit(0);
}

console.log('[ensure-electron] 默认源没成功，改用 npmmirror 重试…');
if (attempt({ ELECTRON_MIRROR: MIRROR }) && binaryReady()) {
  console.log('[ensure-electron] electron 二进制已补齐（npmmirror）');
  process.exit(0);
}

console.error(
  '[ensure-electron] 二进制仍缺失。手动重试：\n' +
    `  ELECTRON_MIRROR=${MIRROR} npx install-electron\n` +
    '国内网络可以长期免手动：npm config set electron_mirror ' +
    MIRROR
);
process.exit(1);
