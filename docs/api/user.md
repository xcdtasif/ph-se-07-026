# User

Every endpoint that responds with a user returns the [user object](auth.md#user-object). The password
is never included.

## Endpoints

`:name` is a path param, `?…` means query params and `{…}` means a request body. Details are in each section.

| Name                                      | Endpoint                         | Access        |
| ----------------------------------------- | -------------------------------- | ------------- |
| [Get Me](#get-me)                         | `GET /api/users/me`              | Authenticated |
| [Update Me](#update-me)                   | `PATCH /api/users/me {…}`        | Authenticated |
| [Get All Users](#get-all-users)           | `GET /api/admin/users?…`         | Admin         |
| [Update User Status](#update-user-status) | `PATCH /api/admin/users/:id {…}` | Admin         |

## Banning

Banning sets `isBanned` and changes nothing else.

- A banned user is locked out at once. Login, token refresh and every authenticated request return
  `403`, including requests that use an access token issued before the ban.
- Their data stays as it is. A banned landlord's properties are hidden from the public list, from
  [Get Property By ID](property.md#get-property-by-id) and from new requests, but are not changed.
  Unbanning shows them again.
- Admin accounts cannot be banned, so an admin cannot ban another admin or themselves.

---

## Get Me

`GET /api/users/me` · Authenticated

Returns the signed-in user.

**Responses**

| Status | When                         | Message                        |
| ------ | ---------------------------- | ------------------------------ |
| 200    | Success                      | `Profile fetched successfully` |
| 401    | Not signed in / user deleted | `Authentication required`      |
| 403    | Account is banned            | `Your account has been banned` |

---

## Update Me

`PATCH /api/users/me` · Authenticated

Updates the signed-in user's profile. Only `name` can be changed.

**Body**

| Field  | Type   | Rules                        |
| ------ | ------ | ---------------------------- |
| `name` | string | Trimmed, 2 to 100 characters |

Unknown fields, such as `role`, `email` or `isBanned`, are rejected with `400`.

**Example**

```json
{
  "name": "Tenant One"
}
```

**Responses**

| Status | When                         | Message                        |
| ------ | ---------------------------- | ------------------------------ |
| 200    | Success                      | `Profile updated successfully` |
| 400    | Validation failed            | `Validation of body failed`    |
| 401    | Not signed in / user deleted | `Authentication required`      |
| 403    | Account is banned            | `Your account has been banned` |

---

## Get All Users

`GET /api/admin/users` · Admin

Returns a paginated list of all users, newest first.

**Query**

| Param      | Type    | Default | Rules                                                        |
| ---------- | ------- | ------- | ------------------------------------------------------------ |
| `page`     | integer | `1`     | Minimum 1                                                    |
| `limit`    | integer | `10`    | 1 to 50                                                      |
| `search`   | string  |         | 1 to 100 characters. Case-insensitive match on name or email |
| `role`     | enum    |         | `ADMIN`, `LANDLORD`, `TENANT`                                |
| `isBanned` | boolean |         | `true` or `false`                                            |

**Example**

```
GET /api/admin/users?page=1&limit=10&role=LANDLORD&isBanned=false
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Users fetched successfully`           |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not an admin      | `You don't have permission to do this` |

`meta` is `{ page, limit, total }`.

---

## Update User Status

`PATCH /api/admin/users/:id` · Admin

Bans or unbans a user. See [Banning](#banning).

**Body**

| Field      | Type    | Rules                       |
| ---------- | ------- | --------------------------- |
| `isBanned` | boolean | `true` bans, `false` unbans |

**Example**

```json
{
  "isBanned": true
}
```

**Responses**

| Status | When                 | Message                                                      |
| ------ | -------------------- | ------------------------------------------------------------ |
| 200    | Success              | `User banned successfully` or `User unbanned successfully`   |
| 400    | Validation failed    | `Validation of params failed` or `Validation of body failed` |
| 401    | Not signed in        | `Authentication required`                                    |
| 403    | Not an admin         | `You don't have permission to do this`                       |
| 403    | The user is an admin | `Admin accounts cannot be banned`                            |
| 404    | User not found       | `User not found`                                             |
