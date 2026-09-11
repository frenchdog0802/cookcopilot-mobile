import { api, setUnauthorizedHandler } from '../../api/client';
import { authHelper } from '../../api/auth-helper';

jest.mock('../../api/auth-helper', () => ({
    authHelper: {
        getJWT: jest.fn(async () => 'tok'),
        authenticate: jest.fn(),
        clearJWT: jest.fn(),
        isAuthenticated: jest.fn(),
    },
}));

describe('api client 401', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        setUnauthorizedHandler(null);
    });

    afterEach(() => {
        global.fetch = originalFetch;
        setUnauthorizedHandler(null);
    });

    it('invokes unauthorized handler on HTTP 401', async () => {
        const handler = jest.fn();
        setUnauthorizedHandler(handler);
        global.fetch = jest.fn(async () =>
            ({
                status: 401,
                text: async () => JSON.stringify({ success: false, message: 'Unauthorized' }),
            }) as Response,
        );

        const res = await api.get('recipes');
        expect(res.success).toBe(false);
        expect(handler).toHaveBeenCalled();
        expect(authHelper.getJWT).toHaveBeenCalled();
    });
});
