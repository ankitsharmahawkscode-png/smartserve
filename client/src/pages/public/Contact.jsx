import { useState } from 'react';
import api from '../../api/client.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Textarea } from '../../components/Fields.jsx';
import { company } from '../../content.js';
import useSeo from '../../hooks/useSeo.js';
export default function Contact() {
  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    website: '',
  });
useSeo({ title: 'Contact us', description: `Questions about a service or a booking? Send ${company.name} a message and we will reply by email.`, path: '/contact' });
  const [errs, setErrs] = useState({});
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAction();

  const set = (k) => (e) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));

    setErrs((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

    if (sent) setSent(false);
  };

  const submit = async (e) => {
    e.preventDefault();

    const x = {};

    if (f.name.trim().length < 2) {
      x.name = 'Enter your name';
    }

    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) {
      x.email = 'Enter a valid email address';
    }

    if (
      f.phone.trim() &&
      !/^\+?[0-9\s-]{10,15}$/.test(f.phone.trim())
    ) {
      x.phone = 'Enter a valid phone number';
    }

    if (f.message.trim().length < 10) {
      x.message = 'Please write at least 10 characters';
    }

    setErrs(x);

    if (Object.keys(x).length) return;

    const body = {
      name: f.name.trim(),
      email: f.email.trim(),
      message: f.message.trim(),
      website: f.website,
      ...(f.phone.trim() && { phone: f.phone.trim() }),
    };

    if (await run(() => api.post('/contact', body))) {
      setSent(true);
      setF({
        name: '',
        email: '',
        phone: '',
        message: '',
        website: '',
      });
      setErrs({});
    }
  };

  const details = [
    {
      label: 'Phone',
      value: company.phone,
      href: company.phone ? `tel:${company.phone}` : undefined,
      description: 'Give us a call',
      icon: 'phone',
    },
    {
      label: 'WhatsApp',
      value: company.whatsapp,
      href: company.whatsapp
        ? `https://wa.me/${company.whatsapp.replace(/\D/g, '')}`
        : undefined,
      description: 'Message us directly',
      icon: 'whatsapp',
    },
    {
      label: 'Email',
      value: company.email,
      href: company.email ? `mailto:${company.email}` : undefined,
      description: 'Send us an email',
      icon: 'email',
    },
    {
      label: 'Address',
      value: company.address,
      description: 'Our location',
      icon: 'location',
    },
    {
      label: 'Business hours',
      value: company.hours,
      description: 'When we are available',
      icon: 'clock',
    },
  ].filter((item) => item.value);

  const Icon = ({ type }) => {
    const paths = {
      phone: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372a1.5 1.5 0 0 0-1.276-1.483l-4.423-.632a1.5 1.5 0 0 0-1.516.653l-.97 1.293a1.5 1.5 0 0 1-1.606.546 12.035 12.035 0 0 1-7.214-7.214 1.5 1.5 0 0 1 .546-1.606l1.293-.97a1.5 1.5 0 0 0 .653-1.516l-.632-4.423A1.5 1.5 0 0 0 5.122 2.5H3.75A1.5 1.5 0 0 0 2.25 4v2.75Z"
        />
      ),
      whatsapp: (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.7a8.5 8.5 0 1 1 16.3-3.8Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7.5c.3-.5.6-.5 1-.5h.4c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .4-.1.6l-.6.7c-.2.2-.2.4 0 .7.5.9 1.3 1.6 2.2 2.1.3.2.5.2.7-.1l.8-1c.2-.2.4-.2.7-.1l1.8.9c.3.1.4.3.4.5 0 .3-.1 1.1-.6 1.6-.5.5-1.2.8-2 .7-1.1-.1-2.5-.7-4-2-1.3-1.1-2.2-2.5-2.5-3.5-.3-1 .1-1.8.5-2.4Z"
          />
        </>
      ),
      email: (
        <>
          <rect
            width="18"
            height="14"
            x="3"
            y="5"
            rx="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m3 7 9 6 9-6"
          />
        </>
      ),
      location: (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
          />
          <circle cx="12" cy="10" r="2.5" />
        </>
      ),
      clock: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 7v5l3 2"
          />
        </>
      ),
    };

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        aria-hidden="true"
      >
        {paths[type]}
      </svg>
    );
  };

  return (
    <main className="w-full overflow-hidden">
      {/* Page Header */}
      <section className="bg-brand-tint">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">
              Contact
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-3">
              Let&apos;s talk
            </h1>

            <p className="text-base sm:text-lg text-ink-muted mt-4 leading-relaxed">
              Have a question about a service, need help with a booking,
              or want to learn more about {company.name}? We&apos;re here
              to help. Send us a message and we&apos;ll reply by email.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start">
          {/* Contact Form */}
          <Card className="min-w-0 p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold">
                Send us a message
              </h2>

              <p className="text-sm sm:text-base text-ink-muted mt-2">
                Fill out the form below and tell us how we can help.
              </p>
            </div>

            {sent && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-brand/20
                  bg-brand-tint p-4 text-brand-dark"
              >
                <p className="font-extrabold">
                  Thank you for contacting us!
                </p>

                <p className="text-sm mt-1">
                  Your message has been sent. We&apos;ll get back to you
                  as soon as possible.
                </p>
              </div>
            )}

            <form
              onSubmit={submit}
              noValidate
              className="flex flex-col gap-4 sm:gap-5"
            >
              {error && <Alert>{error}</Alert>}

              <Input
                label="Your name"
                autoComplete="name"
                value={f.name}
                onChange={set('name')}
                error={errs.name}
              />

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                value={f.email}
                onChange={set('email')}
                error={errs.email}
              />

              <Input
                label="Phone number (optional)"
                type="tel"
                autoComplete="tel"
                value={f.phone}
                onChange={set('phone')}
                error={errs.phone}
              />

              <div>
                <Textarea
                  label="Your message"
                  rows={5}
                  maxLength={2000}
                  value={f.message}
                  onChange={set('message')}
                  error={errs.message}
                />

                <p className="text-xs text-ink-muted text-right mt-1">
                  {f.message.length}/2000 characters
                </p>
              </div>

              {/* Honeypot field for spam protection */}
              <div
                aria-hidden="true"
                className="absolute left-[-9999px] h-0 overflow-hidden"
              >
                <label>
                  Leave this empty
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={f.website}
                    onChange={set('website')}
                  />
                </label>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full sm:w-auto min-h-[46px]"
                >
                  {busy ? 'Sending message...' : 'Send message'}
                </Button>
              </div>

              <p className="text-xs text-ink-muted leading-relaxed">
                Please provide a valid email address so we can respond
                to your enquiry.
              </p>
            </form>
          </Card>

          {/* Contact Details */}
          <aside className="flex flex-col gap-5">
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl font-extrabold">
                Get in touch
              </h2>

              <p className="text-sm text-ink-muted mt-2 mb-5 leading-relaxed">
                Choose your preferred way to contact our team.
              </p>

              {details.length === 0 ? (
                <p className="text-ink-muted leading-relaxed">
                  Use the contact form and we&apos;ll reply to your email.
                </p>
              ) : (
                <dl className="flex flex-col divide-y divide-line">
                  {details.map((item) => (
                    <div
                      key={item.label}
                      className="flex gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div
                        className="shrink-0 w-10 h-10 rounded-xl bg-brand-tint
                          text-brand-dark flex items-center justify-center"
                      >
                        <Icon type={item.icon} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <dt className="text-sm font-bold">
                          {item.label}
                        </dt>

                        <dd className="text-sm text-ink-muted mt-1 break-words">
                          {item.href ? (
                            <a
                              href={item.href}
                              target={
                                item.icon === 'whatsapp'
                                  ? '_blank'
                                  : undefined
                              }
                              rel={
                                item.icon === 'whatsapp'
                                  ? 'noopener noreferrer'
                                  : undefined
                              }
                              className="underline underline-offset-2
                                hover:text-brand-dark
                                focus:outline-none focus-visible:ring-2
                                focus-visible:ring-brand rounded"
                            >
                              {item.value}
                            </a>
                          ) : (
                            item.value
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </Card>

            {/* Helpful Information */}
            <Card className="p-4 sm:p-6 bg-brand-tint">
              <div
                className="w-11 h-11 rounded-xl bg-white text-brand-dark
                  flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.6 9a2.5 2.5 0 1 1 4.4 1.6c-1.2 1-2 1.4-2 3"
                  />
                  <path
                    strokeLinecap="round"
                    d="M12 17h.01"
                  />
                </svg>
              </div>

              <h3 className="font-extrabold text-lg">
                How can we help?
              </h3>

              <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                Contact us about service availability, booking questions,
                payment options, or general enquiries. Including relevant
                details in your message helps us understand your request.
              </p>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}