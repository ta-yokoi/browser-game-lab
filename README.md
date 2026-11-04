# Browser Game Lab

ブラウザで遊べるゲームを開発し、GitHub Pagesで公開するためのスターターです。
HTML / CSS / JavaScriptだけで動き、外部ライブラリやAPIキーは不要です。
サンプルの「Target Tap」は、20秒間で的をクリック・タップするゲームです。

## 現在の状態

- ローカルのソース、開発・ビルドコマンド、GitHub Actions設定を用意しています。
- GitHub上のリポジトリ作成と公開には、以下の初回セットアップが必要です。
- 参照URL `https://ta-yokoi.github.io/android-learning-guide/android/` は作成時に取得できていないため、その内容やデザインは未反映です。

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

## 初回だけ必要なGitHubの設定（macOS）

1. ターミナルで以下を実行し、ブラウザでGitHubにログインします。
   `gh auth login` では、公開先のアカウントを選んでください。
   ワークフローをpushするため、`workflow` スコープも指定しています。

   ```sh
   brew install gh
   gh auth login --hostname github.com --git-protocol https --web --scopes workflow
   ```

2. コミット用の名前とメールを、このフォルダに設定します。
   メールにはGitHubの Settings → Emails で確認できる非公開用の `noreply` アドレスも使えます。

   ```sh
   cd /Users/takamichiyokoi/70_openx/10_git_game
   git init -b main
   git config user.name "あなたのコミット名"
   git config user.email "あなたのGitHub用メールアドレス"
   ```

3. 次のスクリプトを実行します。ログイン中のアカウントに **公開リポジトリ** `browser-game-lab` を作成し、初回コミット・push・Pagesの有効化・公開ワークフローの起動を行います。
   別のリポジトリ名にする場合は、引数を変更してください。既存リポジトリを上書きする処理はありません。

   ```sh
   bash scripts/setup-github.sh browser-game-lab
   ```

4. 出力された Actions のURLで `Deploy to GitHub Pages` が成功したら公開完了です。
   初回push時にPages未設定で失敗した実行があっても、設定後の実行が成功していれば問題ありません。
   ワークフロー起動だけ失敗した場合は、設定後に以下を実行してください。

   ```sh
   gh workflow run pages.yml --ref main
   ```

`ta-yokoi` アカウントで作成した場合の公開予定URL:
https://ta-yokoi.github.io/browser-game-lab/

PagesのAPI設定が権限不足で失敗した場合は、リポジトリの **Settings → Pages → Build and deployment → Source → GitHub Actions** を選択し、Actionsからワークフローを再実行してください。アカウントや組織側でActionsが無効の場合は、その有効化も必要です。

## 普段の更新

```sh
npm run check
npm run build
git add site scripts package.json README.md .github .gitignore
git commit -m "Update game"
git push
```

`main` へのpushで検証・ビルド・公開が自動実行されます。
プルリクエストでは検証とビルドのみ実行します。
`dist/` 自体はGit管理しません。公開されるのは `dist/` に含まれる静的ファイルです。
GitHub Pagesのリポジトリ配下のURLに対応するため、アセットには相対パスを使っています。

## ファイル構成

```text
site/
  index.html                 ページとゲームの表示要素
  style.css                  レイアウト、スマートフォン対応
  game.js                    サンプルゲームの処理
scripts/
  build.mjs                  公開用ファイルの生成
  setup-github.sh             リポジトリ作成・Pagesの初回設定
.github/workflows/pages.yml  自動検証・公開
```

ゲームを変更するときは、まず `site/game.js` と `site/index.html` を編集します。
サーバー側の処理、認証、オンライン対戦、ランキング保存は現在のスターターには含まれていません。

公式資料: [GitHub Pagesのカスタムワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[GitHub CLIでのリポジトリ作成](https://cli.github.com/manual/gh_repo_create)。
