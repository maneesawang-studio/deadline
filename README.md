# Deadline

Deadline is a static Thai task planner. `index.html` is the authenticated task dashboard, `login.html` handles sign-in and registration, and `about.html` describes the service. Firebase Authentication provides email/password accounts, and Cloud Firestore stores each user's tasks in a UID-scoped collection. The site can be hosted on GitHub Pages; Firebase remains the backend.

## Set up Firebase

1. Create a Firebase project and register a **Web app** in Firebase Console.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. Create a **Cloud Firestore** database.
4. Publish the rules in `firestore.rules` using the Firestore Rules tab or Firebase CLI. Do not deploy with open/test rules.
5. Copy the Web app's `apiKey`, `authDomain`, `projectId`, and `appId` into `firebase-config.js`.
6. In **Authentication → Settings → Authorized domains**, ensure your GitHub Pages domain is listed (for example, `username.github.io`).

Firebase Web app configuration is public client configuration. Never put a Firebase service-account key or Admin SDK credentials in this project. Firestore Security Rules—not hiding the web config—protect user data.

## Publish with GitHub Pages

Push the project files to a GitHub repository. In **Settings → Pages**, choose deployment from the `main` branch and `/ (root)`, then save. GitHub Pages serves `index.html` directly; unauthenticated visitors are sent to `login.html`. No build step is required. Use the published HTTPS URL to test account creation, sign-in, and task syncing on another device.

## Local preview

Run a local HTTP server from the project directory (for example, `python -m http.server 8000`) and open `http://localhost:8000`. ES modules and Firebase require HTTP(S); opening `index.html` as a `file://` URL is not supported.

## Current scope

The app supports email/password registration and sign-in, task create/edit/delete, completion, search, filtering, sorting, live sync for the signed-in user, and a light/dark theme that follows the system setting by default and saves manual choices across pages. Password reset, email verification, and account deletion are not implemented. Firebase billing, quotas, authorized domains, and production rules should be reviewed before launch.
