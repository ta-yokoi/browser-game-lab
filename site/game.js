const arena = document.querySelector('#arena');
const target = document.querySelector('#target');
const start = document.querySelector('#start');
const scoreLabel = document.querySelector('#score');
const timeLabel = document.querySelector('#time');
const message = document.querySelector('#message');
const duration = 20;
let score = 0;
let deadline = 0;
let timer;
let playing = false;

function moveTarget() {
  target.style.left = `${Math.random() * Math.max(0, arena.clientWidth - 64)}px`;
  target.style.top = `${Math.random() * Math.max(0, arena.clientHeight - 64)}px`;
}

function finish() {
  playing = false;
  clearInterval(timer);
  target.hidden = true;
  timeLabel.textContent = '0';
  message.hidden = false;
  message.textContent = `おつかれさま！ スコアは ${score} 点です。もう一度挑戦してみよう。`;
  start.innerHTML = 'もう一度 <span aria-hidden="true">↗</span>';
  start.focus();
}

start.addEventListener('click', () => {
  clearInterval(timer);
  score = 0;
  playing = true;
  scoreLabel.textContent = '0';
  timeLabel.textContent = String(duration);
  deadline = performance.now() + duration * 1000;
  message.hidden = true;
  target.hidden = false;
  start.innerHTML = 'やり直す <span aria-hidden="true">↗</span>';
  moveTarget();
  target.focus({ preventScroll: true });
  timer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    timeLabel.textContent = String(remaining);
    if (remaining === 0) finish();
  }, 100);
});

target.addEventListener('click', () => {
  if (!playing) return;
  if (performance.now() >= deadline) {
    finish();
    return;
  }
  scoreLabel.textContent = String(++score);
  moveTarget();
});

window.addEventListener('resize', () => { if (playing) moveTarget(); });
