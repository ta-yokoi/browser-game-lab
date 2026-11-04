import { mountAudioControls } from "./audio.js?v=3";
import { games, names } from "./catalog.js";
import { art } from "./art.js";
import { makeQuestion, makeDeck } from "./questions.js";

const game = games.find((item) => item.id === document.body.dataset.game);
const board = document.querySelector("#board");
const feedback = document.querySelector("#feedback");
const next = document.querySelector("#next");
const instruction = document.querySelector("#instruction");
const progress = document.querySelector("#progress");
let difficulty = "easy";
let round = 0;
let answered = false;
let question;
let shapeSelected = false;
let deck = [];
let faceUp = [];
let matched = new Set();
let memoryStarted = false;
let memoryLocked = false;
let pendingTimer;
let circleTimer;
const audio = mountAudioControls();
const correctMark = document.createElement("div");
correctMark.className = "correct-mark";
correctMark.hidden = true;
correctMark.setAttribute("aria-hidden", "true");
correctMark.innerHTML =
  '<svg viewBox="0 0 240 240" focusable="false"><circle cx="120" cy="120" r="100" fill="none" stroke="#df353c" stroke-width="18"/></svg>';
document.body.append(correctMark);
const descriptions = {
  same: "やさしい：2つから選びます。ちょっとむずかしい：4つから選びます。",
  count:
    "やさしい：1〜3。ちょっとむずかしい：1〜5。点を数えて選んでも大丈夫です。",
  shape:
    "やさしい：2つの枠。ちょっとむずかしい：3つの枠。形を押してから枠を選びます。",
  size: "やさしい：「おおきいほう」を5問。ちょっとむずかしい：「ちいさいほう」を5問。",
  pattern:
    "やさしい：4つの並びの続き。ちょっとむずかしい：5つの並びの続き。どちらも交互の並びです。",
  memory:
    "やさしい：2組4枚。ちょっとむずかしい：3組6枚。覚えたら「はじめる」を押します。",
};
document.querySelector("#game-tag").textContent = game.tag;
document.querySelector("#parent-description").textContent = game.parent;
document.querySelector("#difficulty-description").textContent =
  descriptions[game.id];

function say(text, celebrate = false) {
  clearTimeout(circleTimer);
  correctMark.hidden = !celebrate;
  if (celebrate) {
    // Keep the mark visible until Next; memory needs its board for another pair.
    if (game.id === "memory")
      circleTimer = setTimeout(() => {
        correctMark.hidden = true;
      }, 1800);
    audio.effect(true);
  }
  feedback.textContent = text;
  feedback.classList.toggle("celebrate", celebrate);
}
function updateProgress() {
  const count = game.id === "memory" ? deck.length / 2 : 5;
  const done =
    game.id === "memory" ? matched.size / 2 : round + Number(answered);
  progress.innerHTML =
    Array.from(
      { length: count },
      (_, i) =>
        `<span aria-hidden="true" class="progress-dot ${i < done ? "done" : i === done ? "current" : ""}"></span>`,
    ).join("") + `<span class="progress-label">${done} / ${count}</span>`;
  progress.setAttribute("aria-label", `${count}このうち ${done}こ できた`);
}
function option(value, content, label, extra = "") {
  return `<button type="button" class="choice ${extra}" data-answer="${value}" aria-label="${label}">${content}</button>`;
}
function showResult() {
  next.hidden = true;
  instruction.textContent = "いっぱい あそんだね";
  say("");
  board.innerHTML = `<div class="result">${art("bunny")}<div class="flowers" aria-hidden="true">✿ ✿ ✿</div><h2 tabindex="-1">できたね！</h2><p>じょうずに みつけたね。<br>もういっかい あそぶ？</p><div class="result-actions"><button type="button" id="replay" class="primary">もういっかい</button><a class="secondary" href="../../index.html">おうちへ</a></div></div>`;
  board.querySelector("#replay").addEventListener("click", () => reset(true));
  board.querySelector("h2").focus();
}
function correct(button) {
  answered = true;
  button.classList.add("correct");
  board.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
  });
  say("できたね！ はなまる！", true);
  updateProgress();
  next.textContent = round === 4 ? "おしまい ✿" : "つぎへ →";
  next.hidden = false;
  next.focus({ preventScroll: true });
}
function selectAnswer(event) {
  const button = event.target.closest("[data-answer]");
  if (!button || answered || game.id === "memory") return;
  if (game.id === "shape" && !shapeSelected) {
    say("まずは うえの かたちを おしてね");
    board.querySelector("#shape-source").focus({ preventScroll: true });
    return;
  }
  if (String(question.answer) === button.dataset.answer) correct(button);
  else {
    audio.effect(false);
    say("もういちど みてみよう。だいじょうぶ！");
  }
}
board.addEventListener("click", selectAnswer);
function showQuestion(moveFocus = false) {
  answered = false;
  shapeSelected = false;
  next.hidden = true;
  say("");
  instruction.textContent = game.instruction;
  question = makeQuestion(game.id, difficulty);
  updateProgress();
  if (game.id === "same") {
    board.innerHTML = `<div class="sample" role="img" aria-label="みほん：${names[question.answer]}"><span class="sample-label">みほん</span>${art(question.answer)}</div><div class="options">${question.options.map((id) => option(id, art(id), names[id])).join("")}</div>`;
  } else if (game.id === "count") {
    board.innerHTML = `<div class="count-items" role="img" aria-label="${names[question.picture]}が ${question.answer}こ">${Array.from({ length: question.answer }, () => art(question.picture)).join("")}</div><div class="options">${question.options.map((n) => option(n, `<span class="number">${n}</span><span class="dots" aria-hidden="true">${"<i></i>".repeat(n)}</span>`, `${n}こ`)).join("")}</div>`;
  } else if (game.id === "shape") {
    board.innerHTML = `<button type="button" class="choice shape-source" id="shape-source" aria-label="${names[question.answer]}をえらぶ" aria-pressed="false">${art(question.answer)}</button><span class="shape-arrow" aria-hidden="true">↓</span><div class="options">${question.options.map((id) => option(id, art(id, "outline"), `${names[id]}のおうち`)).join("")}</div>`;
    board.querySelector("#shape-source").addEventListener("click", (event) => {
      if (answered) return;
      shapeSelected = true;
      event.currentTarget.classList.add("selected");
      event.currentTarget.setAttribute("aria-pressed", "true");
      say("ぴったりの おうちは どれかな？");
    });
  } else if (game.id === "size") {
    const adjective = question.answer === "big" ? "おおきい" : "ちいさい";
    instruction.textContent = `${adjective}ほうを えらぼう`;
    board.innerHTML = `<div class="size-example" role="img" aria-label="${adjective}ほうを えらぶ おてほん"><span class="example-pair">${art("circle", question.answer === "big" ? "requested" : "")}${art("circle", `small ${question.answer === "small" ? "requested" : ""}`)}</span><span>${adjective}ほう</span></div><div class="options size-options">${question.options.map((size) => option(size, art(question.picture, size), `${size === "big" ? "おおきい" : "ちいさい"} ${names[question.picture]}`, "size-choice")).join("")}</div>`;
  } else if (game.id === "pattern") {
    board.innerHTML = `<div class="sequence" role="img" aria-label="${question.sequence.map((id) => names[id]).join("、")}、つぎは？">${question.sequence.map((id) => art(id)).join("")}<span class="sequence-gap" aria-hidden="true">?</span></div><div class="options">${question.options.map((id) => option(id, art(id), names[id])).join("")}</div>`;
  }
  if (moveFocus) board.querySelector("button")?.focus({ preventScroll: true });
}
next.addEventListener("click", () => {
  if (!answered) return;
  if (round === 4) showResult();
  else {
    round++;
    showQuestion(true);
  }
});
function paintCards() {
  board.querySelectorAll(".memory-card").forEach((button, index) => {
    const revealed =
      !memoryStarted || faceUp.includes(index) || matched.has(index);
    button.innerHTML = revealed
      ? art(deck[index])
      : '<span class="back" aria-hidden="true">✿</span>';
    button.setAttribute(
      "aria-label",
      `${index + 1}ばんのカード${revealed ? `、${names[deck[index]]}` : ""}${matched.has(index) ? "、できた" : ""}`,
    );
    button.disabled =
      !memoryStarted ||
      memoryLocked ||
      faceUp.includes(index) ||
      matched.has(index);
    button.classList.toggle("matched", matched.has(index));
  });
}
function turnCard(index) {
  if (
    !memoryStarted ||
    memoryLocked ||
    faceUp.includes(index) ||
    matched.has(index)
  )
    return;
  say("");
  faceUp.push(index);
  if (faceUp.length === 1) {
    paintCards();
    return;
  }
  const [first, second] = faceUp;
  if (deck[first] === deck[second]) {
    matched.add(first);
    matched.add(second);
    faceUp = [];
    say("おなじだね！ できた！", true);
    updateProgress();
    paintCards();
    if (matched.size === deck.length) {
      memoryStarted = false;
      const actions = board.querySelector(".memory-actions");
      actions.innerHTML =
        '<button class="primary" id="memory-finish">おしまい ✿</button>';
      actions.querySelector("button").addEventListener("click", showResult);
      actions.querySelector("button").focus({ preventScroll: true });
    } else
      board
        .querySelector(".memory-card:not(:disabled)")
        ?.focus({ preventScroll: true });
  } else {
    memoryLocked = true;
    paintCards();
    audio.effect(false);
    say("だいじょうぶ。もういちど さがそう");
    pendingTimer = setTimeout(() => {
      faceUp = [];
      memoryLocked = false;
      paintCards();
      board
        .querySelectorAll(".memory-card")
        [first]?.focus({ preventScroll: true });
    }, 1300);
  }
}
function showMemory(moveFocus = false) {
  deck = makeDeck(difficulty);
  matched = new Set();
  faceUp = [];
  memoryStarted = false;
  memoryLocked = false;
  instruction.textContent = "えを みて おぼえよう";
  next.hidden = true;
  updateProgress();
  board.innerHTML = `<div class="memory-grid ${deck.length === 6 ? "six" : ""}">${deck.map((_, index) => `<button type="button" class="choice memory-card" data-index="${index}"></button>`).join("")}</div><div class="memory-actions"><button type="button" id="memory-start" class="primary">はじめる →</button></div><p class="board-caption">おぼえたら「はじめる」を おしてね</p>`;
  paintCards();
  board
    .querySelectorAll(".memory-card")
    .forEach((button) =>
      button.addEventListener("click", () =>
        turnCard(Number(button.dataset.index)),
      ),
    );
  board.querySelector("#memory-start").addEventListener("click", () => {
    memoryStarted = true;
    instruction.textContent = "おなじ ふたりを みつけよう";
    board.querySelector(".memory-actions").innerHTML =
      '<span class="memory-help">カードを ふたつ おしてね</span>';
    board.querySelector(".board-caption").textContent = "ゆっくり さがしてね";
    paintCards();
    board.querySelector(".memory-card").focus({ preventScroll: true });
  });
  if (moveFocus)
    board.querySelector("#memory-start").focus({ preventScroll: true });
}
function reset(moveFocus = false) {
  clearTimeout(pendingTimer);
  round = 0;
  answered = false;
  say("");
  if (game.id === "memory") showMemory(moveFocus);
  else showQuestion(moveFocus);
}
document.querySelectorAll('[name="difficulty"]').forEach((input) =>
  input.addEventListener("change", () => {
    difficulty = input.value;
    reset();
    say("むずかしさを かえたよ。はじめから あそぼう");
  }),
);
window.addEventListener("pagehide", () => {
  clearTimeout(pendingTimer);
  clearTimeout(circleTimer);
});
// A restored page may have been suspended during a mismatched pair.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) reset();
});
reset();
