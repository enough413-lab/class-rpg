// Ambient rain is visual only. The world decides when to draw it.
const courtyardPuddles = [[402, 616, 24], [866, 517, 29], [1078, 890, 22], [594, 905, 21]];
const woodsPuddles = [[330, 890, 21], [580, 752, 22], [1012, 785, 26], [1250, 878, 23]];

export function createSchoolRain() {
  const drops = Array.from({ length: 40 }, (_, index) => ({
    across: ((index * 137) % 419) / 419,
    down: ((index * 83) % 293) / 293,
    speed: 0.15 + (index % 4) * 0.035,
    length: 7 + (index % 5) * 2
  }));

  function puddles(g, scene, time, reducedMotion) {
    const spots = scene === 'woods' ? woodsPuddles : courtyardPuddles;
    g.save();
    g.lineWidth = 1.5;
    for (const [index, [x, y, width]] of spots.entries()) {
      g.fillStyle = '#6f939477';
      g.beginPath();
      g.ellipse(x, y, width, width * 0.26, 0, 0, Math.PI * 2);
      g.fill();

      const progress = reducedMotion ? 0.5 : ((time + index * 330) % 1350) / 1350;
      g.strokeStyle = 'rgba(208,231,222,' + (0.62 * (1 - progress)) + ')';
      g.beginPath();
      g.ellipse(x, y, 3 + progress * (width - 4), 1 + progress * 4, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
  }

  function atmosphere(g, width, height, time, reducedMotion) {
    g.save();
    g.fillStyle = '#394a6242';
    g.fillRect(0, 0, width, height);
    if (!reducedMotion) {
      const count = width < 700 ? 24 : drops.length;
      g.strokeStyle = '#c5dee759';
      g.lineWidth = 1.5;
      g.beginPath();
      for (const { across, down, speed, length } of drops.slice(0, count)) {
        const x = across * (width + 24) - 12;
        const y = (down * height + time * speed) % (height + 30) - 15;
        g.moveTo(x, y);
        g.lineTo(x - length * 0.36, y + length);
      }
      g.stroke();
    }
    g.restore();
  }

  return { puddles, atmosphere };
}

// The caller supplies the game's existing audio context and sound preference.
export function createRainAmbience() {
  let source = null;
  let audioContext = null;
  let buffer = null;

  function stop() {
    if (!source) return;
    const current = source;
    source = null;
    current.stop();
  }

  function update(context, enabled) {
    if (!enabled || !context || context.state !== 'running') {
      stop();
      return;
    }
    if (audioContext !== context) {
      stop();
      audioContext = context;
      buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const samples = buffer.getChannelData(0);
      let seed = 4317;
      for (let i = 0; i < samples.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        samples[i] = (seed / 2147483648 - 1) * 0.45;
      }
    }
    if (source) return;
    const stream = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const volume = context.createGain();
    stream.buffer = buffer;
    stream.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    volume.gain.value = 0.045;
    stream.connect(filter);
    filter.connect(volume);
    volume.connect(context.destination);
    stream.onended = () => {
      stream.disconnect();
      filter.disconnect();
      volume.disconnect();
    };
    stream.start();
    source = stream;
  }

  return { update, stop };
}

// One shared, pseudo-random rain day per Korean calendar week (Monday–Sunday).
export function rainySchoolDay(now = Date.now()) {
  const day = Math.floor((now + 9 * 3600000) / 86400000);
  const week = Math.floor((day + 3) / 7);
  const weekday = (day + 3) - week * 7;
  let hash = Math.imul(week ^ 0x9e3779b9, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 16), 0xc2b2ae35);
  return weekday === ((hash ^ (hash >>> 13)) >>> 0) % 7;
}
