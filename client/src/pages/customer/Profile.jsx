import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import AddressFields, { EMPTY_ADDRESS, cleanAddress, validateAddress } from '../../components/AddressFields.jsx';

export default function CustomerProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');

  // Yahan save details aur add address ke API calls aayenge
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">My Profile</h1>

      {notice && <div className="p-3 bg-green-50 text-green-800 rounded-lg">{notice}</div>}

      {/* Basic Details */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold mb-4">Basic Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-ink-muted mb-1">Email Address</label>
            <input type="email" value={user.email} disabled className="w-full p-3 bg-gray-50 border rounded-lg text-gray-500" />
          </div>
        </div>
        <Button className="mt-4" onClick={() => { /* API Call */ }}>Save Details</Button>
      </Card>

      {/* Addresses */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold mb-4">Saved Addresses</h2>
        <div className="space-y-3 mb-6">
          {user.addresses?.map((a) => (
            <div key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-gray-50 gap-3">
              <div>
                <p className="font-bold">{a.label || 'Address'} {a.isDefault && <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full ml-2">Default</span>}</p>
                <p className="text-sm text-gray-600">{a.line1}, {a.city}</p>
              </div>
              <div className="flex gap-2">
                {!a.isDefault && <Button variant="secondary" className="text-sm">Set Default</Button>}
                <Button variant="secondary" className="text-red-600 border-red-200 hover:bg-red-50">Remove</Button>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-md font-bold mb-3 border-t pt-4">Add a new address</h3>
        <AddressFields value={addr} onChange={setAddr} errors={errors} />
        <Button className="mt-4" onClick={() => { /* API Call to add address */ }}>Add Address</Button>
      </Card>
    </div>
  );
}