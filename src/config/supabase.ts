/**
 * src/config/supabase.ts
 *
 * Builds the REST client used by the evaluation module. Uses
 * @supabase/postgrest-js directly (not the full @supabase/supabase-js
 * client) - see the comment in SupabaseEvaluationRepository.ts for
 * why: the full client crashes on React Native at startup due to
 * its Realtime/WebSocket setup, which this module doesn't need.
 */

import { PostgrestClient } from '@supabase/postgrest-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const postgrest = new PostgrestClient(`${SUPABASE_URL}/rest/v1`, {
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  },
});
