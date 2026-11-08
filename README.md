# RentNest Backend

## ERD

[ERD](docs/generated/prisma-erd-generator/erd.svg)

## API Documentation

| Module                           | Endpoints                |
| -------------------------------- | ------------------------ |
| [Auth](docs/api/auth.md)         | 5                        |
| [Category](docs/api/category.md) | 4                        |
| [Property](docs/api/property.md) | 5 (2 public, 3 landlord) |
| [Request](docs/api/request.md)   | 5 (3 tenant, 2 landlord) |
| [Payment](docs/api/payment.md)   | 4 (3 tenant, 1 stripe)   |
| [Review](docs/api/review.md)     | 3 (tenant)               |

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

Unknown routes return `404` with the message `Route <METHOD> <path> not found`. Request
bodies are strict: unknown fields are rejected with `400`.

#### Enums

Enum values are `UPPER_SNAKE_CASE`.

| Enum             | Values                                                   |
| ---------------- | -------------------------------------------------------- |
| `UserRole`       | `ADMIN`, `LANDLORD`, `TENANT`                            |
| `PropertyStatus` | `AVAILABLE`, `UNAVAILABLE`, `RESERVED`, `RENTED`         |
| `RequestStatus`  | `PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `COMPLETED` |
| `PaymentStatus`  | `PENDING`, `COMPLETED`, `FAILED`                         |

## Setup

```
mise install
npm install
cp .env.example .env.local
```
