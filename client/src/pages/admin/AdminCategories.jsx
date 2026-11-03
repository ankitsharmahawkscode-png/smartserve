import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Checkbox, Textarea } from '../../components/Fields.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';

const PAGE_SIZE = 10;

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
const EyeIcon = () => (
  <Icon><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></Icon>
);

const actionBtn =
  'inline-flex h-8 w-9 items-center justify-center rounded text-white transition-opacity hover:opacity-85 disabled:opacity-50';

function CategoryForm({ category, onClose, onDone }) {
  const [f, setF] = useState({
    name: category?.name || '',
    description: category?.description || '',
    longDescription: category?.longDescription || '',
    isActive: category?.isActive ?? true,
    seoTitle: category?.seo?.title || '',
    seoDescription: category?.seo?.description || '',
    seoKeywords: category?.seo?.keywords || '',
    faqs: category?.faqs?.length
      ? category.faqs.map((x) => ({
          question: x.question || '',
          answer: x.answer || '',
        }))
      : [{ question: '', answer: '' }],
  });
  const [err, setErr] = useState('');
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Enter a category name');
    setErr('');

    const body = {
      name: f.name.trim(),
      isActive: f.isActive,
      ...(f.description.trim() && { description: f.description.trim() }),
      ...(f.longDescription.trim() && { longDescription: f.longDescription.trim() }),
      seo: {
        title: f.seoTitle.trim(),
        description: f.seoDescription.trim(),
        keywords: f.seoKeywords.trim(),
      },
      faqs: f.faqs
        .filter((x) => x.question.trim() && x.answer.trim())
        .map((x) => ({
          question: x.question.trim(),
          answer: x.answer.trim(),
        })),
    };

    const ok = await run(() =>
      category
        ? api.put(`/admin/categories/${category._id}`, body)
        : api.post('/admin/categories', body)
    );
    if (ok) onDone(category ? 'Category updated' : 'Category created');
  };

  // --- keyword chip helpers ---
  const keywords = f.seoKeywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const addKeyword = (raw) => {
    const v = raw.trim();
    if (!v) return;
    if (keywords.includes(v)) return;
    setF({ ...f, seoKeywords: [...keywords, v].join(', ') });
  };

  const removeKeyword = (index) => {
    const next = keywords.filter((_, i) => i !== index);
    setF({ ...f, seoKeywords: next.join(', ') });
  };

  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <Input
          label="Name"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          error={err}
        />

        <Textarea
          label="Description (optional)"
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          maxLength={300}
        />

        <Checkbox
          label="Active (visible to customers)"
          checked={f.isActive}
          onChange={(e) => setF({ ...f, isActive: e.target.checked })}
        />

        <div>
          <Textarea
            label="Long description (for SEO)"
            value={f.longDescription}
            onChange={(e) => setF({ ...f, longDescription: e.target.value })}
            maxLength={3000}
            rows={8}
            placeholder={`AC repair is a focused service... Explain what this category covers, why customers need it, what's included, how long it takes, and why choose SmartServe. 2-3 paragraphs.`}
          />
          <p className="text-xs text-ink-muted mt-1">
            {f.longDescription.length}/3000 · Shown as "What is {f.name || 'Category'}?" on the category page
          </p>
        </div>

        {/* SEO section */}
        <div className="border-t border-line pt-4 mt-2">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted mb-3">
            SEO
          </h3>

          <div className="flex flex-col gap-4">
            {/* SEO title */}
            <div>
              <Input
                label="SEO title"
                value={f.seoTitle}
                onChange={(e) => setF({ ...f, seoTitle: e.target.value })}
                maxLength={70}
                placeholder={`${f.name || 'Category'} services — SmartServe`}
              />
              <p className="text-xs text-ink-muted mt-1">
                {f.seoTitle.length}/70 · Shown in search results and browser tab
              </p>
            </div>

            {/* Meta description */}
            <div>
              <Textarea
                label="Meta description"
                value={f.seoDescription}
                onChange={(e) => setF({ ...f, seoDescription: e.target.value })}
                maxLength={160}
                rows={3}
                placeholder="Book AC repair services online. Choose a slot, track your technician, pay in cash or online."
              />
              <p className="text-xs text-ink-muted mt-1">
                {f.seoDescription.length}/160 · Shown under the title in search results
              </p>
            </div>

            {/* Keywords — chip input */}
            <div>
              <label className="block text-sm font-semibold text-ink-muted mb-1">
                Keywords
              </label>

              <div className="flex flex-wrap gap-2 p-2 min-h-[44px] rounded-lg border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                {keywords.map((k, i) => (
                  <span
                    key={`${k}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white text-xs sm:text-sm font-semibold px-3 py-1"
                  >
                    {k}
                    <button
                      type="button"
                      onClick={() => removeKeyword(i)}
                      className="hover:text-red-200 leading-none text-base"
                      aria-label={`Remove ${k}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add keyword + Enter"
                  className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword(e.target.value);
                      e.target.value = '';
                    } else if (
                      e.key === 'Backspace' &&
                      !e.target.value &&
                      keywords.length
                    ) {
                      removeKeyword(keywords.length - 1);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      addKeyword(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              <p className="text-xs text-ink-muted mt-1">
                {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} · Press Enter to add, × to remove
              </p>
            </div>
          </div>
        </div>

        {/* FAQs section */}
        <div className="border-t border-line pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
              FAQs
            </h3>
            <button
              type="button"
              onClick={() =>
                setF({ ...f, faqs: [...f.faqs, { question: '', answer: '' }] })
              }
              className="text-xs sm:text-sm font-semibold text-brand underline hover:text-brand-dark"
            >
              + Add FAQ
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {f.faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-line rounded-lg p-3 sm:p-4 bg-gray-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase text-ink-muted">
                    FAQ #{i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setF({ ...f, faqs: f.faqs.filter((_, idx) => idx !== i) })
                    }
                    className="text-xs font-semibold text-red-700 hover:text-red-900"
                  >
                    Remove
                  </button>
                </div>

                <Input
                  label="Question"
                  value={faq.question}
                  onChange={(e) => {
                    const next = [...f.faqs];
                    next[i] = { ...next[i], question: e.target.value };
                    setF({ ...f, faqs: next });
                  }}
                  maxLength={200}
                  placeholder="How long does AC repair take?"
                />

                <div className="mt-3">
                  <Textarea
                    label="Answer"
                    value={faq.answer}
                    onChange={(e) => {
                      const next = [...f.faqs];
                      next[i] = { ...next[i], answer: e.target.value };
                      setF({ ...f, faqs: next });
                    }}
                    maxLength={1000}
                    rows={3}
                    placeholder="Most AC repairs take 1-2 hours. Complex issues may need a follow-up visit."
                  />
                </div>
              </div>
            ))}

            {f.faqs.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-3">
                No FAQs yet. Click "+ Add FAQ" to start.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const { data, loading, error, reload } = useFetch('/admin/categories');
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const action = useAction();

  const done = (msg) => {
    setForm(null);
    setNotice(msg);
    reload();
  };

  const remove = async () => {
    if (await action.run(() => api.delete(`/admin/categories/${del._id}`))) {
      setDel(null);
      setNotice('Category deleted');
      reload();
    }
  };

  // Lock / unlock = show or hide the category for customers
  const toggleActive = async (c) => {
    setTogglingId(c._id);
    setNotice('');
    try {
      await api.put(`/admin/categories/${c._id}`, {
        name: c.name,
        isActive: !c.isActive,
      });
      setNotice(c.isActive ? 'Category hidden' : 'Category is now active');
      reload();
    } catch (err) {
      const resp = err.response?.data;
      const details = resp?.errors
        ?.map((er) => `${er.field || ''} ${er.message || ''}`.trim())
        .join(' | ');
      setNotice(`${resp?.message || 'Error updating category'}${details ? ': ' + details : ''}`);
    } finally {
      setTogglingId(null);
    }
  };

  const items = data?.items || [];

  // Pagination (client side)
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = items.slice(startIdx, startIdx + PAGE_SIZE);

  const pageNumbers = [];
  const from = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const to = Math.min(totalPages, from + 4);
  for (let i = from; i <= to; i++) pageNumbers.push(i);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-[10px] bg-brand-tint p-3 text-sm sm:text-base font-semibold text-brand-dark"
        >
          {notice}
        </div>
      )}

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow">
          {/* Header */}
          <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-[#d97706] sm:pl-[190px]">
              Categories
            </h1>
            <button
              type="button"
              onClick={() => setForm('new')}
              className="inline-flex items-center justify-center gap-2 rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors sm:w-[190px]"
            >
              <span className="text-lg leading-none">+</span> Add New Category
            </button>
          </div>

          {total === 0 ? (
            <EmptyState title="No categories yet">
              Add your first category, such as AC Repair.
            </EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto rounded border border-gray-300">
                <table className="w-full min-w-[860px] border-collapse text-left text-[13px] text-gray-600">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-800">
                      {['S.No', 'Category', 'Created Date', 'Modified Date', 'Status', 'Action'].map((h) => (
                        <th key={h} className="border-r border-gray-200 px-3 py-3 font-bold last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((c, i) => (
                      <tr
                        key={c._id}
                        className="border-b border-gray-200 even:bg-white odd:bg-[#f3f7fa] last:border-b-0"
                      >
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          {startIdx + i + 1}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top max-w-[340px]">
                          <span className="font-semibold text-gray-800">{c.name}</span>
                          {c.description && (
                            <span className="mt-0.5 block text-gray-500 line-clamp-2">
                              {c.description}
                            </span>
                          )}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                          {fmtDateTime(c.createdAt)}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                          {fmtDateTime(c.updatedAt)}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          <span className={c.isActive ? 'text-green-700' : 'text-gray-500'}>
                            {c.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleActive(c)}
                              disabled={togglingId === c._id}
                              title={c.isActive ? 'Hide from customers' : 'Make active'}
                              aria-label={c.isActive ? 'Hide from customers' : 'Make active'}
                              className={`${actionBtn} bg-cyan-400`}
                            >
                              {c.isActive ? <LockIcon /> : <UnlockIcon />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                action.setError('');
                                setDel(c);
                              }}
                              title="Delete"
                              aria-label="Delete"
                              className={`${actionBtn} bg-red-500`}
                            >
                              <TrashIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(c)}
                              title="Edit"
                              aria-label="Edit"
                              className={`${actionBtn} bg-[#5bc0a5]`}
                            >
                              <PencilIcon />
                            </button>
                            {c.isActive && c.slug ? (
                              <a
                                href={`/category/${encodeURIComponent(c.slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open ${c.name} page`}
                                aria-label="View"
                                className={`${actionBtn} bg-amber-400`}
                              >
                                <EyeIcon />
                              </a>
                            ) : (
                              <span
                                title="Make active to view"
                                className={`${actionBtn} cursor-not-allowed bg-amber-400 opacity-40`}
                              >
                                <EyeIcon />
                              </span>
                            )}
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
                  Showing {startIdx + 1} to {Math.min(startIdx + PAGE_SIZE, total)} of {total} entries
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
                        n === currentPage
                          ? 'bg-teal-600 text-white'
                          : 'text-teal-700 hover:bg-gray-100'
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
      )}

      {form && (
        <CategoryForm
          category={form === 'new' ? null : form}
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
          <p className="text-ink-muted text-sm sm:text-base">
            This cannot be undone. A category with services must be hidden instead.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}