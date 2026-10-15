import { useId } from 'react';

const base = 'w-full px-3 rounded-[10px] border bg-white text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';
const Wrap = ({ id, label, error, className = '', children }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-semibold text-ink-muted mb-1">{label}</label>
    {children}
    {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
  </div>
);
const aria = (id, error) => ({ id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined });
const border = (error) => (error ? 'border-red-700' : 'border-[#AEB9B6]');

export const Select = ({ label, error, className, children, ...p }) => {
  const id = useId();
  return <Wrap id={id} label={label} error={error} className={className}><select {...aria(id, error)} className={`${base} min-h-[44px] ${border(error)}`} {...p}>{children}</select></Wrap>;
};
export const Textarea = ({ label, error, className, ...p }) => {
  const id = useId();
  return <Wrap id={id} label={label} error={error} className={className}><textarea {...aria(id, error)} rows={3} className={`${base} py-2 ${border(error)}`} {...p} /></Wrap>;
};
export const Checkbox = ({ label, className = '', ...p }) => (
  <label className={`flex items-center gap-2 min-h-[44px] font-semibold ${className}`}><input type="checkbox" className="h-5 w-5" {...p} />{label}</label>
);