import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// Only initialize if keys are provided and valid
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
