import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpdeuqkzwkjglxumcnhe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZGV1cWt6d2tqZ2x4dW1jbmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjQ0MjUsImV4cCI6MjA1NjAwMDQyNX0.CQpFSg-gqnPTAutjyZpaX0OJAESpuA-fJ_eAo0JuX2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 