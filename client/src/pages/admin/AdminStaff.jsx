import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import {
  PageCard, DataTable, TableFooter, fmtDateTime,
  LockIcon, UnlockIcon, actionBtn, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

const PAGE_SIZE = 10;
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;
const passwordOk = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

const PRESETS = [
  { label: 'Content editor', keys: ['blogs', 'categories'] },
  { label: 'Support', keys: ['bookings', 'customers', 'messages', 'reviews'] },
  { label: 'Accounts', keys: ['payments', 'coupons'] },
  { label: 'Operations', keys: ['bookings', 'services', 'categories', 'technicians', 'applications'] },
];

const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {children}
  </svg>
);
const PencilIcon = () => (
  <Svg><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>
);
const KeyIcon = () => (
  <Svg><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 21 2" /><path d="M17 6l3 3" /><path d="M14 9l2 2" /></Svg>
);

function StaffForm({ staff, options, onClose, onDone }) {
  const editing = !!staff;
  const [f, setF] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    password: '',
    permissions: staff?.permissions || [],
  });
  const [errs, setErrs] = useState({});
  const { busy, error, run } = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const allKeys = options.map((o) => o.key);
  const has = (k) => f.permissions.includes(k);
  const toggle = (k) =>
    setF({ ...f, permissions: has(k) ? f.permissions.filter((x) => x !== k) : [...f.permissions, k] });

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = 'Enter a name';
    if (!editing && !/^\S+@\S+\.\S+$/.test(f.email.trim())) x.email = 'Enter a valid email';
    if (!editing && !passwordOk(f.password)) x.password = 'At least 8 characters with a letter and a number';
    if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) x.phone = 'Enter a valid phone number';
    setErrs(x);
    if (Object.keys(x).length) return;

    const phone = f.phone.trim();
    const ok = await run(() =>
      editing
        ? api.patch(`/admin/staff/${staff._id}`, { name: f.name.trim(), phone, permissions: f.permissions })
        : api.post('/admin/staff', {
            name: f.name.trim(),
            email: f.email.trim(),
            password: f.password,
            permissions: f.permissions,
            ...(phone && { phone }),
          })
    );
    if (ok) onDone(editing ? 'Staff member updated' : 'Staff member created');
  };

  return (
    <Modal title={editing ? 'Edit staff member' : 'Add staff member'} onClose={onClose} size="max-w-2xl">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={f.name} onChange={set('name')} error={errs.name} />
          {editing ? (
            <div>
              <span className="mb-1 block text-sm font-semibold text-ink-muted">Email</span>
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">{staff.email}</p>
            </div>
          ) : (
            <Input label="Email" type="email" value={f.email} onChange={set('email')} error={errs.email} />
          )}
          <Input label="Phone (optional)" type="tel" value={f.phone} onChange={set('phone')} error={errs.phone} />
          {!editing && (
            <Input
              label="Temporary password"
              type="password"
              autoComplete="new-password"
              value={f.password}
              onChange={set('password')}
              error={errs.password}
            />
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink-muted">Pages this person can open</span>
            <div className="flex gap-3 text-xs font-bold">
              <button type="button" onClick={() => setF({ ...f, permissions: allKeys })} className="text-[#d97706] hover:underline">
                Select all
              </button>
              <button type="button" onClick={() => setF({ ...f, permissions: [] })} className="text-gray-500 hover:underline">
                Clear
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="self-center text-xs text-gray-500">Quick set:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setF({ ...f, permissions: p.keys.filter((k) => allKeys.includes(k)) })}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((o) => (
              <label
                key={o.key}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                  has(o.key) ? 'border-[#d97706] bg-[#fff8eb]' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={has(o.key)}
                  onChange={() => toggle(o.key)}
                  className="mt-0.5 h-4 w-4 accent-[#d97706]"
                />
                <span>
                  <span className="block font-semibold text-gray-800">{o.label}</span>
                  <span className="block text-xs text-gray-500">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Everyone can open Overview and their own profile. Services also loads Categories, and assigning a booking
            loads Technicians, so tick those too if the person needs them.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordForm({ staff, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const { busy, error, run } = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (!passwordOk(password)) return setErr('At least 8 characters with a letter and a number');
    setErr('');
    if (await run(() => api.patch(`/admin/staff/${staff._id}/password`, { password }))) {
      onDone(`Password changed for ${staff.name}`);
    }
  };

  return (
    <Modal title={`Reset password for ${staff.name}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={err}
        />
        <p className="text-xs text-gray-500">They are signed out and must log in with this password.</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminStaff() {
  const { data, loading, error, reload } = useFetch('/admin/staff');
  const [form, setForm] = useState(null); // 'new' | a staff object
  const [pw, setPw] = useState(null);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const action = useAction();

  const done = (msg) => {
    setForm(null);
    setPw(null);
    setNotice(msg);
    reload();
  };

  const toggle = async (s) => {
    if (await action.run(() => api.patch(`/admin/staff/${s._id}`, { isActive: !s.isActive }))) {
      setNotice(s.isActive ? `${s.name} deactivated` : `${s.name} reactivated`);
      reload();
    }
  };

  const items = data?.items || [];
  const options = data?.permissionOptions || [];
  const labelOf = Object.fromEntries(options.map((o) => [o.key, o.label]));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * PAGE_SIZE;
  const pageItems = items.slice(startIdx, startIdx + PAGE_SIZE);

  const access = (s) => {
    if (s.isSuperAdmin) return <span className="font-semibold text-gray-800">All pages</span>;
    if (!s.permissions.length) return <span className="text-gray-400">Overview only</span>;
    const shown = s.permissions.slice(0, 4);
    return (
      <div className="flex flex-wrap gap-1">
        {shown.map((k) => (
          <span key={k} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{labelOf[k] || k}</span>
        ))}
        {s.permissions.length > shown.length && (
          <span className="rounded-full bg-[#fff8eb] px-2 py-0.5 text-xs font-semibold text-[#b45309]">
            +{s.permissions.length - shown.length} more
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {notice && (
        <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">
          {notice}
        </div>
      )}
      {action.error && <div className="mb-4"><Alert>{action.error}</Alert></div>}

      <PageCard
        title="Staff"
        subtitle="Create sub-admins and choose which pages each can open."
        action={
          <button
            type="button"
            onClick={() => setForm('new')}
            disabled={!data}
            className="inline-flex items-center justify-center gap-2 rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
          >
            <span className="text-lg leading-none">+</span> Add New Staff
          </button>
        }
      >
        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && total === 0 && <EmptyState title="No staff yet">Add a staff member to share the work.</EmptyState>}

        {data && total > 0 && (
          <>
            <DataTable
              minWidth={1150}
              columns={['S.No', 'Staff', 'Phone', 'Role', 'Access', 'Last login', 'Created Date', 'Status', 'Action']}
            >
              {pageItems.map((s, i) => (
                <tr key={s._id} className={rowCls}>
                  <td className={td}>{startIdx + i + 1}</td>
                  <td className={td}>
                    <span className="font-semibold text-gray-800">{s.name}</span>
                    <span className="block text-gray-500">{s.email}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{s.phone || '—'}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {s.isSuperAdmin ? (
                      <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-xs font-bold text-[#b45309]">Super admin</span>
                    ) : (
                      'Sub-admin'
                    )}
                  </td>
                  <td className={`${td} max-w-[320px]`}>{access(s)}</td>
                  <td className={`${td} whitespace-nowrap`}>{s.lastLoginAt ? fmtDateTime(s.lastLoginAt) : 'Never'}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(s.createdAt)}</td>
                  <td className={td}>
                    <span className={s.isActive ? 'text-green-700' : 'text-red-600'}>
                      {s.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className={tdLast}>
                    {s.isSuperAdmin ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={action.busy}
                          onClick={() => toggle(s)}
                          title={s.isActive ? 'Deactivate account' : 'Reactivate account'}
                          aria-label={s.isActive ? 'Deactivate account' : 'Reactivate account'}
                          className={`${actionBtn} bg-cyan-400`}
                        >
                          {s.isActive ? <LockIcon /> : <UnlockIcon />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(s)}
                          title="Edit access"
                          aria-label="Edit access"
                          className={`${actionBtn} bg-[#5bc0a5]`}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPw(s)}
                          title="Reset password"
                          aria-label="Reset password"
                          className={`${actionBtn} bg-amber-400`}
                        >
                          <KeyIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
            <TableFooter
              page={current}
              onPage={setPage}
              total={total}
              perPage={PAGE_SIZE}
              totalPages={totalPages}
              shown={pageItems.length}
            />
          </>
        )}
      </PageCard>

      {form && (
        <StaffForm
          staff={form === 'new' ? null : form}
          options={options}
          onClose={() => setForm(null)}
          onDone={done}
        />
      )}
      {pw && <PasswordForm staff={pw} onClose={() => setPw(null)} onDone={done} />}
    </div>
  );
}