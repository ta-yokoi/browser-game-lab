import { mountAudioControls } from "./shared/audio.js?v=7";
import { games } from "./shared/catalog.js?v=7";
import { art } from "./shared/art.js?v=7";
import { mountStickerAlbum } from "./shared/stickers.js?v=7";
document.querySelector("#game-list").innerHTML = games
  .map(
    (game, i) => `
  <a class="game-card ${game.color}" href="./games/${game.id}/" aria-label="${game.title}であそぶ">
    <div class="card-art art-${game.id}" aria-hidden="true"><span class="card-number">0${i + 1}</span>${game.pictures.map((id) => art(id)).join("")}${game.id === "pattern" ? '<span class="question-mark">?</span>' : ""}</div>
    <div class="card-body"><span class="category">${game.tag}</span><h3>${game.id === "size" ? "おおきい・<wbr>ちいさい" : game.title}</h3><p>${game.subtitle}</p><span class="parent-caption">${game.parent}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
  </a>`,
  )
  .join("");

mountAudioControls();
mountStickerAlbum();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll(".game-card").forEach(card => observer.observe(card));
