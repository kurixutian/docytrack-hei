# DocuTrack HEI - Local Server Host & Local Saves Guide (Proposal Demo)

This setup allows you to run **DocuTrack HEI** completely offline / locally on Termux (or any machine) for proposals and stakeholder presentations **without needing an active Supabase cloud project or local Docker**, while **preserving all Supabase code and configurations** intact for future deployment.

---

## 🚀 Server Status & Access URLs

The local server host is currently running:

- **Local (on device):** [http://localhost:3000](http://localhost:3000)
- **Network (other devices on Wi-Fi):** `http://192.168.254.101:3000`

To start or restart the server at any time:
```bash
cd /data/data/com.termux/files/home/docytrack-hei
npm run dev
```

---

## 🔑 Demo Accounts (All Pre-loaded)

| Role | Email | Password | Dashboard URL |
|------|-------|----------|---------------|
| **Student** | `student@demo.edu` | `demo123456` | `/student/dashboard` |
| **Department Chair** | `chair@demo.edu` | `demo123456` | `/department/dashboard` |
| **College Dean** | `dean@demo.edu` | `demo123456` | `/dean/dashboard` |
| **University Registrar** | `registrar@demo.edu` | `demo123456` | `/registrar/dashboard` |
| **System Admin** | `admin@demo.edu` | `demo123456` | `/admin/dashboard` |

---

## 💾 How Local Saves Work

1. **Client-Side Persistence**:
   - All documents, logs, notifications, and profile data are saved directly to `localStorage` (`docytrack_local_db_v1`).
   - If empty on first visit, it automatically populates realistic academic data:
     - 5 Departments (CS, IT, IS, MATH, PHYS)
     - 7 Document Types (Adding of Subjects, Dropping, Shifting, INC Completion, Removal, Graduation Clearance, Overload Permit)
     - Pre-configured workflows with role-specific steps
     - 5 Sample documents with live tracking codes
2. **End-to-End Workflow Demonstration**:
   - Submit a new request as **Student** (`student@demo.edu`) → receives a tracking number.
   - Log in as **Department Chair** (`chair@demo.edu`) → view document in inbox, start review, endorse.
   - Log in as **Dean** (`dean@demo.edu`) → approve or forward to Registrar.
   - Log in as **Registrar** (`registrar@demo.edu`) → finalize and release or archive.
   - Check public tracking at `/track` → enter tracking code (e.g., `DOC-2026-00001` or newly generated code) to see live timeline progress!
3. **Resetting Demo Data**:
   - To reset all documents and logs back to initial proposal state, simply clear browser site data / localStorage in your browser settings or execute:
     `localStorage.removeItem('docytrack_local_db_v1')` in DevTools console.

---

## 🔄 Switching Between Local Saves & Real Supabase

**Supabase code was NOT deleted or removed.** It is controlled by an environment switch in `.env.local`:

### Local Mode (Current for Proposal):
```env
NEXT_PUBLIC_LOCAL_MODE=true
```

### Real Supabase Mode (When Ready to Deploy):
```env
NEXT_PUBLIC_LOCAL_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_actual_key>
SUPABASE_SERVICE_ROLE_KEY=<your_actual_service_role_key>
```
When `NEXT_PUBLIC_LOCAL_MODE` is `false`, the app connects directly to your live Supabase database and authentication.
