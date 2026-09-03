import { createClient } from "@supabase/supabase-js";

import { handleCreateWhatsappOrderRequest } from "./handler.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const whatsappRecipient = Deno.env.get("NUEDE_WHATSAPP_NUMBER");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("The create-whatsapp-order function requires its backend Supabase environment variables.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve((request) => handleCreateWhatsappOrderRequest(request, {
  client: adminClient,
  recipient: whatsappRecipient,
}));
