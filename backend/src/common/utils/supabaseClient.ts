import { createClient } from '@supabase/supabase-js';
import { env } from './envConfig';

/**
 * Supabase client instance configured with project credentials
 * @see https://supabase.com/docs/reference/javascript/introduction
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});
