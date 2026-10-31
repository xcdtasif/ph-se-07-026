## Prisma Models

### User

id
name
email
password
role
is_banned
created_at
updated_at

### Category

id
name
created_at
updated_at

### Property

id
landlord_id
category_id
name
description
location
images
rent
deposit
status
created_at
updated_at

### Request

id
tenant_id
property_id
message
move_in_date
status
created_at
updated_at

### Payment

id
request_id
amount
status
created_at
updated_at

### Review

id
tenant_id
property_id
rating
comment
created_at
updated_at
