import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const okfFrontmatter = z.object({
  type: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  resource: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  timestamp: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  cover: z.string().optional(),
  author: z.string().optional(),
  authorUrl: z.string().url().optional(),
  publish: z.boolean().default(false),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content' }),
  schema: okfFrontmatter,
});

export const collections = { blog };

export type OkfFrontmatter = z.infer<typeof okfFrontmatter>;
