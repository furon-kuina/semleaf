# eemee 設計仕様書

## 1. 概要

小説などで出会ったフレーズを (フレーズ, 意味) のペアで記録し、意味ベースのセマンティック検索と従来型テキスト検索の両方で探せるWebアプリケーション。

## 2. ユーザー・利用形態

- **対象ユーザー**: 自分専用（シングルユーザー）
- **アクセス**: クラウドデプロイのため Google OAuth で認証
- **デバイス**: レスポンシブ対応（デスクトップ + モバイル）

## 3. データモデル

### phrases テーブル

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | UUID | PK | 一意識別子 |
| phrase | TEXT | NOT NULL | フレーズ本文 |
| meaning | TEXT | NOT NULL | ユーザーが記述した意味・解釈 |
| source | TEXT | nullable | 出典（自由記述。書名・著者等） |
| tags | TEXT[] | default '{}' | タグ（フラットなリスト） |
| memo | TEXT | nullable | 自分用のメモ |
| meaning_embedding | vector(3072) | NOT NULL | 意味フィールドの Embedding ベクトル |
| created_at | TIMESTAMPTZ | NOT NULL | 登録日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

### 設計判断

- **意味フィールドは必須**: セマンティック検索の対象が意味フィールドであるため、全フレーズが検索可能であることを保証する
- **出典は自由記述**: 書名・著者を構造化しない。入力の手軽さを優先する
- **タグは PostgreSQL 配列型**: 専用テーブルは設けず、配列型で管理する。数千件規模では十分
- **Embedding は意味フィールドのみ**: フレーズ自体ではなく、ユーザーが記述した意味を Embed する。検索クエリ（「悲しみ」「孤独感」等）と意味記述のマッチングが自然になる

## 4. 検索機能

### 4.1 セマンティック検索

- ユーザーが自由テキストを入力し、明示的に検索を実行（Enter/ボタン）
- 入力テキストを OpenAI API で Embed し、pgvector のコサイン類似度で検索
- 結果はランキング順に表示（スコアは非表示）

### 4.2 テキスト検索

- フレーズ本文・出典・タグに対する部分一致検索
- 「あのフレーズどこだったっけ」という想起型検索に対応
- PostgreSQL の ILIKE または pg_trgm を使用

### 4.3 検索 UX

- ホーム画面は検索ボックスと新規登録ボタンのみのミニマルなデザイン
- 検索モードの切り替え（セマンティック / テキスト）を UI で提供
- 対応言語: 日本語・英語（混在可）

## 5. Embedding 戦略

| 項目 | 選定 |
|------|------|
| プロバイダー | OpenAI API |
| モデル | text-embedding-3-large |
| 次元数 | 3072 |
| 対象 | meaning フィールド |

### ライフサイクル

- **登録時**: 意味フィールドから Embedding を生成し、レコードと共に保存
- **更新時**: 意味が変更された場合、Embedding を自動で再計算。API コストは許容する
- **検索時**: クエリテキストを同モデルで Embed し、pgvector で類似度検索

## 6. アーキテクチャ

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  React SPA  │────▶│  Axum API    │────▶│ PostgreSQL       │
│  Tailwind   │◀────│  Server      │◀────│ + pgvector       │
└─────────────┘     └──────┬───────┘     └──────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ OpenAI API   │
                    │ (Embedding)  │
                    └──────────────┘
```

### バックエンド

- **言語**: Rust
- **フレームワーク**: Axum
- **選定理由**: パフォーマンス重視。tokio ベースの非同期処理、tower ミドルウェアとの統合

### フロントエンド

- **フレームワーク**: Preact (TypeScript)
- **スタイリング**: Tailwind CSS
- **ビルド**: Vite + @preact/preset-vite

### データベース

- **PostgreSQL + pgvector**
- 数千件規模なら線形スキャン（IVFFlat インデックスなし）でも十分高速
- 将来の規模拡大時に IVFFlat/HNSW インデックスを追加可能

### 認証

- **Google OAuth 2.0**
- セッション管理: サーバーサイドセッション or JWT
- 自分専用のため、許可する Google アカウントをホワイトリストで制限

## 7. API 設計 (REST)

### フレーズ CRUD

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/phrases | フレーズ新規登録（Embedding 生成含む） |
| GET | /api/phrases/:id | フレーズ詳細取得 |
| PUT | /api/phrases/:id | フレーズ更新（意味変更時は Embedding 再計算） |
| DELETE | /api/phrases/:id | フレーズ削除 |

### 検索

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/search/semantic | セマンティック検索（クエリテキストを Embed して検索） |
| GET | /api/search/text?q=... | テキスト検索（部分一致） |

### エクスポート

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/export?format=json | 全データ JSON エクスポート |
| GET | /api/export?format=csv | 全データ CSV エクスポート |

### 認証

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/auth/google | Google OAuth フロー開始 |
| GET | /api/auth/callback | OAuth コールバック |
| POST | /api/auth/logout | ログアウト |

## 8. デプロイ

- **ホスティング**: Fly.io
- **データベース**: Fly Postgres（pgvector 対応）
- **CI/CD**: GitHub Actions → Fly.io へデプロイ
- **環境変数で管理するシークレット**:
  - `OPENAI_API_KEY`
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - `DATABASE_URL`
  - `SESSION_SECRET`

## 9. データエクスポート

- JSON / CSV 形式でエクスポート可能
- Embedding ベクトルはエクスポートに含めない（再生成可能なため）
- エクスポート対象: phrase, meaning, source, tags, memo, created_at, updated_at
- インポート機能は MVP では実装しない

## 10. 非機能要件

- **パフォーマンス**: セマンティック検索のレスポンスタイムは OpenAI API のレイテンシに依存（数百ms程度）。テキスト検索は数十ms以内
- **データ規模**: 数千件を想定。pgvector の線形スキャンで十分対応可能
- **可用性**: 個人利用のため高可用性は不要。Fly.io の単一インスタンスで運用

## 11. MVP スコープ

### MVP に含む

- フレーズの CRUD（登録・閲覧・編集・削除）
- セマンティック検索
- テキスト検索（部分一致）
- Google OAuth 認証
- レスポンシブ UI
- JSON/CSV エクスポート

### MVP に含めない（将来の拡張候補）

- データインポート
- LLM による意味の自動提案
- フレーズの共有・公開機能
- タグのオートコンプリート
- 出典の構造化（書名・著者の分離）
- 検索結果の類似度スコア表示
