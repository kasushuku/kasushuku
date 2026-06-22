#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rmSync, cpSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function sh(cmd, args, env) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
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

function authedUrl(url) {
  if (!/^https:\/\//.test(url)) return url;
  if (process.env.GH_TOKEN && !/^https:\/\/[^@]+@/.test(url)) {
    return url.replace('https://', `https://x-access-token:${process.env.GH_TOKEN}@`);
  }
  return url;
}

function syncSource(source) {
  const dest = resolve(root, `content/${source.slug}`);
  const branch = source.branch ?? 'main';
  const subPath = source.path ?? '';
  const tmp = resolve(root, `.cache/source-${source.slug}`);

  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  const fetchUrl = authedUrl(source.url);
  console.log(`[clone] ${source.url} -> ${tmp} (branch=${branch})`);
  sh('git', ['clone', '--depth=1', '--branch', branch, fetchUrl, tmp], {});

  const srcDir = subPath ? resolve(tmp, subPath) : tmp;
  if (!existsSync(srcDir)) {
    console.error(`subpath '${subPath}' が ${source.url} に見つかりません`);
    process.exit(1);
  }

  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    cpSync(resolve(srcDir, entry), resolve(dest, entry), { recursive: true });
  }
  console.log(`[done]  ${source.url}#${branch}:${subPath} -> content/${source.slug}/`);
}

async function main() {
  const cfg = await loadConfig();
  for (const source of cfg.sources) {
    if (!source.slug || !source.url) {
      console.error('source に slug と url は必須です:', source);
      process.exit(1);
    }
    syncSource(source);
  }
  console.log('done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
