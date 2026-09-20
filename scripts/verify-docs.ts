/**
 * 文档门禁：决策笔记结构 + 常备文档字数预算。
 *
 * - 笔记规则（生命周期/分类/格式）见 .agents/notes/README.md
 * - 文档标准与预算规则见 docs/AGENTS.md
 *
 * Usage:
 *   bun scripts/verify-docs.ts          # 校验，失败退出 1
 *   bun scripts/verify-docs.ts --list   # 只打印各文档当前字数与上限
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';

// import.meta.dirname 在 bun 与 node ≥20 上都可用，方便本地直接用 node 跑
const ROOT = join(import.meta.dirname, '..');
const NOTES_ROOT = join(ROOT, '.agents/notes');
const BUDGETS_PATH = join(ROOT, 'scripts/doc-budgets.json');

/** 生命周期 → 状态行语法；只有 rejected 的状态行带内容 */
const STATUS: Record<string, RegExp> = {
  proposed: /^Status: proposed$/,
  implemented: /^Status: implemented$/,
  rejected: /^Status: rejected — .+$/
};

/** 生命周期 → 必需章节（`## 背景` 必为首节） */
const REQUIRED: Record<string, string[]> = {
  proposed: ['## 背景', '## 提案', '## 放弃的方案', '## 验收标准', '## 风险'],
  implemented: ['## 背景', '## 决策', '## 放弃的方案', '## 影响'],
  rejected: ['## 背景', '## 提案', '## 放弃的方案']
};

/** 分类是封闭集合，加分类要同时改规范与这里 */
const CLASSES = new Set(['arch', 'feature', 'bug-fix', 'simplification', 'process', 'testing']);

/** implemented 笔记里禁止出现的提案期标题（中文后面没有 \b，不能用词边界） */
const PROPOSAL_HEADINGS = /^## (?:提案|计划|迁移步骤|验收标准|风险)(?:[：:\s]|$)/;

const NOTE_FILE_NAME = /^(\d{4})-(\d{2})-(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

const errors: string[] = [];

/** 机器维护的区块不计入预算（HTML 注释，以及 CodeGraph 段） */
function budgetText(raw: string): string {
  return raw
    .replace(/<!-- CODEGRAPH_START -->[\s\S]*?<!-- CODEGRAPH_END -->/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** 去空白字符数：中文按字算，`wc -w` 对中文没有意义 */
function countChars(text: string): number {
  return text.replace(/\s/g, '').length;
}

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function checkNote(absolute: string): void {
  const rel = relative(ROOT, absolute).replace(/\\/g, '/');
  const segments = relative(NOTES_ROOT, absolute).replace(/\\/g, '/').split('/');
  const [lifecycle, category, fileName] = segments;
  const fail = (message: string, line?: number): void => {
    errors.push(`笔记 ${rel}${line === undefined ? '' : `:${line}`} — ${message}`);
  };

  if (segments.length !== 3) {
    fail('笔记必须放在 {生命周期}/{分类}/ 两层目录下');
    return;
  }
  if (!(lifecycle! in STATUS)) {
    fail(`生命周期目录必须是 proposed / implemented / rejected，当前是 ${lifecycle}`);
    return;
  }
  if (!CLASSES.has(category!)) {
    fail(
      `未知分类 ${category}；允许的分类：${[...CLASSES].join(' / ')}（见 .agents/notes/README.md）`
    );
    return;
  }
  const matched = NOTE_FILE_NAME.exec(fileName!);
  if (!matched) {
    fail('文件名必须是 yyyy-mm-dd-english-slug.md（标题写进正文 H1）');
    return;
  }
  if (!isValidDate(Number(matched[1]), Number(matched[2]), Number(matched[3]))) {
    fail(`文件名日期 ${matched[1]}-${matched[2]}-${matched[3]} 不是有效日期`);
    return;
  }

  const lines = readFileSync(absolute, 'utf8').split('\n');
  if (!/^# Agent Note: \S/.test(lines[0] ?? '')) {
    fail('第 1 行必须是 `# Agent Note: <标题>`', 1);
  }
  if (lines[1] !== '') fail('第 2 行必须是空行', 2);
  const statusPattern = STATUS[lifecycle!]!;
  if (!statusPattern.test(lines[2] ?? '')) {
    fail(
      `第 3 行状态行不符合 ${lifecycle} 的语法：${lifecycle === 'rejected' ? 'Status: rejected — <原因>' : `Status: ${lifecycle}`}`,
      3
    );
  }
  if (lines[3] !== '') fail('第 4 行必须是空行', 4);

  const extraStatus = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) => index !== 2 && line.startsWith('Status:'));
  for (const { index } of extraStatus) {
    fail('全文件只能有一行 `Status:`，且必须在第 3 行', index + 1);
  }

  const headings = lines.filter((line) => line.startsWith('## ')).map((line) => line.trimEnd());
  if (headings[0] !== '## 背景') {
    fail(`首个章节必须是 \`## 背景\`，当前是 ${headings[0] ?? '（没有二级标题）'}`);
  }
  for (const required of REQUIRED[lifecycle!]!) {
    if (!headings.includes(required)) {
      fail(`缺少必需章节 \`${required}\`（${lifecycle} 的骨架见 .agents/notes/README.md）`);
    }
  }
  if (lifecycle === 'implemented') {
    for (const heading of headings.filter((item) => PROPOSAL_HEADINGS.test(item))) {
      fail(
        `\`${heading}\` 是提案期标题；implemented 笔记要写成现在时，把它折进 \`## 决策\` / \`## 影响\` / \`## 验证\``
      );
    }
  }
}

function walkNotes(): string[] {
  if (!existsSync(NOTES_ROOT)) return [];
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const absolute = join(dir, entry);
      if (statSync(absolute).isDirectory()) {
        walk(absolute);
      } else if (entry.endsWith('.md')) {
        found.push(absolute);
      }
    }
  };
  walk(NOTES_ROOT);
  return found;
}

// —— 检查一：笔记结构与索引禁令 ——
const noteFiles = walkNotes();
for (const note of noteFiles) {
  const name = relative(NOTES_ROOT, note).replace(/\\/g, '/');
  // README / AGENTS 是本目录的规范文件，不是笔记
  if (name === 'README.md' || name === 'AGENTS.md') continue;
  checkNote(note);
}
for (const note of noteFiles) {
  const name = relative(NOTES_ROOT, note).replace(/\\/g, '/');
  if (name.toUpperCase().includes('INDEX')) {
    errors.push(
      `笔记 ${'.agents/notes/' + name} — 不维护集中索引（原因见 .agents/notes/README.md § 不设索引），请删掉它`
    );
  }
}
if (existsSync(join(ROOT, 'docs/INDEX.md'))) {
  errors.push('docs/INDEX.md — 文档目录本身就是索引，不要集中索引文件');
}

// —— 检查二：Markdown 相对链接可解析（不校验锚点） ——
function walkMarkdown(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const absolute = join(dir, entry);
    if (statSync(absolute).isDirectory()) walkMarkdown(absolute, found);
    else if (entry.endsWith('.md')) found.push(absolute);
  }
  return found;
}

for (const file of walkMarkdown(ROOT)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  for (const match of readFileSync(file, 'utf8').matchAll(/\]\(([^)\s]+)\)/g)) {
    const [target] = match[1]!.split('#');
    // 带 scheme 的一律放过：http(s)、mailto、local:// 等
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    if (!existsSync(resolve(dirname(file), decodeURIComponent(target)))) {
      errors.push(`链接 ${rel} — 指向不存在的文件：${target}（搬家要在同一次改动里改引用）`);
    }
  }
}

// —— 检查三：字数预算 ——
const budgets = JSON.parse(readFileSync(BUDGETS_PATH, 'utf8')) as Record<string, number>;
const listOnly = process.argv.includes('--list');
const rows: string[] = [];

for (const [path, ceiling] of Object.entries(budgets)) {
  const absolute = join(ROOT, path);
  if (!Number.isInteger(ceiling) || ceiling <= 0) {
    errors.push(`预算 ${path} — 上限必须是正整数，当前是 ${ceiling}`);
    continue;
  }
  if (!existsSync(absolute)) {
    errors.push(
      `预算 ${path} — 文件不存在（改名或删除后，同一次改动里更新 scripts/doc-budgets.json）`
    );
    continue;
  }
  const chars = countChars(budgetText(readFileSync(absolute, 'utf8')));
  const ratio = chars / ceiling;
  const mark = chars > ceiling ? '超出' : ratio > 0.95 ? '临界' : 'ok  ';
  rows.push(`${mark}  ${String(chars).padStart(5)} / ${String(ceiling).padEnd(5)} ${path}`);
  if (chars > ceiling) {
    errors.push(
      `预算 ${path} — ${chars} 字超出上限 ${ceiling}：先搬迁（内容属于别的层级就搬走并留链接），再压缩；确实需要空间才调高上限，并在 PR 里说明`
    );
  }
}

if (listOnly) {
  console.log(rows.join('\n'));
  process.exit(0);
}

if (errors.length > 0) {
  console.error('verify-docs 失败：\n');
  for (const error of errors) console.error(`  ${error}`);
  console.error('\n规范：.agents/notes/README.md（笔记）、docs/AGENTS.md（文档与预算）');
  process.exit(1);
}

console.log(
  `verify-docs：${noteFiles.filter((f) => !/[/\\](README|AGENTS)\.md$/.test(f)).length} 篇笔记结构正确，${rows.length} 篇文档在预算内。`
);
