# DocuTrack HEI - Academic Document Tracking System

A comprehensive web-based academic document tracking and routing system designed for Philippine Higher Education Institutions (HEIs).

## 🎯 Overview

DocuTrack HEI digitizes the academic document processing workflow, eliminating long queues, lost documents, and unclear processing status. The system provides role-based access for students, department chairs, college deans, university registrars, and system administrators.

## ✨ Features

### For Students
- Submit academic requests online (Adding/Dropping subjects, Shifting, INC Completion, Graduation Clearance, Overload Permit)
- Track document progress with unique tracking numbers (no login required for public tracking)
- View processing history and remarks
- Receive notifications on status changes

### For Department Chairpersons
- Receive and review incoming documents
- Endorse or return documents with remarks
- Forward to College Dean
- View department-specific statistics

### For College Deans
- Review endorsed documents from departments
- Approve, reject, or return documents
- Forward approved documents to Registrar
- Monitor department processing statistics

### For University Registrar
- Final review and approval of documents
- Release documents to students
- Archive completed records
- University-wide document oversight

### For System Administrators
- User management and role assignment
- Department and document type configuration
- Workflow template management
- System-wide audit logs and analytics

## 🛠 Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js Server Actions, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Database**: PostgreSQL with UUIDs, foreign keys, indexes
- **Real-time**: Supabase Realtime for notifications
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Testing**: Playwright for E2E tests
- **Deployment**: Vercel + Supabase

## 📋 Supported Document Types

1. **Adding of Subjects** - Request to add subjects after enrollment period
2. **Dropping of Subjects** - Request to drop enrolled subjects
3. **Shifting Application** - Application to shift to a different program
4. **Completion of INC Grades** - Request for completion of incomplete grades
5. **Removal of INC Grades** - Request for removal of INC grades via examination
6. **Graduation Clearance** - Clearance processing for graduating students
7. **Overload Permit** - Permit to enroll in more than maximum allowed units

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd docytrack-hei
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run migrations: `npx supabase db push` (or apply SQL from `supabase/migrations/`)
   - Run seed script: `npm run db:seed`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000**

## 🔐 Demo Credentials

After running the seed script, these accounts will be available:

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.edu | demo123456 |
| Department Chair | chair@demo.edu | demo123456 |
| College Dean | dean@demo.edu | demo123456 |
| Registrar | registrar@demo.edu | demo123456 |
| System Admin | admin@demo.edu | demo123456 |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public pages (landing, tracking, login)
│   ├── student/           # Student dashboard & pages
│   ├── department/        # Department Chair pages
│   ├── dean/              # College Dean pages
│   ├── registrar/         # Registrar pages
│   ├── admin/             # Admin pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   └── DashboardLayout.tsx # Main layout with sidebar
├── context/
│   └── AuthContext.tsx    # Authentication context
├── lib/
│   ├── supabase/          # Supabase clients (client, server, service)
│   └── utils.ts           # Utility functions
├── types/
│   └── database.ts        # TypeScript types from Supabase
└── middleware.ts          # Auth & role-based route protection

supabase/
└── migrations/            # Database migrations
    └── 001_initial_schema.sql

scripts/
└── seed.ts                # Database seeding script
```

## 🗄 Database Schema

Key tables:
- **profiles** - Extended user profiles with roles
- **departments** - Academic departments
- **document_types** - Configurable document categories
- **workflow_templates** - Configurable workflow definitions
- **workflow_steps** - Individual workflow steps with roles/actions
- **documents** - Document records with tracking numbers
- **document_logs** - Immutable audit trail
- **notifications** - In-app notifications
- **document_assignments** - Document-to-user assignments
- **system_settings** - Configurable system settings

## 🔒 Security Features

- Row Level Security (RLS) on all sensitive tables
- Server-side authorization checks
- Role-based access control
- Department/college data isolation
- Secure password handling via Supabase Auth
- Rate limiting on public endpoints
- Audit log integrity protection

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run E2E tests
npm run test

# Run tests with UI
npm run test:ui
```

## 🚢 Deployment

### Vercel (Frontend)
1. Connect repository to Vercel
2. Add environment variables
3. Deploy

### Supabase (Backend)
1. Create production Supabase project
2. Run migrations
3. Configure auth providers
4. Set up Realtime if needed

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
RATE_LIMIT_PUBLIC_TRACKING=30
RATE_LIMIT_SUBMISSION=10
```

## 📚 Documentation

- [Database Architecture](./docs/database-architecture.md)
- [User Roles & Permissions](./docs/roles-permissions.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Philippine Higher Education Institutions
- Inspired by real academic document processing challenges
- Uses open-source libraries: Next.js, Supabase, Tailwind CSS, shadcn/ui

---

**DocuTrack HEI** - Streamlining academic document processing for Philippine HEIs.