import { Button, Card } from './ui.jsx';

export const Spinner = ({ label = 'Loading...' }) => (
  <div role="status" className="p-10 text-center text-ink-muted">{label}</div>
);

export const ErrorState = ({ message, onRetry }) => (
  <Card className="text-center">
    <p role="alert" className="text-red-800 mb-4">{message}</p>
    {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
  </Card>
);

export const EmptyState = ({ title, children }) => (
  <Card className="text-center py-12">
    <h2 className="text-xl font-extrabold mb-2">{title}</h2>
    <div className="text-ink-muted">{children}</div>
  </Card>
);

export const SkeletonCards = ({ n = 6 }) => (
  <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="bg-white border border-line rounded-card p-6 animate-pulse">
        <div className="h-28 rounded-[10px] bg-line mb-4" />
        <div className="h-5 w-2/3 bg-line rounded mb-2" />
        <div className="h-4 w-1/3 bg-line rounded" />
      </div>
    ))}
  </div>
);