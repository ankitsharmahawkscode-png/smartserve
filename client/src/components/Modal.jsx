import { useEffect, useRef } from 'react';

export default function Modal({ title, onClose, children, size = 'max-w-lg' }) {
  const box = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    box.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-4 overflow-y-auto" onMouseDown={onClose}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`bg-white rounded-card p-6 w-full ${size} outline-none`} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}