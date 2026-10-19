import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import { Textarea, Checkbox } from '../../components/Fields.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';

export default function AdminBlog() {
  const { data, loading, error, reload } = useFetch('/admin/blogs');
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      if (form._id) {
        await api.put(`/admin/blogs/${form._id}`, form);
        setNotice('Blog updated');
      } else {
        await api.post('/admin/blogs', form);
        setNotice('Blog created');
      }
      setForm(null);
      reload();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Error saving blog');
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

  // ✅ SAFE ARRAY CHECK: Agar data.items array nahi hai to crash nahi hoga
let rawData = data;
if (data && !Array.isArray(data) && data.data) {
  rawData = data.data; // Handle { data: { items: [] } }
}
const blogsList = Array.isArray(rawData?.items) 
  ? rawData.items 
  : (Array.isArray(rawData?.blogs) ? rawData.blogs : []);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Blog Posts</h1>
        <Button
          onClick={() =>
            setForm({ title: '', content: '', isPublished: false, seo: {} })
          }
          className="w-full sm:w-auto min-h-[44px]"
        >
          Add Post
        </Button>
      </div>

      {notice && (
        <div className="mb-4 rounded-[10px] bg-brand-tint p-3 text-sm sm:text-base font-semibold text-brand-dark">
          {notice}
        </div>
      )}

      {form ? (
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
              <Input
                label="Keywords (comma separated)"
                value={form.seo?.keywords || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    seo: { ...form.seo, keywords: e.target.value },
                  })
                }
                maxLength={300}
              />
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
      ) : blogsList.length === 0 ? (
        <EmptyState title="No blog posts yet">
          Click "Add Post" to create your first blog post.
        </EmptyState>
      ) : (
        <div className="bg-white rounded-card border border-line shadow">
          {blogsList.map((post) => (
            <div
              key={post._id}
              className="p-4 border-b border-line last:border-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
            >
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg break-words">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      post.isPublished
                        ? 'bg-green-50 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {post.slug && (
                    <span className="ml-2 text-ink-muted">/{post.slug}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => setForm(post)}
                  className="min-h-[40px]"
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(post._id)}
                  className="min-h-[40px]"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}