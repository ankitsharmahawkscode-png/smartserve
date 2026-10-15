# Demo script and acceptance checklist

About 15 minutes. Use two browser windows (or one normal and one private window) so you can be the customer and the administrator at the same time.

## Before you start
Seed the admin and demo data (see the README). Have a Razorpay test card ready: `4111 1111 1111 1111`, any future expiry, any CVV.

## Walk-through

1. **Public site (1 min).** Home, Services (search and filter), a service detail page, About, Contact. Send a contact message.
2. **Customer books (2 min).** Register, log in, open a service, choose a date and slot, enter an address, book with cash. Show the booking in My bookings.
3. **Administrator confirms and assigns (2 min).** Log in as admin. Overview shows the new booking under "Awaiting action". Open Bookings, approve it, assign the demo technician.
4. **Technician works the job (2 min).** Log in as the technician. Accept the job, start it, complete it (enter the final amount for an estimate service).
5. **Customer sees the result (1 min).** The progress timeline updated. Open Payments (the cash payment is recorded). Leave a review under Reviews.
6. **Online payment and refund (3 min).** Book a fixed-price service with Pay online and pay with the test card. Cancel inside the fee window. As admin open Payments, filter Refunds due, and issue the refund (paid amount minus the fee).
7. **Rules in action (2 min).** Try to assign the same technician to a second booking in the same slot (blocked). Try opening an admin page as a customer (redirected). Change a slot or the cancellation fee in Settings and show it on the booking form.
8. **Audit and security (1 min).** Open Activity log and show who did what. Enter a wrong password five times to show the lockout.
9. **Mobile (1 min).** Shrink the window or open the site on a phone: menus collapse, forms stay usable.

## Acceptance criteria

| Criterion from the brief | Where to see it | Status |
|---|---|---|
| All three roles can use their dashboards | Steps 2 to 5 | |
| Customers create and manage bookings | Steps 2, 5, 6 (book, view, cancel) | |
| Administrators manage services, users, technicians and bookings | Admin pages; step 3 | |
| Technicians process assigned jobs | Step 4 | |
| Permissions and business rules enforced on the backend | Step 7; `npm test` (permission matrix, booking tests) | |
| Database stores and retrieves data correctly | Refresh any page after each step | |
| Payment flows verified in test mode | Step 6; `payments.test.js` | |
| Works on mobile and desktop | Step 9 | |
| Core workflows pass testing | `npm test` all green | |
| Installable from the documentation | README quick start on a clean machine | |

Tick the Status column when each item has been shown to the client.