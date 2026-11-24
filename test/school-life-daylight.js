const koreanHour = now => ((now + 9 * 3600000) % 86400000 + 86400000) % 86400000 / 3600000;

export function schoolDaylight(now = Date.now()) {
  const hour = koreanHour(now);
  if (hour < 6 || hour >= 19) return 'evening';
  if (hour < 11) return 'morning';
  if (hour >= 16) return 'late-afternoon';
  return 'afternoon';
}

const lighting = {
  morning: { light: [255, 203, 126], shade: [124, 105, 91], amount: 0.20, direction: 1, shadow: 15 },
  afternoon: { light: [255, 239, 184], shade: [88, 96, 111], amount: 0.11, direction: -1, shadow: 9 },
  'late-afternoon': { light: [250, 175, 111], shade: [103, 89, 116], amount: 0.19, direction: -1, shadow: 24 },
  evening: { light: [252, 174, 103], shade: [57, 70, 109], amount: 0.24, direction: -1, shadow: 16 }
};

const color = (rgb, alpha) => 'rgba(' + rgb.join(',') + ',' + alpha + ')';

const lastTint = new WeakMap();

export function paintSchoolLight(g, width, height, daylight, indoor) {
  const key = daylight + '/' + indoor + '/' + width + '/' + height;
  let cached = lastTint.get(g);
  if (cached?.key !== key) {
    const { light, shade, amount, direction } = lighting[daylight];
    const strength = indoor ? amount * 0.65 : amount;
    const start = direction > 0 ? 0 : width;
    const tint = g.createLinearGradient(start, 0, width - start, height);
    tint.addColorStop(0, color(light, strength));
    tint.addColorStop(0.48, color(shade, strength * 0.18));
    tint.addColorStop(1, color(shade, strength));
    cached = { key, tint };
    lastTint.set(g, cached);
  }
  g.save();
  g.fillStyle = cached.tint;
  g.fillRect(0, 0, width, height);
  g.restore();
}

export function paintSchoolShadow(g, x, y, daylight, indoors) {
  const { direction, shadow } = lighting[daylight];
  const length = indoors ? shadow * 0.65 : shadow;
  g.save();
  g.translate(x, y + 6);
  g.rotate(direction * 0.32);
  g.fillStyle = '#3c433429';
  g.beginPath();
  g.ellipse(direction * length / 2, 0, length, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
