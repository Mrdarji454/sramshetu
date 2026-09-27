# ShramSetu notifications

The existing navbar, dashboard topbar, colors, and components are retained. The mock inbox has been replaced with a shared notification bell, unread badge, recent dropdown, individual/all read actions, and `/notifications` with All, Unread, Booking, Payment, and Verification filters and pagination.

## Storage and delivery

`Notification` uses MongoDB's `notifications` collection. Fields are `recipientId` (User ID), `recipientRole`, `title`, `message`, `type`, `relatedBooking`, `isRead`, and `createdAt`. Optional `eventKey` supports deduplicated reminders and provider events. Compound indexes cover recipient lists and unread queries; a partial unique index covers event keys per recipient.

Socket authentication verifies the existing JWT and loads the active User from MongoDB. Role and room membership come from the database, never the client. Worker profile IDs resolve to Worker.user; cooperative IDs resolve to active cooperative manager accounts. Tokens disconnect at expiry; active status and role are rechecked every minute. The APIs scope every read/write to the authenticated account and role.

MongoDB persistence precedes socket delivery. Reconnect, window focus, and a 30-second fallback refresh recover missed events. Read actions notify all the account's connected tabs. No OTP value is included in notification text or payloads. Notifications require MongoDB; demo mode returns 503 instead of pretending notifications were persisted.

## APIs

All paths work under both `/api` and `/api/v1` with the existing bearer-token authentication.

New notification resource:

- `GET /notifications?filter=All&page=1&limit=20`: `{ notifications, total, unreadCount, page, limit }` inside the existing `data` envelope. Limit is 1–50.
- `GET /notifications/unread-count`: `{ unreadCount }`.
- `PATCH /notifications/:id/read`: marks only an owned notification read, returns the notification; 404 for another account's ID.
- `PATCH /notifications/read-all`: marks the recipient's entire inbox read, returns the current unread count.

Extended existing APIs (no duplicate booking or verification routes):

| Existing route | Notification behavior |
| --- | --- |
| `POST /auth/register` | New worker/cooperative registration to administrators |
| `POST /bookings` | Customer submission, worker/cooperative incoming request, assignment |
| `PATCH /bookings/:id/assign`, `POST /cooperatives/assign-worker` | Worker assignment to customer and worker |
| `POST /bookings/:id/accept`, `POST /bookings/:id/reject` | Customer/cooperative acceptance or rejection |
| `PATCH /bookings/:id/status` | En route, arrival, cancellation, dispute, rescheduling |
| `POST /bookings/:id/start-otp`, `POST /bookings/:id/end-otp` | Code generated announcement to customer |
| `POST /bookings/:id/verify-start-otp`, `POST /bookings/:id/verify-end-otp` | Work progress, verification success, completion, rating reminder; payment released only if existing held escrow is actually transitioned |
| `POST /workers/onboarding`, `PUT /workers/profile` | Pending review and cooperative membership |
| `POST /workers/step/:stepNumber` | Step 3 membership; step 7 accepts optional per-document `expiresAt` |
| `POST /workers/submit-registration` | Pending worker verification to administrators |
| `PATCH /workers/availability` | Changed unavailable status to the cooperative |
| `POST /cooperatives/onboarding`, `PUT /cooperatives/profile` | Pending cooperative review to administrators |
| `POST /cooperatives/members` | Member joined; MongoDB path now resolves a registered worker by phone instead of storing invalid demo IDs |
| `PATCH /admin/verifications/:id/review`, `POST /admin/verifications/review` | Approval/rejection to the affected worker or cooperative managers |

To reschedule, send `PATCH /bookings/:id/status` with `{ "scheduledTime": { "start": "2027-01-01T09:00:00+05:30", "end": "2027-01-01T11:00:00+05:30" } }`. Only the owning customer or administrator can reschedule pre-travel bookings. Conditional updates reject concurrent changes. Arrival uses `{ "status": "ARRIVED" }`; the existing worker arrival/OTP button records it. Start verification accepts ON_THE_WAY for compatibility and ARRIVED.

## Socket events

- Client handshake: `auth: { token }` using the existing login token.
- Server `notification:new`: persisted notification object, delivered only to its recipient's room.
- Server `notifications:changed`: invalidates the account's inbox/count after insertion or read changes. The client refetches authoritative data.
- Socket.IO `connect` triggers reconciliation. There are no client-controlled join/broadcast events.

## Implemented event types

- Booking: `BOOKING_SUBMITTED`, `NEW_BOOKING`, `ASSIGNED`, `COOPERATIVE_ASSIGNED`, `ACCEPTED`, `REJECTED`, `ON_THE_WAY`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`.
- Work verification: `OTP_GENERATED`, `START_OTP_VERIFIED`, `END_OTP_VERIFIED`, `RATING_REMINDER`.
- Worker/cooperative: `WORKER_JOINED`, `WORKER_UNAVAILABLE`, `VERIFICATION_PENDING`, `VERIFICATION_APPROVED`, `VERIFICATION_REJECTED`, `DOCUMENT_EXPIRY`.
- Admin: `WORKER_REGISTERED`, `COOPERATIVE_REGISTERED`, `HIGH_DEMAND`, `WORKER_SHORTAGE`, `COMPLAINT_SUBMITTED`, `API_FAILURE`.
- Payment: `PAYMENT_RELEASED` is connected to the existing held-escrow completion transition. `PAYMENT_CONFIRMED` and `SETTLEMENT_COMPLETED` have recipient routing and filter support, ready for a real payment provider; no gateway or settlement source exists in this project yet.

The monitor runs at startup and every 15 minutes. Document reminders fire once per document expiry date for dates within 30 days. No expiry is guessed for documents without a date. High demand defaults to 20 pending/assigned bookings created in the last 24 hours; shortage means open bookings with no available verified workers in the area. Alerts deduplicate daily. Booking district is used when supplied, otherwise city is the legacy fallback. Booking disputes notify admins through the existing DISPUTED transition; a separate complaint submission flow does not exist. Unexpected errors passing through the central error handler produce an admin alert, deduplicated per route/method/five-minute window; notification route failures are excluded to prevent recursion.

## Configuration and future integrations

- Existing `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` are used. `CLIENT_URL` must match the web origin.
- Optional `VITE_SOCKET_URL` sets a separate socket origin. Otherwise the origin of `VITE_API_URL`, or the browser origin, is used. Vite proxies `/socket.io` with WebSocket support.
- Optional `NOTIFICATION_DEMAND_THRESHOLD` changes the demand threshold.
- Production reverse proxies must forward `/socket.io` HTTP polling and WebSocket upgrades to the Node server.
- `registerNotificationChannel(name, deliver)` provides an adapter boundary for future SMS/email queue producers. No SMS/email credentials or delivery providers are configured.
- A payment webhook should first verify provider signatures and commit a genuine payment transition, then call `bookingNotification(booking, 'PAYMENT_CONFIRMED', providerEventId)` or `bookingNotification(booking, 'SETTLEMENT_COMPLETED', providerEventId)`.

Remaining improvements: transactional outbox/retry processing (a crash or database failure between a business mutation and notification insertion can lose that notification; currently it is logged without failing the committed business operation), Redis Socket.IO adapter for multiple servers, provider-backed payments/SMS/email with user preferences, authoritative district codes, expiry-date input controls, and independent infrastructure monitoring for total server/database outages. The rating reminder is immediate on completion; delayed reminders would need a durable job queue. Rescheduling is available through the existing API; there was no rescheduling control in the current UI. Visual browser QA is still recommended.

## Verification

- Existing server test suite passed.
- Client production build passed; Vite retains its large-bundle warning.
- `npm run test:notifications` passed 34 integration checks against an isolated real MongoDB database and real Socket.IO clients. It checks persistence, ownership, room spoofing, active accounts, multi-tab updates, filters, pagination, profile/account mapping, booking/OTP flows, reminder deduplication, and failure isolation.
- To rerun, install both client and server dependencies and run MongoDB on port 27028, or set `NOTIFICATION_TEST_MONGO_URI` to a disposable MongoDB server. The test creates and drops only a uniquely named `shramsetu_notifications_test_*` database.

## Files changed

New files:

- `client/src/components/common/NotificationBell.jsx`
- `client/src/context/NotificationContext.jsx`
- `client/src/features/notifications/NotificationsPage.jsx`
- `server/src/models/Notification.model.js`
- `server/src/realtime/notifications.js`
- `server/src/routes/notification.routes.js`
- `server/src/services/notification.service.js`
- `server/src/services/notificationMonitor.service.js`
- `server/tests/notifications.test.js`
- `NOTIFICATIONS.md`

Updated files:

- `client/package.json`, `client/package-lock.json`, `client/vite.config.js`
- `client/src/App.jsx`, `client/src/routes/AppRoutes.jsx`
- `client/src/components/common/Navbar.jsx`, `client/src/components/dashboard/Topbar.jsx`, `client/src/layouts/DashboardLayout.jsx`
- `client/src/features/bookings/BookingStatusTracker.jsx`, `client/src/features/bookings/WorkVerificationPanel.jsx`, `client/src/features/worker/WorkerDashboard.jsx`
- `server/package.json`, `server/package-lock.json`, `server/src/server.js`
- `server/src/models/Booking.model.js`, `server/src/models/Cooperative.model.js`, `server/src/models/Worker.model.js`, `server/src/models/index.js`
- `server/src/routes/index.js`, `server/src/routes/booking.routes.js`
- `server/src/controllers/booking.controller.js`, `server/src/controllers/worker.controller.js`, `server/src/controllers/cooperative.controller.js`
- `server/src/services/booking.service.js`, `server/src/services/bookingVerification.service.js`, `server/src/services/auth.service.js`, `server/src/services/admin.service.js`, `server/src/services/worker.service.js`, `server/src/services/cooperative.service.js`
- `server/src/middleware/errorHandler.js`
