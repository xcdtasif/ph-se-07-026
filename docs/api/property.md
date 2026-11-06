# Property

| Group    | Base path                  | Access   |
| -------- | -------------------------- | -------- |
| Public   | `/api/properties`          | Everyone |
| Landlord | `/api/landlord/properties` | Landlord |

## Property object

`rent` and `deposit` are decimals with 2 decimal places (up to 9,999,999,999.99) and are serialized as strings.

```json
{
  "id": "6f1c2d3e-0000-4000-8000-000000000000",
  "landlordId": "a1b2c3d4-0000-4000-8000-000000000000",
  "categoryId": "9e8d7c6b-0000-4000-8000-000000000000",
  "name": "Sunny 2-Bed Apartment in Dhanmondi",
  "description": "Bright two-bedroom apartment with a balcony, close to the lake and public transport.",
  "location": "Dhanmondi, Dhaka",
  "images": [
    "https://picsum.photos/seed/sunny-2-bed-apartment-in-dhanmondi-1/800/600",
    "https://picsum.photos/seed/sunny-2-bed-apartment-in-dhanmondi-2/800/600"
  ],
  "rent": "28000",
  "deposit": "56000",
  "status": "AVAILABLE",
  "createdAt": "2026-11-05T10:00:00.000Z",
  "updatedAt": "2026-11-05T10:00:00.000Z",
  "category": {
    "id": "9e8d7c6b-0000-4000-8000-000000000000",
    "name": "Apartment",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "landlord": {
    "id": "a1b2c3d4-0000-4000-8000-000000000000",
    "name": "Landlord 01"
  }
}
```

---

## Get All Properties

`GET /api/properties` · Public

Returns a paginated list of properties. Only `AVAILABLE` properties are listed.

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
GET /api/properties?search=dhaka&minRent=10000&maxRent=30000&sort=RENT_ASC&page=1&limit=10
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

Returns a single property in any status.

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Responses**

| Status | When               | Message                         |
| ------ | ------------------ | ------------------------------- |
| 200    | Success            | `Property fetched successfully` |
| 400    | Validation failed  | `Validation of params failed`   |
| 404    | Property not found | `Property not found`            |

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
| `images`      | string[] | 1 to 2 valid URLs                        |
| `rent`        | number   | Greater than 0, at most 2 decimal places |
| `deposit`     | number   | 0 or more, at most 2 decimal places      |

**Example request body**

```json
{
  "categoryId": "9e8d7c6b-0000-4000-8000-000000000000",
  "name": "Cozy 1-Bed Apartment in Mirpur",
  "description": "Quiet one-bedroom apartment with natural light, near the metro station and local market.",
  "location": "Mirpur 10, Dhaka",
  "images": [
    "https://picsum.photos/seed/cozy-1-bed-apartment-in-mirpur-1/800/600",
    "https://picsum.photos/seed/cozy-1-bed-apartment-in-mirpur-2/800/600"
  ],
  "rent": 18500.5,
  "deposit": 37000
}
```

**Responses**

| Status | When                    | Message                                |
| ------ | ----------------------- | -------------------------------------- |
| 201    | Success                 | `Property created successfully`        |
| 400    | Validation failed       | `Validation of body failed`            |
| 401    | Not signed in           | `Authentication required`              |
| 403    | Not a landlord          | `You don't have permission to do this` |
| 404    | Category does not exist | `Category not found`                   |

---

## Update Property

`PATCH /api/landlord/properties/:id` · Landlord (owner)

Partial update. Send at least one field.

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Body** (all fields optional)

| Field         | Type     | Rules                                                                  |
| ------------- | -------- | ---------------------------------------------------------------------- |
| `categoryId`  | UUID     | Must be an existing category                                           |
| `name`        | string   | Trimmed, 2 to 100 characters                                           |
| `description` | string   | Trimmed, 10 to 2000 characters                                         |
| `location`    | string   | Trimmed, 2 to 200 characters                                           |
| `images`      | string[] | 1 to 2 valid URLs. Replaces the existing list                          |
| `rent`        | number   | Greater than 0, at most 2 decimal places                               |
| `deposit`     | number   | 0 or more, at most 2 decimal places                                    |
| `status`      | enum     | `AVAILABLE` or `UNAVAILABLE`. `RENTED` is set by the payment flow only |

**Example request body**

```json
{
  "rent": 27000,
  "status": "UNAVAILABLE"
}
```

**Responses**

| Status | When                                     | Message                                                      |
| ------ | ---------------------------------------- | ------------------------------------------------------------ |
| 200    | Success                                  | `Property updated successfully`                              |
| 400    | Validation failed                        | `Validation of params failed` or `Validation of body failed` |
| 401    | Not signed in                            | `Authentication required`                                    |
| 403    | Not a landlord                           | `You don't have permission to do this`                       |
| 403    | Property belongs to another landlord     | `You don't own this property`                                |
| 404    | Property or category not found           | `Property not found` or `Category not found`                 |
| 409    | Changing `status` of a `RENTED` property | `Cannot change the status of a rented property`              |

---

## Delete Property

`DELETE /api/landlord/properties/:id` · Landlord (owner)

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Responses**

| Status | When                                 | Message                                                                   |
| ------ | ------------------------------------ | ------------------------------------------------------------------------- |
| 200    | Success                              | `Property deleted successfully`                                           |
| 400    | Validation failed                    | `Validation of params failed`                                             |
| 401    | Not signed in                        | `Authentication required`                                                 |
| 403    | Not a landlord                       | `You don't have permission to do this`                                    |
| 403    | Property belongs to another landlord | `You don't own this property`                                             |
| 404    | Property not found                   | `Property not found`                                                      |
| 409    | Property has any requests            | `Cannot delete a property that has requests, mark it unavailable instead` |
