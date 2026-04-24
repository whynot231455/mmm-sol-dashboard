import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignUpPage } from './SignUpPage';

const { setActivePage, signUp } = vi.hoisted(() => ({
  setActivePage: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('../store/useDataStore', () => ({
  useDataStore: () => ({
    setActivePage,
  }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp,
    },
  },
}));

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an account and routes to the dashboard when Supabase returns a session', async () => {
    signUp.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      });
    });

    expect(setActivePage).toHaveBeenCalledWith('measure');
  });

  it('shows the confirmation message when email verification is required', async () => {
    signUp.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Check your email');
    expect(setActivePage).not.toHaveBeenCalled();
  });
});
