# Vercel deployment

This app is deployed as a static single-page app on Vercel.

- Database: Firebase Firestore
- Login: local app login only
- Firebase Auth: not used
- Build command: `npm run build`
- Build output folder: `dist`

## Before deploying

1. In Firebase Console, make sure Cloud Firestore is enabled.
2. In Firebase Console, open Firestore Database → Rules.
3. Paste the contents of `firestore.rules` and publish them.
4. In Firebase Project Settings → General, copy your Web app Firebase config values.

You can either add the Firebase config values to Vercel as Environment Variables, or paste the Firebase config into the app setup screen after deployment.

Recommended Vercel Environment Variables:

```txt
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## Option 1: Deploy with GitHub

First, create a new empty GitHub repository named `suncor-work-app`.

Then run these commands on your Mac:

```sh
cd "/Users/montyward77/Documents/Suncor work app"

git init -b main
git add .
git commit -m "Prepare maintenance app for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/suncor-work-app.git
git push -u origin main
```

Then in Vercel:

1. Go to `https://vercel.com/new`.
2. Choose Import Git Repository.
3. Pick the GitHub repo you just pushed.
4. Framework Preset: Other.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Add the Firebase environment variables listed above.
8. Click Deploy.

## Option 2: Deploy with drag-and-drop

Run these commands on your Mac:

```sh
cd "/Users/montyward77/Documents/Suncor work app"
npm run build
```

Then:

1. Open Vercel in your browser.
2. Go to the Vercel dashboard.
3. Choose Add New → Project.
4. Choose the drag-and-drop/static upload option.
5. Drag the `dist` folder onto Vercel.
6. Deploy.

If you use drag-and-drop and did not build with Firebase environment variables, open the deployed app and paste your Firebase Web app config into the setup screen.

## Local login after deployment

Supervisor:

- `supervisor` / `supervisor123`
- `supervisor@suncor.local` / `supervisor123`

Tech:

- `tech` / `tech123`
- `tech@suncor.local` / `tech123`

Supervisor can edit. Tech is read-only.
