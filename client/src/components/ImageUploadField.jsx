import { useRef, useState } from 'react';
import api from '../api/client.js';

const TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const BY_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml' };
const MAX_INPUT = 15 * 1024 * 1024; // the file you pick
const TARGET = 600 * 1024;          // size after shrinking
const MAX_SVG = 150 * 1024;

const typeOf = (f) => (TYPES.includes(f.type) ? f.type : BY_EXT[f.name.split('.').pop().toLowerCase()] || '');

const readBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Could not read the file'));
    r.readAsDataURL(blob);
  });

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open this image')); };
    img.src = url;
  });

const toBlob = (canvas, q) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));

// Shrinks a photo until it is small enough. Transparent areas become white.
async function toJpeg(file) {
  const img = await loadImage(file);
  for (const maxW of [1600, 1200, 900, 700]) {
    const scale = Math.min(1, maxW / img.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.85, 0.75, 0.65, 0.55]) {
      const blob = await toBlob(canvas, q);
      if (blob && blob.size <= TARGET) return blob;
    }
  }
  throw new Error('This image is too detailed to shrink. Try a smaller one.');
}

export default function ImageUploadField({ label = 'Image', value, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  const handleFile = async (file) => {
    setError('');
    if (!file) return;
    const type = typeOf(file);
    if (!type) return setError('Please choose a JPG, PNG or SVG image');
    if (file.size > MAX_INPUT) return setError('That file is too large. Choose one under 15 MB');

    setBusy(true);
    try {
      let blob = file;
      let sendType = type;

      if (type === 'image/svg+xml') {
        if (file.size > MAX_SVG) throw new Error('An SVG must be 150 KB or smaller');
        if (!/<svg[\s>]/i.test(await file.text())) throw new Error('This is not a valid SVG file');
      } else {
        blob = await toJpeg(file);
        sendType = 'image/jpeg';
      }

      const data = await readBase64(blob);
      const res = await api.post('/admin/media', {
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 100) || 'image',
        type: sendType,
        data,
      });
      const body = res?.data?.data ?? res?.data ?? {};
      if (!body.url) throw new Error('Upload failed. Please try again');
      onChange(body.url);
    } catch (e) {
      const resp = e.response?.data;
      const details = resp?.errors?.map((x) => `${x.field || ''} ${x.message || ''}`.trim()).join(' | ');
      setError(`${resp?.message || e.message || 'Upload failed'}${details ? `: ${details}` : ''}`);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const isLink = value && !value.startsWith('/api/v1/media/');

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-ink-muted">{label}</span>

      {value ? (
        <div className="flex flex-wrap items-start gap-4 rounded-lg border border-line p-3">
          <img
            src={value}
            alt="Selected cover"
            className="h-28 w-auto max-w-full rounded-md border border-line bg-gray-50 object-cover"
            onError={(e) => { e.currentTarget.style.opacity = 0.3; }}
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              {busy ? 'Uploading...' : 'Change image'}
            </button>
            <button
              type="button"
              onClick={() => { onChange(''); setError(''); }}
              disabled={busy}
              className="text-left text-sm font-semibold text-red-600 hover:underline"
            >
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
          disabled={busy}
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            drag ? 'border-[#d97706] bg-[#fff8eb]' : 'border-gray-300 hover:border-[#d97706] hover:bg-gray-50'
          } disabled:opacity-60`}
        >
          <span className="text-2xl" aria-hidden="true">🖼️</span>
          <span className="text-sm font-bold">{busy ? 'Uploading...' : 'Click to choose an image, or drop it here'}</span>
          <span className="text-xs text-gray-500">JPG, PNG or SVG</span>
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/svg+xml,.jpg,.jpeg,.png,.svg"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{error}</p>}

      <details className="mt-2 text-xs text-gray-500" open={!!isLink}>
        <summary className="cursor-pointer font-semibold">Or use an image link instead</summary>
        <input
          type="url"
          value={isLink ? value : ''}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="https://example.com/image.jpg"
          className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#d97706]"
        />
      </details>
    </div>
  );
}