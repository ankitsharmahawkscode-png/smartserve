import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { Button } from '../../components/ui.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';

export default function AdminApplications() {
  const { data, loading, error, reload } = useFetch('/admin/applications');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this technician? They will get access to the technician dashboard.')) return;
    setBusyId(id);
    setNotice('');
    try {
      await api.post(`/admin/applications/${id}/approve`);
      setNotice('Application approved! User is now a technician.');
      reload();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Error approving application');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="p-6"><Spinner /></div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;

  const apps = data?.items || [];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-6">Technician Applications</h1>

      {notice && (
        <div className="mb-4 rounded-[10px] bg-brand-tint p-3 text-sm sm:text-base font-semibold text-brand-dark">
          {notice}
        </div>
      )}

      {apps.length === 0 ? (
        <EmptyState title="No applications yet">
          Applications from the "Become a Technician" page will appear here.
        </EmptyState>
      ) : (
        <div className="bg-white rounded-card border border-line shadow flex flex-col">
          {apps.map((app) => (
            <div key={app._id} className="p-4 sm:p-5 border-b border-line last:border-0 flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-lg">{app.name}</h3>
                <p className="text-sm text-ink-muted">{app.email} • {app.phone}</p>
                <p className="text-sm text-ink-muted mt-1">
                  <strong>City:</strong> {app.city} • <strong>Experience:</strong> {app.experienceYears} years
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {app.skills.map((s, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                {app.message && (
                  <p className="text-sm text-ink-muted mt-2 italic">"{app.message}"</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {app.status.toUpperCase()}
                </span>
                {app.status === 'pending' && (
                  <Button
                    onClick={() => handleApprove(app._id)}
                    disabled={busyId === app._id}
                    className="min-h-[36px]"
                  >
                    {busyId === app._id ? 'Approving...' : 'Approve'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}