# Firebase setup

1. Create a Firebase project and register a Web app.
2. Enable Cloud Firestore.
3. Publish the contents of `firestore.rules` as the Firestore security rules.
4. Copy the Web app configuration object and paste it into the app’s Firebase setup screen.

For now, app login is local:

- `supervisor` or `supervisor@suncor.local` / `supervisor123`
- `tech` or `tech@suncor.local` / `tech123`

The selected role is saved in this browser with `localStorage`. Firestore still stores the maintenance data.

Important: because Firebase Authentication is temporarily removed from the login flow, Firestore cannot independently verify Supervisor vs Tech. The app enforces Tech read-only permissions in the interface. Re-enable Firebase Auth later before using this with untrusted users or public data.

On the first Supervisor login, the app seeds Firestore with the existing browser data if the cloud database is empty. After that, Firestore is the source of truth.

## Vercel deployment

Build output folder: `dist`

Firebase Hosting is not used right now. Deploy the app with Vercel instead.

See `VERCEL_DEPLOYMENT.md` for GitHub and drag-and-drop deployment steps.
