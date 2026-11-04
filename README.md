# こもれび — あそびのにわ

3歳半ごろのお子さまと親子で遊ぶ、6種類のオリジナル知育ゲームです。
HTML・CSS・JavaScriptと共通のSVGのみで動き、外部ライブラリ・通信API・音声・ログインは使いません。
市販教材の問題やイラストは使用していません。

## あそび

| ゲーム             | やさしい      | ちょっとむずかしい |
| ------------------ | ------------- | ------------------ |
| おなじもの         | 2択           | 4択                |
| かずあそび         | 1〜3          | 1〜5               |
| かたちあわせ       | 2つの枠       | 3つの枠            |
| おおきい・ちいさい | 大きい方を5問 | 小さい方を5問      |
| つぎは なあに？    | ABABの続き    | ABABAの続き        |
| えあわせ           | 2組4枚        | 3組6枚             |

最初は保護者の方と一緒に遊んでください。各ゲーム下の「おうちの方へ・むずかしさ」で難易度を変更できます。変更すると最初から始まります。
時間制限・点数の競争・ゲームオーバーはありません。間違えても何度でも選び直せます。
絵合わせ以外は5問で一区切りです。絵合わせは全組が揃ったら終了です。

## 公開

公開先: https://ta-yokoi.github.io/browser-game-lab/

`main`へpushするとGitHub Actionsが構文チェック・問題生成テスト・ビルド・公開を実行します。
PRではチェックとビルドのみ実行します。PRの変更はmainにマージするまで公開されません。
`site/`がソースで、`dist/`は公開用コピーです。生成物はコミットしません。

## ローカルで遊ぶ

必要なもの: Node.js 22以上、Python 3。作成時の環境ではNode.js 24、Python 3が利用可能でした。
依存パッケージがないため、`npm install` は不要です。

```sh
cd /Users/takamichiyokoi/70_openx/10_git_game
npm run dev
```

ブラウザで http://127.0.0.1:5173 を開きます。終了は `Ctrl+C`。
ソースを変更したらブラウザを再読み込みしてください。

```sh
npm run check
npm run build
npm run preview
```

公開用のファイルは `dist/` に生成されます。プレビューは http://127.0.0.1:4173 です。

## 検証

`npm run check` は `site/`、`scripts/`、`tests/` 内のすべてのJavaScriptの構文、セットアップ用シェルの構文、問題生成のテストを確認します。
`npm test` では問題生成テストのみを実行します。
問題は各難易度で繰り返し生成し、正解が1つだけ存在すること、数の範囲、交互の並び、絵合わせのペア数を検証します。

ブラウザで確認する項目:

- トップページから全ゲームへ移動し、ホームに戻れる
- 各ゲームの正解・不正解・5問終了・再挑戦・難易度変更
- 形を選択してから枠に合わせる操作
- 絵合わせの開始前表示、不一致中の連打防止、全組完成
- 難易度変更時に待機中の処理が残らない
- スマートフォン縦画面（幅320〜390px）とPC、キーボード操作

## ファイル構成

```text
site/
  index.html                 ゲーム一覧
  home.js                    一覧カードの描画
  style.css                  全画面共通のスタイル
  assets/pictures.svg        再利用するオリジナルSVGイラスト
  games/<ゲームID>/index.html 各ゲームの入口（6種類）
  shared/catalog.js          ゲーム説明・絵の名前
  shared/art.js              SVG描画
  shared/questions.js        問題・カードの生成
  shared/play.js             共通の進行・操作処理
scripts/
  check.mjs                  JavaScriptの再帰的な構文チェック
  build.mjs                  公開用ファイルの生成
  setup-github.sh             初回のリポジトリ・Pages設定
tests/questions.test.js      問題生成のテスト
.github/workflows/pages.yml  自動検証・公開
```

## 普段の更新

```sh
npm run check
npm run build
git add site scripts tests package.json README.md
git commit -m "Update learning games"
git push
```

作業ブランチからmainへPRを作成し、確認してマージしてください。
画像は共通SVGを再利用し、外部フォント・画像のダウンロードは行いません。
ブラウザの「動きを減らす」設定に対応しています。
ゲームの成績や個人情報の保存・送信は行いません。

GitHub Pagesの設定は Settings → Pages → Source → GitHub Actions を使用します。
既存リポジトリでは初回セットアップ用スクリプトを再実行する必要はありません。
