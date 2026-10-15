import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  const id = useId();
  const errId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink-muted mb-1">{label}</label>
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
        className={`w-full min-h-[44px] px-3 rounded-[10px] border bg-white text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${error ? 'border-red-700' : 'border-[#AEB9B6]'}`}
        {...props}
      />
      {error && <p id={errId} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
});
export default Input;

export const Alert = ({ children }) => (
  <div role="alert" className="rounded-[10px] border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{children}</div>
);