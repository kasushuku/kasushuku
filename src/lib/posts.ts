import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import sourcesConfig from '../../sources.config.json' with { type: 'json' };

export type SourceConfig = {
  slug: string;
  url: string;
  branch?: string;
  path?: string;
  author: string;
  authorUrl?: string;
};

type SourcesFile = {
  sources: SourceConfig[];
};

const sources: SourceConfig[] = (sourcesConfig as SourcesFile).sources ?? [];

export type Post = {
  id: string;
  slug: string;
  sourceSlug: string;
  author: string;
  authorUrl?: string;
  title: string;
  description?: string;
  type: string;
  tags: string[];
  timestamp: Date;
  updated?: Date;
  cover?: string;
  resource?: string;
  body: string;
  filePath: string;
  fileUrl: string;
};

function findSourceForEntry(entry: CollectionEntry<'blog'>): SourceConfig | undefined {
  const id = (entry as { filePath?: string }).filePath ?? entry.id;
  for (const source of sources) {
    const prefix = `content/${source.slug}/`;
    if (id.startsWith(prefix)) return source;
  }
  return undefined;
}

function buildFileUrl(source: SourceConfig, entry: CollectionEntry<'blog'>): string {
  if (!source.url.startsWith('http')) return '';
  const base = source.url.replace(/\.git$/, '');
  const branch = source.branch ?? 'main';
  const subPath = source.path ? `${source.path}/` : '';
  const id = (entry as { filePath?: string }).filePath ?? entry.id;
  const rel = id.replace(`content/${source.slug}/`, '');
  return `${base}/blob/${branch}/${subPath}${rel}`;
}

function slugFromId(id: string, source?: SourceConfig): string {
  let stripped = id;
  if (source) {
    const prefix = `content/${source.slug}/`;
    if (stripped.startsWith(prefix)) stripped = stripped.slice(prefix.length);
    if (source.path && stripped.startsWith(`${source.path}/`)) {
      stripped = stripped.slice(source.path.length + 1);
    }
  }
  return stripped.replace(/\.md$/, '');
}

function defaultTimestamp(entry: CollectionEntry<'blog'>): Date {
  if (entry.data.timestamp) return entry.data.timestamp;
  const abs = resolve(process.cwd(), entry.id);
  if (existsSync(abs)) {
    try {
      return statSync(abs).mtime;
    } catch {}
  }
  return new Date(0);
}

async function readBody(id: string): Promise<string> {
  const abs = resolve(process.cwd(), id);
  if (!existsSync(abs)) return '';
  const raw = await readFile(abs, 'utf8');
  return raw.replace(/^---[\s\S]*?---\n*/m, '').trim();
}

export type PostWithEntry = {
  post: Post;
  entry: CollectionEntry<'blog'>;
};

export async function getAllPostsWithEntries(): Promise<PostWithEntry[]> {
  const entries = await getCollection('blog', (e) => e.data.publish === true);
  const items: PostWithEntry[] = await Promise.all(
    entries.map(async (entry) => {
      const source = findSourceForEntry(entry);
      const authorName = entry.data.author ?? source?.author ?? source?.slug ?? 'unknown';
      const authorUrl = entry.data.authorUrl ?? source?.authorUrl;
      const body = await readBody(entry.id);
      const post: Post = {
        id: entry.id,
        slug: slugFromId(entry.id, source),
        sourceSlug: source?.slug ?? 'unknown',
        author: authorName,
        authorUrl,
        title: entry.data.title ?? slugFromId(entry.id, source),
        description: entry.data.description,
        type: entry.data.type,
        tags: entry.data.tags,
        timestamp: defaultTimestamp(entry),
        updated: entry.data.updated,
        cover: entry.data.cover,
        resource: entry.data.resource,
        body,
        filePath: entry.id,
        fileUrl: source ? buildFileUrl(source, entry) : '',
      };
      return { post, entry };
    }),
  );
  items.sort((a, b) => b.post.timestamp.getTime() - a.post.timestamp.getTime());
  return items;
}

export async function getAllPosts(): Promise<Post[]> {
  const items = await getAllPostsWithEntries();
  return items.map((i) => i.post);
}

export function getAuthors(posts: Post[]): string[] {
  return Array.from(new Set(posts.map((p) => p.author))).sort();
}

export function getTags(posts: Post[]): string[] {
  return Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
}

export function getTypes(posts: Post[]): string[] {
  return Array.from(new Set(posts.map((p) => p.type))).sort();
}

export type PostFilter = {
  authors?: string[];
  tags?: string[];
  types?: string[];
  query?: string;
  from?: Date;
  to?: Date;
};

export function filterPosts(posts: Post[], filter: PostFilter): Post[] {
  const q = filter.query?.trim().toLowerCase();
  return posts.filter((p) => {
    if (filter.authors?.length && !filter.authors.includes(p.author)) return false;
    if (filter.types?.length && !filter.types.includes(p.type)) return false;
    if (filter.tags?.length && !filter.tags.some((t) => p.tags.includes(t))) return false;
    if (filter.from && p.timestamp < filter.from) return false;
    if (filter.to && p.timestamp > filter.to) return false;
    if (q) {
      const haystack = `${p.title} ${p.description ?? ''} ${p.body}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
