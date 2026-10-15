# Business rules and security controls

## Business rules from the brief

| # | Rule | Enforced by | Tested in |
|---|---|---|---|
| 1 | Customers cannot reach admin or technician features | `protect` and `authorize(role)` on every router | `rbac-matrix.test.js` |
| 2 | Only available services can be booked | `getBookableService` in `booking.service.js` | `booking.test.js` |
| 3 | No conflicting bookings for one technician and slot | Partial unique index `{technician, date, slot}` where `holdsSlot` is true | `booking.test.js` (conflicts) |
| 4 | A technician cannot see another technician's jobs | Every job lookup filters on `technician = me` | `booking.test.js` (isolation) |
| 5 | Status changes follow valid transitions | `bookingStatus.js` plus an atomic compare-and-set update | `booking.test.js` (state machine, lifecycle) |
| 6 | Only completed bookings can be reviewed, once, by the owner | `review.controller.js` and a unique index on `booking` | `payments.test.js` (reviews) |
| 7 | Payment verified on the backend | HMAC signature check plus a provider lookup of order and amount, in `payment.service.js` | `payments.test.js` |
| 8 | No sensitive data in responses | `select: false` fields and the `toJSON` transform on `User` | `auth.test.js`, `security.test.js` |
| 9 | Important actions validated and logged | Zod validators, plus `AuditLog` written for bookings, payments, reviews and security events | `booking.test.js`, `security.test.js` |
| 10 | Errors are handled gracefully | One error handler returns `{ success: false, message, errors[] }`; the client shows loading, error and empty states | `security.test.js` |

## Security controls

- Passwords hashed with bcrypt (12 rounds); minimum 8 characters with a letter and a number.
- Short-lived access token (15 minutes, kept in memory) and a rotating refresh token in an httpOnly cookie. Re-using an old refresh token revokes all sessions.
- Account lockout: 5 failed logins lock the account for 15 minutes. Wrong password, unknown email and locked account return the same message.
- Changing a password signs out every device (`tokenVersion` plus wiped refresh tokens).
- Role and active status are read from the database on every request.
- MongoDB operator keys (`$...`, `a.b`) are rejected in query, body and params.
- Cookie endpoints (`/auth/refresh`, `/auth/logout`) refuse requests from any origin except `CLIENT_URL`.
- Rate limits: 600 requests per 15 minutes overall, 120 writes per 5 minutes, 30 login or register attempts per 15 minutes, 10 password changes per 15 minutes.
- Helmet headers, CORS limited to the frontend, `Cache-Control: no-store` on all API responses, 1 MB body limit.
- Prices and payment amounts are always computed on the server.

## Known limitations

- **Slot capacity** is checked by counting bookings, so two simultaneous requests can briefly exceed it. A technician still cannot be double-booked, because the database index blocks it.
- **Rate-limit counters** live in memory, which is fine for one server instance. Use a shared store such as Redis before running several instances.
- **Lockout trade-off:** someone who knows an email address can keep that account locked by repeating failed logins.
- **No forgot-password or email verification yet.**
- **React Router advisory** (GHSA-337j-9hxr-rhxg) affects server-side rendering only, which this app does not use.
- **Razorpay webhook** can only be tested end to end after deployment or through a tunnel.