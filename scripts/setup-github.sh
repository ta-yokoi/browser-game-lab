#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

repo_name="${1:-browser-game-lab}"
if [[ ! "$repo_name" =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]*$ ]]; then
  echo 'リポジトリ名には半角英数字、ハイフン、アンダースコア、ドットを使用してください。' >&2
  exit 1
fi
command -v gh >/dev/null || { echo '先に brew install gh を実行してください。' >&2; exit 1; }
gh auth status --hostname github.com
gh auth setup-git --hostname github.com
owner="$(gh api user --jq .login)"
repository="$owner/$repo_name"

if [[ ! -d .git ]]; then git init -b main; fi
if ! git var GIT_AUTHOR_IDENT >/dev/null 2>&1; then
  echo '先に git config user.name と git config user.email を設定してください。README.mdを参照。' >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != main ]]; then
  echo 'mainブランチで実行してください。' >&2
  exit 1
fi
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git add .gitignore package.json README.md site scripts .github
  git commit -m "Set up browser game starter and GitHub Pages deployment"
fi
if git remote get-url origin >/dev/null 2>&1; then
  existing="$(git remote get-url origin)"
  case "$existing" in
    "https://github.com/$repository"|"https://github.com/$repository.git"|"git@github.com:$repository.git") ;;
    *) echo "originが対象リポジトリと異なります: $existing" >&2; exit 1 ;;
  esac
else
  gh repo create "$repository" --public --source . --remote origin \
    --description 'ブラウザで遊べるゲームの開発環境 / GitHub Pages'
fi
git push -u origin main

# 初回pushでワークフローが先に起動して失敗しても、Pages設定後に再実行する。
if gh api "repos/$repository/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/$repository/pages" -f build_type=workflow >/dev/null
else
  gh api --method POST "repos/$repository/pages" -f build_type=workflow >/dev/null
fi
gh workflow run pages.yml --repo "$repository" --ref main
echo "リポジトリ: https://github.com/$repository"
echo "公開処理の状況: https://github.com/$repository/actions"
echo "公開成功後のURL: https://$owner.github.io/$repo_name/"
