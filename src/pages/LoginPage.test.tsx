import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';

const { setActivePage, signInWithPassword } = vi.hoisted(() => ({
  setActivePage: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('../store/useDataStore', () => ({
  useDataStore: () => ({
    setActivePage,
  }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword,
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in with Supabase and routes to the dashboard on success', async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
      });
    });

    expect(setActivePage).toHaveBeenCalledWith('measure');
  });

  it('shows the Supabase error and does not route on failure', async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials');
    expect(setActivePage).not.toHaveBeenCalled();
  });
});
