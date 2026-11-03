import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
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
const PencilIcon = () => (
  <Icon><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icon>
);
const PowerIcon = () => (
  <Icon><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></Icon>
);

const actionBtn =
  'inline-flex h-8 w-9 items-center justify-center rounded text-white transition-opacity hover:opacity-85 disabled:opacity-50';

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

    // Send the phone when it has a value. When editing and the admin cleared a
    // number that existed before, send '' so it is actually removed.
    const phoneValue = f.phone.trim();
    const phone = phoneValue
      ? { phone: phoneValue }
      : tech?.phone
        ? { phone: '' }
        : {};

    const ok = await run(() => (tech
      ? api.patch(`/admin/technicians/${tech._id}`, { name: f.name.trim(), ...phone, skills, commissionPct: pct })
      : api.post('/admin/technicians', { name: f.name.trim(), email: f.email.trim(), password: f.password, skills, commissionPct: pct, ...(phoneValue && { phone: phoneValue }) })));
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
  const [page, setPage] = useState(1);
  const action = useAction();

  const done = (msg) => { setForm(null); setNotice(msg); reload(); };
  const patch = async (t, body, msg) => {
    if (await action.run(() => api.patch(`/admin/technicians/${t._id}`, body))) { setNotice(msg); reload(); }
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {notice && (
        <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">
          {notice}
        </div>
      )}
      {action.error && <div className="mb-4"><Alert>{action.error}</Alert></div>}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow">
          {/* Header */}
          <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-[#d97706] sm:pl-[200px]">
              Technicians
            </h1>
            <button
              type="button"
              onClick={() => setForm('new')}
              className="inline-flex items-center justify-center gap-2 rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors sm:w-[200px]"
            >
              <span className="text-lg leading-none">+</span> Add New Technician
            </button>
          </div>

          {total === 0 ? (
            <EmptyState title="No technicians yet">Add a technician so you can assign jobs.</EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto rounded border border-gray-300">
                <table className="w-full min-w-[1050px] border-collapse text-left text-[13px] text-gray-600">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-800">
                      {['S.No', 'Technician', 'Phone', 'Skills', 'Commission', 'Created Date', 'Account', 'Availability', 'Action'].map((h) => (
                        <th key={h} className="border-r border-gray-200 px-3 py-3 font-bold last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((t, i) => (
                      <tr
                        key={t._id}
                        className="border-b border-gray-200 even:bg-white odd:bg-[#f3f7fa] last:border-b-0"
                      >
                        <td className="border-r border-gray-200 px-3 py-3 align-top">{startIdx + i + 1}</td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          <span className="font-semibold text-gray-800">{t.name}</span>
                          <span className="block text-gray-500">{t.email}</span>
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                          {t.phone || '—'}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top max-w-[220px]">
                          {t.technician?.skills?.join(', ') || '—'}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          {t.technician?.commissionPct ?? 0}%
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                          {fmtDateTime(t.createdAt)}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          <span className={t.isActive ? 'text-green-700' : 'text-red-600'}>
                            {t.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 align-top">
                          <span className={t.technician?.isAvailable ? 'text-green-700' : 'text-gray-500'}>
                            {t.technician?.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={action.busy}
                              onClick={() =>
                                patch(
                                  t,
                                  { isActive: !t.isActive },
                                  t.isActive ? `${t.name} deactivated` : `${t.name} reactivated`
                                )
                              }
                              title={t.isActive ? 'Deactivate account' : 'Reactivate account'}
                              aria-label={t.isActive ? 'Deactivate account' : 'Reactivate account'}
                              className={`${actionBtn} bg-cyan-400`}
                            >
                              {t.isActive ? <LockIcon /> : <UnlockIcon />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(t)}
                              title="Edit"
                              aria-label="Edit"
                              className={`${actionBtn} bg-[#5bc0a5]`}
                            >
                              <PencilIcon />
                            </button>
                            <button
                              type="button"
                              disabled={action.busy}
                              onClick={() =>
                                patch(
                                  t,
                                  { isAvailable: !t.technician?.isAvailable },
                                  `${t.name} availability updated`
                                )
                              }
                              title={t.technician?.isAvailable ? 'Mark unavailable' : 'Mark available'}
                              aria-label={t.technician?.isAvailable ? 'Mark unavailable' : 'Mark available'}
                              className={`${actionBtn} bg-amber-400`}
                            >
                              <PowerIcon />
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
      )}

      {form && <TechnicianForm tech={form === 'new' ? null : form} onClose={() => setForm(null)} onDone={done} />}
    </div>
  );
}