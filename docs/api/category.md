# Category

Base path: `/api/categories`

## Category object

```json
{
  "id": "6f1c2d3e-0000-4000-8000-000000000000",
  "name": "Apartment",
  "createdAt": "2026-11-05T10:00:00.000Z",
  "updatedAt": "2026-11-05T10:00:00.000Z"
}
```

---

## Get All Categories

`GET /api/categories` · Public

Returns all categories sorted by name (A to Z). Not paginated.

**Responses**

| Status | When    | Message                           |
| ------ | ------- | --------------------------------- |
| 200    | Success | `Categories fetched successfully` |

---

## Create Category

`POST /api/categories` · Admin

**Body**

| Field  | Type   | Rules                       |
| ------ | ------ | --------------------------- |
| `name` | string | Trimmed, 2 to 50 characters |

**Example**

```json
{
  "name": "Warehouse"
}
```

**Responses**

| Status | When                                 | Message                                |
| ------ | ------------------------------------ | -------------------------------------- |
| 201    | Success                              | `Category created successfully`        |
| 400    | Validation failed                    | `Validation of body failed`            |
| 401    | Not signed in                        | `Authentication required`              |
| 403    | Not an admin                         | `You don't have permission to do this` |
| 409    | Name already used (case-insensitive) | `Category already exists`              |

---

## Update Category

`PATCH /api/categories/:id` · Admin

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Body**

| Field  | Type   | Rules                       |
| ------ | ------ | --------------------------- |
| `name` | string | Trimmed, 2 to 50 characters |

**Example**

```json
{
  "name": "Studio Apartment"
}
```

**Responses**

| Status | When                                  | Message                                                      |
| ------ | ------------------------------------- | ------------------------------------------------------------ |
| 200    | Success                               | `Category updated successfully`                              |
| 400    | Validation failed                     | `Validation of params failed` or `Validation of body failed` |
| 401    | Not signed in                         | `Authentication required`                                    |
| 403    | Not an admin                          | `You don't have permission to do this`                       |
| 404    | Category does not exist               | `Resource not found`                                         |
| 409    | Name already used by another category | `Category already exists`                                    |

---

## Delete Category

`DELETE /api/categories/:id` · Admin

**Params**

| Param | Type | Rules      |
| ----- | ---- | ---------- |
| `id`  | UUID | Valid UUID |

**Responses**

| Status | When                          | Message                                        |
| ------ | ----------------------------- | ---------------------------------------------- |
| 200    | Success                       | `Category deleted successfully`                |
| 400    | Validation failed             | `Validation of params failed`                  |
| 401    | Not signed in                 | `Authentication required`                      |
| 403    | Not an admin                  | `You don't have permission to do this`         |
| 404    | Category does not exist       | `Category not found`                           |
| 409    | Category still has properties | `Cannot delete a category that has properties` |
