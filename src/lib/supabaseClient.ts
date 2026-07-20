import { createClient, SupabaseClient } from "@supabase/supabase-js";

// The anon key is safe to expose publicly by design — Supabase's Row Level
// Security policies (configured server-side in the project) are what
// actually protect data, not secrecy of this key.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const authConfigured = Boolean(supabase);
