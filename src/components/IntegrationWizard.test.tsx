import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationWizard } from './IntegrationWizard';

const mocks = vi.hoisted(() => ({
  addIntegration: vi.fn().mockResolvedValue(undefined),
  testConnection: vi.fn(),
  fetchSampleData: vi.fn().mockResolvedValue(null),
  startMetaOAuth: vi.fn(),
}));

vi.mock('../store/useDataStore', () => ({
  useDataStore: () => ({
    addIntegration: mocks.addIntegration,
  }),
}));

vi.mock('../services/integrationApi', async () => {
  const actual = await vi.importActual<typeof import('../services/integrationApi')>('../services/integrationApi');
  return {
    ...actual,
    integrationApi: {
      ...actual.integrationApi,
      testConnection: mocks.testConnection,
      fetchSampleData: mocks.fetchSampleData,
      startMetaOAuth: mocks.startMetaOAuth,
    },
  };
});

describe('IntegrationWizard', () => {
  beforeEach(() => {
    mocks.addIntegration.mockClear();
    mocks.testConnection.mockReset();
    mocks.fetchSampleData.mockClear();
    mocks.startMetaOAuth.mockReset();
  });

  it('starts the Meta OAuth redirect instead of simulating authentication', async () => {
    mocks.startMetaOAuth.mockResolvedValue({
      authorizationUrl: 'https://www.facebook.com/v19.0/dialog/oauth?client_id=123',
    });

    render(
      <IntegrationWizard
        platform={{ id: 'meta_ads', name: 'Meta Ads', icon: <div>M</div> }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Log in with Facebook/i }));

    await waitFor(() => {
      expect(mocks.startMetaOAuth).toHaveBeenCalledTimes(1);
    });
  });
});
