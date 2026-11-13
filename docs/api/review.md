# Review

## Endpoints

`:name` is a path param, `?…` means query params and `{…}` means a request body. Details are in each section.

| Name                                                              | Endpoint                                    | Access   |
| ----------------------------------------------------------------- | ------------------------------------------- | -------- |
| [Get Property Reviews](#get-property-reviews)                     | `GET /api/properties/:propertyId/reviews?…` | Public   |
| [Create Review](#create-review)                                   | `POST /api/tenant/reviews {…}`              | Tenant   |
| [Get Own Reviews](#get-own-reviews)                               | `GET /api/tenant/reviews?…`                 | Tenant   |
| [Get Own Review By ID](#get-own-review-by-id)                     | `GET /api/tenant/reviews/:id`               | Tenant   |
| [Get Reviews For Own Properties](#get-reviews-for-own-properties) | `GET /api/landlord/reviews?…`               | Landlord |
| [Get All Reviews (Admin)](#get-all-reviews-admin)                 | `GET /api/admin/reviews?…`                  | Admin    |
| [Update Review Visibility](#update-review-visibility)             | `PATCH /api/admin/reviews/:id {…}`          | Admin    |

## Review object

```json
{
  "id": "9d8c7b6a-0000-4000-8000-000000000000",
  "tenantId": "c4d5e6f7-0000-4000-8000-000000000000",
  "propertyId": "6f1c2d3e-0000-4000-8000-000000000000",
  "requestId": "3b2a1c0d-0000-4000-8000-000000000000",
  "rating": 5,
  "comment": "Quiet building and a very responsive landlord.",
  "isHidden": false,
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
- An admin can hide a review with `isHidden`. A hidden review is left out of the public and landlord
  lists and of the property's `reviewCount` and `averageRating`. The tenant still sees it in their own
  reviews with `isHidden: true`.
- Hiding does not free the request's review slot, so the tenant cannot post a replacement.

### Shapes

- **Tenant**: the object above, with the `property` summary.
- **Public**: no `tenantId`, `requestId`, `isHidden` or `property`. It has
  `tenant`: `{ "name" }` instead.
- **Landlord**: the object above plus `tenant`: `{ "name" }`.
- **Admin**: the object above plus `tenant`: `{ "id", "name", "email" }`.

---

## Get Property Reviews

`GET /api/properties/:propertyId/reviews` · Public

Returns a property's visible reviews, newest first. A property that is
[hidden](property.md#visibility), or whose landlord is banned, returns `404`.

**Query**

| Param   | Type    | Default | Rules     |
| ------- | ------- | ------- | --------- |
| `page`  | integer | `1`     | Minimum 1 |
| `limit` | integer | `10`    | 1 to 50   |

**Example**

```
GET /api/properties/6f1c2d3e-0000-4000-8000-000000000000/reviews?page=1&limit=10
```

**Responses**

| Status | When                          | Message                                                       |
| ------ | ----------------------------- | ------------------------------------------------------------- |
| 200    | Success                       | `Reviews fetched successfully`                                |
| 400    | Validation failed             | `Validation of params failed` or `Validation of query failed` |
| 404    | Property not found, or hidden | `Property not found`                                          |

`meta` is `{ page, limit, total }`.

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

---

## Get Reviews For Own Properties

`GET /api/landlord/reviews` · Landlord

Returns the visible reviews of the signed-in landlord's properties, newest first.

**Query**

| Param        | Type    | Default | Rules                                                    |
| ------------ | ------- | ------- | -------------------------------------------------------- |
| `page`       | integer | `1`     | Minimum 1                                                |
| `limit`      | integer | `10`    | 1 to 50                                                  |
| `propertyId` | UUID    |         | Only this property's reviews. It must be one of your own |

**Example**

```
GET /api/landlord/reviews?page=1&limit=10&propertyId=6f1c2d3e-0000-4000-8000-000000000000
```

**Responses**

| Status | When                                 | Message                                |
| ------ | ------------------------------------ | -------------------------------------- |
| 200    | Success                              | `Reviews fetched successfully`         |
| 400    | Validation failed                    | `Validation of query failed`           |
| 401    | Not signed in                        | `Authentication required`              |
| 403    | Not a landlord                       | `You don't have permission to do this` |
| 403    | Property belongs to another landlord | `You don't own this property`          |
| 404    | `propertyId` matches no property     | `Property not found`                   |

`meta` is `{ page, limit, total }`.

---

## Get All Reviews (Admin)

`GET /api/admin/reviews` · Admin

Returns a paginated list of all reviews, newest first, including hidden ones.

**Query**

| Param        | Type    | Default | Rules              |
| ------------ | ------- | ------- | ------------------ |
| `page`       | integer | `1`     | Minimum 1          |
| `limit`      | integer | `10`    | 1 to 50            |
| `propertyId` | UUID    |         | Filter by property |
| `tenantId`   | UUID    |         | Filter by tenant   |
| `isHidden`   | boolean |         | `true` or `false`  |

**Example**

```
GET /api/admin/reviews?page=1&limit=10&isHidden=false
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Reviews fetched successfully`         |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not an admin      | `You don't have permission to do this` |

`meta` is `{ page, limit, total }`.

---

## Update Review Visibility

`PATCH /api/admin/reviews/:id` · Admin

Hides or unhides a review, for example an obscene comment.

**Body**

| Field      | Type    | Rules                         |
| ---------- | ------- | ----------------------------- |
| `isHidden` | boolean | `true` hides, `false` unhides |

**Example**

```json
{
  "isHidden": true
}
```

**Responses**

| Status | When              | Message                                                        |
| ------ | ----------------- | -------------------------------------------------------------- |
| 200    | Success           | `Review hidden successfully` or `Review unhidden successfully` |
| 400    | Validation failed | `Validation of params failed` or `Validation of body failed`   |
| 401    | Not signed in     | `Authentication required`                                      |
| 403    | Not an admin      | `You don't have permission to do this`                         |
| 404    | Review not found  | `Review not found`                                             |
