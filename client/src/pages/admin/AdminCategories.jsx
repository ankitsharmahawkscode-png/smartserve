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

function CategoryForm({ category, onClose, onDone }) {
  const [f, setF] = useState({
  name: category?.name || '',
  description: category?.description || '',
  isActive: category?.isActive ?? true,
  seoTitle: category?.seo?.title || '',
  seoDescription: category?.seo?.description || '',
  seoKeywords: category?.seo?.keywords || '',
  faqs: category?.faqs?.length
    ? category.faqs.map((x) => ({ question: x.question || '', answer: x.answer || '' }))
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
  seo: {
    title: f.seoTitle.trim(),
    description: f.seoDescription.trim(),
    keywords: f.seoKeywords.trim(),
  },
  // Filter out empty FAQ rows before sending
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
                    } else if (e.key === 'Backspace' && !e.target.value && keywords.length) {
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Categories</h1>
        <Button onClick={() => setForm('new')} className="w-full sm:w-auto min-h-[44px]">
          Add category
        </Button>
      </div>

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

      {data && data.items.length === 0 && (
        <EmptyState title="No categories yet">
          Add your first category, such as AC Repair.
        </EmptyState>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[520px] text-left">
            <thead className="text-xs sm:text-sm text-ink-muted">
              <tr>
                <th scope="col" className="p-3">Name</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c._id} className="border-t border-line">
                  <td className="p-3 font-semibold">
                    {c.name}
                    {c.description && (
                      <>
                        <br />
                        <span className="text-sm font-normal text-ink-muted">
                          {c.description}
                        </span>
                      </>
                    )}

                    {/* SEO keyword chips */}
                    {c.seo?.keywords && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.seo.keywords
                          .split(',')
                          .map((k) => k.trim())
                          .filter(Boolean)
                          .map((k, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-amber-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5"
                            >
                              {k}
                            </span>
                          ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-sm sm:text-base">
                    {c.isActive ? 'Active' : 'Hidden'}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setForm(c)}
                        className="min-h-[36px]"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          action.setError('');
                          setDel(c);
                        }}
                        className="min-h-[36px]"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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