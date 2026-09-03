import { createClient } from "@supabase/supabase-js";

import { handlePaystackWebhookRequest } from "./handler.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) throw new Error("The paystack-webhook function requires its backend environment variables.");

const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

Deno.serve((request) => handlePaystackWebhookRequest(request, { client: adminClient, secretKey: paystackSecretKey }));
