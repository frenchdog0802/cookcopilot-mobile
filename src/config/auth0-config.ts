/**
 * Auth0 Configuration
 *
 * IMPORTANT: Replace these placeholder values with your actual Auth0 credentials.
 *
 * To get your Auth0 credentials:
 * 1. Go to https://auth0.com and sign in to your dashboard
 * 2. Create a new "Native" application
 * 3. Copy the Domain and Client ID from the application settings
 * 4. Configure Callback and Logout URLs (see implementation_plan.md for format)
 */

export const auth0Config = {
    // Your Auth0 tenant domain (e.g., 'your-tenant.auth0.com')
    domain: 'dev-r1tfs3j17m7ipwcs.us.auth0.com',

    // Your Auth0 application Client ID
    clientId: 'PNcDO8XoBQB9bDD6COD0vK9IqhywnbcF',
};

// Scopes to request during authentication
// 'openid profile email' is standard for getting user info
export const auth0Scopes = 'openid profile email offline_access';
