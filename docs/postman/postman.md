# Postman collection

`ph-se-07-026.postman_collection.json` has a request for every endpoint in [docs/api](../api),
grouped by module and then by who may call it (`Public`, `Authenticated`, `Tenant`, `Landlord`,
`Admin`). The Stripe webhook and the UploadThing route are left out. Stripe and the UploadThing client
call them, not you.

## Import

In Postman choose **Import** and select the collection file. Then fill in the variables below
before sending anything. They are empty in the file.

## Variables

All three are collection variables. Open the collection and use the **Variables** tab. Set the
**Current value**, not only the initial one, so it stays on your machine.

| Variable           | Used by                             | Value                                           |
| ------------------ | ----------------------------------- | ----------------------------------------------- |
| `baseUrl`          | Every request, as `{{baseUrl}}/...` | The API root you are testing, including `/api`  |
| `baseUrl.bak`      | Nothing                             | The other API root, kept to swap with `baseUrl` |
| `uploadthingAppId` | **Create Property** image URLs      | `0j6bmu5elp`, the server's `UPLOADTHING_APP_ID` |

### `baseUrl` and `baseUrl.bak`

`baseUrl` is the API that requests go to right now. Requests use only `baseUrl`. `baseUrl.bak` is a
spare. It holds the other URL so you can switch between local and deployed by swapping the two
values, instead of typing a URL each time.

| Target     | Value                                 |
| ---------- | ------------------------------------- |
| Local      | `http://localhost:5000/api`           |
| Deployment | `https://ph-se-07-026.vercel.app/api` |

For example, put the deployed URL in `baseUrl` and the local one in `baseUrl.bak`. To switch to
local, swap the two values. Local assumes `PORT=5000` in `.env.local`.

### `uploadthingAppId`

The server only accepts property images hosted on its own UploadThing app, so every image URL
must start with `https://<appId>.ufs.sh/f/`. **Create Property** builds its URLs as
`https://{{uploadthingAppId}}.ufs.sh/f/...`. Set `uploadthingAppId` to `0j6bmu5elp`, the app the
deployed API uses. If your local `.env.local` has a different `UPLOADTHING_APP_ID`, use that one
when testing locally. If it is empty or wrong, the request fails with
`400 Validation of body failed`.

## Authentication

The API authenticates with `httpOnly` cookies (`accessToken` and `refreshToken`). Postman keeps them
in its cookie jar, so there is no token to copy.

1. Send **Auth / Public / Login User** with the account for the role you want to test.
2. Send the requests for that role. The cookie is attached automatically.
3. To switch roles, log in again as the other user. A new login replaces the cookie.

Sample accounts come from `npm run db:seed` and are listed under
[Seed data](../../README.md#seed-data). The admin account is the one in `ADMIN_EMAIL` and
`ADMIN_PASSWORD`. Edit the email and password in the **Login User** body to switch accounts.
`401` means the cookie is missing or expired. Log in again, or send **Refresh Tokens**.

## Example IDs and bodies

The UUIDs in the URLs and bodies are examples from one database, so most of them return `404` on
yours. Replace them with IDs from your own responses. For instance, take a property ID from **Get
All Properties** or **Get Own Properties**.

## Trying the rental flow

Each step needs the role in brackets and the ID from the previous step.

1. **Create Property** (landlord)
2. **Create Request** (tenant)
3. **Update Request Status** with `APPROVED` (landlord)
4. **Create Payment** (tenant). Open the `checkoutUrl` from the response in a browser. Pay with
   Stripe's test card `4242 4242 4242 4242`. The webhook then makes the request `ACTIVE`.
5. **Update Request Status** with `COMPLETED` (landlord)
6. **Create Review** (tenant)

Step 4 needs `npm run stripe:listen` locally, or the webhook set up on the deployment. The seed
already has an `APPROVED` request for `tenant01`, so you can start at step 4. See
[Request](../api/request.md) and [Payment](../api/payment.md) for every rule and response.
