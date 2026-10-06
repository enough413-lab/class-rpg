// Keep the existing text RPC/column and old single-photo records compatible.
// Multiple photos are a JSON array; the whole payload stays below the RPC's
// 2,000,000-character limit. Drafts use the same representation.
export const MAX_QUEST_PHOTOS = 5;
const MAX_PHOTO_CHARS = 360000;
const MAX_PAYLOAD_CHARS = 1999000;

function safeImage(value) {
  if (typeof value !== 'string') return false;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value)) return true;
  try { return /^https?:$/.test(new URL(value).protocol); } catch { return false; }
}

export function readEvidenceImages(value) {
  if (!value) return [];
  let images = value;
  if (typeof value === 'string') {
    if (safeImage(value)) return [value];
    try { images = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(images) ? images.filter(safeImage).slice(0, MAX_QUEST_PHOTOS) : [];
}

export function encodeEvidenceImages(images) {
  if (images.length > MAX_QUEST_PHOTOS) throw new Error('사진은 최대 5장까지 첨부할 수 있어요.');
  if (!images.every(safeImage)) throw new Error('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.');
  const value = images.length === 0 ? '' : images.length === 1 ? images[0] : JSON.stringify(images);
  if (value.length > MAX_PAYLOAD_CHARS) throw new Error('사진 용량이 너무 커요. 사진을 줄여 주세요.');
  return value;
}

async function shrinkImage(url) {
  const img = new Image();
  img.src = url;
  try { await img.decode(); } catch { throw new Error('읽을 수 없는 사진이에요. JPG, PNG 또는 WebP 사진으로 다시 선택해 주세요.'); }
  let scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('사진을 준비하지 못했어요. 다시 시도해 주세요.');
  for (let attempt = 0; attempt < 7; attempt++) {
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= MAX_PHOTO_CHARS) return result;
    }
    scale *= 0.75;
  }
  throw new Error('사진 용량을 줄이지 못했어요. 다른 사진을 선택해 주세요.');
}

export async function prepareEvidencePhotos(existing, files) {
  if (existing.length + files.length > MAX_QUEST_PHOTOS) throw new Error('사진은 최대 5장까지 첨부할 수 있어요. 먼저 사진을 삭제해 주세요.');
  for (const file of files) {
    if (!/^image\//i.test(file.type)) throw new Error('사진 파일만 선택해 주세요.');
    if (file.size > 15 * 1024 * 1024) throw new Error('사진 한 장의 원본 크기는 15MB 이하여야 해요.');
  }
  const images = [];
  for (const old of existing) images.push(old.length > MAX_PHOTO_CHARS ? await shrinkImage(old) : old);
  // Commit only after every image succeeds, preserving the draft on any failure.
  for (const file of files) {
    const url = URL.createObjectURL(file);
    try { images.push(await shrinkImage(url)); }
    finally { URL.revokeObjectURL(url); }
  }
  return encodeEvidenceImages(images);
}
