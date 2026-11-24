import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';

import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import AddressFields, { EMPTY_ADDRESS, cleanAddress, validateAddress } from '../../components/AddressFields.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { addDaysYMD, inr, prettySlot, todayYMD } from '../../utils/format.js';
import { readHint, clearHint } from '../../utils/bookingHint.js';

const MAX_SERVICES = 5;

const unwrap = (res) => res?.data?.data ?? res?.data ?? {};

// A complete date inside the allowed booking window
const validDate = (d, min, max) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && d >= min && d <= max;

// Works whether the API returns { items }, { services } or a plain list
const listOf = (d) => {
  const x = d?.data ?? d ?? {};
  return Array.isArray(x.items) ? x.items : Array.isArray(x.services) ? x.services : Array.isArray(x) ? x : [];
};

const isAcService = (s) => /\bac\b|air.?condition/i.test(`${s?.name || ''} ${s?.category?.name || ''}`);

export default function Book() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const svc = useFetch(`/services/${serviceId}`);
  const cfg = useFetch('/settings/public');
  const all = useFetch('/services', { limit: 100 });
  const related = useFetch(serviceId ? `/services/${serviceId}/related` : null);
  const saved = user?.addresses || [];

  // Services in this order (ids), starting with the one the customer opened
  const [ids, setIds] = useState([serviceId]);
  const [showPicker, setShowPicker] = useState(false);
  const [q, setQ] = useState('');
  const [listAll, setListAll] = useState(false);

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [slotState, setSlotState] = useState({ loading: false, error: '', slots: null });
  const [slotReload, setSlotReload] = useState(0);
  const [addressId, setAddressId] = useState(saved.find((a) => a.isDefault)?._id || saved[0]?._id || 'new');
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState('cod');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState([]); // bookings already made in this visit

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Result saved by the AC tonnage calculator
  const [hint] = useState(() => readHint('ac'));
  const [useHint, setUseHint] = useState(true);

  const primary = svc.data?.service;
  const settings = cfg.data?.settings;
  const today = todayYMD();
  const maxDate = settings ? addDaysYMD(today, settings.maxAdvanceDays) : today;
  const dateOk = validDate(date, today, maxDate);

  // Details for every service we know about (primary, the list, related ones)
  const byId = useMemo(() => {
    const m = {};
    listOf(all.data).forEach((s) => { if (s?._id) m[s._id] = s; });
    (related.data?.items || []).forEach((s) => { if (s?._id) m[s._id] = { ...m[s._id], ...s }; });
    if (primary?._id) m[primary._id] = { ...m[primary._id], ...primary };
    return m;
  }, [all.data, related.data, primary]);

  const selected = ids.map((id) => byId[id]).filter(Boolean);
  const idsKey = selected.map((s) => s._id).join(',');
  const subtotal = selected.reduce((sum, s) => sum + (Number(s.basePrice) || 0), 0);
  const total = Math.max(0, subtotal - discount);
  const priciest = selected.reduce((m, s) => (!m || (s.basePrice || 0) > (m.basePrice || 0) ? s : m), null);
  const acService = selected.find(isAcService);
  const showHint = !!acService && !!hint;
  const hasEstimate = selected.some((s) => s.pricingType === 'estimate');
  const multi = selected.length > 1;

  // If the customer opens a different service, start again with it
  useEffect(() => { setIds([serviceId]); setBooked([]); }, [serviceId]);

  // Slots that are free for ALL selected services at once
  useEffect(() => {
    if (!dateOk || !selected.length) {
      setSlotState({ loading: false, error: '', slots: null });
      return undefined;
    }
    let on = true;
    setSlotState({ loading: true, error: '', slots: null });
    Promise.all(selected.map((s) => api.get(`/services/${s._id}/slots`, { params: { date } })))
      .then((responses) => {
        if (!on) return;
        const lists = responses.map((r) => unwrap(r).slots || []);
        const merged = (lists[0] || []).map((first) => {
          const row = [first, ...lists.slice(1).map((l) => l.find((x) => x.slot === first.slot))];
          const blocked = row.find((x) => !x || !x.available);
          return {
            slot: first.slot,
            available: !blocked,
            reason: blocked ? (blocked.reason === 'full' ? 'full' : 'unavailable') : undefined,
          };
        });
        setSlotState({ loading: false, error: '', slots: merged });
      })
      .catch((e) => {
        if (on) setSlotState({ loading: false, error: e.response?.data?.message || apiMessage(e), slots: null });
      });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateOk, date, idsKey, slotReload]);

  // A coupon belongs to one amount: drop it whenever the services change
  useEffect(() => {
    setCouponApplied(false);
    setDiscount(0);
    setCouponMsg('');
  }, [idsKey]);

  if (svc.loading || cfg.loading) return <div className="flex justify-center p-10"><Spinner /></div>;
  if (svc.error || cfg.error || !primary || !settings) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <ErrorState
          message={svc.error || cfg.error || 'Could not load this service'}
          onRetry={() => { svc.reload(); cfg.reload(); }}
        />
      </div>
    );
  }

  if (!primary.isAvailable && booked.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Alert>This service is currently unavailable.</Alert>
        <p className="mt-4"><Link className="underline" to="/services">Back to services</Link></p>
      </div>
    );
  }

  // ----- choosing services -----
  const canAddMore = ids.length < MAX_SERVICES;
  const resetChoice = () => { setSlot(''); setServerError(''); };

  const addService = (id) => {
    if (!canAddMore || ids.includes(id)) return;
    setIds((cur) => [...cur, id]);
    resetChoice();
  };
  const removeService = (id) => {
    if (ids.length <= 1) return;
    setIds((cur) => cur.filter((x) => x !== id));
    resetChoice();
  };

  const term = q.trim().toLowerCase();
  const candidates = Object.values(byId)
    .filter((s) => s.isAvailable !== false && !ids.includes(s._id))
    .filter((s) => !term || `${s.name} ${s.category?.name || ''}`.toLowerCase().includes(term));
  const shownCandidates = term || listAll ? candidates : candidates.slice(0, 6);

  // ----- coupon (applies to the most expensive service in the order) -----
  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code || !priciest) return;
    try {
      const res = await api.post('/coupons/validate', { code, amount: priciest.basePrice });
      setDiscount(Number(res.data.data.discount) || 0);
      setCouponMsg(res.data.data.message);
      setCouponApplied(true);
    } catch (err) {
      setDiscount(0);
      setCouponApplied(false);
      setCouponMsg(err.response?.data?.message || 'Invalid coupon');
    }
  };
  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponCode('');
    setDiscount(0);
    setCouponMsg('');
  };

  // Notes for one booking: the customer's notes, the AC calculator result for the AC service,
  // and a line naming the other services booked together
  const notesFor = (s) => {
    const together = multi
      ? `Booked together with: ${selected.filter((x) => x._id !== s._id).map((x) => x.name).join(', ')}.`.slice(0, 140)
      : '';
    const parts = [];
    if (notes.trim()) parts.push(notes.trim());
    if (showHint && useHint && isAcService(s)) parts.push(hint.text);
    const room = 500 - (together ? together.length + 1 : 0);
    return [parts.join('\n').slice(0, Math.max(0, room)), together].filter(Boolean).join('\n').slice(0, 500);
  };

  // ----- submit: one booking per service, all with the same slot and address -----
  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!date) errs.date = 'Choose a date';
    else if (!dateOk) errs.date = `Choose a date between ${today} and ${maxDate}`;
    if (dateOk && !slot) errs.slot = 'Choose a time slot';
    if (addressId === 'new') Object.assign(errs, validateAddress(addr));
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (selected.some((s) => s.isAvailable === false)) {
      setServerError('Remove the unavailable service to continue.');
      return;
    }

    setBusy(true);
    setServerError('');

    const done = [];
    let failure = null;
    for (const s of selected) {
      try {
        const n = notesFor(s);
        const payload = {
          serviceId: s._id,
          date,
          slot,
          paymentMethod: payment,
          ...(n && { notes: n }),
          ...(addressId === 'new' ? { address: cleanAddress(addr) } : { addressId }),
          ...(couponApplied && priciest?._id === s._id && { couponCode: couponCode.trim() }),
        };
        const { data } = await api.post('/bookings', payload);
        const b = data.data.booking;
        done.push({ _id: b._id, bookingNo: b.bookingNo, name: s.name, price: Number(s.basePrice) || 0, serviceId: s._id });
      } catch (err) {
        failure = {
          name: s.name,
          status: err.response?.status,
          message: err.response?.data?.errors?.[0]?.message || apiMessage(err),
        };
        break; // stop at the first problem, so we never leave a half-finished mess
      }
    }
    setBusy(false);

    if (done.some((d) => selected.find((s) => s._id === d.serviceId && isAcService(s)))) clearHint();

    const everything = [...booked, ...done];

    // Nothing could be booked
    if (done.length === 0) {
      setServerError(failure.message);
      if (failure.status === 409) { setSlot(''); setSlotReload((n) => n + 1); }
      return;
    }

    // Everything booked
    if (!failure) {
      if (everything.length === 1) {
        navigate(`/customer/bookings/${everything[0]._id}`, { state: { created: true } });
      } else {
        navigate('/customer/booked', { state: { bookings: everything, date, slot } });
      }
      return;
    }

    // Some were booked, one failed: keep the rest so the customer can pick another time
    setBooked(everything);
    setIds((cur) => cur.filter((id) => !done.some((d) => d.serviceId === id)));
    setSlot('');
    if (failure.status === 409) setSlotReload((n) => n + 1);
    setServerError(
      `${done.length === 1 ? 'One service was' : `${done.length} services were`} booked. ` +
      `${failure.name} could not be booked: ${failure.message} Choose another time for the rest and confirm again.`
    );
  };

  const first = selected[0] || primary;
  const mergedSlots = slotState.slots;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-6 sm:mb-8">
        {multi ? `Book ${selected.length} services` : `Book: ${first.name}`}
      </h1>

      {booked.length > 0 && (
        <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-bold">Already booked:</p>
          <ul className="mt-1 space-y-1">
            {booked.map((b) => (
              <li key={b._id}>
                ✓ {b.name} ({b.bookingNo}){' '}
                <Link to={`/customer/bookings/${b._id}`} className="font-semibold underline underline-offset-4">View</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={submit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-5 sm:gap-6 lg:gap-8 items-start"
      >
        <div className="min-w-0 flex flex-col gap-4 sm:gap-5">
          {serverError && <Alert>{serverError}</Alert>}

          {/* 1. Services */}
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">1. Your services</h2>
              <span className="text-xs font-semibold text-ink-muted">{selected.length} of {MAX_SERVICES}</span>
            </div>

            <ul className="flex flex-col gap-2">
              {selected.map((s) => (
                <li key={s._id} className="flex items-center gap-3 rounded-xl border border-line bg-gray-50 p-3">
                  {s.image ? (
                    <img src={s.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-xl" aria-hidden="true">🛠️</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{s.name}</p>
                    <p className="text-xs text-ink-muted">
                      {s.category?.name ? `${s.category.name} · ` : ''}
                      {s.pricingType === 'fixed' ? '' : 'From '}{inr(s.basePrice)}
                    </p>
                  </div>
                  {selected.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(s._id)}
                      aria-label={`Remove ${s.name}`}
                      className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {canAddMore ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowPicker((v) => !v)}
                  aria-expanded={showPicker}
                  className="inline-flex items-center gap-2 rounded-full border border-brand px-4 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand-tint"
                >
                  <span aria-hidden="true">{showPicker ? '−' : '+'}</span> {showPicker ? 'Hide services' : 'Add another service'}
                </button>

                {showPicker && (
                  <div className="mt-3 rounded-xl border border-line p-3 sm:p-4">
                    <label htmlFor="svc-search" className="sr-only">Search services</label>
                    <input
                      id="svc-search"
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search a service, e.g. plumbing"
                      className="min-h-[44px] w-full rounded-lg border border-line-strong px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />

                    {all.loading && !candidates.length ? (
                      <p className="mt-3 text-sm text-ink-muted">Loading services…</p>
                    ) : shownCandidates.length === 0 ? (
                      <p className="mt-3 text-sm text-ink-muted">
                        {term ? 'No matching services.' : 'No other services are available right now.'}
                      </p>
                    ) : (
                      <ul className="mt-3 flex flex-col gap-2">
                        {shownCandidates.map((s) => (
                          <li key={s._id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">{s.name}</p>
                              <p className="text-xs text-ink-muted">
                                {s.category?.name ? `${s.category.name} · ` : ''}
                                {s.pricingType === 'fixed' ? '' : 'From '}{inr(s.basePrice)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addService(s._id)}
                              className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-dark"
                            >
                              Add
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!term && !listAll && candidates.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setListAll(true)}
                        className="mt-3 text-sm font-semibold text-brand underline underline-offset-4"
                      >
                        Show all {candidates.length} services
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-muted">You can book up to {MAX_SERVICES} services at once.</p>
            )}
          </Card>

          {/* Coupon */}
          <Card className="p-4 sm:p-5 bg-gray-50 border-dashed">
            <label htmlFor="coupon" className="block text-sm font-semibold mb-2">Have a coupon code?</label>
            <div className="flex gap-2">
              <input
                id="coupon"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. SAVE20)"
                className="flex-1 min-h-[44px] px-3 rounded-lg border border-line-strong bg-white text-sm focus:outline-none focus:border-brand uppercase"
                disabled={couponApplied}
              />
              {!couponApplied ? (
                <Button type="button" onClick={applyCoupon} variant="secondary" className="px-4">Apply</Button>
              ) : (
                <Button type="button" onClick={removeCoupon} variant="secondary" className="px-4">Remove</Button>
              )}
            </div>
            {multi && !couponApplied && (
              <p className="mt-2 text-xs text-ink-muted">With several services, a coupon applies to the most expensive one: {priciest?.name}.</p>
            )}
            {couponMsg && (
              <p role="status" className={`text-sm mt-2 font-semibold ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {couponMsg}
              </p>
            )}
          </Card>

          {/* 2. Date and time */}
          <Card>
            <h2 className="text-xl font-extrabold mb-4">2. Date and time</h2>
            <Input
              label="Date"
              type="date"
              min={today}
              max={maxDate}
              value={date}
              onChange={(e) => { setDate(e.target.value); setSlot(''); }}
              error={errors.date}
            />
            {date && !dateOk && (
              <p className="mt-2 text-sm text-ink-muted">Enter a full date between {today} and {maxDate}.</p>
            )}
            {dateOk && (
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold text-ink-muted mb-2">Time slot</legend>
                {multi && (
                  <p className="mb-2 text-xs text-ink-muted">Showing times that are free for all {selected.length} services.</p>
                )}
                {slotState.loading && <p role="status" className="text-ink-muted">Checking availability...</p>}
                {slotState.error && <p role="alert" className="text-red-800">{slotState.error}</p>}
                {mergedSlots && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mergedSlots.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={!s.available}
                        aria-pressed={slot === s.slot}
                        onClick={() => setSlot(s.slot)}
                        className={`min-h-[46px] rounded-xl border px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                          slot === s.slot
                            ? 'bg-brand text-white border-brand shadow-sm'
                            : 'bg-white border-line hover:border-brand hover:bg-brand-tint'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {prettySlot(s.slot)}
                        {!s.available && (
                          <span className="block text-xs font-normal">{s.reason === 'full' ? 'Full' : 'Not available'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {mergedSlots && !mergedSlots.some((s) => s.available) && (
                  <p className="mt-2 text-sm text-ink-muted">
                    {multi ? 'No time is free for all of these services on this date. Try another date.' : 'No time is free on this date. Try another date.'}
                  </p>
                )}
                {errors.slot && <p className="mt-2 text-sm text-red-700">{errors.slot}</p>}
              </fieldset>
            )}
          </Card>

          {/* 3. Address */}
          <Card className="p-4 sm:p-6 rounded-2xl border border-line shadow-sm">
            <h2 className="text-xl font-extrabold mb-4">3. Service address</h2>
            {saved.length > 0 && (
              <div className="mb-4">
                <label htmlFor="addr" className="block text-sm font-semibold text-ink-muted mb-1">Address</label>
                <select
                  id="addr"
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-[10px] border border-[#AEB9B6] bg-white"
                >
                  {saved.map((a) => (
                    <option key={a._id} value={a._id}>{a.label ? `${a.label} - ` : ''}{a.line1}, {a.city}</option>
                  ))}
                  <option value="new">Use a new address</option>
                </select>
              </div>
            )}
            {addressId === 'new' && <AddressFields value={addr} onChange={setAddr} errors={errors} />}
          </Card>

          {/* 4. Notes and payment */}
          <Card>
            <h2 className="text-lg sm:text-xl font-extrabold mb-4 tracking-tight">4. Notes and payment</h2>

            {showHint && (
              <label className="mb-3 flex items-start gap-3 rounded-lg border border-brand/20 bg-brand-tint p-3 text-sm">
                <input
                  type="checkbox"
                  checked={useHint}
                  onChange={(e) => setUseHint(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-brand-dark">
                  <strong>Send my AC calculator result to the {acService.name} technician:</strong> {hint.text}
                </span>
              </label>
            )}

            <label htmlFor="notes" className="block text-sm font-semibold text-ink-muted mb-1">
              Notes for the technician{multi ? 's' : ''} (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] border border-[#AEB9B6] bg-white mb-1"
            />
            <p className="mb-4 text-right text-xs text-ink-muted">{notes.length}/300</p>

            <fieldset>
              <legend className="text-sm font-semibold text-ink-muted mb-2">Payment</legend>
              <label className="flex items-center gap-2 min-h-[44px]">
                <input type="radio" name="pay" value="cod" checked={payment === 'cod'} disabled={!settings.codEnabled} onChange={() => setPayment('cod')} />
                Cash on service
              </label>
              <label className={`flex items-center gap-2 min-h-[44px] ${settings.onlineEnabled ? '' : 'text-ink-muted'}`}>
                <input type="radio" name="pay" value="online" checked={payment === 'online'} disabled={!settings.onlineEnabled} onChange={() => setPayment('online')} />
                Pay online{settings.onlineEnabled ? '' : ' (not available yet)'}
              </label>
              {payment === 'online' && hasEstimate && (
                <p className="text-sm text-ink-muted">For estimate services you will pay online after the job, once the final amount is confirmed.</p>
              )}
            </fieldset>
          </Card>
        </div>

        {/* Summary */}
        <Card className="p-5 sm:p-6 rounded-2xl border border-line shadow-sm lg:sticky lg:top-6">
          <h2 className="text-xl font-extrabold mb-5 pb-3 border-b border-line">Booking summary</h2>

          <ul className="mb-3 space-y-2">
            {selected.map((s) => (
              <li key={s._id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0 font-semibold">{s.name}</span>
                <span className="shrink-0 font-semibold">{inr(s.basePrice)}</span>
              </li>
            ))}
          </ul>

          {(slot || date) && (
            <p className="mb-3 rounded-lg bg-gray-50 p-3 text-xs text-ink-muted">
              {dateOk ? date : 'No date yet'}{slot ? ` · ${prettySlot(slot)}` : ''}
              {multi && ' · one visit time for all services'}
            </p>
          )}

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-600">{multi ? 'Subtotal:' : 'Original Amount:'}</span>
            <span className="font-semibold">{inr(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center mb-2 text-sm text-green-600">
              <span>Discount:</span>
              <span className="font-semibold">- {inr(discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-4 border-t pt-3 mt-3">
            <span className="text-base font-bold">You Pay:</span>
            <span className="text-2xl font-extrabold text-brand-dark">{inr(total)}</span>
          </div>

          {hasEstimate && (
            <p className="text-sm text-ink-muted mb-3">Estimate services are confirmed by the technician after the job.</p>
          )}
          {multi && (
            <p className="text-sm text-ink-muted mb-3">
              Each service becomes its own booking with its own booking number and technician.
            </p>
          )}
          <p className="text-sm text-ink-muted mb-4">
            Free cancellation until {settings.cancellation.freeHoursBefore} hours before your slot. After that a {settings.cancellation.feePercent}% fee applies.
          </p>

          {/* Related services: add them to this booking */}
          {(related.data?.items || []).some((x) => !ids.includes(x._id) && x.isAvailable !== false) && canAddMore && (
            <div className="mt-4 pt-4 border-t border-line">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted mb-3">Often booked together</h3>
              <div className="flex flex-col gap-2">
                {related.data.items
                  .filter((x) => !ids.includes(x._id) && x.isAvailable !== false)
                  .slice(0, 3)
                  .map((item) => (
                    <div key={item._id} className="flex items-center gap-3 p-2 rounded-lg border border-line bg-gray-50">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-md" />
                      ) : (
                        <div className="w-10 h-10 bg-brand-tint rounded-md flex items-center justify-center text-brand-dark text-xs">🛠️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-ink-muted">{inr(item.basePrice)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addService(item._id)}
                        className="text-xs font-bold text-brand shrink-0 bg-white px-3 py-1 rounded border border-brand/20 hover:bg-brand-tint"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full min-h-[48px] justify-center rounded-xl mt-4"
            disabled={
              busy ||
              selected.length === 0 ||
              (payment === 'cod' && !settings.codEnabled) ||
              (payment === 'online' && !settings.onlineEnabled)
            }
          >
            {busy ? 'Booking...' : multi ? `Confirm ${selected.length} bookings` : 'Confirm booking'}
          </Button>
        </Card>
      </form>
    </div>
  );
}