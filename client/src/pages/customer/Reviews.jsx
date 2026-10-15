import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card } from '../../components/ui.jsx';
import { Alert } from '../../components/Input.jsx';
import { Textarea } from '../../components/Fields.jsx';
import Stars from '../../components/Stars.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';

function ReviewForm({ booking, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const { busy, error, run } = useAction();
  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setErr('Choose a rating from 1 to 5');
    setErr('');
    if (await run(() => api.post('/reviews', { bookingId: booking._id, rating, ...(comment.trim() && { comment: comment.trim() }) }))) onDone();
  };
  return (
    <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}
      <fieldset>
        <legend className="text-sm font-semibold text-ink-muted mb-1">Your rating</legend>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`min-h-[44px] min-w-[44px] px-3 inline-flex items-center justify-center rounded-[10px] border font-semibold cursor-pointer ${rating === n ? 'bg-brand text-white border-brand' : 'bg-white border-[#AEB9B6]'}`}>
              <input type="radio" name={`rating-${booking._id}`} value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              {n} {n === 1 ? 'star' : 'stars'}
            </label>
          ))}
        </div>
        {err && <p className="mt-1 text-sm text-red-700">{err}</p>}
      </fieldset>
      <Textarea label="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      <div><Button type="submit" disabled={busy}>{busy ? 'Sending...' : 'Submit review'}</Button></div>
    </form>
  );
}

export default function Reviews() {
  const { data, loading, error, reload } = useFetch('/reviews/mine');
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState('');
  if (loading) return <Spinner />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;
  const { pending, reviews } = data;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Reviews</h1>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}

      <h2 className="text-xl font-extrabold mb-3">Waiting for your review</h2>
      {pending.length === 0 ? <EmptyState title="Nothing to review">Completed jobs you have not reviewed yet appear here.</EmptyState> : (
        <ul className="flex flex-col gap-3 mb-8">
          {pending.map((b) => (
            <li key={b._id}><Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-extrabold">{b.service?.name}</p><p className="text-ink-muted">{b.bookingNo}, {prettyDate(b.date)}</p></div>
                <Button variant="secondary" onClick={() => setOpen(open === b._id ? null : b._id)} aria-expanded={open === b._id}>{open === b._id ? 'Close' : 'Write a review'}</Button>
              </div>
              {open === b._id && <ReviewForm booking={b} onDone={() => { setOpen(null); setNotice('Thank you for your review'); reload(); }} />}
            </Card></li>
          ))}
        </ul>
      )}

      <h2 className="text-xl font-extrabold mb-3">Your reviews</h2>
      {reviews.length === 0 ? <p className="text-ink-muted">You have not written any reviews yet.</p> : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r._id}><Card>
              <p className="font-extrabold">{r.service?.name} <span className="font-normal text-ink-muted">({r.booking?.bookingNo})</span></p>
              <Stars value={r.rating} />
              {r.comment && <p className="mt-2">{r.comment}</p>}
              {r.isHidden && <p className="mt-2 text-sm text-ink-muted">This review is hidden by the admin.</p>}
            </Card></li>
          ))}
        </ul>
      )}
    </div>
  );
}