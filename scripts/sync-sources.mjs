#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function sh(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

async function loadConfig() {
  const p = resolve(root, 'sources.config.json');
  if (!existsSync(p)) {
    console.error('sources.config.json が見つかりません');
    process.exit(1);
  }
  const raw = await readFile(p, 'utf8');
  return JSON.parse(raw);
}

function ensureSubmodule(source) {
  const subPath = `content/${source.slug}`;
  const inModules = existsSync(resolve(root, '.git/modules', subPath));
  if (inModules) {
    console.log(`[skip] ${subPath} は登録済み`);
    return;
  }
  console.log(`[add]  ${source.url} -> ${subPath}`);
  // file:// を許可(ローカル開発用)。本番の https:// では不要だが害もない。
  const env = { ...process.env, GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL || '/dev/null' };
  const args = [
    '-c', 'protocol.file.allow=always',
    '-c', 'init.defaultBranch=main',
    'submodule', 'add', '-f', '-b', source.branch, source.url, subPath,
  ];
  const r = spawnSync('git', args, { cwd: root, stdio: 'inherit', env });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function updateSubmodule(source) {
  const subPath = `content/${source.slug}`;
  console.log(`[pull] ${subPath} <- ${source.url} (${source.branch})`);
  sh('git', [
    '-c',
    'protocol.file.allow=always',
    'submodule',
    'update',
    '--remote',
    '--merge',
    '--',
    subPath,
  ]);
}

async function main() {
  const cfg = await loadConfig();
  for (const source of cfg.sources) {
    if (!source.slug || !source.url) {
      console.error('source に slug と url は必須です:', source);
      process.exit(1);
    }
    ensureSubmodule(source);
    updateSubmodule(source);
  }
  console.log('done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
