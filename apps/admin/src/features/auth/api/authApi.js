import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";

/** Returns the configured Supabase client or fails with the setup error. */
function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigurationError);
  }

  return supabase;
}

/** Signs an administrator in with password credentials through Supabase Auth. */
export async function signInWithPassword(credentials) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword(credentials);

  if (error) throw error;
  return data.user;
}

/** Ends the current browser session and propagates sign-out failures. */
export async function signOutCurrentSession() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut({ scope: "local" });

  if (error) throw error;
}

/** Returns the authenticated user, or `null` when no session exists. */
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

/** Loads the signed-in user's own active admin profile through RLS. */
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

/** Subscribes to Auth session changes and returns the provider unsubscribe handle. */
export function subscribeToAuthChanges(callback) {
  const client = requireSupabase();
  const { data } = client.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}
