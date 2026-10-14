# ShopKart Postman Checks

This folder contains an importable Postman collection and local environment. Postman is an API client. It calls backend routes directly, without React frontend. This helps isolate backend problems.

## Files

- ShopKart.postman_collection.json contains health, authentication, and validation checks.
- ShopKart.local.postman_environment.json contains local server address and disposable test values.

No database password, JWT secret, or other private value is stored here.

## Import and run

1. Start ShopKart backend. Confirm its terminal says MongoDB connected and Server running.
2. Open Postman.
3. Import both JSON files from this folder.
4. Select ShopKart Local environment in Postman top-right environment selector.
5. Open ShopKart API collection.
6. Send Health check. It must pass with 200.
7. Send every request in 02 Happy path from top to bottom.
8. Open Test Results after each request. Every assertion should pass.
9. Send requests in 03 Expected validation failures. Those requests are successful tests when they return expected 400 or 401.

## Cookie behavior

Register and Login return HttpOnly token cookie. Postman stores cookie in its cookie jar for local backend address. Get current customer and Log out depend on stored cookie.

If current customer returns 401 after successful login, open Postman Cookies for local backend address. Confirm token cookie exists. Then confirm backend URL exactly matches environment baseUrl.

## What each test proves

| Request | What it verifies |
| --- | --- |
| Health check | Express server is reachable |
| Register fresh customer | Input validation, bcrypt hashing, MongoDB creation, safe response, cookie creation |
| Log in registered customer | Email lookup, bcrypt comparison, JWT creation |
| Get current customer | Cookie transfer, JWT verification, protected route |
| Log out | Cookie-clearing response |
| Current customer after logout | Protected route rejects unauthenticated request |
| Validation failures | Backend rejects bad input even when no browser form protects it |

## Run order warning

Register fresh customer creates new timestamp-based email each run. Do not change Happy path order. Log in, Get current customer, and wrong-password test use generated email.
