---
title: "RustでCLIツールを作ってみた"
description: "実務で感じた課題を解決するため、Rustで小さなCLIツールを開発した体験記。設計から配布までの一連の流れを紹介します。"

author: "miyax"

timestamp: "2026-06-18T21:30:00+09:00"
updated: "2026-06-19T08:15:00+09:00"

type: "Rust"

tags:
  - "Rust"
  - "CLI"
  - "Tooling"
  - "Personal Project"

cover: "https://storage.googleapis.com/gweb-cloudblog-publish/images/rust-cli-hero.max-2600x2600.jpg"

resource: "https://example.com/blog/rust-cli-tool"

publish: true

og:
  type: "article"
  site_name: "miya blog"
twitter:
  card: "summary_large_image"
  site: "@miyax"

readingTime: 8
---

## 作ったもの

社内で頻発する「ログファイルから特定のパターンを抽出して集計する」作業を、コマンド一発で完結させたかったのがきっかけです。

## 技術選定

Rustを選んだ理由は以下です。

- 単一バイナリで配布が簡単
- 起動が高速
- 所有権システムによるメモリ安全性が保証される

## 実装のポイント

### clapでCLI引数を定義

```rust
use clap::Parser;

#[derive(Parser)]
struct Args {
    #[arg(short, long)]
    input: String,
}
```

### エラーハンドリング

`anyhow`クレートを使って、ライブラリ側とCLI側で責務を分離しました。

## 配布

GitHub Actionsでクロスコンパイルし、各プラットフォーム向けバイナリをReleaseに添付しています。

## 振り返り

- ライフタイムで詰まる場面は少なかった
- エコシステムが充実していて助かった
- 次はWebAssemblyにも挑戦したい
