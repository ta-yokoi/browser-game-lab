import { games } from "./catalog.js?v=9";
import { mountAudioControls } from "./audio.js?v=9";
import { mountStickerAlbum } from "./stickers.js?v=9";

const game = games.find(item => item.id === document.body.dataset.game);
const audio = mountAudioControls();
const album = mountStickerAlbum();
const board = document.querySelector("#free-board");
const message = document.querySelector("#free-message");
document.querySelector("h1").textContent = game.title;
document.querySelector("#instruction").textContent = game.subtitle;
let played = false, rewarded = false;
const colors = ["#e47783", "#de9e27", "#40875d", "#427fbd", "#8b62b0"];
function touch() { played = true; }
function note() { audio.effect(true); }
function burst(x, y) {
  const flower = document.createElement("span");
  flower.className = "free-burst";
  flower.style.left = `${x}%`; flower.style.top = `${y}%`;
  flower.style.color = colors[Math.floor(Math.random() * colors.length)];
  flower.innerHTML = Array.from({length: 12}, (_,i)=>`<i style="--angle:${i*30}deg"></i>`).join("");
  flower.setAttribute("aria-hidden", "true");
  board.append(flower);
  // Limit live effects even during rapid tapping; no background animation loop.
  while (board.querySelectorAll(".free-burst").length > 8) board.querySelector(".free-burst").remove();
  setTimeout(()=>flower.remove(), 1400);
  touch(); note();
}
if (game.id === "bubbles") {
  board.classList.add("bubble-sky");
  const refill = () => {
    board.replaceChildren();
    for (let i=0;i<12;i++) {
      const button = document.createElement("button");
      button.className = "soap-bubble";
      button.setAttribute("aria-label", `${i+1}ばんの しゃぼんだま`);
      button.style.setProperty("--hue", i*29);
      button.addEventListener("click", () => {
        if(button.disabled)return;
        button.disabled = true; button.classList.add("popped"); touch(); note();
        message.textContent = "ぽん！ また でてくるよ";
        setTimeout(()=>{button.disabled=false;button.classList.remove("popped");},900);
      });
      board.append(button);
    }
  };
  refill();
} else if (game.id === "fireworks") {
  board.classList.add("night-sky");
  const sky = document.createElement("button");
  sky.className = "sky-button"; sky.setAttribute("aria-label", "よぞらに はなびを あげる");
  sky.textContent = "すきな ところを おしてね"; board.append(sky);
  sky.addEventListener("click", event => {
    const rect=sky.getBoundingClientRect();
    burst(event.detail ? (event.clientX-rect.left)/rect.width*100 : 50,event.detail ? (event.clientY-rect.top)/rect.height*100 : 45);
  });
} else {
  board.classList.add("paint-board");
  board.innerHTML = '<canvas width="720" height="720" aria-label="おえかき用の紙"></canvas>';
  const canvas=board.querySelector("canvas"), context=canvas.getContext("2d");
  context.fillStyle="#fffdf7";context.fillRect(0,0,720,720);
  let color=colors[0], drawing=false, last;
  const toolbar=document.createElement("div");toolbar.className="paint-tools";
  const names=["あか", "きいろ", "みどり", "あお", "むらさき"];
  toolbar.innerHTML=colors.map((value,i)=>`<button class="paint-color" style="--paint:${value}" aria-label="${names[i]}" aria-pressed="${i===0}"></button>`).join("")+'<button class="secondary stamp">おはな スタンプ</button><button class="secondary save">えを ほぞん</button><button class="secondary clear">ぜんぶ けす</button>';
  board.after(toolbar);
  toolbar.querySelectorAll(".paint-color").forEach((button,i)=>button.addEventListener("click",()=>{color=colors[i];toolbar.querySelectorAll(".paint-color").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));}));
  const point=event=>{const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*720,y:(event.clientY-r.top)/r.height*720};};
  const dot=(p)=>{context.fillStyle=color;context.beginPath();context.arc(p.x,p.y,9,0,Math.PI*2);context.fill();};
  canvas.addEventListener("pointerdown",event=>{drawing=true;canvas.setPointerCapture(event.pointerId);last=point(event);dot(last);touch();});
  canvas.addEventListener("pointermove",event=>{if(!drawing)return;const p=point(event);context.strokeStyle=color;context.lineWidth=18;context.lineCap="round";context.beginPath();context.moveTo(last.x,last.y);context.lineTo(p.x,p.y);context.stroke();last=p;});
  for(const type of ["pointerup","pointercancel"])canvas.addEventListener(type,()=>drawing=false);
  toolbar.querySelector(".stamp").addEventListener("click",()=>{const x=80+Math.random()*560,y=80+Math.random()*560;for(let i=0;i<6;i++)dot({x:x+25*Math.cos(i*Math.PI/3),y:y+25*Math.sin(i*Math.PI/3)});dot({x,y});touch();});
  toolbar.querySelector(".save").addEventListener("click",()=>{const link=document.createElement("a");link.href=canvas.toDataURL("image/png");link.download="komorebi-art.png";link.click();message.textContent="えを がぞうで ほぞんするよ";});
  toolbar.querySelector(".clear").addEventListener("click",()=>{if(!window.confirm("かいた えを ぜんぶ けしても いい？"))return;context.fillStyle="#fffdf7";context.fillRect(0,0,720,720);});
}
document.querySelector("#free-finish").addEventListener("click",()=>{
  if (!played) {message.textContent="まずは すきな ところを おして あそぼう";return;}
  if (!rewarded) {album.earn(game.id,"easy");album.earn(game.id,"easy",true);rewarded=true;}
  message.textContent="たのしかったね！ あそんだ シールを 1まい もらったよ。まだ あそんでも いいよ";
  document.querySelector("#free-finish").disabled=true;
});
