import { useEffect } from 'react';
import { company } from '../content.js';

export const DEFAULT_TITLE = `${company.name} | Home services booked online`;
export const DEFAULT_DESCRIPTION = 'Book AC repair, plumbing, electrical, cleaning and appliance repair online. Choose a time slot, track your technician and pay in cash or online.';

// Shortens text for descriptions: collapses whitespace and cuts at a word boundary.
export const clip = (text = '', max = 155) => {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, '')}...`;
};

const ensure = (selector, make) => {
  let el = document.head.querySelector(selector);
  if (!el) { el = make(); document.head.appendChild(el); }
  return el;
};
const setMeta = (attr, name, content) => {
  ensure(`meta[${attr}="${name}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, name); return m; }).setAttribute('content', content);
};
const absolute = (value, origin) => (/^https?:\/\//i.test(value) ? value : `${origin}${value.startsWith('/') ? '' : '/'}${value}`);

export function applySeo({ title, description, path, image, noindex = false, jsonLd } = {}) {
  const origin = window.location.origin;
  const url = `${origin}${path ?? window.location.pathname}`;
  const fullTitle = title ? (title.includes(company.name) ? title : `${title} | ${company.name}`) : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const img = absolute(image || '/og-image.png', origin);

  document.title = fullTitle;
  setMeta('name', 'description', desc);
  setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  ensure('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }).setAttribute('href', url);

  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:site_name', company.name);
  setMeta('property', 'og:locale', 'en_IN');
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', img);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', img);

  // Structured data for search engines. An array becomes one @graph.
  const old = document.getElementById('seo-jsonld');
  if (old) old.remove();
  if (jsonLd) {
    const data = Array.isArray(jsonLd)
      ? { '@context': 'https://schema.org', '@graph': jsonLd.map(({ '@context': _ignored, ...rest }) => rest) }
      : jsonLd;
    const script = document.createElement('script');
    script.id = 'seo-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c'); // cannot break out of the script tag
    document.head.appendChild(script);
  }
}

// Call once per page. Re-applies whenever the options change.
export default function useSeo(options) {
  const key = JSON.stringify(options || {});
  useEffect(() => { applySeo(options); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}