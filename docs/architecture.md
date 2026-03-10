# Frontend Architecture

## Overview

The frontend uses a **Controller/View pattern** inside a **feature-based folder structure**, enforced by **TypeScript interfaces**. These are three separate ideas that work together:

| Layer | What it is | What it does |
|---|---|---|
| **Feature-based folders** | Architecture pattern | Groups code by feature, not by file type |
| **Controller/View split** | Architecture pattern | Separates logic from rendering within each feature |
| **TypeScript interfaces** | Language feature | Enforces the contract between controller and view at compile time |

None of these are specific to React — the same pattern exists in Angular (components + services), Vue (composables + templates), and backend MVC frameworks. React and TypeScript are the tools this project uses to implement it.

---

## Folder Structure

```
src/
├── features/               # One folder per product feature
│   ├── home/
│   │   ├── Home.tsx            # Wiring: calls controller, renders view
│   │   ├── useHomeController.ts # Logic: state, data fetching, navigation
│   │   ├── HomeView.tsx         # Rendering: receives props, returns JSX
│   │   ├── home.types.ts        # Contracts: TypeScript interfaces
│   │   └── home.constants.ts
│   ├── projects/
│   │   ├── create/
│   │   ├── edit/
│   │   ├── delete/
│   │   └── shared/              # Logic shared across create + edit
│   └── auth/
│
└── shared/                 # Code used across multiple features
    ├── auth/               # AuthProvider, tokens, auth context
    ├── http/               # fetchClient (Axios wrapper + JWT retry)
    └── api/                # Route constants
```

The rule is: **if it belongs to one feature, it lives in that feature's folder**. If two features need it, it moves to `shared/`.

---

## The Controller/View Pattern

Each feature is split into three files with distinct responsibilities.

### 1. The Wiring Component (`Home.tsx`)

Intentionally thin. Calls the controller, passes results to the view. Contains no logic and no markup of its own.

```tsx
function Home(): JSX.Element {
    const props = useHomeController();
    return <HomeView {...props} />;
}
```

### 2. The Controller (`useHomeController.ts`)

A React custom hook. Owns everything that *thinks*:

- State (`useState`) — pagination, sort, filters, delete target
- Data fetching (`useQuery`) — talks to the API
- Navigation (`useNavigate`) — route changes
- Derived values — total pages, display ranges, error messages

The controller returns a grouped object. Each group becomes a prop on the view:

```ts
return {
    rows,
    pagination: { page, pageSize, total, onPageChange, ... },
    sort:        { key, dir, toggleSort },
    filters:     { searchTerm, statusFilter, onSearchChange, ... },
    state:       { loading, refreshing, apiError },
    actions:     { getData },
    navigation:  { onNavigateCreate, onNavigateEdit, deleteTarget, ... },
};
```

### 3. The View (`HomeView.tsx`)

A React component. Owns everything that *renders*:

- Receives the grouped props from the controller
- Returns JSX — tables, cards, buttons, modals
- Has no imports from `react-router-dom` for navigation (except `useLocation` for the success banner)
- Has no `useState` for business logic — only local UI state like the success message

This makes the view straightforward to read: every behaviour is just a prop call, and the source of truth for that behaviour is always in the controller.

---

## TypeScript Interfaces as Contracts

The interfaces in `home.types.ts` describe the shape of each prop group. They don't create anything — they tell TypeScript what to expect, and TypeScript enforces it at compile time.

```ts
// home.types.ts
export interface HomeNavigationProps {
    onNavigateCreate: () => void;
    onNavigateEdit:   (id: number) => void;
    deleteTarget:     { id: number; name: string } | null;
    onDeleteRequest:  (target: { id: number; name: string }) => void;
    onDeleteCancel:   () => void;
}

export interface HomeViewProps {
    rows:       ProjectRecord[];
    pagination: HomePaginationProps;
    sort:       HomeSortProps;
    filters:    HomeFiltersProps;
    state:      HomeStateProps;
    actions:    HomeActionsProps;
    navigation: HomeNavigationProps;
}
```

The practical benefit: if you add a property to `HomeNavigationProps` but forget to return it from `useHomeController`, TypeScript gives you a compile error before the code ever runs. The contract between controller and view is machine-checked, not just documented.

---

## Data Flow

```
useHomeController (logic)
        │
        │  returns grouped props
        ▼
   Home.tsx (wiring)
        │
        │  spreads props: <HomeView {...props} />
        ▼
  HomeView.tsx (rendering)
        │
        │  user clicks "Delete" → calls navigation.onDeleteRequest(target)
        ▼
  useHomeController updates deleteTarget state
        │
        │  React re-renders HomeView with new deleteTarget
        ▼
  DeleteModal appears
```

State always lives in the controller. The view only calls handlers — it never directly modifies state.

---

## Why This Separation Matters

**Testability.** `useHomeController` can be tested with `renderHook` — no DOM, no router, no rendered HTML needed. The view can be tested independently with mock props.

**Readability.** When debugging a logic bug, you look in the controller. When debugging a layout bug, you look in the view. You always know where to go.

**Stability.** The interfaces create a stable boundary. You can refactor the controller's internals (e.g. migrate from `useState` to `useReducer`) without touching the view, as long as the return shape stays the same.

---

## Shared Auth Infrastructure

Authentication is handled centrally in `src/shared/auth/` and is not part of any feature folder:

- **`AuthProvider.tsx`** — React context that provides `login`, `logout`, `user`, and session expiry handling to the whole app
- **`tokens.ts`** — manages access token (memory + sessionStorage) and refresh token (localStorage or HttpOnly cookie depending on `VITE_AUTH_MODE`)
- **`fetchClient.ts`** — Axios instance that automatically retries 401 responses with a token refresh before failing

Features consume auth via `useAuth()` and make HTTP calls via `FetchInstance`. Neither needs to know the details of how tokens are stored or refreshed.

---

## Adding a New Feature

1. Create `src/features/my-feature/`
2. Add `MyFeature.tsx` (wiring), `useMyFeatureController.ts` (logic), `MyFeatureView.tsx` (rendering), `my-feature.types.ts` (interfaces)
3. Define the prop interfaces in `my-feature.types.ts` first — this forces you to decide the controller/view boundary before writing any code
4. Implement the controller, then the view
5. Wire them in `MyFeature.tsx`
6. Add a route in the router

If logic needs to be shared with another feature, move it to `src/shared/` rather than importing across feature folders.
