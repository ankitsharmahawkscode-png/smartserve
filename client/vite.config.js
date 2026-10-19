import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // 👈 PWA Import

// Absolute address of the live site, used for the share image in index.html.
// Set VITE_SITE_URL on Vercel, or rely on Vercel's automatic production domain.
const siteUrl = (process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')).replace(/\/+$/, '');
const siteUrlInHtml = { name: 'site-url-in-html', transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl) };

export default defineConfig({
  plugins: [
    react(), 
    siteUrlInHtml,
    
    // 👇 PWA Plugin Add kiya
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-512.png', 'logo-icon.png'],
      manifest: {
        name: 'SmartServe',
        short_name: 'SmartServe',
        description: 'Home services, booked online in minutes.',
        theme_color: '#1D4ED8', // Aapka brand color
        background_color: '#F6F8FB',
        display: 'standalone', // App ki tarah khulega
        start_url: '/',
        icons: [
          {
            src: 'icon-512.png', // Aapke public folder me pehle se hai
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo.png', // Fallback icon
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Offline support
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      }
    })
  ],
  server: {
    port: 5173,
    // So http://localhost:5173/sitemap.xml and /robots.txt work in development too.
    proxy: {
      '/sitemap.xml': { target: 'http://localhost:5000', rewrite: () => '/api/v1/seo/sitemap.xml' },
      '/robots.txt': { target: 'http://localhost:5000', rewrite: () => '/api/v1/seo/robots.txt' },
    },
  },
});