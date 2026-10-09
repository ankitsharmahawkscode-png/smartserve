const base = 'inline-flex items-center justify-center min-h-[44px] px-5 rounded-[10px] border font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50';
export const Button = ({ variant = 'primary', className = '', ...p }) => (
  <button
    className={`${base} ${variant === 'primary' ? 'bg-brand text-white border-brand hover:bg-brand-dark' : 'bg-white text-brand-dark border-brand'} ${className}`}
    {...p}
  />
);

export const Card = ({ className = '', ...p }) => (
  <div className={`bg-white border border-line rounded-card p-6 ${className}`} {...p} />
);

const STATUS = {
  PENDING: ['Pending', 'bg-[#FDF0D9] text-[#7A3E00]'],
  CONFIRMED: ['Confirmed', 'bg-brand-tint text-brand-dark'],
  ASSIGNED: ['Assigned', 'bg-[#E4E9FB] text-[#26387A]'],
  ACCEPTED: ['Accepted', 'bg-[#E4E9FB] text-[#26387A]'],
  IN_PROGRESS: ['In progress', 'bg-[#EDE4FA] text-[#4A2A86]'],
  COMPLETED: ['Completed', 'bg-[#DDF3DD] text-[#1E5A22]'],
  CANCELLED: ['Cancelled', 'bg-[#F3E3E3] text-[#7A1F1F]'],
};
export const StatusBadge = ({ status }) => {
  const [label, cls] = STATUS[status] || [status, 'bg-line'];
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
};
