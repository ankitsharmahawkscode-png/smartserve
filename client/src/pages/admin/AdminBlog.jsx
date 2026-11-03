import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import { Textarea, Checkbox } from '../../components/Fields.jsx';
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

export default function AdminBlog() {
  const { data, loading, error, reload } = useFetch('/admin/blogs');
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);

  // Keywords are always kept as an array inside the form
  const keywords = Array.isArray(form?.seo?.keywords) ? form.seo.keywords : [];

  const addKeyword = (raw) => {
    const incoming = raw.split(',').map((k) => k.trim()).filter(Boolean);
    const fresh = incoming.filter((k) => !keywords.includes(k));
    if (!fresh.length) return;
    setForm({ ...form, seo: { ...form.seo, keywords: [...keywords, ...fresh] } });
  };

  const removeKeyword = (index) => {
    setForm({
      ...form,
      seo: { ...form.seo, keywords: keywords.filter((_, i) => i !== index) },
    });
  };

  // Builds the clean payload the API accepts
  const buildPayload = (src, overrides = {}) => {
    const kws = (Array.isArray(src.seo?.keywords) ? src.seo.keywords : [])
      .flatMap((k) => String(k).split(','))
      .map((k) => k.trim())
      .filter(Boolean);

    const autoSlug = (src.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const payload = {
      title: src.title?.trim(),
      slug: src.slug?.trim() || autoSlug,
      content: src.content,
      isPublished: !!src.isPublished,
      seo: {
        title: src.seo?.title || '',
        description: src.seo?.description || '',
        keywords: kws,
      },
      ...overrides,
    };
    if (src.excerpt?.trim()) payload.excerpt = src.excerpt.trim();
    if (src.coverImage?.trim()) payload.coverImage = src.coverImage.trim();
    return payload;
  };

  const showApiError = (err, fallback) => {
    const resp = err.response?.data;
    const details = resp?.errors
      ?.map(
        (er) =>
          `${er.field || er.path || er.param || ''} ${er.message || er.msg || ''}`.trim() ||
          JSON.stringify(er)
      )
      .join(' | ');
    setNotice(`${resp?.message || fallback}${details ? ': ' + details : ''}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    const payload = buildPayload(form);

    try {
      if (form._id) {
        await api.put(`/admin/blogs/${form._id}`, payload);
        setNotice('Blog updated');
      } else {
        await api.post('/admin/blogs', payload);
        setNotice('Blog created');
      }
      setForm(null);
      reload();
    } catch (err) {
      showApiError(err, 'Error saving blog');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await api.delete(`/admin/blogs/${id}`);
      setNotice('Blog deleted');
      reload();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Error deleting blog');
    }
  };

  const handleTogglePublish = async (post) => {
    setTogglingId(post._id);
    setNotice('');
    try {
      await api.put(
        `/admin/blogs/${post._id}`,
        buildPayload(post, { isPublished: !post.isPublished })
      );
      setNotice(post.isPublished ? 'Post moved to draft' : 'Post published');
      reload();
    } catch (err) {
      showApiError(err, 'Error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  // Safe array extraction
  let rawData = data;
  if (data && !Array.isArray(data) && data.data) {
    rawData = data.data;
  }
  const blogsList = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData?.blogs)
      ? rawData.blogs
      : [];

  // Pagination (client side)
  const total = blogsList.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = blogsList.slice(startIdx, startIdx + PAGE_SIZE);

  const pageNumbers = [];
  const from = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const to = Math.min(totalPages, from + 4);
  for (let i = from; i <= to; i++) pageNumbers.push(i);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {notice && (
        <div className="mb-4 rounded-[10px] bg-brand-tint p-3 text-sm sm:text-base font-semibold text-brand-dark">
          {notice}
        </div>
      )}

      {form ? (
        <>
          <h1 className="mb-5 text-2xl sm:text-3xl font-extrabold">
            {form._id ? 'Edit Post' : 'Add New Post'}
          </h1>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-lg shadow border border-line"
          >
            <Input
              label="Title"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              label="Slug (optional)"
              value={form.slug || ''}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Auto-generated from title"
            />

            {/* Cover Image URL Field */}
            <div>
              <Input
                label="Cover Image URL (optional)"
                value={form.coverImage || ''}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {form.coverImage && (
                <div className="mt-2">
                  <p className="text-xs text-ink-muted mb-1">Preview:</p>
                  <img
                    src={form.coverImage}
                    alt="Cover preview"
                    className="h-32 w-auto object-cover rounded-lg border border-line"
                    onError={(e) => { e.target.style.display = 'none'; }}
                    onLoad={(e) => { e.target.style.display = 'block'; }}
                  />
                </div>
              )}
            </div>

            <Textarea
              label="Content (HTML or plain text)"
              rows={10}
              value={form.content || ''}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <Textarea
              label="Excerpt (short summary)"
              rows={2}
              value={form.excerpt || ''}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              maxLength={300}
            />

            <div className="border-t border-line pt-4 mt-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted mb-3">
                SEO
              </h3>
              <div className="flex flex-col gap-4">
                <Input
                  label="SEO Title"
                  value={form.seo?.title || ''}
                  onChange={(e) =>
                    setForm({ ...form, seo: { ...form.seo, title: e.target.value } })
                  }
                  maxLength={70}
                />
                <Textarea
                  label="Meta Description"
                  rows={2}
                  value={form.seo?.description || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      seo: { ...form.seo, description: e.target.value },
                    })
                  }
                  maxLength={160}
                />

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

            <Checkbox
              label="Publish immediately"
              checked={form.isPublished || false}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow">
          {/* Header */}
          <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-[#d97706] sm:pl-[150px]">
              Posts
            </h1>
            <button
              type="button"
              onClick={() =>
                setForm({ title: '', content: '', isPublished: false, seo: { keywords: [] } })
              }
              className="inline-flex items-center justify-center gap-2 rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors sm:w-[150px]"
            >
              <span className="text-lg leading-none">+</span> Add New Post
            </button>
          </div>

          {total === 0 ? (
            <EmptyState title="No blog posts yet">
              Click "Add New Post" to create your first blog post.
            </EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto rounded border border-gray-300">
                <table className="w-full min-w-[900px] border-collapse text-left text-[13px] text-gray-600">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-800">
                      {['S.No', 'Post Title', 'Created Date', 'Modified Date', 'Status', 'Author', 'Action'].map((h) => (
                        <th key={h} className="border-r border-gray-200 px-3 py-3 font-bold last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((post, i) => (
                      <tr
                        key={post._id}
                        className="border-b border-gray-200 even:bg-white odd:bg-[#f3f7fa] last:border-b-0"
                      >
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          {startIdx + i + 1}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top max-w-[340px]">
                          {post.title}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                          {fmtDateTime(post.createdAt)}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                          {fmtDateTime(post.updatedAt)}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          <span className={post.isPublished ? 'text-green-700' : 'text-gray-500'}>
                            {post.isPublished ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          {post.author?.name || '—'}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(post)}
                              disabled={togglingId === post._id}
                              title={post.isPublished ? 'Move to draft' : 'Publish'}
                              aria-label={post.isPublished ? 'Move to draft' : 'Publish'}
                              className={`${actionBtn} bg-cyan-400`}
                            >
                              {post.isPublished ? <LockIcon /> : <UnlockIcon />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(post._id)}
                              title="Delete"
                              aria-label="Delete"
                              className={`${actionBtn} bg-red-500`}
                            >
                              <TrashIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...post,
                                  seo: {
                                    ...post.seo,
                                    keywords: Array.isArray(post.seo?.keywords)
                                      ? post.seo.keywords
                                      : [],
                                  },
                                })
                              }
                              title="Edit"
                              aria-label="Edit"
                              className={`${actionBtn} bg-[#5bc0a5]`}
                            >
                              <PencilIcon />
                            </button>
                            {post.isPublished ? (
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View"
                                aria-label="View"
                                className={`${actionBtn} bg-amber-400`}
                              >
                                <EyeIcon />
                              </a>
                            ) : (
                              <span
                                title="Publish to view"
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
    </div>
  );
}