# AVIRA Backend

This server provides a complete local backend with SQLite storage and JWT authentication.

## Setup

npm install
npm start

For deployment, set `JWT_SECRET` to a random value of at least 32 characters and set `FRONTEND_ORIGIN` to the public frontend origin when the frontend and API use different domains. The backend can also serve the repository's static frontend from the same origin with `npm start`.

## Endpoints

- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/social
- GET /api/user/me
- GET /api/records
- POST /api/records
- DELETE /api/records/:id
- GET /api/cycle
- POST /api/cycle
- DELETE /api/cycle/:id
- GET /api/centres

## Production notes

- Do not commit `.env` or `data.db`.
- Use HTTPS so browser geolocation works on the Centres page.
- SQLite requires persistent disk storage on the hosting provider, or it should be replaced with a managed database before scaling horizontally.
- Set `DATA_DIR` to the provider's persistent-disk mount, such as `/var/data`, so `data.db` survives deploys.
- The Google, Facebook, and Apple buttons currently use the local social-auth demo route. Real provider OAuth credentials and callback routes are still required for production identity verification.
