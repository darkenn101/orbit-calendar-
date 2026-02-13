# Orbit - Task Management App

A modern task management application built with Vue 3, Firebase, and Tailwind CSS.

## Features

- **Authentication**: Secure login/signup using Firebase Auth
- **Task Dashboard**: Create, edit, delete, and manage tasks
- **Calendar Integration**: Visual calendar view with task mapping
- **Reminders**: Automatic notifications for upcoming tasks
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

### 4. Firestore Security Rules

Add these rules to your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app running!

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # Reusable Vue components
├── views/              # Page components
├── stores/             # Pinia store modules
├── types/              # TypeScript type definitions
├── firebase/           # Firebase configuration
├── router/             # Vue Router setup
├── assets/             # Static assets and styles
└── main.ts             # App entry point
```

## Key Components

- **LoginView**: Authentication interface
- **DashboardView**: Main task management interface
- **CalendarView**: Interactive calendar with task visualization
- **TaskModal**: Add/edit task form
- **TaskItem**: Individual task component with actions
- **NotificationBar**: Reminder notifications
- **AppNavigation**: Side navigation menu

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.