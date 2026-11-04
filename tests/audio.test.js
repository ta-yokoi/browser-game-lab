import { test } from "node:test";
import assert from "node:assert/strict";
import { GameAudio } from "../site/shared/audio.js";

function context() {
  const nodes = [];
  const parameter = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  return {
    currentTime: 0,
    state: "suspended",
    destination: {},
    nodes,
    createGain() {
      return { gain: parameter(), connect() {}, disconnect() {} };
    },
    createOscillator() {
      const node = {
        frequency: parameter(),
        connect() {},
        disconnect() {},
        start(time) {
          this.started = time;
        },
        stop(time) {
          this.stopped = time ?? "now";
        },
      };
      nodes.push(node);
      return node;
    },
    async resume() {
      this.state = "running";
    },
    async suspend() {
      this.state = "suspended";
    },
  };
}

test("audio is opt-in and does not initialize on a silent interaction", async () => {
  let created = 0;
  const audio = new GameAudio(() => {
    created++;
    return context();
  });
  await audio.activate();
  audio.effect(true);
  assert.equal(created, 0);
});

test("effects distinguish success/retry, throttle rapid taps and stop when muted", async () => {
  const ctx = context();
  const audio = new GameAudio(() => ctx);
  await audio.setEnabled("effects", true);
  audio.effect(true);
  assert.equal(ctx.nodes.length, 3);
  assert.ok(ctx.nodes[0].frequency.value < ctx.nodes[2].frequency.value);
  audio.effect(false);
  assert.equal(ctx.nodes.length, 3);
  ctx.currentTime = 1;
  audio.effect(false);
  assert.equal(ctx.nodes.length, 5);
  assert.ok(ctx.nodes[3].frequency.value > ctx.nodes[4].frequency.value);
  assert.equal(ctx.nodes[0].stopped, "now");
  await audio.setEnabled("effects", false);
  assert.equal(audio.voices.size, 0);
  assert.equal(ctx.state, "suspended");
  audio.effect(true);
  assert.equal(ctx.nodes.length, 5);
});

test("music stays quiet when muted and pauses without a queued backlog", async () => {
  const ctx = context();
  const audio = new GameAudio(() => ctx);
  try {
    await audio.setEnabled("music", true);
    assert.equal(ctx.nodes.length, 2);
    await audio.activate();
    assert.equal(ctx.nodes.length, 2, "no duplicate scheduler");
    ctx.currentTime = 100;
    audio.scheduleMusic();
    assert.ok(ctx.nodes.length <= 4, "no burst of old notes");
    await audio.pause();
    assert.equal(audio.timer, null);
    assert.equal(audio.voices.size, 0);
    assert.equal(ctx.state, "suspended");
    audio.paused = false;
    await audio.activate();
    assert.notEqual(audio.timer, null);
    await audio.setEnabled("music", false);
    assert.equal(audio.timer, null);
    assert.equal(audio.voices.size, 0);
  } finally {
    await audio.pause();
  }
});

test("unsupported audio is non-fatal and returns to muted settings", async () => {
  const audio = new GameAudio(() => {
    throw new Error("Audio unavailable");
  });
  assert.equal(await audio.setEnabled("music", true), false);
  assert.equal(audio.music, false);
  assert.equal(audio.effects, false);
});

test("muting while resume is pending cannot restart music", async () => {
  const ctx = context();
  let release;
  ctx.resume = () =>
    new Promise((resolve) => {
      release = () => {
        ctx.state = "running";
        resolve();
      };
    });
  const audio = new GameAudio(() => ctx);
  const enabling = audio.setEnabled("music", true);
  await audio.setEnabled("music", false);
  release();
  await enabling;
  assert.equal(audio.timer, null);
  assert.equal(ctx.nodes.length, 0);
  assert.equal(ctx.state, "suspended");
});
