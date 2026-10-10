import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = process.argv.slice(2);
const scanRoots = roots.length ? roots : ['.'];
const files = [];

async function walk(entry) {
  const info = await (await import('node:fs/promises')).stat(entry);
  if (info.isDirectory()) {
    for (const name of await readdir(entry)) {
      if (name === '.git' || name === 'node_modules') continue;
      await walk(path.join(entry, name));
    }
    return;
  }
  if (/\.html?$/i.test(entry)) files.push(entry);
}

for (const root of scanRoots) await walk(root);

const violations = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (source.includes('\\n')) violations.push(file);
}

if (violations.length) {
  console.error('发现被错误保存为字面量 \\n 的 HTML 文件：');
  for (const file of violations) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log(`HTML 换行检查通过：${files.length} 个文件没有字面量 \\n。`);
}
