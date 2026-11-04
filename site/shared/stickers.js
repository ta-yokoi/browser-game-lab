import { games } from "./catalog.js?v=4";
import { art } from "./art.js?v=4";

const key = "komorebi-stickers-v1";
const empty = () => ({ version: 1, games: {} });
export function readAlbum(storage) {
  try {
    const value = JSON.parse(storage.getItem(key));
    if (value?.version !== 1 || !value.games || typeof value.games !== "object") return empty();
    const result = empty();
    for (const game of games) {
      const item = value.games[game.id];
      if (!item) continue;
      const number = (n) => Number.isSafeInteger(n) && n >= 0 ? n : 0;
      result.games[game.id] = { easy: number(item.easy), hard: number(item.hard), completed: number(item.completed) };
    }
    return result;
  } catch { return empty(); }
}

export function earnSticker(album, id, difficulty, completed = false) {
  if (!games.some((game) => game.id === id) || !["easy", "hard"].includes(difficulty)) return album;
  const result = structuredClone(album);
  const item = result.games[id] ||= { easy: 0, hard: 0, completed: 0 };
  if (completed) item.completed++;
  else item[difficulty]++;
  return result;
}

export function mountStickerAlbum() {
  let storage;
  try { storage = window.localStorage; } catch { /* Session-only collection. */ }
  let album = readAlbum(storage);
  let saved = Boolean(storage);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "album-button";
  const dialog = document.createElement("dialog");
  dialog.className = "sticker-album";
  dialog.setAttribute("aria-labelledby", "album-title");
  dialog.innerHTML = '<button type="button" class="album-close" aria-label="シール帳を閉じる">×</button><p class="eyebrow">できた！の たからもの</p><h2 id="album-title">わたしの シールちょう</h2><div class="album-content"></div>';
  document.body.append(dialog);
  const anchor = document.querySelector(".play-heading, .hero");
  anchor.before(button);
  function paint() {
    const total = Object.values(album.games).reduce((sum, item) => sum + item.easy + item.hard, 0);
    button.textContent = `✿ シールちょう · ${total}まい`;
    dialog.querySelector(".album-content").innerHTML = `<p class="album-intro">もんだいが できたら シールを 1まい。<br>いままでに <strong>${total}まい</strong> あつまったよ！</p><div class="album-grid">${games.map((game) => {
      const item = album.games[game.id] || { easy: 0, hard: 0, completed: 0 };
      const count = item.easy + item.hard;
      const next = [1, 5, 10, 25, 50, 100].find((goal) => goal > count);
      return `<section class="album-card ${game.color}"><div class="sticker ${count ? "earned" : ""}">${art(game.pictures[0])}<span>${count ? "✿" : "？"}</span></div><h3>${game.title}</h3><strong>${count}まい</strong><p>やさしい ${item.easy} ／ むずかしい ${item.hard}<br>さいごまで ${item.completed}かい</p><div class="sticker-milestones" aria-label="獲得した記念シール">${[1, 5, 10, 25, 50, 100].map((goal) => `<span class="${count >= goal ? "earned" : ""}" title="${goal}まい記念">${count >= goal ? "✿" : "○"}<small>${goal}</small></span>`).join("")}</div><small>${next ? `つぎの きねんシールまで ${next - count}まい` : "シールの たつじん！"}</small></section>`;
    }).join("")}</div><p class="album-note">${saved ? "この端末・ブラウザに記録します。別の端末とは共有されません。ブラウザのデータを消すと記録も消えます。" : "このブラウザでは保存できません。このページを開いている間だけシールを集められます。"}</p>`;
  }
  button.addEventListener("click", () => { paint(); dialog.showModal(); });
  dialog.querySelector(".album-close").addEventListener("click", () => dialog.close());
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) { album = readAlbum(storage); paint(); }
  });
  paint();
  return {
    earn(id, difficulty, completed = false) {
      if (saved) album = readAlbum(storage);
      album = earnSticker(album, id, difficulty, completed);
      try { if (!storage) throw new Error("Storage unavailable"); storage.setItem(key, JSON.stringify(album)); }
      catch { saved = false; }
      paint();
    },
  };
}
