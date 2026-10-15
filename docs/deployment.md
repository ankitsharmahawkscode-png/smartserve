# Deployment guide

Architecture: **Vercel** serves the React app and forwards `/api/*` to **Render**, which runs the API against **MongoDB Atlas**. Because the browser only ever talks to the Vercel address, login cookies are first-party and work in every browser, including Safari and iPhone.

## 1. Database (Atlas)

1. Use your existing cluster, but create a separate database for production, for example `smartserve_prod`, by putting that name in the connection string: `mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/smartserve_prod?retryWrites=true&w=majority`.
2. Under **Network Access** allow `0.0.0.0/0` (Render's free plan has no fixed IP address).
3. Use a database user with a strong password.

## 2. API on Render

1. Push the repository to GitHub.
2. In Render choose **New**, then **Blueprint**, and select the repository. Render reads `render.yaml`.
3. Fill in the secrets it asks for: `MONGO_URI`, `RAZORPAY_*`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL`. Leave `CLIENT_URL` empty for now.
4. After the first deploy, open `https://<your-service>.onrender.com/api/v1/health`. It should return `"status":"ok"`.

## 3. Frontend on Vercel

1. Edit `client/vercel.json` and replace `technical-workers-api.onrender.com` (in the first rewrite) with your Render address. Commit and push.
2. In Vercel choose **Add New Project**, import the repository, and set **Root Directory** to `client`. The framework is detected as Vite.
3. Add the environment variable `VITE_API_URL` with the value `/api/v1`.
4. Deploy, then copy the address Vercel gives you, for example `https://technical-workers.vercel.app`.

## 4. Connect the two

1. In Render set `CLIENT_URL` to the exact Vercel address: no trailing slash, and the same spelling the browser shows. A mismatch makes session refresh return 403.
2. Redeploy the API (Manual Deploy, then Deploy latest commit).

## 5. Create the first admin and sample data

Run these once from your computer, pointing at the production database. PowerShell:

```powershell
$env:MONGO_URI = "mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/smartserve_prod?retryWrites=true&w=majority"
$env:ADMIN_EMAIL = "owner@yourdomain.com"
$env:ADMIN_PASSWORD = "a-strong-password-1"
npm --prefix server run seed:admin
npm --prefix server run seed:demo
```

Environment variables you set in the shell win over `server/.env`. For a live launch, deactivate or change the demo technician (`technician@example.com`).

## 6. Razorpay webhook

In the Razorpay dashboard (Test Mode) open **Webhooks**, add `https://<your-service>.onrender.com/api/v1/payments/webhook` (the Render address, not the Vercel one), set the secret to your `RAZORPAY_WEBHOOK_SECRET`, and tick `payment.captured` and `order.paid`. The webhook is a safety net for payments where the customer closes the browser right after paying.

## 7. Keep the free API awake

Render's free plan sleeps after 15 minutes without traffic, and the first request afterwards can take up to a minute. Add a free monitor (for example UptimeRobot) that requests `https://<your-service>.onrender.com/api/v1/health` every 5 minutes.

## 8. Check it works

1. Open the Vercel address: the home page lists services.
2. Register a customer and log in. Refresh the page: you stay logged in.
3. Book a service, then approve and assign it as admin, and complete it as the technician.
4. Pay a booking online with a Razorpay test card and confirm it shows as paid.
5. Open the browser console on the payment page: the report-only Content-Security-Policy should show no violations. If it is clean, rename the header in `client/vercel.json` from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.

## Settings reference

| Setup | `TRUST_PROXY_HOPS` | `COOKIE_SAMESITE` |
|---|---|---|
| Vercel proxies `/api` to Render (this guide) | 2 | lax |
| Frontend and API on sibling subdomains of one domain | 1 | lax |
| Frontend and API on unrelated domains (not recommended: Safari blocks the cookie) | 1 | none |

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| The API crashes at start with "Missing required environment variables" | `MONGO_URI`, `CLIENT_URL` or a JWT secret is not set on Render |
| Logged out on every page refresh, 403 on `/auth/refresh` | `CLIENT_URL` does not exactly match the Vercel address |
| Everyone is rate limited at once | `TRUST_PROXY_HOPS` is 1 while Vercel is proxying; set it to 2 |
| Online payment says "not available" | Razorpay keys are missing or still the placeholder values |
| First request is very slow | The free Render service was asleep (see step 7) |