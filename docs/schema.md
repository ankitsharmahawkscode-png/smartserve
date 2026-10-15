# Database schema (MongoDB with Mongoose)

All collections have `createdAt` and `updatedAt` timestamps unless noted. Prices are in rupees.

## User
| Field | Notes |
|---|---|
| name, email (unique, lowercase), phone | |
| passwordHash | bcrypt, never returned (`select: false`) |
| role | `customer`, `technician` or `admin` (indexed) |
| isActive | deactivated users cannot log in or use existing tokens |
| addresses[] | label, line1, line2, city, state, pincode, isDefault |
| technician | skills[], isAvailable, commissionPct (technicians only) |
| refreshTokens[] | SHA-256 hashes of valid refresh tokens, newest 5, never returned |
| failedLogins, lockUntil | login lockout, never returned |
| tokenVersion | bumped on password change to end all sessions, never returned |
| lastLoginAt | |

## Category
name (unique), slug (unique), description, icon, isActive.

## Service
category (ref Category), name, description, basePrice, pricingType (`fixed` or `estimate`), durationMins, isAvailable, image (URL).
Index: `{category, isAvailable}`.

## Booking
| Field | Notes |
|---|---|
| bookingNo | unique, for example BK-000123, from a counter |
| customer, service, technician | refs; technician is null until assigned |
| date, slot | `YYYY-MM-DD` and `HH:MM-HH:MM`, IST |
| address | snapshot of the address at booking time |
| notes | |
| status | PENDING, CONFIRMED, ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED |
| estimatedPrice, finalPrice | |
| paymentMethod | `online` or `cod` |
| paymentStatus | `unpaid`, `paid`, `refund_pending`, `refunded` |
| holdsSlot | true while a technician is committed (hidden from responses) |
| cancellation | by, role, reason, fee, at |
| statusHistory[] | from, to, by, at, note |

Indexes: unique partial `{technician, date, slot}` where `holdsSlot` is true (prevents double booking); `{customer, createdAt}`; `{technician, status}`; `{date, slot, status}`; `{status, createdAt}`.

## Payment
booking, customer, provider (`razorpay` or `cash`), orderId (unique), paymentId, amount, currency, status (`created`, `paid`, `failed`, `refunded`), verifiedAt, failureReason, refundId, refundAmount, refundedAt.

## Review
booking (unique, so one review per booking), customer, technician, service, rating (1 to 5), comment, isHidden.
Index: `{service, isHidden, createdAt}`.

## Setting
key (unique), value. Keys: `slots`, `slotCapacity`, `maxAdvanceDays`, `minLeadHours`, `codEnabled`, `cancellation` (freeHoursBefore, feePercent). Missing keys use built-in defaults.

## AuditLog
actor (ref User), action (for example `booking.assign`), entity, entityId, meta, createdAt. Index: `{entity, entityId, createdAt}`.

## ContactMessage
name, email, phone, message.

## Counter
Internal sequence used to generate booking numbers.

## Relationships
Category 1..n Service. Service 1..n Booking. User (customer) 1..n Booking. User (technician) 1..n Booking. Booking 1..n Payment. Booking 0..1 Review.