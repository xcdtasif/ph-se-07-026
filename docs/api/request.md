# Request

| Group    | Base path                | Access   |
| -------- | ------------------------ | -------- |
| Tenant   | `/api/tenant/requests`   | Tenant   |
| Landlord | `/api/landlord/requests` | Landlord |

## Request object

```json
{
  "id": "3b2a1c0d-0000-4000-8000-000000000000",
  "tenantId": "c4d5e6f7-0000-4000-8000-000000000000",
  "propertyId": "6f1c2d3e-0000-4000-8000-000000000000",
  "message": "I would like to move in with my family next month.",
  "status": "PENDING",
  "createdAt": "2026-11-06T10:00:00.000Z",
  "updatedAt": "2026-11-06T10:00:00.000Z",
  "property": {
    "id": "6f1c2d3e-0000-4000-8000-000000000000",
    "landlordId": "a1b2c3d4-0000-4000-8000-000000000000",
    "name": "Sunny 2-Bed Apartment in Dhanmondi",
    "location": "Dhanmondi, Dhaka",
    "images": ["https://0j6bmu5elp.ufs.sh/f/sunny-2-bed-apartment-in-dhanmondi-1"],
    "rent": "28000",
    "deposit": "56000",
    "status": "AVAILABLE"
  }
}
```

Landlord responses also include `tenant`: `{ "id", "name", "email" }`, placed before `property`, to
match the order of `tenantId` and `propertyId`.

### Status flow

Request status and property status move together:

| Request change          | Changed by     | Property change          | Property must be |
| ----------------------- | -------------- | ------------------------ | ---------------- |
| (new) → `PENDING`       | Tenant         | none                     | `AVAILABLE`      |
| `PENDING` → `APPROVED`  | Landlord       | `AVAILABLE` → `RESERVED` | `AVAILABLE`      |
| `PENDING` → `REJECTED`  | Landlord       | none                     | any              |
| `APPROVED` → `REJECTED` | Landlord       | `RESERVED` → `AVAILABLE` | `RESERVED`       |
| `APPROVED` → `ACTIVE`   | Stripe webhook | `RESERVED` → `RENTED`    | `RESERVED`       |
| `APPROVED` → `REJECTED` | Stripe webhook | `RESERVED` → `AVAILABLE` | `RESERVED`       |
| `ACTIVE` → `COMPLETED`  | Landlord       | `RENTED` → `AVAILABLE`   | `RENTED`         |

Rules that follow from this:

- A property has at most one `APPROVED` or `ACTIVE` request, because approving needs an
  `AVAILABLE` property and holds it as `RESERVED`.
- A tenant can only create a request for an `AVAILABLE` property, so `RESERVED`, `RENTED` and
  `UNAVAILABLE` properties cannot be requested.
- `RESERVED` means the deposit is pending. If the tenant does not pay, the property is freed in
  one of two ways: the landlord rejects the `APPROVED` request, or, once a checkout was started
  and expired unpaid, the Stripe webhook rejects it.
- `APPROVED` → `ACTIVE` is made by the Stripe webhook when the deposit is paid. It has no landlord
  or tenant endpoint, so the landlord `PATCH` cannot set `ACTIVE`. The webhook also moves every
  other `PENDING` request on that property to `REJECTED`. Requests are never deleted.
- A landlord can toggle a property between `AVAILABLE` and `UNAVAILABLE`, and only while it is
  not `RESERVED` or `RENTED` (no `APPROVED` or `ACTIVE` request). Hiding a property rejects all its
  `PENDING` requests. To free a `RESERVED` property, reject its request.
- A landlord cannot reject an `APPROVED` request while its tenant has a checkout in progress (a
  `PENDING` payment younger than 35 minutes). The request returns to normal once the checkout is
  paid or expires.
- Each status change and its property change are applied in one transaction, so both succeed or
  neither does.

---

## Create Request

`POST /api/tenant/requests` · Tenant

**Body**

| Field        | Type   | Rules                           |
| ------------ | ------ | ------------------------------- |
| `propertyId` | UUID   | Must be an `AVAILABLE` property |
| `message`    | string | Trimmed, 10 to 1000 characters  |

A tenant can have only one `PENDING`, `APPROVED` or `ACTIVE` request per property.

**Example**

```json
{
  "propertyId": "6f1c2d3e-0000-4000-8000-000000000000",
  "message": "I would like to move in with my family next month."
}
```

**Responses**

| Status | When                        | Message                                              |
| ------ | --------------------------- | ---------------------------------------------------- |
| 201    | Success                     | `Request created successfully`                       |
| 400    | Validation failed           | `Validation of body failed`                          |
| 401    | Not signed in               | `Authentication required`                            |
| 403    | Not a tenant                | `You don't have permission to do this`               |
| 404    | Property not found          | `Property not found`                                 |
| 409    | Property is not `AVAILABLE` | `Property is not available`                          |
| 409    | Open request already exists | `You already have an open request for this property` |

---

## Get Own Requests

`GET /api/tenant/requests` · Tenant

Returns the signed-in tenant's requests, newest first.

**Query**

| Param    | Type    | Default | Rules                                                    |
| -------- | ------- | ------- | -------------------------------------------------------- |
| `page`   | integer | `1`     | Minimum 1                                                |
| `limit`  | integer | `10`    | 1 to 50                                                  |
| `status` | enum    |         | `PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `COMPLETED` |

**Example**

```
GET /api/tenant/requests?page=1&limit=10&status=PENDING
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Requests fetched successfully`        |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not a tenant      | `You don't have permission to do this` |

`meta` is `{ page, limit, total }`.

---

## Get Own Request By ID

`GET /api/tenant/requests/:id` · Tenant (owner)

**Responses**

| Status | When                              | Message                                |
| ------ | --------------------------------- | -------------------------------------- |
| 200    | Success                           | `Request fetched successfully`         |
| 400    | Validation failed                 | `Validation of params failed`          |
| 401    | Not signed in                     | `Authentication required`              |
| 403    | Not a tenant                      | `You don't have permission to do this` |
| 403    | Request belongs to another tenant | `This request isn't yours`             |
| 404    | Request not found                 | `Request not found`                    |

---

## Get Requests For Own Properties

`GET /api/landlord/requests` · Landlord

Returns requests for the signed-in landlord's properties, newest first. Query params and
`meta` are the same as [Get Own Requests](#get-own-requests).

**Example**

```
GET /api/landlord/requests?page=1&limit=10&status=PENDING
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Requests fetched successfully`        |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not a landlord    | `You don't have permission to do this` |

---

## Update Request Status

`PATCH /api/landlord/requests/:id` · Landlord (property owner)

**Body**

| Field    | Type | Rules                                                                                                |
| -------- | ---- | ---------------------------------------------------------------------------------------------------- |
| `status` | enum | `APPROVED` or `REJECTED` (from `PENDING`), `REJECTED` (from `APPROVED`), `COMPLETED` (from `ACTIVE`) |

**Example**

```json
{
  "status": "APPROVED"
}
```

**Responses**

| Status | When                                                     | Message                                                                             |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 200    | Success                                                  | `Request status updated successfully`                                               |
| 400    | Validation failed                                        | `Validation of params failed` or `Validation of body failed`                        |
| 401    | Not signed in                                            | `Authentication required`                                                           |
| 403    | Not a landlord                                           | `You don't have permission to do this`                                              |
| 403    | Property belongs to another landlord                     | `This request isn't for your property`                                              |
| 404    | Request not found                                        | `Request not found`                                                                 |
| 409    | Property is not in the required status (see table above) | `Property is not available`, `Property is not reserved` or `Property is not rented` |
| 409    | Transition not allowed                                   | `Cannot change a <FROM> request to <TO>`                                            |
| 409    | Status changed concurrently                              | `Request status has changed, please retry`                                          |
| 409    | Rejecting an `APPROVED` request during a checkout        | `The tenant is paying the deposit, try again after the checkout ends`               |
