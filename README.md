# ZIPO backend

This is the backend your `index.html` is already wired to call at
`https://zipo-backend.onrender.com`. It gives you:

- `GET  /api/content` — public site content (tagline, plans, add-ons, social links, photo)
- `POST /api/admin/content` — admin-only, saves site content
- `GET  /api/admin/bookings` — admin-only, lists all bookings
- `POST /api/admin/bookings/complete` — admin-only, marks a booking done
- `POST /api/phonepe/initiate` — starts a PhonePe payment, returns a checkout URL
- `POST /api/phonepe/callback` — PhonePe calls this when a payment finishes
- `GET  /api/phonepe/status/:merchantTransactionId` — check a payment's status

**Real** admin protection lives here, not just in the browser: every admin
route verifies your Google sign-in token directly with Google and checks
the email against `ADMIN_EMAIL`, so nobody can fake admin access via
devtools.

---

## 1. Get the three services you need (all free to start)

### MongoDB Atlas (database)
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a free (M0) cluster.
3. Database Access → add a user with a password.
4. Network Access → allow access from anywhere (`0.0.0.0/0`) — simplest for Render.
5. Connect → "Drivers" → copy the connection string. That's your `MONGODB_URI`.

### Google Sign-In (admin auth)
1. https://console.cloud.google.com → create/select a project.
2. APIs & Services → Credentials → Create Credentials → OAuth Client ID → **Web application**.
3. Add your site's domain under "Authorized JavaScript origins" (e.g. `https://yourdomain.com`).
4. Copy the Client ID.
5. Put it in **both** places:
   - This backend's `.env` as `GOOGLE_CLIENT_ID`
   - `index.html`, replacing the placeholder Google Client ID mentioned near the top of the file

### PhonePe Payment Gateway
1. Register as a merchant at https://business.phonepe.com
2. Developer Settings → get your **Client ID**, **Client Secret**, **Client Version** (start in SANDBOX/UAT mode to test with fake payments).
3. Set your webhook/callback URL in the dashboard to:
   `https://<your-backend-domain>/api/phonepe/callback`
4. Configure a **username + password** for that webhook in the dashboard — put the same values in `PHONEPE_CALLBACK_USERNAME` / `PHONEPE_CALLBACK_PASSWORD`.

---

## 2. Configure

```bash
cp .env.example .env
# then fill in every value in .env
```

## 3. Run locally (optional, to test before deploying)

```bash
npm install
npm run dev
```

Visit `http://localhost:4000` — you should see `{"ok":true,"service":"zipo-backend"}`.

## 4. Deploy to Render (matches the URL your frontend already expects)

1. Push this folder to a GitHub repo.
2. https://render.com → New → Web Service → connect the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add every variable from `.env` under Render's **Environment** tab (don't upload `.env` itself).
6. Deploy. Render gives you a URL like `https://zipo-backend-xxxx.onrender.com`.
7. If it doesn't match `https://zipo-backend.onrender.com` exactly, update the four `*_ENDPOINT` constants near the bottom of `index.html` to match your real URL.

**Note:** Render's free tier spins down when idle and takes ~30–60s to
wake back up on the next request — the first "Save" or page load after a
quiet period may feel slow. That's normal on the free tier, not a bug.

## 5. Test end-to-end

1. Open your site, sign in with the `ADMIN_EMAIL` Google account.
2. Open "Edit Site", change the tagline, Save — it should now say "Saved — visible to everyone now."
3. Reload the page (or open in incognito) — the change should show for everyone, not just you.
4. Make a test booking using PhonePe's SANDBOX test credentials (PhonePe's docs give you test UPI IDs/cards for this).
5. Check "View bookings" as admin — the booking should appear, then move to "paid" once the sandbox payment completes.

## Notes on what's simplified

- The showcase photo is stored as base64 text directly in MongoDB. Fine for one photo; if you add many images later, move to S3/Cloudinary instead.
- Refunds aren't wired up. The PhonePe SDK supports them (`client.refund(...)`) if you need that later.
- There's no rate limiting or request logging middleware — fine for a small business site, worth adding if traffic grows.
