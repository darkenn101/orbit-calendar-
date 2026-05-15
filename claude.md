# Orbit — Claude Working Notes

A Vue 3 + Firebase task manager (tasks, projects, tags, calendar, reminders, notes). PWA-installable with offline-first Firestore.

## Working preferences

- Skip recaps and decision rationale unless I ask. Just diffs and a one-line status.
- Before any sweeping refactor, propose a scripted approach (sed/rg/codemod/ts-morph) first.
- Defer build/dev-server checks to the end of the slot.
- Keep responses under 8 lines unless detail is requested.
- Do not explain straightforward edits unless asked.
- Prefer surgical diffs over refactors.
- Avoid creating plans/TODO lists for simple tasks.
- Do not open unrelated files for "context" unless necessary.
- Preserve existing patterns instead of introducing abstractions.
- Read enough context to make a correct edit, but don't browse unrelated files. Don't re-read files after Edit.
- Don't quote back code I can see in the diff. Reference `file:line` only.
- Never rewrite a file with Write when Edit suffices.
- For known symbols/strings, use `grep` directly. Reserve the Explore agent for open-ended cross-file questions.
- Run typecheck at logical checkpoints, not after every edit. Save build/dev-server checks for the end of the slot.
- If you know the path, Read it. Don't `ls` parent directories to confirm structure first.
- Bundle clarifying questions into a single turn rather than asking serially.
- Don't echo conventions from this file back to me; assume I know them.

## Tech stack

- **Vue 3** (Composition API + `<script setup>`) with **TypeScript strict**
- **Vite 5** build, **vue-tsc** for type-checking the build
- **Pinia** for state, **Vue Router 4** for routing
- **Firebase 10** — Auth + Firestore (persistent local cache, multi-tab)
- **Tailwind CSS** with `darkMode: 'class'` and semantic CSS vars
- **Tiptap 3** for rich-text notes
- **date-fns** for date math, **chrono-node** for natural-language date parsing
- **@vueuse/core**, **vue-draggable-plus**, **@heroicons/vue**
- **PWA**: manifest + custom service worker (production only)

## Scripts (npm)

- `npm run dev` — Vite dev server (no SW registered)
- `npm run build` — `vue-tsc && vite build` (this is the typecheck + build)
- `npm run preview` — preview prod build (SW active)
- `firebase deploy --only firestore:rules,firestore:indexes` — push security rules + indexes

> Note: the project uses `npm`, not `pnpm`. Use `npm run build` for typecheck.

## Code conventions

- TypeScript strict mode throughout — no `any` unless absolutely necessary
- Composition API only — no Options API
- `<template>` block first, then `<script setup>`, then `<style>` in all Vue components
- Props defined with `defineProps<{}>()` using TypeScript generics
- Emits defined with `defineEmits<{}>()` using TypeScript generics
- One component per file
- Component files: PascalCase (`LoginForm.vue`)
- Composable files: camelCase with `use` prefix (`useAuth.ts`)
- Store files: camelCase (`auth.ts`)
- Import alias: `@/` → `src/` (configured in [vite.config.ts](vite.config.ts) and [tsconfig.json](tsconfig.json))
- `tsconfig` has `noUnusedLocals` and `noUnusedParameters` on — clean up imports as you go

## Project layout

```
src/
├── App.vue, main.ts, registerSW.ts
├── assets/styles/main.css      # Tailwind layers + CSS variable theme
├── components/                 # Reusable components (TaskModal, TagInput, ...)
│   └── tasks/                  # Tasks-view-specific: TaskCard, TaskRow, TaskDetailPane, BulkActionBar, TasksFilterBar, TasksViewSwitcher
├── composables/                # useTaskFilters, useTaskSelection, useTaskViewMode, useCommandPalette, useTheme
├── firebase/config.ts          # initializeApp + persistent Firestore cache
├── router/index.ts             # Auth guard via authStore.initAuth()
├── stores/                     # Pinia: auth, tasks, projects, reminders, notes
├── types/index.ts              # Task, Project, Reminder, Note, Subtask, RecurrenceRule, ProjectColor
├── utils/                      # projectColors, recurrence, taskGroups, taskSearch
└── views/                      # Dashboard, Tasks, Calendar, Reminders, Notes, Login
    └── tasks/                  # TasksListView, TasksKanbanView, TasksAgendaView, TasksProjectView
```

## Domain model

See [src/types/index.ts](src/types/index.ts) for the source of truth. Highlights:

- **Task** — `title`, `description`, `due_date` (Firestore `Timestamp`), `status: 'pending' | 'completed'`, optional `projectId`, `tags: string[]`, `subtasks: Subtask[]`, optional `recurrence: RecurrenceRule`, `recurrenceParentId` for materialized historical occurrences, `order` for manual reorder (sparse — null falls back to due_date sort).
- **Project** — `name`, `color: ProjectColor` (Tailwind palette name), scoped by `userId`. Deleting a project cascades to its tasks (see [stores/projects.ts](src/stores/projects.ts)).
- **Reminder** — `start_date`, `end_date`, `status: 'active' | 'completed' | 'dismissed'`.
- **Note** — Tiptap HTML in `content`, `isPinned` flag.
- All collections are user-scoped via `userId` and enforced by Firestore rules ([firestore.rules](firestore.rules)).

## Firestore notes

- Persistent local cache is enabled with `persistentMultipleTabManager` — reads work offline, writes queue and flush on reconnect.
- In dev, `experimentalForceLongPolling: true` is set (works around proxy / hot-reload connection issues).
- Composite indexes live in [firestore.indexes.json](firestore.indexes.json). Any new `where(...) + orderBy(...)` on different fields needs an index — add it and redeploy. Runtime errors include a one-click Console link.
- Security rules are simple `userId == auth.uid` ownership checks per collection.

## Routing & auth

- `router.beforeEach` calls `authStore.initAuth()` (resolves once with the first `onAuthStateChanged` event), then redirects:
  - `meta.requiresAuth` + no user → `/login`
  - `/login` while logged in → `/`
- `TasksView` is lazy-loaded; everything else is eager.

## Theming

- Tailwind `darkMode: 'class'`. Toggle via `useTheme()` ([composables/useTheme.ts](src/composables/useTheme.ts)) and the `ThemeToggle` component.
- Semantic tokens (`bg-surface`, `bg-elevated`, `text-ink`, `text-ink-muted`, `border-line`) are backed by CSS variables in [src/assets/styles/main.css](src/assets/styles/main.css). Prefer these over raw `bg-white`/`bg-gray-*` so dark mode follows automatically.
- Shared component classes already in the stylesheet: `.card`, `.input`, `.btn-secondary`.

## PWA / offline

- Service worker is registered **only in production** via [src/registerSW.ts](src/registerSW.ts) — never in `npm run dev`.
- Manifest + SW live in `public/`. To test offline behavior: `npm run build && npm run preview`, then DevTools → Application / Network → Offline.

## Environment

- Firebase config comes from `VITE_FIREBASE_*` env vars (see [.env.example](.env.example)). Defaults to a "demo" config so the app boots without secrets.
- Don't commit real keys; `.env.local` is gitignored.

## Gotchas

- `due_date`, `start_date`, `end_date`, `createdAt`, `updatedAt` are Firestore `Timestamp` objects, not JS `Date`. Call `.toDate()` before passing to date-fns.
- `Task.order` is sparse — sort fallback is `due_date`. Don't assume every task has a numeric `order`.
- Recurrence: historical occurrences get materialized as separate tasks with `recurrenceParentId` pointing at the series root. Modifying the series root should not retroactively touch materialized children.
- Tags are free-form `string[]` on the task — there's no `tags` collection.
- `noUnusedLocals` / `noUnusedParameters` are on, so even temporary unused imports break `vue-tsc`.

## Where to look

- New view? Add route in [src/router/index.ts](src/router/index.ts) and a view in [src/views/](src/views/).
- New Firestore collection? Add types in [src/types/index.ts](src/types/index.ts), a Pinia store in [src/stores/](src/stores/), rules in [firestore.rules](firestore.rules), and indexes in [firestore.indexes.json](firestore.indexes.json).
- New shared filter/selection logic for tasks? Extend the existing composables ([useTaskFilters.ts](src/composables/useTaskFilters.ts), [useTaskSelection.ts](src/composables/useTaskSelection.ts)) rather than duplicating in views.
- Project color swatches: [src/utils/projectColors.ts](src/utils/projectColors.ts).
