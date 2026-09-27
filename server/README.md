# Server

Node.js + Express.js API for ShramSetu.

Owns JWT auth, four-role authorization, MongoDB Atlas models, Cloudinary uploads, QR verification, and calls to `ai-service`.

For Razorpay Checkout, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the server environment. `RAZORPAY_TEST_MODE` defaults to `true`; use `rzp_test_` credentials until test payments, signature verification, OTP release, invoice downloads, and cancellation refunds are validated. The payment APIs are mounted under `/api/payments` (also `/api/v1/payments`). The current escrow state gates the platform's release record; actual worker payouts or fund custody require Razorpay Route and linked-account configuration, which is not part of this integration.

Local development defaults to direct Start/End OTP flow with online payments disabled. Enable backend payments with `PAYMENTS_ENABLED=true` and expose the client Pay controls with `VITE_PAYMENTS_ENABLED=true`; both are required. Production keeps payment verification enabled unless explicitly disabled, and never allows OTP without a persisted captured payment. When payments are disabled, completed work does not claim that payment was released.
