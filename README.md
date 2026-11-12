# RentNest Backend

REST API for a rental property marketplace. Landlords list properties, tenants request them and pay
the deposit through Stripe, and admins moderate the platform.

Live API: <https://ph-se-07-026.vercel.app>

## Overview

| Role     | Can do                                                                                        |
| -------- | --------------------------------------------------------------------------------------------- |
| Public   | Browse and search available properties, read their reviews                                    |
| Tenant   | Request a property or cancel a request, pay the deposit, review a completed rental            |
| Landlord | List properties with images, approve or reject requests, complete rentals, read their reviews |
| Admin    | Ban or unban users, hide properties and reviews, view all requests, manage categories         |

Users pick `TENANT` or `LANDLORD` when they register. Admins are created by the seed script only.

### Rental flow

1. A landlord lists a property (`AVAILABLE`).
2. A tenant sends a request (`PENDING`).
3. The landlord approves it. The request is `APPROVED` and the property is `RESERVED`.
4. The tenant pays the deposit on Stripe Checkout. The webhook makes the request `ACTIVE` and the
   property `RENTED`.
5. The landlord completes the rental. The request is `COMPLETED` and the property is `AVAILABLE`
   again.
6. The tenant can now review it.

A landlord can reject a `PENDING` or `APPROVED` request, and a tenant can cancel a `PENDING` or
`APPROVED` one. If a checkout expires unpaid, the request is rejected and the property is freed.
See [Request](docs/api/request.md) and [Payment](docs/api/payment.md) for the full rules.

### Moderation

- **Ban**: locks a user out immediately and changes no data. A banned landlord's properties are
  hidden from the public until they are unbanned. Admins cannot be banned.
- **Hide**: an admin can hide a property or a review. A hidden property is removed from public
  reads and blocks new requests, approvals and checkouts. A hidden review is removed from public
  and landlord lists and from the rating summary.

See [User](docs/api/user.md) and [Property](docs/api/property.md#visibility).

## Tech stack

| Area       | Technology                                        |
| ---------- | ------------------------------------------------- |
| Runtime    | Node.js 24, TypeScript                            |
| Framework  | Express 5                                         |
| Database   | PostgreSQL (Neon) with Prisma 7                   |
| Validation | Zod                                               |
| Auth       | JWT in `httpOnly` cookies, bcrypt password hashes |
| Payments   | Stripe Checkout and webhooks                      |
| Uploads    | UploadThing                                       |
| Tooling    | oxlint, oxfmt, tsx, mise                          |
| Deployment | Vercel                                            |

## Getting started

### Prerequisites

- [mise](https://mise.jdx.dev) (installs Node 24 and loads `.env.local`), or Node 24 installed
  yourself
- A PostgreSQL database, for example [Neon](https://neon.tech)
- A Stripe account and the [Stripe CLI](https://docs.stripe.com/stripe-cli)
- An [UploadThing](https://uploadthing.com) app

### Setup

```
mise install
npm install
cp .env.example .env.local
```

Fill in `.env.local`, then create the database tables and sample data:

```
npm run db:migrate
npm run db:generate
npm run db:seed
```

Start the server, and in a second terminal forward Stripe webhooks to it:

```
npm run dev
npm run stripe:listen
```

`stripe:listen` prints a signing secret. Put it in `STRIPE_WEBHOOK_SECRET`.

### Environment variables

The server reads every variable below except `ADMIN_*` at startup, in development and in
production, and refuses to start if one is missing. The seed script reads the `ADMIN_*` variables,
and `ADMIN_NAME` is optional.

| Variable                       | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `NODE_ENV`                     | `development` or `production`                       |
| `PORT`                         | Port the server listens on                          |
| `CLIENT_URL`                   | Frontend origin, used for CORS and Stripe redirects |
| `DATABASE_URL`                 | Pooled database connection                          |
| `DATABASE_URL_UNPOOLED`        | Direct connection, used for migrations              |
| `BCRYPT_SALT_ROUNDS`           | Password hashing cost                               |
| `JWT_ACCESS_SECRET`            | Access token signing secret                         |
| `JWT_ACCESS_TOKEN_EXPIRES_IN`  | Access token lifetime, such as `15m`                |
| `JWT_REFRESH_SECRET`           | Refresh token signing secret                        |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime, such as `7d`                |
| `ADMIN_EMAIL`                  | Email of the admin account the seed creates         |
| `ADMIN_PASSWORD`               | Password of that account                            |
| `ADMIN_NAME`                   | Name of that account, `Admin 01` by default         |
| `STRIPE_SECRET_KEY`            | Stripe API key                                      |
| `STRIPE_PRODUCT_ID`            | Stripe product used for deposit checkouts           |
| `STRIPE_WEBHOOK_SECRET`        | Webhook signing secret                              |
| `UPLOADTHING_TOKEN`            | UploadThing token                                   |
| `UPLOADTHING_APP_ID`           | UploadThing app id, used to validate image URLs     |

### Seed data

`npm run db:seed` is safe to repeat. It always creates the admin from the `ADMIN_*` variables and
four categories (Apartment, House, Studio, Commercial). Outside production it also creates sample
data that covers each feature:

| Data       | What it contains                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Landlords  | `landlord01@gmail.com` to `landlord03@gmail.com`, and a banned `landlord04@gmail.com`                       |
| Tenants    | `tenant01@gmail.com` to `tenant03@gmail.com`, and a banned `tenant04@gmail.com`                             |
| Properties | Ten: nine across the active landlords, one of them hidden by an admin, and one owned by the banned landlord |
| Requests   | One `PENDING`, `CANCELLED`, `APPROVED` and `REJECTED`, and three `COMPLETED`                                |
| Payments   | A `COMPLETED` payment for each completed rental. They have no real Stripe session behind them               |
| Reviews    | Three, one of them hidden                                                                                   |

All sample users share the password `1a2s3d4f`. `tenant01` has an `APPROVED` request on "Cozy Duplex
in Bashundhara", so the payment flow can be tried right away. The sample data is skipped when
`NODE_ENV` is `production`.

### Scripts

| Script                  | What it does                                      |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Start the server with reload                      |
| `npm run build`         | Compile to `dist`                                 |
| `npm start`             | Run the compiled server                           |
| `npm run db:migrate`    | Format the schema and create or apply a migration |
| `npm run db:generate`   | Generate the Prisma client and the ERD            |
| `npm run db:delete`     | Delete all data. Refuses to run in production     |
| `npm run db:seed`       | Seed the database                                 |
| `npm run fmt`           | Format the code                                   |
| `npm run lint`          | Lint the code and apply fixes                     |
| `npm run stripe:listen` | Forward Stripe webhooks to the local server       |

## API documentation

Each module has its own page with an endpoint table, the object shape, and every request with its
validation rules and responses.

| Module                           | Covers                                               |
| -------------------------------- | ---------------------------------------------------- |
| [Auth](docs/api/auth.md)         | Register, login, logout, token refresh               |
| [User](docs/api/user.md)         | Own profile, admin user list, ban and unban          |
| [Category](docs/api/category.md) | Property categories                                  |
| [Property](docs/api/property.md) | Public browse, landlord management, admin moderation |
| [Request](docs/api/request.md)   | Rental requests for tenants, landlords and admins    |
| [Payment](docs/api/payment.md)   | Deposit checkout, payment history, Stripe webhook    |
| [Review](docs/api/review.md)     | Property reviews, tenant reviews, admin moderation   |
| [Upload](docs/api/upload.md)     | Property image uploads through UploadThing           |

### Conventions

#### Authentication

Authentication uses two `httpOnly` cookies, set on register, login and refresh:

| Cookie         | Used for                      |
| -------------- | ----------------------------- |
| `accessToken`  | Authenticating requests       |
| `refreshToken` | `POST /api/auth/refresh` only |

Send requests with credentials (`credentials: "include"` in `fetch`). Protected routes return
`401` when the cookie is missing, invalid or the user no longer exists, and `403` when the user
is banned or their role is not allowed.

#### Response envelope

Every response, success or error, has this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Properties fetched successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42
  },
  "errorDetails": null
}
```

- `data` is omitted when there is nothing to return (for example, deletes).
- `meta` is present on paginated lists only.
- `errorDetails` is present on errors only.

#### Pagination

List endpoints take `page` (default `1`) and `limit` (default `10`, at most `50`) and return
`meta` with `page`, `limit` and `total`. Lists are newest first unless the endpoint offers a
`sort`.

#### Errors

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation of body failed",
  "errorDetails": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email address"]
    }
  }
}
```

| Status | Meaning                                                           |
| ------ | ----------------------------------------------------------------- |
| 400    | Validation of `body`, `query` or `params` failed                  |
| 401    | Not authenticated, or invalid credentials                         |
| 403    | Authenticated but not allowed (wrong role, banned, not the owner) |
| 404    | Resource or route not found                                       |
| 409    | Conflict (duplicate, or the action is blocked by existing data)   |
| 429    | Payment provider rate limit                                       |
| 500    | Internal server error                                             |
| 502    | Payment provider (Stripe) rejected the request or failed          |
| 503    | Database or payment provider unavailable                          |

Unknown routes return `404` with the message `Route <METHOD> <path> not found`. Request bodies,
queries and params are strict: unknown fields are rejected with `400`.

#### Enums

Enum values are `UPPER_SNAKE_CASE`.

| Enum             | Values                                                                |
| ---------------- | --------------------------------------------------------------------- |
| `UserRole`       | `ADMIN`, `LANDLORD`, `TENANT`                                         |
| `PropertyStatus` | `AVAILABLE`, `UNAVAILABLE`, `RESERVED`, `RENTED`                      |
| `RequestStatus`  | `PENDING`, `CANCELLED`, `APPROVED`, `REJECTED`, `ACTIVE`, `COMPLETED` |
| `PaymentStatus`  | `PENDING`, `COMPLETED`, `FAILED`                                      |

## Database

Six models: `User`, `Category`, `Property`, `Request`, `Payment` and `Review`. See the
[ERD](docs/generated/prisma-erd-generator/erd.svg). The schema is split by model in `prisma/models`,
with migrations in `prisma/migrations`.

## Project structure

```
src/
  app.ts          Express app: middleware and route mounting
  server.ts       Entry point. Listens locally, exports the app for Vercel
  config/         Validated environment variables
  middlewares/    authenticate, authorize, validate, error handler, not found
  modules/<name>/ <name>.routes.ts, .controller.ts, .service.ts, .schema.ts
  db/             Seed and delete scripts
  lib/, utils/    Prisma, Stripe and UploadThing clients, helpers
prisma/           Schema, models and migrations
docs/api/         API documentation, one page per module
```

Routes are split by who may call them. `<name>.routes.ts` holds public or any-signed-in routes, and
`<name>.<role>.routes.ts` holds the tenant, landlord or admin ones.

## Deployment

The app deploys to Vercel. `server.ts` only calls `listen` outside Vercel and otherwise exports the
app. Set the same environment variables in the project, apply migrations to the production
database, and add a Stripe webhook endpoint at `https://<host>/api/stripe/webhook` for the
`checkout.session.completed` and `checkout.session.expired` events.
