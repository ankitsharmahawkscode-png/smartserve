import { useState } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { Card } from '../../components/ui.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDateTime } from '../../utils/format.js';

export default function AdminMessages() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/messages', { page });
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Messages</h1>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No messages yet">Messages sent from the Contact page appear here.</EmptyState>}
      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.items.map((m) => (
            <li key={m._id}><Card>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-extrabold">{m.name}</p>
                <p className="text-sm text-ink-muted">{prettyDateTime(m.createdAt)}</p>
              </div>
              <p className="text-sm mb-2">
                <a className="underline text-brand" href={`mailto:${m.email}`}>{m.email}</a>
                {m.phone && <> &middot; <a className="underline text-brand" href={`tel:${m.phone}`}>{m.phone}</a></>}
              </p>
              <p className="whitespace-pre-line">{m.message}</p>
            </Card></li>
          ))}
        </ul>
      )}
      <Pagination data={data} onPage={setPage} />
    </div>
  );
}