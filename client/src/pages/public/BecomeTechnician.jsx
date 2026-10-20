import { useState } from 'react';
import api from '../../api/client.js';
import useSeo from '../../hooks/useSeo.js';
import { Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import { Textarea } from '../../components/Fields.jsx';

const SKILL_OPTIONS = ['AC Repair', 'Plumbing', 'Electrical', 'Carpentry', 'Home Cleaning', 'Pest Control', 'Painting'];

export default function BecomeTechnician() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', experienceYears: '', skills: [], message: '' });
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useSeo({
    title: 'Become a Technician | Join SmartServe',
    description: 'Join SmartServe as a professional technician. Enjoy flexible hours, weekly payouts, and free training. Apply today!',
    path: '/become-a-technician',
  });

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.skills.length === 0) {
      setNotice({ type: 'error', text: 'Please select at least one skill.' });
      return;
    }
    setBusy(true);
    setNotice({ type: '', text: '' });
    try {
      await api.post('/applications', {
        ...form,
        experienceYears: Number(form.experienceYears),
      });
      setNotice({ type: 'success', text: 'Application submitted! Our team will contact you soon.' });
      setForm({ name: '', email: '', phone: '', city: '', experienceYears: '', skills: [], message: '' });
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="w-full bg-white">
      {/* Hero Section */}
      <section className="bg-brand-dark text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Become a SmartServe Technician
          </h1>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Join our team of skilled professionals. Get more jobs, flexible hours, and grow your career with us.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-gray-50 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-line text-center">
            <div className="w-12 h-12 mx-auto bg-brand-tint text-brand-dark rounded-full flex items-center justify-center mb-4 text-xl">💼</div>
            <h3 className="font-bold mb-2">More Jobs</h3>
            <p className="text-sm text-ink-muted">Get access to a constant stream of service requests in your city.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-line text-center">
            <div className="w-12 h-12 mx-auto bg-brand-tint text-brand-dark rounded-full flex items-center justify-center mb-4 text-xl">💰</div>
            <h3 className="font-bold mb-2">Weekly Payouts</h3>
            <p className="text-sm text-ink-muted">Transparent and timely payments directly to your bank account.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-line text-center">
            <div className="w-12 h-12 mx-auto bg-brand-tint text-brand-dark rounded-full flex items-center justify-center mb-4 text-xl">📚</div>
            <h3 className="font-bold mb-2">Free Training</h3>
            <p className="text-sm text-ink-muted">Upgrade your skills with our free training and certification programs.</p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-line">
          <h2 className="text-2xl font-extrabold text-center mb-8">Apply Now</h2>

          {notice.text && (
            <div className={`p-4 rounded-lg mb-6 text-sm font-semibold ${notice.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {notice.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>

            <Input label="Years of Experience" type="number" min="0" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} required />

            <div>
              <label className="block text-sm font-semibold text-ink-muted mb-2">Select Your Skills *</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      form.skills.includes(skill)
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-ink-muted border-line-strong hover:border-brand'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <Textarea label="Why should we hire you? (Optional)" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />

            <Button type="submit" disabled={busy} className="w-full min-h-[48px] mt-2">
              {busy ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}