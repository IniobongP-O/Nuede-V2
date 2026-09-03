import { createClient } from "@supabase/supabase-js";

import { handleVerifyPaystackPaymentRequest } from "./handler.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
const whatsappRecipient = Deno.env.get("NUEDE_WHATSAPP_NUMBER");

if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) throw new Error("The verify-paystack-payment function requires its backend environment variables.");

const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

Deno.serve((request) => handleVerifyPaystackPaymentRequest(request, {
  client: adminClient,
  secretKey: paystackSecretKey,
  whatsappRecipient,
}));
