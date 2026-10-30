## Inbox

### Key-Value

| Key               | Value              |
| ----------------- | ------------------ |
| Input Validation  | Zod                |
| Image Upload      | UploadThing        |
| API Documentation | Postman collection |
| Commits           | >= 20              |

### Prisma

- Multi-file schema (prsima/models)
- Seed script

### Core Business Logic

- Landlord creates property
- Tenant browses properties
- Tenant submits request
  - request_status = PENDING
- Landlord approves reuest
  - request_status = APPROVED
- Landlord rejects request
  - request_status = REJECTED
- Tenant creates payment
  - payment_status = PENDING
- Tenant completes payment
- Webhook calls backend
  - property_status = RENTED
  - request_status = ACTIVE
  - payment_status = COMPLETED
- Landlord completes request
  - property_status = AVAILABLE
  - request_status = COMPLETED
- Tenant leaves review
