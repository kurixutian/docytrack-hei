# DocuTrack HEI System Guide

This guide describes the current application in this repository. It is written for developers, demo operators, and staff who need to understand the workflow. The code and SQL migrations are the source of truth; older README claims may describe planned behavior.

## 1. System summary

DocuTrack HEI is a role-based web app for submitting academic document requests, routing them through university offices, and tracking their status. A student submits a request and receives a tracking number. Staff process the request through workflow steps. Each transition updates the document status and adds an entry to its history. A student can view progress from their account or use the public tracking page.

The app has two data modes:

| Mode | Data location | Intended use |
| --- | --- | --- |
| Local demo mode | Browser `localStorage` | Mockups, classroom demonstrations, and offline development |
| Supabase mode | Supabase Auth and PostgreSQL | Shared development or deployment |

Local mode is a mock adapter, not SQLite. Its data is isolated to one browser profile and is not protected like a production database.

## 2. Technology and request path

- **Web app:** Next.js 14 App Router, React, and TypeScript.
- **Authentication:** Supabase Auth in Supabase mode; a mock session in local mode.
- **Data access:** `src/lib/supabase/client.ts` chooses the local adapter or Supabase browser client. The local adapter implements a subset of the Supabase client methods used by the UI.
- **Database:** PostgreSQL schema, row-level security (RLS), and workflow functions in `supabase/migrations/`.
- **Shared UI and auth:** `src/components/DashboardLayout.tsx`, `src/components/DocumentDetailPage.tsx`, `src/components/AuthDialog.tsx`, and `src/context/AuthContext.tsx`.

Typical Supabase request path:

1. A page calls the shared browser client.
2. Next middleware checks whether a session exists and whether the user role may enter the route.
3. Supabase RLS checks which rows the signed-in user may read or change.
4. A workflow action calls the `transition_document` database function, which checks the actor, scope, workflow action, and remarks before updating status and history.

The middleware is a navigation gate. Database RLS and functions are the data authorization boundary in Supabase mode.

## 3. Roles and access scopes

| Role | Main routes | Scope and common work |
| --- | --- | --- |
| Student (`student`) | `/student/*`, `/notifications`, `/profile` | Submit requests, view their own requests, follow progress, and read their notifications. |
| Department Chair (`department_chair`) | `/department/*`, `/notifications`, `/profile` | Review documents routed to their department, take allowed workflow actions, and view department work. |
| College Dean (`college_dean`) | `/dean/*`, `/notifications`, `/profile` | Review and act on documents in their college. |
| University Registrar (`university_registrar`) | `/registrar/*`, `/notifications`, `/profile` | Review university-wide documents, release completed work, and access the archive. |
| System Administrator (`system_admin`) | `/admin/*`, `/profile` | Manage users, departments, document types, workflows, settings, and audit-log views. |

`src/middleware.ts` redirects unauthenticated visitors from protected routes to the public landing page and sends users with the wrong role to `/unauthorized`. The SQL RLS policies scope document access by student, department, or college, with broader access for registrar and system administrator roles. The workflow function also checks role and organization scope before accepting an action.

### Document types

Document types are managed by system administrators at `/admin/document-types`. A type has a name, description, default workflow, active flag, and creation timestamp. Administrators can add, edit, activate/deactivate, search, and delete types. The page prevents deletion when a type is already used by a document; deactivate it to preserve existing records. Students select an active type when submitting a request.

Seed and mock data include Adding of Subjects, Dropping of Subjects, Shifting Application, Completion of INC Grades, Removal of INC Grades, Graduation Clearance, and Overload Permit.

## 4. Document lifecycle

### Submission

1. Sign in as a student and open **New Request** (`/student/requests/new`).
2. Select an active document type and provide the requested student and department details.
3. The app finds the type's default workflow and first step, creates a tracking number and public lookup token, and inserts the document with status `submitted`.
4. The app records a submission log and notifies active department chairs assigned to that department.
5. Keep the tracking number shown after submission. The success screen links to the request list and tracking page.

### Staff processing

Staff open their inbox or document list, select a request, and use the actions allowed for its current workflow step. The database transition function advances to the next ordered step, updates current status and handler, writes a document log, and creates notifications. Workflow templates define ordered steps, assigned roles/departments, allowed actions, and optional expected durations.

The database supports these statuses:

`submitted` → `received` → `under_review` → `endorsed` / `forwarded` → `approved` → `released` → `archived`

Other outcomes include `returned`, `additional_info_requested`, and `rejected`. Actual transitions depend on the configured step actions; the sequence above is illustrative, not a promise that every document follows every status. Returns and rejections require internal remarks in the database function.

### Tracking and history

- Signed-in students can view their request list and request details.
- Any visitor can open `/track` and look up a request by tracking number.
- Public tracking exposes a limited set of document fields and public remarks. It does not expose student contact/profile fields or internal remarks through the tracking query.
- Staff and administrators use the authenticated views for their permitted scope. Admin audit logs provide filters for document actions and dates.

## 5. Main route map

| Route | Purpose |
| --- | --- |
| `/` | Public landing page and sign-in entry point |
| `/track` | Public request tracking by tracking number |
| `/login` | Sign-in page |
| `/student/dashboard` | Student summary |
| `/student/requests` | Student request list |
| `/student/requests/new` | Submit a new request |
| `/student/requests/[id]` | View a request and its history |
| `/department/inbox`, `/department/documents` | Department queue and documents |
| `/dean/inbox`, `/dean/documents` | College review queue and documents |
| `/registrar/inbox`, `/registrar/documents`, `/registrar/archive` | Registrar queue, records, and archive |
| `/admin/users`, `/admin/departments` | Account and department administration |
| `/admin/document-types`, `/admin/workflows` | Document type and workflow administration |
| `/admin/audit-logs`, `/admin/settings` | Audit log view and system settings |
| `/profile`, `/notifications` | Shared signed-in profile and notifications |
| `/unauthorized` | Wrong-role access page |

## 6. Data model

The initial schema is in `supabase/migrations/001_initial_schema.sql`; later migrations tighten public tracking and profile/action permissions.

| Table | Stores |
| --- | --- |
| `profiles` | User details, role, student information, department, and college. Each profile belongs to a Supabase Auth user. |
| `departments` | Department names, codes, colleges, and active state. |
| `document_types` | Request categories and their default workflow. |
| `workflow_templates` | Named workflow definitions and version/active state. |
| `workflow_steps` | Ordered steps, assigned role/department, available actions, and optional expected duration. |
| `documents` | Request identity, student-provided fields, tracking number, current status/step/handler, and timestamps. |
| `document_logs` | Action history, actor, status changes, routing departments, and internal/public remarks. |
| `notifications` | Per-user in-app messages and read state. |
| `document_assignments` | User and department assignments for documents. |
| `system_settings` | Administrator-managed settings. |

## 7. Running the local demo

### Prerequisites and start

1. Install Node.js and npm.
2. Install packages with `npm install`.
3. Create `.env.local` from `.env.example` and set:

   ```env
   NEXT_PUBLIC_LOCAL_MODE=true
   ```

   In local mode, Supabase credentials are not required. The app also falls back to local mode when the Supabase URL is missing or still contains `your-project`.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

### Demo accounts and user flow

The local mock data includes these demo accounts:

| Role | Email |
| --- | --- |
| Student | `student@demo.edu` |
| Department Chair | `chair@demo.edu` |
| College Dean | `dean@demo.edu` |
| Registrar | `registrar@demo.edu` |
| System Administrator | `admin@demo.edu` |

The sign-in dialog displays `demo123456` as the demo password. **Local mode currently matches the account by email and does not validate the password**, so this is mock authentication only. In Supabase mode, use the credentials created in Supabase Auth, such as those created by the seed script.

To demonstrate the complete flow, sign in as the student and submit a request; then switch among the department chair, dean, and registrar accounts to process it from their queues. Use the tracking number at `/track` to show its public timeline. Sign in as the administrator to inspect system setup pages.

### Reset local demo data

Local records are kept in the browser under `docytrack_local_db_v1`; the mock session uses `docytrack_local_session`. To reset the demo, clear this site's local storage and cookies in browser developer tools, then reload. Each browser profile has its own copy of the demo data.

## 8. Connecting Supabase

1. Create a Supabase project.
2. Set `.env.local` to use the project URL and public anon key, and turn local mode off:

   ```env
   NEXT_PUBLIC_LOCAL_MODE=false
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```

3. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never rename it with a `NEXT_PUBLIC_` prefix or expose it in browser code.
4. Link/configure the Supabase CLI for the project, then apply the checked-in migrations with `npm run db:push`.
5. Seed departments, document types, workflows, demo accounts, and sample requests with `npm run db:seed` after confirming the seed script points at the intended project.
6. Start the app with `npm run dev` and sign in using the Supabase Auth accounts.

Relevant package scripts include `npm run db:push`, `npm run db:reset`, `npm run db:seed`, `npm run type-check`, and `npm run lint`. `db:reset` is destructive to the linked local database; check the Supabase CLI target before running it.

### Migrations

- `001_initial_schema.sql` creates the schema, enums, RLS policies, tracking helpers, and document transition function.
- `002_public_tracking_access.sql` restricts anonymous tracking to selected document fields and grants access to the limited labels needed by the public tracking page.
- `003_lock_auth_scope.sql` limits workflow transitions to authenticated users and protects role, active state, and organization-scope profile fields from ordinary self-edits.

## 9. Current limitations and important distinctions

- Local mode is browser-only mock data; it is not SQLite, shared persistence, or secure authentication. Do not enter real student data in it.
- The local adapter implements only the Supabase methods needed by the demo and does not reproduce PostgreSQL RLS or all database constraints. A successful local demo does not prove production authorization.
- Public tracking requires a valid tracking number in the current page flow. Keep tracking numbers private; they act as lookup credentials for the public progress view.
- The current schema does not define document attachment storage. The local adapter's storage methods are placeholders, not durable file uploads.
- The `.env.example` file includes rate-limit and realtime/analytics variables, but the current application source does not implement those features. Do not treat those variables as active controls.
- The admin workflow page can list workflows, but its create/edit links point to routes that are not present in the current app tree, and its delete control has no handler. Workflow authoring is therefore incomplete in the UI.
- The sign-in dialog links to `/reset-password`, but there is no reset-password route in the current app tree. Password reset needs a configured Supabase redirect page before it can complete in this app.
- Demo credentials in `scripts/seed.ts` are for development only. Replace/remove them and provision real accounts safely before any shared deployment.

## 10. Where to look in the repository

- `src/app/` — route pages grouped by role.
- `src/components/DashboardLayout.tsx` — role navigation and dashboard shell.
- `src/components/DocumentDetailPage.tsx` — shared staff document review/detail screen.
- `src/context/AuthContext.tsx` — session and profile state.
- `src/middleware.ts` — route authentication and role redirects.
- `src/lib/supabase/client.ts` — chooses local or Supabase data client.
- `src/lib/supabase/localClient.ts` and `mockData.ts` — browser mock adapter and starter data.
- `src/lib/utils.ts` — tracking number and common display helpers.
- `scripts/seed.ts` — Supabase demo data setup.
- `supabase/migrations/` — database structure and access rules.
