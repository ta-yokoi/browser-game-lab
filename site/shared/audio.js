// All music is synthesized locally: no recordings, downloads or external assets.
const melody = [
  72,
  76,
  79,
  76,
  74,
  77,
  81,
  77,
  76,
  79,
  84,
  79,
  74,
  77,
  79,
  null,
];
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

export class GameAudio {
  constructor(
    makeContext = () =>
      new (window.AudioContext || window.webkitAudioContext)(),
  ) {
    this.makeContext = makeContext;
    this.context = null;
    this.music = false;
    this.effects = false;
    this.paused = false;
    this.timer = null;
    this.voices = new Set();
    this.lastEffect = -Infinity;
  }

  async setEnabled(kind, enabled) {
    this[kind] = enabled;
    if (!enabled) {
      if (kind === "music") this.stopMusic();
      else this.stopVoices("effects");
    }
    try {
      await this.activate();
      return true;
    } catch {
      this.music = false;
      this.effects = false;
      this.stopMusic();
      this.stopVoices();
      return false;
    }
  }

  async activate() {
    if (this.paused || (!this.music && !this.effects)) {
      if (this.context?.state === "running") await this.context.suspend();
      return;
    }
    if (!this.context) {
      this.context = this.makeContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.3;
      this.master.connect(this.context.destination);
    }
    await this.context.resume();
    // Respect switches/visibility that changed while resume() was pending.
    if (this.paused || (!this.music && !this.effects)) {
      await this.context.suspend();
      return;
    }
    if (this.music && this.timer === null) {
      this.step = 0;
      this.nextNote = this.context.currentTime + 0.04;
      this.scheduleMusic();
      this.timer = setInterval(() => this.scheduleMusic(), 120);
    }
  }

  note(midi, start, duration, volume, kind) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    const voice = { oscillator, envelope, kind };
    this.voices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(voice);
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  scheduleMusic() {
    if (this.paused || !this.music || this.context.state !== "running") return;
    const now = this.context.currentTime;
    // Do not play a backlog when a background tab's timers were throttled.
    this.nextNote = Math.max(this.nextNote, now);
    while (this.nextNote < now + 0.25) {
      const pitch = melody[this.step % melody.length];
      if (pitch !== null) this.note(pitch, this.nextNote, 0.48, 0.09, "music");
      if (this.step % 4 === 0) {
        this.note(
          this.step % 8 === 0 ? 48 : 53,
          this.nextNote,
          1.2,
          0.07,
          "music",
        );
      }
      this.nextNote += 0.55;
      this.step++;
    }
  }

  effect(correct) {
    if (!this.effects || this.paused || this.context?.state !== "running")
      return;
    const now = this.context.currentTime;
    if (now - this.lastEffect < 0.25) return;
    this.lastEffect = now;
    this.stopVoices("effects");
    // A bright rising chime for a match; a quiet descending cue for retrying.
    const notes = correct ? [76, 79, 84] : [67, 64];
    notes.forEach((pitch, i) =>
      this.note(
        pitch,
        now + 0.01 + i * 0.14,
        0.3,
        correct ? 0.23 : 0.12,
        "effects",
      ),
    );
  }

  stopVoices(kind) {
    for (const voice of this.voices) {
      if (kind && voice.kind !== kind) continue;
      voice.envelope.gain.cancelScheduledValues(this.context.currentTime);
      voice.envelope.gain.setValueAtTime(0, this.context.currentTime);
      voice.oscillator.stop();
      voice.oscillator.disconnect();
      voice.envelope.disconnect();
      this.voices.delete(voice);
    }
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
    this.stopVoices("music");
  }

  pause() {
    this.paused = true;
    this.stopMusic();
    this.stopVoices();
    return this.context?.suspend().catch(() => {});
  }
}

export function mountAudioControls() {
  const audio = new GameAudio();
  const controls = document.createElement("div");
  controls.className = "audio-controls";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "おとのせってい");
  controls.innerHTML =
    '<button type="button" data-sound="music" aria-pressed="false">♪ おんがく：オフ</button><button type="button" data-sound="effects" aria-pressed="false">♫ こうかおん：オフ</button><span class="audio-notice" role="status"></span>';
  document.querySelector("main").prepend(controls);
  function refresh() {
    controls.querySelectorAll("button").forEach((button) => {
      const kind = button.dataset.sound;
      button.setAttribute("aria-pressed", String(audio[kind]));
      button.textContent = `${kind === "music" ? "♪ おんがく" : "♫ こうかおん"}：${audio[kind] ? "オン" : "オフ"}`;
    });
  }
  controls.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-sound]");
    if (!button) return;
    audio.paused = document.hidden;
    const task = audio.setEnabled(
      button.dataset.sound,
      !audio[button.dataset.sound],
    );
    refresh();
    if (!(await task))
      controls.querySelector(".audio-notice").textContent =
        "おとが つかえないときも、そのまま あそべるよ。";
    refresh();
  });
  // Resume only after an interaction when returning to a hidden/restored page.
  const resume = () => {
    if (document.hidden) return;
    audio.paused = false;
    audio.activate().catch(() => {});
  };
  document.addEventListener("pointerdown", resume);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") resume();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
  });
  window.addEventListener("pagehide", () => audio.pause());
  return audio;
}
