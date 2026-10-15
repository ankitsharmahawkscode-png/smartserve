import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Checkbox, Textarea } from '../../components/Fields.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import ChangePassword from '../../components/ChangePassword.jsx';

const SLOT_RE = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

function SettingsForm({ initial }) {
  const [f, setF] = useState({
    slots: initial.slots.join(', '), slotCapacity: initial.slotCapacity, maxAdvanceDays: initial.maxAdvanceDays, minLeadHours: initial.minLeadHours,
    codEnabled: initial.codEnabled, freeHoursBefore: initial.cancellation.freeHoursBefore, feePercent: initial.cancellation.feePercent,
  });
  const [errs, setErrs] = useState({});
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAction();
  const set = (k) => (e) => { setSaved(false); setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }); };

  const submit = async (e) => {
    e.preventDefault();
    const slots = f.slots.split(',').map((s) => s.trim()).filter(Boolean);
    const x = {};
    if (!slots.length || slots.some((s) => !SLOT_RE.test(s))) x.slots = 'Use the format 09:00-11:00, separated by commas';
    const int = (v, min, max) => Number.isInteger(Number(v)) && v !== '' && Number(v) >= min && Number(v) <= max;
    if (!int(f.slotCapacity, 1, 100)) x.slotCapacity = 'Whole number from 1 to 100';
    if (!int(f.maxAdvanceDays, 1, 365)) x.maxAdvanceDays = 'Whole number from 1 to 365';
    if (f.minLeadHours === '' || Number(f.minLeadHours) < 0 || Number(f.minLeadHours) > 72) x.minLeadHours = 'Between 0 and 72';
    if (f.freeHoursBefore === '' || Number(f.freeHoursBefore) < 0) x.freeHoursBefore = '0 or more';
    if (f.feePercent === '' || Number(f.feePercent) < 0 || Number(f.feePercent) > 100) x.feePercent = 'Between 0 and 100';
    setErrs(x);
    if (Object.keys(x).length) return;
    const ok = await run(() => api.put('/admin/settings', {
      slots, slotCapacity: Number(f.slotCapacity), maxAdvanceDays: Number(f.maxAdvanceDays), minLeadHours: Number(f.minLeadHours),
      codEnabled: f.codEnabled, cancellation: { freeHoursBefore: Number(f.freeHoursBefore), feePercent: Number(f.feePercent) },
    }));
    if (ok) setSaved(true);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {error && <Alert>{error}</Alert>}
      {saved && <div role="status" className="rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">Settings saved</div>}
      <Card className="grid gap-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-xl font-extrabold">Booking rules</h2>
        <Textarea className="sm:col-span-2" label="Time slots (comma separated)" value={f.slots} onChange={set('slots')} error={errs.slots} />
        <Input label="Bookings allowed per slot" type="number" value={f.slotCapacity} onChange={set('slotCapacity')} error={errs.slotCapacity} />
        <Input label="Book up to (days ahead)" type="number" value={f.maxAdvanceDays} onChange={set('maxAdvanceDays')} error={errs.maxAdvanceDays} />
        <Input label="Minimum notice (hours)" type="number" value={f.minLeadHours} onChange={set('minLeadHours')} error={errs.minLeadHours} />
        <Checkbox label="Allow cash on service" checked={f.codEnabled} onChange={set('codEnabled')} />
      </Card>
      <Card className="grid gap-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-xl font-extrabold">Cancellation policy</h2>
        <Input label="Free cancellation until (hours before slot)" type="number" value={f.freeHoursBefore} onChange={set('freeHoursBefore')} error={errs.freeHoursBefore} />
        <Input label="Fee after that (% of estimated price)" type="number" value={f.feePercent} onChange={set('feePercent')} error={errs.feePercent} />
      </Card>
      <div><Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save settings'}</Button></div>
    </form>
  );
}

export default function AdminSettings() {
  const { data, loading, error, reload } = useFetch('/admin/settings');
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Settings</h1>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && <SettingsForm initial={data.settings} />},
              <div className="mt-8"><ChangePassword /></div>
    </div>
  );
}