
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing env vars');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function checkUsers() {
      console.log('--- Checking Auth ---');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth Error:', authError?.message || 'No user');
        // If no user, maybe we can't fetch much, but let's try reading public profiles if allowed
        return;
      }
      console.log('Logged in as:', user.email, user.id);

      console.log('\n--- Checking Project Members ---');
      const { data: memberProjects, error: membersError } = await supabase
        .from('project_members')
        .select('*')
        .eq('user_id', user.id);

      if (membersError) console.error('Member Error:', membersError.message);
      else console.log('Member Projects:', memberProjects);

      console.log('\n--- Checking Created Projects ---');
      const { data: ownedProjects, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('created_by', user.id);

      if (projectError) console.error('Project Error:', projectError.message);
      else console.log('Owned Projects:', ownedProjects);

      console.log('\n--- Checking User Profiles (Direct) ---');
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(10);
      
      if (profilesError) console.error('Profiles Error:', profilesError.message);
      else console.log('All Profiles sample:', profiles);
    }

    checkUsers();
  
