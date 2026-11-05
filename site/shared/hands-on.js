import { art } from "./art.js?v=8";
import { shuffle } from "./questions.js?v=8";

// Pointer Events share one interaction model across mouse, pen and touch.
// Selecting a piece, then a destination, also works with keyboard buttons.
function movable(piece, destinations, drop, signal) {
  let start;
  let moved = false;
  piece.addEventListener("pointerdown", (event) => {
    if (piece.disabled) return;
    start = { x: event.clientX, y: event.clientY };
    moved = false;
    piece.setPointerCapture(event.pointerId);
    piece.classList.add("held");
  }, { signal });
  piece.addEventListener("pointermove", (event) => {
    if (!start) return;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    moved ||= Math.hypot(x, y) > 6;
    piece.style.transform = `translate(${x}px, ${y}px)`;
  }, { signal });
  const release = () => { start = null; piece.style.transform = ""; piece.classList.remove("held"); };
  piece.addEventListener("pointercancel", release, { signal });
  piece.addEventListener("pointerup", (event) => {
    if (!start) return;
    const destination = destinations().find((item) => {
      const r = item.getBoundingClientRect();
      return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    });
    release();
    if (moved && destination) drop(destination);
  }, { signal });
  piece.addEventListener("click", (event) => { if (moved) { event.stopImmediatePropagation(); moved = false; } }, { signal });
}

export function renderHandsOn(id, { board, hard, correct, say, audio, signal }) {
  const listen = (element, action) => element.addEventListener("click", action, { signal });
  const finish = () => { if (!signal.aborted) correct(board.querySelector("button")); };
  const hint = '<p class="hands-hint">つかんで はこぶ ／ おしてから おきばを おしても OK</p>';
  if (id === "count") {
    const count = hard ? 12 + Math.floor(Math.random() * 7) : 7 + Math.floor(Math.random() * 6);
    const first = hard ? 4 + Math.floor(Math.random() * (count - 7)) : 0;
    const picture = shuffle(["apple", "pear", "strawberry"])[0];
    board.innerHTML = `<div class="mission-label"><strong>${hard ? `${first} + ${count - first}` : count}</strong>こ かごに はこぼう</div><div class="fruit-shelf">${Array.from({length: 20}, (_, i) => `<button class="fruit-piece" aria-label="${i + 1}ばんの くだもの">${art(picture)}</button>`).join("")}</div><button class="basket" aria-label="くだものを入れるかご"><span class="basket-fruit"></span><span class="basket-count">かぞえて はこぼう</span></button>${hint}<div class="hands-actions"><button class="secondary undo">ひとつ もどす</button><button class="primary check">できた！</button></div>`;
    let selected; const placed = [];
    const basket = board.querySelector(".basket");
    const update = () => {
      basket.querySelector(".basket-fruit").innerHTML = placed.map(() => art(picture)).join("");
      basket.querySelector(".basket-count").textContent = hard ? "かぞえて たしかめよう" : `${placed.length}こ はこんだよ`;
    };
    const put = (piece) => { if (!piece || piece.disabled) return; piece.disabled = true; piece.classList.remove("picked"); placed.push(piece); selected = null; update(); };
    board.querySelectorAll(".fruit-piece").forEach((piece) => {
      movable(piece, () => [basket], () => put(piece), signal);
      listen(piece, () => { selected?.classList.remove("picked"); selected = piece; piece.classList.add("picked"); });
    });
    listen(basket, () => put(selected));
    listen(board.querySelector(".undo"), () => { const piece = placed.pop(); if (piece) piece.disabled = false; update(); });
    listen(board.querySelector(".check"), () => placed.length === count ? finish() : say("かずを もういちど たしかめよう"));
  } else if (id === "size" || id === "puzzle") {
    const puzzle = id === "puzzle";
    const length = puzzle ? (hard ? 9 : 6) : (hard ? 5 : 4);
    const columns = puzzle ? 3 : length;
    const rows = puzzle ? length / columns : 1;
    const descending = !puzzle && hard && Math.random() < 0.5;
    let order = shuffle(Array.from({length}, (_, i) => i));
    if (order.every((value, i) => value === i)) order.reverse();
    const picture = shuffle(["bunny", "cat", "bear"])[0];
    const tile = (i) => puzzle ? `<svg viewBox="${i % columns * 100 / columns} ${Math.floor(i / columns) * 100 / rows} ${100 / columns} ${100 / rows}" aria-hidden="true"><use width="100" height="100" href="../../assets/pictures.svg#${picture}"/></svg>` : art(picture);
    board.innerHTML = `<div class="mission-label">${puzzle ? "えを もとどおりに" : "ちいさい → おおきい"}</div>${puzzle ? `<div class="puzzle-preview">${art(picture)}<small>みほん</small></div>` : ""}<div class="assembly ${puzzle ? "picture-puzzle" : "size-line"}" style="--columns:${columns}">${Array.from({length}, (_, i) => `<div role="button" tabindex="0" class="assembly-slot" data-slot="${i}" aria-label="${i + 1}ばんの おきば"><span>${i + 1}</span></div>`).join("")}</div><div class="piece-tray">${order.map((i) => `<button class="assembly-piece ${puzzle ? "picture-piece" : "size-piece"}" data-piece="${i}" style="--piece-size:${40 + i * 19}px" aria-label="${puzzle ? "えのかけら" : "おおきさ"} ${i + 1}">${tile(i)}</button>`).join("")}</div>${hint}<button class="primary check">できた！</button>`;
    board.querySelector(".assembly").style.setProperty("--rows", rows);
    if (!puzzle) board.querySelector(".mission-label").textContent = descending ? "おおきい → ちいさい" : "ちいさい → おおきい";
    let selected;
    const slots = [...board.querySelectorAll(".assembly-slot")];
    const place = (piece, slot) => {
      if (!piece) return;
      const old = slot.querySelector(".assembly-piece");
      if (old === piece) return;
      if (old) board.querySelector(".piece-tray").append(old);
      slot.append(piece); piece.classList.remove("picked"); selected = null;
    };
    board.querySelectorAll(".assembly-piece").forEach((piece) => {
      movable(piece, () => slots, (slot) => place(piece, slot), signal);
      listen(piece, (event) => { event.stopPropagation(); selected?.classList.remove("picked"); selected = piece; piece.classList.add("picked"); });
    });
    slots.forEach(slot => listen(slot, () => place(selected, slot)));
    slots.forEach(slot => slot.addEventListener("keydown", event => {
      if (event.target === slot && ["Enter", " "].includes(event.key)) { event.preventDefault(); place(selected, slot); }
    }, {signal}));
    listen(board.querySelector(".check"), () => slots.every((slot, i) => Number(slot.querySelector(".assembly-piece")?.dataset.piece ?? -1) === (descending ? length - 1 - i : i)) ? finish() : say("もうすこし！ みほんや じゅんばんを みてみよう"));
  } else if (id === "trace") {
    const paths = hard ? [[[15,15],[50,15],[85,15],[85,50],[85,85],[50,85],[15,85],[15,50]], [[15,20],[38,40],[62,20],[85,40],[62,60],[85,80],[38,80],[15,60]]] : [[[15,20],[50,20],[85,20],[85,80],[50,80],[15,80]], [[15,20],[38,65],[50,20],[62,65],[85,20],[85,85]]];
    const points = shuffle(paths)[0];
    board.innerHTML = `<div class="mission-label">ほしを じゅんばんに つなごう</div><svg class="trace-field" viewBox="0 0 100 100" role="img" aria-label="番号順に星をつなぐ道"><polyline class="trace-guide" points="${points.map(p=>p.join(",")).join(" ")}"/><polyline class="trace-ink" points=""/>${points.map(([x,y],i)=>`<g class="trace-node" data-node="${i}"><circle cx="${x}" cy="${y}" r="7"/><text x="${x}" y="${y + 2}">${i+1}</text></g>`).join("")}</svg><p class="hands-hint">1から ゆびを すべらせよう。<br>キーボードでは 下のボタンを じゅんに おせるよ</p><div class="trace-buttons">${points.map((_,i)=>`<button class="secondary" data-point="${i}" aria-label="ほし ${i+1}">${i+1}</button>`).join("")}</div>`;
    const field = board.querySelector(".trace-field");
    let reached = 0, drawing = false;
    const reach = (i) => {
      if (i !== reached || reached === points.length) return;
      board.querySelector(`[data-node="${i}"]`).classList.add("visited");
      reached++;
      field.querySelector(".trace-ink").setAttribute("points", points.slice(0,reached).map(p=>p.join(",")).join(" "));
      if (reached === points.length) finish();
    };
    const move = (event) => {
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(field.getScreenCTM().inverse());
      const next = points[reached];
      if (next && Math.hypot(point.x-next[0],point.y-next[1]) < 11) reach(reached);
    };
    field.addEventListener("pointerdown", event => { drawing = true; field.setPointerCapture(event.pointerId); move(event); }, {signal});
    field.addEventListener("pointermove", event => { if(drawing) move(event); }, {signal});
    for (const type of ["pointerup", "pointercancel"]) field.addEventListener(type, () => { drawing = false; }, {signal});
    board.querySelectorAll("[data-point]").forEach(button => listen(button, () => reach(Number(button.dataset.point))));
  } else if (id === "rhythm") {
    const sequence = Array.from({length:hard ? 7 : 5}, () => Math.floor(Math.random()*4));
    board.innerHTML = '<div class="mission-label">ひかる じゅんばんを おぼえよう</div><div class="music-pads">'+["ド", "レ", "ミ", "ソ"].map((note,i)=>`<button class="music-pad" data-pad="${i}" aria-label="${note}"><span>${note}</span>${art(["apple","flower","star","bunny"][i])}</button>`).join("")+'</div><button class="primary listen">おてほんを きく</button>';
    const pads = [...board.querySelectorAll(".music-pad")];
    let ready = false, index = 0;
    const timers = new Set();
    const later = (fn, ms) => { const timer = setTimeout(()=>{timers.delete(timer);if(!signal.aborted)fn();},ms);timers.add(timer); };
    signal.addEventListener("abort", () => timers.forEach(clearTimeout), {once:true});
    const flash = (i) => {
      pads[i].classList.add("lit");
      if (audio.effects && !audio.paused && audio.context?.state === "running") audio.note([60,62,64,67][i],audio.context.currentTime,0.3,0.2,"effects");
      later(()=>pads[i].classList.remove("lit"),400);
    };
    listen(board.querySelector(".listen"), () => {
      if (!ready && timers.size) return;
      ready = false; index = 0;
      say("よく みてね。おとが オフでも あそべるよ");
      sequence.forEach((value,i)=>later(()=>flash(value),i*750+300));
      later(()=>{ready=true;say("こんどは きみの ばん！");},sequence.length*750+300);
    });
    pads.forEach((pad,i)=>listen(pad,()=>{
      if (!ready) return;
      flash(i);
      if(i!==sequence[index]) { ready=false; say("もういちど おてほんを きいてみよう"); return; }
      if(++index===sequence.length) { ready=false; finish(); }
    }));
  }
}
