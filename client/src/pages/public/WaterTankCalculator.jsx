import { useState } from 'react';
import ToolShell from '../../components/ToolShell.jsx';
import Input from '../../components/Input.jsx';
import { Select } from '../../components/Fields.jsx';

const PLUMBER_PATH = '/services?q=plumb';
const SIZES = [500, 750, 1000, 1500, 2000, 3000, 5000, 10000]; // common tank sizes in litres
const PRESETS = [['Economical', 100], ['Standard', 135], ['Generous', 200]];

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const L = (n) => `${Math.round(n).toLocaleString('en-IN')} L`;

const FAQS = [
  {
    q: 'How much water does one person use in a day?',
    a: 'It varies with habits and the house, but 100 to 200 litres per person per day is a common planning range for homes, and 135 litres is often used as a standard figure. Use a higher number if you have a garden, a washing machine or a lot of guests.',
  },
  {
    q: 'How many days of water should the tank hold?',
    a: 'One day of storage is the minimum. If your supply is irregular or you want a buffer for a missed supply day, choose 1.5 or 2 days.',
  },
  {
    q: 'Is a bigger tank always better?',
    a: 'Not always. Water that sits for days can go stale, and a large tank needs a stronger roof or a bigger space. Match the size to your real use and clean the tank regularly.',
  },
  {
    q: 'Where should the tank be placed?',
    a: 'A roof tank gives pressure without a pump, while an underground sump holds more and needs a pump. The tank needs a firm, level base, shade if possible, and easy access for cleaning. A plumber can check the load and the pipe layout for your home.',
  },
  {
    q: 'How often should I clean my water tank?',
    a: 'Cleaning it about every six months is a common recommendation, and more often if the water looks cloudy or smells.',
  },
];

export default function WaterTankCalculator() {
  const [people, setPeople] = useState('4');
  const [lpcd, setLpcd] = useState('135');
  const [storeDays, setStoreDays] = useState('1');

  const p = clamp(Math.round(num(people)), 0, 500);
  const l = clamp(num(lpcd), 20, 500);
  const dd = num(storeDays);
  const ready = p >= 1 && l > 0 && dd > 0;

  const daily = p * l;
  const need = daily * dd;
  const size = SIZES.find((s) => s >= need);
  const biggest = SIZES[SIZES.length - 1];
  const multi = ready && !size ? Math.ceil(need / biggest) : 0;
  const cubicFeet = need / 28.317;

  return (
    <ToolShell
      seo={{
        title: 'Water Tank Size Calculator: How Many Litres Do You Need?',
        description:
          'Free water tank size calculator. Enter the number of people and your daily use to find the right tank capacity for your home.',
        path: '/water-tank-calculator',
      }}
      title="Water Tank Size Calculator"
      intro="Find out how many litres of storage your home needs, and which standard tank size to choose."
      faqs={FAQS}
      cta={{
        title: 'Need a tank fitted or cleaned?',
        text: 'Book a plumber for tank fitting, pipe work and cleaning.',
        label: 'Book a plumber',
        to: PLUMBER_PATH,
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-xl font-extrabold">Your home</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="People in the house" type="number" min="1" max="500" inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value)} />
            <Select label="Days of storage" value={storeDays} onChange={(e) => setStoreDays(e.target.value)}>
              <option value="1">1 day</option>
              <option value="1.5">1.5 days</option>
              <option value="2">2 days</option>
            </Select>
          </div>

          <div className="mt-4">
            <Input label="Water used per person per day (litres)" type="number" min="20" max="500" inputMode="numeric" value={lpcd} onChange={(e) => setLpcd(e.target.value)} />
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Typical usage">
              {PRESETS.map(([name, v]) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={String(v) === String(lpcd)}
                  onClick={() => setLpcd(String(v))}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                    String(v) === String(lpcd) ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink-muted hover:border-brand'
                  }`}
                >
                  {name} ({v} L)
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24" aria-live="polite">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="bg-brand-dark px-5 py-3 text-xs font-bold uppercase tracking-widest text-white/80">Your result</div>

            {ready ? (
              <div className="p-5 sm:p-6">
                <p className="text-sm font-semibold text-ink-muted">Recommended tank</p>
                <p className="mt-1 text-5xl font-extrabold text-brand-dark">
                  {size ? L(size) : `${multi} × ${L(biggest)}`}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {size
                    ? `Your home needs about ${L(need)} of storage. ${L(size)} is the nearest standard size above that.`
                    : `Your home needs about ${L(need)}, which is more than one standard tank. Use ${multi} tanks, or ask a plumber about a larger underground tank.`}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase text-ink-muted">Use per day</dt>
                    <dd className="mt-1 font-extrabold">{L(daily)}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase text-ink-muted">Storage needed</dt>
                    <dd className="mt-1 font-extrabold">{L(need)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-ink-muted">
                  That is about {cubicFeet.toFixed(1)} cubic feet, or {(need / 1000).toFixed(2)} cubic metres.
                </p>

                <div className="mt-5 overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-ink-muted">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-bold">Tank</th>
                        <th scope="col" className="px-3 py-2 font-bold">Suits about</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZES.map((s) => (
                        <tr key={s} className={`border-t border-line ${s === size ? 'bg-[#fff8eb] font-bold' : ''}`}>
                          <td className="px-3 py-2">{L(s)}{s === size && ' ✓'}</td>
                          <td className="px-3 py-2">{Math.max(0, Math.floor(s / (l * dd)))} people</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                  This is a planning estimate. Roof strength, space and your local supply also matter, so ask a plumber before you buy.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl" aria-hidden="true">💧</div>
                <p className="font-bold">Enter the number of people</p>
                <p className="mt-1 text-sm text-ink-muted">Your recommended tank size appears here.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </ToolShell>
  );
}