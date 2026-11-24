const profiles = {
  wood: { seconds: 0.14, grain: 0.12, tone: 116, body: 0.28, decay: 8 },
  dirt: { seconds: 0.19, grain: 0.24, tone: 58, body: 0.11, decay: 7 },
  broom: { seconds: 0.28, grain: 0.32, tone: 0, body: 0, decay: 3 },
  window: { seconds: 0.44, grain: 0.08, tone: 148, body: 0.19, decay: 2 },
  pond: { seconds: 0.65, grain: 0.16, tone: 94, body: 0.14, decay: 3 }
};

export function crossedFootfall(phase, distance) {
  return Math.floor(phase * 2) !== Math.floor((phase + distance / 56) * 2);
}

export function makeSchoolFoley() {
  let context;
  const buffers = new Map();

  function play(audio, kind) {
    if (!audio || audio.state !== 'running' || !Object.hasOwn(profiles, kind)) return;
    if (context !== audio) {
      context = audio;
      buffers.clear();
    }
    let buffer = buffers.get(kind);
    if (!buffer) {
      const { seconds, grain, tone, body, decay } = profiles[kind];
      const { sampleRate } = audio;
      buffer = audio.createBuffer(1, Math.round(seconds * sampleRate), sampleRate);
      const samples = buffer.getChannelData(0);
      let seed = 3211, filtered = 0;
      for (let i = 0; i < samples.length; i++) {
        const time = i / sampleRate, progress = time / seconds;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        filtered += (noise - filtered) * (kind === 'pond' ? 0.06 : 0.20);
        const hz = kind === 'window' ? tone * (1 + Math.sin(progress * 10) * 0.30) : tone;
        const attack = Math.min(1, time / 0.018);
        const envelope = attack * (1 - progress) * Math.exp(-decay * progress);
        const wave = Math.sin(2 * Math.PI * hz * time);
        samples[i] = (filtered * grain + wave * body) * envelope;
      }
      buffers.set(kind, buffer);
    }
    const source = audio.createBufferSource();
    const volume = audio.createGain();
    source.buffer = buffer;
    volume.gain.value = 0.20;
    source.connect(volume);
    volume.connect(audio.destination);
    source.onended = () => {
      source.disconnect();
      volume.disconnect();
    };
    source.start();
  }

  return { play };
}
