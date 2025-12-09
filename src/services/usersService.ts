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
  
  if (projectIds.length === 0) return [];

  // Step 2: Get all User IDs related to these projects (Members + Owners)
  
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

  const userIds = new Set<string>();
  fellowMembers?.forEach(m => userIds.add(m.user_id));
  owners?.forEach(p => { if(p.created_by) userIds.add(p.created_by) });
  
  // Remove myself
  userIds.delete(user.id);
  
  if (userIds.size === 0) return [];
  
  // Step 3: Fetch profiles
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
