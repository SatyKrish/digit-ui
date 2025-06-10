export const mockMsalInstance = {
  loginPopup: jest.fn(),
  logoutPopup: jest.fn(),
  acquireTokenSilent: jest.fn(),
  handleRedirectPromise: jest.fn(),
  getActiveAccount: jest.fn(),
  getAllAccounts: jest.fn(),
  initialize: jest.fn()
};

export const mockAccount = {
  localAccountId: 'test-user-id',
  username: 'test@example.com',
  name: 'Test User',
  tenantId: 'test-tenant-id',
  idTokenClaims: {
    picture: 'https://example.com/avatar.jpg'
  }
};

export const mockAuthResult = {
  accessToken: 'mock-access-token',
  account: mockAccount,
  expiresOn: new Date(Date.now() + 3600000),
  scopes: ['User.Read'],
  uniqueId: 'test-unique-id'
};
