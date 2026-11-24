const leafColors = ['#a7bd64', '#c2cf78', '#869e52'];
const canopy = [[83, 522], [56, 635], [1490, 598], [1436, 866], [1072, 390]];

export function butterflyPosition(flower, time, reducedMotion) {
  if (!flower) return null;
  const [x, y] = flower;
  const turn = reducedMotion ? 0 : (time % 9000) / 9000;
  const lifting = turn > 0.44 ? Math.sin(Math.PI * (turn - 0.44) / 0.56) : 0;
  return { x: x + Math.sin(turn * Math.PI * 4) * lifting * 48, y: y - 42 - lifting * 25, resting: lifting === 0 };
}

function paintButterfly(g, spot, time) {
  const wing = spot.resting ? 4 : 3 + Math.round((1 + Math.sin(time / 50)) * 3);
  g.save();
  g.translate(Math.round(spot.x), Math.round(spot.y));
  g.fillStyle = '#684d69';
  g.fillRect(-wing - 1, -5, wing * 2 + 3, 9);
  g.fillStyle = '#efbd84';
  g.fillRect(-wing, -4, wing, 6);
  g.fillRect(2, -4, wing, 6);
  g.fillStyle = '#fff0b3';
  g.fillRect(-wing, -4, wing, 2);
  g.fillRect(2, -4, wing, 2);
  g.fillStyle = '#684d69';
  g.fillRect(0, -5, 2, 10);
  g.restore();
}

function paintBirds(g, time) {
  const flight = (time % 22000) / 5200;
  if (flight > 1) return;
  g.save();
  for (let i = 0; i < 2; i++) {
    const x = Math.round(354 + flight * 445 - i * 31);
    const y = Math.round(470 - 98 * flight - i * 12);
    const wing = Math.sin(time / 85 + i) > 0 ? -4 : 3;
    g.fillStyle = '#45534e';
    g.fillRect(x - 5, y, 11, 3);
    g.fillRect(x - 8, y + wing, 5, 2);
    g.fillRect(x + 4, y + wing, 5, 2);
    g.fillStyle = '#efe6c6';
    g.fillRect(x + 2, y + 2, 4, 1);
  }
  g.restore();
}

export function paintCourtyardNature(g, time, { flower, rain, daylight, reducedMotion }) {
  if (rain || daylight === 'evening') return;
  const spot = butterflyPosition(flower, time, reducedMotion);
  if (spot) paintButterfly(g, spot, time);
  if (!reducedMotion) paintBirds(g, time);
}

export function paintWoodsLeaves(g, time, reducedMotion) {
  g.save();
  canopy.forEach(([x, y], i) => {
    const sway = reducedMotion ? 0 : Math.round(Math.sin(time / 570 + i * 1.7) * 4);
    g.fillStyle = leafColors[i % leafColors.length];
    g.fillRect(x + sway, y, 8, 4);
    g.fillRect(x - 2 + sway, y + 3, 5, 3);
  });
  g.restore();
}
