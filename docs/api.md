# REST API reference

Base URL: `/api/v1`. All bodies are JSON.

## Conventions

- **Success:** `{ "success": true, "data": ..., "message": "..." }`
- **Error:** `{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }`
- **Lists** return `data: { items, total, page, limit, pages }` and accept `?page=` and `?limit=` (limit up to 100).
- **Auth:** send `Authorization: Bearer <accessToken>`. The refresh token lives in an httpOnly cookie.
- **Status codes:** 400 validation, 401 not logged in, 403 wrong role, 404 not found (also used for records that belong to someone else), 409 conflict or invalid state, 429 rate limited.

## Authentication

| Method and path | Who | Notes |
|---|---|---|
| POST `/auth/register` | public | `{ name, email, phone?, password }`; always creates a customer |
| POST `/auth/login` | public | `{ email, password }`; locks the account for 15 minutes after 5 failures |
| POST `/auth/refresh` | cookie | rotates the refresh token, returns a new access token |
| POST `/auth/logout` | cookie | revokes the refresh token |
| GET `/auth/me` | any user | current user |

## Public

| Method and path | Notes |
|---|---|
| GET `/health` | liveness check |
| GET `/categories` | active categories |
| GET `/services` | `?category=<slug>&q=<text>&available=true` |
| GET `/services/:id` | service details |
| GET `/services/:id/slots?date=YYYY-MM-DD` | slots with `available` and `reason` |
| GET `/services/:id/reviews` | visible reviews and `summary: { average, count }` |
| GET `/settings/public` | slots, cancellation policy, whether cash and online payment are enabled |
| POST `/contact` | `{ name, email, phone?, message }`; limited to 5 per hour per IP |
| POST `/payments/webhook` | Razorpay only, verified by signature |

## Any logged-in user

| Method and path | Notes |
|---|---|
| GET, PUT `/me` | profile (`name`, `phone`) |
| PUT `/me/password` | `{ currentPassword, newPassword }`; signs out every device |
| POST `/me/addresses` | add an address |
| PUT, DELETE `/me/addresses/:addressId` | edit or remove |

## Customer

| Method and path | Notes |
|---|---|
| POST `/bookings` | `{ serviceId, date, slot, addressId or address, notes?, paymentMethod }` |
| GET `/bookings` | own bookings, `?status=` |
| GET `/bookings/:id` | own booking with technician name and phone |
| PATCH `/bookings/:id/cancel` | `{ reason? }`; fee applies inside the policy window |
| POST `/payments/order` | `{ bookingId }`; the server decides the amount |
| POST `/payments/verify` | Razorpay checkout result; verified on the server |
| GET `/payments/mine` | own payments |
| POST `/reviews` | `{ bookingId, rating, comment? }`; completed bookings only, once |
| GET `/reviews/mine` | own reviews and completed bookings still to review |

## Technician

| Method and path | Notes |
|---|---|
| GET `/tech/jobs` | active jobs; `?scope=history` for completed and cancelled |
| GET `/tech/jobs/:id` | only your own jobs |
| PATCH `/tech/jobs/:id/respond` | `{ accept: boolean, reason? }` |
| PATCH `/tech/jobs/:id/status` | `{ status: IN_PROGRESS or COMPLETED, finalPrice? }` |
| GET `/tech/earnings` | totals and recent completed jobs |
| PUT `/tech/availability` | `{ isAvailable }` |

## Administrator

| Method and path | Notes |
|---|---|
| GET `/admin/stats` | dashboard numbers and the 7-day chart |
| GET, POST `/admin/categories` | list, create |
| PUT, DELETE `/admin/categories/:id` | a category with services cannot be deleted |
| GET, POST `/admin/services` | list (`?category=&q=&isAvailable=`), create |
| PUT, DELETE `/admin/services/:id` | a service with bookings cannot be deleted |
| GET `/admin/bookings` | `?status=&date=&technician=&q=` |
| GET `/admin/bookings/:id` | booking with its audit trail |
| PATCH `/admin/bookings/:id/approve` | Pending to Confirmed |
| PATCH `/admin/bookings/:id/assign` | `{ technicianId }`; 409 if the technician is busy in that slot |
| PATCH `/admin/bookings/:id/cancel` | `{ reason }` (required) |
| GET, POST `/admin/technicians` | list (`?assignable=true`), create |
| PATCH `/admin/technicians/:id` | name, phone, skills, commission, availability, active |
| GET `/admin/customers` | `?q=` |
| PATCH `/admin/customers/:id/status` | `{ isActive }` |
| GET `/admin/payments` | `?status=&provider=&refundDue=true` |
| POST `/admin/payments/:id/refund` | refunds paid amount minus cancellation fee |
| GET `/admin/reviews` | `?hidden=true|false` |
| PATCH `/admin/reviews/:id` | `{ isHidden }` |
| GET `/admin/messages` | contact form messages |
| GET `/admin/audit` | `?area=booking|payment|review|auth` |
| GET, PUT `/admin/settings` | booking rules and cancellation policy |

## Booking status transitions

```
PENDING --approve--> CONFIRMED --assign--> ASSIGNED --accept--> ACCEPTED --start--> IN_PROGRESS --complete--> COMPLETED
ASSIGNED --reject--> CONFIRMED
PENDING | CONFIRMED | ASSIGNED | ACCEPTED --cancel--> CANCELLED
```
Any other change returns 409.