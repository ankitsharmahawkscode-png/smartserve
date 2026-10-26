import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';

export default function AdminProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-extrabold">Admin Profile</h1>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Basic Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-ink-muted mb-1">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full p-3 bg-gray-50 border rounded-lg text-gray-500" />
          </div>
        </div>
        <Button className="mt-4" onClick={() => { /* API call */ }}>Save Changes</Button>
      </Card>
    </div>
  );
}