import { ConversationData } from "@/controller/API";
import { createClient, RealtimePostgresInsertPayload } from "@supabase/supabase-js";


const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseKey);

export const subscribeToRiskEvents = (callback: (payload: RealtimePostgresInsertPayload<ConversationData>) => void) => {
  const channel = supabase
    .channel('realtime:risky_events_log')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'risky_events_log' }, callback)
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
  return channel;
};

export default supabase;
