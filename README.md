# Technical Workers: service booking platform

A full-stack web application where customers book home services (AC repair, plumbing, electrical, cleaning, appliance repair), administrators assign technicians and manage the business, and technicians work their jobs.

## Features

- **Customers:** browse and search services, pick a date and time slot, book with a saved address, pay online (Razorpay) or in cash, cancel under the cancellation policy, review completed jobs, manage profile and addresses.
- **Technicians:** see assigned jobs, accept or reject, move jobs through In progress and Completed, see history and earnings, set availability.
- **Administrators:** dashboard and charts, manage categories, services, customers, technicians, bookings (approve, assign, cancel), payments and refunds, reviews, contact messages, an activity log and platform settings.
- **Platform:** role-based access enforced on the server, double-booking protection in the database, a booking status state machine, payment verification on the server, email notifications, audit logging.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Tailwind CSS, Context API, Recharts |
| Backend | Node.js 20, Express, Mongoose, JWT (access token plus httpOnly refresh cookie), bcrypt, Zod |
| Database | MongoDB (Atlas) |
| Payments | Razorpay (test mode) |
| Email | Nodemailer (any SMTP, for example Brevo) |
| Tests | Jest, Supertest, mongodb-memory-server |
| Hosting | Vercel (frontend), Render (API), MongoDB Atlas |

## Quick start

Requires Node 20 or newer and a MongoDB database (a free Atlas cluster is fine).

```bash
npm run install:all
cp server/.env.example server/.env      # then edit MONGO_URI and the secrets
cp client/.env.example client/.env
npm --prefix server run seed:admin       # creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm --prefix server run seed:demo        # optional: sample services and a demo technician
npm run dev:server                       # API on http://localhost:5000
npm run dev:client                       # app on http://localhost:5173
```

On Windows use `copy` instead of `cp`.

## Environment variables

Full list with comments: `server/.env.example`. The important ones:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | Database connection string (required in production) |
| `CLIENT_URL` | Exact address of the frontend, no trailing slash (required in production; used for CORS and the CSRF origin check) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Long random strings (required in production) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Online payments. Leave as placeholders to disable online payment |
| `SMTP_*`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | Email. Leave `SMTP_HOST` empty to print emails in the terminal |
| `TRUST_PROXY_HOPS`, `COOKIE_SAMESITE` | Deployment behind proxies, see `docs/deployment.md` |

Client: `VITE_API_URL` (default `http://localhost:5000/api/v1`; use `/api/v1` in production).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev:server` / `npm run dev:client` | Start the API / the frontend in development |
| `npm test` | Run the API test suite (about 99 tests) |
| `npm --prefix server run test:coverage` | Tests with a coverage report |
| `npm run build` | Production build of the frontend |
| `npm --prefix server run seed:admin` | Create the first administrator |
| `npm --prefix server run seed:demo` | Add sample categories, services and a demo technician |

The first test run downloads a temporary MongoDB. To use your own database, set `TEST_MONGO_URI` to a database whose name contains `test` (it is emptied between tests).

## Project structure

```
client/                React app
  src/pages/           public, customer, technician, admin pages
  src/components/      shared UI (buttons, forms, dialogs, tables helpers)
  src/content.js       company name, contact details, About text
server/
  src/models/          Mongoose models
  src/controllers/     request handlers
  src/services/        business logic (bookings, payments, email, notifications)
  src/routes/          route tables and role gates
  src/middleware/      auth, validation, security, error handling
  tests/               Jest suites
docs/                  requirements, schema, API, security, deployment, demo script
render.yaml            Render blueprint for the API
```

## Documentation

- [Requirements and scope](docs/requirements.md)
- [Database schema](docs/schema.md)
- [REST API reference](docs/api.md)
- [Business rules and security](docs/security-and-rules.md)
- [Deployment guide](docs/deployment.md)
- [Demo script and acceptance checklist](docs/demo-script.md)

## Accounts after seeding

| Role | Login |
|---|---|
| Administrator | `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` |
| Technician (demo) | `technician@example.com` / `Tech12345` (change it, or deactivate this account, before going live) |
| Customer | Register on the site |