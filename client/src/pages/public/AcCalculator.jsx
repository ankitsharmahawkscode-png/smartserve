import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';
import LinkButton from '../../components/LinkButton.jsx';
import Input from '../../components/Input.jsx';
import { Select, Checkbox } from '../../components/Fields.jsx';

// ===== EDIT THESE =====
const AC_PATH = '/services?q=AC'; // where "Book an AC service" goes. Use your AC category page if you prefer, e.g. /category/ac-repair
// ======================

// ===== Calculation settings (rule-of-thumb values for Indian homes) =====
const BTU_PER_SQFT = 100;     // base cooling needed per sq ft
const BTU_PER_TON = 12000;    // 1 ton of cooling = 12,000 BTU/hr
const SIZES = [1, 1.5, 2, 2.5, 3];
const TOLERANCE = 0.95;       // accept a size that is up to 5% under the exact need
const TOP_FLOOR_FACTOR = 1.15;
const BTU_PER_EXTRA_PERSON = 600; // beyond the first 2 people
const SQM_TO_SQFT = 10.7639;
const MIN_SQFT = 25;
const MAX_SQFT = 1500;
// =========================================================================

const CEILING = [
  { value: 'standard', label: 'Standard (up to 10 ft / 3 m)', factor: 1 },
  { value: 'high', label: 'High (10 to 12 ft / 3 to 3.7 m)', factor: 1.1 },
  { value: 'very-high', label: 'Very high (above 12 ft / 3.7 m)', factor: 1.2 },
];
const SUN = [
  { value: 'low', label: 'Low: shaded, few or no sunny windows', factor: 0.95 },
  { value: 'medium', label: 'Medium: some direct sun', factor: 1 },
  { value: 'high', label: 'High: big sunny or west-facing windows', factor: 1.1 },
];
const HEAT = [
  { value: 'none', label: 'None', btu: 0 },
  { value: 'some', label: 'A TV and a laptop or computer', btu: 1200 },
  { value: 'many', label: 'Several computers or equipment', btu: 3000 },
  { value: 'kitchen', label: 'Kitchen or cooking area', btu: 4000 },
];
const by = (list) => Object.fromEntries(list.map((x) => [x.value, x]));
const CEILING_BY = by(CEILING);
const SUN_BY = by(SUN);
const HEAT_BY = by(HEAT);

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const plain = (v) => (Math.round(v / 50) * 50).toLocaleString('en-IN');
const signed = (v) => {
  const r = Math.round(v / 50) * 50;
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toLocaleString('en-IN')}`;
};

// Largest room (sq ft) a given size covers in normal conditions
const maxArea = (size) => Math.floor((size * BTU_PER_TON) / BTU_PER_SQFT / TOLERANCE / 5) * 5;
const toSqm = (sqft) => Math.round(sqft / SQM_TO_SQFT);
const TABLE = SIZES.map((size, i) => ({
  size,
  from: i === 0 ? null : maxArea(SIZES[i - 1]) + 1,
  to: maxArea(size),
}));

function estimate({ sqft, ceiling, sun, top, people, heat }) {
  const base = sqft * BTU_PER_SQFT;
  const afterCeiling = base * CEILING_BY[ceiling].factor;
  const afterSun = afterCeiling * SUN_BY[sun].factor;
  const afterTop = afterSun * (top ? TOP_FLOOR_FACTOR : 1);
  const peopleBtu = Math.max(0, people - 2) * BTU_PER_EXTRA_PERSON;
  const heatBtu = HEAT_BY[heat].btu;
  const total = afterTop + peopleBtu + heatBtu;
  const tons = total / BTU_PER_TON;

  const lines = [
    ['Room size', base],
    ['Ceiling height', afterCeiling - base],
    ['Sunlight', afterSun - afterCeiling],
    ['Top floor or roof heat', afterTop - afterSun],
    [`Extra people (${Math.max(0, people - 2)} beyond 2)`, peopleBtu],
    ['Heat from appliances', heatBtu],
  ].filter(([, v], i) => i === 0 || Math.round(v / 50) !== 0);

  let size = SIZES.find((s) => s >= tons * TOLERANCE);
  let count = 1;
  if (!size) {
    count = Math.ceil(tons / SIZES[SIZES.length - 1]);
    size = SIZES.find((s) => s >= (tons / count) * TOLERANCE) || SIZES[SIZES.length - 1];
  }
  return { total, tons, size, count, lines };
}

const FAQS = [
  {
    q: 'How many tons of AC do I need for my room?',
    a: `It depends mainly on room size. As a rough guide, up to ${TABLE[0].to} sq ft needs 1 ton, ${TABLE[1].from} to ${TABLE[1].to} sq ft needs 1.5 ton and ${TABLE[2].from} to ${TABLE[2].to} sq ft needs 2 ton. Sunlight, ceiling height, the number of people and heat-producing appliances can push you up to the next size, which is what this calculator checks.`,
  },
  {
    q: 'Is a 1.5 ton AC enough for a 200 sq ft room?',
    a: `Usually not. A 1.5 ton AC suits rooms up to about ${TABLE[1].to} sq ft in normal conditions. For 200 sq ft, a 2 ton AC is the safer choice, especially if the room gets direct sun.`,
  },
  {
    q: 'What does "ton" mean for an AC?',
    a: 'It is a measure of cooling power, not weight. One ton of cooling is about 12,000 BTU per hour, which is the amount of heat the AC can remove from the room each hour.',
  },
  {
    q: 'Is a bigger AC always better?',
    a: 'No. An AC that is too big cools the room in short bursts and then switches off, which wastes power and can leave the air feeling damp. One that is too small runs all day and still struggles on hot afternoons. The right size is the one that matches the room.',
  },
  {
    q: 'Should I buy an inverter AC?',
    a: 'An inverter AC changes its compressor speed to hold the set temperature instead of switching fully on and off, so it usually uses less electricity when it runs for many hours a day. It costs more to buy, so the saving depends on how much you use it.',
  },
  {
    q: 'Does the star rating matter?',
    a: 'A higher star rating means the AC is more energy efficient, which lowers the electricity bill over time. It also costs more upfront, so compare the extra price with how many hours you use the AC.',
  },
  {
    q: 'How can I book an AC technician?',
    a: 'Open our services page, choose the AC service you need, pick a time slot and confirm. You can pay online or in cash where it is offered.',
  },
];

const TIPS = [
  { icon: '📏', title: 'Measure the room, not the flat', text: 'Use the size of the room the AC will cool, and keep its door closed when it runs.' },
  { icon: '❄️', title: 'Pick a good indoor spot', text: 'Place the indoor unit where air can flow across the room, away from direct sun and furniture.' },
  { icon: '🔧', title: 'Get it fitted properly', text: 'Pipe length, drain slope and a firm stand decide how well it cools and whether it leaks.' },
  { icon: '🧼', title: 'Service before summer', text: 'Clean filters and coils help the AC cool better and avoid breakdowns in peak heat.' },
];

const REASONS = [
  {
    tone: 'border-amber-200 bg-amber-50',
    title: 'Too small',
    text: 'The AC runs all day and never reaches the set temperature. The compressor works harder, bills go up, and it wears out sooner.',
  },
  {
    tone: 'border-sky-200 bg-sky-50',
    title: 'Too big',
    text: 'The room cools quickly, then the AC switches off before it removes the humidity. It cycles on and off and wastes power and money.',
  },
];

const Seg = ({ label, value, onChange, options }) => (
  <div role="group" aria-label={label} className="inline-flex rounded-full border border-line-strong bg-white p-1">
    {options.map(([v, l]) => (
      <button
        key={v}
        type="button"
        aria-pressed={value === v}
        onClick={() => onChange(v)}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          value === v ? 'bg-brand text-white' : 'text-ink-muted hover:bg-gray-50'
        }`}
      >
        {l}
      </button>
    ))}
  </div>
);

export default function AcCalculator() {
  const [unit, setUnit] = useState('ft');
  const [mode, setMode] = useState('dims');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [area, setArea] = useState('');
  const [ceiling, setCeiling] = useState('standard');
  const [sun, setSun] = useState('medium');
  const [top, setTop] = useState(false);
  const [people, setPeople] = useState('2');
  const [heat, setHeat] = useState('none');

  useSeo({
    title: 'AC Tonnage Calculator: Find the Right AC Size for Your Room',
    description:
      'Free AC tonnage calculator. Enter your room size, sunlight and number of people to find out if you need a 1, 1.5 or 2 ton AC.',
    path: '/ac-tonnage-calculator',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'AC Tonnage Calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
      ],
    },
  });

  // ----- room size in square feet -----
  let sqft = mode === 'dims' ? num(length) * num(width) : num(area);
  if (unit === 'm') sqft *= SQM_TO_SQFT;
  const entered = mode === 'dims' ? length !== '' && width !== '' : area !== '';
  const valid = sqft >= MIN_SQFT && sqft <= MAX_SQFT;
  const peopleN = Math.min(20, Math.max(1, parseInt(people, 10) || 1));

  const result = useMemo(
    () => (valid ? estimate({ sqft, ceiling, sun, top, people: peopleN, heat }) : null),
    [valid, sqft, ceiling, sun, top, peopleN, heat]
  );

  const sizeError =
    entered && !valid
      ? sqft < MIN_SQFT
        ? 'That looks too small. Please check the numbers.'
        : 'That is a very large space. Please contact us for a site visit.'
      : '';

  // Convert the typed values when the unit is switched
  const switchUnit = (next) => {
    if (next === unit) return;
    const k = next === 'm' ? 0.3048 : 1 / 0.3048;
    const conv = (v, f) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? String(Math.round(n * f * 10) / 10) : v;
    };
    setLength(conv(length, k));
    setWidth(conv(width, k));
    setArea(conv(area, k * k));
    setUnit(next);
  };

  const reset = () => {
    setLength('');
    setWidth('');
    setArea('');
    setCeiling('standard');
    setSun('medium');
    setTop(false);
    setPeople('2');
    setHeat('none');
  };

  const label = result ? `${result.count > 1 ? `${result.count} × ` : ''}${result.size} ton` : '';
  const shareText = result
    ? `My room is about ${Math.round(sqft)} sq ft and the calculator suggests a ${label} AC. Check yours: ${
        typeof window !== 'undefined' ? window.location.href : ''
      }`
    : '';

  const u = unit === 'ft' ? 'ft' : 'm';

  return (
    <main className="bg-white pb-20">
      {/* Hero */}
      <section className="bg-brand-tint">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">Free tool</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">AC Tonnage Calculator</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Find the right AC size for your room in under a minute. Enter your room size, sunlight and the number of
            people, and we will suggest 1, 1.5 or 2 ton and more.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">Your room</h2>
              <Seg label="Unit" value={unit} onChange={switchUnit} options={[['ft', 'Feet'], ['m', 'Metres']]} />
            </div>

            <div className="mb-4">
              <Seg
                label="How to enter the size"
                value={mode}
                onChange={setMode}
                options={[['dims', 'Length × Width'], ['area', 'Total area']]}
              />
            </div>

            {mode === 'dims' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={`Length (${u})`}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder={unit === 'ft' ? 'e.g. 14' : 'e.g. 4.3'}
                />
                <Input
                  label={`Width (${u})`}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder={unit === 'ft' ? 'e.g. 12' : 'e.g. 3.7'}
                />
              </div>
            ) : (
              <Input
                label={unit === 'ft' ? 'Room area (sq ft)' : 'Room area (sq m)'}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={unit === 'ft' ? 'e.g. 168' : 'e.g. 15'}
              />
            )}

            {valid && (
              <p className="mt-2 text-sm text-ink-muted">
                Room size: <strong className="text-[#111]">{Math.round(sqft)} sq ft</strong> ({toSqm(sqft)} sq m)
              </p>
            )}
            {sizeError && (
              <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
                {sizeError}{' '}
                {sqft > MAX_SQFT && (
                  <Link to="/contact" className="underline">Contact us</Link>
                )}
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Select label="Ceiling height" value={ceiling} onChange={(e) => setCeiling(e.target.value)}>
                {CEILING.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Select label="Sunlight in the room" value={sun} onChange={(e) => setSun(e.target.value)}>
                {SUN.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Input
                label="People who usually use the room"
                type="number"
                min="1"
                max="20"
                inputMode="numeric"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
              <Select label="Heat from appliances" value={heat} onChange={(e) => setHeat(e.target.value)}>
                {HEAT.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </Select>
            </div>

            <div className="mt-4">
              <Checkbox
                label="Top floor, or the roof is directly above the room"
                checked={top}
                onChange={(e) => setTop(e.target.checked)}
              />
            </div>

            <button
              type="button"
              onClick={reset}
              className="mt-5 text-sm font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
            >
              Reset
            </button>
          </div>

          {/* Result */}
          <aside className="lg:sticky lg:top-24" aria-live="polite">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <div className="bg-brand-dark px-5 py-3 text-xs font-bold uppercase tracking-widest text-white/80">
                Your result
              </div>

              {result ? (
                <div className="p-5 sm:p-6">
                  <p className="text-sm font-semibold text-ink-muted">Recommended AC size</p>
                  <p className="mt-1 text-5xl font-extrabold text-brand-dark">{label}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {result.count > 1
                      ? `Your room needs about ${result.tons.toFixed(1)} ton of cooling, which is more than one standard AC. Two units of ${result.size} ton each would suit it, or ask us about a site visit.`
                      : `Your room needs about ${result.tons.toFixed(2)} ton (${plain(result.total)} BTU/hr) of cooling. The nearest standard size is ${result.size} ton.`}
                  </p>

                  <div className="mt-5 rounded-xl bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">How we got this</p>
                    <ul className="space-y-1.5 text-sm">
                      {result.lines.map(([name, v], i) => (
                        <li key={name} className="flex items-baseline justify-between gap-3">
                          <span className="text-gray-700">{name}</span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {i === 0 ? plain(v) : signed(v)}
                          </span>
                        </li>
                      ))}
                      <li className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
                        <span className="font-bold">Cooling needed (BTU/hr)</span>
                        <span className="font-extrabold tabular-nums">{plain(result.total)}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 [&_a]:w-full [&_a]:justify-center">
                    <LinkButton to={AC_PATH}>Book an AC service</LinkButton>
                    <LinkButton to="/contact" variant="secondary">Ask our team</LinkButton>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[44px] items-center justify-center rounded-full border border-line-strong text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Share on WhatsApp
                    </a>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                    This is an estimate. Heavy sun, many windows or unusual rooms can change the right size, so ask a
                    technician if you are unsure.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl" aria-hidden="true">
                    ❄️
                  </div>
                  <p className="font-bold text-[#111]">Enter your room size</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Your recommended AC size appears here as soon as you add the length and width.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Chart */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6" aria-labelledby="size-chart">
        <h2 id="size-chart" className="text-2xl font-extrabold sm:text-3xl">AC size chart by room size</h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          A quick guide for a normal room with 2 people, average sunlight and a standard ceiling. Use the calculator
          above for your own room.
        </p>

        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-gray-50 text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">AC size</th>
                <th scope="col" className="px-4 py-3 font-bold">Room size (sq ft)</th>
                <th scope="col" className="px-4 py-3 font-bold">Room size (sq m)</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map((r) => (
                <tr key={r.size} className="border-t border-line">
                  <td className="px-4 py-3 font-extrabold text-brand-dark">{r.size} ton</td>
                  <td className="px-4 py-3">{r.from ? `${r.from} to ${r.to}` : `Up to ${r.to}`}</td>
                  <td className="px-4 py-3">{r.from ? `${toSqm(r.from)} to ${toSqm(r.to)}` : `Up to ${toSqm(r.to)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Wall-mounted split ACs are most common in 1, 1.5 and 2 ton sizes. Larger rooms often use a floor-standing or
          cassette AC, or two units.
        </p>
      </section>

      {/* Why it matters */}
      <section className="mx-auto mt-14 max-w-5xl px-4 sm:px-6" aria-labelledby="why-size">
        <h2 id="why-size" className="text-2xl font-extrabold sm:text-3xl">Why the right size matters</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {REASONS.map((r) => (
            <div key={r.title} className={`rounded-xl border p-5 ${r.tone}`}>
              <h3 className="text-lg font-extrabold">{r.title}</h3>
              <p className="mt-2 leading-relaxed text-gray-700">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="mx-auto mt-14 max-w-5xl px-4 sm:px-6" aria-labelledby="ac-tips">
        <h2 id="ac-tips" className="text-2xl font-extrabold sm:text-3xl">Tips for a cooler room</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {TIPS.map((t) => (
            <div key={t.title} className="flex gap-4 rounded-xl border border-line p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xl" aria-hidden="true">
                {t.icon}
              </span>
              <div>
                <h3 className="font-bold">{t.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it is calculated */}
      <section className="mx-auto mt-14 max-w-3xl px-4 sm:px-6">
        <details className="group rounded-xl border border-line bg-white px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
            How is this calculated?
            <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
            <p>One ton of AC cooling is {BTU_PER_TON.toLocaleString('en-IN')} BTU per hour. We start with {BTU_PER_SQFT} BTU for every square foot of floor area.</p>
            <p>
              We then adjust for ceiling height (up to +{Math.round((CEILING_BY['very-high'].factor - 1) * 100)}%), sunlight
              ({Math.round((SUN_BY.low.factor - 1) * 100)}% to +{Math.round((SUN_BY.high.factor - 1) * 100)}%) and a top-floor
              room (+{Math.round((TOP_FLOOR_FACTOR - 1) * 100)}%). We add {BTU_PER_EXTRA_PERSON} BTU for each person beyond two,
              and extra for heat from appliances or a kitchen.
            </p>
            <p>Finally we pick the nearest standard AC size, allowing it to be up to 5% below the exact need.</p>
          </div>
        </details>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-14 max-w-3xl px-4 sm:px-6" aria-labelledby="ac-faq">
        <h2 id="ac-faq" className="mb-5 text-center text-2xl font-extrabold sm:text-3xl">Frequently asked questions</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 pr-6 leading-relaxed text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-5 text-center text-sm">
          <Link to="/faq" className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark">
            More questions about booking and payments →
          </Link>
        </p>
      </section>

      {/* Final call to action */}
      <section className="mx-auto mt-14 max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl bg-brand-dark px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Need an AC technician?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Pick a time slot that suits you and book online. We will confirm your booking and send a technician.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row [&_a]:justify-center">
            <LinkButton to={AC_PATH}>Book an AC service</LinkButton>
            <LinkButton to="/contact" variant="secondary">Contact us</LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}