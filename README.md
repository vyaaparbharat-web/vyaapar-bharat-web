# Vyapaar Bharat

B2B / B2C trade marketplace: buyers post requirements, suppliers send quotes, buyers compare and accept.

- **frontend/** – React 19 + Vite + Tailwind CSS v4
- **backend/** – Node.js + Express + **MongoDB (Mongoose)**

---

## 1. Run it locally

### Backend

```bash
cd backend
cp .env.example .env        # then fill MONGODB_URI and JWT_SECRET
npm install
npm run create-admin        # creates the super admin from SUPER_ADMIN_* in .env
npm run seed                # optional: buyer@test.com / Buyer@1234, supplier@test.com / Supplier@1234
npm run dev                 # http://localhost:5000
```

MongoDB can be local (`mongodb://127.0.0.1:27017/vyapaar_bharat`) or MongoDB Atlas (`mongodb+srv://...`).

### Frontend

```bash
cd frontend
cp .env.example .env        # optional: VITE_GOOGLE_CLIENT_ID
npm install
npm run dev                 # http://localhost:5173  (/api and /uploads are proxied to :5000)
```

## 2. Moving old PostgreSQL data to MongoDB (one time)

1. Put both `MONGODB_URI` and the `PG_*` values in `backend/.env`.
2. Run `npm run create-admin` first (old requirements without a buyer are given to the super admin).
3. Run `npm run migrate:pg`.

It copies users, suppliers, products, requirements, quotes and insights, re-links every relation to the new ids, keeps the old
id in `legacy_id`, and can be run again safely. Uploaded images in `backend/uploads` keep working as they are.
After that, `pg` is no longer needed.

## 3. Accounts and who can do what

| Account  | Can do |
|----------|--------|
| Guest    | Browse products, suppliers, requirements, insights. Send an enquiry to a supplier. |
| Buyer    | Post / edit / close / delete **their own** requirements. Only they see quotes on them, and only they can accept, negotiate or decline. Dashboard at `/buyer/dashboard`. |
| Supplier | Gets a company profile on sign-up. Sends one quote per requirement (can revise or withdraw), sees only their own quotes, manages their own products, profile and enquiries. Dashboard at `/supplier/dashboard`. |
| Admin    | Everything in `/admin`: requirements, quotes, companies, products, users (enable/disable, change role), enquiries, insights. Only a super admin can make someone an admin. |

Every requirement is saved with the logged-in user's id (`buyer_id`) on the server. The server never trusts names or ids
sent from the browser for ownership, and checks the user on every request, so a disabled account is logged out immediately.

## 4. Main API routes

| Method | Route | Who |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/google` | public |
| GET / PATCH | `/api/auth/me`, `/api/auth/profile`, `/api/auth/password` | logged in |
| GET | `/api/requirements`, `/api/requirements/:id` | public (buyer details hidden) |
| POST | `/api/requirements` | logged in |
| GET | `/api/requirements/mine` | logged in (own only) |
| PUT / PATCH `/status` / DELETE | `/api/requirements/:id` | owner or admin |
| GET | `/api/requirements/:id/quotes` | owner/admin: all; supplier: own |
| POST | `/api/quotes` | supplier (send or revise) |
| GET | `/api/quotes/mine` | supplier |
| PATCH | `/api/quotes/:id/status` | requirement owner or admin |
| DELETE | `/api/quotes/:id` | quote owner (withdraw) or admin |
| GET | `/api/suppliers`, `/api/products`, `/api/insights` (+ `/:id`) | public |
| POST / PUT / DELETE | `/api/products` | admin or supplier (own company only) |
| GET / PUT | `/api/supplier/profile`, GET `/api/supplier/products`, `/api/supplier/enquiries` | supplier |
| GET | `/api/dashboard/buyer`, `/api/dashboard/supplier` | logged in |
| * | `/api/admin/*`, insights and company create/edit/delete | admin |

Old URLs `/api/my-requirements` and `/api/my-quotes` still work.
