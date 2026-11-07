## API Endpoints

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
