# SmartServe

Service booking and management platform. React + Vite + Tailwind (client), Node + Express + MongoDB (server).

## Prerequisites
Node 20+, MongoDB (local or Atlas).

## Setup
```bash
npm run install:all
cp server/.env.example server/.env     # fill in secrets
cp client/.env.example client/.env
npm run dev:server    # http://localhost:5000/api/v1/health
npm run dev:client    # http://localhost:5173
npm test              # API tests
```

## Structure
- `client/` React app (layouts, routes, shared UI in `components/ui.jsx`, API client in `api/`)
- `server/` Express API (`routes`, `controllers`, `services`, `models`, `validators`, `middleware`)
- `docs/` requirements, schema, API contract, wireframes

## Conventions
- API base `/api/v1`; responses `{ success, data, message }` or `{ success:false, message, errors[] }`.
- Authorization is enforced on the backend (`protect`, `authorize`); client route guards are UX only.
- Design tokens live in `client/tailwind.config.js`.

## Roadmap
See `docs/` for milestones. Milestone 2 adds auth, RBAC and user models.

## Deployment (planned)
Client on Vercel, server on Render, database on MongoDB Atlas. Steps added in the final milestone.
