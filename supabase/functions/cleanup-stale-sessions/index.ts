import { createClient } from "supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the threshold for stale sessions (e.g., 1 hour ago)
    const threshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    console.log(`[cleanup-stale-sessions] Deleting sessions created before ${threshold}...`);

    const { error, count } = await supabase
      .from("meta_oauth_sessions")
      .delete({ count: "exact" })
      .lt("created_at", threshold);

    if (error) throw error;

    console.log(`[cleanup-stale-sessions] Successfully deleted ${count} stale sessions.`);

    return new Response(JSON.stringify({
      success: true,
      deleted_count: count,
      message: `Deleted ${count} stale sessions created before ${threshold}.`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[cleanup-stale-sessions] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
