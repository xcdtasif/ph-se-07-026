## API Endpoints

### Auth

| Name            | Method | Endpoint           | Access          |
| --------------- | ------ | ------------------ | --------------- |
| Register        | POST   | /api/auth/register | All Users       |
| Log In          | POST   | /api/auth/login    | All Users       |
| Log Out         | POST   | /api/auth/logout   | Logged-In Users |
| Get Own Profile | GET    | /api/auth/profile  | Logged-In Users |
| Refresh Token   | POST   | /api/auth/refresh  | Logged-In Users |

### Property

| Name               | Method | Endpoint            | Access    |
| ------------------ | ------ | ------------------- | --------- |
| Get All Properties | GET    | /api/properties     | All Users |
| Get Property By ID | GET    | /api/properties/:id | All Users |

### Category

| Name               | Method | Endpoint        | Access    |
| ------------------ | ------ | --------------- | --------- |
| Get All Categories | GET    | /api/categories | All Users |
| Update Category    | PATCH  | /api/categories | Admin     |
| Delete Category    | DELETE | /api/categories | Admin     |

### Landlord

| Name                  | Method | Endpoint                     | Access   |
| --------------------- | ------ | ---------------------------- | -------- |
| Create Property       | POST   | /api/landlord/properties     | Landlord |
| Update Property       | PATCH  | /api/landlord/properties/:id | Landlord |
| Delete Property       | DELETE | /api/landlord/properties/:id | Landlord |
| Get Requests          | GET    | /api/landlord/requests       | Landlord |
| Update Request Status | PATCH  | /api/landlord/requests/:id   | Landlord |

### Request

| Name                  | Method | Endpoint          | Access |
| --------------------- | ------ | ----------------- | ------ |
| Create Request        | POST   | /api/requests     | Tenant |
| Get Own Requests      | GET    | /api/requests     | Tenant |
| Get Own Request By ID | GET    | /api/requests/:id | Tenant |

### Payment

| Name                  | Method | Endpoint              | Access |
| --------------------- | ------ | --------------------- | ------ |
| Create Payment        | POST   | /api/payments/create  | Tenant |
| Confirm Payment       | POST   | /api/payments/confirm | Tenant |
| Get Own Payments      | GET    | /api/payments         | Tenant |
| Get Own Payment By ID | GET    | /api/payments/:id     | Tenant |

### Review

| Name                 | Method | Endpoint         | Access |
| -------------------- | ------ | ---------------- | ------ |
| Create Review        | POST   | /api/reviews     | Tenant |
| Get Own Reviews      | GET    | /api/reviews     | Tenant |
| Get Own Review By ID | GET    | /api/reviews/:id | Tenant |

### Admin

| Name                   | Method | Endpoint                  | Access |
| ---------------------- | ------ | ------------------------- | ------ |
| Get All Users          | GET    | /api/admin/users          | Admin  |
| Get User By ID         | GET    | /api/admin/users/:id      | Admin  |
| Update User Status     | PATCH  | /api/admin/users/:id      | Admin  |
| Delete User            | DELETE | /api/admin/users/:id      | Admin  |
| Get All Properties     | GET    | /api/admin/properties     | Admin  |
| Get Property By ID     | GET    | /api/admin/properties/:id | Admin  |
| Update Property Status | PATCH  | /api/admin/properties/:id | Admin  |
| Delete Property        | DELETE | /api/admin/properties/:id | Admin  |
| Get All Requests       | GET    | /api/admin/requests       | Admin  |
| Get Request By ID      | GET    | /api/admin/requests/:id   | Admin  |
| Update Request Status  | PATCH  | /api/admin/requests/:id   | Admin  |
| Delete Request         | DELETE | /api/admin/requests/:id   | Admin  |
| Get All Reviews        | GET    | /api/admin/reviews        | Admin  |
| Get Review By ID       | GET    | /api/admin/reviews/:id    | Admin  |
| Delete Review          | DELETE | /api/admin/reviews/:id    | Admin  |
