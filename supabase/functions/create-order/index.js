import { createClient } from "@supabase/supabase-js";

import { handleCreateOrderRequest } from "./handler.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("The create-order function requires its backend Supabase environment variables.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve((request) => handleCreateOrderRequest(request, { client: adminClient }));
