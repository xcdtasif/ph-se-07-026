# Payment

| Group  | Base path              | Access           |
| ------ | ---------------------- | ---------------- |
| Tenant | `/api/tenant/payments` | Tenant           |
| Stripe | `/api/stripe/webhook`  | Stripe signature |

A tenant pays the property's `deposit` through Stripe Checkout after the landlord approves the
request. The amount is charged in BDT (Stripe amounts are in paisa, so the deposit is multiplied by 100). Only card payments are accepted.

## Payment object

```json
{
  "id": "9d8c7b6a-0000-4000-8000-000000000000",
  "requestId": "3b2a1c0d-0000-4000-8000-000000000000",
  "stripeSessionId": "cs_test_a1b2c3",
  "amount": "56000",
  "status": "PENDING",
  "createdAt": "2026-11-06T10:00:00.000Z",
  "updatedAt": "2026-11-06T10:00:00.000Z",
  "request": {
    "id": "3b2a1c0d-0000-4000-8000-000000000000",
    "tenantId": "c4d5e6f7-0000-4000-8000-000000000000",
    "status": "APPROVED",
    "property": {
      "id": "6f1c2d3e-0000-4000-8000-000000000000",
      "name": "Sunny 2-Bed Apartment in Dhanmondi",
      "location": "Dhanmondi, Dhaka"
    }
  }
}
```

`amount` is a decimal with 2 decimal places and is serialized as a string.

### Payment flow

1. The landlord approves the request, so the request is `APPROVED` and the property is `RESERVED`.
2. The tenant calls `POST /api/tenant/payments/create`, which returns a `PENDING` payment and a
   `checkoutUrl`. The client redirects the tenant to that URL.
3. The tenant pays on Stripe. Stripe sends `checkout.session.completed` to
   `POST /api/stripe/webhook`, and in one transaction:
   - the payment becomes `COMPLETED`
   - the request becomes `ACTIVE` and the property becomes `RENTED`
   - every other `PENDING` request on that property becomes `REJECTED`
4. A session lives for 35 minutes. If the tenant does not pay in time, Stripe sends
   `checkout.session.expired`, and in one transaction:
   - the payment becomes `FAILED`
   - the request becomes `REJECTED` and the property becomes `AVAILABLE` again

   The tenant has to send a new request to try again.

While a checkout is in progress (a `PENDING` payment younger than 35 minutes):

- Calling create again returns the same open `checkoutUrl` instead of a second session, so a tenant
  who closed the tab can come back to it. Simultaneous calls (a double click) are handled one at a
  time, so they also end up with one session.
- The landlord cannot reject the `APPROVED` request, so a paid deposit always finds its request
  still `APPROVED`.

The age check is what holds the lock, so it does not depend on a webhook arriving. The expired
webhook only does the clean-up. Stripe retries failed deliveries for days, so a missed one is
processed later. If a late "expired" webhook arrives for an old session while the request has a
newer checkout, it marks that payment `FAILED` and leaves the request alone.

After checkout, Stripe redirects the tenant to `CLIENT_URL/payments/success?session_id=...` or
`CLIENT_URL/payments/cancel`. The payment status is set by the webhook only, never by the redirect.

---

## Create Payment

`POST /api/tenant/payments/create` · Tenant

Creates a Stripe Checkout session for the deposit of an `APPROVED` request.

**Body**

| Field       | Type | Rules                                 |
| ----------- | ---- | ------------------------------------- |
| `requestId` | UUID | Must be the tenant's own approved one |

**Example**

```json
{
  "requestId": "3b2a1c0d-0000-4000-8000-000000000000"
}
```

**Responses**

The `201` response is a payment object with an extra `checkoutUrl` (the Stripe Checkout page).

| Status | When                                  | Message                                |
| ------ | ------------------------------------- | -------------------------------------- |
| 201    | Success                               | `Payment created successfully`         |
| 400    | Validation failed                     | `Validation of body failed`            |
| 401    | Not signed in                         | `Authentication required`              |
| 403    | Not a tenant                          | `You don't have permission to do this` |
| 403    | Request belongs to someone            | `This request isn't yours`             |
| 404    | Request not found                     | `Request not found`                    |
| 409    | Request is not `APPROVED`             | `Only an approved request can be paid` |
| 409    | Checkout paid, webhook pending        | `Your payment is being processed`      |
| 429    | Stripe rate limit                     | `Payment provider is busy, try again`  |
| 502    | Stripe rejected the request or failed | `Payment provider error`               |
| 503    | Stripe unreachable                    | `Payment provider unavailable`         |

---

## Get Own Payments

`GET /api/tenant/payments` · Tenant

Returns the signed-in tenant's payments, newest first.

**Query**

| Param    | Type    | Default | Rules                            |
| -------- | ------- | ------- | -------------------------------- |
| `page`   | integer | `1`     | Minimum 1                        |
| `limit`  | integer | `10`    | 1 to 50                          |
| `status` | enum    |         | `PENDING`, `COMPLETED`, `FAILED` |

**Example**

```
GET /api/tenant/payments?page=1&limit=10&status=COMPLETED
```

**Responses**

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 200    | Success           | `Payments fetched successfully`        |
| 400    | Validation failed | `Validation of query failed`           |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not a tenant      | `You don't have permission to do this` |

`meta` is `{ page, limit, total }`.

---

## Get Own Payment By ID

`GET /api/tenant/payments/:id` · Tenant

**Responses**

| Status | When                 | Message                                |
| ------ | -------------------- | -------------------------------------- |
| 200    | Success              | `Payment fetched successfully`         |
| 400    | Invalid `id`         | `Validation of params failed`          |
| 401    | Not signed in        | `Authentication required`              |
| 403    | Not a tenant         | `You don't have permission to do this` |
| 403    | Payment isn't theirs | `This payment isn't yours`             |
| 404    | Payment not found    | `Payment not found`                    |

---

## Stripe Webhook

`POST /api/stripe/webhook` · Stripe webhook

Called by Stripe, not by the client. The request must carry a valid `Stripe-Signature` header,
which is checked against `STRIPE_WEBHOOK_SECRET`. No cookie is needed. Handled events:

| Event                        | Effect                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| `checkout.session.completed` | Completes the payment (see the payment flow)               |
| `checkout.session.expired`   | Fails the payment, rejects the request, frees the property |

Other events are acknowledged and ignored. Processing is idempotent, so a repeated delivery
changes nothing.

To receive events locally, run `npm run stripe:listen` and copy the printed signing secret into
`STRIPE_WEBHOOK_SECRET`.

**Responses**

| Status | When                     | Message                          |
| ------ | ------------------------ | -------------------------------- |
| 200    | Success                  | `Webhook processed successfully` |
| 400    | Missing signature header | `Invalid webhook request`        |
| 400    | Signature does not match | `Invalid webhook signature`      |
