import { supabase } from '../lib/supabase';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleSupabaseResponse<T>(
  promise: PromiseLike<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await promise;

  if (error) {
    throw new ApiError(error.message, error.status);
  }

  if (data === null) {
    throw new ApiError('No data returned', 404);
  }

  return data;
}

export { supabase };

