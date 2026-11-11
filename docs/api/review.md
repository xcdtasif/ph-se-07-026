# Review

| Group  | Base path             | Access |
| ------ | --------------------- | ------ |
| Tenant | `/api/tenant/reviews` | Tenant |

## Review object

```json
{
  "id": "9d8c7b6a-0000-4000-8000-000000000000",
  "tenantId": "c4d5e6f7-0000-4000-8000-000000000000",
  "propertyId": "6f1c2d3e-0000-4000-8000-000000000000",
  "requestId": "3b2a1c0d-0000-4000-8000-000000000000",
  "rating": 5,
  "comment": "Quiet building and a very responsive landlord.",
  "createdAt": "2026-11-08T10:00:00.000Z",
  "updatedAt": "2026-11-08T10:00:00.000Z",
  "property": {
    "id": "6f1c2d3e-0000-4000-8000-000000000000",
    "name": "Sunny 2-Bed Apartment in Dhanmondi",
    "location": "Dhanmondi, Dhaka",
    "images": ["https://0j6bmu5elp.ufs.sh/f/sunny-2-bed-apartment-in-dhanmondi-1"]
  }
}
```

### Rules

- A review belongs to one request, so a tenant can review a rental only once.
- A request can be reviewed only when its status is `COMPLETED`.
- `propertyId` is taken from the request, not from the body.
- Reviews cannot be edited or deleted by the tenant.

---

## Create Review

`POST /api/tenant/reviews` · Tenant (request owner)

**Body**

| Field       | Type    | Rules                                |
| ----------- | ------- | ------------------------------------ |
| `requestId` | UUID    | Must be your own `COMPLETED` request |
| `rating`    | integer | 1 to 5                               |
| `comment`   | string  | Trimmed, 10 to 1000 characters       |

**Example**

```json
{
  "requestId": "3b2a1c0d-0000-4000-8000-000000000000",
  "rating": 5,
  "comment": "Quiet building and a very responsive landlord."
}
```

**Responses**

| Status | When                       | Message                                  |
| ------ | -------------------------- | ---------------------------------------- |
| 201    | Success                    | `Review created successfully`            |
| 400    | Validation failed          | `Validation of body failed`              |
| 401    | Not signed in              | `Authentication required`                |
| 403    | Not a tenant               | `You don't have permission to do this`   |
| 403    | Request belongs to another | `This request isn't yours`               |
| 404    | Request not found          | `Request not found`                      |
| 409    | Request is not `COMPLETED` | `You can only review a completed rental` |
| 409    | Request already reviewed   | `You already reviewed this rental`       |

---

## Get Own Reviews

`GET /api/tenant/reviews` · Tenant

Returns the signed-in tenant's reviews, newest first.

**Query**

| Param   | Type    | Default | Rules     |
| ------- | ------- | ------- | --------- |
| `page`  | integer | `1`     | Minimum 1 |
| `limit` | integer | `10`    | 1 to 50   |

**Example**

```
GET /api/tenant/reviews?page=1&limit=10
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Reviews fetched successfully`         |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not a tenant      | `You don't have permission to do this` |

`meta` is `{ page, limit, total }`.

---

## Get Own Review By ID

`GET /api/tenant/reviews/:id` · Tenant (owner)

**Responses**

| Status | When                             | Message                                |
| ------ | -------------------------------- | -------------------------------------- |
| 200    | Success                          | `Review fetched successfully`          |
| 400    | Validation failed                | `Validation of params failed`          |
| 401    | Not signed in                    | `Authentication required`              |
| 403    | Not a tenant                     | `You don't have permission to do this` |
| 403    | Review belongs to another tenant | `This review isn't yours`              |
| 404    | Review not found                 | `Review not found`                     |
