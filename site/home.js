import { mountAudioControls } from "./shared/audio.js?v=10";
import { games } from "./shared/catalog.js?v=10";
import { art } from "./shared/art.js?v=10";
import { mountStickerAlbum } from "./shared/stickers.js?v=10";
import { playGroups } from "./shared/experience.js?v=10";
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

const filters = document.createElement("div");
filters.className = "game-filters";
filters.setAttribute("role", "group");
filters.setAttribute("aria-label", "あそびの しゅるい");
filters.innerHTML = Object.entries(playGroups).map(([id, group]) => `<button type="button" data-group="${id}" aria-pressed="${id === "all"}">${group.label}</button>`).join("");
document.querySelector("#game-list").before(filters);
filters.addEventListener("click", event => {
  const button = event.target.closest("[data-group]");
  if (!button) return;
  const ids = playGroups[button.dataset.group].ids;
  filters.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  document.querySelectorAll(".game-card").forEach((card, index) => { card.hidden = ids !== null && !ids.includes(games[index].id); });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll(".game-card").forEach(card => observer.observe(card));
