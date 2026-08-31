import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";

function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigurationError);
  }

  return supabase;
}

export async function signInWithPassword(credentials) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword(credentials);

  if (error) throw error;
  return data.user;
}

export async function signOutCurrentSession() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut({ scope: "local" });

  if (error) throw error;
}

export async function getCurrentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();

  if (error?.name === "AuthSessionMissingError") return null;
  if (error && [401, 403].includes(error.status)) {
    await client.auth.signOut({ scope: "local" });
    return null;
  }
  if (error) throw error;
  return data.user;
}

export async function getOwnAdminProfile(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("admin_users")
    .select("id,email,display_name,role,is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function subscribeToAuthChanges(callback) {
  const client = requireSupabase();
  const { data } = client.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}
