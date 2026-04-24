import { createManagedConnector } from '../_shared/managedConnector.ts';

Deno.serve(createManagedConnector({
  platformLabel: 'Google Ads',
  envPrefix: 'GOOGLE_ADS',
  requiredEnv: ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID'],
  accountValidator: /^\d{3}-\d{3}-\d{4}$/,
  validationMessage: 'Use the Google Ads Customer ID format XXX-XXX-XXXX.',
  approvalMessage: 'Approve our manager access request in Google Ads, then retry the connection.',
}));
