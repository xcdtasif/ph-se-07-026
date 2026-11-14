# Postman Guide

The API is documented in Postman, with a request for every endpoint grouped by module and then by
who may call it (`Public`, `Authenticated`, `Tenant`, `Landlord`, `Admin`):

<https://documenter.getpostman.com/view/55697110/2sBYHaPcqk>

The Stripe webhook and the UploadThing route are left out. Stripe and the UploadThing client call
them, not you. To run the requests yourself, use **Run in Postman** on that page to import the
collection, then follow this guide. For endpoint rules and responses see [the API docs](api-docs).

## Environment

**Run in Postman** imports the collection together with the **ph-se-07-026-prod** environment.
Select that environment before sending a request. It sets `baseUrl` to the deployed API. Every
request starts with `{{baseUrl}}`, so the environment decides which server the request goes to.

To test a local server, create your own environment (or edit the value) with these values:

| Environment       | `baseUrl`                             |
| ----------------- | ------------------------------------- |
| ph-se-07-026-prod | `https://ph-se-07-026.vercel.app/api` |
| Your local one    | `http://localhost:5000/api`           |

Local assumes `PORT=5000` in `.env.local`.

## Variables

| Variable           | Scope       | Used by                        | Value                                           |
| ------------------ | ----------- | ------------------------------ | ----------------------------------------------- |
| `baseUrl`          | Environment | Every request                  | The API root of the selected environment        |
| `uploadthingAppId` | Collection  | **Create Property** image URLs | `0j6bmu5elp`, the server's `UPLOADTHING_APP_ID` |

`uploadthingAppId` comes with the collection, so nothing needs setting up for it on the deployed API.

The server only accepts property images hosted on its own UploadThing app, so every image URL must
start with `https://<appId>.ufs.sh/f/`. **Create Property** builds its URLs as
`https://{{uploadthingAppId}}.ufs.sh/f/...`. If your local `.env.local` has a different
`UPLOADTHING_APP_ID`, use that one when testing locally. If the value is empty or wrong, the request
fails with `400 Validation of body failed`.

## Authentication

The API authenticates with `httpOnly` cookies (`accessToken` and `refreshToken`). Postman keeps them
in its cookie jar, so there is no token to copy.

1. Send **Auth / Public / Login User** with the account for the role you want to test.
2. Send the requests for that role. The cookie is attached automatically.
3. To switch roles, log in again as the other user. A new login replaces the cookie.

Sample accounts come from `npm run db:seed` and are listed under
[Seed data](../README.md#seed-data). The admin account is the one in `ADMIN_EMAIL` and
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
[Request](api-docs/request.md) and [Payment](api-docs/payment.md) for every rule and response.
