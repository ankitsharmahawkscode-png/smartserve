import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import useSeo from '../../hooks/useSeo.js';
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAction();
useSeo({ title: 'Forgot your password', noindex: true });
  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Enter a valid email address');
    setErr('');
    if (await run(() => api.post('/auth/forgot-password', { email: email.trim() }))) setSent(true);
  };

  return (
    <main className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-3xl font-extrabold mb-2">Forgot your password?</h1>
      <p className="text-ink-muted mb-6">Enter your email and we will send you a link to choose a new one.</p>
      <Card>
        {sent ? (
          <div role="status">
            <p className="font-semibold text-brand-dark mb-2">Check your email</p>
            <p className="text-ink-muted">If an account exists for that address, a reset link is on its way. It works once and expires in 1 hour. Check your spam folder if it does not arrive.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            {error && <Alert>{error}</Alert>}
            <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err} />
            <Button type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</Button>
          </form>
        )}
      </Card>
      <p className="mt-4"><Link to="/login" className="font-semibold text-brand underline">Back to log in</Link></p>
    </main>
  );
}