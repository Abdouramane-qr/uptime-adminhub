# Fleet Rescue — Roadside Assistance Management Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase)](https://supabase.com)

SaaS platform for fleet management and roadside assistance operations. Premium admin interface enabling real-time coordination between fleet managers, service providers, and field technicians.

**🌐 Bilingual:** French / English with live language switching.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Authentication & Roles](#authentication--roles)
- [Internationalization (i18n)](#internationalization-i18n)
- [Pages & Routes](#pages--routes)
- [Intervention Workflow](#intervention-workflow)
- [Design System](#design-system)
- [Exports](#exports)
- [Documentation](#documentation)
- [Deployment](#deployment)

---

## ✨ Features

### 🚀 Operations
| Module | Description |
|---|---|
| **Dashboard** | Overview with KPIs, charts, and recent activity |
| **Dispatch Center** | Real-time intervention assignment — map + list view |
| **Interventions** | Full CRUD with 6-step workflow and detailed timeline |
| **Map** | Real-time geographic tracking (Leaflet / OpenStreetMap) |
| **Alerts** | Auto-detection: unassigned >10 min, provider late, stuck mission, offline technician |

### 👥 Management
| Module | Description |
|---|---|
| **Accounts** | CRUD with approval, rejection, suspension workflows |
| **Providers** | Catalog with ratings, multi-service, metrics |
| **Fleet Managers** | Manager tracking with fleet stats |
| **Technicians** | List with filters, search, detailed profiles, ratings, specialties |

### 📊 Analytics & Finance
| Module | Description |
|---|---|
| **Analytics** | KPIs + 6 Recharts visualizations |
| **Billing** | Invoices, payment status, provider revenue, commissions |
| **PDF/CSV Export** | Download reports (jsPDF + jspdf-autotable) |

### 🔐 Security & Administration
| Module | Description |
|---|---|
| **Authentication** | Email/password + Google OAuth via Supabase Auth |
| **RBAC** | Role-based access: Admin, Moderator, User with sidebar filtering and route guards |
| **Role Management** | Admin UI to assign/change user roles |
| **Audit Logs** | Complete action history with filtering |
| **i18n** | French/English with live toggle, localStorage persistence |
| **Dark Mode** | Light/dark toggle with system detection and persistence |
| **Profile** | Personal information and avatar management |

### 🏢 Service Provider Portal (SP)
- Dedicated dashboard, technician management, services, invoices, onboarding, settings

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Backend | Lovable Cloud (Supabase) |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | PostgreSQL with RLS policies |
| Styling | Tailwind CSS + semantic tokens (light & dark) |
| Components | shadcn/ui |
| Animations | framer-motion |
| Charts | Recharts |
| Maps | Leaflet / react-leaflet 4.2.1 |
| Export | jsPDF + jspdf-autotable |
| Routing | React Router v6 |
| Data Fetching | TanStack React Query |
| Dates | date-fns |
| Typography | Plus Jakarta Sans + JetBrains Mono |

---

## 🚀 Quick Start

```sh
# Clone the project
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

---

## 📁 Project Structure

```
src/
├── components/               # Reusable components
│   ├── map/                  # ProviderMarker, MissionPanel, MapLegend
│   ├── AlertsPanel.tsx       # Operational alerts (header)
│   ├── NotificationPanel.tsx # Notifications (header)
│   ├── AppHeader.tsx         # Header: search, theme, language, alerts
│   ├── AppLayout.tsx         # Admin layout (sidebar + header + outlet)
│   ├── AppSidebar.tsx        # Admin sidebar with role filtering
│   ├── RoleGuard.tsx         # Route-level role protection
│   ├── SpLayout.tsx          # SP portal layout
│   └── ui/                   # shadcn/ui components
├── hooks/
│   ├── useAuth.tsx           # Auth context (session, profile)
│   ├── useRole.tsx           # RBAC hook (roles, hasRole, isAdmin)
│   ├── useLanguage.tsx       # i18n context (FR/EN)
│   ├── useTheme.tsx          # Dark/light theme
│   └── use-mobile.tsx        # Responsive detection
├── lib/
│   ├── utils.ts              # Tailwind cn() utility
│   └── export.ts             # PDF/CSV export
├── pages/
│   ├── Login.tsx             # Auth page (login + signup + Google)
│   ├── Dashboard.tsx
│   ├── Dispatch.tsx
│   ├── AdminRoles.tsx        # Role management UI
│   └── sp/                   # SP portal pages
├── data/                     # Mock data
├── integrations/             # Supabase client & types
└── types/                    # TypeScript types
```

---

## 🔐 Authentication & Roles

### Authentication
- **Email/Password** sign up and sign in
- **Google OAuth** one-click sign-in
- Email verification (configurable auto-confirm)
- Password reset flow

### Role-Based Access Control (RBAC)
Roles are stored in a dedicated `user_roles` table with RLS policies.

| Role | Access |
|---|---|
| **Admin** | Full access: all pages, user management, audit logs |
| **Moderator** | Dispatch, billing, analytics, settings + general pages |
| **User** | Dashboard, providers, fleet managers, interventions, technicians, map, docs |

- **Sidebar filtering**: only shows links the user can access
- **Route guards**: `RoleGuard` component blocks unauthorized access with a friendly message
- **Role indicator**: badge in sidebar shows current role with icon

---

## 🌐 Internationalization (i18n)

Built-in bilingual support (French / English):

- **Language toggle** in the header (FR/EN button with globe icon)
- **Persistent** via localStorage
- **Covers**: sidebar labels, header, role names, auth pages, guards, common UI strings
- Easy to extend: add keys to `src/hooks/useLanguage.tsx`

---

## 🗺 Pages & Routes

### Admin Portal

| Route | Page | Roles |
|---|---|---|
| `/dashboard` | Dashboard | All |
| `/dispatch` | Dispatch | Admin, Moderator |
| `/accounts` | Accounts | Admin |
| `/providers` | Providers | All |
| `/fleet-managers` | Fleet Managers | All |
| `/interventions` | Interventions | All |
| `/technicians` | Technicians | All |
| `/map` | Map | All |
| `/billing` | Billing | Admin, Moderator |
| `/analytics` | Analytics | Admin, Moderator |
| `/audit-logs` | Audit Logs | Admin |
| `/admin-roles` | Role Management | Admin |
| `/documentation` | Technical Docs | All |
| `/user-guide` | User Guide | All |
| `/profile` | Profile | All |
| `/settings` | Settings | Admin, Moderator |

### Service Provider Portal

| Route | Page |
|---|---|
| `/sp/dashboard` | SpDashboard |
| `/sp/technicians` | SpTechnicians |
| `/sp/services` | SpServices |
| `/sp/invoices` | SpInvoices |
| `/sp/onboarding` | SpOnboarding |
| `/sp/settings` | SpSettings |

---

## 🔄 Intervention Workflow

```
Pending → Assigned → En Route → Arrived → In Progress → Completed
```

Each transition is tracked in:
- The intervention **timeline** (with timestamps)
- The **audit log** (with actor)
- **Alerts** (if delay exceeded)

---

## 🎨 Design System

### CSS Tokens (index.css)
- `--primary`: Main blue (actions, links)
- `--accent`: Secondary purple (gradients, accents)
- `--success`: Green (validations, completed missions)
- `--warning`: Orange (moderate alerts)
- `--info`: Light blue (information)
- `--destructive`: Red (errors, deletions)

### Utilities
- `.glass` — Glassmorphism (backdrop-blur)
- `.gradient-text` — Gradient primary → accent
- `.shadow-glow` — Diffuse shadow
- `.skeleton-shimmer` — Loading animation

### Typography
- **Plus Jakarta Sans** — Main font
- **JetBrains Mono** — IDs, code, technical data

---

## 📤 Exports

| Page | CSV | PDF | Content |
|---|---|---|---|
| Analytics | ✅ | ✅ | Daily mission data |
| Billing | ✅ | ✅ | Complete invoices table |

```typescript
import { exportCSV, exportPDF } from "@/lib/export";

exportCSV(data, "filename");
exportPDF("Title", ["Col1", "Col2"], rows, "filename");
```

---

## 📖 Documentation

Fleet Rescue includes two built-in documentation pages:

- **User Guide** (`/user-guide`) — Step-by-step tutorials, FAQ, illustrated guides
- **Technical Documentation** (`/documentation`) — Architecture, components, tokens, routes, conventions

---

## 🚀 Deployment

Open [Lovable](https://lovable.dev) → Share → Publish.

---

## 📄 License

Private project.

## Migration runtime flags

- `VITE_ALLOW_MOCK_FALLBACK` (default: `true`)
  - `true`: backend data when available, mock fallback if backend unavailable
  - `false`: strict backend mode, no mock seeding on migrated pages

### QA strict backend
Utiliser la checklist: `QA_STRICT_BACKEND_CHECKLIST.md`

### Strict backend commands
```bash
npm run qa:strict-backend
npm run build:strict-backend
npm run qa:strict-backend:full
```

### Sprint 2 backend contracts
See: `BACKEND_CONTRACTS_SPRINT2_BILLING_TECH_AUDIT.md`
