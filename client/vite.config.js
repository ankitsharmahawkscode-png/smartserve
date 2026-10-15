import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Absolute address of the live site, used for the share image in index.html.
// Set VITE_SITE_URL on Vercel, or rely on Vercel's automatic production domain.
const siteUrl = (process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')).replace(/\/+$/, '');
const siteUrlInHtml = { name: 'site-url-in-html', transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl) };

export default defineConfig({
  plugins: [react(), siteUrlInHtml],
  server: {
    port: 5173,
    // So http://localhost:5173/sitemap.xml and /robots.txt work in development too.
    proxy: {
      '/sitemap.xml': { target: 'http://localhost:5000', rewrite: () => '/api/v1/seo/sitemap.xml' },
      '/robots.txt': { target: 'http://localhost:5000', rewrite: () => '/api/v1/seo/robots.txt' },
    },
  },
});