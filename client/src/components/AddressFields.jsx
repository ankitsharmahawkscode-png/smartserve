import Input from './Input.jsx';

export const EMPTY_ADDRESS = { label: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export function validateAddress(a) {
  const e = {};
  if (a.line1.trim().length < 3) e.line1 = 'Enter the address line';
  if (a.city.trim().length < 2) e.city = 'Enter the city';
  if (!/^\d{6}$/.test(a.pincode.trim())) e.pincode = 'Pincode must be 6 digits';
  return e;
}

// Removes empty optional fields so the API's validation accepts the payload.
export function cleanAddress(a) {
  return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]).filter(([, v]) => v !== ''));
}

export default function AddressFields({ value, onChange, errors = {} }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input className="sm:col-span-2" label="Address line" value={value.line1} onChange={set('line1')} error={errors.line1} autoComplete="address-line1" />
      <Input className="sm:col-span-2" label="Apartment or landmark (optional)" value={value.line2} onChange={set('line2')} autoComplete="address-line2" />
      <Input label="City" value={value.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
      <Input label="State (optional)" value={value.state} onChange={set('state')} autoComplete="address-level1" />
      <Input label="Pincode" inputMode="numeric" maxLength={6} value={value.pincode} onChange={set('pincode')} error={errors.pincode} autoComplete="postal-code" />
    </div>
  );
}