import { art } from "./art.js?v=10";
import { shuffle } from "./questions.js?v=10";
import { movable } from "./hands-on.js?v=10";

export function makeMystery(hard = false, random = Math.random) {
  const cards = [];
  for (const color of ["pink", "blue"]) for (const shape of ["star", "flower"]) for (const ribbon of hard ? [false, true] : [false]) cards.push({color,shape,ribbon});
  const options = shuffle(cards, random);
  return { options, answer: Math.floor(random() * options.length), clueCount: hard ? 3 : 2 };
}
export function renderDetective({board, hard, correct, say, signal}) {
  const mystery = makeMystery(hard), answer = mystery.options[mystery.answer];
  const clues = [answer.color === "pink" ? "ピンクの おうち" : "あおい おうち", answer.shape === "star" ? "ほしの マーク" : "おはなの マーク", answer.ribbon ? "リボンが ある" : "リボンは ない"];
  const icons = [art("circle"), art(answer.shape), answer.ribbon ? "🎀" : "―"];
  board.classList.add("detective-board");
  board.innerHTML = `<div class="case-label">ひみつの おとしもの</div><p class="board-caption">きらきらの かぎ。どの おうちの かぎかな？</p><div class="clue-scene">${clues.slice(0,mystery.clueCount).map((clue,i)=>`<button class="clue-envelope" data-clue="${i}" aria-label="てがかり ${i+1}をしらべる"><span class="clue-cover">✉<small>しらべる</small></span><span class="clue-detail" hidden style="--clue-color:${answer.color === "pink" ? "#d979a0" : "#6e9fcc"}">${icons[i]}<small>${clue}</small></span></button>`).join("")}</div><p class="clue-status" role="status">てがかりを ${mystery.clueCount}こ あつめよう</p><button class="mystery-key" aria-label="かぎを はこぶ" disabled>🗝<small>かぎを はこぶ</small></button><div class="mystery-houses">${mystery.options.map((card,i)=>`<button class="mystery-house ${card.color}" data-house="${i}" aria-label="${card.color === "pink" ? "ピンク" : "あお"}の ${card.shape === "star" ? "ほし" : "おはな"}、${card.ribbon ? "リボンあり" : "リボンなし"}" disabled>${art(card.shape)}<span class="house-ribbon">${card.ribbon ? "🎀" : ""}</span></button>`).join("")}</div><p class="hands-hint">てがかりを あつめたら、かぎを おうちへ はこぼう。<br>かぎ → おうち の じゅんに おしても OK。</p>`;
  const found = new Set();
  const key = board.querySelector(".mystery-key"), houses = [...board.querySelectorAll(".mystery-house")];
  let selected = false, solved = false;
  board.querySelectorAll(".clue-envelope").forEach(button=>button.addEventListener("click",()=>{
    found.add(button.dataset.clue);button.querySelector(".clue-cover").hidden=true;button.querySelector(".clue-detail").hidden=false;
    board.querySelector(".clue-status").textContent = `${found.size} / ${mystery.clueCount} てがかり はっけん！`;
    if(found.size === mystery.clueCount){key.disabled=false;houses.forEach(h=>h.disabled=false);say("ぜんぶの てがかりに あう おうちを さがそう");}
  },{signal}));
  const deliver = house => {
    if(solved || found.size !== mystery.clueCount)return;
    if(Number(house.dataset.house) === mystery.answer){solved=true;house.classList.add("case-solved");key.hidden=true;correct(house);}
    else say("てがかりを もういちど みよう。だいじょうぶ！");
  };
  movable(key,()=>houses,deliver,signal);
  key.addEventListener("click",event=>{event.stopPropagation();selected=true;key.classList.add("picked");},{signal});
  houses.forEach(house=>house.addEventListener("click",()=>{if(selected)deliver(house);else say("かぎを おしてから おうちを おしてね");},{signal}));
}
