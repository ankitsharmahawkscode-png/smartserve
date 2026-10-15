import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import useSeo from '../../hooks/useSeo.js';
export default function ResetPassword() {
  const [params] = useSearchParams();
  const [token] = useState(() => params.get('token') || ''); // read once, then removed from the address bar
  const navigate = useNavigate();
  const [f, setF] = useState({ next: '', confirm: '' });
  const [errs, setErrs] = useState({});
  const { busy, error, run } = useAction();
useSeo({ title: 'Choose a new password', noindex: true });
  useEffect(() => { window.history.replaceState(null, '', window.location.pathname); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (!(f.next.length >= 8 && /[A-Za-z]/.test(f.next) && /\d/.test(f.next))) x.next = 'At least 8 characters with a letter and a number';
    if (f.confirm !== f.next) x.confirm = 'Passwords do not match';
    setErrs(x);
    if (Object.keys(x).length) return;
    if (await run(() => api.post('/auth/reset-password', { token, newPassword: f.next }))) {
      navigate('/login', { replace: true, state: { notice: 'Password updated. Please log in with your new password.' } });
    }
  };

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return (
      <main className="max-w-md mx-auto p-6 mt-8">
        <h1 className="text-3xl font-extrabold mb-4">Reset link not valid</h1>
        <Alert>This link is incomplete or has already been used.</Alert>
        <p className="mt-4"><Link to="/forgot-password" className="font-semibold text-brand underline">Request a new link</Link></p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-3xl font-extrabold mb-6">Choose a new password</h1>
      <Card>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {error && <Alert>{error}</Alert>}
          <Input label="New password" type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} error={errs.next} />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} error={errs.confirm} />
          <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Update password'}</Button>
        </form>
      </Card>
      {error && <p className="mt-4"><Link to="/forgot-password" className="font-semibold text-brand underline">Request a new link</Link></p>}
    </main>
  );
}