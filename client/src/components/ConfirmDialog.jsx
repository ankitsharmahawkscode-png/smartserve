import { useEffect, useRef } from 'react';
import { Button } from './ui.jsx';

export default function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', cancelLabel = 'Go back', onConfirm, onCancel, busy }) {
  const first = useRef(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel; // always call the latest handler without re-running the effect
  useEffect(() => {
    if (!open) return undefined;
    first.current?.focus();
    const onKey = (e) => e.key === 'Escape' && cancelRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="dlg-title" className="bg-white rounded-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 id="dlg-title" className="text-xl font-extrabold mb-3">{title}</h2>
        <div className="mb-5">{children}</div>
        <div className="flex gap-3 justify-end flex-wrap">
          <button ref={first} type="button" onClick={onCancel} className="min-h-[44px] px-5 rounded-[10px] border border-brand bg-white text-brand-dark font-semibold">{cancelLabel}</button>
          <Button onClick={onConfirm} disabled={busy}>{busy ? 'Please wait...' : confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}