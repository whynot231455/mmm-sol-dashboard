import { SupabaseClient } from "supabase-js";

export const getMetaAccessToken = async (supabase: SupabaseClient, userId: string, accountId: string) => {
  const { data, error } = await supabase
    .from("user_integration_secrets")
    .select("access_token")
    .eq("user_id", userId)
    .eq("platform_id", "meta_ads")
    .eq("account_id", accountId.replace(/^act_/, ""))
    .single();

  if (error || !data) {
    return null;
  }
  return data.access_token;
};

export const syncMetaAdsData = async (params: {
  supabase: SupabaseClient;
  accountId: string;
  accessToken?: string;
  userId: string;
  updateProgress: (progress: number, message?: string) => Promise<void>;
}) => {
  const { supabase, accountId, userId, updateProgress } = params;
  let { accessToken } = params;

  if (!accessToken) {
    accessToken = await getMetaAccessToken(supabase, userId, accountId);
  }

  if (!accessToken) {
    throw new Error("Meta access token is missing. Please reconnect your account.");
  }

  await updateProgress(5, "Authenticating with Meta Graph API...");

  const accountRes = await fetch(`https://graph.facebook.com/v19.0/act_${accountId}?fields=name&access_token=${accessToken}`);
  const accountData = await accountRes.json();
  if (accountData.error) {
    throw new Error(`Meta API Error: ${accountData.error.message}`);
  }

  await updateProgress(15, `Connected to ${accountData.name}. Starting deep sync...`);

  const { data: integration, error: intError } = await supabase
    .from("user_integrations")
    .select("id")
    .eq("user_id", userId)
    .eq("account_id", accountId.replace(/^act_/, ""))
    .eq("platform_id", "meta_ads")
    .single();

  if (intError || !integration) {
    throw new Error("Integration record not found in database. Please reconnect.");
  }

  const batches = [
    { start: 90, end: 60 },
    { start: 60, end: 30 },
    { start: 30, end: 0 },
  ];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    await updateProgress(20 + (index * 25), `Fetching performance data (Batch ${index + 1}/3)...`);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - batch.start);
    const endDate = new Date();
    endDate.setDate(now.getDate() - batch.end);

    const timeRange = JSON.stringify({
      since: startDate.toISOString().split("T")[0],
      until: endDate.toISOString().split("T")[0],
    });

    let nextUrl: string | null = `https://graph.facebook.com/v19.0/act_${accountId}/insights?fields=campaign_name,spend,impressions,clicks,actions&level=campaign&time_increment=1&time_range=${encodeURIComponent(timeRange)}&limit=500&access_token=${accessToken}`;
    
    while (nextUrl) {
      const insightsRes = await fetch(nextUrl);
      const insightsData = await insightsRes.json();
      
      if (insightsData.error) {
        throw new Error(`Meta API Insights Error: ${insightsData.error.message}`);
      }

      const rows = insightsData.data || [];
      if (rows.length > 0) {
        const recordsToInsert = rows.map((row: { 
          actions?: { action_type: string; value: string | number }[]; 
          date_start: string; 
          campaign_name: string; 
          spend: string; 
          impressions: string; 
          clicks: string; 
        }) => {
          const conversions = row.actions?.find((action: { action_type: string; value: string | number }) => action.action_type === "purchase")?.value || 0;
          return {
            integration_id: integration.id,
            user_id: userId,
            platform: "meta_ads",
            account_id: accountId.replace(/^act_/, ""),
            date: row.date_start,
            campaign_name: row.campaign_name,
            spend: parseFloat(row.spend || "0"),
            impressions: parseInt(row.impressions || "0", 10),
            clicks: parseInt(row.clicks || "0", 10),
            conversions: parseInt(String(conversions), 10),
          };
        });

        const { error: insertError } = await supabase
          .from("ad_performance_data")
          .upsert(recordsToInsert, { onConflict: "integration_id,date,campaign_name" });

        if (insertError) {
          throw insertError;
        }
      }
      
      nextUrl = insightsData.paging?.next || null;
    }
  }

  await updateProgress(100, "Synchronization complete. Data is now live.");
};

