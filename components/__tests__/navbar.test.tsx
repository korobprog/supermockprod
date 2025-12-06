import { render, screen } from '@testing-library/react';
import Navbar from '@/components/navbar';
import { SessionProvider } from 'next-auth/react';

// Mock next-auth session
jest.mock('next-auth/react', () => ({
    useSession: () => ({ data: null }),
    signOut: jest.fn(),
}));

test('renders site title in navbar', () => {
    render(
        <SessionProvider>
            <Navbar />
        </SessionProvider>
    );
    const title = screen.getByText(/SuperMock/i);
    expect(title).toBeInTheDocument();
});
