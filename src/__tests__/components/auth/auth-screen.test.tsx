import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthScreen } from '@/components/features/auth/auth-screen';

// Mock MSAL
vi.mock('@azure/msal-react', () => ({
  useIsAuthenticated: () => false,
  useMsal: () => ({
    instance: {
      loginPopup: vi.fn(),
      logoutPopup: vi.fn(),
    },
    accounts: []
  })
}));

describe('AuthScreen', () => {
  test('renders authentication screen', () => {
    render(<AuthScreen />);
    
    expect(screen.getByText(/Welcome to DigitChat/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('handles sign in click', async () => {
    const mockLoginPopup = vi.fn();
    vi.mocked(useMsal).mockReturnValue({
      instance: { loginPopup: mockLoginPopup },
      accounts: []
    });

    render(<AuthScreen />);
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockLoginPopup).toHaveBeenCalled();
    });
  });
});
