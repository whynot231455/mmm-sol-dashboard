import { createManagedConnector } from '../_shared/managedConnector.ts';

Deno.serve(createManagedConnector({
  platformLabel: 'Twitter / X Ads',
  envPrefix: 'TWITTER_ADS',
  requiredEnv: ['TWITTER_ADS_API_KEY', 'TWITTER_ADS_API_SECRET', 'TWITTER_ADS_ACCESS_TOKEN', 'TWITTER_ADS_ACCESS_TOKEN_SECRET'],
  accountValidator: /^[A-Za-z0-9]{6,}$/,
  validationMessage: 'Use the account ID shown in X Ads Manager.',
  approvalMessage: 'Approve the X Ads access request, then retry the connection.',
}));
