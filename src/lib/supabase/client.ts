import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';
import { createLocalClient } from './localClient';

export function createClient(headers?: Record<string, string>) {
  const isLocalMode =
    process.env.NEXT_PUBLIC_LOCAL_MODE === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project');

  if (isLocalMode) {
    return createLocalClient() as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    headers ? { global: { headers } } : undefined
  );
}

