# රාවණ භවණ

Sinhala-first public website, user portal, and admin dashboard for the free social service platform of S. Udara Sampath Rodrigo.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Configure Firebase

Copy `.env.example` to `.env` and add your Firebase web app values.

Detailed setup, admin creation, Firestore rules, seed data, and deployment notes are in:

- `docs/firebase-setup.md`
- `docs/seed-data.json`
- `firestore.rules`

## Routes

- `/` public website
- `/login` user login/signup
- `/dashboard` user dashboard
- `/admin/login` admin login
- `/admin/dashboard` admin dashboard

## Admin Login

Create a Firebase Authentication user:

- Email: `udarasampath@gmail.com`
- Password: `Mindul123`

Create a Firestore allowlist document:

- Collection: `admins`
- Document ID: `udarasampath@gmail.com`
- Fields: `email: "udarasampath@gmail.com"`, `role: "admin"`

The admin dashboard is available at `/admin/login`.

## Privacy note

Firestore does not support hiding a single field inside a readable document. To keep personal notes private from admins, this implementation stores user notes in `userPrivateNotes`, readable only by the owner. Admin analytics read `userVideoProgress` without private notes.
