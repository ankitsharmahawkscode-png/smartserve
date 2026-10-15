import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useAction from '../hooks/useAction.js';
import { Button, Card } from './ui.jsx';
import Input, { Alert } from './Input.jsx';

export default function ChangePassword() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [errs, setErrs] = useState({});
  const { busy, error, run } = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (!f.current) x.current = 'Enter your current password';
    if (!(f.next.length >= 8 && /[A-Za-z]/.test(f.next) && /\d/.test(f.next))) x.next = 'At least 8 characters with a letter and a number';
    else if (f.next === f.current) x.next = 'New password must be different';
    if (f.confirm !== f.next) x.confirm = 'Passwords do not match';
    setErrs(x);
    if (Object.keys(x).length) return;
    if (await run(() => api.put('/me/password', { currentPassword: f.current, newPassword: f.next }))) {
      await logout(); // the server has ended every session, including this one
      navigate('/login', { replace: true, state: { notice: 'Password changed. Please log in again.' } });
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-extrabold mb-1">Change password</h2>
      <p className="text-sm text-ink-muted mb-4">You will be signed out on every device and need to log in again.</p>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {error && <div className="sm:col-span-2"><Alert>{error}</Alert></div>}
        <Input className="sm:col-span-2" label="Current password" type="password" autoComplete="current-password" value={f.current} onChange={set('current')} error={errs.current} />
        <Input label="New password" type="password" autoComplete="new-password" value={f.next} onChange={set('next')} error={errs.next} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} error={errs.confirm} />
        <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</Button></div>
      </form>
    </Card>
  );
}