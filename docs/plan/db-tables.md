## DB Tables

### users

id
name
email
password
role (ADMIN, LANDLORD, TENANT)
is_banned

created_at
updated_at

### categories

id
name

created_at
updated_at

### properties

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

### requests

id
tenant_id
property_id
message
move_in_date
status

created_at
updated_at

### payments

id
request_id
amount
status

created_at
updated_at

### reviews

id
tenant_id
property_id
rating
comment

created_at
updated_at
