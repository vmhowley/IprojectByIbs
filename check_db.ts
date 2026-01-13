
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing env vars');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function checkColumn() {
      // Try to select the attachments column from a project
      const { data, error } = await supabase
        .from('projects')
        .select('attachments')
        .limit(1);

      if (error) {
        console.error('Error checking column:', error.message);
      } else {
        console.log('Column check result:', data);
        if (data && data.length > 0) {
            console.log('Row sample:', data[0]);
        }
      }
    }

    checkColumn();
  
