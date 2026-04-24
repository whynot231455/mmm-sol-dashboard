import { createManagedConnector } from "../_shared/managedConnector.ts";
import { syncMetaAdsData } from "../_shared/metaAdsSync.ts";

const metaConnector = createManagedConnector({
  platformLabel: "Meta Ads",
  envPrefix: "META_",
  requiredEnv: [],
  accountValidator: /^\d+$/,
  validationMessage: "Please enter a valid Meta Ad Account ID (numbers only).",
  approvalMessage: "Checking Meta Ads access...",
  onSync: async ({ supabase, accountId, userId, updateProgress }) => {
    try {
      console.log(`[Meta Ads] Starting sync for account ${accountId}, user ${userId}`);
      await syncMetaAdsData({
        supabase,
        accountId,
        userId,
        updateProgress,
      });

    } catch (err) {
      console.error(`[Meta Ads] Fatal Sync Error:`, err);
      throw err; // Re-throw to be caught by managedConnector's catch block
    }
  }
});

Deno.serve(async (req, context) => {
  return await metaConnector(req, context);
});
