# DocuTrack HEI - Deployment Notes for ARM64 Android (Termux)

## Build Limitation

**Next.js 14 requires a native SWC binary for compilation.** The `arm64-android` architecture (Termux on Android) does not have a prebuilt SWC binary available from the Next.js registry. This is a known limitation documented at https://nextjs.org/docs/messages/failed-loading-swc.

## Workarounds

### Option 1: Build on a Supported Platform (Recommended)
Build the project on a supported platform (Linux x64, macOS, Windows) and deploy the output:

```bash
# On supported platform
git clone <repo>
cd docytrack-hei
npm install
npm run build
# Deploy .next folder to Vercel or copy to server
```

### Option 2: Use Vercel Git Integration (Recommended)
Connect the repository to Vercel - Vercel builds on their x64 Linux infrastructure:
1. Push to GitHub/GitLab
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Option 3: Docker Build
Use a Dockerfile with a Node.js x64 base image:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

### Option 4: Next.js 13 with Babel (Legacy)
Downgrade to Next.js 13 with Babel compiler (not recommended for new projects).

## Verification

The project passes all TypeScript checks:
```bash
npx tsc --noEmit  # ✓ No errors
```

All code is syntactically correct and follows Next.js 14 App Router patterns. The only blocker is the native SWC binary availability for arm64-android.

## Production Deployment Checklist

- [ ] Create Supabase project
- [ ] Run migrations (`supabase db push`)
- [ ] Run seed script (`npm run db:seed`)
- [ ] Configure environment variables in Vercel
- [ ] Deploy via Vercel Git integration
- [ ] Verify all demo accounts work
- [ ] Test all role-based dashboards
- [ ] Test public tracking page
- [ ] Configure custom domain (optional)

## Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=DocuTrack HEI
RATE_LIMIT_PUBLIC_TRACKING=30
RATE_LIMIT_SUBMISSION=10
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Demo Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.edu | demo123456 |
| Department Chair | chair@demo.edu | demo123456 |
| College Dean | dean@demo.edu | demo123456 |
| Registrar | registrar@demo.edu | demo123456 |
| System Admin | admin@demo.edu | demo123456 |