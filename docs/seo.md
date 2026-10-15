# Search engine optimisation

## What the site does automatically
- Every page sets its own title, description, canonical address and preview image (`client/src/hooks/useSeo.js`).
- Service pages publish structured data (Service, price in INR, breadcrumbs). A star rating is included only when real, visible reviews exist.
- The Home page publishes business details from `client/src/content.js`. Empty fields are left out, never invented.
- Dashboards, login, register and password pages are marked `noindex`. The dashboards are also blocked in `robots.txt`.
- `/sitemap.xml` lists the home, services, about and contact pages, every active category and every available service. It refreshes itself (cached for 10 minutes). `/robots.txt` points to it.
- Built files are cached for a year, and images below the first screen load lazily, which helps page speed.

## After you deploy
1. Open `https://your-site/sitemap.xml` and `https://your-site/robots.txt`. Both should show content.
2. Add the site to **Google Search Console** and submit `https://your-site/sitemap.xml`.
3. Test one service page with Google's **Rich Results Test** and check the Service and breadcrumb data is detected.
4. Share a link on WhatsApp. It should show the logo card and the site title.
5. Optional: set `VITE_SITE_URL` on Vercel to the live address so the static preview image uses it (Vercel usually fills this in itself).

## What matters most for ranking
- **Google Business Profile** (free) is the biggest lever for local home services. Add the real address or service area, phone, hours, photos and ask customers for reviews.
- Give each service a unique description of 2 to 4 sentences, a real photo, and honest pricing. Duplicate or empty descriptions rank poorly.
- Fill in the phone, email, address, hours and service area in `client/src/content.js`.

## Known limits
- Google runs JavaScript and reads these tags. Apps such as WhatsApp and Facebook do not, so a shared link to one service shows the general site preview, not that service. Fixing it needs a small server-side function on Vercel, which is a possible follow-up.
- Crawlers cannot press "Load more services", so the sitemap is what lets them find every service.
- Nobody can promise a ranking. These steps make the site easy for search engines to read.