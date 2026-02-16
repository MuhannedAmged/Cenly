import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ufscfdsffpbjgnoonynv.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc2NmZHNmZnBiamdub29ueW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDQ5MDYsImV4cCI6MjA4NTUyMDkwNn0.XZMzwYr2mOlLUoneOxttycV9FBiYgAi8pjYjlr7rnuE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
