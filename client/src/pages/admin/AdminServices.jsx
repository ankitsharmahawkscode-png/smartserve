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
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr } from '../../utils/format.js';

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
    if (await action.run(() => api.put(`/admin/services/${s._id}`, { isAvailable: !s.isAvailable }))) { setNotice(`${s.name} is now ${s.isAvailable ? 'unavailable' : 'available'}`); reload(); }
  };
  const remove = async () => {
    if (await action.run(() => api.delete(`/admin/services/${del._id}`))) { setDel(null); setNotice('Service deleted'); reload(); }
  };

  // ✅ S.No offset — continues across pages
  const perPage = data?.perPage ?? data?.limit ?? 10;
  const offset = (page - 1) * perPage;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-extrabold">Services</h1>
        <Button onClick={() => setForm('new')} disabled={!cats.data?.items.length}>Add service</Button>
      </div>
      {cats.data && cats.data.items.length === 0 && <div className="mb-4"><Alert>Create a category first, then add services to it.</Alert></div>}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Select label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {cats.data?.items.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Input label="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Service name" />
      </div>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}
      {action.error && !del && <div className="mb-4"><Alert>{action.error}</Alert></div>}

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No services found">Add a service or change the filters.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[820px] text-left">
            <thead className="text-sm text-ink-muted"><tr>
              {['S.No', 'Service', 'Category', 'Price', 'Pricing', 'Availability', 'Actions'].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.items.map((s, index) => (
                <tr key={s._id} className="border-t border-line">
                  <td className="p-3 font-semibold text-ink-muted">{offset + index + 1}</td>
                  <td className="p-3 font-semibold">{s.name}</td>
                  <td className="p-3">{s.category?.name}</td>
                  <td className="p-3">{inr(s.basePrice)}</td>
                  <td className="p-3">{s.pricingType === 'fixed' ? 'Fixed' : 'Estimate'}</td>
                  <td className="p-3">{s.isAvailable ? 'Available' : 'Unavailable'}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => toggle(s)} disabled={action.busy}>{s.isAvailable ? 'Disable' : 'Enable'}</Button>
                    <Button variant="secondary" onClick={() => setForm(s)}>Edit</Button>
                    <Button variant="secondary" onClick={() => { action.setError(''); setDel(s); }}>Delete</Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination data={data} onPage={setPage} />

      {form && <ServiceForm service={form === 'new' ? null : form} categories={cats.data?.items || []} onClose={() => setForm(null)} onDone={done} />}
      <ConfirmDialog open={!!del} title={`Delete ${del?.name}?`} confirmLabel="Delete" onConfirm={remove} onCancel={() => setDel(null)} busy={action.busy}>
        {action.error ? <Alert>{action.error}</Alert> : <p className="text-ink-muted">This cannot be undone. A service that has bookings must be disabled instead.</p>}
      </ConfirmDialog>
    </div>
  );
}