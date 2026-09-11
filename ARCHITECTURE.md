# ShramSetu architecture

Cooperative-owned digital service marketplace (SIH 2026).

This is a **monorepo** with three independently owned services. Application code is added later; this file documents the production folder map and ownership rules.

| Path | Stack | Team owner |
| --- | --- | --- |
| `client/` | React + Vite + Tailwind CSS | Frontend |
| `server/` | Node.js + Express.js + MongoDB Atlas + JWT | Backend |
| `ai-service/` | Python + FastAPI + XGBoost | ML / AI |

**Trust boundary:** the browser talks only to `server`. `server` talks to MongoDB Atlas, Cloudinary, and `ai-service`. The SPA never calls FastAPI or MongoDB directly.

```text
shramshetu/
├── client/
├── server/
├── ai-service/
├── docs/                 product, API contracts, SIH write-ups
├── .github/workflows/    CI later
├── .env.example          env names only (no secrets)
└── ARCHITECTURE.md
```

## Client (`client/`)

Feature folders map to the four roles so UI work can be split by persona without merge conflicts.

| Folder | Responsibility |
| --- | --- |
| `public/` | Static files served as-is |
| `src/app/` | Bootstrap, providers, error boundary |
| `src/assets/` | Images, icons, fonts |
| `src/components/ui/` | Design-system primitives |
| `src/components/common/` | Shared composites (header, empty states) |
| `src/features/auth/` | Login, register, JWT session UI |
| `src/features/customer/` | User/Customer screens |
| `src/features/cooperative/` | Cooperative screens |
| `src/features/worker/` | Worker screens |
| `src/features/admin/` | Admin screens |
| `src/features/marketplace/` | Service discovery and listings |
| `src/features/bookings/` | Booking lifecycle UI |
| `src/features/maps/` | Leaflet + OpenStreetMap widgets |
| `src/features/qr/` | QR display and scan/verify UI |
| `src/layouts/` | Role shells |
| `src/lib/` | Axios instance, Leaflet helpers |
| `src/routes/` | Route tables and client-side role guards |
| `src/services/` | HTTP clients for `server` |
| `src/store/` | Client state |
| `src/styles/` | Tailwind entry and tokens |
| `src/types/` | Frontend types |
| `src/utils/` | Pure helpers |
| `tests/` | Unit and e2e |

**Rule:** role-specific screens stay in `features/<role>`. Shared widgets stay in `components/`.

## Server (`server/`)

Domain modules own their own routes, services, and Mongoose models. One developer can own one module.

| Folder | Responsibility |
| --- | --- |
| `src/config/` | Env, MongoDB Atlas, JWT, CORS |
| `src/modules/auth/` | Register/login, JWT issue/refresh |
| `src/modules/users/` | Customer profiles |
| `src/modules/cooperatives/` | Cooperative orgs and membership |
| `src/modules/workers/` | Worker profiles, skills, cooperative assignment |
| `src/modules/catalog/` | Services offered by cooperatives |
| `src/modules/bookings/` | Booking create/assign/complete/cancel |
| `src/modules/payments/` | Payment records and settlement hooks |
| `src/modules/media/` | Upload metadata; files go to Cloudinary |
| `src/modules/qr/` | QR token generate/verify |
| `src/modules/notifications/` | Notification dispatch interfaces |
| `src/modules/admin/` | Platform moderation and audits |
| `src/middleware/` | JWT authn, 4-role authz, rate limit, errors |
| `src/integrations/cloudinary/` | Cloudinary SDK wrapper |
| `src/integrations/ai-client/` | HTTP client to FastAPI |
| `src/jobs/` | Scheduled jobs |
| `src/validators/` | Shared request schemas |
| `src/utils/` | Logging, hashing, geo helpers |
| `tests/` | Unit and integration |

**Rule:** only `server` reads/writes MongoDB. Only `server` calls `ai-service`.

Each module later follows the same internal shape (not created yet): `*.routes.js`, `*.controller.js`, `*.service.js`, `*.model.js`, `*.validation.js`.

## AI service (`ai-service/`)

Isolated so ML work does not block API or UI work.

| Folder | Responsibility |
| --- | --- |
| `app/api/v1/` | HTTP endpoints (`/health`, `/rank`, `/predict`) |
| `app/core/` | Settings, logging, startup |
| `app/schemas/` | Pydantic contracts |
| `app/services/` | Feature load → infer → response |
| `app/ml/features/` | Feature engineering |
| `app/ml/training/` | Train and export XGBoost |
| `app/ml/inference/` | Load artifacts and score |
| `app/ml/artifacts/` | Serialized models (binaries gitignored) |
| `notebooks/` | Research only, not runtime |
| `data/raw/` | Source datasets (gitignored) |
| `data/processed/` | Training tables (gitignored) |
| `tests/` | Schema and inference tests |

## Roles (exactly four)

Authorization is enforced on the server. The client only hides routes.

1. **User/Customer** — discover, book, pay, QR confirm when required
2. **Cooperative** — catalog, workers, org bookings
3. **Worker** — assigned work, QR verification
4. **Admin** — platform oversight

## Local ports

- Client: `5173`
- Server: `5000`
- AI service: `8000`
