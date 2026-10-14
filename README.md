# ShopKart

MERN shopping app with cookie-based JWT authentication, product catalog, wishlist, and persistent cart.

## Run

1. Add `MONGODB_URI` and `JWT_SECRET` to `server/.env`.
2. Run `npm run dev` in `server`.
3. Run `npm run dev` in `client`.

The server seeds catalog products on its first MongoDB connection. Wishlist and cart routes use the signed-in customer from the JWT cookie.
