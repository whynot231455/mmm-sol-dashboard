import { createManagedConnector } from '../_shared/managedConnector.ts';

Deno.serve(createManagedConnector({
  platformLabel: 'TikTok Ads',
  envPrefix: 'TIKTOK_ADS',
  requiredEnv: ['TIKTOK_ADS_ACCESS_TOKEN'],
  accountValidator: /^\d{8,}$/,
  validationMessage: 'Use the numeric TikTok Advertiser ID from TikTok Ads Manager.',
  approvalMessage: 'Approve the TikTok advertiser access request, then retry the connection.',
}));
