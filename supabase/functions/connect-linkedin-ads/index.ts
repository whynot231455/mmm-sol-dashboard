import { createManagedConnector } from '../_shared/managedConnector.ts';

Deno.serve(createManagedConnector({
  platformLabel: 'LinkedIn Ads',
  envPrefix: 'LINKEDIN_ADS',
  requiredEnv: ['LINKEDIN_ADS_ACCESS_TOKEN'],
  accountValidator: /^\d{6,}$/,
  validationMessage: 'Use the numeric LinkedIn account ID from Campaign Manager.',
  approvalMessage: 'Approve the LinkedIn Campaign Manager access request, then retry the connection.',
}));
