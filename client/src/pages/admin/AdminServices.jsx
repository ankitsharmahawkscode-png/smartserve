import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import useDebounced from '../../hooks/useDebounced.js';
import { Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Checkbox, Select, Textarea } from '../../components/Fields.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr } from '../../utils/format.js';

// "November 3, 2026 at 1:10 PM"
const fmtDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
};

// ---------- small icons ----------
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {children}
  </svg>
);
const LockIcon = () => (
  <Icon><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
);
const UnlockIcon = () => (
  <Icon><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></Icon>
);
const TrashIcon = () => (
  <Icon><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></Icon>
);
const PencilIcon = () => (
  <Icon><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icon>
);

const actionBtn =
  'inline-flex h-8 w-9 items-center justify-center rounded text-white transition-opacity hover:opacity-85 disabled:opacity-50';

function ServiceForm({ service, categories, onClose, onDone }) {
  const [f, setF] = useState({
    category: service?.category?._id || '', name: service?.name || '', description: service?.description || '',
    basePrice: service?.basePrice ?? '', pricingType: service?.pricingType || 'estimate', durationMins: service?.durationMins ?? 60,
    isAvailable: service?.isAvailable ?? true, image: service?.image || '',
  });
  const [errs, setErrs] = useState({});
  const { busy, error, run } = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (!f.category) x.category = 'Choose a category';
    if (f.name.trim().length < 2) x.name = 'Enter a service name';
    if (f.basePrice === '' || Number(f.basePrice) < 0) x.basePrice = 'Enter a price of 0 or more';
    const mins = Number(f.durationMins);
    if (!Number.isInteger(mins) || mins < 15 || mins > 960) x.durationMins = 'Between 15 and 960 minutes';
    setErrs(x);
    if (Object.keys(x).length) return;
    const body = {
      category: f.category, name: f.name.trim(), basePrice: Number(f.basePrice), pricingType: f.pricingType,
      durationMins: mins, isAvailable: f.isAvailable,
      ...(f.description.trim() && { description: f.description.trim() }), ...(f.image.trim() && { image: f.image.trim() }),
    };
    const ok = await run(() => (service ? api.put(`/admin/services/${service._id}`, body) : api.post('/admin/services', body)));
    if (ok) onDone(service ? 'Service updated' : 'Service created');
  };

  return (
    <Modal title={service ? 'Edit service' : 'Add service'} onClose={onClose} size="max-w-2xl">
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {error && <div className="sm:col-span-2"><Alert>{error}</Alert></div>}
        <Select label="Category" value={f.category} onChange={set('category')} error={errs.category}>
          <option value="">Choose a category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Input label="Name" value={f.name} onChange={set('name')} error={errs.name} />
        <Input label="Price (INR)" type="number" min="0" value={f.basePrice} onChange={set('basePrice')} error={errs.basePrice} />
        <Select label="Pricing" value={f.pricingType} onChange={set('pricingType')}>
          <option value="estimate">Estimate (final amount set after the job)</option>
          <option value="fixed">Fixed price</option>
        </Select>
        <Input label="Duration (minutes)" type="number" value={f.durationMins} onChange={set('durationMins')} error={errs.durationMins} />
        <Input label="Image URL (optional)" type="url" value={f.image} onChange={set('image')} />
        <Textarea className="sm:col-span-2" label="Description" value={f.description} onChange={set('description')} maxLength={2000} />
        <Checkbox className="sm:col-span-2" label="Available for booking" checked={f.isAvailable} onChange={set('isAvailable')} />
        <div className="sm:col-span-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminServices() {
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(q.trim());
  const cats = useFetch('/admin/categories');
  const { data, loading, error, reload } = useFetch('/admin/services', { page, category: category || undefined, q: term || undefined });
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [notice, setNotice] = useState('');
  const action = useAction();

  const done = (msg) => { setForm(null); setNotice(msg); reload(); };
  const toggle = async (s) => {
    if (await action.run(() => api.put(`/admin/services/${s._id}`, { isAvailable: !s.isAvailable }))) {
      setNotice(`${s.name} is now ${s.isAvailable ? 'unavailable' : 'available'}`);
      reload();
    }
  };
  const remove = async () => {
    if (await action.run(() => api.delete(`/admin/services/${del._id}`))) { setDel(null); setNotice('Service deleted'); reload(); }
  };

  const items = data?.items || [];

  // Paging numbers (server-side). Reads whichever field names the API returns.
  const perPage = data?.perPage ?? data?.limit ?? 10;
  const total = data?.total ?? data?.totalItems ?? data?.count ?? items.length;
  const totalPages = Math.max(1, data?.totalPages ?? data?.pages ?? Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * perPage;

  const pageNumbers = [];
  const from = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const to = Math.min(totalPages, from + 4);
  for (let i = from; i <= to; i++) pageNumbers.push(i);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {notice && (
        <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">
          {notice}
        </div>
      )}
      {action.error && !del && <div className="mb-4"><Alert>{action.error}</Alert></div>}
      {cats.data && cats.data.items.length === 0 && (
        <div className="mb-4"><Alert>Create a category first, then add services to it.</Alert></div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow">
        {/* Header */}
        <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-[#d97706] sm:pl-[180px]">
            Services
          </h1>
          <button
            type="button"
            onClick={() => setForm('new')}
            disabled={!cats.data?.items.length}
            className="inline-flex items-center justify-center gap-2 rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-[180px]"
          >
            <span className="text-lg leading-none">+</span> Add New Service
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <Select label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {cats.data?.items.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Input label="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Service name" />
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && items.length === 0 && (
          <EmptyState title="No services found">Add a service or change the filters.</EmptyState>
        )}

        {data && items.length > 0 && (
          <>
            <div className="overflow-x-auto rounded border border-gray-300">
              <table className="w-full min-w-[1000px] border-collapse text-left text-[13px] text-gray-600">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-800">
                    {['S.No', 'Service', 'Category', 'Price', 'Pricing', 'Created Date', 'Modified Date', 'Status', 'Action'].map((h) => (
                      <th key={h} className="border-r border-gray-200 px-3 py-3 font-bold last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((s, i) => (
                    <tr
                      key={s._id}
                      className="border-b border-gray-200 even:bg-white odd:bg-[#f3f7fa] last:border-b-0"
                    >
                      <td className="border-r border-gray-200 px-3 py-3 align-top">{startIdx + i + 1}</td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top max-w-[260px]">
                        <span className="font-semibold text-gray-800">{s.name}</span>
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top">{s.category?.name || '—'}</td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">{inr(s.basePrice)}</td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top">
                        {s.pricingType === 'fixed' ? 'Fixed' : 'Estimate'}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                        {fmtDateTime(s.createdAt)}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                        {fmtDateTime(s.updatedAt)}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top">
                        <span className={s.isAvailable ? 'text-green-700' : 'text-gray-500'}>
                          {s.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggle(s)}
                            disabled={action.busy}
                            title={s.isAvailable ? 'Disable' : 'Enable'}
                            aria-label={s.isAvailable ? 'Disable' : 'Enable'}
                            className={`${actionBtn} bg-cyan-400`}
                          >
                            {s.isAvailable ? <LockIcon /> : <UnlockIcon />}
                          </button>
                          <button
                            type="button"
                            onClick={() => { action.setError(''); setDel(s); }}
                            title="Delete"
                            aria-label="Delete"
                            className={`${actionBtn} bg-red-500`}
                          >
                            <TrashIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(s)}
                            title="Edit"
                            aria-label="Edit"
                            className={`${actionBtn} bg-[#5bc0a5]`}
                          >
                            <PencilIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer: count + pagination */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-teal-600 underline">
                Showing {startIdx + 1} to {startIdx + items.length} of {total} entries
              </p>

              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded bg-gray-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[36px] rounded px-3 py-2 font-medium ${
                      n === currentPage ? 'bg-teal-600 text-white' : 'text-teal-700 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded bg-gray-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {form && (
        <ServiceForm
          service={form === 'new' ? null : form}
          categories={cats.data?.items || []}
          onClose={() => setForm(null)}
          onDone={done}
        />
      )}
      <ConfirmDialog
        open={!!del}
        title={`Delete ${del?.name}?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDel(null)}
        busy={action.busy}
      >
        {action.error ? (
          <Alert>{action.error}</Alert>
        ) : (
          <p className="text-ink-muted">This cannot be undone. A service that has bookings must be disabled instead.</p>
        )}
      </ConfirmDialog>
    </div>
  );
}