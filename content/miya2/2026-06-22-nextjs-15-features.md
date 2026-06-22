---
title: "Next.js 15の新機能を実プロジェクトで試してみた"
description: "App Routerの安定化、React 19対応、キャッシュ戦略の見直しなど、Next.js 15の主要変更点を実プロジェクトでの検証と共にお届けします。"

authors:
  - name: "miya2"

date: "2026-06-22T10:00:00+09:00"
lastUpdated: "2026-06-22T10:00:00+09:00"

category: "Web Development"

tags:
  - "Next.js"
  - "React"
  - "App Router"

image: "https://storage.googleapis.com/gweb-cloudblog-publish/images/nextjs-hero.max-2600x2600.jpg"

url: "https://example.com/blog/nextjs-15-features"

og:
  type: "article"
  site_name: "miya blog"
twitter:
  card: "summary_large_image"
  site: "@miya2"

readingTime: 7

publisher: "miya blog"
contentType: "blog.articlepage"
locale: "ja"
---

## はじめに

Next.js 15がリリースされ、App Routerまわりの仕様がさらに洗練されました。本記事では、個人で運用しているブログアプリでの検証結果を踏まえ、主要な変更点をまとめます。

## 主な変更点

### 1. React 19の正式対応

`use`フックや`useActionState`といった新しいAPIが安定して使えるようになりました。フォーム処理の記述量が大幅に減り、Server Actionsとの組み合わせが自然になっています。

### 2. キャッシュ戦略の刷新

これまでは暗黙的にキャッシュされていた挙動が見直され、`fetch`のキャッシュはデフォルトで`no-store`になりました。意図的にキャッシュを制御する書き方が推奨されています。

```typescript
// 常に最新データを取得したい場合
const res = await fetch("https://api.example.com/posts", {
  cache: "no-store",
});
```

### 3. `unstable_after`の安定化

レスポンス送信後にバックグラウンド処理を実行する`after`APIが安定版に昇格しました。ログ送信や分析処理に便利です。

## 移行でハマったポイント

- 以前のキャッシュ前提で書いていたコードが軒並み挙動変化
- `cookies()`や`headers()`が動的レンダリングを強要する範囲が広がった
- `next.config.ts`が正式にサポートされ設定が型安全に

## まとめ

Next.js 15は「明示的に書く」方向への進化が明確です。Next.js 14以前の感覚で書いていると意図しない挙動に遭遇するので、移行時はキャッシュまわりのコードから見直すのがおすすめです。
