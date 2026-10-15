import { Link } from 'react-router-dom';

export default function LinkButton({ variant = 'primary', className = '', ...props }) {
  const tone = variant === 'primary' ? 'bg-brand text-white border-brand hover:bg-brand-dark' : 'bg-white text-brand-dark border-brand';
  return (
    <Link
      className={`inline-flex items-center justify-center min-h-[44px] px-5 rounded-[10px] border font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${tone} ${className}`}
      {...props}
    />
  );
}