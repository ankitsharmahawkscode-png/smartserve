import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import useSeo from '../../hooks/useSeo.js';
import { Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import { Textarea } from '../../components/Fields.jsx';
import { FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

const CATEGORIES = ['Air Conditioners', 'Washing Machines', 'Refrigerators', 'Microwaves', 'Other'];

const EMPTY_FORM = {
  name: '',
  category: 'Air Conditioners',
  description: '',
  price: '',
  originalPrice: '',
  stock: '',
  image: '',
  features: '', // We'll split this by comma on submit
};

export default function AdminProducts() {
  useSeo({ title: 'Manage Shop Products | Admin | SmartServe' });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // 1. Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Note: This fetches all products, including inactive ones (you may need an admin endpoint for this)
      const res = await api.get('/shop/products');
      setProducts(res.data.data);
    } catch (err) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product._id);
      setForm({
        name: product.name,
        category: product.category,
        description: product.description || '',
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        image: product.image,
        features: product.features?.join(', ') || '',
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  // 2. Save Product (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        stock: Number(form.stock),
        features: form.features.split(',').map(f => f.trim()).filter(Boolean),
      };

      if (editingId) {
       await api.put(`/shop/admin/products/${editingId}`, payload);
      } else {
        await api.post('/shop/admin/products', payload);
      }
      
      setIsModalOpen(false);
      fetchProducts(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Delete Product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/shop/admin/products/${id}`);

      fetchProducts();
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading products...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Products</h1>
          <p className="text-sm text-gray-500">Manage your appliance inventory.</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <FaPlus /> Add Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-line text-gray-600">
            <tr>
              <th className="p-4 font-semibold">Image</th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Price</th>
              <th className="p-4 font-semibold">Stock</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="p-4">
                  <img src={p.image} alt={p.name} className="w-12 h-12 object-contain rounded bg-gray-100" />
                </td>
                <td className="p-4 font-medium text-gray-900">{p.name}</td>
                <td className="p-4 text-gray-500">{p.category}</td>
                <td className="p-4">
                  <span className="font-bold">₹{p.price.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-gray-400 line-through ml-2">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.stock} in stock
                  </span>
                </td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-800 p-2"><FaEdit /></button>
                  <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-800 p-2"><FaTrash /></button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">No products found. Add your first product!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-line">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Product Name" name="name" value={form.name} onChange={handleChange} required />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input label="Selling Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} required />
                <Input label="Original Price (₹)" name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange} required />
                <Input label="Stock Quantity" name="stock" type="number" value={form.stock} onChange={handleChange} required />
              </div>

              <Input label="Image URL" name="image" value={form.image} onChange={handleChange} placeholder="https://..." required />
              
              <Textarea label="Description" name="description" value={form.description} onChange={handleChange} rows={3} required />
              
              <Input label="Features (Comma separated)" name="features" value={form.features} onChange={handleChange} placeholder="Copper Condenser, Turbo Cooling, 4-in-1 Mode" />

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50">Cancel</button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}