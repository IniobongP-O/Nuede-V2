import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";

/** Loads the complete sales-analytics snapshot for an inclusive report range. */
export async function getSalesAnalytics({ from, to }) {
  if (!supabase) throw new Error(supabaseConfigurationError);
  const { data, error } = await supabase.rpc("get_admin_sales_analytics", {
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return data;
}
