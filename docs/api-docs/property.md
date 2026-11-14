# Property

## Endpoints

`:name` is a path param, `?…` means query params and `{…}` means a request body. Details are in each section.

| Name                                                      | Endpoint                                 | Access   |
| --------------------------------------------------------- | ---------------------------------------- | -------- |
| [Get All Properties](#get-all-properties)                 | `GET /api/properties?…`                  | Public   |
| [Get Property By ID](#get-property-by-id)                 | `GET /api/properties/:id`                | Public   |
| [Get Own Properties](#get-own-properties)                 | `GET /api/landlord/properties?…`         | Landlord |
| [Create Property](#create-property)                       | `POST /api/landlord/properties {…}`      | Landlord |
| [Update Property](#update-property)                       | `PATCH /api/landlord/properties/:id {…}` | Landlord |
| [Delete Property](#delete-property)                       | `DELETE /api/landlord/properties/:id`    | Landlord |
| [Get All Properties (Admin)](#get-all-properties-admin)   | `GET /api/admin/properties?…`            | Admin    |
| [Update Property Visibility](#update-property-visibility) | `PATCH /api/admin/properties/:id {…}`    | Admin    |

## Property object

`rent` and `deposit` are decimals with 2 decimal places (up to 999,999.99) and are serialized as strings.

```json
{
  "id": "6f1c2d3e-0000-4000-8000-000000000000",
  "landlordId": "a1b2c3d4-0000-4000-8000-000000000000",
  "categoryId": "9e8d7c6b-0000-4000-8000-000000000000",
  "name": "Sunny 2-Bed Apartment in Dhanmondi",
  "description": "Bright two-bedroom apartment with a balcony, close to the lake and public transport.",
  "location": "Dhanmondi, Dhaka",
  "images": [
    "https://<appId>.ufs.sh/f/sunny-2-bed-apartment-in-dhanmondi-1",
    "https://<appId>.ufs.sh/f/sunny-2-bed-apartment-in-dhanmondi-2"
  ],
  "rent": "28000",
  "deposit": "56000",
  "status": "AVAILABLE",
  "isHidden": false,
  "createdAt": "2026-11-05T10:00:00.000Z",
  "updatedAt": "2026-11-05T10:00:00.000Z",
  "landlord": {
    "id": "a1b2c3d4-0000-4000-8000-000000000000",
    "name": "Landlord 01"
  },
  "category": {
    "id": "9e8d7c6b-0000-4000-8000-000000000000",
    "name": "Apartment",
    "createdAt": "2026-11-05T09:00:00.000Z",
    "updatedAt": "2026-11-05T09:00:00.000Z"
  }
}
```

`isHidden` is set by an admin only. Public reads, [Get All Properties](#get-all-properties) and
[Get Property By ID](#get-property-by-id), also include `reviewCount` and `averageRating`, counted
from the property's visible [reviews](review.md). `averageRating` is rounded to one decimal and is
`null` when there are no reviews.

### Visibility

A property is hidden from the public when an admin hides it or when its landlord is banned. Nothing
is written when a landlord is banned, so unbanning shows the properties again.

| Action                                                 | Hidden or banned-landlord property |
| ------------------------------------------------------ | ---------------------------------- |
| Public list, get by ID, and [reviews](review.md)       | Not shown, `404` for a single read |
| Create a request                                       | `404 Property not found`           |
| Landlord approves a `PENDING` request                  | `409 Property isn't available`     |
| Tenant creates or reuses a checkout                    | `409 Property isn't available`     |
| Landlord rejects or completes, tenant cancels          | Allowed                            |
| Stripe webhook for a checkout that was already created | Processed normally                 |

---

## Get All Properties

`GET /api/properties` · Public

Returns a paginated list of properties. Only `AVAILABLE` properties are listed, and only those that
aren't [hidden](#visibility). Each property includes `reviewCount` and `averageRating`.

**Query**

| Param        | Type    | Default  | Rules                                                                        |
| ------------ | ------- | -------- | ---------------------------------------------------------------------------- |
| `page`       | integer | `1`      | Minimum 1                                                                    |
| `limit`      | integer | `10`     | 1 to 50                                                                      |
| `search`     | string  |          | 1 to 100 characters. Case-insensitive match on name, location or description |
| `categoryId` | UUID    |          | Filter by category                                                           |
| `minRent`    | number  |          | 0 or more. Must not exceed `maxRent`                                         |
| `maxRent`    | number  |          | 0 or more                                                                    |
| `sort`       | enum    | `NEWEST` | `NEWEST`, `RENT_ASC`, `RENT_DESC`                                            |

Unknown query params are rejected with `400`.

**Example**

```
GET /api/properties?page=1&limit=10&search=dhaka&categoryId=9e8d7c6b-0000-4000-8000-000000000000&minRent=10000&maxRent=30000&sort=NEWEST
```

**Responses**

| Status | When              | Message                           |
| ------ | ----------------- | --------------------------------- |
| 200    | Success           | `Properties fetched successfully` |
| 400    | Validation failed | `Validation of query failed`      |

`data` is an array of property objects and `meta` is `{ page, limit, total }`, where `total`
is the number of properties matching the filters.

---

## Get Property By ID

`GET /api/properties/:id` · Public

Returns a single property in any status, unless it's [hidden](#visibility). It includes
`reviewCount` and `averageRating`.

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Responses**

| Status | When                          | Message                         |
| ------ | ----------------------------- | ------------------------------- |
| 200    | Success                       | `Property fetched successfully` |
| 400    | Validation failed             | `Validation of params failed`   |
| 404    | Property not found, or hidden | `Property not found`            |

---

## Get Own Properties

`GET /api/landlord/properties` · Landlord

Returns a paginated list of the signed-in landlord's properties, newest first, in any status and
including ones an admin has [hidden](#visibility). Each property has `isHidden`, `reviewCount` and
`averageRating`.

**Query**

| Param      | Type    | Default | Rules                                                                        |
| ---------- | ------- | ------- | ---------------------------------------------------------------------------- |
| `page`     | integer | `1`     | Minimum 1                                                                    |
| `limit`    | integer | `10`    | 1 to 50                                                                      |
| `search`   | string  |         | 1 to 100 characters. Case-insensitive match on name, location or description |
| `status`   | enum    |         | `AVAILABLE`, `UNAVAILABLE`, `RESERVED`, `RENTED`                             |
| `isHidden` | boolean |         | `true` or `false`                                                            |

**Example**

```
GET /api/landlord/properties?page=1&limit=10&status=AVAILABLE
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Properties fetched successfully`      |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not a landlord    | `You don't have permission to do this` |

`meta` is `{ page, limit, total }`.

---

## Create Property

`POST /api/landlord/properties` · Landlord

Creates a property owned by the signed-in landlord. New properties start as `AVAILABLE`.

**Body**

| Field         | Type     | Rules                                    |
| ------------- | -------- | ---------------------------------------- |
| `categoryId`  | UUID     | Must be an existing category             |
| `name`        | string   | Trimmed, 2 to 100 characters             |
| `description` | string   | Trimmed, 10 to 2000 characters           |
| `location`    | string   | Trimmed, 2 to 200 characters             |
| `images`      | string[] | 1 to 2 [UploadThing](upload.md) URLs     |
| `rent`        | number   | Greater than 0, at most 2 decimal places |
| `deposit`     | number   | Greater than 0, at most 2 decimal places |

Upload the images first (see [Upload](upload.md)) and send the URLs it returns. URLs from any
other host are rejected.

**Example**

```json
{
  "categoryId": "9e8d7c6b-0000-4000-8000-000000000000",
  "name": "Cozy 1-Bed Apartment in Mirpur",
  "description": "Quiet one-bedroom apartment with natural light, near the metro station and local market.",
  "location": "Mirpur 10, Dhaka",
  "images": [
    "https://<appId>.ufs.sh/f/cozy-1-bed-apartment-in-mirpur-1",
    "https://<appId>.ufs.sh/f/cozy-1-bed-apartment-in-mirpur-2"
  ],
  "rent": 18500.5,
  "deposit": 37000
}
```

**Responses**

| Status | When                   | Message                                |
| ------ | ---------------------- | -------------------------------------- |
| 201    | Success                | `Property created successfully`        |
| 400    | Validation failed      | `Validation of body failed`            |
| 401    | Not signed in          | `Authentication required`              |
| 403    | Not a landlord         | `You don't have permission to do this` |
| 404    | Category doesn't exist | `Category not found`                   |

---

## Update Property

`PATCH /api/landlord/properties/:id` · Landlord (owner)

Partial update. Send at least one field.

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Body** (all fields optional)

| Field         | Type     | Rules                                                                                              |
| ------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `categoryId`  | UUID     | Must be an existing category                                                                       |
| `name`        | string   | Trimmed, 2 to 100 characters                                                                       |
| `description` | string   | Trimmed, 10 to 2000 characters                                                                     |
| `location`    | string   | Trimmed, 2 to 200 characters                                                                       |
| `images`      | string[] | 1 to 2 [UploadThing](upload.md) URLs. Replaces the existing list                                   |
| `rent`        | number   | Greater than 0, at most 2 decimal places                                                           |
| `deposit`     | number   | Greater than 0, at most 2 decimal places                                                           |
| `status`      | enum     | `AVAILABLE` or `UNAVAILABLE`. `RESERVED` and `RENTED` are set by the request and payment flow only |

**Status changes**

- `AVAILABLE` → `UNAVAILABLE` hides the property and rejects all its `PENDING` requests in the same
  transaction.
- `UNAVAILABLE` → `AVAILABLE` is allowed at any time.
- A `RESERVED` or `RENTED` property (one with an `APPROVED` or `ACTIVE` request) can't have its
  status changed. Reject the `APPROVED` request or complete the `ACTIVE` one first.

**Images**

`images` replaces the whole list. Files that were in the old list and aren't in the new one are
deleted from UploadThing, unless another property still uses them.

**Reserved properties**

A `RESERVED` property can't be edited at all, so the deposit a tenant is about to pay can't change.
A `RENTED` property can still be edited, except for its `status`.

**Example**

```json
{
  "rent": 27000,
  "status": "UNAVAILABLE"
}
```

**Responses**

| Status | When                                                   | Message                                                      |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| 200    | Success                                                | `Property updated successfully`                              |
| 400    | Validation failed                                      | `Validation of params failed` or `Validation of body failed` |
| 401    | Not signed in                                          | `Authentication required`                                    |
| 403    | Not a landlord                                         | `You don't have permission to do this`                       |
| 403    | Property belongs to another landlord                   | `You don't own this property`                                |
| 404    | Property or category not found                         | `Property not found` or `Category not found`                 |
| 409    | Changing `status` of a `RESERVED` or `RENTED` property | `Can't change the status of a reserved or rented property`   |
| 409    | Editing a `RESERVED` property                          | `Can't update a reserved property`                           |

---

## Delete Property

`DELETE /api/landlord/properties/:id` · Landlord (owner)

The property's images are deleted from UploadThing, unless another property still uses them.

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Responses**

| Status | When                                 | Message                                                                  |
| ------ | ------------------------------------ | ------------------------------------------------------------------------ |
| 200    | Success                              | `Property deleted successfully`                                          |
| 400    | Validation failed                    | `Validation of params failed`                                            |
| 401    | Not signed in                        | `Authentication required`                                                |
| 403    | Not a landlord                       | `You don't have permission to do this`                                   |
| 403    | Property belongs to another landlord | `You don't own this property`                                            |
| 404    | Property not found                   | `Property not found`                                                     |
| 409    | Property has any requests            | `Can't delete a property that has requests, mark it unavailable instead` |

---

## Get All Properties (Admin)

`GET /api/admin/properties` · Admin

Returns a paginated list of all properties, newest first, including hidden ones and any status.
Each property has the `landlord` object extended with `email` and `isBanned`, and no rating
summary.

**Query**

| Param        | Type    | Default | Rules                                                                        |
| ------------ | ------- | ------- | ---------------------------------------------------------------------------- |
| `page`       | integer | `1`     | Minimum 1                                                                    |
| `limit`      | integer | `10`    | 1 to 50                                                                      |
| `search`     | string  |         | 1 to 100 characters. Case-insensitive match on name, location or description |
| `landlordId` | UUID    |         | Filter by landlord                                                           |
| `status`     | enum    |         | `AVAILABLE`, `UNAVAILABLE`, `RESERVED`, `RENTED`                             |
| `isHidden`   | boolean |         | `true` or `false`                                                            |

**Example**

```
GET /api/admin/properties?page=1&limit=10&isHidden=true
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Properties fetched successfully`      |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not an admin      | `You don't have permission to do this` |

`meta` is `{ page, limit, total }`.

---

## Update Property Visibility

`PATCH /api/admin/properties/:id` · Admin

Hides or unhides a property. A hidden property follows the [visibility](#visibility) rules. Its
`status` isn't changed, its `PENDING` requests aren't rejected, and the landlord can't undo it.

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

| Status | When               | Message                                                            |
| ------ | ------------------ | ------------------------------------------------------------------ |
| 200    | Success            | `Property hidden successfully` or `Property unhidden successfully` |
| 400    | Validation failed  | `Validation of params failed` or `Validation of body failed`       |
| 401    | Not signed in      | `Authentication required`                                          |
| 403    | Not an admin       | `You don't have permission to do this`                             |
| 404    | Property not found | `Property not found`                                               |
