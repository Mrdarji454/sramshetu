# User portal upgrade

Implemented within the existing routes, dashboard, booking wizard, matching view, profile modals, authentication, and payment-state model. Existing uncommitted work was preserved. The worker dashboard received only the OTP form changes needed to complete the customer verification flow.

## 1. Files changed

Client updates:

- `client/src/features/landing/HeroSection.jsx`: service search and category navigation.
- `client/src/features/matching/WorkerMatcher.jsx`: query forwarding, debouncing, stale-response protection, four-card loading, separate cooperative section, richer cards.
- `client/src/features/matching/WorkerMatchingMap.jsx`: escapes profile text before adding it to map HTML.
- `client/src/features/matching/PublicWorkerProfileModal.jsx` and `PublicCooperativeProfileModal.jsx`: real public API data, reviews, service-area maps, cooperative roster, error handling.
- `client/src/features/bookings/BookingWizardModal.jsx`: customer details, custom profession preservation, map pin selection and GPS preview, removal of the hardcoded completion code.
- `client/src/features/bookings/BookingStatusTracker.jsx`: existing animated timeline extended with tracking, verification, payment state and reviews.
- `client/src/features/customer/UserDashboard.jsx`: periodic status refresh and booking navigation.
- `client/src/features/worker/WorkerDashboard.jsx`: server-validated start/completion OTP forms; removed frontend-only verification.
- `client/src/features/auth/LoginPage.jsx`: retains search parameters after sign-in.
- `client/src/services/booking.service.js`, `matching.service.js`: API integration.
- `client/src/utils/tradeUtils.js`, `geo.utils.js`: categories, keyword boundaries, bounded reverse-geocoding and location fallback.

Server updates:

- Controllers: `booking.controller.js`, `matching.controller.js`, `worker.controller.js`, `cooperative.controller.js`; added `directory.controller.js`.
- Services: `booking.service.js`, `matching.service.js`; added `bookingVerification.service.js`, `review.service.js`, `smartMatching.service.js`.
- Models: `Booking.model.js`, `Worker.model.js`, `Cooperative.model.js`, `Review.model.js`.
- Routes: `booking.routes.js`, `worker.routes.js`, `cooperative.routes.js`, `index.js`; added `review.routes.js`.
- Tests: `server/tests/booking-flow.test.js`, new `server/tests/user-portal.test.js`, and `server/package.json`.

The pre-existing changes to `CooperativeDashboard.jsx` and `cooperative.service.js` were retained without additional edits in this implementation.

## 2. APIs

All routes use the existing `/api` and `/api/v1` mounts. No duplicate singular `/booking` route was introduced.

| Method | Path | Purpose |
|---|---|---|
| GET | `/matching/nearby?lat=…&lng=…&query=…&sort=score` | Existing combined search, extended with custom professions and AI/manual ranking |
| GET | `/workers/public/:id` | New safe public worker profile and latest 20 reviews |
| GET | `/cooperatives/public/:id` | New public cooperative profile and worker roster |
| POST | `/bookings/:id/start-otp` | Customer generates an arrival code |
| POST | `/bookings/:id/verify-start-otp` | Assigned worker submits `{ "code": "123456" }` |
| POST | `/bookings/:id/end-otp` | Customer confirms completion by generating a new code |
| POST | `/bookings/:id/verify-end-otp` | Assigned worker verifies completion |
| POST | `/reviews` | Customer submits bookingId, rating, feedback, tags, optional cooperativeRating |
| GET | `/reviews/booking/:id` | Retrieves the customer's existing review to prevent duplicate prompts |

Existing create/list/detail/status/assignment/accept/reject booking APIs remain in use. The existing `/bookings/suitable` lookup now reuses actual discovery results and accepts coordinates; it no longer fabricates workers on an empty search. Direct transitions to `IN_PROGRESS` or `COMPLETED` now require the verification endpoints. Arrival/completion codes expire after 10 minutes, lock after five failed attempts, and have a 30-second regeneration cooldown. They are cryptographically generated, salted/hashed, consumed atomically in MongoDB, and omitted from booking responses. Only the owning customer receives a plaintext code when generating it.

## 3. Database changes

Schemas are extended without renaming existing fields:

- Worker: optional `serviceRadius`, `liveLocation`; existing availability and service-area fields remain.
- Cooperative: independent `rating.average` and `rating.count`; existing `serviceArea` is reused.
- Booking: `trackingStatus`, `customerLocation`, `workerLocation`, `startOTP`, `endOTP`, `timelineEvents`, and customer/worker/cooperative display details. Existing `statusHistory`, location, QR reference, and payment fields remain compatible.
- Review: `feedback`, `tags`, optional `cooperativeRating`; existing comment and one-review-per-booking constraint remain. Worker and cooperative averages are calculated independently.

MongoDB stores the status, verification records and reviews across refreshes and server restarts. The existing development in-memory mode survives browser refreshes only; restarting the server clears development-only bookings and reviews. Tests exercise that development mode and schema validation, not a live MongoDB deployment.

Completion releases `held` or `escrow_locked` funds in the existing state model. Unpaid bookings remain payment-pending; completion does not invent a gateway payment or bank transfer.

## 4. Components added

- `ServiceSearch`: suggestions, popular searches, recent searches and free-text search.
- `LocationMap`: reusable Leaflet/OSM customer, worker and cooperative markers, service circles and booking pin selection.
- `LiveTrackingMap`: clearly labelled simulated artisan position, direction line and estimated arrival; accepts future GPS data through `workerLocation`.
- `WorkVerificationPanel`: customer code generation and expiry countdown.
- `BookingReview`: worker stars, optional cooperative stars, feedback and selectable tags.

## 5. Validation and remaining improvements

- Production client build passed; Vite reports its existing mixed static/dynamic import warning and a bundle-size warning.
- Full server suite passed: 12 unit, 52 schema, 23 authentication, 28 booking, 27 AI, and 14 user-portal checks (156 total).
- New tests cover unauthorized access, direct status bypass, OTP expiry, attempt limits, regeneration, concurrent replay, settlement, review validation/duplicates, custom professions, manual ordering, malformed/unavailable AI responses, and real HTTP routing.
- Additional booking and portal tests were rerun after the final identity and data-handling changes.

Optional AI contract: the adapter calls the configured AI service at `POST /match/workers` with eligible candidates, professions, skills, distance, availability, ratings, current booking workload, and cooperative preference. A successful response must contain `rankedWorkerIds`, a complete, unique ordering of the provided IDs. Timeout, unavailable endpoint or malformed output falls back to manual ranking. The current workload-prediction microservice can continue operating independently; implementing a trained matching model remains future work.

Future operational improvements: real worker GPS transport, a road-routing provider for road routes/accurate ETA, server-side discovery pagination for large directories, bundle splitting, and reconciliation with a real payment provider where configured. The current simulation does not advance booking status or claim to follow roads.

## 6. Verification blockers

No browser was connected and the in-app browser was unavailable, so visual/mobile inspection and actual browser geolocation permission testing could not be performed. A live MongoDB persistence/concurrency run was not performed. These limits do not affect the passing build and automated service/API checks, but should be checked before deployment.
