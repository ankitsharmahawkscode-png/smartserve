import { Card } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import { about, company } from '../../content.js';
import useSeo from '../../hooks/useSeo.js';
const BENEFITS = [
  {
    number: '01',
    title: 'Easy Online Booking',
    text: 'Find the service you need, choose a suitable time slot, and book without unnecessary hassle.',
  },
  {
    number: '02',
    title: 'Transparent Pricing',
    text: 'View service pricing before booking so you can make informed decisions about your home.',
  },
  {
    number: '03',
    title: 'Reliable Service Process',
    text: 'Follow your booking from confirmation to completion and stay informed throughout the process.',
  },
  {
    number: '04',
    title: 'Convenient Payments',
    text: 'Choose from the supported payment options and enjoy a more convenient service experience.',
  },
];

const PROCESS = [
  {
    step: '1',
    title: 'Choose a service',
    text: 'Explore available home services and find the right solution for your needs.',
  },
  {
    step: '2',
    title: 'Book your appointment',
    text: 'Select an available time slot and submit your booking online.',
  },
  {
    step: '3',
    title: 'Get your service',
    text: 'Follow your booking status, complete your payment, and share your feedback.',
  },
];

export default function About() {
  useSeo({ title: 'About us', description: about.intro, path: '/about' });
  return (
    <main className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="bg-brand-tint">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">
              About us
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mt-3">
              Welcome to {company.name}
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-ink-muted mt-5 leading-relaxed">
              {about.intro}
            </p>

            <p className="text-sm sm:text-base text-ink-muted mt-4 leading-relaxed">
              We make it easier to discover, book, and manage home services
              through a simple and convenient online experience.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
              <LinkButton to="/services">
                Explore our services
              </LinkButton>

              <LinkButton to="/contact" variant="secondary">
                Get in touch
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16"
        aria-labelledby="our-story"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-2">
              Who we are
            </p>

            <h2
              id="our-story"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight"
            >
              Making home services simpler for everyone
            </h2>

            <div className="w-16 h-1 rounded-full bg-brand mt-5 mb-6" />

            <div className="text-ink-muted leading-relaxed space-y-4">
              {about.story.map((paragraph, index) => (
                <p key={`${index}-${paragraph}`}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-brand-tint rounded-2xl p-5 sm:p-8 lg:p-9">
            <div
              className="w-14 h-14 rounded-2xl bg-white text-brand-dark
                flex items-center justify-center mb-5"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7"
                />
              </svg>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold mb-3">
              Your home, our priority
            </h3>

            <p className="text-ink-muted leading-relaxed">
              Finding help for everyday home needs should be straightforward.
              Our platform brings service discovery, appointment booking,
              booking updates, and payment options together in one place.
            </p>

            <p className="text-ink-muted leading-relaxed mt-4">
              Whether you need help with maintenance, repairs, or cleaning,
              we aim to make the process clear, convenient, and easy to manage.
            </p>

            {company.serviceArea && (
              <div className="mt-6 pt-5 border-t border-brand/15">
                <p className="text-sm font-semibold text-ink-muted">
                  Our service area
                </p>
                <p className="font-extrabold text-brand-dark mt-1">
                  {company.serviceArea}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section
        className="bg-gray-50"
        aria-labelledby="our-values"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-10">
            <p className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-2">
              What matters to us
            </p>

            <h2
              id="our-values"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
            >
              Our core values
            </h2>

            <p className="text-ink-muted mt-3 leading-relaxed">
              The principles that guide how we build our platform and serve
              our customers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {about.values.map(([title, text], index) => (
              <Card
                key={title}
                className="h-full transition-shadow hover:shadow-md"
              >
                <div
                  className="w-11 h-11 rounded-xl bg-brand-tint
                    flex items-center justify-center text-brand-dark
                    font-extrabold mb-4"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-brand">
                  {title}
                </h3>

                <p className="text-ink-muted mt-2 leading-relaxed">
                  {text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16"
        aria-labelledby="why-choose-us"
      >
        <div className="max-w-2xl mb-8 sm:mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-2">
            The difference
          </p>

          <h2
            id="why-choose-us"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
          >
            Why choose {company.name}?
          </h2>

          <p className="text-ink-muted mt-3 leading-relaxed">
            We focus on making each stage of the booking journey easier,
            from finding a service to reviewing the completed job.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {BENEFITS.map((benefit) => (
            <Card
              key={benefit.number}
              className="flex gap-4 h-full"
            >
              <div
                className="shrink-0 w-11 h-11 rounded-xl bg-brand-tint
                  text-brand-dark font-extrabold flex items-center
                  justify-center"
                aria-hidden="true"
              >
                {benefit.number}
              </div>

              <div className="min-w-0">
                <h3 className="font-extrabold text-lg">
                  {benefit.title}
                </h3>

                <p className="text-ink-muted mt-2 leading-relaxed">
                  {benefit.text}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        className="bg-brand-dark text-white"
        aria-labelledby="how-it-works"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">
              Getting started
            </p>

            <h2
              id="how-it-works"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
            >
              Simple from start to finish
            </h2>

            <p className="text-white/80 mt-3 leading-relaxed">
              Three simple steps help you get from choosing a service
              to managing your completed booking.
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {PROCESS.map((item) => (
              <li
                key={item.step}
                className="p-5 sm:p-6 rounded-2xl border
                  border-white/15 bg-white/5"
              >
                <span
                  className="flex items-center justify-center w-12 h-12
                    rounded-full bg-accent text-brand-dark
                    text-lg font-extrabold mb-5"
                  aria-hidden="true"
                >
                  {item.step}
                </span>

                <h3 className="text-lg sm:text-xl font-extrabold">
                  {item.title}
                </h3>

                <p className="text-white/80 mt-3 leading-relaxed">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="rounded-2xl sm:rounded-3xl bg-brand-tint px-5 py-9 sm:px-10 sm:py-12 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
            Let us help make life easier
          </h2>

          <p className="text-ink-muted mt-4 max-w-2xl mx-auto leading-relaxed">
            Discover the services available on our platform and find
            a convenient way to take care of your home service needs.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
            <LinkButton to="/services">
              Browse services
            </LinkButton>

            <LinkButton to="/contact" variant="secondary">
              Contact us
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}