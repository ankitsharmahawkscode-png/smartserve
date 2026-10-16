import { useEffect, useRef } from 'react';

export default function Modal({ title, onClose, children, size = 'max-w-lg' }) {
  const box = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    box.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);

    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-card w-full ${size} outline-none flex flex-col max-h-[90vh]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header — fixed */}
        <h2 className="text-xl font-extrabold px-6 pt-6 pb-4 shrink-0">
          {title}
        </h2>

        {/* Body — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}