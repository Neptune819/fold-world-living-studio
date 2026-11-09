// The ML model supplies landmarks. These explicit rules turn them into an artwork control.
export function measureHand(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 21) return null;
  const palmIndices = [0, 5, 9, 13, 17];
  if (![...palmIndices, 4, 8].every(i => Number.isFinite(landmarks[i]?.x) && Number.isFinite(landmarks[i]?.y))) return null;
  const palm = palmIndices.reduce((p, i) => ({ x: p.x + landmarks[i].x / 5, y: p.y + landmarks[i].y / 5 }), { x: 0, y: 0 });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const palmSize = Math.max(0.04, distance(landmarks[0], landmarks[9]));
  const pinchRatio = distance(landmarks[4], landmarks[8]) / palmSize;
  return { x: Math.max(0, Math.min(1, 1 - palm.x)), y: Math.max(0, Math.min(1, palm.y)), pinchRatio,
    gather: Math.max(0, Math.min(1, (0.65 - pinchRatio) / 0.4)) };
}
