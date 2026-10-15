import { useState } from 'react';
import api, { apiMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import AddressFields, { EMPTY_ADDRESS, cleanAddress, validateAddress } from '../../components/AddressFields.jsx';
import ChangePassword from '../../components/ChangePassword.jsx';
export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [label, setLabel] = useState('');
  const [addrErrors, setAddrErrors] = useState({});

  const run = async (fn) => {
    setMsg(''); setErr('');
    try { await fn(); } catch (e) { setErr(e.response?.data?.errors?.[0]?.message || apiMessage(e)); }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    run(async () => {
      const { data } = await api.put('/me', { name: name.trim(), ...(phone.trim() && { phone: phone.trim() }) });
      setUser(data.data.user);
      setMsg('Profile saved');
    });
  };

  const addAddress = (e) => {
    e.preventDefault();
    const errs = validateAddress(addr);
    setAddrErrors(errs);
    if (Object.keys(errs).length) return;
    run(async () => {
      const { data } = await api.post('/me/addresses', cleanAddress({ ...addr, label }));
      setUser(data.data.user);
      setAddr(EMPTY_ADDRESS); setLabel('');
      setMsg('Address added');
    });
  };

  const removeAddress = (id) => run(async () => {
    const { data } = await api.delete(`/me/addresses/${id}`);
    setUser(data.data.user);
    setMsg('Address removed');
  });

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold">Profile and addresses</h1>
      {err && <Alert>{err}</Alert>}
      {msg && <div role="status" className="rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{msg}</div>}

      <Card>
        <h2 className="text-xl font-extrabold mb-4">Your details</h2>
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="sm:col-span-2"><p className="text-sm text-ink-muted mb-3">Email: {user.email}</p><Button type="submit">Save details</Button></div>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-extrabold mb-4">Saved addresses</h2>
        {user.addresses.length === 0 && <p className="text-ink-muted mb-4">No saved addresses yet.</p>}
        <ul className="flex flex-col gap-3 mb-6">
          {user.addresses.map((a) => (
            <li key={a._id} className="flex flex-wrap items-center justify-between gap-3 border border-line rounded-[10px] p-3">
              <span>
                <strong>{a.label || 'Address'}{a.isDefault ? ' (default)' : ''}</strong><br />
                {[a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', ')}
              </span>
              <Button variant="secondary" onClick={() => removeAddress(a._id)} aria-label={`Remove ${a.label || 'address'}`}>Remove</Button>
            </li>
          ))}
        </ul>
        <h3 className="font-extrabold mb-3">Add an address</h3>
        <form onSubmit={addAddress} className="flex flex-col gap-4">
          <Input label="Label (for example Home)" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} />
          <AddressFields value={addr} onChange={setAddr} errors={addrErrors} />
          <div><Button type="submit">Add address</Button></div>
        </form>
      </Card>
      <ChangePassword />
    </div>
  );
}