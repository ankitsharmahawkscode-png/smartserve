
import { Link } from 'react-router-dom';
import { company } from '../content.js';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-white mt-16">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-12 pb-8">

        {/* Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Company Information */}
          <div>
            <Link
              to="/"
              className="inline-block text-2xl font-extrabold tracking-tight no-underline text-white"
            >
              {company.name}
            </Link>

            <p className="mt-4 text-sm leading-7 text-white/75">
              {company.tagline}
            </p>

            <p className="mt-3 text-sm leading-6 text-white/65">
              We are committed to providing reliable, high-quality services
              with a focus on customer satisfaction, trust, and long-term
              relationships.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-gray-900 no-underline transition hover:bg-gray-200"
              >
                Get in Touch
              </Link>

              <Link
                to="/services"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-white/10"
              >
                Our Services
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links">
            <h2 className="text-lg font-bold mb-5">
              Quick Links
            </h2>

            <ul className="space-y-3 text-sm text-white/75">
              <li>
                <Link
                  to="/"
                  className="inline-block no-underline transition hover:text-white hover:translate-x-1"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="inline-block no-underline transition hover:text-white hover:translate-x-1"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="inline-block no-underline transition hover:text-white hover:translate-x-1"
                >
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="inline-block no-underline transition hover:text-white hover:translate-x-1"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="inline-block no-underline transition hover:text-white hover:translate-x-1"
                >
                  Log In
                </Link>
              </li>
            </ul>
          </nav>

          {/* Services */}
                  {/* Services */}
          <div>
            <h2 className="text-lg font-bold mb-5">
              What We Offer
            </h2>

          <ul className="space-y-3 text-sm text-white/75">
  <li>
    <Link to="/what-we-offer" className="no-underline transition hover:text-white">
      Professional Services
    </Link>
  </li>
  <li>
    <Link to="/customized-solutions" className="no-underline transition hover:text-white">
      Customized Solutions
    </Link>
  </li>
  <li>
    <Link to="/customer-support" className="no-underline transition hover:text-white">
      Customer Support
    </Link>
  </li>
  <li>
    <Link to="/consultation" className="no-underline transition hover:text-white">
      Consultation
    </Link>
  </li>
</ul>

            <div className="mt-6 border-l-2 border-white/30 pl-4">
              <p className="text-sm font-semibold">
                Need assistance?
              </p>
              <p className="mt-1 text-sm leading-6 text-white/65">
                Our team is here to help you find the right solution.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-bold mb-5">
              Contact Information
            </h2>

            <ul className="space-y-4 text-sm text-white/75">
              {company.phone && (
                <li className="flex items-start gap-3">
                  <span className="text-white/90" aria-hidden="true">
                    ☎
                  </span>
                  <div>
                    <p className="font-semibold text-white">
                      Call Us
                    </p>
                    <a
                      href={`tel:${company.phone}`}
                      className="mt-1 inline-block break-words text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                      {company.phone}
                    </a>
                  </div>
                </li>
              )}

              {company.email && (
                <li className="flex items-start gap-3">
                  <span className="text-white/90" aria-hidden="true">
                    ✉
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      Email Us
                    </p>
                    <a
                      href={`mailto:${company.email}`}
                      className="mt-1 inline-block break-all text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                      {company.email}
                    </a>
                  </div>
                </li>
              )}

              {company.address && (
                <li className="flex items-start gap-3">
                  <span className="text-white/90" aria-hidden="true">
                    ⌖
                  </span>
                  <div>
                    <p className="font-semibold text-white">
                      Visit Us
                    </p>
                    <p className="mt-1 leading-6">
                      {company.address}
                    </p>
                  </div>
                </li>
              )}

              {company.hours && (
                <li className="flex items-start gap-3">
                  <span className="text-white/90" aria-hidden="true">
                    ◷
                  </span>
                  <div>
                    <p className="font-semibold text-white">
                      Business Hours
                    </p>
                    <p className="mt-1 leading-6">
                      {company.hours}
                    </p>
                  </div>
                </li>
              )}

              {!company.phone &&
                !company.email &&
                !company.address && (
                  <li>
                    <p className="leading-6">
                      Have a question? We would love to hear from you.
                    </p>
                    <Link
                      to="/contact"
                      className="mt-2 inline-block text-white underline underline-offset-4 hover:text-white/70"
                    >
                      Send us a message
                    </Link>
                  </li>
                )}
            </ul>
          </div>
        </div>

        {/* Trust / Information Strip */}
        <div className="mt-12 border-t border-white/15 pt-6">
          <div className="grid grid-cols-1 gap-5 text-center sm:grid-cols-3 sm:text-left">
            <div>
              <p className="text-sm font-semibold text-white">
                Quality First
              </p>
              <p className="mt-1 text-xs leading-5 text-white/60">
                A commitment to quality in everything we do.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Customer Focused
              </p>
              <p className="mt-1 text-xs leading-5 text-white/60">
                Your needs and satisfaction matter to us.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Here to Help
              </p>
              <p className="mt-1 text-xs leading-5 text-white/60">
                Get in touch whenever you need assistance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-5">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">

            <p className="text-xs leading-5 text-white/60">
              &copy; {currentYear} {company.name}. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/65">
              <Link
                to="/privacy"
                className="no-underline transition hover:text-white"
              >
                Privacy Policy
              </Link>

              <Link
                to="/terms"
                className="no-underline transition hover:text-white"
              >
                Terms & Conditions
              </Link>

              <Link
                to="/contact"
                className="no-underline transition hover:text-white"
              >
                Support
              </Link>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}