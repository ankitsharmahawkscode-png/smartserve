import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';

function TechnicianForm({ tech, onClose, onDone }) {
  const [f, setF] = useState({
    name: tech?.name || '', email: tech?.email || '', phone: tech?.phone || '', password: '',
    skills: (tech?.technician?.skills || []).join(', '), commissionPct: tech?.technician?.commissionPct ?? 0,
  });
  const [errs, setErrs] = useState({});
  const { busy, error, run } = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = 'Enter a name';
    if (!tech && !/^\S+@\S+\.\S+$/.test(f.email.trim())) x.email = 'Enter a valid email';
    if (!tech && !(f.password.length >= 8 && /[A-Za-z]/.test(f.password) && /\d/.test(f.password))) x.password = 'At least 8 characters with a letter and a number';
    const pct = Number(f.commissionPct);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) x.commissionPct = 'Between 0 and 100';
    if (f.phone.trim() && !/^\+?[0-9\s-]{10,15}$/.test(f.phone.trim())) x.phone = 'Enter a valid phone number';
    setErrs(x);
    if (Object.keys(x).length) return;

    const skills = f.skills.split(',').map((s) => s.trim()).filter(Boolean);
    const phone = f.phone.trim() && { phone: f.phone.trim() };
    const ok = await run(() => (tech
      ? api.patch(`/admin/technicians/${tech._id}`, { name: f.name.trim(), ...phone, skills, commissionPct: pct })
      : api.post('/admin/technicians', { name: f.name.trim(), email: f.email.trim(), password: f.password, skills, commissionPct: pct, ...phone })));
    if (ok) onDone(tech ? 'Technician updated' : 'Technician created');
  };

  return (
    <Modal title={tech ? 'Edit technician' : 'Add technician'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <Input label="Full name" value={f.name} onChange={set('name')} error={errs.name} />
        {!tech && <Input label="Email" type="email" value={f.email} onChange={set('email')} error={errs.email} />}
        <Input label="Phone (optional)" type="tel" value={f.phone} onChange={set('phone')} error={errs.phone} />
        {!tech && <Input label="Temporary password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={errs.password} />}
        <Input label="Skills (comma separated)" value={f.skills} onChange={set('skills')} />
        <Input label="Commission (% of job amount)" type="number" min="0" max="100" value={f.commissionPct} onChange={set('commissionPct')} error={errs.commissionPct} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminTechnicians() {
  const { data, loading, error, reload } = useFetch('/admin/technicians');
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const action = useAction();

  const done = (msg) => { setForm(null); setNotice(msg); reload(); };
  const patch = async (t, body, msg) => {
    if (await action.run(() => api.patch(`/admin/technicians/${t._id}`, body))) { setNotice(msg); reload(); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-extrabold">Technicians</h1>
        <Button onClick={() => setForm('new')}>Add technician</Button>
      </div>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}
      {action.error && <div className="mb-4"><Alert>{action.error}</Alert></div>}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No technicians yet">Add a technician so you can assign jobs.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[820px] text-left">
            <thead className="text-sm text-ink-muted"><tr>
              {['Technician', 'Skills', 'Commission', 'Account', 'Availability', 'Actions'].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t._id} className="border-t border-line">
                  <td className="p-3 font-semibold">{t.name}<br /><span className="text-sm font-normal text-ink-muted">{t.email}</span></td>
                  <td className="p-3">{t.technician?.skills?.join(', ') || '-'}</td>
                  <td className="p-3">{t.technician?.commissionPct ?? 0}%</td>
                  <td className="p-3">{t.isActive ? 'Active' : 'Deactivated'}</td>
                  <td className="p-3">{t.technician?.isAvailable ? 'Available' : 'Unavailable'}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setForm(t)}>Edit</Button>
                    <Button variant="secondary" disabled={action.busy} onClick={() => patch(t, { isAvailable: !t.technician?.isAvailable }, `${t.name} availability updated`)}>
                      {t.technician?.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    </Button>
                    <Button variant="secondary" disabled={action.busy} onClick={() => patch(t, { isActive: !t.isActive }, t.isActive ? `${t.name} deactivated` : `${t.name} reactivated`)}>
                      {t.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && <TechnicianForm tech={form === 'new' ? null : form} onClose={() => setForm(null)} onDone={done} />}
    </div>
  );
}