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
  const [f, setF] = useState({ name: category?.name || '', description: category?.description || '', isActive: category?.isActive ?? true });
  const [err, setErr] = useState('');
  const { busy, error, run } = useAction();
  const submit = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Enter a category name');
    setErr('');
    const body = { name: f.name.trim(), isActive: f.isActive, ...(f.description.trim() && { description: f.description.trim() }) };
    const ok = await run(() => (category ? api.put(`/admin/categories/${category._id}`, body) : api.post('/admin/categories', body)));
    if (ok) onDone(category ? 'Category updated' : 'Category created');
  };
  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={err} />
        <Textarea label="Description (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={300} />
        <Checkbox label="Active (visible to customers)" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const { data, loading, error, reload } = useFetch('/admin/categories');
  const [form, setForm] = useState(null); // null | 'new' | category
  const [del, setDel] = useState(null);
  const [notice, setNotice] = useState('');
  const action = useAction();

  const done = (msg) => { setForm(null); setNotice(msg); reload(); };
  const remove = async () => {
    if (await action.run(() => api.delete(`/admin/categories/${del._id}`))) { setDel(null); setNotice('Category deleted'); reload(); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-extrabold">Categories</h1>
        <Button onClick={() => setForm('new')}>Add category</Button>
      </div>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No categories yet">Add your first category, such as AC Repair.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[520px] text-left">
            <thead className="text-sm text-ink-muted"><tr><th scope="col" className="p-3">Name</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Actions</th></tr></thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c._id} className="border-t border-line">
                  <td className="p-3 font-semibold">{c.name}<br /><span className="text-sm font-normal text-ink-muted">{c.description}</span></td>
                  <td className="p-3">{c.isActive ? 'Active' : 'Hidden'}</td>
                  <td className="p-3"><div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setForm(c)}>Edit</Button>
                    <Button variant="secondary" onClick={() => { action.setError(''); setDel(c); }}>Delete</Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && <CategoryForm category={form === 'new' ? null : form} onClose={() => setForm(null)} onDone={done} />}
      <ConfirmDialog open={!!del} title={`Delete ${del?.name}?`} confirmLabel="Delete" onConfirm={remove} onCancel={() => setDel(null)} busy={action.busy}>
        {action.error ? <Alert>{action.error}</Alert> : <p className="text-ink-muted">This cannot be undone. A category with services must be hidden instead.</p>}
      </ConfirmDialog>
    </div>
  );
}