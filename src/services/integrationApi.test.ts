import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { integrationApi, PLATFORM_STEPS } from './integrationApi';
import { supabase } from '../lib/supabase';

describe('integrationApi.getSteps', () => {
  it('returns the managed-access Google Ads step', () => {
    const steps = integrationApi.getSteps('google_ads');
    expect(steps).toBe(PLATFORM_STEPS.google_ads);
    expect(steps).toHaveLength(1);
    expect(steps[0].type).toBe('input');
  });

  it('returns a single OAuth step for Meta Ads', () => {
    const steps = integrationApi.getSteps('meta_ads');
    expect(steps).toBe(PLATFORM_STEPS.meta_ads);
    expect(steps).toHaveLength(1);
    expect(steps[0].type).toBe('oauth');
  });

  it('returns a default account-id step for unknown platforms', () => {
    const steps = integrationApi.getSteps('unknown_platform');
    expect(steps).toHaveLength(1);
    expect(steps[0].inputKey).toBe('accountId');
  });
});

describe('integrationApi.validateConfig', () => {
  it('accepts a valid Google Ads customer ID', () => {
    expect(integrationApi.validateConfig('google_ads', { accountId: '123-456-7890' })).toBeNull();
  });

  it('rejects an invalid Google Ads customer ID', () => {
    expect(integrationApi.validateConfig('google_ads', { accountId: '1234567890' })).toContain('Google Ads Customer ID');
  });

  it('accepts a valid Meta ad account ID', () => {
    expect(integrationApi.validateConfig('meta_ads', { accountId: 'act_742016485571736' })).toBeNull();
  });

  it('rejects a missing TikTok advertiser ID', () => {
    expect(integrationApi.validateConfig('tiktok_ads', {})).toBe('Enter the account ID before continuing.');
  });
});

describe('integrationApi.testConnection', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.assign(import.meta.env, {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
    });

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { access_token: 'session-token' } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns approval_required when the connector says approval is still needed', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({
        result: 'approval_required',
        message: 'Approve our manager access request in Google Ads before we can sync.',
        externalAccountId: '123-456-7890',
      }), { status: 200 }),
    );

    const result = await integrationApi.testConnection('google_ads', { accountId: '123-456-7890' });

    expect(result.result).toBe('approval_required');
    expect(result.message).toContain('Approve our manager access request');
  });

  it('returns an error when the connector is not deployed', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await integrationApi.testConnection('google_ads', { accountId: '123-456-7890' });

    expect(result.result).toBe('error');
    expect(result.message).toContain('connect-google-ads');
  });

  it('returns connected when the backend verifies the account', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({
        result: 'connected',
        message: 'Google Ads is connected.',
        accountName: 'North America Search',
        externalAccountId: '123-456-7890',
        details: { syncStatus: 'syncing' },
      }), { status: 200 }),
    );

    const result = await integrationApi.testConnection('google_ads', { accountId: '123-456-7890' });

    expect(result.result).toBe('connected');
    expect(result.accountName).toBe('North America Search');
    expect(result.details?.syncStatus).toBe('syncing');
  });

  it('surfaces a specific error when the connector returns malformed HTTP 200 JSON', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({
        foo: 'bar',
      }), { status: 200 }),
    );

    const result = await integrationApi.testConnection('meta_ads', { accountId: '2278328539154000' });

    expect(result.result).toBe('error');
    expect(result.message).toContain('without the required result/message fields');
    expect(result.details).toEqual(expect.objectContaining({
      reason: 'invalid_response_shape',
      rawResponse: expect.stringContaining('"foo":"bar"'),
    }));
  });
});

describe('integrationApi Meta OAuth flow', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.assign(import.meta.env, {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
    });

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { access_token: 'session-token' } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts Meta OAuth with a server-generated authorization URL', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({
        authorizationUrl: 'https://www.facebook.com/v19.0/dialog/oauth?client_id=123',
      }), { status: 200 }),
    );

    const result = await integrationApi.startMetaOAuth();

    expect(result.authorizationUrl).toContain('facebook.com');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/start-meta-oauth',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('completes Meta OAuth and returns selectable accounts', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({
        result: 'pending_account_selection',
        sessionId: 'session-123',
        metaUserName: 'Test User',
        expiresAt: '2026-04-24T00:00:00.000Z',
        accounts: [
          { id: 'act_1', accountId: '1', name: 'Brand Account' },
        ],
        message: 'Choose the account you want to connect.',
      }), { status: 200 }),
    );

    const result = await integrationApi.completeMetaOAuth({ code: 'code-123', state: 'state-123' });

    expect(result.sessionId).toBe('session-123');
    expect(result.accounts[0].accountId).toBe('1');
  });

  it('finalizes Meta OAuth and returns a syncing result', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({
        result: 'syncing',
        message: 'Meta Ads connected. Your first sync has started.',
        accountName: 'Brand Account',
        externalAccountId: '1',
        details: { syncStatus: 'syncing' },
      }), { status: 200 }),
    );

    const result = await integrationApi.finalizeMetaOAuth({ sessionId: 'session-123', accountId: '1' });

    expect(result.result).toBe('syncing');
    expect(result.externalAccountId).toBe('1');
  });
});
