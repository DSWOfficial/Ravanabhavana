# රාවණ භවණ Firebase setup

1. Create a free Firebase project.
2. Enable Authentication, then enable Email/Password sign-in.
3. Create a Firestore database in production mode.
4. Copy `.env.example` to `.env` and fill the Firebase web app values.
5. Deploy `firestore.rules` in Firebase console or with `firebase deploy --only firestore:rules`.
6. Create the admin Auth user in Firebase Authentication:

Email: `udarasampath@gmail.com`

Password: `Mindul123`

7. Create the admin allowlist document manually:

Collection: `admins`

Document ID: `udarasampath@gmail.com`

```json
{
  "email": "udarasampath@gmail.com",
  "role": "admin",
  "createdAt": "server timestamp"
}
```

Admins cannot create themselves from the frontend.

## Deployment

Vercel:

1. Push this folder to GitHub.
2. Import in Vercel.
3. Add the `VITE_FIREBASE_*` environment variables.
4. Build command: `npm run build`
5. Output directory: `dist`

Firebase Hosting:

1. Install Firebase CLI.
2. Run `npm run build`.
3. Run `firebase deploy --only hosting,firestore:rules`.
