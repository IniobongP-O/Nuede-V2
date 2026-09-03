import { createClient } from "@supabase/supabase-js";

import { handleInitializePaystackRequest } from "./handler.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
const storefrontUrl = Deno.env.get("NUEDE_STOREFRONT_URL");

if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey || !storefrontUrl) {
  throw new Error("The initialize-paystack function requires its backend environment variables.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

Deno.serve((request) => handleInitializePaystackRequest(request, {
  client: adminClient,
  secretKey: paystackSecretKey,
  storefrontUrl,
}));
