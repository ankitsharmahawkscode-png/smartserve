import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import { EmptyState, Spinner, ErrorState } from '../../components/States.jsx';

export default function AdminCoupons() {
  const { data, loading, error, reload } = useFetch('/admin/coupons');
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', form);
      setNotice('Coupon created');
      setForm(null);
      reload();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this coupon?')) return;
    await api.delete(`/admin/coupons/${id}`);
    reload();
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const coupons = data?.items || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setForm({ code: '', discountType: 'percentage', discountValue: 10, minBookingAmount: 0, expiryDate: '', usageLimit: 100 })}>Add Coupon</Button>
      </div>

      {notice && <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded">{notice}</div>}

      {form ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow flex flex-col gap-4 mb-6">
          <Input label="Coupon Code (e.g. SAVE20)" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Type</label>
              <select value={form.discountType} onChange={(e) => setForm({...form, discountType: e.target.value})} className="w-full p-2 border rounded">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <Input label="Value" type="number" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: Number(e.target.value)})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Amount (₹)" type="number" value={form.minBookingAmount} onChange={(e) => setForm({...form, minBookingAmount: Number(e.target.value)})} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} required />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {coupons.length === 0 ? <div className="p-4 text-gray-500">No coupons yet</div> : coupons.map(c => (
            <div key={c._id} className="p-4 border-b flex justify-between items-center">
              <div>
                <span className="font-bold text-lg border px-2 py-1 rounded bg-gray-100">{c.code}</span>
                <span className="ml-3 text-sm text-gray-600">{c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}</span>
              </div>
              <Button variant="secondary" onClick={() => handleDelete(c._id)}>Delete</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}