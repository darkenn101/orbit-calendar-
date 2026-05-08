# Orbit - Task Management App

A modern task management application built with Vue 3, Firebase, and Tailwind CSS.

## Features

- **Authentication**: Secure login/signup using Firebase Auth
- **Task Dashboard**: Create, edit, delete, and manage tasks
- **Projects & Tags**: Group tasks into colored projects, attach free-form `#tags`, and filter the dashboard with one-click pills (deleting a project cascades to its tasks)
- **Calendar Integration**: Visual calendar view with task mapping
- **Reminders**: Automatic notifications for upcoming tasks
- **Notes**: Rich-text notes with Tiptap (pin, search, delete)
- **Offline-ready**: Firestore persistent local cache keeps reads working without a connection; mutations queue and sync on reconnect
- **Installable PWA**: Web app manifest + service worker make Orbit installable on desktop and mobile, with cached static shell
- **Dark-mode foundation**: Tailwind `class`-based dark mode with semantic CSS variables (toggle UI ships in a later phase)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Vue 3 (Composition API) with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Backend**: Firebase (Firestore + Auth)
- **Date Handling**: date-fns

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database and Authentication
3. Enable Email/Password authentication method
4. Copy your Firebase config

### 3. Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Fill in your Firebase configuration in `.env.local`:
```
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore Security Rules & Indexes

The repo ships rules and composite indexes for every collection (`tasks`, `reminders`, `notes`, `projects`) in [`firestore.rules`](./firestore.rules) and [`firestore.indexes.json`](./firestore.indexes.json). Each rule scopes reads/writes to the document's owning user.

Deploy them with the Firebase CLI:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

> **Note:** any time you add a new collection or a query that combines `where(...)` with `orderBy(...)` on a different field, Firestore will require a new composite index. Add it to `firestore.indexes.json` and redeploy. If a query fails at runtime with `The query requires an index`, the error includes a one-click link to auto-create the missing index in the Firebase Console.

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app running!

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## PWA & Offline

The service worker is registered **only in production builds** so it doesn't interfere with hot module reload during development.

To test the PWA shell:

```bash
npm run build
npm run preview
```

Then open Chrome DevTools → **Application** to inspect the manifest and service worker. To verify offline behaviour, toggle the **Offline** checkbox in DevTools → **Network** and reload — the cached shell loads, and Firestore reads continue from the local IndexedDB cache.

Mutations performed while offline queue locally and flush automatically once the connection returns.

> **Note:** the manifest currently references `orbit.svg` for all icons. iOS home-screen install looks best with raster PNG icons (192×192 and 512×512); add those to `public/` and reference them in `manifest.webmanifest` if you plan to ship to iOS users.

## Theming

Tailwind is configured with `darkMode: 'class'` and semantic colors (`bg-surface`, `bg-elevated`, `text-ink`, `text-ink-muted`, `border-line`) backed by CSS variables in `src/assets/styles/main.css`. The shared component classes (`.card`, `.input`, `.btn-secondary`) and the page background already adapt when `<html>` has the `dark` class. A user-facing dark-mode toggle is planned alongside the per-view `dark:` variant sweep.

## Project Structure

```
public/
├── manifest.webmanifest # PWA manifest
├── sw.js                # Service worker (cache-first static shell)
└── orbit.svg            # App icon

src/
├── components/          # Reusable Vue components
├── views/               # Page components
├── stores/              # Pinia store modules (tasks, reminders, notes, projects, auth)
├── types/               # TypeScript type definitions
├── firebase/            # Firebase configuration (Firestore w/ persistent cache)
├── router/              # Vue Router setup
├── utils/               # Pure helpers (e.g. projectColors)
├── assets/              # Static assets and styles (theme CSS variables)
├── registerSW.ts        # Production-only service worker registration
└── main.ts              # App entry point
```

## Key Components

- **LoginView**: Authentication interface
- **DashboardView**: Main task management interface, with project filter pills
- **CalendarView**: Interactive calendar with task visualization
- **NotesView**: Two-pane notes browser with Tiptap rich-text editor
- **RemindersView**: Dedicated reminders view (active / current / completed)
- **TaskModal**: Add/edit task form (project, tags, due date, status)
- **ReminderModal**: Add/edit reminder form
- **TaskItem**: Individual task row (project dot, tag chips, status toggle)
- **ProjectPicker**: Dropdown with inline "new project" form (name + color swatch)
- **TagInput**: Chip-style tag editor (Enter / comma to commit, Backspace to pop)
- **NoteEditor**: Tiptap-powered editor used by NotesView
- **NotificationBar**: Foreground reminder/task toasts
- **AppNavigation**: Side navigation menu

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.