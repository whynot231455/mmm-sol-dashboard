import { render, screen } from '@testing-library/react';
import { GeoLiftPage } from './GeoLiftPage';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('../hooks/useGeoLiftData', () => ({
  useGeoLiftData: () => ({
    pastTests: [],
    regions: [],
    powerAnalysis: {},
    monitorData: [],
    regionPerformance: [],
    testConfig: {},
    liftResult: null,
    channelComparison: [],
    counterfactualData: []
  }),
}));

vi.mock('../store/useDataStore', () => ({
  useDataStore: () => ({
    setActivePage: vi.fn(),
  }),
}));

// Mock child components to avoid deep rendering issues in simple unit tests
vi.mock('../components/GeoLiftTestDesign', () => ({
  GeoLiftTestDesign: () => <div data-testid="test-design">Test Design</div>,
}));
vi.mock('../components/GeoLiftMonitor', () => ({
  GeoLiftMonitor: () => <div data-testid="monitor">Monitor</div>,
}));
vi.mock('../components/GeoLiftResults', () => ({
  GeoLiftResults: () => <div data-testid="results">Results</div>,
}));

describe('GeoLiftPage', () => {
  it('renders the page header', () => {
    render(<GeoLiftPage />);
    expect(screen.getByText('GeoLift Testing')).toBeInTheDocument();
  });

  it('renders the design tab by default', () => {
    render(<GeoLiftPage />);
    expect(screen.getByTestId('test-design')).toBeInTheDocument();
  });
});
