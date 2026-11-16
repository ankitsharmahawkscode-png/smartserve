import { useMemo, useState } from 'react';
import ToolShell from '../../components/ToolShell.jsx';
import Input from '../../components/Input.jsx';
import { Select } from '../../components/Fields.jsx';
import { inr } from '../../utils/format.js';

// ===== Estimate settings (typical values, change them here) =====
const AC_PATH = '/services?q=AC';
const KW_PER_TON = 3.517; // cooling power of 1 ton
const DUTY = 0.7;         // the compressor does not run at full power all the time
const TYPES = [
  { value: 'old', label: 'Non-inverter, 3 star', eff: 3.0 },
  { value: 'inv3', label: 'Inverter, 3 star', eff: 4.0 },
  { value: 'inv5', label: 'Inverter, 5 star', eff: 5.0 },
];
const TONS = ['0.75', '1', '1.5', '2', '2.5'];
// ================================================================

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const perHour = (type, tons) => ((tons * KW_PER_TON) / type.eff) * DUTY; // units (kWh) per hour

const FAQS = [
  {
    q: 'How much electricity does a 1.5 ton AC use?',
    a: `A 1.5 ton AC uses about ${perHour(TYPES[2], 1.5).toFixed(1)} to ${perHour(TYPES[0], 1.5).toFixed(1)} units (kWh) for every hour it runs, depending on whether it is an inverter model and its star rating. Once the room is cool it uses less, so the real figure depends on the weather and how you use it.`,
  },
  {
    q: 'Is an inverter AC worth the extra price?',
    a: 'An inverter AC changes its compressor speed instead of switching fully on and off, so it usually uses less power when it runs for many hours a day. It costs more to buy. Compare the monthly cost in the calculator with the price difference to see how long it takes to pay back.',
  },
  {
    q: 'What electricity rate should I enter?',
    a: 'Divide the total amount on your last bill by the units used to get your average rate per unit. Tariffs differ between states and change with the slab, so using your own average gives the best estimate.',
  },
  {
    q: 'How can I lower my AC bill?',
    a: 'Set the temperature to a comfortable 24 to 26 degrees instead of the lowest setting, clean the filters regularly, close doors and windows, run a ceiling fan with the AC, and service the unit before summer.',
  },
  {
    q: 'Why is my real bill higher than the estimate?',
    a: 'Common reasons are dirty filters or coils, low refrigerant from a gas leak, a room that gets a lot of sun, doors left open, or an old compressor. A service often brings the bill down.',
  },
];

export default function AcBillCalculator() {
  const [tons, setTons] = useState('1.5');
  const [count, setCount] = useState('1');
  const [type, setType] = useState('inv3');
  const [hours, setHours] = useState('8');
  const [days, setDays] = useState('30');
  const [rate, setRate] = useState('8');

  const tonN = num(tons);
  const h = clamp(num(hours), 0, 24);
  const d = clamp(num(days), 0, 31);
  const r = clamp(num(rate), 0, 50);
  const n = clamp(Math.round(num(count)), 0, 20);
  const ready = h > 0 && d > 0 && r > 0 && n >= 1;

  const rows = useMemo(
    () =>
      TYPES.map((tp) => {
        const units = perHour(tp, tonN) * h * d * n;
        return { ...tp, units, cost: units * r };
      }),
    [tonN, h, d, n, r]
  );

  const current = rows.find((x) => x.value === type);
  const best = rows.find((x) => x.value === 'inv5');
  const save = current.cost - best.cost;
  const maxCost = Math.max(...rows.map((x) => x.cost), 1);

  return (
    <ToolShell
      seo={{
        title: 'AC Electricity Bill Calculator: Monthly AC Running Cost',
        description:
          'Free AC electricity bill calculator. Enter your AC size, type, daily hours and your rate per unit to see the monthly cost.',
        path: '/ac-electricity-bill-calculator',
      }}
      title="AC Electricity Bill Calculator"
      intro="See roughly what your air conditioner costs to run each month, and how much an inverter or a higher star rating could save."
      faqs={FAQS}
      cta={{
        title: 'Bill too high?',
        text: 'A service can bring it down. Book an AC technician for cleaning, a gas check and a full inspection.',
        label: 'Book an AC service',
        to: AC_PATH,
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Inputs */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-xl font-extrabold">Your AC</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="AC size (tons)" value={tons} onChange={(e) => setTons(e.target.value)}>
              {TONS.map((t) => <option key={t} value={t}>{t} ton</option>)}
            </Select>
            <Select label="AC type and rating" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Input label="Number of ACs" type="number" min="1" max="20" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
            <Input label="Hours used per day" type="number" min="1" max="24" step="any" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
            <Input label="Days used per month" type="number" min="1" max="31" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
            <Input label="Electricity rate (₹ per unit)" type="number" min="1" max="50" step="any" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Tip: divide your last bill by the units used to find your own rate per unit.
          </p>
        </div>

        {/* Result */}
        <aside className="lg:sticky lg:top-24" aria-live="polite">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="bg-brand-dark px-5 py-3 text-xs font-bold uppercase tracking-widest text-white/80">Estimated cost</div>

            {ready ? (
              <div className="p-5 sm:p-6">
                <p className="text-sm font-semibold text-ink-muted">Per month</p>
                <p className="mt-1 text-5xl font-extrabold text-brand-dark">{inr(Math.round(current.cost))}</p>
                <p className="mt-2 text-sm text-ink-muted">
                  About {Math.round(current.units)} units, using {n} {n === 1 ? 'AC' : 'ACs'}.
                </p>

                <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase text-ink-muted">Per day</dt>
                    <dd className="mt-1 font-extrabold">{inr(Math.round(current.cost / d))}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase text-ink-muted">Per hour</dt>
                    <dd className="mt-1 font-extrabold">{inr(Math.round(current.cost / (d * h)))}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase text-ink-muted">4 months</dt>
                    <dd className="mt-1 font-extrabold">{inr(Math.round(current.cost * 4))}</dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-muted">Same use, different AC</p>
                  <ul className="space-y-3">
                    {rows.map((x) => (
                      <li key={x.value}>
                        <div className="mb-1 flex justify-between gap-2 text-sm">
                          <span className={x.value === type ? 'font-bold text-brand-dark' : 'text-gray-700'}>{x.label}</span>
                          <span className="shrink-0 font-semibold tabular-nums">{inr(Math.round(x.cost))}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${x.value === type ? 'bg-brand' : 'bg-gray-300'}`}
                            style={{ width: `${Math.max(4, (x.cost / maxCost) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {save > 50 && (
                    <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-800">
                      A 5 star inverter could save about {inr(Math.round(save))} a month with this use.
                    </p>
                  )}
                </div>

                <p className="mt-5 text-xs leading-relaxed text-ink-muted">
                  This is an estimate from typical efficiency figures. Your real bill depends on the weather, room, age of the AC and your tariff slabs.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl" aria-hidden="true">⚡</div>
                <p className="font-bold">Fill in all the fields</p>
                <p className="mt-1 text-sm text-ink-muted">Your estimated monthly cost appears here.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <details className="group mx-auto mt-10 max-w-3xl rounded-xl border border-line px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
          How is this calculated?
          <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
          <p>Cooling power is {KW_PER_TON} kW per ton. We divide it by the AC's efficiency ({TYPES.map((t) => `${t.eff} for ${t.label.toLowerCase()}`).join(', ')}) to get the power it draws.</p>
          <p>We assume the compressor works at about {Math.round(DUTY * 100)}% of full power on average, then multiply by hours per day, days per month, the number of ACs and your rate per unit.</p>
        </div>
      </details>
    </ToolShell>
  );
}