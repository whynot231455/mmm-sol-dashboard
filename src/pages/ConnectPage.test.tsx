import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectPage } from './ConnectPage';

const mocks = vi.hoisted(() => ({
  fetchIntegrations: vi.fn(),
  startPollingIntegrations: vi.fn(),
  stopPollingIntegrations: vi.fn(),
  useDataStore: Object.assign(
    () => ({
      rawData: [{ Channel: 'Google Ads' }],
      mapping: { channel: 'Channel' },
      integrations: [],
      fetchIntegrations: mocks.fetchIntegrations,
    }),
    {
      getState: () => ({
        startPollingIntegrations: mocks.startPollingIntegrations,
        stopPollingIntegrations: mocks.stopPollingIntegrations,
      }),
    },
  ),
}));

vi.mock('../store/useDataStore', () => ({
  useDataStore: mocks.useDataStore,
}));

describe('ConnectPage', () => {
  beforeEach(() => {
    mocks.fetchIntegrations.mockClear();
  });

  it('shows csv-detected platforms as imported data, not connected integrations', () => {
    render(<ConnectPage />);

    expect(screen.getByText('Google Ads')).toBeInTheDocument();
    expect(screen.getByText('Detected in imported CSV')).toBeInTheDocument();
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  });
});
