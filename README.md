# Notion Clone

ローカルで動作する Notion ライクなノートアプリ。バックエンドなし、データは `localStorage` に保存されます。

## 機能

- **サイドバー**: 階層ページツリー（追加・削除・折りたたみ）、ページアイコン、パンくずリスト
- **ブロックエディタ**: テキスト / 見出し1-3 / To-Do / 箇条書き / 番号付き / 引用 / コールアウト / コード / 区切り線 / データベース
- **スラッシュコマンド** `/`: キャレット直下にメニューが出て、インクリメンタルフィルタ
- **Markdown ショートカット**: `# `→H1, `- `→箇条書き, `[] `→To-Do, `> `→引用, など
- **キーボードショートカット**:
  - `Cmd+Shift+1/2/3` → 見出し1/2/3
  - `Cmd+Shift+4` → To-Do
  - `Cmd+Shift+5` → 箇条書き
  - `Cmd+Shift+6` → 引用
  - `Cmd+Shift+7` → 番号付きリスト
  - `Cmd+Shift+8` → コールアウト
  - `Cmd+Shift+9` → コードブロック
  - `Cmd+Shift+0` → 通常テキストに戻す
- **ドラッグ&ドロップ**: `⋮⋮` ハンドルでブロック並べ替え（@dnd-kit）
- **データベースブロック**: インラインテーブル。列タイプ（テキスト / 数値 / 選択 / チェック / 日付）、行の追加・削除、列の追加・削除・型変更
- **日本語 IME 対応**: compositionstart/compositionend を追跡して二重入力を防止
- **永続化**: すべて localStorage に自動保存

## スタック

- Vite + React 19 + TypeScript
- @dnd-kit/core, @dnd-kit/sortable（ドラッグ&ドロップ）
- nanoid（ID 生成）

## 開発

```bash
npm install
npm run dev       # http://localhost:5179
npm run build     # 本番ビルド
```

## ディレクトリ構成

```
src/
├── App.tsx                      # ルート。state管理とルーティング
├── types.ts                     # Block/Page/DbData の型
├── store.ts                     # localStorage 永続化、初期シード
├── utils/
│   └── caret.ts                 # textarea 内のキャレット viewport 座標計算
└── components/
    ├── Sidebar.tsx              # サイドバーとページツリー
    ├── PageView.tsx             # ページ本体（タイトル + ブロックリスト）
    ├── BlockEditor.tsx          # 各ブロック。スラッシュコマンド、ショートカット、IME
    ├── SlashMenu.tsx            # / メニュー
    ├── DatabaseBlock.tsx        # テーブル型データベース
    └── IMEInput.tsx             # IME セーフな単一行 input
```
