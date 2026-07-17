/**
 * API Auth Tests
 *
 * Tests authentication API endpoints (signin, signup, googleAuthLogin, auth0Login).
 */
import { auth } from '../../api/api-auth';
import { api } from '../../api/client';

// Mock the API client
jest.mock('../../api/client', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
}));

// Cast to jest mock for TypeScript
const mockedApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('auth API', () => {
    // ==========================================================================
    // signin() Tests
    // ==========================================================================
    describe('signin', () => {
        it('should POST to /auth/signin with credentials', async () => {
            mockedApi.post.mockResolvedValue({
                success: true,
                data: { user: { id: '1', name: 'Test', email: 'test@test.com' }, token: 'jwt' },
            });

            await auth.signin('test@test.com', 'password123');

            expect(mockedApi.post).toHaveBeenCalledWith('/auth/signin', {
                email: 'test@test.com',
                password: 'password123',
            });
        });

        it('should return success response', async () => {
            const mockResponse = {
                success: true,
                data: { user: { id: '1', name: 'Test', email: 'test@test.com' }, token: 'jwt' },
            };
            mockedApi.post.mockResolvedValue(mockResponse);

            const result = await auth.signin('test@test.com', 'password');

            expect(result.success).toBe(true);
            expect(result.data?.token).toBe('jwt');
        });
    });

    // ==========================================================================
    // signup() Tests
    // ==========================================================================
    describe('signup', () => {
        it('should POST to /auth/signup with user data and password', async () => {
            mockedApi.post.mockResolvedValue({
                success: true,
                data: { user: { id: '1', name: 'New', email: 'new@test.com' }, token: 'jwt' },
            });

            const userData = { id: '', name: 'New', email: 'new@test.com', first_name: 'New', last_name: 'User' };
            await auth.signup(userData, 'password123');

            expect(mockedApi.post).toHaveBeenCalledWith('/auth/signup', {
                ...userData,
                password: 'password123',
            });
        });
    });

    // ==========================================================================
    // googleAuthLogin() Tests
    // ==========================================================================
    describe('googleAuthLogin', () => {
        it('should POST to /auth/google with token', async () => {
            mockedApi.post.mockResolvedValue({ success: true, data: {} });

            await auth.googleAuthLogin('google-oauth-token');

            expect(mockedApi.post).toHaveBeenCalledWith('/auth/google', {
                token: 'google-oauth-token',
            });
        });
    });

    // ==========================================================================
    // auth0Login() Tests
    // ==========================================================================
    describe('auth0Login', () => {
        it('should POST to /auth/auth0 with tokens', async () => {
            mockedApi.post.mockResolvedValue({ success: true, data: {} });

            await auth.auth0Login('id-token', 'access-token');

            expect(mockedApi.post).toHaveBeenCalledWith('/auth/auth0', {
                idToken: 'id-token',
                accessToken: 'access-token',
            });
        });
    });
});
