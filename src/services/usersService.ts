import { supabase } from "./api";

export async function getUsers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Actually, easier robust approach:
  // Step 1: Get all Project IDs I am part of.
  const { data: memberProjects } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id);
    
  const projectIds = memberProjects?.map(mp => mp.project_id) || [];
  
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('created_by', user.id);
    
  if (ownedProjects) {
    projectIds.push(...ownedProjects.map(p => p.id));
  }
  
  // Step 2: Get all User IDs related to these projects (Members + Owners)
  const userIds = new Set<string>();

  if (projectIds.length > 0) {
    // 2a. Get Members of these projects
    const { data: fellowMembers } = await supabase
      .from('project_members')
      .select('user_id')
      .in('project_id', projectIds);
      
    // 2b. Get Owners of these projects
    const { data: owners } = await supabase
          .from('projects')
          .select('created_by')
          .in('id', projectIds);

    fellowMembers?.forEach(m => userIds.add(m.user_id));
    owners?.forEach(p => { if(p.created_by) userIds.add(p.created_by) });
  }
  
  // ... (Project based logic stays)
  
  // Step 3: ALSO get users with the same email domain (Company/Team view)
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser?.email) {
      const emailDomain = currentUser.email.split('@')[1];
      // Exclude public domains from this automatic grouping - REMOVED restriction to align with new DB policies
       
      const { data: domainUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .ilike('email', `%@${emailDomain}`);
          
      domainUsers?.forEach(u => userIds.add(u.id));
  }

  // Remove myself - COMMENTED OUT to ensure we can resolve our own name in UI
  // userIds.delete(user.id);
  
  if (userIds.size === 0) {
    // Fallback: If no related users found, at least return myself so I can assign to myself
    // Or return all users if there are very few in the system (small team)
    // For now, let's just make sure we check RLS isn't blocking everything.
    // Let's add the current user explicitly to the set to be safe.
    userIds.add(user.id);
  }
  
  // Step 4: Fetch profiles
  const { data: usersData, error: usersError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', Array.from(userIds))
    .order('name', { ascending: true });

  if (usersError) {
    console.error('Error fetching users:', usersError.message);
    throw usersError;
  }

  return usersData;
}
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching users:', error.message);
    throw error;
  }

  return data;
}
