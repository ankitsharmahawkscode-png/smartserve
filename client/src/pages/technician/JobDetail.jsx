import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card, StatusBadge } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Textarea } from '../../components/Fields.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettyDateTime, prettySlot } from '../../utils/format.js';
import { socket, connectSocket } from '../../lib/socket.js';

const STEPS = ['Assigned', 'Accepted', 'On the way', 'Arrived', 'In progress', 'Completed'];

const stageOf = (b) => {
  switch (b.status) {
    case 'COMPLETED': return 5;
    case 'IN_PROGRESS': return 4;
    case 'ACCEPTED': return b.arrivedAt ? 3 : b.onTheWayAt ? 2 : 1;
    case 'ASSIGNED': return 0;
    default: return -1;
  }
};

const Row = ({ label, children }) => (
  <div className="min-w-0 border-b border-line py-3 last:border-0">
    <dt className="mb-1 text-xs text-ink-muted sm:text-sm">{label}</dt>
    <dd className="break-words text-sm font-semibold sm:text-base">{children}</dd>
  </div>
);

const fullAddress = (a = {}) => [a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', ');

// Sockets may be unavailable on the host, so a failed emit must never break the page
const emit = (event, payload) => {
  try {
    socket.emit(event, payload);
  } catch {
    /* ignore */
  }
};

function Progress({ stage }) {
  return (
    <ol className="flex items-start" aria-label="Job progress">
      {STEPS.map((label, i) => {
        const done = stage >= 0 && i <= stage;
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-3.5 h-0.5 w-full ${i <= stage ? 'bg-brand' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                done ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {done && i < stage ? '✓' : i + 1}
            </span>
            <span
              className={`mt-1.5 text-[10px] font-semibold leading-tight sm:text-xs ${
                done ? 'text-brand-dark' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(`/tech/jobs/${id}`);
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [geoMsg, setGeoMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const act = useAction();
  const [sharing, setSharing] = useState(false);
  const watchRef = useRef(null);
  const lastPing = useRef(0);

  // Stop the GPS watch if the technician leaves the page
  useEffect(
    () => () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
        emit('tech:stop', { bookingId: id });
      }
    },
    [id]
  );

  if (loading && !data) return <div className="flex justify-center p-10"><Spinner /></div>;
  if (error || !data?.booking) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <ErrorState message={error || 'Job not found'} onRetry={reload} />
      </div>
    );
  }

  const b = data.booking;
  const needsAmount = b.service?.pricingType === 'estimate';
  const isCod = b.paymentMethod === 'cod';
  const history = b.statusHistory || [];
  const address = fullAddress(b.address);
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const phone = b.customer?.phone;
  const cancelled = b.status === 'CANCELLED';
  const stage = stageOf(b);
  const travelling = b.status === 'ACCEPTED' && b.onTheWayAt && !b.arrivedAt;

  const send = async (call, msg, after) => {
    if (await act.run(call)) {
      setDialog(null);
      setNotice(msg);
      after?.();
      reload();
    }
  };

  const accept = () => send(() => api.patch(`/tech/jobs/${id}/respond`, { accept: true }), 'Job accepted');
  const reject = () =>
    send(
      () => api.patch(`/tech/jobs/${id}/respond`, { accept: false, ...(reason.trim() && { reason: reason.trim() }) }),
      'Job rejected'
    );
  const start = () =>
    send(
      () => api.patch(`/tech/jobs/${id}/status`, { status: 'IN_PROGRESS', ...(code.trim() && { code: code.trim() }) }),
      'Job started'
    );
  const complete = () => {
    if (needsAmount && (amount === '' || Number(amount) < 0)) return act.setError('Enter the final amount');
    return send(
      () =>
        api.patch(`/tech/jobs/${id}/status`, {
          status: 'COMPLETED',
          ...(amount !== '' && { finalPrice: Number(amount) }),
        }),
      'Job completed',
      () => { if (sharing) stopSharing(); }
    );
  };
  const close = () => {
    setDialog(null);
    act.setError('');
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setGeoMsg('Could not copy the address');
    }
  };

  // ---- live location ----
  const startSharing = async () => {
    if (watchRef.current !== null) return; // already sharing
    setGeoMsg('');
    if (!navigator.geolocation) {
      setGeoMsg('Location is not supported on this device');
      return;
    }
    try {
      await api.post(`/tech/jobs/${id}/location/start`);
      try { connectSocket(); } catch { /* ignore */ }
      emit('tech:join', { bookingId: b._id, techId: b.technician?._id ?? b.technician });

      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          emit('tech:location', { bookingId: b._id, lat, lng });
          // The customer's screen reads from the server, so save a position every 10 seconds
          const now = Date.now();
          if (now - lastPing.current > 10000) {
            lastPing.current = now;
            api.post(`/tech/jobs/${id}/location/ping`, { lat, lng }).catch(() => {});
          }
        },
        (err) => setGeoMsg(err.code === 1 ? 'Location permission was denied' : 'Could not read your location'),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      setSharing(true);
    } catch (e) {
      setGeoMsg(`Could not start sharing: ${e.response?.data?.message || e.message}`);
    }
  };

  const stopSharing = async () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    lastPing.current = 0;
    emit('tech:stop', { bookingId: b._id });
    try {
      await api.post(`/tech/jobs/${id}/location/stop`);
    } catch (e) {
      console.error(e);
    }
    setSharing(false);
  };

  // ---- taxi-style steps ----
  const onTheWay = async () => {
    if (await act.run(() => api.post(`/tech/jobs/${id}/progress`, { step: 'on_the_way' }))) {
      setNotice('The customer can now see you on the way');
      reload();
      startSharing();
    }
  };

  const arrived = async () => {
    if (await act.run(() => api.post(`/tech/jobs/${id}/progress`, { step: 'arrived' }))) {
      if (sharing) await stopSharing();
      setNotice('The customer knows you have arrived');
      reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70">
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <p className="mb-4">
          <Link
            to="/technician/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
          >
            ← Back to assigned jobs
          </Link>
        </p>

        {notice && (
          <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800 sm:p-4 sm:text-base">
            {notice}
          </div>
        )}
        {geoMsg && <div className="mb-5"><Alert>{geoMsg}</Alert></div>}
        {!dialog && act.error && <div className="mb-5"><Alert>{act.error}</Alert></div>}

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Job details</p>
            <h1 className="break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{b.bookingNo}</h1>
            <p className="mt-2 text-sm text-ink-muted">{b.service?.name}</p>
          </div>
          <div className="shrink-0 self-start sm:self-center"><StatusBadge status={b.status} /></div>
        </div>

        {/* Progress */}
        <Card className="mb-5 p-4 sm:p-6">
          {cancelled ? (
            <p className="text-sm font-semibold text-red-700">This job was cancelled.</p>
          ) : (
            <Progress stage={stage} />
          )}
        </Card>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-extrabold sm:text-xl">Booking information</h2>
              <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <Row label="Service">{b.service?.name}</Row>
                <Row label="When">{prettyDate(b.date)}, {prettySlot(b.slot)}</Row>
                <Row label="Customer">{b.customer?.name}</Row>
                <Row label="Phone">
                  {phone ? (
                    <a className="break-words text-brand underline underline-offset-4" href={`tel:${phone}`}>{phone}</a>
                  ) : (
                    'Not provided'
                  )}
                </Row>
                <Row label="Customer notes">{b.notes || 'None'}</Row>
                <Row label="Estimated price">{inr(b.estimatedPrice)}</Row>
                <Row label="Payment">{isCod ? 'Collect cash on service' : 'Paid online'}</Row>
                {b.finalPrice != null && <Row label="Final amount">{inr(b.finalPrice)}</Row>}
              </dl>
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-extrabold sm:text-xl">Address</h2>
              <p className="break-words text-sm font-semibold sm:text-base">{address || 'Not provided'}</p>
              {address && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
                  >
                    Navigate
                  </a>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="rounded-lg border border-line-strong px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    {copied ? 'Copied ✓' : 'Copy address'}
                  </button>
                </div>
              )}
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-extrabold sm:text-xl">Progress history</h2>
              {history.length === 0 ? (
                <p className="text-sm text-ink-muted">No updates yet.</p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {history.map((h, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                      <StatusBadge status={h.to} />
                      <span className="text-xs text-ink-muted sm:text-sm">{prettyDateTime(h.at)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          {/* Actions */}
          <aside className="min-w-0 lg:sticky lg:top-6">
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-extrabold sm:text-xl">Job actions</h2>

              <div className="mb-5 rounded-xl border border-line bg-gray-50 p-4">
                <p className="text-sm text-ink-muted">{b.finalPrice != null ? 'Final amount' : 'Estimated price'}</p>
                <p className="mt-2 break-words text-2xl font-extrabold sm:text-3xl">
                  {inr(b.finalPrice ?? b.estimatedPrice)}
                </p>
                <p className="mt-2 text-xs text-ink-muted">Payment: {isCod ? 'Cash on service' : 'Online'}</p>
              </div>

              <div className="flex flex-col gap-3 [&_button]:w-full">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex min-h-[44px] items-center justify-center rounded-full border border-line-strong bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    📞 Call customer
                  </a>
                )}

                {b.status === 'ASSIGNED' && (
                  <>
                    <Button onClick={accept} disabled={act.busy}>Accept job</Button>
                    <Button variant="secondary" onClick={() => setDialog('reject')}>Reject job</Button>
                  </>
                )}

                {b.status === 'ACCEPTED' && !b.onTheWayAt && (
                  <Button onClick={onTheWay} disabled={act.busy}>I'm on my way</Button>
                )}
                {b.status === 'ACCEPTED' && b.onTheWayAt && !b.arrivedAt && (
                  <Button onClick={arrived} disabled={act.busy}>I've arrived</Button>
                )}
                {b.status === 'ACCEPTED' && (
                  <Button
                    variant={b.arrivedAt ? undefined : 'secondary'}
                    onClick={() => { setCode(''); act.setError(''); setDialog('start'); }}
                    disabled={act.busy}
                  >
                    Start job
                  </Button>
                )}

                {b.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => {
                      setAmount(needsAmount ? '' : String(b.estimatedPrice));
                      setDialog('complete');
                    }}
                  >
                    Complete job
                  </Button>
                )}

                {['ACCEPTED', 'IN_PROGRESS'].includes(b.status) && (
                  <button
                    type="button"
                    onClick={sharing ? stopSharing : startSharing}
                    className={`min-h-[44px] rounded-full px-5 text-sm font-semibold transition-colors ${
                      sharing ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-brand text-white hover:bg-brand-dark'
                    }`}
                  >
                    {sharing ? 'Stop sharing location' : 'Share live location'}
                  </button>
                )}
              </div>

              {sharing && (
                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Sharing your live location
                </p>
              )}
              {travelling && !sharing && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">
                  Location sharing is off. Tap "Share live location" so the customer can see you on the map.
                </p>
              )}
            </Card>
          </aside>
        </div>

        <ConfirmDialog
          open={dialog === 'reject'}
          title="Reject this job?"
          confirmLabel="Reject job"
          cancelLabel="Keep job"
          onConfirm={reject}
          onCancel={close}
          busy={act.busy}
        >
          {act.error && <div className="mb-3"><Alert>{act.error}</Alert></div>}
          <p className="mb-3 text-sm text-ink-muted">The admin will be able to assign it to someone else.</p>
          <Textarea label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        </ConfirmDialog>

        <ConfirmDialog
          open={dialog === 'start'}
          title="Start this job"
          confirmLabel="Start job"
          cancelLabel="Not yet"
          onConfirm={start}
          onCancel={close}
          busy={act.busy}
        >
          {act.error && <div className="mb-3"><Alert>{act.error}</Alert></div>}
          <p className="mb-3 text-sm text-ink-muted">
            Ask the customer for the 4-digit start code shown in their app.
          </p>
          <Input
            label="Start code"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </ConfirmDialog>

        <ConfirmDialog
          open={dialog === 'complete'}
          title="Complete this job"
          confirmLabel="Mark completed"
          cancelLabel="Not yet"
          onConfirm={complete}
          onCancel={close}
          busy={act.busy}
        >
          {act.error && <div className="mb-3"><Alert>{act.error}</Alert></div>}
          {isCod && (
            <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              Collect this amount in cash from the customer before you finish.
            </p>
          )}
          <Input
            label={needsAmount ? 'Final amount charged (INR)' : 'Amount (INR)'}
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </ConfirmDialog>
      </main>
    </div>
  );
}