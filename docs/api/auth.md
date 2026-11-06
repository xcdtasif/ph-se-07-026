# Auth

Base path: `/api/auth`

## User object

Returned by every auth endpoint that responds with a user. The password is never included.

```json
{
  "id": "6f1c2d3e-0000-4000-8000-000000000000",
  "name": "Tenant 01",
  "email": "tenant01@gmail.com",
  "role": "TENANT",
  "isBanned": false,
  "createdAt": "2026-11-05T10:00:00.000Z",
  "updatedAt": "2026-11-05T10:00:00.000Z"
}
```

---

## Register User

`POST /api/auth/register` · Public

Creates an account and signs the user in (sets both auth cookies).

**Body**

| Field      | Type   | Rules                                                 |
| ---------- | ------ | ----------------------------------------------------- |
| `name`     | string | Trimmed, 2 to 100 characters                          |
| `email`    | string | Valid email, trimmed and lowercased                   |
| `password` | string | 8 to 72 characters (and at most 72 bytes)             |
| `role`     | string | `LANDLORD` or `TENANT` (`ADMIN` cannot self-register) |

**Example request body**

```json
{
  "name": "Tenant 11",
  "email": "tenant11@gmail.com",
  "password": "1a2s3d4f",
  "role": "TENANT"
}
```

**Responses**

| Status | When                 | Message                        |
| ------ | -------------------- | ------------------------------ |
| 201    | Success              | `User registered successfully` |
| 400    | Validation failed    | `Validation of body failed`    |
| 409    | Email already exists | `User already exists`          |

---

## Login User

`POST /api/auth/login` · Public

Signs in and sets both auth cookies.

**Body**

| Field      | Type   | Rules                               |
| ---------- | ------ | ----------------------------------- |
| `email`    | string | Valid email, trimmed and lowercased |
| `password` | string | 8 to 72 characters                  |

**Example request body**

```json
{
  "email": "tenant11@gmail.com",
  "password": "1a2s3d4f"
}
```

**Responses**

| Status | When                    | Message                        |
| ------ | ----------------------- | ------------------------------ |
| 200    | Success                 | `Logged in successfully`       |
| 400    | Validation failed       | `Validation of body failed`    |
| 401    | Wrong email or password | `Invalid email or password`    |
| 403    | Account is banned       | `Your account has been banned` |

---

## Logout User

`POST /api/auth/logout` · Public

Clears both auth cookies.

**Responses**

| Status | When    | Message                   |
| ------ | ------- | ------------------------- |
| 200    | Success | `Logged out successfully` |

---

## Get Me

`GET /api/auth/me` · Authenticated

Returns the signed-in user.

**Responses**

| Status | When                         | Message                        |
| ------ | ---------------------------- | ------------------------------ |
| 200    | Success                      | `Profile fetched successfully` |
| 401    | Not signed in / user deleted | `Authentication required`      |
| 403    | Account is banned            | `Your account has been banned` |

---

## Refresh Tokens

`POST /api/auth/refresh` · Requires `refreshToken` cookie

Issues a new access token and refresh token and sets both cookies.

**Responses**

| Status | When                             | Message                         |
| ------ | -------------------------------- | ------------------------------- |
| 200    | Success                          | `Tokens refreshed successfully` |
| 401    | Missing or invalid refresh token | `Authentication required`       |
| 401    | User no longer exists            | `User no longer exists`         |
| 403    | Account is banned                | `Your account has been banned`  |
