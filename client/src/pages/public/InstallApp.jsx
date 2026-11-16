import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';
import { company } from '../../content.js';

const detect = () => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const ipad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || ipad) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
};

const STEPS = {
  android: {
    label: 'Android',
    note: 'Use Chrome or Samsung Internet.',
    steps: [
      'Open this website in Chrome.',
      'Tap the three-dot menu at the top right.',
      'Tap "Install app" or "Add to Home screen".',
      'Tap "Install". The icon appears on your home screen.',
    ],
  },
  ios: {
    label: 'iPhone / iPad',
    note: 'This only works in Safari.',
    steps: [
      'Open this website in Safari.',
      'Tap the Share button (the square with an arrow).',
      'Scroll down and tap "Add to Home Screen".',
      'Tap "Add". The icon appears on your home screen.',
    ],
  },
  desktop: {
    label: 'Computer',
    note: 'Use Chrome or Edge.',
    steps: [
      'Open this website in Chrome or Edge.',
      'Look for the install icon at the right end of the address bar, or open the browser menu.',
      'Choose "Install" (the menu may say "Install app" or "Save and share").',
      'Confirm. The app opens in its own window.',
    ],
  },
};

export default function InstallApp() {
  const [tab, setTab] = useState(detect());
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useSeo({
    title: `Install the ${company?.name || 'SmartServe'} app`,
    description: 'Add our website to your home screen and open it like an app in a few taps.',
    path: '/install',
  });

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    try {
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    } finally {
      setPromptEvent(null);
    }
  };

  const current = STEPS[tab];

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <p className="text-4xl" aria-hidden="true">📲</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Get the app on your phone</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Add {company?.name || 'our site'} to your home screen. It opens like an app, without the browser bars.
          </p>

          {installed ? (
            <p className="mx-auto mt-6 inline-block rounded-full bg-green-500/20 px-5 py-2 text-sm font-bold text-green-200">
              ✓ The app is already installed on this device
            </p>
          ) : promptEvent ? (
            <button
              type="button"
              onClick={install}
              className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-bold text-brand-dark transition hover:bg-gray-200"
            >
              Install now
            </button>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div role="tablist" aria-label="Choose your device" className="mb-6 flex flex-wrap justify-center gap-2">
          {Object.entries(STEPS).map(([key, v]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
                tab === key ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink-muted hover:border-brand'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="rounded-2xl border border-line p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">Install on {current.label}</h2>
          <p className="mt-1 text-sm text-ink-muted">{current.note}</p>
          <ol className="mt-5 space-y-4">
            {current.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-1 leading-relaxed text-gray-700">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['⚡', 'Quick to open', 'One tap from your home screen.'],
            ['🖥️', 'Full screen', 'No browser bars in the way.'],
            ['🔔', 'Always handy', 'Your bookings are always one tap away.'],
          ].map(([icon, title, text]) => (
            <div key={title} className="rounded-xl bg-gray-50 p-5 text-center">
              <p className="text-2xl" aria-hidden="true">{icon}</p>
              <p className="mt-2 font-bold">{title}</p>
              <p className="mt-1 text-sm text-ink-muted">{text}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted">
          You can also use the blue "Install App" button at the bottom of any page.{' '}
          <Link to="/help" className="font-semibold text-brand underline underline-offset-4">Need help?</Link>
        </p>
      </section>
    </main>
  );
}