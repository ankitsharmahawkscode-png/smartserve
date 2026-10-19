import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Textarea, Checkbox } from '../../components/Fields.jsx';

export default function AdminBlog() {
  const { data, loading, error, reload } = useFetch('/admin/blogs');
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading blogs</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Button onClick={() => setForm({ title: '', content: '', isPublished: false })}>Add Post</Button>
      </div>

      {notice && <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded">{notice}</div>}

      {form ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
          <Input label="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
          <Input label="Slug (optional)" value={form.slug || ''} onChange={(e) => setForm({...form, slug: e.target.value})} />
          <Textarea label="Content (HTML)" rows={10} value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} required />
          <Textarea label="Excerpt" rows={2} value={form.excerpt || ''} onChange={(e) => setForm({...form, excerpt: e.target.value})} />
          
          <h3 className="font-bold mt-4">SEO</h3>
          <Input label="SEO Title" value={form.seo?.title || ''} onChange={(e) => setForm({...form, seo: {...form.seo, title: e.target.value}})} />
          <Textarea label="Meta Description" rows={2} value={form.seo?.description || ''} onChange={(e) => setForm({...form, seo: {...form.seo, description: e.target.value}})} />
          
          <Checkbox label="Publish immediately" checked={form.isPublished} onChange={(e) => setForm({...form, isPublished: e.target.checked})} />
          
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {data?.items.map(post => (
            <div key={post._id} className="p-4 border-b flex justify-between">
              <div>
                <h3 className="font-bold">{post.title}</h3>
                <p className="text-sm text-gray-500">{post.isPublished ? 'Published' : 'Draft'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setForm(post)}>Edit</Button>
                <Button variant="secondary" onClick={() => api.delete(`/admin/blogs/${post._id}`).then(reload)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}