import { useState } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useAction from '../../hooks/useAction.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Checkbox } from '../../components/Fields.jsx';
import ChangePassword from '../../components/ChangePassword.jsx';

export default function TechProfile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [msg, setMsg] = useState('');
  const act = useAction();

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    if (await act.run(async () => {
      const { data } = await api.put('/me', { name: name.trim(), ...(phone.trim() && { phone: phone.trim() }) });
      setUser(data.data.user);
    })) setMsg('Profile saved');
  };

  const setAvailable = async (isAvailable) => {
    setMsg('');
    if (await act.run(async () => {
      const { data } = await api.put('/tech/availability', { isAvailable });
      setUser(data.data.user);
    })) setMsg(isAvailable ? 'You are available for new jobs' : 'You will not be assigned new jobs');
  };

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Page heading */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-ink-muted mb-2">
            Technician workspace
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            My profile
          </h1>
          <p className="text-sm sm:text-base text-ink-muted mt-2">
            Manage your personal details and job availability.
          </p>
        </div>

        {/* Notifications */}
        {act.error && (
          <div className="mb-5">
            <Alert>{act.error}</Alert>
          </div>
        )}

        {msg && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-brand/20 bg-brand-tint p-3 sm:p-4 text-sm sm:text-base font-semibold text-brand-dark"
          >
            {msg}
          </div>
        )}

        <div className="flex flex-col gap-5 sm:gap-6">

          {/* Availability */}
          <Card className="p-4 sm:p-6 lg:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold">
                  Job availability
                </h2>
                <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                  Control whether you can receive new job assignments.
                </p>
              </div>

              <span
                className={`inline-flex self-start items-center rounded-full px-3 py-1.5 text-xs sm:text-sm font-bold ${
                  user.technician?.isAvailable
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {user.technician?.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-line bg-gray-50 p-3 sm:p-4">
              <Checkbox
                label="Available for new jobs"
                checked={!!user.technician?.isAvailable}
                disabled={act.busy}
                onChange={(e) => setAvailable(e.target.checked)}
              />
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-bold mb-2">Your skills</p>
              <p className="text-sm text-ink-muted leading-relaxed break-words">
                {user.technician?.skills?.join(', ') || 'No skills listed yet'}
              </p>
              <p className="text-xs text-ink-muted mt-3 leading-relaxed">
                Contact your administrator to update your skills or commission.
              </p>
            </div>
          </Card>

          {/* Personal details */}
          <Card className="p-4 sm:p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="text-lg sm:text-xl font-extrabold">
                Personal details
              </h2>
              <p className="text-sm text-ink-muted mt-2">
                Keep your contact information up to date.
              </p>
            </div>

            <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="min-w-0">
                <Input
                  label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="min-w-0">
                <Input
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-line bg-gray-50 p-3 sm:p-4 min-w-0">
                <p className="text-xs font-semibold text-ink-muted mb-1">
                  Email address
                </p>
                <p className="text-sm sm:text-base font-semibold break-all">
                  {user.email}
                </p>
                <p className="text-xs text-ink-muted mt-2">
                  Your registered email address is displayed here.
                </p>
              </div>

              <div className="sm:col-span-2 pt-1">
                <div className="w-full sm:w-auto sm:min-w-[160px] [&_button]:w-full">
                  <Button type="submit" disabled={act.busy}>
                    Save details
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Password settings */}
          <Card className="p-4 sm:p-6 lg:p-7">
            <h2 className="text-lg sm:text-xl font-extrabold mb-2">
              Security
            </h2>
            <p className="text-sm text-ink-muted mb-5">
              Update your password to help keep your account secure.
            </p>
            <ChangePassword />
          </Card>

        </div>
      </div>
    </main>
  );
}