# Requirements and scope

## Goal
Replace phone and WhatsApp bookings with one platform for customers, technicians and administrators.

## Roles
| Role | Can do |
|---|---|
| Customer | Register, browse services, book, pay, cancel, review, manage profile and addresses |
| Technician | Accept or reject assigned jobs, update job status, see history and earnings, set availability |
| Administrator | Everything else: catalog, people, bookings, assignment, payments, refunds, reviews, messages, settings |

## Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | Users register and log in securely; only customers can self-register |
| FR-2 | Public visitors can browse and search services by category and see price and availability |
| FR-3 | Customers book by choosing a service, a date, an available time slot and an address |
| FR-4 | Only available services can be booked; slots that are full or too soon are not offered |
| FR-5 | Bookings follow the states Pending, Confirmed, Assigned, Accepted, In progress, Completed, or Cancelled, with only valid transitions allowed |
| FR-6 | Administrators approve bookings and assign technicians; a technician cannot hold two jobs in one slot |
| FR-7 | Technicians accept or reject assignments; a rejected job returns to Confirmed for reassignment |
| FR-8 | Customers cancel under a configurable policy (free until a set number of hours before, then a percentage fee) |
| FR-9 | Payment by cash on service or online (Razorpay); online payments are verified on the server |
| FR-10 | Estimate-priced services get their final amount from the technician on completion; online payment opens after that |
| FR-11 | Administrators refund cancelled, paid online bookings (paid amount minus cancellation fee) |
| FR-12 | Customers review completed bookings once; administrators can hide reviews |
| FR-13 | Email notifications for booking and payment changes |
| FR-14 | Administrators manage categories, services, customers, technicians and settings, and see statistics |
| FR-15 | Important actions are recorded in an audit log that administrators can view |
| FR-16 | Visitors can send a message through a contact form |

## Non-functional requirements

- **Security:** server-side authorization on every route, hashed passwords, short-lived tokens, rate limiting, input validation, no sensitive fields in responses.
- **Reliability:** database-level protection against double booking; payment and refund steps are safe to repeat.
- **Usability:** responsive layouts (phone, tablet, desktop), form validation messages, loading and empty states, confirmation dialogs for important actions.
- **Accessibility:** labelled form fields, keyboard operation, visible focus, 44 px touch targets, contrast of at least 4.5:1 for text.
- **Maintainability:** layered code (routes, controllers, services, models), automated tests, environment-based configuration.

## Assumptions (please confirm with the client)

| Topic | Assumption used |
|---|---|
| Region and currency | India, INR, Razorpay; all times are IST |
| Time slots | 09:00-11:00, 11:00-13:00, 14:00-16:00, 16:00-18:00 (editable in Settings) |
| Capacity | Up to 3 active bookings per date and slot across the business (editable) |
| Booking window | From 2 hours ahead up to 30 days ahead (editable) |
| Cancellation | Free until 24 hours before the slot, then 20% of the estimated price (editable) |
| Pricing | Services are either fixed price or estimate-based (final amount set on completion) |
| Cash on service | Allowed for every service (a setting turns it off) |
| Technician earnings | A percentage of the job amount, set per technician |
| Notifications | Email only |
| Administrators | One role with full control |

## Out of scope (possible next phase)

Forgot-password and email verification, SMS or WhatsApp notifications, live updates (Socket.IO), file uploads such as job photos, multi-level admin permissions, exportable reports, automatic technician matching by skill, invoices.