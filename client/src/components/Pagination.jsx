import { Button } from './ui.jsx';

export default function Pagination({ data, onPage }) {
  if (!data || data.pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <Button variant="secondary" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>Previous</Button>
      <span className="text-ink-muted">Page {data.page} of {data.pages}</span>
      <Button variant="secondary" disabled={data.page >= data.pages} onClick={() => onPage(data.page + 1)}>Next</Button>
    </div>
  );
}