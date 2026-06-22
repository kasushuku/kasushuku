---
title: "Astro 5で進化したコンテンツレイヤー機能を試す"
description: "Astro 5で導入されたContent Layer APIを使って、外部APIやローカルファイルを統一的に扱う方法を実例ベースで解説します。"

authors:
  - name: "miya2"

date: "2026-06-20T09:30:00+09:00"
lastUpdated: "2026-06-20T09:30:00+09:00"

category: "Web Development"

tags:
  - "Astro"
  - "SSG"
  - "Content Layer"

image: "https://astro.build/assets/press/astro-logo-dark.png"

url: "https://example.com/blog/astro-5-content-layer"

og:
  type: "article"
  site_name: "miya blog"
twitter:
  card: "summary_large_image"
  site: "@miya2"

readingTime: 6

publisher: "miya blog"
contentType: "blog.articlepage"
locale: "ja"
---

## はじめに

Astro 5がリリースされ、長らく待ち望まれていた**Content Layer API**が安定版になりました。従来の`content collections`はMarkdown/MDX前提でしたが、Content Layerでは任意のソースを同一インターフェースで扱えます。

## Content Layerの何が嬉しいのか

### ローカルと外部を統一的に扱える

これまでは外部APIから取得したデータを`Astro.glob`で読むために一工夫必要でしたが、Content Layerでは`glob`ローダーと`file`ローダーに加えて、API用の`fetch`ローダーが用意されています。

```typescript
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    publishedAt: z.coerce.date(),
  }),
});

const releases = defineCollection({
  loader: file("./src/data/releases.json"),
});

export const collections = { blog, releases };
```

### キャッシュと再生成の制御

`loader`関数は`キャッシュキー`を指定でき、ビルド間でデータ取得をスキップできます。CIのビルド時間が体感で20%ほど短くなりました。

## ハマりポイント

- `loader`は`async`関数で書く必要があるが、ビルド時に複数回呼ばれないよう内部でメモ化される
- スキーマ未定義のフィールドは`unknown`として扱われるので、明示的に書くのが安全
- 開発サーバで`loader`が再評価されるタイミングはHMRとは別軸

## まとめ

Content Layerは「コンテンツはここにある」という境界を取り払い、ビルドパイプラインを大幅に単純化します。ブログのような構造化コンテンツとの相性が特に良いです。
