import { useEffect, useState } from 'react';
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

// A complete date inside the allowed booking window. Typing a year digit by digit
// (0002, 0020, 0202...) is rejected here, so no bad request is sent to the server.
const validDate = (d, min, max) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && d >= min && d <= max;

export default function Book() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const svc = useFetch(`/services/${serviceId}`);
  const cfg = useFetch('/settings/public');
  const saved = user?.addresses || [];
  const related = useFetch(serviceId ? `/services/${serviceId}/related` : null);

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [addressId, setAddressId] = useState(saved.find((a) => a.isDefault)?._id || saved[0]?._id || 'new');
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState('cod');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Result saved by the AC tonnage calculator
  const [hint, setHint] = useState(() => readHint('ac'));

  const service = svc.data?.service;
  const settings = cfg.data?.settings;
  const today = todayYMD();
  const maxDate = settings ? addDaysYMD(today, settings.maxAdvanceDays) : today;
  const dateOk = validDate(date, today, maxDate);

  // Only ask for slots once the typed date is complete and allowed
  const slots = useFetch(dateOk ? `/services/${serviceId}/slots` : null, { date });

  // Is this an AC service? Then the calculator result belongs in the notes
  const isAc = /\bac\b|air.?condition/i.test(`${service?.name || ''} ${service?.category?.name || ''}`);
  const showHint = isAc && !!hint;

  // Fill the notes once, when the service is known to be AC
  useEffect(() => {
    if (showHint) setNotes((n) => n || hint.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHint]);

  // A coupon applies to one amount: drop it if the service changes
  useEffect(() => {
    setCouponApplied(false);
    setDiscount(0);
    setCouponMsg('');
  }, [serviceId]);

  if (svc.loading || cfg.loading) return <div className="flex justify-center p-10"><Spinner /></div>;
  if (svc.error || cfg.error || !service || !settings) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <ErrorState
          message={svc.error || cfg.error || 'Could not load this service'}
          onRetry={() => { svc.reload(); cfg.reload(); }}
        />
      </div>
    );
  }

  if (!service.isAvailable) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Alert>This service is currently unavailable.</Alert>
        <p className="mt-4"><Link className="underline" to="/services">Back to services</Link></p>
      </div>
    );
  }

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    try {
      const res = await api.post('/coupons/validate', { code, amount: service.basePrice });
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

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!date) errs.date = 'Choose a date';
    else if (!dateOk) errs.date = `Choose a date between ${today} and ${maxDate}`;
    if (dateOk && !slot) errs.slot = 'Choose a time slot';
    if (addressId === 'new') Object.assign(errs, validateAddress(addr));
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setServerError('');
    try {
      const payload = {
        serviceId, date, slot, paymentMethod: payment,
        ...(notes.trim() && { notes: notes.trim() }),
        ...(addressId === 'new' ? { address: cleanAddress(addr) } : { addressId }),
        ...(couponApplied && { couponCode: couponCode.trim() }),
      };
      const { data } = await api.post('/bookings', payload);
      clearHint(); // the calculator result belongs to this booking only
      navigate(`/customer/bookings/${data.data.booking._id}`, { state: { created: true } });
    } catch (err) {
      setServerError(err.response?.data?.errors?.[0]?.message || apiMessage(err));
      if (err.response?.status === 409) { setSlot(''); slots.reload(); }
    } finally {
      setBusy(false);
    }
  };

  const total = Math.max(0, (service.basePrice || 0) - discount);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-6 sm:mb-8">
        Book: {service.name}
      </h1>

      <form
        onSubmit={submit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] gap-5 sm:gap-6 lg:gap-8 items-start"
      >
        <div className="min-w-0 flex flex-col gap-4 sm:gap-5">
          {serverError && <Alert>{serverError}</Alert>}

          {/* Coupon box */}
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
            {couponMsg && (
              <p role="status" className={`text-sm mt-2 font-semibold ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {couponMsg}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-extrabold mb-4">1. Date and time</h2>
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
              <p className="mt-2 text-sm text-ink-muted">
                Enter a full date between {today} and {maxDate}.
              </p>
            )}
            {dateOk && (
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold text-ink-muted mb-2">Time slot</legend>
                {slots.loading && <p role="status" className="text-ink-muted">Checking availability...</p>}
                {slots.error && <p role="alert" className="text-red-800">{slots.error}</p>}
                {slots.data && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {slots.data.slots.map((s) => (
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
                {errors.slot && <p className="mt-2 text-sm text-red-700">{errors.slot}</p>}
              </fieldset>
            )}
          </Card>

          <Card className="p-4 sm:p-6 rounded-2xl border border-line shadow-sm">
            <h2 className="text-xl font-extrabold mb-4">2. Service address</h2>
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

          <Card>
            <h2 className="text-lg sm:text-xl font-extrabold mb-4 tracking-tight">3. Notes and payment</h2>

            {showHint && (
              <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-brand/20 bg-brand-tint p-3 text-sm">
                <p className="text-brand-dark">
                  <strong>From your AC calculator:</strong> {hint.text}
                </p>
                <button
                  type="button"
                  onClick={() => { setNotes((n) => (n === hint.text ? '' : n)); clearHint(); setHint(null); }}
                  className="shrink-0 font-semibold text-brand underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            )}

            <label htmlFor="notes" className="block text-sm font-semibold text-ink-muted mb-1">
              Notes for the technician (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] border border-[#AEB9B6] bg-white mb-4"
            />
            <p className="-mt-3 mb-4 text-right text-xs text-ink-muted">{notes.length}/500</p>

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
              {payment === 'online' && service.pricingType === 'estimate' && (
                <p className="text-sm text-ink-muted">You will pay online after the job, once the final amount is confirmed.</p>
              )}
            </fieldset>
          </Card>
        </div>

        {/* Right side: booking summary */}
        <Card className="p-5 sm:p-6 rounded-2xl border border-line shadow-sm lg:sticky lg:top-6">
          <h2 className="text-xl font-extrabold mb-5 pb-3 border-b border-line">Booking summary</h2>
          <p className="font-semibold">{service.name}</p>
          <p className="text-ink-muted mb-3">{service.pricingType === 'fixed' ? 'Fixed price' : 'Estimated price'}</p>

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-600">Original Amount:</span>
            <span className="font-semibold">{inr(service.basePrice)}</span>
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

          {service.pricingType === 'estimate' && (
            <p className="text-sm text-ink-muted mb-3">Your technician confirms the final amount after the job.</p>
          )}
          <p className="text-sm text-ink-muted mb-4">
            Free cancellation until {settings.cancellation.freeHoursBefore} hours before your slot. After that a {settings.cancellation.feePercent}% fee applies.
          </p>

          {/* Frequently bought together */}
          {related.data?.items?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-muted mb-3">
                Frequently Bought Together
              </h3>
              <div className="flex flex-col gap-2">
                {related.data.items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 p-2 rounded-lg border border-line bg-gray-50">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                    ) : (
                      <div className="w-10 h-10 bg-brand-tint rounded-md flex items-center justify-center text-brand-dark text-xs">?</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-ink-muted">{inr(item.basePrice)}</p>
                    </div>
                    <Link
                      to={`/customer/book/${item._id}`}
                      className="text-xs font-bold text-brand underline shrink-0 bg-white px-2 py-1 rounded border border-brand/20 hover:bg-brand-tint"
                    >
                      Book
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full min-h-[48px] justify-center rounded-xl mt-4"
            disabled={busy || (payment === 'cod' && !settings.codEnabled) || (payment === 'online' && !settings.onlineEnabled)}
          >
            {busy ? 'Booking...' : 'Confirm booking'}
          </Button>
        </Card>
      </form>
    </div>
  );
}